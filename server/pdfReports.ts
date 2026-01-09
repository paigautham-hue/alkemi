/**
 * PDF Report Generation Service
 * 
 * Generates professional PDF reports for formulations, trials, and compliance
 */

import PDFDocument from "pdfkit";
import type { Readable } from "stream";

interface FormulationReportData {
  family: {
    name: string;
    code: string;
    description?: string;
    targetApplication?: string;
  };
  version: {
    versionNumber: string;
    status: string;
    createdAt: Date;
  };
  components: Array<{
    materialName: string;
    materialCode: string;
    weightPercent: string;
    purpose?: string;
  }>;
  predictions?: Array<{
    propertyName: string;
    predictedValue: string;
    unit: string;
    confidence?: number;
  }>;
}

interface TrialReportData {
  trial: {
    trialCode: string;
    conductedBy: string;
    conductedAt: Date;
    notes?: string;
  };
  formulation: {
    familyName: string;
    versionNumber: string;
  };
  testCondition: {
    name: string;
    temperature?: number;
    humidity?: number;
  };
  measurements: Array<{
    propertyName: string;
    measuredValue: string;
    unit: string;
    predictedValue?: string;
    deviation?: number;
  }>;
}

interface ComplianceReportData {
  formulation: {
    familyName: string;
    versionNumber: string;
    code: string;
  };
  checkDate: Date;
  violations: Array<{
    severity: "error" | "warning" | "info";
    ruleName: string;
    message: string;
    affectedComponents: string[];
  }>;
  summary: {
    totalRulesChecked: number;
    errors: number;
    warnings: number;
    infos: number;
    overallStatus: "pass" | "fail" | "warning";
  };
}

/**
 * Generate formulation report PDF
 */
