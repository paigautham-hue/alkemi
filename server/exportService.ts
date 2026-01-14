import { getDb } from "./db";
import { competitorProducts, reverseEngineeringAnalyses } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface ExportData {
  product: {
    id: string;
    productName: string;
    manufacturer: string;
    productCode: string | null;
    category: string | null;
    marketingClaims: string[];
    notes: string | null;
    analysisStatus: string;
    createdAt: Date;
  };
  analyses: {
    analysisType: string;
    results: any;
    confidence: number | null;
    modelUsed: string | null;
    createdAt: Date;
  }[];
}

export async function getExportData(productId: string, organizationId: string): Promise<ExportData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [product] = await db
    .select()
    .from(competitorProducts)
    .where(
      and(
        eq(competitorProducts.id, productId),
        eq(competitorProducts.organizationId, organizationId)
      )
    );

  if (!product) {
    throw new Error("Product not found");
  }

  const analyses = await db
    .select()
    .from(reverseEngineeringAnalyses)
    .where(eq(reverseEngineeringAnalyses.competitorProductId, productId));

  return {
    product: {
      id: product.id,
      productName: product.productName,
      manufacturer: product.manufacturer,
      productCode: product.productCode,
      category: product.category,
      marketingClaims: (product.marketingClaims as string[]) || [],
      notes: product.notes,
      analysisStatus: product.analysisStatus || 'pending',
      createdAt: product.createdAt,
    },
    analyses: analyses.map(a => ({
      analysisType: a.analysisType,
      results: a.results,
      confidence: (a as any).confidence || null,
      modelUsed: a.llmModelUsed,
      createdAt: a.createdAt,
    })),
  };
}

