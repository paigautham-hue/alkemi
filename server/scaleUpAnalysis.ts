import { invokeLLM } from "./_core/llm";

/**
 * ALKEMI™ Scale-Up Risk Analyzer
 * 
 * Analyzes lab-to-pilot scale-up risks using:
 * - Reaction kinetics (rate constants, activation energy)
 * - Heat transfer (cooling capacity, temperature rise)
 * - Mass transfer (mixing time, Reynolds number, power per volume)
 * - Risk assessment and mitigation strategies
 */

interface FormulationData {
  id: string;
  versionNumber: string;
  components: Array<{
    materialId: string;
    materialName: string;
    percentage: number;
  }>;
}

interface ScaleData {
  volume: number;
  unit: string;
}

interface ScaleUpAnalysisResult {
  // Reaction kinetics
  reactionType: string;
  rateConstant: number;
  activationEnergy: number;
  reactionOrder: number;
  
  // Heat transfer
  heatGenerationRate: number;
  coolingCapacityLab: number;
  coolingCapacityPilot: number;
  temperatureRisePrediction: number;
  
  // Mass transfer
  mixingTimeLab: number;
  mixingTimePilot: number;
  reynoldsNumberLab: number;
  reynoldsNumberPilot: number;
  powerPerVolumeLab: number;
  powerPerVolumePilot: number;
  
  // Risk assessment
  overallRiskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  identifiedRisks: Array<{
    category: string;
    description: string;
    severity: string;
    likelihood: string;
    mitigation: string;
  }>;
  
  // Recommendations
  processModifications: string[];
  equipmentRecommendations: string[];
  controlStrategyChanges: string[];
  additionalTestingNeeded: string[];
}

/**
 * Analyze scale-up risks for a formulation
 */
