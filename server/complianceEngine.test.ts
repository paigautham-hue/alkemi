/**
 * Compliance Engine — rule evaluation tests
 *
 * Regression coverage for two silent-failure bugs:
 * 1. The engine read `formulation_components.weightPercent` while the schema
 *    column is `percentage` → parseFloat(undefined) = NaN → every
 *    concentration/total-limit comparison was false → rules never fired.
 * 2. The engine read `ruleLogic.bannedCAS`/`bannedNames` (arrays) while every
 *    shipped template writes `substanceCAS`/`substanceName` (scalars) → all
 *    banned-substance template rules were dead on arrival.
 */
import { describe, it, expect } from "vitest";
import { evaluateRule } from "./complianceEngine";
import { COMPLIANCE_TEMPLATES } from "./complianceTemplates";

/** Build a component row shaped like the drizzle innerJoin result. */
function component(opts: {
  casNumber?: string | null;
  name: string;
  category?: string | null;
  percentage: string | number;
}) {
  return {
    formulation_components: { percentage: String(opts.percentage) },
    materials: {
      casNumber: opts.casNumber ?? null,
      name: opts.name,
      category: opts.category ?? null,
    },
  };
}

function rule(ruleType: string, ruleLogic: Record<string, unknown>) {
  return {
    id: "test-rule",
    ruleName: "Test Rule",
    ruleType,
    ruleLogic,
    severity: "error",
  };
}

const dataset = { id: "test-dataset" };
const formulation = { id: "test-formulation" };

describe("banned_substance", () => {
  it("fires on template-form ruleLogic (scalar substanceCAS)", () => {
    // Exactly the shape complianceTemplates.ts ships (Lead Acetate Ban)
    const r = rule("banned_substance", {
      substanceCAS: "301-04-2",
      substanceName: "Lead Acetate",
    });
    const components = [
      component({ casNumber: "301-04-2", name: "Lead acetate trihydrate", percentage: 1 }),
    ];
    const violation = evaluateRule(r, dataset, formulation, components);
    expect(violation).not.toBeNull();
    expect(violation!.severity).toBe("error");
    expect(violation!.affectedComponents).toContain("Lead acetate trihydrate");
  });

  it("fires on legacy array-form ruleLogic (bannedCAS)", () => {
    const r = rule("banned_substance", { bannedCAS: ["50-00-0"], bannedNames: [] });
    const components = [component({ casNumber: "50-00-0", name: "Formaldehyde", percentage: 0.1 })];
    expect(evaluateRule(r, dataset, formulation, components)).not.toBeNull();
  });

  it("matches by substance name when CAS differs", () => {
    const r = rule("banned_substance", { substanceName: "Mercury" });
    const components = [component({ casNumber: "1344-48-5", name: "Mercury sulfide", percentage: 0.5 })];
    expect(evaluateRule(r, dataset, formulation, components)).not.toBeNull();
  });

  it("passes clean formulations", () => {
    const r = rule("banned_substance", { substanceCAS: "301-04-2", substanceName: "Lead Acetate" });
    const components = [component({ casNumber: "13463-67-7", name: "Titanium Dioxide", percentage: 20 })];
    expect(evaluateRule(r, dataset, formulation, components)).toBeNull();
  });

  it("skips (null) on shapes with no material identifier (e.g. cmrCategory)", () => {
    const r = rule("banned_substance", { cmrCategory: ["1A", "1B"] });
    const components = [component({ casNumber: "50-00-0", name: "Formaldehyde", percentage: 0.1 })];
    expect(evaluateRule(r, dataset, formulation, components)).toBeNull();
  });
});

describe("concentration_limit", () => {
  it("fires when percentage exceeds the limit (regression: percentage column, not weightPercent)", () => {
    // FDA Methanol rule shape from templates
    const r = rule("concentration_limit", {
      substanceCAS: "67-56-1",
      substanceName: "Methanol",
      maxConcentration: 0.2,
      unit: "percent",
    });
    const components = [component({ casNumber: "67-56-1", name: "Methanol", percentage: "0.5" })];
    const violation = evaluateRule(r, dataset, formulation, components);
    expect(violation).not.toBeNull();
    expect(violation!.message).toContain("0.5");
  });

  it("does not fire below the limit", () => {
    const r = rule("concentration_limit", {
      substanceCAS: "67-56-1",
      maxConcentration: 0.2,
    });
    const components = [component({ casNumber: "67-56-1", name: "Methanol", percentage: "0.1" })];
    expect(evaluateRule(r, dataset, formulation, components)).toBeNull();
  });

  it("matches by substanceClass keyword (parabens template shape)", () => {
    const r = rule("concentration_limit", {
      substanceClass: "Paraben",
      maxConcentration: 0.4,
      unit: "percent",
    });
    const components = [component({ casNumber: "99-76-3", name: "Methylparaben", percentage: "0.6" })];
    expect(evaluateRule(r, dataset, formulation, components)).not.toBeNull();
  });

  it("skips (null) when ruleLogic has no limit or no identifier", () => {
    expect(
      evaluateRule(rule("concentration_limit", { substanceCAS: "67-56-1" }), dataset, formulation, [
        component({ casNumber: "67-56-1", name: "Methanol", percentage: 99 }),
      ])
    ).toBeNull();
    expect(
      evaluateRule(rule("concentration_limit", { maxConcentration: 1 }), dataset, formulation, [
        component({ casNumber: "67-56-1", name: "Methanol", percentage: 99 }),
      ])
    ).toBeNull();
  });
});

