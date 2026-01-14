import { invokeLLM } from "./_core/llm";
import * as db from "./db";

interface SOPParams {
  formulationVersionId: string;
  organizationId: string;
  batchSize: number;
  batchUnit: string;
  equipmentIds?: string[];
  safetyLevel?: "standard" | "high" | "critical";
}

interface BatchProcessParams {
  formulationVersionId: string;
  organizationId: string;
  batchSize: number;
  batchUnit: string;
  equipmentIds?: string[];
}

export async function generateSOP(params: SOPParams): Promise<{
  title: string;
  content: string;
  safetyPrecautions: string[];
  qualityCheckpoints: string[];
  steps: Array<{
    stepNumber: number;
    stepName: string;
    description: string;
    duration?: number;
    temperature?: number;
    temperatureUnit?: string;
    criticalParameters?: Record<string, any>;
    safetyNotes?: string;
    qualityChecks?: string[];
  }>;
}> {
  const formulation = await db.getFormulationVersionById(params.formulationVersionId, params.organizationId);
  if (!formulation) throw new Error("Formulation not found");

  const components = await db.getFormulationComponents(params.formulationVersionId, params.organizationId);

  let equipmentInfo = "";
  if (params.equipmentIds && params.equipmentIds.length > 0) {
    const equipment = await Promise.all(
      params.equipmentIds.map(id => db.getEquipmentById(id, params.organizationId))
    );
    equipmentInfo = equipment
      .filter(e => e)
      .map(e => `- ${e!.name} (${e!.equipmentType}): Capacity ${JSON.stringify(e!.capacity)}`)
      .join("\n");
  }

  const prompt = `You are a manufacturing process expert. Generate a detailed Standard Operating Procedure (SOP) for producing a ${params.batchSize}${params.batchUnit} batch of the following formulation.

**Formulation Details:**
Version: ${formulation.versionNumber}
Components:
${components.map(c => `- ${c.material.name}: ${c.component.percentage}% (${c.component.role || "N/A"})`).join("\n")}

**Available Equipment:**
${equipmentInfo || "Standard mixing equipment"}

**Safety Level:** ${params.safetyLevel || "standard"}

Generate a comprehensive SOP document including safety precautions, quality checkpoints, and detailed manufacturing steps.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a manufacturing process expert. Always return valid JSON." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "sop_document",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            safetyPrecautions: { type: "array", items: { type: "string" } },
            qualityCheckpoints: { type: "array", items: { type: "string" } },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stepNumber: { type: "integer" },
                  stepName: { type: "string" },
                  description: { type: "string" },
                  duration: { type: ["integer", "null"] },
                  temperature: { type: ["number", "null"] },
                  temperatureUnit: { type: ["string", "null"] },
                  criticalParameters: { type: ["object", "null"] },
                  safetyNotes: { type: ["string", "null"] },
                  qualityChecks: { type: ["array", "null"], items: { type: "string" } }
                },
                required: ["stepNumber", "stepName", "description"],
                additionalProperties: false
              }
            }
          },
          required: ["title", "content", "safetyPrecautions", "qualityCheckpoints", "steps"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") throw new Error("No content in LLM response");

  return JSON.parse(content);
}

export async function generateBatchProcess(params: BatchProcessParams): Promise<{
  title: string;
  content: string;
  steps: Array<{
    stepNumber: number;
    stepName: string;
    description: string;
    duration?: number;
  }>;
}> {
  const formulation = await db.getFormulationVersionById(params.formulationVersionId, params.organizationId);
  if (!formulation) throw new Error("Formulation not found");

  const components = await db.getFormulationComponents(params.formulationVersionId, params.organizationId);

  const prompt = `Generate a detailed batch process description for producing ${params.batchSize}${params.batchUnit} of the following formulation:

**Components:**
${components.map(c => `- ${c.material.name}: ${c.component.percentage}% (${c.component.role || "N/A"})`).join("\n")}

Provide a clear title, comprehensive process description, and step-by-step manufacturing instructions.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a manufacturing process expert. Always return valid JSON." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "batch_process",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stepNumber: { type: "integer" },
                  stepName: { type: "string" },
                  description: { type: "string" },
                  duration: { type: ["integer", "null"] }
                },
                required: ["stepNumber", "stepName", "description"],
                additionalProperties: false
              }
            }
          },
          required: ["title", "content", "steps"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") throw new Error("No content in LLM response");

  return JSON.parse(content);
}

export async function generateProcessFlowDiagram(formulationVersionId: string, organizationId: string): Promise<{
  mermaidCode: string;
  description: string;
}> {
  const formulation = await db.getFormulationVersionById(formulationVersionId, organizationId);
  if (!formulation) throw new Error("Formulation not found");

  const components = await db.getFormulationComponents(formulationVersionId, organizationId);

  const prompt = `Generate a Mermaid flowchart diagram for the manufacturing process of this formulation:

**Components:**
${components.map(c => `- ${c.material.name}: ${c.component.percentage}%`).join("\n")}

Create a detailed process flow diagram showing raw material preparation, mixing/blending, processing, quality control, and packaging.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a process engineering expert. Generate Mermaid flowchart code. Always return valid JSON." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "process_flow_diagram",
        strict: true,
        schema: {
          type: "object",
          properties: {
            mermaidCode: { type: "string" },
            description: { type: "string" }
          },
          required: ["mermaidCode", "description"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") throw new Error("No content in LLM response");

  return JSON.parse(content);
}
