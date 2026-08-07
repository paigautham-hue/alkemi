/**
 * Domain Pack Installer — idempotent installation of a pack into a database:
 *
 * 1. Upsert the `domains` row (key, name, config = validated pack JSON)
 * 2. Seed reference materials into the target organization (skip existing codes)
 * 3. Seed standard test-condition sets (skip existing names)
 * 4. Activate the pack's compliance templates (skip already-activated)
 * 5. Seed the hsp_reference literature table (global, once)
 *
 * Called from the tRPC admin endpoint; safe to run repeatedly.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { domainPackSchema, type DomainPackConfig } from "../../shared/domainPack";
import { PACK_REGISTRY } from "./domainPackService";
import { activateComplianceTemplate } from "../complianceTemplates";
import { seedHspLiterature } from "./materialEnrichment";

export interface InstallResult {
  packKey: string;
  domainId: string;
  referenceMaterials: { created: number; skipped: number };
  testConditionSets: { created: number; skipped: number };
  complianceTemplates: Array<{ id: string; status: string }>;
  hspLiterature: { inserted: number; skipped: number };
}

export async function installDomainPack(
  packKey: string,
  organizationId: string,
  createdByUserId: string
): Promise<InstallResult> {
  const pack = PACK_REGISTRY[packKey];
  if (!pack) throw new Error(`Unknown pack: ${packKey}. Available: ${Object.keys(PACK_REGISTRY).join(", ")}`);
  const validated: DomainPackConfig = domainPackSchema.parse(pack);

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const schema = await import("../../drizzle/schema");

  // 1. Upsert domain row
  let [domain] = await db.select().from(schema.domains).where(eq(schema.domains.key, validated.key));
  if (domain) {
    await db
      .update(schema.domains)
      .set({ name: validated.name, description: validated.description, config: validated as any })
      .where(eq(schema.domains.id, domain.id));
  } else {
    const id = crypto.randomUUID();
    await db.insert(schema.domains).values({
      id,
      key: validated.key,
      name: validated.name,
      description: validated.description,
      config: validated as any,
      isActive: true,
    });
    [domain] = await db.select().from(schema.domains).where(eq(schema.domains.id, id));
  }
  const domainId = domain!.id;

  // Ensure org↔domain link
  const existingLink = await db
    .select()
    .from(schema.organizationDomains)
    .where(
      and(
        eq(schema.organizationDomains.organizationId, organizationId),
        eq(schema.organizationDomains.domainId, domainId)
      )
    );
  if (existingLink.length === 0) {
    await db.insert(schema.organizationDomains).values({ organizationId, domainId });
  }

  // 2. Reference materials (skip existing org+code)
  let matCreated = 0;
  let matSkipped = 0;
  for (const ref of validated.referenceMaterials) {
    const existing = await db
      .select({ id: schema.materials.id })
      .from(schema.materials)
      .where(and(eq(schema.materials.organizationId, organizationId), eq(schema.materials.code, ref.code)));
    if (existing.length > 0) {
      matSkipped++;
      continue;
    }
    await db.insert(schema.materials).values({
      id: crypto.randomUUID(),
      organizationId,
      domainId,
      code: ref.code,
      name: ref.name,
      casNumber: ref.casNumber ?? null,
      category: ref.materialFunction,
      materialFunction: ref.materialFunction,
      subFunction: ref.subFunction ?? null,
      density: ref.density?.toString() ?? null,
      viscosity: ref.viscosity?.toString() ?? null,
      molecularWeight: ref.molecularWeight?.toString() ?? null,
      glassTransitionTemp: ref.glassTransitionTemp?.toString() ?? null,
      refractiveIndex: ref.refractiveIndex?.toString() ?? null,
      hansenD: ref.hansenD?.toString() ?? null,
      hansenP: ref.hansenP?.toString() ?? null,
      hansenH: ref.hansenH?.toString() ?? null,
      solidsContent: ref.solidsContent?.toString() ?? null,
      functionality: ref.functionality?.toString() ?? null,
      equivalentWeight: ref.equivalentWeight?.toString() ?? null,
      oilAbsorption: ref.oilAbsorption?.toString() ?? null,
      particleSizeD50: ref.particleSizeD50?.toString() ?? null,
      costPerKg: ref.costPerKg?.toString() ?? null,
      metadata: { source: "domain_pack", packKey: validated.key, notes: ref.notes },
      isActive: true,
    });
    matCreated++;
  }

  // 3. Standard test condition sets (skip existing org+name)
  let tcCreated = 0;
  let tcSkipped = 0;
  for (const setDef of validated.standardTestConditionSets) {
    const existing = await db
      .select({ id: schema.testConditionSets.id, name: schema.testConditionSets.name })
      .from(schema.testConditionSets)
      .where(
        and(
          eq(schema.testConditionSets.organizationId, organizationId),
          eq(schema.testConditionSets.domainId, domainId)
        )
      );
    if (existing.some(s => s.name === setDef.name)) {
      tcSkipped++;
      continue;
    }
    const setId = crypto.randomUUID();
    await db.insert(schema.testConditionSets).values({
      id: setId,
      organizationId,
      domainId,
      name: setDef.name,
      description: setDef.description ?? null,
      isStandard: true,
      createdBy: createdByUserId,
    });
    for (const p of setDef.parameters) {
      await db.insert(schema.testConditionParameters).values({
        id: crypto.randomUUID(),
        testConditionSetId: setId,
        parameterName: p.parameterName,
        parameterValue: p.parameterValue,
        unit: p.unit ?? null,
      });
    }
    tcCreated++;
  }

  // 4. Compliance templates (skip if a dataset for this template already exists)
  const complianceResults: Array<{ id: string; status: string }> = [];
  for (const templateId of validated.complianceTemplateIds) {
    const existing = await db
      .select({ id: schema.complianceDatasets.id, data: schema.complianceDatasets.data })
      .from(schema.complianceDatasets)
      .where(eq(schema.complianceDatasets.organizationId, organizationId));
    const already = existing.some(d => (d.data as any)?.templateId === templateId);
    if (already) {
      complianceResults.push({ id: templateId, status: "already_active" });
      continue;
    }
    const result = await activateComplianceTemplate(templateId, organizationId);
    complianceResults.push({ id: templateId, status: result.success ? "activated" : `failed: ${result.message}` });
  }

  // 5. HSP literature seed (global, idempotent)
  const hsp = await seedHspLiterature();

  return {
    packKey: validated.key,
    domainId,
    referenceMaterials: { created: matCreated, skipped: matSkipped },
    testConditionSets: { created: tcCreated, skipped: tcSkipped },
    complianceTemplates: complianceResults,
    hspLiterature: hsp,
  };
}
