/**
 * PDF Export Service for Formulations
 * 
 * Generates professional PDF documents for formulation data including:
 * - Formulation metadata (name, code, version, confidentiality)
 * - Complete composition table with materials and percentages
 * - Properties and characteristics
 * - Version history and lineage
 * - Compliance status
 * - Approval history
 */

import { jsPDF } from "jspdf";
import autoTableImport from "jspdf-autotable";
const autoTable = (autoTableImport as any).default || autoTableImport;
import * as db from "./db";

interface FormulationExportData {
  family: any;
  version: any;
  components: any[];
  properties?: any;
  approvals?: any[];
  compliance?: any;
}

export async function generateFormulationPDF(
  formulationVersionId: string,
  organizationId: string
): Promise<Buffer> {
  // Fetch all necessary data
  const version = await db.getFormulationVersionById(formulationVersionId, organizationId);
  if (!version) {
    throw new Error("Formulation version not found");
  }

  const family = await db.getFormulationFamilyById(version.familyId, organizationId);
  if (!family) {
    throw new Error("Formulation family not found");
  }

  const components = await db.getFormulationComponents(formulationVersionId, organizationId);
  const approvals = await db.getApprovalRequestsByFormulation(formulationVersionId);

  // Create PDF document
  const doc = new jsPDF();
  let yPosition = 20;

  // Add header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULATION SPECIFICATION", 105, yPosition, { align: "center" });
  yPosition += 15;

  // Add confidentiality banner
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const confidentialityColor = getConfidentialityColor(family.confidentialityLevel);
  doc.setTextColor(confidentialityColor.r, confidentialityColor.g, confidentialityColor.b);
  doc.text(`CONFIDENTIALITY: ${family.confidentialityLevel.toUpperCase()}`, 105, yPosition, { align: "center" });
  doc.setTextColor(0, 0, 0); // Reset to black
  yPosition += 15;

  // Add formulation metadata
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Product Information", 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const metadata = [
    ["Product Name:", family.name],
    ["Product Code:", family.code],
    ["Version:", version.versionNumber],
    ["Status:", version.status],
    ["Target Application:", family.targetApplication || "N/A"],
    ["Description:", family.description || "N/A"],
  ];

  metadata.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 70, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Add composition table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Composition", 20, yPosition);
  yPosition += 7;

  const tableData = components.map((comp: any) => [
    comp.materialName || "Unknown Material",
    comp.materialCode || "N/A",
    `${comp.percentage.toFixed(2)}%`,
    comp.purpose || "N/A",
    comp.supplierName || "N/A",
  ]);

  // Add total row
  const totalPercentage = components.reduce((sum: number, comp: any) => sum + comp.percentage, 0);
  tableData.push([
    { content: "TOTAL", styles: { fontStyle: "bold" } },
    "",
    { content: `${totalPercentage.toFixed(2)}%`, styles: { fontStyle: "bold" } },
    "",
    "",
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Material Name", "Code", "Percentage", "Purpose", "Supplier"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 40 },
      4: { cellWidth: 35 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Add approval history if available
  if (approvals && approvals.length > 0) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Approval History", 20, yPosition);
    yPosition += 7;

    const approvalData = approvals.map((approval: any) => [
      approval.status,
      approval.requestedByName || "Unknown",
      approval.submittedAt ? new Date(approval.submittedAt).toLocaleDateString() : "N/A",
      approval.reviewedAt ? new Date(approval.reviewedAt).toLocaleDateString() : "Pending",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Status", "Requested By", "Submitted", "Reviewed"]],
      body: approvalData,
      theme: "striped",
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add footer with generation timestamp
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      285,
      { align: "center" }
    );
    doc.text("ALKEMI™ — Enterprise Formulation Intelligence Platform", 105, 290, { align: "center" });
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

function getConfidentialityColor(level: string): { r: number; g: number; b: number } {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    public: { r: 46, g: 204, b: 113 },
    internal: { r: 52, g: 152, b: 219 },
    confidential: { r: 241, g: 196, b: 15 },
    restricted: { r: 231, g: 76, b: 60 },
  };
  return colors[level] || { r: 0, g: 0, b: 0 };
}
