/**
 * Analytics Service
 * 
 * Provides data aggregation and metrics calculation for analytics dashboard
 */

import * as db from "./db";

export interface PredictionAccuracyTrend {
  date: string;
  totalPredictions: number;
  validatedPredictions: number;
  averageError: number;
  accuracyRate: number;
}

export interface TrialSuccessMetrics {
  date: string;
  totalTrials: number;
  successfulTrials: number;
  successRate: number;
  averageAccuracy: number;
}

export interface FormulationTimeline {
  date: string;
  created: number;
  revised: number;
  approved: number;
  total: number;
}

export interface AnalyticsSummary {
  totalFormulations: number;
  totalMaterials: number;
  totalSuppliers: number;
  totalPredictions: number;
  totalTrials: number;
  averagePredictionAccuracy: number;
  recentActivity: {
    formulationsThisMonth: number;
    predictionsThisMonth: number;
    trialsThisMonth: number;
  };
}

/**
 * Calculate prediction accuracy trends over time
 */
export async function getPredictionAccuracyTrend(
  organizationId: string,
  days: number = 30
): Promise<PredictionAccuracyTrend[]> {
  const dbConn = await db.getDb();
  if (!dbConn) return [];

  const { predictions, trials, trialMeasurements } = await import("../drizzle/schema");
  const { sql, desc, eq, and, gte } = await import("drizzle-orm");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all predictions
  const allPredictions = await dbConn
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.organizationId, organizationId),
        gte(predictions.createdAt, startDate)
      )
    )
    .orderBy(predictions.createdAt);

  // Get all trials with measurements
  const allTrials = await dbConn
    .select()
    .from(trials)
    .where(
      and(
        eq(trials.organizationId, organizationId),
        gte(trials.conductedAt, startDate)
      )
    );

  const trialIds = allTrials.map(t => t.id);
  const measurements = trialIds.length > 0
    ? await dbConn
        .select()
        .from(trialMeasurements)
        .where(sql`${trialMeasurements.trialId} IN ${sql.raw(`(${trialIds.map(() => '?').join(',')})`)}`)
    : [];

  // Group by date
  const trendMap = new Map<string, PredictionAccuracyTrend>();

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    trendMap.set(dateStr, {
      date: dateStr,
      totalPredictions: 0,
      validatedPredictions: 0,
      averageError: 0,
      accuracyRate: 0,
    });
  }

  // Count predictions by date
  for (const pred of allPredictions) {
    const dateStr = new Date(pred.createdAt).toISOString().split('T')[0];
    const trend = trendMap.get(dateStr);
    if (trend) {
      trend.totalPredictions++;
    }
  }

  // Calculate validation metrics
  for (const trial of allTrials) {
    const dateStr = new Date(trial.conductedAt).toISOString().split('T')[0];
    const trend = trendMap.get(dateStr);
    if (!trend) continue;

    const trialMeasures = measurements.filter(m => m.trialId === trial.id);
    
    // Find matching predictions
    const relatedPreds = allPredictions.filter(
      p => p.formulationVersionId === trial.formulationVersionId &&
           p.testConditionSetId === trial.testConditionSetId
    );

    let totalError = 0;
    let errorCount = 0;

    for (const measure of trialMeasures) {
      const matchingPred = relatedPreds.find(
        p => p.propertyName.toLowerCase() === measure.propertyName.toLowerCase()
      );

      if (matchingPred) {
        trend.validatedPredictions++;
        const predicted = parseFloat(matchingPred.predictedValue);
        const measured = parseFloat(measure.measuredValue);
        const error = Math.abs((predicted - measured) / measured) * 100;
        totalError += error;
        errorCount++;
      }
    }

    if (errorCount > 0) {
      trend.averageError = totalError / errorCount;
      trend.accuracyRate = Math.max(0, 100 - trend.averageError);
    }
  }

  return Array.from(trendMap.values());
}

/**
 * Calculate trial success metrics over time
 */
export async function getTrialSuccessMetrics(
  organizationId: string,
  days: number = 30
): Promise<TrialSuccessMetrics[]> {
  const dbConn = await db.getDb();
  if (!dbConn) return [];

  const { trials, trialMeasurements, predictions } = await import("../drizzle/schema");
  const { eq, and, gte } = await import("drizzle-orm");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const allTrials = await dbConn
    .select()
    .from(trials)
    .where(
      and(
        eq(trials.organizationId, organizationId),
        gte(trials.conductedAt, startDate)
      )
    );

  const metricsMap = new Map<string, TrialSuccessMetrics>();

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    metricsMap.set(dateStr, {
      date: dateStr,
      totalTrials: 0,
      successfulTrials: 0,
      successRate: 0,
      averageAccuracy: 0,
    });
  }

  // Process each trial
  for (const trial of allTrials) {
    const dateStr = new Date(trial.conductedAt).toISOString().split('T')[0];
    const metrics = metricsMap.get(dateStr);
    if (!metrics) continue;

    metrics.totalTrials++;

    // Get trial measurements
    const measurements = await dbConn
      .select()
      .from(trialMeasurements)
      .where(eq(trialMeasurements.trialId, trial.id));

    // Get related predictions
    const relatedPreds = await dbConn
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.organizationId, organizationId),
          eq(predictions.formulationVersionId, trial.formulationVersionId),
          eq(predictions.testConditionSetId, trial.testConditionSetId)
        )
      );

    let totalAccuracy = 0;
    let matchCount = 0;

    for (const measure of measurements) {
      const matchingPred = relatedPreds.find(
        p => p.propertyName.toLowerCase() === measure.propertyName.toLowerCase()
      );

      if (matchingPred) {
        const predicted = parseFloat(matchingPred.predictedValue);
        const measured = parseFloat(measure.measuredValue);
        const error = Math.abs((predicted - measured) / measured) * 100;
        const accuracy = Math.max(0, 100 - error);
        totalAccuracy += accuracy;
        matchCount++;

        // Consider successful if error < 20%
        if (error < 20) {
          metrics.successfulTrials++;
        }
      }
    }

    if (matchCount > 0) {
      metrics.averageAccuracy = totalAccuracy / matchCount;
    }

    if (metrics.totalTrials > 0) {
      metrics.successRate = (metrics.successfulTrials / metrics.totalTrials) * 100;
    }
  }

  return Array.from(metricsMap.values());
}

