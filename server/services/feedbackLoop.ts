/**
 * Feedback Loop — what happens when a lab measurement lands.
 *
 * Before Phase 4 nothing happened: trial results were stored, charted, and
 * never used. Now, on every trial_measurements insert:
 *
 * 1. MATCH   — find predictions for the same (formulationVersion,
 *              testConditionSet, property)
 * 2. RECORD  — write prediction_residuals rows
 * 3. LEARN   — recompute calibration_stats quantiles for that
 *              (property, basis) → σ tightens with every trial
 * 4. REMEMBER— write a provenance-linked memory when the miss is large
 * 5. SUGGEST — when |residual| exceeds the current q95, propose next
 *              experiments via the DOE generator (active learning)
 *
 * Failure-isolated: a feedback error never blocks measurement recording.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { storeMemory } from "./agentMemorySystem";

const num = (v: unknown): number | undefined => {
  const parsed = parseFloat(String(v));
  return Number.isFinite(parsed) ? parsed : undefined;
};

function quantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return NaN;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sortedValues[base] + rest * (sortedValues[Math.min(base + 1, sortedValues.length - 1)] - sortedValues[base]);
}

export interface FeedbackOutcome {
  matchedPredictions: number;
  residualsWritten: number;
  statsRefreshed: string[];
  memoryWritten: boolean;
  doeSuggested: boolean;
}

export async function onMeasurementRecorded(params: {
  organizationId: string;
  trialId: string;
  measurementId: string;
  propertyName: string;
  measuredValue: number;
}): Promise<FeedbackOutcome> {
  const outcome: FeedbackOutcome = {
    matchedPredictions: 0,
    residualsWritten: 0,
    statsRefreshed: [],
    memoryWritten: false,
    doeSuggested: false,
  };

  const db = await getDb();
  if (!db) return outcome;
  const schema = await import("../../drizzle/schema");

  // Trial context
  const [trial] = await db.select().from(schema.trials).where(eq(schema.trials.id, params.trialId));
  if (!trial) return outcome;

  // 1. Match predictions on (version, conditionSet, property — case-insensitive)
  const candidates = await db
    .select()
    .from(schema.predictions)
    .where(
      and(
        eq(schema.predictions.organizationId, params.organizationId),
        eq(schema.predictions.formulationVersionId, trial.formulationVersionId),
        eq(schema.predictions.testConditionSetId, trial.testConditionSetId)
      )
    )
    .orderBy(desc(schema.predictions.createdAt));
  const matches = candidates.filter(
    p => p.propertyName.toLowerCase() === params.propertyName.toLowerCase()
  );
  outcome.matchedPredictions = matches.length;
  if (matches.length === 0) return outcome;

  if (params.measuredValue === 0) return outcome; // relative residual undefined

  // Domain for stats bucketing
  const [version] = await db
    .select({ familyId: schema.formulationVersions.familyId })
    .from(schema.formulationVersions)
    .where(eq(schema.formulationVersions.id, trial.formulationVersionId));
  let domainId: string | null = null;
  if (version) {
    const [family] = await db
      .select({ domainId: schema.formulationFamilies.domainId })
      .from(schema.formulationFamilies)
      .where(eq(schema.formulationFamilies.id, version.familyId));
    domainId = family?.domainId ?? null;
  }

  // 2. Residuals (latest prediction is the primary; keep all matches for evidence)
  const basesTouched = new Set<string>();
  let worstResidual = 0;
  let primaryPrediction: any = null;
  for (const prediction of matches) {
    const predicted = num(prediction.predictedValue);
    if (predicted === undefined) continue;
    const rel = (predicted - params.measuredValue) / Math.abs(params.measuredValue);
    try {
      await db.insert(schema.predictionResiduals).values({
        id: crypto.randomUUID(),
        organizationId: params.organizationId,
        domainId,
        propertyName: params.propertyName.toLowerCase(),
        predictionId: prediction.id,
        trialMeasurementId: params.measurementId,
        formulationVersionId: trial.formulationVersionId,
        predictedValue: predicted.toString(),
        measuredValue: params.measuredValue.toString(),
        relResidual: rel.toFixed(6),
        predictionBasis: (prediction as any).predictionBasis ?? null,
      });
      outcome.residualsWritten++;
      basesTouched.add((prediction as any).predictionBasis ?? "unknown");
      if (Math.abs(rel) > Math.abs(worstResidual)) {
        worstResidual = rel;
        primaryPrediction = prediction;
      }
    } catch {
      // duplicate pair (unique index) — already recorded
    }
  }
  if (outcome.residualsWritten === 0) return outcome;

  // 3. Refresh calibration stats per touched basis
  for (const basis of Array.from(basesTouched)) {
    const residualRows = await db
      .select({ relResidual: schema.predictionResiduals.relResidual })
      .from(schema.predictionResiduals)
      .where(
        and(
          eq(schema.predictionResiduals.organizationId, params.organizationId),
          eq(schema.predictionResiduals.propertyName, params.propertyName.toLowerCase()),
          basis === "unknown"
            ? sql`prediction_basis IS NULL`
            : eq(schema.predictionResiduals.predictionBasis, basis)
        )
      );
    const rels = residualRows.map(r => parseFloat(String(r.relResidual))).filter(Number.isFinite);
    if (rels.length === 0) continue;
    const absSorted = rels.map(Math.abs).sort((a, b) => a - b);
    const signedSorted = [...rels].sort((a, b) => a - b);

    const statsValues = {
      n: rels.length,
      medianAbsRel: quantile(absSorted, 0.5).toFixed(6),
      q80AbsRel: quantile(absSorted, 0.8).toFixed(6),
      q95AbsRel: quantile(absSorted, 0.95).toFixed(6),
      bias: quantile(signedSorted, 0.5).toFixed(6),
    };

    const [existing] = await db
      .select()
      .from(schema.calibrationStats)
      .where(
        and(
          eq(schema.calibrationStats.organizationId, params.organizationId),
          eq(schema.calibrationStats.propertyName, params.propertyName.toLowerCase()),
          basis === "unknown"
            ? sql`prediction_basis IS NULL`
            : eq(schema.calibrationStats.predictionBasis, basis)
        )
      );
    if (existing) {
      await db.update(schema.calibrationStats).set(statsValues).where(eq(schema.calibrationStats.id, existing.id));
    } else {
      await db.insert(schema.calibrationStats).values({
        id: crypto.randomUUID(),
        organizationId: params.organizationId,
        propertyName: params.propertyName.toLowerCase(),
        domainId,
        predictionBasis: basis === "unknown" ? null : basis,
        ...statsValues,
      });
    }
    outcome.statsRefreshed.push(`${params.propertyName}/${basis} (n=${rels.length})`);
  }

  // 4. Memory on large misses (>20%), with real provenance citations
  if (Math.abs(worstResidual) > 0.2 && primaryPrediction) {
    try {
      await storeMemory({
        organizationId: params.organizationId,
        category: "trial_learning",
        fact: `${params.propertyName} measured ${params.measuredValue} vs predicted ${primaryPrediction.predictedValue} (${(worstResidual * 100).toFixed(1)}% off, basis: ${(primaryPrediction as any).predictionBasis ?? "unknown"}) for formulation version ${trial.formulationVersionId}`,
        rationale: (primaryPrediction as any).provenance ?? undefined,
        citations: [
          { type: "trial", id: params.trialId, title: `Trial ${trial.trialCode}` },
          { type: "formulation", id: trial.formulationVersionId, title: "Formulation version" },
        ],
        tags: [params.propertyName.toLowerCase(), "prediction_miss"],
        confidence: 0.9,
      });
      outcome.memoryWritten = true;
    } catch (error) {
      console.warn("[FeedbackLoop] memory write failed:", error);
    }
  }

  // 5. Active learning: if this miss exceeds the current q95, note a DOE suggestion
  try {
    const [stats] = await db
      .select()
      .from(schema.calibrationStats)
      .where(
        and(
          eq(schema.calibrationStats.organizationId, params.organizationId),
          eq(schema.calibrationStats.propertyName, params.propertyName.toLowerCase())
        )
      );
    const q95 = stats?.q95AbsRel ? parseFloat(String(stats.q95AbsRel)) : null;
    if (q95 !== null && Math.abs(worstResidual) > q95 && stats!.n >= 8) {
      outcome.doeSuggested = true; // surfaced by the suggestions endpoint below
    }
  } catch {
    /* non-fatal */
  }

  return outcome;
}

