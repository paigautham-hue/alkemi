/**
 * Extrapolation Detector — is this formulation inside the composition space
 * the org has actually trialed?
 *
 * Representation: sparse vector of {materialId: massFraction}. Distance:
 * 1 − cosine similarity to the nearest formulation version that has trial
 * measurements. Far from everything trialed → σ inflation + UI warning.
 *
 * This makes the UQ decomposition's "extrapolation" term real (it was
 * hardcoded `false` before Phase 4).
 */
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../db";

export interface ExtrapolationResult {
  isExtrapolation: boolean;
  severity: "none" | "moderate" | "severe";
  /** σ multiplier: 1 / 1.5 / 2 */
  sigmaInflation: number;
  nearestDistance: number | null; // 1 − cosine, 0 = identical
  trialedFormulationsCompared: number;
  note: string;
}

function cosineSparse(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  a.forEach((va, k) => {
    magA += va * va;
    const vb = b.get(k);
    if (vb !== undefined) dot += va * vb;
  });
  b.forEach(vb => {
    magB += vb * vb;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function detectExtrapolation(
  organizationId: string,
  formulationVersionId: string
): Promise<ExtrapolationResult> {
  const none: ExtrapolationResult = {
    isExtrapolation: true,
    severity: "severe",
    sigmaInflation: 2,
    nearestDistance: null,
    trialedFormulationsCompared: 0,
    note: "No trialed formulations exist yet — everything is extrapolation (cold start)",
  };

  const db = await getDb();
  if (!db) return none;
  const schema = await import("../../drizzle/schema");

  // Target composition
  const targetComponents = await db
    .select()
    .from(schema.formulationComponents)
    .where(eq(schema.formulationComponents.versionId, formulationVersionId));
  if (targetComponents.length === 0) return none;
  const target = new Map(targetComponents.map(c => [c.materialId, parseFloat(String(c.percentage))]));

  // Versions in this org that have at least one trial
  const trialedVersions = await db
    .selectDistinct({ versionId: schema.trials.formulationVersionId })
    .from(schema.trials)
    .where(eq(schema.trials.organizationId, organizationId));
  const versionIds = trialedVersions.map(v => v.versionId).filter(v => v !== formulationVersionId);
  if (versionIds.length === 0) return none;

  // Compositions of trialed versions (bounded)
  const limited = versionIds.slice(0, 300);
  const rows = await db
    .select()
    .from(schema.formulationComponents)
    .where(inArray(schema.formulationComponents.versionId, limited));

  const byVersion = new Map<string, Map<string, number>>();
  for (const row of rows) {
    if (!byVersion.has(row.versionId)) byVersion.set(row.versionId, new Map());
    byVersion.get(row.versionId)!.set(row.materialId, parseFloat(String(row.percentage)));
  }

  let best = 0;
  byVersion.forEach(composition => {
    const sim = cosineSparse(target, composition);
    if (sim > best) best = sim;
  });

  const distance = 1 - best;
  let severity: ExtrapolationResult["severity"];
  let sigmaInflation: number;
  if (distance <= 0.15) {
    severity = "none";
    sigmaInflation = 1;
  } else if (distance <= 0.4) {
    severity = "moderate";
    sigmaInflation = 1.5;
  } else {
    severity = "severe";
    sigmaInflation = 2;
  }

  return {
    isExtrapolation: severity !== "none",
    severity,
    sigmaInflation,
    nearestDistance: Math.round(distance * 1000) / 1000,
    trialedFormulationsCompared: byVersion.size,
    note:
      severity === "none"
        ? `Within trialed composition space (nearest distance ${distance.toFixed(2)} across ${byVersion.size} trialed formulations)`
        : `${severity === "severe" ? "Far outside" : "Outside"} trialed composition space (nearest distance ${distance.toFixed(2)} across ${byVersion.size} trialed formulations) — treat prediction as hypothesis`,
  };
}
