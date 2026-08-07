/**
 * RM Substitution Advisor — ranked alternatives for a raw material.
 *
 * Motivated by Westtek's single-sourcing risk (imported photoinitiators,
 * resins and pigments, mostly from China): given a material, rank candidate
 * substitutes by a transparent composite of
 *
 *   1. HSP compatibility  — Hansen Ra between original and candidate
 *   2. Property distance  — normalized diff over shared numeric properties
 *   3. Cost delta         — candidate cost vs original
 *   4. Supply risk relief — supplier risk score + country diversification
 *
 * Every factor is reported separately; the composite is a screening rank,
 * not a verdict — candidates must be lab-validated (swap-and-clone creates
 * the trial formulation version).
 */
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "../db";
import { calculateHSPDistance } from "../physicsModels";

export interface SubstitutionFactor {
  name: string;
  score: number; // 0–1, higher = better substitute
  detail: string;
}

export interface SubstitutionCandidate {
  materialId: string;
  code: string;
  name: string;
  materialFunction?: string | null;
  supplierName?: string | null;
  supplierCountry?: string | null;
  compositeScore: number; // 0–1
  factors: SubstitutionFactor[];
  cautions: string[];
}

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const parsed = parseFloat(String(v));
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Properties compared for the property-distance factor, with scale for normalization */
const COMPARED_PROPERTIES: Array<{ key: string; scale: number; label: string }> = [
  { key: "density", scale: 1.0, label: "density" },
  { key: "viscosity", scale: 3.0, label: "viscosity (log10)" }, // compared in log space
  { key: "glassTransitionTemp", scale: 40, label: "Tg" },
  { key: "solidsContent", scale: 20, label: "solids" },
  { key: "functionality", scale: 2, label: "functionality" },
  { key: "equivalentWeight", scale: 150, label: "equivalent weight" },
  { key: "hlb", scale: 4, label: "HLB" },
  { key: "refractiveIndex", scale: 0.15, label: "refractive index" },
];

export async function findSubstitutes(
  materialId: string,
  organizationId: string,
  options: { maxResults?: number } = {}
): Promise<{ original: any; candidates: SubstitutionCandidate[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const schema = await import("../../drizzle/schema");

  const [original] = await db
    .select()
    .from(schema.materials)
    .where(and(eq(schema.materials.id, materialId), eq(schema.materials.organizationId, organizationId)));
  if (!original) throw new Error("Material not found");

  // Original's supplier (for country/risk comparison)
  let originalSupplier: any = null;
  if (original.supplierId) {
    [originalSupplier] = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, original.supplierId));
  }

  // Candidates: same function (preferred) or same category, active, not self
  const sameFunctionCandidates = original.materialFunction
    ? await db
        .select({ material: schema.materials, supplier: schema.suppliers })
        .from(schema.materials)
        .leftJoin(schema.suppliers, eq(schema.materials.supplierId, schema.suppliers.id))
        .where(
          and(
            eq(schema.materials.organizationId, organizationId),
            eq(schema.materials.materialFunction, original.materialFunction),
            eq(schema.materials.isActive, true),
            ne(schema.materials.id, materialId)
          )
        )
    : [];

  let candidateRows = sameFunctionCandidates;
  if (candidateRows.length === 0 && original.category) {
    candidateRows = await db
      .select({ material: schema.materials, supplier: schema.suppliers })
      .from(schema.materials)
      .leftJoin(schema.suppliers, eq(schema.materials.supplierId, schema.suppliers.id))
      .where(
        and(
          eq(schema.materials.organizationId, organizationId),
          eq(schema.materials.category, original.category),
          eq(schema.materials.isActive, true),
          ne(schema.materials.id, materialId)
        )
      );
  }

  const originalCost = num(original.costPerKg);

  const candidates: SubstitutionCandidate[] = candidateRows.map(({ material: m, supplier }) => {
    const factors: SubstitutionFactor[] = [];
    const cautions: string[] = [];

    // 1. HSP compatibility
    const asHspMaterial = (row: any) => ({
      id: row.id, name: row.name, code: row.code,
      hansenD: num(row.hansenD) ?? null, hansenP: num(row.hansenP) ?? null, hansenH: num(row.hansenH) ?? null,
    });
    const ra = calculateHSPDistance(asHspMaterial(original), asHspMaterial(m));
    if (ra !== null) {
      // Ra 0 → 1.0; Ra 8 → ~0.2; Ra ≥ 12 → 0
      const score = Math.max(0, 1 - ra / 10);
      factors.push({ name: "hsp_compatibility", score, detail: `Hansen Ra = ${ra.toFixed(1)} MPa^0.5 vs original` });
      if (ra > 8) cautions.push(`High HSP distance (${ra.toFixed(1)}) — solubility/compatibility behavior will differ`);
    } else {
      factors.push({ name: "hsp_compatibility", score: 0.5, detail: "HSP data missing on one side — neutral score" });
      cautions.push("HSP comparison unavailable — enrich Hansen parameters before trusting this ranking");
    }

    // 2. Property distance
    const diffs: string[] = [];
    let distanceSum = 0;
    let comparedCount = 0;
    for (const prop of COMPARED_PROPERTIES) {
      let a = num((original as any)[prop.key]);
      let b = num((m as any)[prop.key]);
      if (a === undefined || b === undefined) continue;
      if (prop.key === "viscosity") {
        if (a <= 0 || b <= 0) continue;
        a = Math.log10(a);
        b = Math.log10(b);
      }
      const d = Math.abs(a - b) / prop.scale;
      distanceSum += Math.min(1, d);
      comparedCount++;
      if (d > 0.5) diffs.push(prop.label);
    }
    if (comparedCount > 0) {
      const score = 1 - distanceSum / comparedCount;
      factors.push({
        name: "property_distance",
        score,
        detail: `${comparedCount} properties compared${diffs.length ? `; large deltas: ${diffs.join(", ")}` : ""}`,
      });
    } else {
      factors.push({ name: "property_distance", score: 0.4, detail: "No comparable numeric properties — enrich data" });
      cautions.push("No overlapping property data — ranking is weak");
    }

    // 3. Cost
    const candidateCost = num(m.costPerKg);
    if (originalCost && candidateCost) {
      const delta = (candidateCost - originalCost) / originalCost;
      // cheaper → >0.5; +50% → 0
      const score = Math.max(0, Math.min(1, 0.5 - delta));
      factors.push({
        name: "cost",
        score,
        detail: `${candidateCost.toFixed(2)}/kg vs ${originalCost.toFixed(2)}/kg (${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(0)}%)`,
      });
    } else {
      factors.push({ name: "cost", score: 0.5, detail: "Cost data incomplete — neutral" });
    }

    // 4. Supply risk relief
    const candidateRisk = supplier ? num(supplier.riskScore) : undefined;
    let supplyScore = 0.5;
    const supplyDetails: string[] = [];
    if (candidateRisk !== undefined) {
      supplyScore = Math.max(0, Math.min(1, 1 - candidateRisk / 100));
      supplyDetails.push(`supplier risk ${candidateRisk}`);
    }
    if (originalSupplier?.country && supplier?.country) {
      if (originalSupplier.country === supplier.country) {
        supplyScore *= 0.7;
        supplyDetails.push(`same country as original (${supplier.country}) — no diversification`);
        cautions.push(`Same sourcing country (${supplier.country}) as the original — does not reduce geographic concentration`);
      } else {
        supplyScore = Math.min(1, supplyScore * 1.2);
        supplyDetails.push(`diversifies from ${originalSupplier.country} to ${supplier.country}`);
      }
    }
    factors.push({ name: "supply_risk", score: supplyScore, detail: supplyDetails.join("; ") || "no supplier data" });

    // Composite: HSP 0.35, properties 0.35, cost 0.15, supply 0.15
    const weights: Record<string, number> = {
      hsp_compatibility: 0.35,
      property_distance: 0.35,
      cost: 0.15,
      supply_risk: 0.15,
    };
    const compositeScore = factors.reduce((s, f) => s + f.score * (weights[f.name] ?? 0), 0);

    return {
      materialId: m.id,
      code: m.code,
      name: m.name,
      materialFunction: m.materialFunction,
      supplierName: supplier?.name ?? null,
      supplierCountry: supplier?.country ?? null,
      compositeScore: Math.round(compositeScore * 1000) / 1000,
      factors,
      cautions,
    };
  });

  candidates.sort((a, b) => b.compositeScore - a.compositeScore);
  return { original, candidates: candidates.slice(0, options.maxResults ?? 10) };
}

