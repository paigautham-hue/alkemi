/**
 * UV Inks & Coatings Domain Pack v1
 *
 * Covers UV offset ink, UV flexo ink, UV overprint varnish, UV wood coating
 * and UV LED variants (one pack, application-conditioned constraints — not
 * one pack per product line).
 *
 * Sources: ALKEMI v5.1 spec §27 (UV Inks domain pack draft), Hansen 2007,
 * standard UV formulation practice. Reference materials are GENERIC grades
 * (real chemistry, representative properties) intended as a cold-start
 * library — replace with supplier-specific grades as TDS data is ingested.
 */
import type { DomainPackConfig } from "../../shared/domainPack";

export const UV_INKS_PACK: DomainPackConfig = {
  packVersion: 1,
  key: "uv_inks",
  name: "UV Inks & Coatings",
  description:
    "Free-radical UV-curable inks, varnishes and coatings: offset, flexo, OPV, wood. Physics: cure depth (Jacobs), pigment loading (Krieger–Dougherty, PVC/CPVC), crosslink density, HSP compatibility.",

  functions: [
    { key: "oligomer", name: "Oligomer (backbone resin)", description: "Epoxy/urethane/polyester acrylate — film properties backbone", typicalRange: [20, 60], required: true },
    { key: "monomer_diluent", name: "Reactive diluent (monomer)", description: "Mono/di/tri-functional acrylate — viscosity control + crosslink", typicalRange: [10, 50], required: true },
    { key: "photoinitiator", name: "Photoinitiator", description: "Radical generator; match absorption to lamp spectrum", typicalRange: [2, 8], required: true },
    { key: "pigment", name: "Pigment", description: "Color; UV-screening — drives through-cure risk", typicalRange: [0, 25], required: false },
    { key: "filler_extender", name: "Filler / extender", typicalRange: [0, 20], required: false },
    { key: "dispersant", name: "Dispersant", description: "Pigment wetting & stabilization", typicalRange: [0, 5], required: false },
    { key: "wax_slip", name: "Wax / slip additive", description: "Rub resistance, slip, anti-set-off", typicalRange: [0, 4], required: false },
    { key: "defoamer", name: "Defoamer", typicalRange: [0, 2], required: false },
    { key: "adhesion_promoter", name: "Adhesion promoter", typicalRange: [0, 5], required: false },
    { key: "stabilizer", name: "Stabilizer / inhibitor", description: "Storage stability (e.g. MEHQ)", typicalRange: [0, 1], required: false },
    { key: "amine_synergist", name: "Amine synergist", description: "Counters oxygen inhibition with type-II PIs", typicalRange: [0, 10], required: false },
    { key: "matting_agent", name: "Matting agent", typicalRange: [0, 8], required: false },
  ],

  properties: [
    { key: "viscosity", name: "Viscosity", unit: "mPa·s", testMethod: "Brookfield/cone-plate, 25°C (ASTM D2196)", typicalRange: [50, 30000], cvMeasurement: 0.05, physicsModel: "viscosity" },
    { key: "cure_speed", name: "Cure speed", unit: "m/min", testMethod: "Belt cure to tack-free, 1× Hg 120 W/cm", typicalRange: [20, 150], cvMeasurement: 0.08 },
    { key: "cure_depth", name: "Cure depth", unit: "µm", testMethod: "Working curve (Jacobs)", cvMeasurement: 0.1, physicsModel: "cure_depth" },
    { key: "gloss_60deg", name: "Gloss @60°", unit: "GU", testMethod: "ASTM D523", typicalRange: [5, 100], cvMeasurement: 0.03 },
    { key: "adhesion_rating", name: "Adhesion (cross-hatch)", unit: "0-5B", testMethod: "ASTM D3359", cvMeasurement: 0.15 },
    { key: "density", name: "Density", unit: "g/cm³", testMethod: "Pycnometer, 25°C (ASTM D1475)", typicalRange: [0.9, 2.2], cvMeasurement: 0.01, physicsModel: "density" },
    { key: "pigment_volume_concentration", name: "PVC", unit: "%", physicsModel: "pigment_volume_concentration", cvMeasurement: 0.02 },
    { key: "reactive_group_concentration", name: "C=C concentration", unit: "mol/kg", physicsModel: "reactive_group_concentration", cvMeasurement: 0.02 },
    { key: "hardness_pencil", name: "Pencil hardness", unit: "scale", testMethod: "ASTM D3363", cvMeasurement: 0.15 },
    { key: "rub_resistance", name: "Rub resistance", unit: "cycles", testMethod: "Sutherland rub test", cvMeasurement: 0.12 },
    { key: "yellowing_delta_b", name: "Yellowing Δb*", unit: "Δb*", testMethod: "CIELAB after cure/aging", cvMeasurement: 0.1 },
    { key: "migration_total", name: "Total migration", unit: "mg/kg food", testMethod: "EN 1186 / Swiss Ordinance", cvMeasurement: 0.15 },
  ],

  physicsConstraints: [
    { key: "mass_balance", description: "Composition must sum to 100%", params: { tolerance: 0.1 }, severity: "error" },
    { key: "photoinitiator_present", description: "Free-radical UV systems require a photoinitiator", params: { minPct: 0.5 }, severity: "error" },
    { key: "tio2_through_cure", description: "TiO₂-pigmented systems: check cure depth vs film thickness (UV screening)", params: { pigmentScreeningFactor: 25 }, severity: "warning" },
    { key: "hsp_compatibility", description: "Pairwise Hansen Ra > 8 indicates phase-separation risk", params: { raThreshold: 8 }, severity: "warning" },
    { key: "viscosity_application_window", description: "Viscosity must suit application: offset 5k-30k, flexo 50-500, OPV 100-1500 mPa·s", params: { offset: [5000, 30000], flexo: [50, 500], opv: [100, 1500] }, severity: "warning" },
  ],

  validationRules: {
    compositionSumTolerance: 0.1,
    functionLimits: {
      photoinitiator: { min: 0.5, max: 10 },
      oligomer: { min: 10, max: 75 },
      monomer_diluent: { max: 60 },
      pigment: { max: 35 },
      stabilizer: { max: 1.5 },
    },
    incompatibleFunctions: [],
  },

  expertPrompts: {
    domainExpert:
      "You are a senior UV inks & coatings formulator (offset/flexo/OPV/wood). Reason with: free-radical acrylate chemistry, oxygen inhibition, photoinitiator absorption vs lamp spectra (Hg vs LED 365-405 nm), pigment UV screening and through-cure, monomer functionality vs shrinkage/adhesion trade-off, low-migration constraints for food packaging (EuPIA/Swiss Ordinance), press conditions (offset ink-water balance, flexo anilox volume). Always distinguish surface cure from through cure.",
    claimTranslation:
      "Translate ink/coating marketing claims into measurable parameters with test methods, e.g. 'fast curing' → cure speed ≥ X m/min at 120 W/cm Hg to tack-free (twin test: thumb-twist + set-off); 'high gloss' → gloss@60° ≥ 85 GU on coated board; 'good adhesion on PP' → cross-hatch ≥ 4B on corona-treated PP (38+ dyne). State the substrate and cure conditions for every parameter.",
  },

  complianceTemplateIds: ["eupia-exclusion-2024", "swiss-ordinance-annex10"],

  standardTestConditionSets: [
    {
      name: "Std UV Offset — Hg 120W/cm, coated board",
      description: "Standard offset cure/test conditions",
      parameters: [
        { parameterName: "lamp_type", parameterValue: "Hg medium pressure" },
        { parameterName: "lamp_power", parameterValue: "120", unit: "W/cm" },
        { parameterName: "uv_dose", parameterValue: "180", unit: "mJ/cm²" },
        { parameterName: "film_thickness", parameterValue: "3", unit: "µm" },
        { parameterName: "substrate", parameterValue: "coated board GC1" },
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
      ],
    },
    {
      name: "Std UV Varnish — Hg 120W/cm, 6µm OPV",
      description: "Standard overprint varnish conditions",
      parameters: [
        { parameterName: "lamp_type", parameterValue: "Hg medium pressure" },
        { parameterName: "lamp_power", parameterValue: "120", unit: "W/cm" },
        { parameterName: "uv_dose", parameterValue: "150", unit: "mJ/cm²" },
        { parameterName: "film_thickness", parameterValue: "6", unit: "µm" },
        { parameterName: "substrate", parameterValue: "offset-printed board" },
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
      ],
    },
    {
      name: "Std UV Wood — 2× Hg, 50µm white basecoat",
      description: "Wood coating white basecoat — through-cure critical",
      parameters: [
        { parameterName: "lamp_type", parameterValue: "Hg medium pressure ×2" },
        { parameterName: "uv_dose", parameterValue: "400", unit: "mJ/cm²" },
        { parameterName: "film_thickness", parameterValue: "50", unit: "µm" },
        { parameterName: "substrate", parameterValue: "MDF, sealed" },
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
      ],
    },
    {
      name: "Std UV LED — 395nm 16W/cm², 4µm",
      description: "LED cure — requires LED-matched photoinitiators (TPO/BAPO class)",
      parameters: [
        { parameterName: "lamp_type", parameterValue: "LED 395 nm" },
        { parameterName: "uv_dose", parameterValue: "250", unit: "mJ/cm²" },
        { parameterName: "film_thickness", parameterValue: "4", unit: "µm" },
        { parameterName: "substrate", parameterValue: "coated board GC1" },
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
      ],
    },
  ],

  referenceMaterials: [
    // Oligomers
    { code: "REF-EA-01", name: "Epoxy acrylate oligomer (bisphenol-A, generic)", casNumber: "55818-57-0", materialFunction: "oligomer", subFunction: "epoxy_acrylate", density: 1.15, viscosity: 45000, functionality: 2, equivalentWeight: 260, hansenD: 17.5, hansenP: 8.5, hansenH: 8.0, notes: "High gloss/hardness backbone; yellows more than urethane" },
    { code: "REF-UA-01", name: "Aliphatic urethane acrylate (generic)", materialFunction: "oligomer", subFunction: "urethane_acrylate", density: 1.1, viscosity: 25000, functionality: 2.5, equivalentWeight: 400, hansenD: 17.0, hansenP: 6.5, hansenH: 7.5, notes: "Low-yellowing, flexible; wood/exterior" },
    { code: "REF-PEA-01", name: "Polyester acrylate (generic)", materialFunction: "oligomer", subFunction: "polyester_acrylate", density: 1.12, viscosity: 8000, functionality: 3, equivalentWeight: 300, hansenD: 16.8, hansenP: 7.0, hansenH: 7.0, notes: "Pigment wetting; offset ink workhorse" },
    // Monomers
    { code: "REF-TPGDA", name: "TPGDA", casNumber: "42978-66-5", materialFunction: "monomer_diluent", density: 1.03, viscosity: 15, molecularWeight: 300, functionality: 2, equivalentWeight: 150, hansenD: 16.5, hansenP: 5.8, hansenH: 6.0 },
    { code: "REF-TMPTA", name: "TMPTA", casNumber: "15625-89-5", materialFunction: "monomer_diluent", density: 1.1, viscosity: 100, molecularWeight: 296, functionality: 3, equivalentWeight: 99, hansenD: 16.9, hansenP: 5.9, hansenH: 7.4, notes: "Fast cure, high crosslink — high shrinkage" },
    { code: "REF-HDDA", name: "HDDA", casNumber: "13048-33-4", materialFunction: "monomer_diluent", density: 1.02, viscosity: 8, molecularWeight: 226, functionality: 2, equivalentWeight: 113, hansenD: 16.5, hansenP: 5.2, hansenH: 6.3, notes: "Strong viscosity cutter; skin irritant class" },
    { code: "REF-IBOA", name: "IBOA (monofunctional)", casNumber: "5888-33-5", materialFunction: "monomer_diluent", density: 0.99, viscosity: 9, molecularWeight: 208, functionality: 1, equivalentWeight: 208, hansenD: 16.6, hansenP: 2.9, hansenH: 4.7, notes: "Adhesion/flexibility; reduces crosslink density" },
    // Photoinitiators
    { code: "REF-TPO", name: "TPO", casNumber: "75980-60-8", materialFunction: "photoinitiator", subFunction: "acylphosphine_type1", density: 1.19, molecularWeight: 348, hansenD: 19.0, hansenP: 6.6, hansenH: 5.0, notes: "Long-wavelength (LED-capable), through-cure of TiO₂ whites; food-contact restricted lists apply" },
    { code: "REF-HMPP", name: "HMPP (Darocur 1173 class)", casNumber: "7473-98-5", materialFunction: "photoinitiator", subFunction: "alpha_hydroxyketone_type1", density: 1.08, molecularWeight: 164, hansenD: 18.0, hansenP: 8.0, hansenH: 8.5, notes: "Surface cure, low yellowing; volatile — migration watch" },
    { code: "REF-BP", name: "Benzophenone", casNumber: "119-61-9", materialFunction: "photoinitiator", subFunction: "type2", density: 1.11, molecularWeight: 182, hansenD: 19.4, hansenP: 8.6, hansenH: 5.7, notes: "Type II — needs amine synergist; EuPIA-restricted for food packaging" },
    { code: "REF-ITX", name: "ITX", casNumber: "5495-84-1", materialFunction: "photoinitiator", subFunction: "thioxanthone_type2", density: 1.2, molecularWeight: 254, hansenD: 20.0, hansenP: 6.0, hansenH: 5.0, notes: "Sensitizer; MIGRATION-NOTORIOUS (Nestlé ITX incidents) — avoid in food packaging" },
    // Pigments
    { code: "REF-TIO2", name: "TiO₂ rutile (R-706 class)", casNumber: "13463-67-7", materialFunction: "pigment", subFunction: "white", density: 4.0, oilAbsorption: 13.9, particleSizeD50: 0.36, refractiveIndex: 2.73, hansenD: 24.1, hansenP: 14.9, hansenH: 19.4, notes: "Strong UV screen — through-cure killer; pair with TPO/BAPO" },
    { code: "REF-CB", name: "Carbon black (offset grade)", casNumber: "1333-86-4", materialFunction: "pigment", subFunction: "black", density: 1.8, oilAbsorption: 50, particleSizeD50: 0.025, hansenD: 21.1, hansenP: 12.3, hansenH: 11.3, notes: "Broadband absorber — worst-case cure" },
    { code: "REF-PB153", name: "Phthalo blue 15:3", casNumber: "147-14-8", materialFunction: "pigment", subFunction: "cyan", density: 1.6, oilAbsorption: 45, particleSizeD50: 0.08, hansenD: 20.0, hansenP: 8.0, hansenH: 9.0 },
    { code: "REF-CACO3", name: "Calcium carbonate (extender)", casNumber: "471-34-1", materialFunction: "filler_extender", density: 2.7, oilAbsorption: 20, particleSizeD50: 2.0, hansenD: 23.0, hansenP: 12.0, hansenH: 14.0 },
    // Additives
    { code: "REF-EDAB", name: "EDAB amine synergist", casNumber: "10287-53-3", materialFunction: "amine_synergist", density: 1.06, molecularWeight: 193, notes: "Pairs with type-II PIs; counters O₂ inhibition" },
    { code: "REF-SIL-SLIP", name: "Polyether-modified siloxane slip", materialFunction: "wax_slip", density: 1.0, notes: "Slip/levelling; overdose causes recoat/adhesion failure" },
    { code: "REF-MEHQ", name: "MEHQ stabilizer", casNumber: "150-76-5", materialFunction: "stabilizer", density: 1.55, molecularWeight: 124, notes: "Storage inhibitor 200-600 ppm typical — internal MSC supply candidate" },
    { code: "REF-DISP-01", name: "High-MW pigment dispersant (generic)", materialFunction: "dispersant", density: 1.05, notes: "Dosage on pigment surface area basis" },
  ],
};
