import { invokeLLM } from "./_core/llm";

/**
 * Equipment Compatibility Checker Service
 * 
 * Analyzes formulation compatibility with manufacturing equipment
 * using LLM-powered analysis of material properties, processing conditions,
 * and equipment constraints.
 */

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  capacity?: { value: number; unit: string };
  operatingTemperatureRange?: { min: number; max: number; unit: string };
  operatingPressureRange?: { min: number; max: number; unit: string };
  mixingSpeedRange?: { min: number; max: number; unit: string };
  compatibleMaterialTypes?: string[];
  incompatibleMaterials?: string[];
  materialContactSurfaces?: string[];
  supportedProcesses?: string[];
  cleaningRequirements?: string;
}

interface FormulationVersion {
  id: string;
  versionNumber: string;
  components: Array<{
    materialId: string;
    materialName: string;
    percentage: number;
    materialType?: string;
    chemicalFamily?: string;
  }>;
  processingNotes?: string;
  targetProperties?: Record<string, any>;
}

interface CompatibilityAnalysis {
  isCompatible: boolean;
  compatibilityScore: number; // 0-100
  incompatibilityReasons: string[];
  requiredModifications: string[];
  processingConstraints: {
    temperatureRange?: { min: number; max: number; unit: string };
    pressureRange?: { min: number; max: number; unit: string };
    mixingSpeed?: { value: number; unit: string };
    batchSize?: { min: number; max: number; unit: string };
    processingTime?: { value: number; unit: string };
    specialRequirements?: string[];
  };
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
}

/**
 * Analyze formulation compatibility with equipment
 */
export async function analyzeEquipmentCompatibility(
  formulation: FormulationVersion,
  equipment: Equipment
): Promise<CompatibilityAnalysis> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert chemical engineer specializing in manufacturing process design and equipment selection. Analyze the compatibility between a formulation and manufacturing equipment, considering:

1. Material compatibility with equipment surfaces
2. Processing parameter compatibility (temperature, pressure, mixing)
3. Batch size and capacity constraints
4. Chemical compatibility and safety
5. Cleaning and changeover requirements
6. Process capability and limitations

Provide a detailed compatibility analysis with specific technical reasoning.`
      },
      {
        role: "user",
        content: `Formulation Details:
${JSON.stringify(formulation, null, 2)}

Equipment Specifications:
${JSON.stringify(equipment, null, 2)}

Analyze the compatibility between this formulation and equipment. Consider:
- Material compatibility with equipment contact surfaces
- Processing parameter requirements vs equipment capabilities
- Batch size constraints
- Chemical safety and compatibility
- Cleaning requirements
- Any modifications needed for compatibility

Provide a comprehensive compatibility assessment.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "compatibility_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            is_compatible: { type: "boolean", description: "Overall compatibility" },
            compatibility_score: { type: "number", description: "Score from 0-100" },
            incompatibility_reasons: { 
              type: "array", 
              items: { type: "string" },
              description: "Reasons for incompatibility"
            },
            required_modifications: {
              type: "array",
              items: { type: "string" },
              description: "Modifications needed for compatibility"
            },
            temperature_min: { type: "number", description: "Minimum processing temperature" },
            temperature_max: { type: "number", description: "Maximum processing temperature" },
            temperature_unit: { type: "string", description: "Temperature unit" },
            pressure_min: { type: "number", description: "Minimum processing pressure" },
            pressure_max: { type: "number", description: "Maximum processing pressure" },
            pressure_unit: { type: "string", description: "Pressure unit" },
            mixing_speed: { type: "number", description: "Recommended mixing speed" },
            mixing_speed_unit: { type: "string", description: "Mixing speed unit" },
            batch_size_min: { type: "number", description: "Minimum batch size" },
            batch_size_max: { type: "number", description: "Maximum batch size" },
            batch_size_unit: { type: "string", description: "Batch size unit" },
            processing_time: { type: "number", description: "Processing time" },
            processing_time_unit: { type: "string", description: "Processing time unit" },
            special_requirements: {
              type: "array",
              items: { type: "string" },
              description: "Special processing requirements"
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Recommendations for optimal processing"
            },
            risk_level: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Risk level for this equipment-formulation combination"
            },
          },
          required: [
            "is_compatible",
            "compatibility_score",
            "incompatibility_reasons",
            "required_modifications",
            "recommendations",
            "risk_level"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const result = JSON.parse(content || "{}");

  return {
    isCompatible: result.is_compatible,
    compatibilityScore: result.compatibility_score,
    incompatibilityReasons: result.incompatibility_reasons || [],
    requiredModifications: result.required_modifications || [],
    processingConstraints: {
      temperatureRange: result.temperature_min && result.temperature_max ? {
        min: result.temperature_min,
        max: result.temperature_max,
        unit: result.temperature_unit || "°C"
      } : undefined,
      pressureRange: result.pressure_min && result.pressure_max ? {
        min: result.pressure_min,
        max: result.pressure_max,
        unit: result.pressure_unit || "bar"
      } : undefined,
      mixingSpeed: result.mixing_speed ? {
        value: result.mixing_speed,
        unit: result.mixing_speed_unit || "rpm"
      } : undefined,
      batchSize: result.batch_size_min && result.batch_size_max ? {
        min: result.batch_size_min,
        max: result.batch_size_max,
        unit: result.batch_size_unit || "L"
      } : undefined,
      processingTime: result.processing_time ? {
        value: result.processing_time,
        unit: result.processing_time_unit || "min"
      } : undefined,
      specialRequirements: result.special_requirements || [],
    },
    recommendations: result.recommendations || [],
    riskLevel: result.risk_level,
  };
}