/**
 * Swap-and-clone: create a new experimental version of a formulation with
 * one material substituted, preserving all other components. Returns the
 * new version id — caller re-runs prediction/validation on it.
 */
export async function swapAndClone(params: {
  organizationId: string;
  userId: string;
  sourceVersionId: string;
  originalMaterialId: string;
  substituteMaterialId: string;
}): Promise<{ newVersionId: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const schema = await import("../../drizzle/schema");

  const [source] = await db
    .select()
    .from(schema.formulationVersions)
    .where(
      and(
        eq(schema.formulationVersions.id, params.sourceVersionId),
        eq(schema.formulationVersions.organizationId, params.organizationId)
      )
    );
  if (!source) throw new Error("Source version not found");

  const components = await db
    .select()
    .from(schema.formulationComponents)
    .where(eq(schema.formulationComponents.versionId, params.sourceVersionId));
  if (!components.some(c => c.materialId === params.originalMaterialId)) {
    throw new Error("Original material is not a component of the source version");
  }

  const [substitute] = await db
    .select()
    .from(schema.materials)
    .where(
      and(
        eq(schema.materials.id, params.substituteMaterialId),
        eq(schema.materials.organizationId, params.organizationId)
      )
    );
  if (!substitute) throw new Error("Substitute material not found");

  const newVersionId = crypto.randomUUID();
  await db.insert(schema.formulationVersions).values({
    id: newVersionId,
    organizationId: params.organizationId,
    familyId: source.familyId,
    versionNumber: `${source.versionNumber}-sub-${substitute.code}`.slice(0, 32),
    parentVersionId: source.id,
    branchType: "experimental",
    status: "draft",
    targetProperties: source.targetProperties,
    notes: `Substitution trial: ${substitute.name} (${substitute.code}) replacing material ${params.originalMaterialId}`,
    changeReason: "RM substitution advisor",
    createdBy: params.userId,
  });

  for (const c of components) {
    await db.insert(schema.formulationComponents).values({
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      versionId: newVersionId,
      materialId: c.materialId === params.originalMaterialId ? params.substituteMaterialId : c.materialId,
      percentage: c.percentage,
      role: c.role,
      notes: c.materialId === params.originalMaterialId ? "substituted component" : c.notes,
    });
  }

  return { newVersionId };
}