export async function analyzeScaleUpRisks(
  formulation: FormulationData,
  labScale: ScaleData,
  pilotScale: ScaleData,
  targetScale?: ScaleData
): Promise<ScaleUpAnalysisResult> {
  
  // Build comprehensive prompt for LLM analysis
  const prompt = `You are a chemical engineering expert specializing in process scale-up. Analyze the scale-up risks for the following formulation.

**Formulation Details:**
- Version: ${formulation.versionNumber}
- Components:
${formulation.components.map(c => `  * ${c.materialName}: ${c.percentage}%`).join("\n")}

**Scale Information:**
- Lab Scale: ${labScale.volume} ${labScale.unit}
- Pilot Scale: ${pilotScale.volume} ${pilotScale.unit}
${targetScale ? `- Target Scale: ${targetScale.volume} ${targetScale.unit}` : ""}

**Analysis Required:**

1. **Reaction Kinetics Analysis:**
   - Identify the reaction type (mixing, dispersion, polymerization, etc.)
   - Estimate rate constant (if applicable)
   - Estimate activation energy (kJ/mol)
   - Determine reaction order

2. **Heat Transfer Analysis:**
   - Estimate heat generation rate (W/L)
   - Calculate cooling capacity at lab scale (W/L)
   - Calculate cooling capacity at pilot scale (W/L)
   - Predict temperature rise during scale-up (°C)

3. **Mass Transfer Analysis:**
   - Estimate mixing time at lab scale (seconds)
   - Estimate mixing time at pilot scale (seconds)
   - Calculate Reynolds number at lab scale
   - Calculate Reynolds number at pilot scale
   - Calculate power per volume at lab scale (W/L)
   - Calculate power per volume at pilot scale (W/L)

4. **Risk Assessment:**
   - Identify specific risks (at least 3-5 risks)
   - For each risk, provide:
     * Category (thermal, mixing, reaction kinetics, material handling, safety, quality)
     * Description
     * Severity (low, medium, high, critical)
     * Likelihood (low, medium, high)
     * Mitigation strategy

5. **Recommendations:**
   - Process modifications needed
   - Equipment recommendations
   - Control strategy changes
   - Additional testing needed

**Output Format:**
Provide a detailed JSON response with all numerical values and risk assessments.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a chemical engineering expert with deep knowledge of process scale-up, reaction kinetics, heat transfer, and mass transfer. Provide detailed, quantitative analysis with realistic numerical estimates based on the formulation composition and scale ratios."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scaleup_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            reactionType: { type: "string" },
            rateConstant: { type: "number" },
            activationEnergy: { type: "number" },
            reactionOrder: { type: "number" },
            heatGenerationRate: { type: "number" },
            coolingCapacityLab: { type: "number" },
            coolingCapacityPilot: { type: "number" },
            temperatureRisePrediction: { type: "number" },
            mixingTimeLab: { type: "number" },
            mixingTimePilot: { type: "number" },
            reynoldsNumberLab: { type: "number" },
            reynoldsNumberPilot: { type: "number" },
            powerPerVolumeLab: { type: "number" },
            powerPerVolumePilot: { type: "number" },
            identifiedRisks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  likelihood: { type: "string" },
                  mitigation: { type: "string" }
                },
                required: ["category", "description", "severity", "likelihood", "mitigation"],
                additionalProperties: false
              }
            },
            processModifications: {
              type: "array",
              items: { type: "string" }
            },
            equipmentRecommendations: {
              type: "array",
              items: { type: "string" }
            },
            controlStrategyChanges: {
              type: "array",
              items: { type: "string" }
            },
            additionalTestingNeeded: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: [
            "reactionType",
            "rateConstant",
            "activationEnergy",
            "reactionOrder",
            "heatGenerationRate",
            "coolingCapacityLab",
            "coolingCapacityPilot",
            "temperatureRisePrediction",
            "mixingTimeLab",
            "mixingTimePilot",
            "reynoldsNumberLab",
            "reynoldsNumberPilot",
            "powerPerVolumeLab",
            "powerPerVolumePilot",
            "identifiedRisks",
            "processModifications",
            "equipmentRecommendations",
            "controlStrategyChanges",
            "additionalTestingNeeded"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from LLM");
  }

  const analysis = JSON.parse(content) as Omit<ScaleUpAnalysisResult, "overallRiskScore" | "riskLevel">;

  // Calculate overall risk score based on identified risks
  const riskScores = analysis.identifiedRisks.map(risk => {
    const severityScore = { low: 1, medium: 2, high: 3, critical: 4 }[risk.severity.toLowerCase()] || 2;
    const likelihoodScore = { low: 1, medium: 2, high: 3 }[risk.likelihood.toLowerCase()] || 2;
    return severityScore * likelihoodScore;
  });

  const overallRiskScore = riskScores.length > 0
    ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
    : 0;

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (overallRiskScore < 3) {
    riskLevel = "low";
  } else if (overallRiskScore < 6) {
    riskLevel = "medium";
  } else if (overallRiskScore < 9) {
    riskLevel = "high";
  } else {
    riskLevel = "critical";
  }

  return {
    ...analysis,
    overallRiskScore,
    riskLevel
  };
}

/**
 * Generate scale-up scenarios with different process parameters
 */
export async function generateScaleUpScenarios(
  formulation: FormulationData,
  analysisId: string,
  scaleData: { labScale: ScaleData; pilotScale: ScaleData }
): Promise<Array<{
  scenarioName: string;
  description: string;
  temperature?: number;
  pressure?: number;
  mixingSpeed?: number;
  additionRate?: number;
  holdTime?: number;
  predictedYield: number;
  predictedQuality: string;
  predictedCycleTime: number;
  predictedCost?: number;
  successProbability: number;
  confidenceLevel: number;
}>> {
  
  const prompt = `You are a process development expert. Generate 3-5 alternative scale-up scenarios for the following formulation, varying process parameters to optimize different objectives (yield, quality, cycle time, cost).

**Formulation:**
${formulation.components.map(c => `- ${c.materialName}: ${c.percentage}%`).join("\n")}

**Scale:**
- Lab: ${scaleData.labScale.volume} ${scaleData.labScale.unit}
- Pilot: ${scaleData.pilotScale.volume} ${scaleData.pilotScale.unit}

**Generate scenarios with:**
1. Baseline scenario (standard conditions)
2. High-yield scenario (optimized for maximum yield)
3. Fast-cycle scenario (optimized for shortest cycle time)
4. Cost-optimized scenario (optimized for lowest cost)
5. Quality-optimized scenario (optimized for best quality)

For each scenario, provide:
- Scenario name and description
- Process parameters (temperature °C, pressure bar, mixing speed rpm, addition rate, hold time minutes)
- Predicted outcomes (yield %, quality rating, cycle time hours, cost estimate)
- Success probability (0-100%)
- Confidence level (0-100%)`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a process development expert with experience in scale-up optimization. Provide realistic, quantitative scenarios based on chemical engineering principles."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scaleup_scenarios",
        strict: true,
        schema: {
          type: "object",
          properties: {
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenarioName: { type: "string" },
                  description: { type: "string" },
                  temperature: { type: "number" },
                  pressure: { type: "number" },
                  mixingSpeed: { type: "number" },
                  additionRate: { type: "number" },
                  holdTime: { type: "number" },
                  predictedYield: { type: "number" },
                  predictedQuality: { type: "string" },
                  predictedCycleTime: { type: "number" },
                  predictedCost: { type: "number" },
                  successProbability: { type: "number" },
                  confidenceLevel: { type: "number" }
                },
                required: [
                  "scenarioName",
                  "description",
                  "temperature",
                  "pressure",
                  "mixingSpeed",
                  "additionRate",
                  "holdTime",
                  "predictedYield",
                  "predictedQuality",
                  "predictedCycleTime",
                  "predictedCost",
                  "successProbability",
                  "confidenceLevel"
                ],
                additionalProperties: false
              }
            }
          },
          required: ["scenarios"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from LLM");
  }

  const result = JSON.parse(content) as { scenarios: Array<any> };
  return result.scenarios;
}