export function generatePDFContent(data: ExportData): string {
  const performanceTranslation = data.analyses.find(a => a.analysisType === "performance_translation");
  const formulationStrategy = data.analyses.find(a => a.analysisType === "formulation_strategy");
  const tppAnalysis = data.analyses.find(a => a.analysisType === "tpp_generation");

  const technicalParameters = performanceTranslation?.results?.technicalParameters || {};
  const testMethods = performanceTranslation?.results?.testMethods || [];
  const specifications = performanceTranslation?.results?.specifications || {};
  const criticalProperties = performanceTranslation?.results?.criticalProperties || [];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ALKEMI™ Analysis Report - ${data.product.productName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f8fafc; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header .subtitle { opacity: 0.9; font-size: 14px; }
    .header .brand { font-size: 12px; opacity: 0.7; margin-top: 20px; }
    .section { background: white; border-radius: 12px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .section h2 { font-size: 20px; color: #1a1a2e; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .section h3 { font-size: 16px; color: #475569; margin: 20px 0 10px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .info-item { padding: 15px; background: #f8fafc; border-radius: 8px; }
    .info-item label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item value { display: block; font-size: 16px; font-weight: 600; color: #1a1a2e; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; }
    td { font-size: 14px; }
    .confidence { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .confidence.high { background: #dcfce7; color: #166534; }
    .confidence.medium { background: #fef3c7; color: #92400e; }
    .confidence.low { background: #fee2e2; color: #991b1b; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; background: #e0e7ff; color: #3730a3; margin: 2px; }
    .claim-list { list-style: none; }
    .claim-list li { padding: 10px 15px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; font-size: 14px; }
    .claim-list li::before { content: "•"; color: #6366f1; font-weight: bold; margin-right: 10px; }
    .footer { text-align: center; padding: 30px; color: #64748b; font-size: 12px; }
    @media print { body { background: white; } .container { padding: 0; } .section { box-shadow: none; border: 1px solid #e2e8f0; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.product.productName}</h1>
      <div class="subtitle">${data.product.manufacturer} | ${data.product.category || 'Industrial Coating'}</div>
      <div class="brand">ALKEMI™ Enterprise Formulation Intelligence Platform</div>
    </div>

    <div class="section">
      <h2>Product Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Product Code</label>
          <value>${data.product.productCode || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Category</label>
          <value>${data.product.category || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Analysis Date</label>
          <value>${new Date().toLocaleDateString()}</value>
        </div>
        <div class="info-item">
          <label>Confidence</label>
          <value>${performanceTranslation?.confidence || 0}%</value>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Marketing Claims</h2>
      <ul class="claim-list">
        ${data.product.marketingClaims.map(claim => `<li>${claim}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2>Technical Parameters</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(technicalParameters).map(([key, value]: [string, any]) => `
            <tr>
              <td><strong>${key}</strong></td>
              <td>${value?.value || value || 'N/A'}</td>
              <td><span class="confidence ${(value?.confidence || 70) >= 80 ? 'high' : (value?.confidence || 70) >= 60 ? 'medium' : 'low'}">${value?.confidence || 70}%</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Test Methods</h2>
      <div>
        ${testMethods.map((method: string) => `<span class="badge">${method}</span>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2>Critical Properties</h2>
      <div>
        ${criticalProperties.map((prop: string) => `<span class="badge">${prop}</span>`).join('')}
      </div>
    </div>

    ${formulationStrategy ? `
    <div class="section">
      <h2>Formulation Strategy</h2>
      <h3>Recommended Approach</h3>
      <p>${formulationStrategy.results?.recommendedApproach || 'N/A'}</p>
      <h3>Key Ingredients</h3>
      <ul class="claim-list">
        ${(formulationStrategy.results?.keyIngredients || []).map((ing: any) => `<li>${ing.name || ing}: ${ing.function || ''}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${tppAnalysis ? `
    <div class="section">
      <h2>Target Product Profile</h2>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Target Value</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          ${(tppAnalysis.results?.targetProperties || []).map((prop: any) => `
            <tr>
              <td><strong>${prop.property || prop.name || 'N/A'}</strong></td>
              <td>${prop.targetValue || prop.value || 'N/A'}</td>
              <td>${prop.priority || 'Medium'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>Generated by ALKEMI™ Enterprise Formulation Intelligence Platform</p>
      <p>Report Date: ${new Date().toISOString()}</p>
      <p>AI Model: ${performanceTranslation?.modelUsed || 'claude-sonnet-4-5'}</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

export function generateExcelContent(data: ExportData): string {
  const performanceTranslation = data.analyses.find(a => a.analysisType === "performance_translation");
  const technicalParameters = performanceTranslation?.results?.technicalParameters || {};
  const testMethods = performanceTranslation?.results?.testMethods || [];
  const criticalProperties = performanceTranslation?.results?.criticalProperties || [];

  const lines: string[] = [];
  
  // Header
  lines.push("ALKEMI Analysis Report");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  
  // Product Information
  lines.push("PRODUCT INFORMATION");
  lines.push(`Product Name,${escapeCSV(data.product.productName)}`);
  lines.push(`Manufacturer,${escapeCSV(data.product.manufacturer)}`);
  lines.push(`Product Code,${escapeCSV(data.product.productCode || 'N/A')}`);
  lines.push(`Category,${escapeCSV(data.product.category || 'N/A')}`);
  lines.push(`Analysis Date,${new Date().toLocaleDateString()}`);
  lines.push(`Confidence,${performanceTranslation?.confidence || 0}%`);
  lines.push(`AI Model,${escapeCSV(performanceTranslation?.modelUsed || 'claude-sonnet-4-5')}`);
  lines.push("");
  
  // Marketing Claims
  lines.push("MARKETING CLAIMS");
  data.product.marketingClaims.forEach((claim, i) => {
    lines.push(`${i + 1},${escapeCSV(claim)}`);
  });
  lines.push("");
  
  // Technical Parameters
  lines.push("TECHNICAL PARAMETERS");
  lines.push("Parameter,Value,Confidence");
  Object.entries(technicalParameters).forEach(([key, value]: [string, any]) => {
    const val = value?.value || value || 'N/A';
    const conf = value?.confidence || 70;
    lines.push(`${escapeCSV(key)},${escapeCSV(String(val))},${conf}%`);
  });
  lines.push("");
  
  // Test Methods
  lines.push("TEST METHODS");
  lines.push(testMethods.map((m: string) => escapeCSV(m)).join(","));
  lines.push("");
  
  // Critical Properties
  lines.push("CRITICAL PROPERTIES");
  lines.push(criticalProperties.map((p: string) => escapeCSV(p)).join(","));
  
  return lines.join("\n");
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
