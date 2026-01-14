import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * Analyze root cause of an issue using LLM
 */
export async function analyzeRootCause(
  issueId: string,
  organizationId: string
): Promise<{
  findings: string;
  rootCause: string;
  recommendations: string[];
  confidence: number;
}> {
  const issue = await db.getIssueById(issueId, organizationId);
  if (!issue) throw new Error("Issue not found");

  const prompt = `You are an expert quality engineer analyzing a manufacturing/formulation issue.

Issue Details:
- Type: ${issue.issueType}
- Severity: ${issue.severity}
- Title: ${issue.title}
- Description: ${issue.description}
${issue.formulationVersionId ? `- Formulation ID: ${issue.formulationVersionId}` : ""}
${issue.trialId ? `- Trial ID: ${issue.trialId}` : ""}

Perform a thorough root cause analysis using the 5 Whys method and fishbone diagram principles.

Provide your analysis in JSON format:
{
  "findings": "Detailed findings from the analysis",
  "rootCause": "The identified root cause",
  "recommendations": ["Recommendation 1", "Recommendation 2", "..."],
  "confidence": 0.85
}`;

  const response = await invokeLLM({
    model: "claude-opus-4.5",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      { role: "system", content: "You are a PhD-level quality engineer with 20+ years of experience in quality management, root cause analysis, and continuous improvement. You have deep expertise in: Six Sigma methodologies (DMAIC, DMADV), Lean manufacturing, statistical process control (SPC), failure mode and effects analysis (FMEA), and 8D problem solving. Apply systematic root cause analysis using tools like 5 Whys, fishbone diagrams, and fault tree analysis. Identify contributing factors across categories: materials, methods, machines, measurements, environment, and people. Provide evidence-based conclusions with confidence levels. Recommend corrective and preventive actions (CAPA) that address root causes, not symptoms. Consider cost-benefit analysis and implementation feasibility." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "root_cause_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            findings: { type: "string" },
            rootCause: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
          },
          required: ["findings", "rootCause", "recommendations", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== "string") {
    throw new Error("Invalid LLM response format");
  }

  const result = JSON.parse(content) as {
    findings: string;
    rootCause: string;
    recommendations: string[];
    confidence: number;
  };

  // Save analysis to database
  await db.createIssueAnalysis({
    issueId,
    analysisType: "root_cause",
    findings: result.findings,
    recommendations: result.recommendations,
    confidence: result.confidence,
  });

  return result;
}

/**
 * Detect patterns across historical issues
 */
export async function detectIssuePatterns(
  organizationId: string
): Promise<{
  patterns: Array<{
    pattern: string;
    frequency: number;
    affectedIssues: string[];
    severity: string;
    recommendation: string;
  }>;
  insights: string;
}> {
  const issues = await db.listIssues(organizationId);

  const prompt = `You are a data analyst examining quality issues to identify recurring patterns.

Historical Issues (${issues.length} total):
${issues
  .slice(0, 50)
  .map(
    (issue) =>
      `- [${issue.issueType}] ${issue.title} (Severity: ${issue.severity}, Status: ${issue.status})`
  )
  .join("\n")}

Identify recurring patterns, common root causes, and systemic issues.

Provide your analysis in JSON format:
{
  "patterns": [
    {
      "pattern": "Description of the pattern",
      "frequency": 5,
      "affectedIssues": ["issue-id-1", "issue-id-2"],
      "severity": "high",
      "recommendation": "How to address this pattern"
    }
  ],
  "insights": "Overall insights and systemic issues"
}`;

  const response = await invokeLLM({
    model: "claude-opus-4.5",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      { role: "system", content: "You are a senior quality data analyst with PhD in statistics and expertise in pattern recognition, time series analysis, and predictive analytics. You have deep knowledge of: statistical methods (regression, clustering, classification), machine learning for quality prediction, control charts (X-bar, R, CUSUM, EWMA), and data mining. Analyze quality issue data to identify patterns, trends, correlations, and anomalies. Use statistical tests (chi-square, ANOVA, correlation analysis) to validate findings. Detect seasonality, cyclical patterns, and emerging trends. Identify common causes vs special causes. Provide confidence intervals and statistical significance levels. Generate actionable insights for quality improvement." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "pattern_detection",
        strict: true,
        schema: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  frequency: { type: "number" },
                  affectedIssues: { type: "array", items: { type: "string" } },
                  severity: { type: "string" },
                  recommendation: { type: "string" },
                },
                required: [
                  "pattern",
                  "frequency",
                  "affectedIssues",
                  "severity",
                  "recommendation",
                ],
                additionalProperties: false,
              },
            },
            insights: { type: "string" },
          },
          required: ["patterns", "insights"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== "string") {
    throw new Error("Invalid LLM response format");
  }

  return JSON.parse(content) as {
    patterns: Array<{
      pattern: string;
      frequency: number;
      affectedIssues: string[];
      severity: string;
      recommendation: string;
    }>;
    insights: string;
  };
}

/**
 * Find similar historical issues
 */
export async function findSimilarIssues(
  issueId: string,
  organizationId: string
): Promise<
  Array<{ issueId: string; similarity: number; title: string; resolution: string }>
> {
  const issue = await db.getIssueById(issueId, organizationId);
  if (!issue) throw new Error("Issue not found");

  const allIssues = await db.listIssues(organizationId);
  const otherIssues = allIssues.filter((i) => i.id !== issueId);

  if (otherIssues.length === 0) return [];

  const prompt = `You are analyzing quality issues to find similar historical cases.

Current Issue:
- Type: ${issue.issueType}
- Title: ${issue.title}
- Description: ${issue.description}

Historical Issues:
${otherIssues
  .slice(0, 30)
  .map(
    (i, idx) =>
      `${idx + 1}. [${i.issueType}] ${i.title}
   Description: ${i.description?.substring(0, 200)}
   Root Cause: ${i.rootCause || "Not determined"}
   Resolution: ${i.correctiveAction || "Not resolved"}`
  )
  .join("\n\n")}

Identify the top 5 most similar issues and rate their similarity (0-1 scale).

Provide your analysis in JSON format:
{
  "similarIssues": [
    {
      "issueIndex": 1,
      "similarity": 0.85,
      "reasoning": "Why this issue is similar",
      "resolution": "How it was resolved"
    }
  ]
}`;

  const response = await invokeLLM({
    model: "claude-opus-4.5",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      { role: "system", content: "You are a quality engineer with expertise in knowledge management, case-based reasoning, and organizational learning. You have deep knowledge of: quality database analysis, similarity metrics (cosine similarity, Jaccard index), natural language processing for text similarity, and lessons learned systems. Compare issues across multiple dimensions: symptoms, root causes, affected products, process conditions, and resolutions. Identify truly similar issues vs superficial matches. Extract lessons learned and best practices from historical resolutions. Provide similarity scores with justification. Enable knowledge reuse to accelerate problem solving." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "similar_issues",
        strict: true,
        schema: {
          type: "object",
          properties: {
            similarIssues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issueIndex: { type: "number" },
                  similarity: { type: "number" },
                  reasoning: { type: "string" },
                  resolution: { type: "string" },
                },
                required: ["issueIndex", "similarity", "reasoning", "resolution"],
                additionalProperties: false,
              },
            },
          },
          required: ["similarIssues"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== "string") {
    throw new Error("Invalid LLM response format");
  }

  const result = JSON.parse(content) as {
    similarIssues: Array<{
      issueIndex: number;
      similarity: number;
      reasoning: string;
      resolution: string;
    }>;
  };

  // Map indices back to actual issues
  return result.similarIssues.map((sim) => ({
    issueId: otherIssues[sim.issueIndex - 1].id,
    similarity: sim.similarity,
    title: otherIssues[sim.issueIndex - 1].title,
    resolution: sim.resolution,
  }));
}

/**
 * Generate improvement recommendations
 */
export async function generateImprovementRecommendations(
  issueId: string,
  organizationId: string
): Promise<{
  recommendations: Array<{
    title: string;
    description: string;
    actionType: string;
    priority: string;
    expectedImpact: string;
    estimatedCost: number;
  }>;
  preventionStrategies: string[];
}> {
  const issue = await db.getIssueById(issueId, organizationId);
  if (!issue) throw new Error("Issue not found");

  const analysis = await db.getIssueAnalyses(issueId);
  const rootCauseAnalysis = analysis.find((a) => a.analysisType === "root_cause");

  const prompt = `You are a continuous improvement specialist creating actionable recommendations.

Issue Details:
- Type: ${issue.issueType}
- Severity: ${issue.severity}
- Title: ${issue.title}
- Description: ${issue.description}
${issue.rootCause ? `- Root Cause: ${issue.rootCause}` : ""}
${rootCauseAnalysis ? `- Analysis Findings: ${rootCauseAnalysis.findings}` : ""}

Generate specific, actionable improvement recommendations and prevention strategies.

Provide your recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "Short title",
      "description": "Detailed description",
      "actionType": "process_change",
      "priority": "high",
      "expectedImpact": "Expected outcome",
      "estimatedCost": 5000
    }
  ],
  "preventionStrategies": ["Strategy 1", "Strategy 2", "..."]
}

Action types: process_change, training, equipment_upgrade, supplier_change, formulation_modification, procedure_update, other
Priorities: critical, high, medium, low`;

  const response = await invokeLLM({
    model: "claude-opus-4.5",
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: "system", content: "You are a senior continuous improvement specialist with Black Belt Six Sigma certification and 20+ years of experience in operational excellence. You have deep expertise in: Kaizen, Total Quality Management (TQM), Theory of Constraints (TOC), change management, and innovation methodologies. Generate practical, actionable improvement recommendations that address root causes and prevent recurrence. Prioritize recommendations using impact-effort matrix and cost-benefit analysis. Consider technical feasibility, resource requirements, implementation timeline, and organizational readiness. Provide specific action plans with measurable success criteria (KPIs). Balance quick wins with long-term systemic improvements. Address both technical and organizational/cultural factors." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "improvement_recommendations",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  actionType: { type: "string" },
                  priority: { type: "string" },
                  expectedImpact: { type: "string" },
                  estimatedCost: { type: "number" },
                },
                required: [
                  "title",
                  "description",
                  "actionType",
                  "priority",
                  "expectedImpact",
                  "estimatedCost",
                ],
                additionalProperties: false,
              },
            },
            preventionStrategies: { type: "array", items: { type: "string" } },
          },
          required: ["recommendations", "preventionStrategies"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== "string") {
    throw new Error("Invalid LLM response format");
  }

  const result = JSON.parse(content) as {
    recommendations: Array<{
      title: string;
      description: string;
      actionType: string;
      priority: string;
      expectedImpact: string;
      estimatedCost: number;
    }>;
    preventionStrategies: string[];
  };

  // Save analysis to database
  await db.createIssueAnalysis({
    issueId,
    analysisType: "improvement_recommendation",
    findings: `Generated ${result.recommendations.length} improvement recommendations`,
    recommendations: result.recommendations.map((r) => r.title),
    preventionStrategies: result.preventionStrategies,
    confidence: 0.8,
  });

  return result;
}
