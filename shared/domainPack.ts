/**
 * Domain Pack — the typed configuration that turns a chemistry vertical
 * ("UV Inks & Coatings") from a dropdown string into a scientific
 * configuration: ingredient function taxonomy, property definitions with
 * standard test methods, physics constraints, validation rules, and
 * domain-expert LLM prompts.
 *
 * Stored as JSON in `domains.config` (validated by this Zod schema at load
 * time), with relational seed data (reference materials, standard test
 * conditions, compliance datasets) installed by scripts/install-domain-pack.mjs.
 */
import { z } from "zod";

export const packFunctionSchema = z.object({
  key: z.string(), // canonical function key stored on materials.materialFunction
  name: z.string(),
  description: z.string().optional(),
  /** typical mass-% range in a formulation of this domain */
  typicalRange: z.tuple([z.number(), z.number()]).optional(),
  required: z.boolean().default(false),
});

export const packPropertySchema = z.object({
  key: z.string(), // canonical property name used in predictions/trials
  name: z.string(),
  unit: z.string(),
  /** standard test method, e.g. "ASTM D2196 (Brookfield, 25°C)" */
  testMethod: z.string().optional(),
  typicalRange: z.tuple([z.number(), z.number()]).optional(),
  /** measurement coefficient of variation (fraction) — honest σ floor */
  cvMeasurement: z.number().optional(),
  /** canonical physics-model key when a deterministic model covers it */
  physicsModel: z.string().optional(),
});

export const packConstraintSchema = z.object({
  key: z.string(),
  description: z.string(),
  /** free-form parameters consumed by the named check */
  params: z.record(z.string(), z.any()).default({}),
  severity: z.enum(["info", "warning", "error"]).default("warning"),
});

export const packValidationRulesSchema = z.object({
  compositionSumTolerance: z.number().default(0.1),
  /** per-function min/max mass-% (hard editor warnings) */
  functionLimits: z
    .record(z.string(), z.object({ min: z.number().optional(), max: z.number().optional() }))
    .default({}),
  /** pairs of function keys that must not co-occur */
  incompatibleFunctions: z.array(z.tuple([z.string(), z.string()])).default([]),
});

export const domainPackSchema = z.object({
  packVersion: z.literal(1),
  key: z.string(), // matches domains.key
  name: z.string(),
  description: z.string().optional(),
  functions: z.array(packFunctionSchema),
  properties: z.array(packPropertySchema),
  physicsConstraints: z.array(packConstraintSchema).default([]),
  validationRules: packValidationRulesSchema.default({
    compositionSumTolerance: 0.1,
    functionLimits: {},
    incompatibleFunctions: [],
  }),
  /** LLM system prompt fragments */
  expertPrompts: z
    .object({
      domainExpert: z.string().optional(),
      claimTranslation: z.string().optional(),
    })
    .default({}),
  /** compliance template ids (complianceTemplates.ts) auto-activated with the pack */
  complianceTemplateIds: z.array(z.string()).default([]),
  /** standard test condition sets seeded with the pack */
  standardTestConditionSets: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        parameters: z.array(
          z.object({ parameterName: z.string(), parameterValue: z.string(), unit: z.string().optional() })
        ),
      })
    )
    .default([]),
  /** generic reference materials seeded with the pack (org-agnostic starting library) */
  referenceMaterials: z
    .array(
      z.object({
        code: z.string(),
        name: z.string(),
        casNumber: z.string().optional(),
        materialFunction: z.string(),
        subFunction: z.string().optional(),
        density: z.number().optional(),
        viscosity: z.number().optional(),
        molecularWeight: z.number().optional(),
        glassTransitionTemp: z.number().optional(),
        hansenD: z.number().optional(),
        hansenP: z.number().optional(),
        hansenH: z.number().optional(),
        solidsContent: z.number().optional(),
        functionality: z.number().optional(),
        equivalentWeight: z.number().optional(),
        oilAbsorption: z.number().optional(),
        particleSizeD50: z.number().optional(),
        refractiveIndex: z.number().optional(),
        hlb: z.number().optional(),
        molarVolume: z.number().optional(),
        costPerKg: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .default([]),
});

export type DomainPackConfig = z.infer<typeof domainPackSchema>;
export type PackFunction = z.infer<typeof packFunctionSchema>;
export type PackProperty = z.infer<typeof packPropertySchema>;