/**
 * Get formulation development timeline
 */
export async function getFormulationTimeline(
  organizationId: string,
  days: number = 30
): Promise<FormulationTimeline[]> {
  const dbConn = await db.getDb();
  if (!dbConn) return [];

  const { formulationVersions } = await import("../drizzle/schema");
  const { eq, and, gte } = await import("drizzle-orm");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const versions = await dbConn
    .select()
    .from(formulationVersions)
    .where(
      and(
        eq(formulationVersions.organizationId, organizationId),
        gte(formulationVersions.createdAt, startDate)
      )
    );

  const timelineMap = new Map<string, FormulationTimeline>();

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    timelineMap.set(dateStr, {
      date: dateStr,
      created: 0,
      revised: 0,
      approved: 0,
      total: 0,
    });
  }

  // Count versions by date and type
  for (const version of versions) {
    const dateStr = new Date(version.createdAt).toISOString().split('T')[0];
    const timeline = timelineMap.get(dateStr);
    if (!timeline) continue;

    timeline.total++;

    if (version.branchType === 'revision') {
      timeline.revised++;
    } else {
      timeline.created++;
    }

    if (version.status === 'approved') {
      timeline.approved++;
    }
  }

  return Array.from(timelineMap.values());
}

/**
 * Get overall analytics summary
 */
export async function getAnalyticsSummary(
  organizationId: string
): Promise<AnalyticsSummary> {
  const dbConn = await db.getDb();
  if (!dbConn) {
    return {
      totalFormulations: 0,
      totalMaterials: 0,
      totalSuppliers: 0,
      totalPredictions: 0,
      totalTrials: 0,
      averagePredictionAccuracy: 0,
      recentActivity: {
        formulationsThisMonth: 0,
        predictionsThisMonth: 0,
        trialsThisMonth: 0,
      },
    };
  }

  const { formulationFamilies, materials, suppliers, predictions, trials } = await import("../drizzle/schema");
  const { eq, and, gte, count } = await import("drizzle-orm");

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Get totals
  const [familiesCount] = await dbConn
    .select({ count: count() })
    .from(formulationFamilies)
    .where(eq(formulationFamilies.organizationId, organizationId));

  const [materialsCount] = await dbConn
    .select({ count: count() })
    .from(materials)
    .where(eq(materials.organizationId, organizationId));

  const [suppliersCount] = await dbConn
    .select({ count: count() })
    .from(suppliers)
    .where(eq(suppliers.organizationId, organizationId));

  const [predictionsCount] = await dbConn
    .select({ count: count() })
    .from(predictions)
    .where(eq(predictions.organizationId, organizationId));

  const [trialsCount] = await dbConn
    .select({ count: count() })
    .from(trials)
    .where(eq(trials.organizationId, organizationId));

  // Get recent activity
  const [recentFormulations] = await dbConn
    .select({ count: count() })
    .from(formulationFamilies)
    .where(
      and(
        eq(formulationFamilies.organizationId, organizationId),
        gte(formulationFamilies.createdAt, monthAgo)
      )
    );

  const [recentPredictions] = await dbConn
    .select({ count: count() })
    .from(predictions)
    .where(
      and(
        eq(predictions.organizationId, organizationId),
        gte(predictions.createdAt, monthAgo)
      )
    );

  const [recentTrials] = await dbConn
    .select({ count: count() })
    .from(trials)
    .where(
      and(
        eq(trials.organizationId, organizationId),
        gte(trials.conductedAt, monthAgo)
      )
    );

  // Calculate average prediction accuracy (simplified)
  const accuracyTrend = await getPredictionAccuracyTrend(organizationId, 30);
  const validTrends = accuracyTrend.filter(t => t.validatedPredictions > 0);
  const averageAccuracy = validTrends.length > 0
    ? validTrends.reduce((sum, t) => sum + t.accuracyRate, 0) / validTrends.length
    : 0;

  return {
    totalFormulations: familiesCount.count,
    totalMaterials: materialsCount.count,
    totalSuppliers: suppliersCount.count,
    totalPredictions: predictionsCount.count,
    totalTrials: trialsCount.count,
    averagePredictionAccuracy: averageAccuracy,
    recentActivity: {
      formulationsThisMonth: recentFormulations.count,
      predictionsThisMonth: recentPredictions.count,
      trialsThisMonth: recentTrials.count,
    },
  };
}
