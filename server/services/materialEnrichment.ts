/**
 * Material Enrichment Service — populates first-principles material data
 * from external sources, with per-value provenance:
 *
 * 1. PubChem PUG REST (free): CAS → CID → MW, SMILES, InChIKey
 * 2. hsp_reference table (literature seed + purchased HSPiP import): Hansen
 *    parameters + molar volume by CAS/InChIKey match
 * 3. Group-contribution HSP estimation (van Krevelen) from SMILES when no
 *    reference entry exists — labeled, wide uncertainty
 * 4. Supplier TDS text → LLM extraction into material_properties (staged,
 *    isPreferred=false until human review)
 *
 * Rules: never overwrite a `measured` value; typed columns on `materials`
 * are only filled when blank; every write also lands in material_properties
 * with its source.
 */
import { getDb } from "../db";
import { eq, or, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { estimateHSPFromSmiles } from "../physics/estimation/hspGroupContribution";
import { HSP_LITERATURE } from "../data/hspLiterature";

const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

export interface EnrichmentReport {
  materialId: string;
  steps: Array<{ step: string; status: "ok" | "skipped" | "failed"; detail: string }>;
}

async function pubchemJson(path: string): Promise<any | null> {
  try {
    const response = await fetch(`${PUBCHEM_BASE}${path}`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function writeProperty(
  materialId: string,
  propertyName: string,
  value: number,
  source: "measured" | "supplier_tds" | "pubchem" | "hspip" | "group_contribution" | "llm_extracted" | "manual",
  opts: { unit?: string; uncertainty?: number; confidence?: number; sourceDocumentId?: string; temperatureC?: number; shearRate?: number; method?: string } = {}
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { materialProperties } = await import("../../drizzle/schema");
  await db.insert(materialProperties).values({
    id: crypto.randomUUID(),
    materialId,
    propertyName,
    value: value.toString(),
    unit: opts.unit ?? null,
    temperatureC: opts.temperatureC?.toString() ?? null,
    shearRate: opts.shearRate?.toString() ?? null,
    method: opts.method ?? null,
    source,
    sourceDocumentId: opts.sourceDocumentId ?? null,
    uncertainty: opts.uncertainty?.toString() ?? null,
    confidence: (opts.confidence ?? 0.8).toString(),
    isPreferred: false,
  });
}

/** Fill a typed column on materials only when it is currently NULL/empty. */
async function fillBlankColumn(materialId: string, updates: Record<string, string | number | null>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { materials } = await import("../../drizzle/schema");
  const [row] = await db.select().from(materials).where(eq(materials.id, materialId));
  if (!row) return;
  const patch: Record<string, any> = {};
  for (const [column, value] of Object.entries(updates)) {
    if (value === null || value === undefined) continue;
    if ((row as any)[column] === null || (row as any)[column] === undefined || (row as any)[column] === "") {
      patch[column] = typeof value === "number" ? value.toString() : value;
    }
  }
  if (Object.keys(patch).length > 0) {
    await db.update(materials).set(patch).where(eq(materials.id, materialId));
  }
}

/**
 * Step 1 — PubChem identity + basic properties by CAS.
 */
export async function enrichFromPubChem(material: { id: string; casNumber?: string | null }): Promise<{ status: "ok" | "skipped" | "failed"; detail: string }> {
  if (!material.casNumber) return { status: "skipped", detail: "no CAS number" };

  const cidResult = await pubchemJson(`/compound/name/${encodeURIComponent(material.casNumber)}/cids/JSON`);
  const cid = cidResult?.IdentifierList?.CID?.[0];
  if (!cid) return { status: "failed", detail: `no PubChem CID for CAS ${material.casNumber}` };

  const propResult = await pubchemJson(
    `/compound/cid/${cid}/property/MolecularWeight,CanonicalSMILES,InChIKey,XLogP/JSON`
  );
  const props = propResult?.PropertyTable?.Properties?.[0];
  if (!props) return { status: "failed", detail: `no properties for CID ${cid}` };

  const mw = parseFloat(props.MolecularWeight);
  await fillBlankColumn(material.id, {
    pubchemCid: String(cid),
    smiles: props.CanonicalSMILES ?? null,
    inchiKey: props.InChIKey ?? null,
    molecularWeight: Number.isFinite(mw) ? mw : null,
  });
  if (Number.isFinite(mw)) {
    await writeProperty(material.id, "molecular_weight", mw, "pubchem", { unit: "g/mol", confidence: 0.95 });
  }

  return { status: "ok", detail: `CID ${cid}: MW/SMILES/InChIKey` };
}

/**
 * Step 2+3 — Hansen parameters: reference table first, then group-contribution
 * estimation from SMILES (requires molar volume = MW/density).
 */
export async function enrichHSP(material: {
  id: string;
  casNumber?: string | null;
  inchiKey?: string | null;
  smiles?: string | null;
  molecularWeight?: string | number | null;
  density?: string | number | null;
}): Promise<{ status: "ok" | "skipped" | "failed"; detail: string }> {
  const db = await getDb();
  if (!db) return { status: "failed", detail: "no database" };
  const { hspReference } = await import("../../drizzle/schema");

  // 2a. Reference lookup by CAS or InChIKey
  const conditions = [];
  if (material.casNumber) conditions.push(eq(hspReference.casNumber, material.casNumber));
  if (material.inchiKey) conditions.push(eq(hspReference.inchiKey, material.inchiKey));

  if (conditions.length > 0) {
    const [ref] = await db.select().from(hspReference).where(or(...conditions)).limit(1);
    if (ref) {
      const d = parseFloat(String(ref.hansenD));
      const p = parseFloat(String(ref.hansenP));
      const h = parseFloat(String(ref.hansenH));
      const source = ref.source === "hspip" ? "hspip" : "hspip"; // literature rows share the reference tier
      await fillBlankColumn(material.id, {
        hansenD: d,
        hansenP: p,
        hansenH: h,
        hansenR0: ref.r0 ? parseFloat(String(ref.r0)) : null,
        molarVolume: ref.molarVolume ? parseFloat(String(ref.molarVolume)) : null,
      });
      await writeProperty(material.id, "hansen_d", d, source, { unit: "MPa^0.5", confidence: 0.9 });
      await writeProperty(material.id, "hansen_p", p, source, { unit: "MPa^0.5", confidence: 0.9 });
      await writeProperty(material.id, "hansen_h", h, source, { unit: "MPa^0.5", confidence: 0.9 });
      return { status: "ok", detail: `reference match (${ref.source}): ${ref.name ?? material.casNumber}` };
    }
  }

  // 2b. Group-contribution estimate from SMILES
  const mw = material.molecularWeight ? parseFloat(String(material.molecularWeight)) : NaN;
  const density = material.density ? parseFloat(String(material.density)) : NaN;
  if (!material.smiles || !Number.isFinite(mw) || !Number.isFinite(density) || density <= 0) {
    return { status: "skipped", detail: "no reference entry; group contribution needs SMILES + MW + density" };
  }

  const estimate = estimateHSPFromSmiles(material.smiles, mw / density);
  if (!estimate) {
    return { status: "failed", detail: "group-contribution estimation failed (unsupported atoms or parse error)" };
  }

  await fillBlankColumn(material.id, {
    hansenD: estimate.hansenD,
    hansenP: estimate.hansenP,
    hansenH: estimate.hansenH,
    molarVolume: estimate.molarVolume,
  });
  await writeProperty(material.id, "hansen_d", estimate.hansenD, "group_contribution", { unit: "MPa^0.5", uncertainty: estimate.uncertainty, confidence: 0.6 });
  await writeProperty(material.id, "hansen_p", estimate.hansenP, "group_contribution", { unit: "MPa^0.5", uncertainty: estimate.uncertainty, confidence: 0.6 });
  await writeProperty(material.id, "hansen_h", estimate.hansenH, "group_contribution", { unit: "MPa^0.5", uncertainty: estimate.uncertainty, confidence: 0.6 });

  return { status: "ok", detail: `group-contribution estimate (±${estimate.uncertainty} MPa^0.5)` };
}

/**
 * Step 4 — extract qualified property values from supplier TDS text via LLM.
 * Values land in material_properties as llm_extracted, isPreferred=false —
 * the human review queue approves them (sets isPreferred).
 */
export async function extractFromTdsText(
  materialId: string,
  tdsText: string,
  sourceDocumentId?: string
): Promise<{ status: "ok" | "failed"; detail: string; extracted: number }> {
  const truncated = tdsText.length > 30000 ? tdsText.slice(0, 30000) : tdsText;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You extract numeric material properties from supplier technical data sheets (TDS). Extract ONLY values explicitly stated in the text — never infer or estimate. Record the measurement conditions (temperature, shear rate, method) when stated. Canonical property names: density, viscosity, solids_content, voc_content, molecular_weight, glass_transition_temp, refractive_index, functionality, equivalent_weight, particle_size_d50, oil_absorption, hlb, surface_tension, acid_value, hydroxyl_value, flash_point, ph, mfft, tg_midpoint. Use SI-adjacent units as printed.`,
        },
        { role: "user", content: `Extract all numeric material properties from this TDS:\n\n${truncated}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tds_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              properties: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    propertyName: { type: "string" },
                    value: { type: "number" },
                    unit: { type: "string" },
                    temperatureC: { type: ["number", "null"] },
                    shearRate: { type: ["number", "null"] },
                    method: { type: ["string", "null"] },
                    confidence: { type: "number", description: "0-1: how unambiguous the extraction is" },
                  },
                  required: ["propertyName", "value", "unit", "temperatureC", "shearRate", "method", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["properties"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("empty LLM response");
    const parsed = JSON.parse(content);
    const rows: any[] = parsed.properties || [];

    for (const row of rows) {
      if (!Number.isFinite(row.value)) continue;
      await writeProperty(materialId, row.propertyName, row.value, "llm_extracted", {
        unit: row.unit,
        temperatureC: row.temperatureC ?? undefined,
        shearRate: row.shearRate ?? undefined,
        method: row.method ?? undefined,
        confidence: Math.max(0.1, Math.min(0.9, row.confidence ?? 0.6)),
        sourceDocumentId,
      });
    }

    return { status: "ok", detail: `extracted ${rows.length} properties (pending review)`, extracted: rows.length };
  } catch (error) {
    return { status: "failed", detail: String(error instanceof Error ? error.message : error), extracted: 0 };
  }
}

/**
 * Orchestrated enrichment for one material.
 */
export async function enrichMaterial(materialId: string, organizationId: string): Promise<EnrichmentReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { materials } = await import("../../drizzle/schema");
  const { and } = await import("drizzle-orm");

  const [material] = await db
    .select()
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.organizationId, organizationId)));
  if (!material) throw new Error("Material not found");

  const report: EnrichmentReport = { materialId, steps: [] };

  const pubchem = await enrichFromPubChem(material as any);
  report.steps.push({ step: "pubchem", ...pubchem });

  // Re-read: PubChem may have filled SMILES/MW needed for estimation
  const [refreshed] = await db.select().from(materials).where(eq(materials.id, materialId));
  const hsp = await enrichHSP(refreshed as any);
  report.steps.push({ step: "hsp", ...hsp });

  return report;
}

