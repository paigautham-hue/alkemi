/**
 * Historical Data Ingestion — the competitive moat pipeline.
 *
 * Batch cards, lab notebooks and QC logs → LLM extraction → STAGED records →
 * human validation gate → committed as real formulation versions, trials and
 * measurements with full provenance metadata.
 *
 * The gate is non-negotiable: silently-wrong historical records would poison
 * calibration permanently, so nothing is auto-committed.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { onMeasurementRecorded } from "./feedbackLoop";

export async function startIngestionJob(params: {
  organizationId: string;
  userId: string;
  sourceType: "batch_card" | "lab_notebook" | "qc_log" | "trial_report" | "spreadsheet" | "other";
  sourceDescription?: string;
  rawText: string;
}): Promise<{ jobId: string; recordsExtracted: number; status: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const schema = await import("../../drizzle/schema");

  const jobId = crypto.randomUUID();
  await db.insert(schema.ingestionJobs).values({
    id: jobId,
    organizationId: params.organizationId,
    createdBy: params.userId,
    sourceType: params.sourceType,
    sourceDescription: params.sourceDescription ?? null,
    status: "extracting",
    rawText: params.rawText.slice(0, 60000),
  });

  try {
    const truncated = params.rawText.length > 40000 ? params.rawText.slice(0, 40000) : params.rawText;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You extract historical formulation and lab-test records from ${params.sourceType.replace("_", " ")} text. Extract ONLY what is explicitly written — never infer missing percentages or invent results. One record per distinct formulation/batch. Percentages should sum near 100 when the document gives a full recipe; if only partial information exists, extract what is there and lower the confidence. Record test conditions (temperature, substrate, cure/dry settings) verbatim when present.`,
        },
        { role: "user", content: `Extract all formulation/trial records:\n\n${truncated}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "historical_records",
          strict: true,
          schema: {
            type: "object",
            properties: {
              records: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "formulation/batch name or code" },
                    date: { type: ["string", "null"], description: "ISO date if stated" },
                    components: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          materialName: { type: "string" },
                          casNumber: { type: ["string", "null"] },
                          percentage: { type: "number" },
                        },
                        required: ["materialName", "casNumber", "percentage"],
                        additionalProperties: false,
                      },
                    },
                    measurements: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          propertyName: { type: "string" },
                          value: { type: "number" },
                          unit: { type: ["string", "null"] },
                          conditions: { type: ["string", "null"] },
                        },
                        required: ["propertyName", "value", "unit", "conditions"],
                        additionalProperties: false,
                      },
                    },
                    confidence: { type: "number", description: "0-1 extraction confidence" },
                  },
                  required: ["name", "date", "components", "measurements", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["records"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("empty extraction response");
    const parsed = JSON.parse(content);
    const records: any[] = parsed.records || [];

    for (const record of records) {
      const hasComponents = record.components?.length > 0;
      const hasMeasurements = record.measurements?.length > 0;
      if (!hasComponents && !hasMeasurements) continue;
      await db.insert(schema.extractedRecords).values({
        id: crypto.randomUUID(),
        jobId,
        organizationId: params.organizationId,
        recordType: hasComponents && hasMeasurements ? "formulation_with_results" : hasComponents ? "formulation" : "trial_results",
        payload: record,
        confidence: Math.max(0.1, Math.min(0.99, record.confidence ?? 0.6)).toFixed(2),
        status: "pending_review",
      });
    }

    await db
      .update(schema.ingestionJobs)
      .set({ status: records.length > 0 ? "pending_review" : "failed", error: records.length === 0 ? "no records extracted" : null })
      .where(eq(schema.ingestionJobs.id, jobId));

    return { jobId, recordsExtracted: records.length, status: records.length > 0 ? "pending_review" : "failed" };
  } catch (error) {
    await db
      .update(schema.ingestionJobs)
      .set({ status: "failed", error: String(error instanceof Error ? error.message : error) })
      .where(eq(schema.ingestionJobs.id, jobId));
    throw error;
  }
}

/**
 * Commit an APPROVED record: create/find the formulation family+version and
 * trial rows, matching components to the material library by CAS then name.
 * Unmatched components abort the commit (a formulation with missing
 * components would be silently wrong).
 */