describe("total_limit", () => {
  it("sums matching components by percentage and fires over the cap", () => {
    const r = rule("total_limit", { substanceClass: "Phthalate", maxTotalConcentration: 0.1 });
    const components = [
      component({ casNumber: "84-74-2", name: "Dibutyl Phthalate", percentage: "0.08" }),
      component({ casNumber: "117-81-7", name: "DEHP Phthalate", percentage: "0.07" }),
      component({ casNumber: "7732-18-5", name: "Water", percentage: "99.85" }),
    ];
    const violation = evaluateRule(r, dataset, formulation, components);
    expect(violation).not.toBeNull();
    expect(violation!.message).toContain("0.15");
  });

  it("skips (null) product-level shapes it cannot evaluate (VOC g/L)", () => {
    const r = rule("total_limit", { productCategory: "Flat Coating", maxVOC: 50, unit: "g/L" });
    const components = [component({ name: "Butyl Acetate", casNumber: "123-86-4", percentage: 30 })];
    expect(evaluateRule(r, dataset, formulation, components)).toBeNull();
  });
});

describe("required_component", () => {
  it("fires when a required component is missing", () => {
    const r = rule("required_component", { requiredName: "Preservative", minConcentration: 0.1 });
    const components = [component({ name: "Water", casNumber: "7732-18-5", percentage: 99 })];
    expect(evaluateRule(r, dataset, formulation, components)).not.toBeNull();
  });

  it("passes when present at sufficient concentration (percentage column)", () => {
    const r = rule("required_component", { requiredName: "Preservative", minConcentration: 0.1 });
    const components = [component({ name: "Preservative X", casNumber: "1", percentage: "0.2" })];
    expect(evaluateRule(r, dataset, formulation, components)).toBeNull();
  });

  it("skips (null) property-check shapes", () => {
    const r = rule("required_component", { propertyCheck: "nanomaterial", requiresLabeling: true });
    expect(evaluateRule(r, dataset, formulation, [])).toBeNull();
  });
});

describe("incompatible_combination", () => {
  it("fires on legacy pair-array form", () => {
    const r = rule("incompatible_combination", { incompatiblePairs: [["Silicone", "Clearcoat"]] });
    const components = [
      component({ name: "Silicone Additive", casNumber: "63148-62-9", percentage: 1 }),
      component({ name: "Acrylic Clearcoat Resin", casNumber: "9011-14-7", percentage: 50 }),
    ];
    expect(evaluateRule(r, dataset, formulation, components)).not.toBeNull();
  });

  it("fires on template scalar form (substanceClass + incompatibleWith)", () => {
    const r = rule("incompatible_combination", {
      substanceClass: "Silicone",
      incompatibleWith: "Automotive Clearcoat",
    });
    const components = [
      component({ name: "Silicone Defoamer", casNumber: "63148-62-9", percentage: 0.5 }),
      component({ name: "Automotive Clearcoat Base", casNumber: "9011-14-7", percentage: 60 }),
    ];
    expect(evaluateRule(r, dataset, formulation, components)).not.toBeNull();
  });

  it("does not throw on malformed ruleLogic", () => {
    const r = rule("incompatible_combination", {});
    expect(evaluateRule(r, dataset, formulation, [])).toBeNull();
  });
});

describe("template ↔ engine contract", () => {
  it("template ids are unique", () => {
    const ids = COMPLIANCE_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no shipped template rule throws during evaluation", () => {
    const components = [
      component({ casNumber: "50-00-0", name: "Formaldehyde", percentage: "5" }),
      component({ casNumber: "7439-97-6", name: "Mercury", percentage: "5" }),
      component({ name: "Dibutyl Phthalate", casNumber: "84-74-2", percentage: "5" }),
    ];
    for (const template of COMPLIANCE_TEMPLATES) {
      for (const tRule of template.rules) {
        expect(() =>
          evaluateRule(
            { id: "x", ruleName: tRule.ruleName, ruleType: tRule.ruleType, ruleLogic: tRule.ruleLogic, severity: tRule.severity },
            dataset,
            formulation,
            components
          )
        ).not.toThrow();
      }
    }
  });

  it("every CAS-identified banned/limit template rule actually fires on a violating formulation", () => {
    // The core contract: a rule that names a CAS must detect that CAS.
    let firedCount = 0;
    for (const template of COMPLIANCE_TEMPLATES) {
      for (const tRule of template.rules) {
        const logic: any = tRule.ruleLogic;
        const cas = logic.substanceCAS;
        if (!cas) continue;
        if (tRule.ruleType !== "banned_substance" && tRule.ruleType !== "concentration_limit") continue;

        // Build a formulation that violates this specific rule
        const pct =
          tRule.ruleType === "concentration_limit" ? (Number(logic.maxConcentration) || 0) + 1 : 1;
        const components = [
          component({ casNumber: cas, name: logic.substanceName || "Test Substance", percentage: pct }),
        ];
        const violation = evaluateRule(
          { id: "x", ruleName: tRule.ruleName, ruleType: tRule.ruleType, ruleLogic: logic, severity: tRule.severity },
          dataset,
          formulation,
          components
        );
        expect(violation, `${template.id} / ${tRule.ruleName} should fire`).not.toBeNull();
        firedCount++;
      }
    }
    // Sanity: the loop actually exercised a meaningful number of rules
    expect(firedCount).toBeGreaterThanOrEqual(10);
  });
});
