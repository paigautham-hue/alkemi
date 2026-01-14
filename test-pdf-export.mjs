import { generateFormulationPDF } from "./server/pdfExport.js";

const versionId = "3808c202-2bbb-40a3-9a8a-53ae414caaee";
const organizationId = "6f2b4e9a-8c1d-4f3a-9b7e-5d8c3a1f6e2b";

try {
  console.log("Generating PDF for version:", versionId);
  const pdfBuffer = await generateFormulationPDF(versionId, organizationId);
  console.log("PDF generated successfully! Size:", pdfBuffer.length, "bytes");
} catch (error) {
  console.error("Error generating PDF:", error.message);
  console.error(error.stack);
}