export async function commitExtractedRecord(params: {
  recordId: string;
  organizationId: string;
  userId: string;
  domainId: string;
  testConditionSetId: string;
}): Promise<{ committed: boolean; refs?: Record<string, string>; problem?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const schema = await import("../../drizzle/schema");

  const [record] = await db
    .select()
    .from(schema.extractedRecords)
    .where(
      and(eq(schema.extractedRecords.id, params.recordId), eq(schema.extractedRecords.organizationId, params.organizationId))
    );
  if (!record) throw new Error("Record not found");
  if (record.status !== "approved") throw new Error(`Record must be approved first (status: ${record.status})`);

  const payload = record.payload as any;
  const refs: Record<string, string> = {};

  try {
    let versionId: string | null = null;

    if (payload.components?.length > 0) {
      // Match components to materials by CAS, then case-insensitive name
      const materials = await db
        .select()
        .from(schema.materials)
        .where(eq(schema.materials.organizationId, params.organizationId));
      const byCas = new Map(materials.filter(m => m.casNumber).map(m => [m.casNumber!.trim(), m]));
      const byName = new Map(materials.map(m => [m.name.toLowerCase().trim(), m]));

      const matched: Array<{ materialId: string; percentage: number }> = [];
      const unmatched: string[] = [];
      for (const c of payload.components) {
        const material =
          (c.casNumber && byCas.get(String(c.casNumber).trim())) ||
          byName.get(String(c.materialName).toLowerCase().trim());
        if (material) matched.push({ materialId: material.id, percentage: c.percentage });
        else unmatched.push(c.materialName);
      }
      if (unmatched.length > 0) {
        await db
          .update(schema.extractedRecords)
          .set({ status: "commit_failed", reviewNotes: `Unmatched materials: ${unmatched.join(", ")} — create them first, then re-approve` })
          .where(eq(schema.extractedRecords.id, params.recordId));
        return { committed: false, problem: `Unmatched materials: ${unmatched.join(", ")}` };
      }

      const familyId = crypto.randomUUID();
      const safeName = String(payload.name || "Historical").slice(0, 40);
      await db.insert(schema.formulationFamilies).values({
        id: familyId,
        organizationId: params.organizationId,
        domainId: params.domainId,
        code: `HIST-${safeName.replace(/[^A-Za-z0-9]/g, "").slice(0, 16)}-${familyId.slice(0, 4)}`,
        name: `Historical: ${safeName}`,
        description: `Ingested from ${record.recordType} (job ${record.jobId})`,
        metadata: { provenance: { ingestionJobId: record.jobId, extractedRecordId: record.id, validatedBy: params.userId } },
      });
      refs.familyId = familyId;

      versionId = crypto.randomUUID();
      await db.insert(schema.formulationVersions).values({
        id: versionId,
        organizationId: params.organizationId,
        familyId,
        versionNumber: "1.0",
        branchType: "revision",
        status: "archived", // historical — not an active development line
        createdBy: params.userId,
        notes: `Historical record${payload.date ? ` dated ${payload.date}` : ""}; extraction confidence ${record.confidence}`,
        metadata: { provenance: { ingestionJobId: record.jobId, extractedRecordId: record.id } },
      });
      refs.versionId = versionId;

      for (const m of matched) {
        await db.insert(schema.formulationComponents).values({
          id: crypto.randomUUID(),
          organizationId: params.organizationId,
          versionId,
          materialId: m.materialId,
          percentage: m.percentage.toFixed(4),
        });
      }
    }

    if (payload.measurements?.length > 0 && versionId) {
      const trialId = crypto.randomUUID();
      await db.insert(schema.trials).values({
        id: trialId,
        organizationId: params.organizationId,
        formulationVersionId: versionId,
        testConditionSetId: params.testConditionSetId,
        trialCode: `HIST-${trialId.slice(0, 8)}`,
        conductedBy: params.userId,
        conductedAt: payload.date ? new Date(payload.date) : new Date(),
        notes: `Historical measurement set (ingestion job ${record.jobId})`,
      });
      refs.trialId = trialId;

      for (const m of payload.measurements) {
        if (!Number.isFinite(m.value)) continue;
        const measurementId = crypto.randomUUID();
        await db.insert(schema.trialMeasurements).values({
          id: measurementId,
          trialId,
          propertyName: m.propertyName,
          measuredValue: m.value.toString(),
          unit: m.unit ?? null,
        });
        // Historical data feeds calibration too
        try {
          await onMeasurementRecorded({
            organizationId: params.organizationId,
            trialId,
            measurementId,
            propertyName: m.propertyName,
            measuredValue: m.value,
          });
        } catch {
          /* non-fatal */
        }
      }
    }

    await db
      .update(schema.extractedRecords)
      .set({ status: "committed", committedRefs: refs, reviewedBy: params.userId })
      .where(eq(schema.extractedRecords.id, params.recordId));

    return { committed: true, refs };
  } catch (error) {
    await db
      .update(schema.extractedRecords)
      .set({ status: "commit_failed", reviewNotes: String(error instanceof Error ? error.message : error) })
      .where(eq(schema.extractedRecords.id, params.recordId));
    throw error;
  }
}
