/**
 * Domain Pack Service — loads and serves validated pack configs.
 *
 * Packs are TypeScript source (reviewable in git, server/packs/*.pack.ts).
 * Installation copies the config into `domains.config` and seeds relational
 * data; at runtime we prefer the in-repo pack (source of truth) and fall
 * back to whatever is stored in domains.config.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { domainPackSchema, type DomainPackConfig, type PackFunction, type PackProperty } from "../../shared/domainPack";
import { UV_INKS_PACK } from "../packs/uv_inks.pack";
import { WB_EMULSIONS_PACK } from "../packs/wb_emulsions.pack";
import { PERSONAL_CARE_PACK } from "../packs/personal_care.pack";

/** In-repo registry — the authoritative pack definitions */
export const PACK_REGISTRY: Record<string, DomainPackConfig> = {
  uv_inks: UV_INKS_PACK,
  wb_emulsions: WB_EMULSIONS_PACK,
  personal_care: PERSONAL_CARE_PACK,
};

const cache = new Map<string, DomainPackConfig | null>();

/**
 * Load the pack for a domain id (or key). Returns null when the domain has
 * no pack — callers degrade to unpacked behavior.
 */
export async function loadPackForDomain(domainIdOrKey: string): Promise<DomainPackConfig | null> {
  if (cache.has(domainIdOrKey)) return cache.get(domainIdOrKey)!;

  let pack: DomainPackConfig | null = null;

  // Direct key hit in the registry
  if (PACK_REGISTRY[domainIdOrKey]) {
    pack = PACK_REGISTRY[domainIdOrKey];
  } else {
    // Resolve domain row → key → registry, else validate stored config
    const db = await getDb();
    if (db) {
      try {
        const { domains } = await import("../../drizzle/schema");
        const [row] = await db.select().from(domains).where(eq(domains.id, domainIdOrKey));
        if (row) {
          if (PACK_REGISTRY[row.key]) {
            pack = PACK_REGISTRY[row.key];
          } else if (row.config && (row.config as any).packVersion) {
            const parsed = domainPackSchema.safeParse(row.config);
            pack = parsed.success ? parsed.data : null;
            if (!parsed.success) {
              console.warn(`[DomainPack] stored config for domain ${row.key} failed validation:`, parsed.error.issues.slice(0, 3));
            }
          }
        }
      } catch (error) {
        console.warn("[DomainPack] load failed:", error);
      }
    }
  }

  cache.set(domainIdOrKey, pack);
  return pack;
}

export function getFunctions(pack: DomainPackConfig): PackFunction[] {
  return pack.functions;
}

export function getProperty(pack: DomainPackConfig, key: string): PackProperty | undefined {
  return pack.properties.find(p => p.key === key);
}

/**
 * Pack-driven composition validation: per-function limits, required
 * functions, incompatible pairs. Returns editor-grade messages.
 */
export function validateAgainstPack(
  pack: DomainPackConfig,
  components: Array<{ materialFunction?: string | null; percentage: number; materialName: string }>
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const byFunction = new Map<string, number>();
  for (const c of components) {
    if (!c.materialFunction) continue;
    byFunction.set(c.materialFunction, (byFunction.get(c.materialFunction) || 0) + c.percentage);
  }

  // Required functions
  for (const fn of pack.functions.filter(f => f.required)) {
    if (!byFunction.has(fn.key) || byFunction.get(fn.key)! <= 0) {
      errors.push(`Missing required function: ${fn.name} (${fn.key})`);
    }
  }

  // Function limits
  for (const [fnKey, limits] of Object.entries(pack.validationRules.functionLimits)) {
    const total = byFunction.get(fnKey) || 0;
    const fn = pack.functions.find(f => f.key === fnKey);
    const label = fn?.name || fnKey;
    if (limits.min !== undefined && total > 0 && total < limits.min) {
      warnings.push(`${label}: ${total.toFixed(2)}% is below the domain minimum ${limits.min}%`);
    }
    if (limits.max !== undefined && total > limits.max) {
      warnings.push(`${label}: ${total.toFixed(2)}% exceeds the domain maximum ${limits.max}%`);
    }
  }

  // Typical-range advisories
  for (const fn of pack.functions) {
    if (!fn.typicalRange) continue;
    const total = byFunction.get(fn.key) || 0;
    if (total > 0 && (total < fn.typicalRange[0] || total > fn.typicalRange[1])) {
      warnings.push(
        `${fn.name}: ${total.toFixed(2)}% is outside the typical range ${fn.typicalRange[0]}–${fn.typicalRange[1]}% for this domain`
      );
    }
  }

  // Incompatible function pairs
  for (const [a, b] of pack.validationRules.incompatibleFunctions) {
    if (byFunction.has(a) && byFunction.has(b)) {
      warnings.push(`Functions ${a} and ${b} are flagged incompatible in this domain`);
    }
  }

  return { errors, warnings };
}