/**
 * Batch analyze formulation compatibility with multiple equipment
 */
export async function batchAnalyzeCompatibility(
  formulation: FormulationVersion,
  equipmentList: Equipment[]
): Promise<Map<string, CompatibilityAnalysis>> {
  const results = new Map<string, CompatibilityAnalysis>();
  
  // Analyze each equipment in parallel for efficiency
  const analyses = await Promise.all(
    equipmentList.map(equipment => 
      analyzeEquipmentCompatibility(formulation, equipment)
        .then(analysis => ({ equipmentId: equipment.id, analysis }))
        .catch(error => ({
          equipmentId: equipment.id,
          analysis: {
            isCompatible: false,
            compatibilityScore: 0,
            incompatibilityReasons: [`Analysis failed: ${error.message}`],
            requiredModifications: [],
            processingConstraints: {},
            recommendations: [],
            riskLevel: "high" as const,
          }
        }))
    )
  );

  analyses.forEach(({ equipmentId, analysis }) => {
    results.set(equipmentId, analysis);
  });

  return results;
}

/**
 * Find compatible equipment for a formulation
 */
export async function findCompatibleEquipment(
  formulation: FormulationVersion,
  availableEquipment: Equipment[],
  minCompatibilityScore: number = 70
): Promise<Array<{ equipment: Equipment; analysis: CompatibilityAnalysis }>> {
  const compatibilityMap = await batchAnalyzeCompatibility(formulation, availableEquipment);
  
  const compatibleEquipment: Array<{ equipment: Equipment; analysis: CompatibilityAnalysis }> = [];
  
  availableEquipment.forEach(equipment => {
    const analysis = compatibilityMap.get(equipment.id);
    if (analysis && analysis.isCompatible && analysis.compatibilityScore >= minCompatibilityScore) {
      compatibleEquipment.push({ equipment, analysis });
    }
  });

  // Sort by compatibility score (highest first)
  compatibleEquipment.sort((a, b) => b.analysis.compatibilityScore - a.analysis.compatibilityScore);
  
  return compatibleEquipment;
}

/**
 * Generate equipment selection recommendations
 */
export async function generateEquipmentRecommendations(
  formulation: FormulationVersion,
  availableEquipment: Equipment[]
): Promise<{
  recommended: Array<{ equipment: Equipment; analysis: CompatibilityAnalysis; reason: string }>;
  notRecommended: Array<{ equipment: Equipment; analysis: CompatibilityAnalysis; reason: string }>;
  requiresModification: Array<{ equipment: Equipment; analysis: CompatibilityAnalysis; modifications: string[] }>;
}> {
  const compatibilityMap = await batchAnalyzeCompatibility(formulation, availableEquipment);
  
  const recommended: Array<{ equipment: Equipment; analysis: CompatibilityAnalysis; reason: string }> = [];
  const notRecommended: Array<{ equipment: Equipment; analysis: CompatibilityAnalysis; reason: string }> = [];
  const requiresModification: Array<{ equipment: Equipment; analysis: CompatibilityAnalysis; modifications: string[] }> = [];
  
  availableEquipment.forEach(equipment => {
    const analysis = compatibilityMap.get(equipment.id);
    if (!analysis) return;
    
    if (analysis.isCompatible && analysis.compatibilityScore >= 80 && analysis.riskLevel === "low") {
      recommended.push({
        equipment,
        analysis,
        reason: `High compatibility score (${analysis.compatibilityScore}/100) with low risk`
      });
    } else if (!analysis.isCompatible || analysis.compatibilityScore < 50) {
      notRecommended.push({
        equipment,
        analysis,
        reason: analysis.incompatibilityReasons.join("; ")
      });
    } else if (analysis.requiredModifications.length > 0) {
      requiresModification.push({
        equipment,
        analysis,
        modifications: analysis.requiredModifications
      });
    } else {
      // Medium compatibility
      recommended.push({
        equipment,
        analysis,
        reason: `Moderate compatibility score (${analysis.compatibilityScore}/100) - review constraints`
      });
    }
  });
  
  // Sort by compatibility score
  recommended.sort((a, b) => b.analysis.compatibilityScore - a.analysis.compatibilityScore);
  notRecommended.sort((a, b) => a.analysis.compatibilityScore - b.analysis.compatibilityScore);
  requiresModification.sort((a, b) => b.analysis.compatibilityScore - a.analysis.compatibilityScore);
  
  return {
    recommended,
    notRecommended,
    requiresModification,
  };
}
