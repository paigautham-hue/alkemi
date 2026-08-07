/**
 * Benchmark Matching — closes the reverse-engineering loop.
 *
 * The RE service (reverseEngineering.ts) translates claims → parameters and
 * generates a TPP, but its output previously never touched the formulation
 * database. This service:
 *
 * 1. generateStartingFormulation: TPP + closest own formulations + available
 *    materials (org library incl. pack reference materials) → LLM-drafted
 *    starting composition, persisted as a real draft family/version with
 *    the TPP as targetProperties. The chemist iterates from there.
 * 2. benchmarkGap: per-property target vs measured (trials) vs predicted —
 *    the gap dashboard that the ROPAQUE-class benchmark chase never had.
 */
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { loadPackForDomain } from "./domainPackService";

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const parsed = parseFloat(String(v));
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Extract numeric target properties from a competitor product row */
export function extractTargets(product: any): Record<string, { value: number; unit?: string }> {
  const targets: Record<string, { value: number; unit?: string }> = {};

  const harvest = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, raw] of Object.entries(obj)) {
      if (raw && typeof raw === "object") {
        const value = num((raw as any).value ?? (raw as any).target);
        if (value !== undefined) {
          targets[key] = { value, unit: (raw as any).unit };
          continue;
        }
        harvest(raw);
      } else {
        const value = num(raw);
        if (value !== undefined) targets[key] = { value };
      }
    }
  };

  harvest(product.extractedParameters);
  harvest(product.observedProperties);
  return targets;
}

/**
 * Rank the org's formulation versions by closeness of their targetProperties
 * to the TPP targets (normalized relative distance on shared keys).
 */
export async function findClosestFormulations(
  organizationId: string,
  targets: Record<string, { value: number }>,
  maxResults = 3
): Promise<Array<{ versionId: string; familyName: string; versionNumber: string; sharedProperties: number; distance: number }>> {
  const db = await getDb();
  if (!db) return [];
  const schema = await import("../../drizzle/schema");

  const versions = await db
    .select({
      version: schema.formulationVersions,
      family: schema.formulationFamilies,
    })
    .from(schema.formulationVersions)
    .innerJoin(schema.formulationFamilies, eq(schema.formulationVersions.familyId, schema.formulationFamilies.id))
    .where(eq(schema.formulationVersions.organizationId, organizationId))
    .orderBy(desc(schema.formulationVersions.createdAt))
    .limit(500);

  const targetKeys = Object.keys(targets).map(k => k.toLowerCase());

  const scored = versions
    .map(({ version, family }) => {
      const props = (version.targetProperties || {}) as Record<string, any>;
      let shared = 0;
      let distance = 0;
      for (const [key, raw] of Object.entries(props)) {
        const idx = targetKeys.indexOf(key.toLowerCase());
        if (idx < 0) continue;
        const own = num((raw as any)?.value ?? raw);
        if (own === undefined) continue;
        const target = targets[Object.keys(targets)[idx]].value;
        if (target === 0) continue;
        shared++;
        distance += Math.min(2, Math.abs(own - target) / Math.abs(target));
      }
      return shared > 0
        ? {
            versionId: version.id,
            familyName: family.name,
            versionNumber: version.versionNumber,
            sharedProperties: shared,
            distance: distance / shared,
          }
        : null;
    })
    .filter(Boolean) as Array<{ versionId: string; familyName: string; versionNumber: string; sharedProperties: number; distance: number }>;

  scored.sort((a, b) => b.sharedProperties - a.sharedProperties || a.distance - b.distance);
  return scored.slice(0, maxResults);
}

