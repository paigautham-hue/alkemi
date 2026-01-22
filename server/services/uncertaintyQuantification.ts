/**
 * Uncertainty Quantification Service
 * 
 * Provides probability-in-spec calculations for predictions.
 * This is THE KEY METRIC R&D chemists need for risk-based decisions.
 * 
 * Based on Claude Opus 4.5 recommendations (Critical Issue #4)
 */

export interface PredictionWithUncertainty {
  value: number;
  uncertainty: number;
  confidenceInterval95: [number, number];
  probabilityInSpec: number; // 0-1, THE KEY METRIC
  uncertaintySources: {
    model: number; // Model uncertainty (epistemic)
    data: number; // Data uncertainty (aleatoric)
    extrapolation: number; // Extrapolation beyond training data
  };
  calibrationScore?: number; // How well-calibrated is the model?
}

export interface Specification {
  minValue: number;
  maxValue: number;
  unit: string;
}

/**
 * Uncertainty Quantification Service
 */
export class UncertaintyQuantifier {
  /**
   * Standard Normal CDF (Cumulative Distribution Function)
   * 
   * Uses error function approximation for numerical stability
   */
  private normalCDF(x: number): number {
    // Error function approximation (Abramowitz and Stegun)
    const erf = (z: number): number => {
      const t = 1 / (1 + 0.5 * Math.abs(z));
      const tau = t * Math.exp(-z * z - 1.26551223 +
        t * (1.00002368 +
        t * (0.37409196 +
        t * (0.09678418 +
        t * (-0.18628806 +
        t * (0.27886807 +
        t * (-1.13520398 +
        t * (1.48851587 +
        t * (-0.82215223 +
        t * 0.17087277)))))))));
      return z >= 0 ? 1 - tau : tau - 1;
    };
    
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
  }
  
  /**
   * Calculate Probability-in-Spec
   * 
   * This is the probability that the true value falls within specification limits.
   * 
   * Example:
   * - Prediction: 2450 cP ± 125 cP
   * - Spec: 2300-2600 cP
   * - P(in spec) = 92%
   * 
   * Interpretation:
   * - >95%: Very likely to pass QC
   * - 80-95%: Likely to pass, but some risk
   * - 50-80%: Moderate risk of failure
   * - <50%: High risk, consider reformulation
   */
  calculateProbabilityInSpec(
    prediction: number,
    uncertainty: number,
    specMin: number,
    specMax: number
  ): number {
    if (uncertainty <= 0) {
      // No uncertainty = binary result
      return (prediction >= specMin && prediction <= specMax) ? 1.0 : 0.0;
    }
    
    // Calculate z-scores for spec limits
    const zLow = (specMin - prediction) / uncertainty;
    const zHigh = (specMax - prediction) / uncertainty;
    
    // P(specMin ≤ X ≤ specMax) = Φ(zHigh) - Φ(zLow)
    const probInSpec = this.normalCDF(zHigh) - this.normalCDF(zLow);
    
    // Clamp to [0, 1] for numerical stability
    return Math.max(0, Math.min(1, probInSpec));
  }
  
  /**
   * Calculate 95% Confidence Interval
   * 
   * Assumes normal distribution (valid for most predictions with sufficient data)
   */
  calculate95CI(mean: number, std: number): [number, number] {
    const z95 = 1.96; // 95% confidence level
    return [
      mean - z95 * std,
      mean + z95 * std,
    ];
  }
  
  /**
   * Decompose Uncertainty into Sources
   * 
   * Total uncertainty = √(σ_model² + σ_data² + σ_extrapolation²)
   * 
   * - Model uncertainty: How uncertain is the model itself?
   * - Data uncertainty: How noisy is the training data?
   * - Extrapolation uncertainty: Are we predicting outside training range?
   */
  decomposeUncertainty(
    totalUncertainty: number,
    options: {
      modelConfidence?: number; // 0-1, from LLM or ML model
      dataQuality?: number; // 0-1, based on training data size/quality
      isExtrapolation?: boolean; // Are we outside training range?
    } = {}
  ): PredictionWithUncertainty['uncertaintySources'] {
    const {
      modelConfidence = 0.8,
      dataQuality = 0.9,
      isExtrapolation = false,
    } = options;
    
    // Heuristic decomposition (in production, would use ensemble methods)
    const modelUncertainty = totalUncertainty * (1 - modelConfidence);
    const dataUncertainty = totalUncertainty * (1 - dataQuality) * 0.5;
    const extrapolationUncertainty = isExtrapolation ? totalUncertainty * 0.3 : 0;
    
    // Normalize to sum to totalUncertainty
    const sum = modelUncertainty + dataUncertainty + extrapolationUncertainty;
    const scale = sum > 0 ? totalUncertainty / sum : 1;
    
    return {
      model: Math.round(modelUncertainty * scale * 100) / 100,
      data: Math.round(dataUncertainty * scale * 100) / 100,
      extrapolation: Math.round(extrapolationUncertainty * scale * 100) / 100,
    };
  }
  
  /**
   * Create Full Prediction with Uncertainty
   * 
   * Main entry point for adding UQ to predictions
   */
  quantify(
    prediction: number,
    uncertainty: number,
    spec: Specification,
    options: {
      modelConfidence?: number;
      dataQuality?: number;
      isExtrapolation?: boolean;
    } = {}
  ): PredictionWithUncertainty {
    const ci95 = this.calculate95CI(prediction, uncertainty);
    const probInSpec = this.calculateProbabilityInSpec(
      prediction,
      uncertainty,
      spec.minValue,
      spec.maxValue
    );
    const uncertaintySources = this.decomposeUncertainty(uncertainty, options);
    
    return {
      value: Math.round(prediction * 100) / 100,
      uncertainty: Math.round(uncertainty * 100) / 100,
      confidenceInterval95: [
        Math.round(ci95[0] * 100) / 100,
        Math.round(ci95[1] * 100) / 100,
      ],
      probabilityInSpec: Math.round(probInSpec * 100) / 100,
      uncertaintySources,
    };
  }
  
  /**
   * Format Prediction for Display
   * 
   * Example: "2450 cP ± 125 cP (92% probability of meeting spec)"
   */
  formatPrediction(pred: PredictionWithUncertainty, unit: string): string {
    const probPercent = Math.round(pred.probabilityInSpec * 100);
    return `${pred.value} ${unit} ± ${pred.uncertainty} ${unit} (${probPercent}% probability of meeting spec)`;
  }
  
  /**
   * Get Risk Level based on Probability-in-Spec
   */
  getRiskLevel(probabilityInSpec: number): {
    level: 'low' | 'moderate' | 'high' | 'very_high';
    color: string;
    recommendation: string;
  } {
    if (probabilityInSpec >= 0.95) {
      return {
        level: 'low',
        color: 'green',
        recommendation: 'Very likely to pass QC. Proceed with confidence.',
      };
    } else if (probabilityInSpec >= 0.80) {
      return {
        level: 'moderate',
        color: 'yellow',
        recommendation: 'Likely to pass QC, but some risk. Consider validation trial.',
      };
    } else if (probabilityInSpec >= 0.50) {
      return {
        level: 'high',
        color: 'orange',
        recommendation: 'Moderate risk of failure. Recommend optimization before scale-up.',
      };
    } else {
      return {
        level: 'very_high',
        color: 'red',
        recommendation: 'High risk of failure. Consider reformulation or adjust targets.',
      };
    }
  }
}

// Export singleton instance
export const uncertaintyQuantifier = new UncertaintyQuantifier();
