import { drizzle } from "drizzle-orm/mysql2";
import { domains } from "../drizzle/schema.js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "../.env") });

const db = drizzle(process.env.DATABASE_URL);

const domainData = [
  {
    id: crypto.randomUUID(),
    key: "uv_inks",
    name: "UV Inks",
    description: "Ultraviolet-curable printing inks for various substrates",
    version: "1.0.0",
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    key: "coatings",
    name: "Coatings",
    description: "Protective and decorative coating formulations",
    version: "1.0.0",
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    key: "adhesives",
    name: "Adhesives",
    description: "Bonding agents for various materials and applications",
    version: "1.0.0",
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    key: "sealants",
    name: "Sealants",
    description: "Sealing compounds for joints and gaps",
    version: "1.0.0",
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    key: "paints",
    name: "Paints",
    description: "Decorative and protective paint formulations",
    version: "1.0.0",
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    key: "polymers",
    name: "Polymers",
    description: "Polymer synthesis and compounding",
    version: "1.0.0",
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    key: "cosmetics",
    name: "Cosmetics",
    description: "Personal care and cosmetic formulations",
    version: "1.0.0",
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    key: "pharmaceuticals",
    name: "Pharmaceuticals",
    description: "Drug formulations and delivery systems",
    version: "1.0.0",
    isActive: true,
  },
];

async function seedDomains() {
  console.log("🌱 Seeding domains...");

  try {
    // Check if domains already exist
    const existing = await db.select().from(domains).limit(1);
    
    if (existing.length > 0) {
      console.log("⚠️  Domains already exist. Skipping seed.");
      return;
    }

    // Insert domains
    for (const domain of domainData) {
      await db.insert(domains).values(domain);
      console.log(`✅ Created domain: ${domain.name}`);
    }

    console.log("🎉 Domain seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding domains:", error);
    throw error;
  }
}

seedDomains()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
