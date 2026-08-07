/**
 * Waterborne Emulsions & OPV Domain Pack v1
 *
 * Covers acrylic/styrene-acrylic emulsion-based products: aqueous OPV,
 * heat-seal coatings, flexo ink binders, PUD topcoats, opaque polymers
 * (WesttCryl N/J/C/PU/OP lines). The pack models the EMULSION AS A MATERIAL
 * with target properties plus the formulations that use it — emulsion
 * polymerization kinetics are explicitly out of scope.
 */
import type { DomainPackConfig } from "../../shared/domainPack";

export const WB_EMULSIONS_PACK: DomainPackConfig = {
  packVersion: 1,
  key: "wb_emulsions",
  name: "Waterborne Emulsions & OPV",
  description:
    "Water-based emulsion formulations: aqueous OPV, heat-seal, flexo binders, PUD. Physics: Fox Tg ladder, MFFT, solids balance, HSP, Stokes settling.",

  functions: [
    { key: "binder", name: "Emulsion binder", description: "Acrylic/styrene-acrylic/PUD dispersion", typicalRange: [40, 85], required: true },
    { key: "water", name: "Water (dilution)", typicalRange: [0, 40], required: false },
    { key: "coalescent", name: "Coalescent", description: "Film formation below polymer Tg (e.g. texanol)", typicalRange: [0, 8], required: false },
    { key: "wax_slip", name: "Wax emulsion", description: "Slip, rub, water repellency", typicalRange: [0, 10], required: false },
    { key: "defoamer", name: "Defoamer", typicalRange: [0, 1.5], required: false },
    { key: "rheology_modifier", name: "Rheology modifier (thickener)", description: "HEUR/HASE/cellulosic", typicalRange: [0, 3], required: false },
    { key: "wetting_agent", name: "Wetting/levelling agent", typicalRange: [0, 2], required: false },
    { key: "neutralizer", name: "Neutralizer (amine/ammonia)", typicalRange: [0, 2], required: false },
    { key: "preservative", name: "In-can preservative", typicalRange: [0, 0.5], required: false },
    { key: "pigment", name: "Pigment / opacifier", typicalRange: [0, 30], required: false },
    { key: "dispersant", name: "Dispersant", typicalRange: [0, 3], required: false },
    { key: "crosslinker", name: "Crosslinker (aziridine/carbodiimide/AZC)", typicalRange: [0, 5], required: false },
  ],

  properties: [
    { key: "viscosity", name: "Viscosity", unit: "mPa·s", testMethod: "Brookfield LV, 25°C", typicalRange: [50, 5000], cvMeasurement: 0.05, physicsModel: "viscosity" },
    { key: "solids_content", name: "Solids content", unit: "%", testMethod: "ISO 3251, 105°C/1h", typicalRange: [20, 55], cvMeasurement: 0.01 },
    { key: "ph", name: "pH", unit: "pH", testMethod: "pH meter, 25°C", typicalRange: [7, 9.5], cvMeasurement: 0.02 },
    { key: "glass_transition_temp", name: "Tg", unit: "°C", testMethod: "DSC midpoint, 10 K/min", typicalRange: [-40, 110], cvMeasurement: 0.05, physicsModel: "glass_transition_temp" },
    { key: "mfft", name: "MFFT", unit: "°C", testMethod: "ISO 2115 (MFFT bar)", typicalRange: [0, 60], cvMeasurement: 0.08 },
    { key: "gloss_60deg", name: "Gloss @60°", unit: "GU", testMethod: "ASTM D523 on Leneta", cvMeasurement: 0.03 },
    { key: "block_resistance", name: "Block resistance", unit: "rating 0-10", testMethod: "ASTM D4946", cvMeasurement: 0.15 },
    { key: "heat_seal_temp", name: "Heat-seal initiation temp", unit: "°C", testMethod: "Seal bar, 1s/2bar, film-to-film", cvMeasurement: 0.05 },
    { key: "water_resistance", name: "Water resistance (spot)", unit: "rating 0-5", testMethod: "24h water spot", cvMeasurement: 0.15 },
    { key: "opacity_contrast_ratio", name: "Opacity (contrast ratio)", unit: "%", testMethod: "ISO 6504-3 on Leneta", cvMeasurement: 0.02 },
    { key: "particle_size_d50", name: "Particle size D50", unit: "nm", testMethod: "DLS", cvMeasurement: 0.05 },
    { key: "density", name: "Density", unit: "g/cm³", testMethod: "Pycnometer 25°C", cvMeasurement: 0.01, physicsModel: "density" },
  ],

  physicsConstraints: [
    { key: "mass_balance", description: "Composition must sum to 100%", params: { tolerance: 0.1 }, severity: "error" },
    { key: "mfft_vs_application", description: "MFFT must be below application/drying temperature or coalescent is required", params: {}, severity: "warning" },
    { key: "fox_tg_ladder", description: "Blend Tg from Fox equation drives heat-seal vs block-resistance trade-off (J-201/202/203 ladder)", params: {}, severity: "info" },
    { key: "stokes_settling", description: "Dense dispersed particles settle per Stokes law — check storage stability", params: {}, severity: "warning" },
  ],

  validationRules: {
    compositionSumTolerance: 0.1,
    functionLimits: {
      binder: { min: 30 },
      defoamer: { max: 2 },
      preservative: { max: 0.5 },
      coalescent: { max: 10 },
    },
    incompatibleFunctions: [],
  },

  expertPrompts: {
    domainExpert:
      "You are a senior waterborne-emulsion formulator (aqueous OPV, heat-seal coatings, flexo binders, PUDs, opaque polymers). Reason with: Fox-equation Tg of copolymer/blends, MFFT vs coalescent demand and VOC, film formation (particle deformation/coalescence), heat-seal temperature vs Tg, block resistance vs seal-ability trade-off, surfactant/colloid stabilization vs water resistance, ammonia/amine neutralization and pH drift, hard/soft monomer balance. For opaque polymers: void formation on drying, hiding vs TiO₂ replacement ratio.",
    claimTranslation:
      "Translate waterborne coating claims into measurable parameters, e.g. 'low-temperature heat seal' → seal initiation ≤ X°C at 1s/2bar film-to-film; 'high hiding' → contrast ratio ≥ Y% at Z µm wet; 'good block resistance' → ASTM D4946 ≥ 8 at 50°C/4h/1psi. State substrate, film weight and drying conditions for every parameter.",
  },

  complianceTemplateIds: ["reach-svhc-2024"],

  standardTestConditionSets: [
    {
      name: "Std WB OPV — 4µm wet on coated board, 60°C tunnel",
      parameters: [
        { parameterName: "film_thickness", parameterValue: "4", unit: "µm wet" },
        { parameterName: "substrate", parameterValue: "coated board" },
        { parameterName: "drying", parameterValue: "60°C IR/hot air, 10 s" },
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
      ],
    },
    {
      name: "Std heat-seal — film-to-film, 1s dwell, 2 bar",
      parameters: [
        { parameterName: "seal_dwell", parameterValue: "1", unit: "s" },
        { parameterName: "seal_pressure", parameterValue: "2", unit: "bar" },
        { parameterName: "substrate", parameterValue: "BOPP film, corona 40 dyne" },
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
      ],
    },
  ],

  referenceMaterials: [
    { code: "REF-SA-HI-TG", name: "Styrene-acrylic emulsion, high Tg (J-201 class)", materialFunction: "binder", subFunction: "styrene_acrylic", density: 1.05, solidsContent: 45, glassTransitionTemp: 55, particleSizeD50: 0.12, hansenD: 17.5, hansenP: 8.0, hansenH: 8.5, notes: "OPV gloss/hardness; high seal-initiation temp" },
    { code: "REF-SA-MID-TG", name: "Styrene-acrylic emulsion, mid Tg (J-202 class)", materialFunction: "binder", subFunction: "styrene_acrylic", density: 1.05, solidsContent: 45, glassTransitionTemp: 25, particleSizeD50: 0.12, notes: "Balance flexibility/hardness" },
    { code: "REF-SA-LO-TG", name: "Styrene-acrylic emulsion, low Tg (J-203/N-102 class)", materialFunction: "binder", subFunction: "styrene_acrylic", density: 1.04, solidsContent: 45, glassTransitionTemp: -5, particleSizeD50: 0.15, notes: "Heat-seal, water/grease resistance" },
    { code: "REF-PUD-01", name: "Aliphatic PUD (generic)", materialFunction: "binder", subFunction: "pud", density: 1.06, solidsContent: 35, glassTransitionTemp: -20, particleSizeD50: 0.06, notes: "Velvet-feel topcoats, flexibility, chemical resistance" },
    { code: "REF-OP-01", name: "Opaque polymer (ROPAQUE class)", materialFunction: "pigment", subFunction: "opacifier", density: 1.03, solidsContent: 30, particleSizeD50: 0.4, oilAbsorption: 0, notes: "Voided latex TiO₂ extender — hiding via air voids after drying" },
    { code: "REF-WATER", name: "Water (demin.)", casNumber: "7732-18-5", materialFunction: "water", density: 1.0, viscosity: 1, hansenD: 15.5, hansenP: 16.0, hansenH: 42.3 },
    { code: "REF-TEXANOL", name: "Coalescent (Texanol class)", casNumber: "25265-77-4", materialFunction: "coalescent", density: 0.95, viscosity: 12, notes: "~10-15°C MFFT depression per 3% on binder solids" },
    { code: "REF-HEUR-01", name: "HEUR associative thickener", materialFunction: "rheology_modifier", density: 1.03, solidsContent: 20, notes: "Newtonian-ish profile, gloss-friendly" },
    { code: "REF-WAX-PE", name: "HDPE wax emulsion 35%", materialFunction: "wax_slip", density: 0.98, solidsContent: 35, particleSizeD50: 0.5, notes: "Rub/slip; hurts heat-seal above 3-4%" },
    { code: "REF-AMP-95", name: "AMP-95 neutralizer", casNumber: "124-68-5", materialFunction: "neutralizer", density: 0.94, molecularWeight: 89 },
    { code: "REF-TIO2-SLURRY", name: "TiO₂ slurry 70%", casNumber: "13463-67-7", materialFunction: "pigment", density: 2.1, solidsContent: 70, oilAbsorption: 14, particleSizeD50: 0.3 },
  ],
};
