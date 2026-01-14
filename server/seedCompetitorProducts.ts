/**
 * Seed script for test competitor products with diverse marketing claims
 * These products are designed to test the LLM analysis quality across different
 * product types, industries, and marketing claim styles.
 */

import { getDb } from "./db";
import { competitorProducts } from "../drizzle/schema";

interface TestProduct {
  productName: string;
  manufacturer: string;
  productCode: string;
  category: string;
  marketingClaims: string[];
  notes: string;
}

export const TEST_COMPETITOR_PRODUCTS: TestProduct[] = [
  // Product 1: PPG Protective & Marine Coatings - Industrial focus
  {
    productName: "PPG AMERCOAT 385",
    manufacturer: "PPG Industries",
    productCode: "AC-385",
    category: "Epoxy Coating",
    marketingClaims: [
      "Outstanding corrosion protection for steel structures",
      "Excellent adhesion to properly prepared surfaces",
      "High-build capability - up to 10 mils per coat",
      "Resistant to splash and spillage of common chemicals",
      "Suitable for immersion service in fresh and salt water",
      "Fast recoat times for increased productivity",
      "Low temperature cure capability down to 35°F (2°C)",
      "Compliant with SSPC Paint 16 specifications",
      "Extended overcoat window up to 6 months",
      "Proven performance in marine and offshore environments",
    ],
    notes: "High-performance epoxy coating for industrial and marine applications. Known for excellent corrosion resistance in harsh environments.",
  },

  // Product 2: Sherwin-Williams Industrial Enamel - Automotive/Industrial
  {
    productName: "Sherwin-Williams Pro Industrial DTM Acrylic",
    manufacturer: "Sherwin-Williams",
    productCode: "SW-DTM-100",
    category: "Acrylic Enamel",
    marketingClaims: [
      "Direct-to-metal application eliminates primer requirement",
      "Excellent color and gloss retention",
      "Fast dry - handles in 1 hour, recoat in 4 hours",
      "Low VOC formula - less than 100 g/L",
      "Rust inhibitive properties for ferrous metals",
      "Interior and exterior durability",
      "Excellent flow and leveling characteristics",
      "Wide color selection with custom matching available",
      "Resistant to mild chemicals and solvents",
      "Single-component convenience - no mixing required",
      "Spray, brush, or roll application versatility",
    ],
    notes: "Versatile DTM acrylic coating for industrial maintenance. Popular for equipment and structural steel applications.",
  },

  // Product 3: BASF Automotive Coating - High-tech automotive focus
  {
    productName: "BASF Glasurit 90-Line Waterborne Basecoat",
    manufacturer: "BASF Coatings",
    productCode: "GL-90-WB",
    category: "Automotive Basecoat",
    marketingClaims: [
      "Ultra-low VOC waterborne technology - 70% reduction vs solvent",
      "OEM-quality color match with spectrophotometer accuracy",
      "Excellent metallic and pearl effect control",
      "Fast flash-off times for high throughput",
      "Outstanding hiding power reduces material consumption",
      "Exceptional color stability under UV exposure",
      "Compatible with all major clearcoat systems",
      "Meets European Union environmental regulations",
      "Advanced rheology for superior spray atomization",
      "Extended pot life for reduced waste",
      "Proven in premium automotive refinish applications",
      "Digital color retrieval system for 99.9% accuracy",
    ],
    notes: "Premium waterborne automotive basecoat system. Used by high-end body shops for luxury vehicle refinishing.",
  },

  // Product 4: Hempel Marine Antifouling - Specialized marine
  {
    productName: "Hempel GLOBIC 9000",
    manufacturer: "Hempel A/S",
    productCode: "HMP-G9000",
    category: "Antifouling Coating",
    marketingClaims: [
      "Self-polishing copolymer technology for consistent biocide release",
      "60-month performance guarantee on deep-sea vessels",
      "Fuel savings up to 6% through reduced hull friction",
      "Effective against all major fouling organisms",
      "Tin-free and environmentally compliant formulation",
      "Smooth surface finish reduces hydrodynamic drag",
      "Compatible with all underwater hull primers",
      "Proven performance across all trading routes",
      "Reduced dry-docking frequency saves operational costs",
      "IMO and REACH compliant biocide package",
    ],
    notes: "Premium antifouling for commercial shipping. Focus on fuel efficiency and environmental compliance.",
  },

  // Product 5: AkzoNobel Powder Coating - Industrial powder
  {
    productName: "Interpon D2525 Fluoromax",
    manufacturer: "AkzoNobel",
    productCode: "INT-D2525-FM",
    category: "Powder Coating",
    marketingClaims: [
      "Super durable PVDF-based powder coating technology",
      "30-year performance warranty for architectural applications",
      "Exceptional color retention - Delta E < 1.0 after 10 years Florida exposure",
      "Outstanding chalk resistance in aggressive environments",
      "Zero VOC emissions during application",
      "Excellent edge coverage and film uniformity",
      "AAMA 2605 specification compliance",
      "Wide range of metallic and special effect finishes",
      "Suitable for aluminum extrusions and panels",
      "Recyclable overspray reduces material costs",
      "Qualicoat Class 3 certified performance",
    ],
    notes: "Ultra-high performance architectural powder coating. Used on landmark buildings worldwide.",
  },
];

/**
 * Seeds the database with test competitor products
 * @param organizationId The organization ID to associate products with
 * @returns Array of created product IDs
 */
export async function seedCompetitorProducts(organizationId: string, userId: string): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const createdIds: string[] = [];

  for (const product of TEST_COMPETITOR_PRODUCTS) {
    await db.insert(competitorProducts).values({
      organizationId,
      userId,
      productName: product.productName,
      manufacturer: product.manufacturer,
      productCode: product.productCode,
      category: product.category,
      marketingClaims: product.marketingClaims,
      notes: product.notes,
      analysisStatus: "pending",
    });

    createdIds.push(product.productName);
    console.log(`Created competitor product: ${product.productName}`);
  }

  return createdIds;
}

/**
 * Clears all test competitor products from the database
 * @param organizationId The organization ID to clear products from
 */
export async function clearCompetitorProducts(organizationId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { eq } = await import("drizzle-orm");
  await db.delete(competitorProducts).where(eq(competitorProducts.organizationId, organizationId));
  console.log(`Cleared all competitor products for organization: ${organizationId}`);
}