/**
 * Active-learning suggestions for a formulation version: when its residuals
 * are outliers, propose bracketing experiments via the DOE generator.
 */
export async function suggestNextExperiments(
  organizationId: string,
  formulationVersionId: string
): Promise<{ reason: string; suggestions: Array<Record<string, number>> } | null> {
  const db = await getDb();
  if (!db) return null;
  const schema = await import("../../drizzle/schema");

  const residuals = await db
    .select()
    .from(schema.predictionResiduals)
    .where(
      and(
        eq(schema.predictionResiduals.organizationId, organizationId),
        eq(schema.predictionResiduals.formulationVersionId, formulationVersionId)
      )
    )
    .orderBy(desc(schema.predictionResiduals.createdAt))
    .limit(20);
  if (residuals.length === 0) return null;

  const worst = residuals.reduce((w, r) =>
    Math.abs(parseFloat(String(r.relResidual))) > Math.abs(parseFloat(String(w.relResidual))) ? r : w
  );
  const worstAbs = Math.abs(parseFloat(String(worst.relResidual)));
  if (worstAbs < 0.15) return null;

  // Vary the largest components ±20% (relative) around current levels — an
  // LHS over the most influential composition dimensions.
  const components = await db
    .select()
    .from(schema.formulationComponents)
    .where(eq(schema.formulationComponents.versionId, formulationVersionId));
  const major = components
    .map(c => ({ id: c.materialId, pct: parseFloat(String(c.percentage)) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  if (major.length === 0) return null;

  const { generateLatinHypercube } = await import("../doeGenerator");
  const factors = major.map(m => ({
    name: m.id,
    min: Math.max(0, m.pct * 0.8),
    max: Math.min(100, m.pct * 1.2),
    unit: "%",
  }));
  // Seeded for reproducibility of the suggestion set per version
  const design = generateLatinHypercube(factors, 3, 42);
  const suggestions = design.designPoints.map(p => p.factors);

  return {
    reason: `${worst.propertyName} prediction missed by ${(worstAbs * 100).toFixed(0)}% — bracketing the ${major.length} largest components to localize the error`,
    suggestions,
  };
}