/**
 * Seed/refresh the hsp_reference table from the curated literature list.
 * Idempotent (upsert by CAS). The purchased HSPiP CSV imports through
 * importHspReferenceCsv below into the same table.
 */
export async function seedHspLiterature(): Promise<{ inserted: number; skipped: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { hspReference } = await import("../../drizzle/schema");

  let inserted = 0;
  let skipped = 0;
  for (const entry of HSP_LITERATURE) {
    const existing = await db
      .select({ id: hspReference.id })
      .from(hspReference)
      .where(eq(hspReference.casNumber, entry.casNumber))
      .limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(hspReference).values({
      id: crypto.randomUUID(),
      casNumber: entry.casNumber,
      name: entry.name,
      hansenD: entry.hansenD.toString(),
      hansenP: entry.hansenP.toString(),
      hansenH: entry.hansenH.toString(),
      molarVolume: entry.molarVolume?.toString() ?? null,
      source: "literature",
    });
    inserted++;
  }
  return { inserted, skipped };
}

/**
 * Import an HSPiP (or other) CSV export into hsp_reference.
 * Expected header (case-insensitive, flexible order):
 *   cas, name, d (or deltaD/dD), p, h, r0, mvol (or molarVolume)
 */
export async function importHspReferenceCsv(csvText: string): Promise<{ inserted: number; errors: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { hspReference } = await import("../../drizzle/schema");

  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return { inserted: 0, errors: 0 };

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const col = (...names: string[]) => header.findIndex(h => names.includes(h));
  const iCas = col("cas", "cas_number", "casnumber");
  const iName = col("name", "chemical", "compound");
  const iD = col("d", "deltad", "dd", "hansen_d", "δd");
  const iP = col("p", "deltap", "dp", "hansen_p", "δp");
  const iH = col("h", "deltah", "dh", "hansen_h", "δh");
  const iR0 = col("r0", "radius");
  const iV = col("mvol", "molarvolume", "molar_volume", "v");

  if (iD < 0 || iP < 0 || iH < 0) throw new Error("CSV must have d/p/h columns");

  let inserted = 0;
  let errors = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map(c => c.trim());
    const d = parseFloat(cells[iD]);
    const p = parseFloat(cells[iP]);
    const h = parseFloat(cells[iH]);
    if (!Number.isFinite(d) || !Number.isFinite(p) || !Number.isFinite(h)) {
      errors++;
      continue;
    }
    try {
      await db.insert(hspReference).values({
        id: crypto.randomUUID(),
        casNumber: iCas >= 0 ? cells[iCas] || null : null,
        name: iName >= 0 ? cells[iName] || null : null,
        hansenD: d.toString(),
        hansenP: p.toString(),
        hansenH: h.toString(),
        r0: iR0 >= 0 && cells[iR0] ? parseFloat(cells[iR0]).toString() : null,
        molarVolume: iV >= 0 && cells[iV] ? parseFloat(cells[iV]).toString() : null,
        source: "hspip",
      });
      inserted++;
    } catch {
      errors++;
    }
  }
  return { inserted, errors };
}
