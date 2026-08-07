/**
 * Material Resolver — builds the numeric MaterialView that physics models
 * consume, resolving each property across sources by trust precedence:
 *
 *   measured > supplier_tds > hspip/pubchem > group_contribution > llm_extracted > manual
 *
 * Values on the `materials` row itself are the hot-path defaults (treated as
 * source "manual" unless a material_properties row overrides them). Qualified
 * values (temperature/shear) resolve to the nearest-temperature match.
 * Every resolved property carries its provenance so predictions can cite it.
 */
import { getDb } from "../db";
import { eq, inArray } from "drizzle-orm";

export type PropertySource =
  | "measured"
  | "supplier_tds"
  | "pubchem"
  | "hspip"
  | "group_contribution"
  | "llm_extracted"
  | "manual";

const SOURCE_PRECEDENCE: Record<PropertySource, number> = {
  measured: 6,
  supplier_tds: 5,
  hspip: 4,
  pubchem: 4,
  group_contribution: 3,
  llm_extracted: 2,
  manual: 1,
};

export interface ResolvedProperty {
  value: number;
  unit?: string;
  source: PropertySource;
  temperatureC?: number;
  uncertainty?: number;
  confidence: number;
}

export interface MaterialView {
  id: string;
  name: string;
  code: string;
  casNumber?: string | null;
  materialFunction?: string | null;
  subFunction?: string | null;
  /** Resolved numeric properties keyed by canonical property name */
  properties: Record<string, ResolvedProperty>;
  /** Convenience accessors for the hot-path physics inputs */
  density?: number;
  viscosity?: number;
  molecularWeight?: number;
  refractiveIndex?: number;
  glassTransitionTemp?: number;
  hansenD?: number;
  hansenP?: number;
  hansenH?: number;
  hansenR0?: number;
  molarVolume?: number;
  solidsContent?: number;
  functionality?: number;
  equivalentWeight?: number;
  particleSizeD50?: number;
  oilAbsorption?: number;
  hlb?: number;
  surfaceTension?: number;
  costPerKg?: number;
}

/** Typed columns on the materials row that map to canonical property names */
const ROW_PROPERTY_COLUMNS: Array<[string, string]> = [
  ["density", "density"],
  ["viscosity", "viscosity"],
  ["molecularWeight", "molecular_weight"],
  ["refractiveIndex", "refractive_index"],
  ["glassTransitionTemp", "glass_transition_temp"],
  ["hansenD", "hansen_d"],
  ["hansenP", "hansen_p"],
  ["hansenH", "hansen_h"],
  ["hansenR0", "hansen_r0"],
  ["molarVolume", "molar_volume"],
  ["solidsContent", "solids_content"],
  ["functionality", "functionality"],
  ["equivalentWeight", "equivalent_weight"],
  ["particleSizeD50", "particle_size_d50"],
  ["oilAbsorption", "oil_absorption"],
  ["hlb", "hlb"],
  ["surfaceTension", "surface_tension"],
  ["costPerKg", "cost_per_kg"],
];

function num(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const parsed = parseFloat(String(v));
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Pick the best property row for a canonical property:
 * 1. Highest source precedence (human-approved `isPreferred` outranks all)
 * 2. Among equals: nearest to the target temperature (default 25°C)
 * 3. Among equals: highest confidence, then newest
 */
export function pickBest(
  rows: Array<{
    value: string | number;
    unit?: string | null;
    source: PropertySource;
    temperatureC?: string | number | null;
    uncertainty?: string | number | null;
    confidence?: string | number | null;
    isPreferred?: boolean | null;
    createdAt?: Date | string | null;
  }>,
  targetTempC = 25
): ResolvedProperty | undefined {
  if (rows.length === 0) return undefined;

  const scored = rows.map(r => {
    const temp = num(r.temperatureC);
    return {
      row: r,
      preferred: r.isPreferred ? 1 : 0,
      precedence: SOURCE_PRECEDENCE[r.source] ?? 0,
      tempDistance: temp === undefined ? 5 : Math.abs(temp - targetTempC), // unqualified ≈ 5°C penalty
      confidence: num(r.confidence) ?? 0.8,
      createdAt: r.createdAt ? new Date(r.createdAt).getTime() : 0,
    };
  });

  scored.sort((a, b) =>
    b.preferred - a.preferred ||
    b.precedence - a.precedence ||
    a.tempDistance - b.tempDistance ||
    b.confidence - a.confidence ||
    b.createdAt - a.createdAt
  );

  const best = scored[0].row;
  const value = num(best.value);
  if (value === undefined) return undefined;

  return {
    value,
    unit: best.unit ?? undefined,
    source: best.source,
    temperatureC: num(best.temperatureC),
    uncertainty: num(best.uncertainty),
    confidence: num(best.confidence) ?? 0.8,
  };
}

/**
 * Resolve MaterialViews for a set of materials (one DB round trip for the
 * property table). `targetTempC` selects among temperature-qualified values.
 */
export async function resolveMaterials(
  materialRows: any[],
  targetTempC = 25
): Promise<MaterialView[]> {
  const db = await getDb();
  const { materialProperties } = await import("../../drizzle/schema");

  const ids = materialRows.map(m => m.id).filter(Boolean);
  let propRows: any[] = [];
  if (db && ids.length > 0) {
    try {
      propRows = await db
        .select()
        .from(materialProperties)
        .where(inArray(materialProperties.materialId, ids));
    } catch (error) {
      // Pre-migration DB without material_properties — resolve from row columns only
      console.warn("[MaterialResolver] material_properties unavailable:", error);
    }
  }

  const propsByMaterial = new Map<string, Map<string, any[]>>();
  for (const row of propRows) {
    if (!propsByMaterial.has(row.materialId)) propsByMaterial.set(row.materialId, new Map());
    const byProp = propsByMaterial.get(row.materialId)!;
    if (!byProp.has(row.propertyName)) byProp.set(row.propertyName, []);
    byProp.get(row.propertyName)!.push(row);
  }

  return materialRows.map(m => {
    const view: MaterialView = {
      id: m.id,
      name: m.name,
      code: m.code,
      casNumber: m.casNumber,
      materialFunction: m.materialFunction,
      subFunction: m.subFunction,
      properties: {},
    };

    // 1. Baseline from the typed row columns (source: manual)
    for (const [camel, canonical] of ROW_PROPERTY_COLUMNS) {
      const value = num(m[camel]);
      if (value !== undefined) {
        view.properties[canonical] = { value, source: "manual", confidence: 0.7 };
      }
    }

    // 2. Override with better-sourced material_properties rows
    const byProp = propsByMaterial.get(m.id);
    if (byProp) {
      byProp.forEach((rows, propertyName) => {
        const best = pickBest(rows, targetTempC);
        if (!best) return;
        const existing = view.properties[propertyName];
        if (!existing || SOURCE_PRECEDENCE[best.source] >= SOURCE_PRECEDENCE[existing.source]) {
          view.properties[propertyName] = best;
        }
      });
    }

    // 3. Populate convenience accessors from resolved properties
    for (const [camel, canonical] of ROW_PROPERTY_COLUMNS) {
      const resolved = view.properties[canonical];
      if (resolved) (view as any)[camel] = resolved.value;
    }

    return view;
  });
}