export async function generateStartingFormulation(params: {
  competitorProductId: string;
  organizationId: string;
  userId: string;
}): Promise<{ familyId: string; versionId: string; matched: number; unmatched: string[]; rationale: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const schema = await import("../../drizzle/schema");

  const [product] = await db
    .select()
    .from(schema.competitorProducts)
    .where(
      and(
        eq(schema.competitorProducts.id, params.competitorProductId),
        eq(schema.competitorProducts.organizationId, params.organizationId)
      )
    );
  if (!product) throw new Error("Competitor product not found");

  const targets = extractTargets(product);
  const closest = await findClosestFormulations(params.organizationId, targets);

  // Available materials (with function + key physics data)
  const materials = await db
    .select()
    .from(schema.materials)
    .where(and(eq(schema.materials.organizationId, params.organizationId), eq(schema.materials.isActive, true)))
    .limit(300);

  const pack = product.domainId ? await loadPackForDomain(product.domainId) : null;

  const materialsList = materials
    .map(m => {
      const bits = [
        `- ${m.code}: ${m.name}`,
        m.materialFunction ? `function=${m.materialFunction}` : null,
        m.density ? `ρ=${m.density}` : null,
        m.viscosity ? `η=${m.viscosity}` : null,
        m.glassTransitionTemp ? `Tg=${m.glassTransitionTemp}` : null,
        m.functionality ? `f=${m.functionality}` : null,
        m.costPerKg ? `cost=${m.costPerKg}/kg` : null,
      ].filter(Boolean);
      return bits.join(", ");
    })
    .join("\n");

  const targetsList = Object.entries(targets)
    .map(([key, t]) => `- ${key}: ${t.value}${t.unit ? " " + t.unit : ""}`)
    .join("\n");

  const closestList = closest
    .map(c => `- ${c.familyName} v${c.versionNumber} (${c.sharedProperties} shared target properties, rel. distance ${c.distance.toFixed(2)})`)
    .join("\n");

  const systemPrompt = `${pack?.expertPrompts.domainExpert || "You are an expert formulator."}\n\nYou draft STARTING-POINT formulations for benchmark-matching projects. Use ONLY materials from the provided library (reference by exact code). Respect the domain's function roles and typical ranges. The output is a hypothesis for lab iteration, not a final recipe — state what will likely miss the targets and why.`;

  const userPrompt = `# Benchmark target: ${product.productName} (${product.manufacturer})

## Target properties (TPP)
${targetsList || "(no numeric targets extracted — use marketing claims)"}

## Marketing claims
${(product.marketingClaims || []).map((c: string) => `- ${c}`).join("\n") || "none"}

## Our closest existing formulations
${closestList || "none found"}

## Available material library
${materialsList}

Draft a starting formulation (components sum to exactly 100%).`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "starting_formulation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            components: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  materialCode: { type: "string" },
                  percentage: { type: "number" },
                  functionRole: { type: "string" },
                  rationale: { type: "string" },
                },
                required: ["materialCode", "percentage", "functionRole", "rationale"],
                additionalProperties: false,
              },
            },
            expectedGaps: { type: "string", description: "Which targets this draft will likely miss and why" },
            overallRationale: { type: "string" },
          },
          required: ["components", "expectedGaps", "overallRationale"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("LLM returned no formulation");
  const draft = JSON.parse(content);

  // Normalize to 100%
  const total = draft.components.reduce((s: number, c: any) => s + c.percentage, 0);
  if (total <= 0) throw new Error("Draft has zero total percentage");

  // Persist: family + version + components (matched by material code)
  const codeMap = new Map(materials.map(m => [m.code.toLowerCase(), m]));
  const familyId = crypto.randomUUID();
  const familyCode = `RE-${(product.productCode || product.productName).replace(/[^A-Za-z0-9]/g, "").slice(0, 20)}-${familyId.slice(0, 4)}`;

  await db.insert(schema.formulationFamilies).values({
    id: familyId,
    organizationId: params.organizationId,
    domainId: product.domainId || materials[0]?.domainId,
    code: familyCode,
    name: `RE: ${product.productName}`,
    description: `Benchmark-matching project vs ${product.manufacturer} ${product.productName}. ${draft.overallRationale}`,
    targetApplication: product.category || null,
    confidentialityLevel: "confidential",
    metadata: { competitorProductId: product.id, source: "benchmark_matching" },
  });

  const versionId = crypto.randomUUID();
  await db.insert(schema.formulationVersions).values({
    id: versionId,
    organizationId: params.organizationId,
    familyId,
    versionNumber: "0.1",
    branchType: "experimental",
    status: "draft",
    targetProperties: targets,
    notes: `LLM starting draft. Expected gaps: ${draft.expectedGaps}`,
    changeReason: "Benchmark matching — starting formulation",
    createdBy: params.userId,
  });

  let matched = 0;
  const unmatched: string[] = [];
  for (const c of draft.components) {
    const material = codeMap.get(String(c.materialCode).toLowerCase());
    if (!material) {
      unmatched.push(c.materialCode);
      continue;
    }
    await db.insert(schema.formulationComponents).values({
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      versionId,
      materialId: material.id,
      percentage: ((c.percentage / total) * 100).toFixed(4),
      role: c.functionRole?.slice(0, 64) || material.materialFunction || null,
      notes: c.rationale,
    });
    matched++;
  }

  return { familyId, versionId, matched, unmatched, rationale: draft.overallRationale };
}

