/**
 * Domain packs — schema validity of shipped packs + pack-driven validation.
 */
import { describe, it, expect } from "vitest";
import { domainPackSchema } from "../../shared/domainPack";
import { UV_INKS_PACK } from "../packs/uv_inks.pack";
import { WB_EMULSIONS_PACK } from "../packs/wb_emulsions.pack";
import { PERSONAL_CARE_PACK } from "../packs/personal_care.pack";
import { validateAgainstPack } from "./domainPackService";

describe("shipped packs validate against the schema", () => {
  for (const pack of [UV_INKS_PACK, WB_EMULSIONS_PACK, PERSONAL_CARE_PACK]) {
    it(`${pack.key} parses`, () => {
      const result = domainPackSchema.safeParse(pack);
      if (!result.success) {
        throw new Error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
      }
      expect(result.success).toBe(true);
    });
  }

  it("pack function keys are unique and referenced limits exist", () => {
    for (const pack of [UV_INKS_PACK, WB_EMULSIONS_PACK, PERSONAL_CARE_PACK]) {
      const keys = pack.functions.map(f => f.key);
      expect(new Set(keys).size, pack.key).toBe(keys.length);
      for (const limitKey of Object.keys(pack.validationRules.functionLimits)) {
        expect(keys, `${pack.key}: limit references unknown function ${limitKey}`).toContain(limitKey);
      }
      // Every reference material's function key must exist in the taxonomy
      for (const ref of pack.referenceMaterials) {
        expect(keys, `${pack.key}: ${ref.code} uses unknown function ${ref.materialFunction}`).toContain(
          ref.materialFunction
        );
      }
    }
  });
});

describe("validateAgainstPack (UV Inks)", () => {
  const parsed = domainPackSchema.parse(UV_INKS_PACK);

  it("flags a missing photoinitiator as an error", () => {
    const result = validateAgainstPack(parsed, [
      { materialFunction: "oligomer", percentage: 60, materialName: "Epoxy acrylate" },
      { materialFunction: "monomer_diluent", percentage: 40, materialName: "TPGDA" },
    ]);
    expect(result.errors.some(e => e.toLowerCase().includes("photoinitiator"))).toBe(true);
  });

  it("passes a sane UV varnish composition", () => {
    const result = validateAgainstPack(parsed, [
      { materialFunction: "oligomer", percentage: 45, materialName: "Epoxy acrylate" },
      { materialFunction: "monomer_diluent", percentage: 45, materialName: "TPGDA" },
      { materialFunction: "photoinitiator", percentage: 4, materialName: "TPO" },
      { materialFunction: "wax_slip", percentage: 2, materialName: "Slip" },
      { materialFunction: "stabilizer", percentage: 0.3, materialName: "MEHQ" },
      { materialFunction: "defoamer", percentage: 0.5, materialName: "Defoamer" },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("warns when a function exceeds its domain limit", () => {
    const result = validateAgainstPack(parsed, [
      { materialFunction: "oligomer", percentage: 40, materialName: "Oligomer" },
      { materialFunction: "monomer_diluent", percentage: 40, materialName: "Monomer" },
      { materialFunction: "photoinitiator", percentage: 12, materialName: "TPO" }, // max 10
    ]);
    expect(result.warnings.some(w => w.includes("Photoinitiator") && w.includes("maximum"))).toBe(true);
  });
});
