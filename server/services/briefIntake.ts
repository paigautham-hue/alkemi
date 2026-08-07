/**
 * Brief → Sample workflow (Primacy CDMO).
 *
 * A structured customer brief → claim translation → nearest platform
 * retrieval → drafted starting variant + compliance pre-check + test plan
 * from the domain pack's standard conditions.
 *
 * Target: compress the 45–60 day brief→sample cycle by producing a
 * lab-ready starting point and test plan in minutes. Everything drafted is
 * a hypothesis for the bench — never a final recipe.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { translatePerformanceClaims } from "../reverseEngineering";
import { findClosestFormulations } from "./benchmarkMatching";
import { loadPackForDomain } from "./domainPackService";
import { checkFormulationCompliance } from "../complianceEngine";

export interface BriefInput {
  organizationId: string;
  userId: string;
  domainId: string;
  category: string; // e.g. "sunscreen lotion SPF50", "deo body spray"
  claims: string[]; // marketing claims to hit
  benchmarkProduct?: string;
  costTargetPerKg?: number;
  regulatoryMarkets?: string[]; // e.g. ["EU", "US", "GCC"]
  additionalNotes?: string;
}

export interface BriefResult {
  briefSummary: string;
  translatedParameters: Array<{ claim: string; parameter: string; target: string; testMethod: string }>;
  nearestPlatforms: Array<{ versionId: string; familyName: string; versionNumber: string; distance: number }>;
  draftVersionId: string | null;
  complianceSummary: { status: string; violations: number; details: string[] } | null;
  testPlan: Array<{ conditionSet: string; properties: string[] }>;
  nextSteps: string[];
}

export async function processBrief(brief: BriefInput): Promise<BriefResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const pack = await loadPackForDomain(brief.domainId);

  // 1. Claim translation (reuses the RE translator, pack-aware context)
  const domainLabel = pack ? pack.name : brief.category;
  const translation = await translatePerformanceClaims(
    brief.category,
    "Customer brief",
    brief.claims,
    domainLabel,
    brief.additionalNotes ? { notes: brief.additionalNotes } : undefined
  );
  const testMethods = translation.testMethods || [];
  const translatedParameters = Object.entries(translation.technicalParameters || {}).map(
    ([parameter, spec], i) => ({
      claim: brief.claims[Math.min(i, brief.claims.length - 1)] ?? "",
      parameter,
      target: `${spec.value}${spec.unit ? " " + spec.unit : ""}`,
      testMethod: testMethods[i] ?? "",
    })
  );

  // 2. Nearest platforms by translated targets
  const targets: Record<string, { value: number }> = {};
  for (const [parameter, spec] of Object.entries(translation.technicalParameters || {})) {
    const value = parseFloat(String(spec.value));
    const key = parameter.toLowerCase();
    if (key && Number.isFinite(value)) targets[key] = { value };
  }
  const nearest = await findClosestFormulations(brief.organizationId, targets, 3);

  // 3. Draft a starting variant from the closest platform (clone + retarget)
  let draftVersionId: string | null = null;
  const schema = await import("../../drizzle/schema");
  if (nearest.length > 0) {
    const base = nearest[0];
    const [baseVersion] = await db
      .select()
      .from(schema.formulationVersions)
      .where(eq(schema.formulationVersions.id, base.versionId));
    if (baseVersion) {
      draftVersionId = crypto.randomUUID();
      await db.insert(schema.formulationVersions).values({
        id: draftVersionId,
        organizationId: brief.organizationId,
        familyId: baseVersion.familyId,
        versionNumber: `brief-${draftVersionId.slice(0, 6)}`,
        parentVersionId: baseVersion.id,
        branchType: "customer_specific",
        status: "draft",
        targetProperties: targets,
        notes: `Brief intake: ${brief.category}. Claims: ${brief.claims.join("; ")}${brief.benchmarkProduct ? `. Benchmark: ${brief.benchmarkProduct}` : ""}`,
        changeReason: "Brief→sample starting draft from nearest platform",
        createdBy: brief.userId,
        metadata: {
          variantAxis: { customer_brief: brief.category, markets: brief.regulatoryMarkets },
          costTargetPerKg: brief.costTargetPerKg,
        },
      });
      const components = await db
        .select()
        .from(schema.formulationComponents)
        .where(eq(schema.formulationComponents.versionId, baseVersion.id));
      for (const c of components) {
        await db.insert(schema.formulationComponents).values({
          id: crypto.randomUUID(),
          organizationId: brief.organizationId,
          versionId: draftVersionId,
          materialId: c.materialId,
          percentage: c.percentage,
          role: c.role,
          notes: c.notes,
        });
      }
    }
  }

  // 4. Compliance pre-check on the draft
  let complianceSummary: BriefResult["complianceSummary"] = null;
  if (draftVersionId) {
    try {
      const compliance = await checkFormulationCompliance(brief.organizationId, draftVersionId);
      complianceSummary = {
        status: compliance.overallStatus,
        violations: compliance.violations.length,
        details: compliance.violations.slice(0, 10).map(v => `[${v.severity}] ${v.message}`),
      };
    } catch (error) {
      complianceSummary = { status: "check_failed", violations: 0, details: [String(error)] };
    }
  }

  // 5. Test plan from pack standard conditions + translated properties
  const testPlan: BriefResult["testPlan"] = [];
  if (pack) {
    const properties = translatedParameters.map(t => t.parameter).filter(Boolean);
    for (const set of pack.standardTestConditionSets) {
      testPlan.push({ conditionSet: set.name, properties });
    }
  }

  const nextSteps = [
    draftVersionId
      ? "Review the drafted starting variant, adjust composition, then run predictions on the translated targets"
      : "No close platform found — create a starting formulation manually or via benchmark matching",
    "Confirm the claim translations with the customer before lab work",
    complianceSummary && complianceSummary.violations > 0
      ? `Resolve ${complianceSummary.violations} compliance flags before sampling`
      : "Compliance pre-check clean — proceed to bench",
    "Book panel/stability slots early (stability is the calendar-critical path)",
  ];

  return {
    briefSummary: `${brief.category} | claims: ${brief.claims.join("; ")}${brief.costTargetPerKg ? ` | cost ≤ ${brief.costTargetPerKg}/kg` : ""}${brief.regulatoryMarkets?.length ? ` | markets: ${brief.regulatoryMarkets.join(", ")}` : ""}`,
    translatedParameters,
    nearestPlatforms: nearest.map(n => ({
      versionId: n.versionId,
      familyName: n.familyName,
      versionNumber: n.versionNumber,
      distance: n.distance,
    })),
    draftVersionId,
    complianceSummary,
    testPlan,
    nextSteps,
  };
}