export interface BenchmarkGapRow {
  property: string;
  target: number;
  targetUnit?: string;
  measured?: number;
  predicted?: number;
  gapPercent?: number; // measured (or predicted) vs target
  gapBasis: "measured" | "predicted" | "none";
  status: "met" | "close" | "gap" | "unknown";
}

export async function benchmarkGap(params: {
  competitorProductId: string;
  formulationVersionId: string;
  organizationId: string;
}): Promise<{ rows: BenchmarkGapRow[]; product: { name: string; manufacturer: string } }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const schema = await import("../../drizzle/schema");

  const [product] = await db
    .select()
    .from(schema.competitorProducts)
    .where(
      and(
        eq(schema.competitorProducts.id, params.competitorProductId),
        eq(schema.competitorProducts.organizationId, params.organizationId)
      )
    );
  if (!product) throw new Error("Competitor product not found");

  const targets = extractTargets(product);

  // Latest measured value per property (across the version's trials)
  const measurements = await db
    .select({
      propertyName: schema.trialMeasurements.propertyName,
      measuredValue: schema.trialMeasurements.measuredValue,
      createdAt: schema.trialMeasurements.createdAt,
    })
    .from(schema.trialMeasurements)
    .innerJoin(schema.trials, eq(schema.trialMeasurements.trialId, schema.trials.id))
    .where(
      and(
        eq(schema.trials.formulationVersionId, params.formulationVersionId),
        eq(schema.trials.organizationId, params.organizationId)
      )
    )
    .orderBy(desc(schema.trialMeasurements.createdAt));

  const latestMeasured = new Map<string, number>();
  for (const m of measurements) {
    const key = m.propertyName.toLowerCase();
    if (!latestMeasured.has(key)) {
      const value = num(m.measuredValue);
      if (value !== undefined) latestMeasured.set(key, value);
    }
  }

  // Latest prediction per property
  const preds = await db
    .select()
    .from(schema.predictions)
    .where(
      and(
        eq(schema.predictions.formulationVersionId, params.formulationVersionId),
        eq(schema.predictions.organizationId, params.organizationId)
      )
    )
    .orderBy(desc(schema.predictions.createdAt));

  const latestPredicted = new Map<string, number>();
  for (const p of preds) {
    const key = p.propertyName.toLowerCase();
    if (!latestPredicted.has(key)) {
      const value = num(p.predictedValue);
      if (value !== undefined) latestPredicted.set(key, value);
    }
  }

  const rows: BenchmarkGapRow[] = Object.entries(targets).map(([property, t]) => {
    const key = property.toLowerCase();
    const measured = latestMeasured.get(key);
    const predicted = latestPredicted.get(key);
    const basisValue = measured ?? predicted;
    const gapBasis: BenchmarkGapRow["gapBasis"] = measured !== undefined ? "measured" : predicted !== undefined ? "predicted" : "none";

    let gapPercent: number | undefined;
    let status: BenchmarkGapRow["status"] = "unknown";
    if (basisValue !== undefined && t.value !== 0) {
      gapPercent = ((basisValue - t.value) / Math.abs(t.value)) * 100;
      const absGap = Math.abs(gapPercent);
      status = absGap <= 5 ? "met" : absGap <= 15 ? "close" : "gap";
    }

    return {
      property,
      target: t.value,
      targetUnit: t.unit,
      measured,
      predicted,
      gapPercent: gapPercent !== undefined ? Math.round(gapPercent * 10) / 10 : undefined,
      gapBasis,
      status,
    };
  });

  // Worst gaps first, unknowns last
  rows.sort((a, b) => {
    if (a.status === "unknown" && b.status !== "unknown") return 1;
    if (b.status === "unknown" && a.status !== "unknown") return -1;
    return Math.abs(b.gapPercent ?? 0) - Math.abs(a.gapPercent ?? 0);
  });

  return { rows, product: { name: product.productName, manufacturer: product.manufacturer } };
}
