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
    model: "claude-opus-4.5",
    temperature: 0.2,
    max_tokens: 5000,
    messages: [
      { role: "system", content: "You are a PhD-level chemical engineer with 20+ years of experience in manufacturing operations, process documentation, and regulatory compliance. You have deep expertise in: cGMP (current Good Manufacturing Practices), ISO 9001, FDA regulations, process validation, and technical writing. Generate comprehensive Standard Operating Procedures (SOPs) that meet regulatory requirements and industry best practices. Include: detailed step-by-step instructions with process parameters, safety precautions (PPE, hazards, emergency procedures), quality control checkpoints with acceptance criteria, equipment specifications, and troubleshooting guidance. Write in clear, unambiguous language suitable for shop floor operators. Follow ANSI Z535 standards for safety communication." },
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
    model: "claude-opus-4.5",
    temperature: 0.2,
    max_tokens: 5000,
    messages: [
      { role: "system", content: "You are a senior process engineer with expertise in batch manufacturing, process design, and production planning. You have deep knowledge of: batch processing equipment (reactors, mixers, filters, dryers), material handling, process control, and production scheduling. Generate detailed batch process descriptions with: material requirements (quantities, specifications, suppliers), equipment requirements (type, capacity, operating conditions), process steps with timing and sequencing, critical process parameters (temperature, pressure, agitation speed), in-process controls and testing, and yield calculations. Consider process efficiency, quality assurance, and safety. Follow ISA-88 batch control standards." },
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
    model: "claude-opus-4.5",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      { role: "system", content: "You are a process engineer with expertise in process flow diagram (PFD) creation, process design, and technical documentation. You have deep knowledge of: process flow diagram standards (ISO 10628, ANSI/ISA-5.1), unit operations, process equipment symbols, and flow diagram conventions. Generate clear, professional process flow diagrams using Mermaid flowchart syntax. Include: major process steps, equipment (with identifiers), material flows (with flow rates), decision points, quality control checks, and process conditions. Use standard symbols and clear labeling. Organize flow logically from raw materials to finished product. Always return valid JSON with Mermaid code." },
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