export async function generateFormulationReport(data: FormulationReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("ALKEMI™ Formulation Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(2);

      // Formulation Details
      doc.fontSize(14).font("Helvetica-Bold").text("Formulation Details");
      doc.moveDown(0.5);
      
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${data.family.name}`);
      doc.text(`Code: ${data.family.code}`);
      doc.text(`Version: ${data.version.versionNumber}`);
      doc.text(`Status: ${data.version.status.toUpperCase()}`);
      doc.text(`Created: ${data.version.createdAt.toLocaleDateString()}`);
      
      if (data.family.description) {
        doc.moveDown(0.5);
        doc.text(`Description: ${data.family.description}`);
      }
      
      if (data.family.targetApplication) {
        doc.text(`Application: ${data.family.targetApplication}`);
      }

      doc.moveDown(2);

      // Components Table
      doc.fontSize(14).font("Helvetica-Bold").text("Formulation Components");
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const colWidths = { material: 150, code: 80, weight: 60, purpose: 150 };
      const colX = { material: 50, code: 210, weight: 300, purpose: 370 };

      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Material", colX.material, tableTop, { width: colWidths.material });
      doc.text("Code", colX.code, tableTop, { width: colWidths.code });
      doc.text("Weight %", colX.weight, tableTop, { width: colWidths.weight });
      doc.text("Purpose", colX.purpose, tableTop, { width: colWidths.purpose });

      // Draw header line
      doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font("Helvetica");
      let totalWeight = 0;
      
      data.components.forEach((comp) => {
        const rowY = doc.y;
        doc.text(comp.materialName, colX.material, rowY, { width: colWidths.material });
        doc.text(comp.materialCode, colX.code, rowY, { width: colWidths.code });
        doc.text(comp.weightPercent, colX.weight, rowY, { width: colWidths.weight, align: "right" });
        doc.text(comp.purpose || "-", colX.purpose, rowY, { width: colWidths.purpose });
        doc.moveDown(0.8);
        
        totalWeight += parseFloat(comp.weightPercent);
      });

      // Total row
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold");
      const totalY = doc.y;
      doc.text("Total:", colX.material, totalY);
      doc.text(totalWeight.toFixed(2), colX.weight, totalY, { width: colWidths.weight, align: "right" });

      doc.moveDown(2);

      // Predictions (if available)
      if (data.predictions && data.predictions.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Predicted Properties");
        doc.moveDown(0.5);

        doc.fontSize(9).font("Helvetica");
        data.predictions.forEach((pred) => {
          const confidence = pred.confidence ? ` (${(pred.confidence * 100).toFixed(0)}% confidence)` : "";
          doc.text(`${pred.propertyName}: ${pred.predictedValue} ${pred.unit}${confidence}`);
          doc.moveDown(0.3);
        });
      }

      // Footer
      doc.fontSize(8).font("Helvetica").text(
        "This document is confidential and proprietary. Generated by ALKEMI™ Platform.",
        50,
        doc.page.height - 50,
        { align: "center" }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate trial report PDF
 */
export async function generateTrialReport(data: TrialReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("ALKEMI™ Trial Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(2);

      // Trial Details
      doc.fontSize(14).font("Helvetica-Bold").text("Trial Information");
      doc.moveDown(0.5);
      
      doc.fontSize(10).font("Helvetica");
      doc.text(`Trial Code: ${data.trial.trialCode}`);
      doc.text(`Formulation: ${data.formulation.familyName} v${data.formulation.versionNumber}`);
      doc.text(`Conducted By: ${data.trial.conductedBy}`);
      doc.text(`Date: ${data.trial.conductedAt.toLocaleDateString()}`);
      doc.text(`Test Conditions: ${data.testCondition.name}`);
      
      if (data.testCondition.temperature) {
        doc.text(`  Temperature: ${data.testCondition.temperature}°C`);
      }
      if (data.testCondition.humidity) {
        doc.text(`  Humidity: ${data.testCondition.humidity}%`);
      }

      if (data.trial.notes) {
        doc.moveDown(0.5);
        doc.text(`Notes: ${data.trial.notes}`);
      }

      doc.moveDown(2);

      // Measurements Table
      doc.fontSize(14).font("Helvetica-Bold").text("Test Results");
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const colWidths = { property: 140, measured: 80, predicted: 80, deviation: 80 };
      const colX = { property: 50, measured: 200, predicted: 290, deviation: 380 };

      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Property", colX.property, tableTop, { width: colWidths.property });
      doc.text("Measured", colX.measured, tableTop, { width: colWidths.measured });
      doc.text("Predicted", colX.predicted, tableTop, { width: colWidths.predicted });
      doc.text("Deviation", colX.deviation, tableTop, { width: colWidths.deviation });

      // Draw header line
      doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font("Helvetica");
      
      data.measurements.forEach((meas) => {
        const rowY = doc.y;
        doc.text(`${meas.propertyName} (${meas.unit})`, colX.property, rowY, { width: colWidths.property });
        doc.text(meas.measuredValue, colX.measured, rowY, { width: colWidths.measured, align: "right" });
        doc.text(meas.predictedValue || "-", colX.predicted, rowY, { width: colWidths.predicted, align: "right" });
        
        if (meas.deviation !== undefined) {
          const devText = `${meas.deviation > 0 ? "+" : ""}${meas.deviation.toFixed(1)}%`;
          doc.text(devText, colX.deviation, rowY, { width: colWidths.deviation, align: "right" });
        } else {
          doc.text("-", colX.deviation, rowY, { width: colWidths.deviation, align: "right" });
        }
        
        doc.moveDown(0.8);
      });

      // Footer
      doc.fontSize(8).font("Helvetica").text(
        "This document is confidential and proprietary. Generated by ALKEMI™ Platform.",
        50,
        doc.page.height - 50,
        { align: "center" }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate compliance report PDF
 */
export async function generateComplianceReport(data: ComplianceReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("ALKEMI™ Compliance Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(2);

      // Formulation Details
      doc.fontSize(14).font("Helvetica-Bold").text("Formulation Information");
      doc.moveDown(0.5);
      
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${data.formulation.familyName}`);
      doc.text(`Version: ${data.formulation.versionNumber}`);
      doc.text(`Code: ${data.formulation.code}`);
      doc.text(`Check Date: ${data.checkDate.toLocaleDateString()}`);

      doc.moveDown(2);

      // Summary
      doc.fontSize(14).font("Helvetica-Bold").text("Compliance Summary");
      doc.moveDown(0.5);

      doc.fontSize(10).font("Helvetica");
      doc.text(`Overall Status: ${data.summary.overallStatus.toUpperCase()}`);
      doc.text(`Total Rules Checked: ${data.summary.totalRulesChecked}`);
      doc.text(`Errors: ${data.summary.errors}`);
      doc.text(`Warnings: ${data.summary.warnings}`);
      doc.text(`Informational: ${data.summary.infos}`);

      doc.moveDown(2);

      // Violations
      if (data.violations.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Compliance Issues");
        doc.moveDown(0.5);

        data.violations.forEach((violation, index) => {
          // Severity badge
          doc.fontSize(9).font("Helvetica-Bold");
          const severityColor = 
            violation.severity === "error" ? "#DC2626" :
            violation.severity === "warning" ? "#F59E0B" :
            "#3B82F6";
          
          doc.fillColor(severityColor).text(`[${violation.severity.toUpperCase()}]`, { continued: true });
          doc.fillColor("black").font("Helvetica").text(` ${violation.ruleName}`);
          
          doc.moveDown(0.3);
          doc.fontSize(9).font("Helvetica");
          doc.text(violation.message);
          
          if (violation.affectedComponents.length > 0) {
            doc.text(`Affected: ${violation.affectedComponents.join(", ")}`);
          }
          
          doc.moveDown(0.8);
        });
      } else {
        doc.fontSize(12).font("Helvetica").fillColor("#10B981").text("✓ No compliance issues found");
        doc.fillColor("black");
      }

      // Footer
      doc.fontSize(8).font("Helvetica").text(
        "This compliance report is for informational purposes only. Consult with regulatory experts for official compliance verification.",
        50,
        doc.page.height - 70,
        { align: "center", width: 500 }
      );

      doc.fontSize(8).text(
        "Generated by ALKEMI™ Platform.",
        50,
        doc.page.height - 50,
        { align: "center" }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
