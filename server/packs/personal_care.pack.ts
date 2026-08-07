/**
 * Personal Care & Aerosols Domain Pack v1
 *
 * Covers Primacy CDMO categories: aerosols (deo/body spray/air care),
 * emulsion skincare (sunscreen, lotions), rinse-off (shampoo/body wash),
 * fine fragrance (EDP/body mist). Physics: HLB matching (spec §20.4),
 * Stokes stability, viscosity. Fragrance CREATION is out of scope —
 * fragrance enters as a supplier oil with IFRA limits.
 */
import type { DomainPackConfig } from "../../shared/domainPack";

export const PERSONAL_CARE_PACK: DomainPackConfig = {
  packVersion: 1,
  key: "personal_care",
  name: "Personal Care & Aerosols",
  description:
    "Aerosols, emulsion skincare, rinse-off and fine fragrance formulations. Physics: HLB emulsion matching, Stokes creaming/settling, viscosity. Compliance: MoCRA, EU 1223, IFRA.",

  functions: [
    { key: "water", name: "Water (aqua)", typicalRange: [0, 90], required: false },
    { key: "emollient", name: "Emollient / oil phase", description: "Esters, triglycerides, silicones-alternatives, mineral oil", typicalRange: [0, 40], required: false },
    { key: "surfactant_emulsifier", name: "Emulsifier", description: "HLB-matched to oil phase", typicalRange: [0, 10], required: false },
    { key: "surfactant_cleansing", name: "Cleansing surfactant", description: "SLES/CAPB/isethionates for rinse-off", typicalRange: [0, 25], required: false },
    { key: "co_emulsifier", name: "Co-emulsifier / consistency factor", description: "Fatty alcohols, glyceryl stearate", typicalRange: [0, 8], required: false },
    { key: "humectant", name: "Humectant", description: "Glycerin, propylene glycol", typicalRange: [0, 15], required: false },
    { key: "rheology_modifier", name: "Rheology modifier", description: "Carbomer, xanthan, HEC", typicalRange: [0, 3], required: false },
    { key: "active", name: "Active ingredient", description: "UV filters, niacinamide, salicylic acid…", typicalRange: [0, 25], required: false },
    { key: "preservative", name: "Preservative system", typicalRange: [0, 2], required: false },
    { key: "fragrance", name: "Fragrance (parfum)", description: "Supplier oil; IFRA category limits apply", typicalRange: [0, 25], required: false },
    { key: "propellant", name: "Propellant", description: "LPG/DME/152a for aerosols", typicalRange: [0, 85], required: false },
    { key: "solvent_carrier", name: "Solvent/carrier (ethanol…)", typicalRange: [0, 90], required: false },
    { key: "chelator", name: "Chelator (EDTA…)", typicalRange: [0, 0.5], required: false },
    { key: "neutralizer", name: "pH adjuster", typicalRange: [0, 2], required: false },
    { key: "antioxidant_stabilizer", name: "Antioxidant", description: "BHA/BHT/tocopherol — MSC molecules land here", typicalRange: [0, 1], required: false },
  ],

  properties: [
    { key: "viscosity", name: "Viscosity", unit: "mPa·s", testMethod: "Brookfield RV, 25°C", cvMeasurement: 0.08, physicsModel: "viscosity" },
    { key: "ph", name: "pH", unit: "pH", testMethod: "Direct/10% dilution, 25°C", typicalRange: [3.5, 8], cvMeasurement: 0.02 },
    { key: "required_hlb_match", name: "HLB match (blend vs required)", unit: "ΔHLB", physicsModel: "hlb_match", cvMeasurement: 0.1 },
    { key: "stability_45c_weeks", name: "Accelerated stability @45°C", unit: "weeks", testMethod: "45°C oven, phase inspection", cvMeasurement: 0.2 },
    { key: "creaming_rate", name: "Creaming/settling rate", unit: "µm/day", physicsModel: "stokes_settling", cvMeasurement: 0.25 },
    { key: "spf_in_vitro", name: "SPF (in vitro)", unit: "SPF", testMethod: "ISO 24443", cvMeasurement: 0.15 },
    { key: "foam_volume", name: "Foam volume", unit: "mL", testMethod: "Cylinder shake / Ross-Miles", cvMeasurement: 0.1 },
    { key: "spray_rate", name: "Aerosol spray rate", unit: "g/s", testMethod: "Weighed 10s actuation, 25°C", cvMeasurement: 0.05 },
    { key: "pressure_25c", name: "Can pressure @25°C", unit: "bar", testMethod: "Gauge, equilibrated", cvMeasurement: 0.03 },
    { key: "density", name: "Density", unit: "g/cm³", testMethod: "Pycnometer 25°C", cvMeasurement: 0.01, physicsModel: "density" },
  ],

  physicsConstraints: [
    { key: "mass_balance", description: "Composition must sum to 100%", params: { tolerance: 0.1 }, severity: "error" },
    { key: "hlb_matching", description: "Emulsifier blend HLB should match the oil phase required HLB (±1.5)", params: { tolerance: 1.5 }, severity: "warning" },
    { key: "stokes_stability", description: "Creaming/settling velocity from Stokes law — droplet size and viscosity drive shelf stability", params: {}, severity: "warning" },
    { key: "preservation_required", description: "Water-containing formulations need a preservative system", params: {}, severity: "warning" },
  ],

  validationRules: {
    compositionSumTolerance: 0.1,
    functionLimits: {
      preservative: { max: 2 },
      fragrance: { max: 30 },
      chelator: { max: 0.5 },
    },
    incompatibleFunctions: [],
  },

  expertPrompts: {
    domainExpert:
      "You are a senior personal-care formulator (aerosols, emulsion skincare, sunscreen, rinse-off, fine fragrance). Reason with: HLB matching and required-HLB of oil phases, emulsion type (O/W vs W/O), Stokes creaming and droplet-size control, carbomer neutralization and electrolyte sensitivity, surfactant micelle thickening (salt curves), preservative efficacy vs pH and packaging, UV-filter photostability combinations, aerosol pressure/spray-rate vs propellant ratio, ethanol content for fragrance solubilization. Flag MoCRA/EU 1223 and IFRA category limits when relevant.",
    claimTranslation:
      "Translate cosmetic claims into measurable parameters: '24h moisturization' → corneometry Δ vs untreated at 24h, n≥20 panel; 'SPF 50' → ISO 24444 in-vivo (label needs regulatory dossier), screen with ISO 24443 in-vitro; 'non-sticky' → sensory panel score ≥ X vs benchmark; 'long-lasting fragrance' → sniff-panel intensity at 8h. Name the test protocol and panel size for every claim.",
  },

  complianceTemplateIds: ["fda-cosmetics-2024", "eu-cosmetics-1223-2009", "mocra-2024"],

  standardTestConditionSets: [
    {
      name: "Std emulsion stability — 45°C accelerated",
      parameters: [
        { parameterName: "temperature", parameterValue: "45", unit: "°C" },
        { parameterName: "duration", parameterValue: "12", unit: "weeks" },
        { parameterName: "inspection", parameterValue: "phase separation, color, odor, pH, viscosity @ 2/4/8/12 wk" },
      ],
    },
    {
      name: "Std aerosol — 25°C can testing",
      parameters: [
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
        { parameterName: "actuation", parameterValue: "10", unit: "s" },
        { parameterName: "can", parameterValue: "52mm tinplate, standard valve 0.46mm" },
      ],
    },
  ],

  referenceMaterials: [
    { code: "REF-GMS-SE", name: "Glyceryl stearate SE", casNumber: "11099-07-3", materialFunction: "surfactant_emulsifier", density: 0.97, hlb: 5.8, notes: "W/O-leaning; pair with high-HLB co-emulsifier" },
    { code: "REF-POLYSORB60", name: "Polysorbate 60", casNumber: "9005-67-8", materialFunction: "surfactant_emulsifier", density: 1.1, hlb: 14.9 },
    { code: "REF-SPAN60", name: "Sorbitan stearate (Span 60)", casNumber: "1338-41-6", materialFunction: "surfactant_emulsifier", density: 1.0, hlb: 4.7 },
    { code: "REF-CETEARYL", name: "Cetearyl alcohol", casNumber: "67762-27-0", materialFunction: "co_emulsifier", density: 0.82, notes: "Consistency factor; lamellar gel network" },
    { code: "REF-CCT", name: "Caprylic/capric triglyceride", casNumber: "65381-09-1", materialFunction: "emollient", density: 0.95, viscosity: 25, notes: "Required HLB ≈ 11 (O/W)" },
    { code: "REF-IPM", name: "Isopropyl myristate", casNumber: "110-27-0", materialFunction: "emollient", density: 0.85, viscosity: 6, notes: "Required HLB ≈ 11.5; penetration enhancer" },
    { code: "REF-MINOIL", name: "White mineral oil 15cSt", casNumber: "8042-47-5", materialFunction: "emollient", density: 0.85, viscosity: 15, hansenD: 15.8, hansenP: 0.1, hansenH: 0.2, notes: "Required HLB ≈ 10.5" },
    { code: "REF-GLYCERIN", name: "Glycerin 99.5%", casNumber: "56-81-5", materialFunction: "humectant", density: 1.26, viscosity: 950, hansenD: 17.4, hansenP: 12.1, hansenH: 29.3 },
    { code: "REF-CARBOMER", name: "Carbomer (940 class)", casNumber: "9003-01-4", materialFunction: "rheology_modifier", density: 1.4, notes: "Neutralize to pH 6-7; electrolyte-sensitive" },
    { code: "REF-XANTHAN", name: "Xanthan gum", casNumber: "11138-66-2", materialFunction: "rheology_modifier", density: 1.5 },
    { code: "REF-SLES-70", name: "SLES 70%", casNumber: "68585-34-2", materialFunction: "surfactant_cleansing", density: 1.05, solidsContent: 70, notes: "Salt-thickening curve applies" },
    { code: "REF-CAPB", name: "Cocamidopropyl betaine 30%", casNumber: "61789-40-0", materialFunction: "surfactant_cleansing", density: 1.04, solidsContent: 30, notes: "Foam booster, mildness" },
    { code: "REF-PHENOXY", name: "Phenoxyethanol (+EHG)", casNumber: "122-99-6", materialFunction: "preservative", density: 1.1, notes: "Max 1% EU; broad spectrum with ethylhexylglycerin" },
    { code: "REF-EHS", name: "Ethylhexyl salicylate (UV-B filter)", casNumber: "118-60-5", materialFunction: "active", density: 1.01, notes: "Max 5% EU/US" },
    { code: "REF-EHMC", name: "Ethylhexyl methoxycinnamate", casNumber: "5466-77-3", materialFunction: "active", density: 1.01, notes: "Max 10% EU / 7.5% US; photostability pair with Tinosorb-class" },
    { code: "REF-ETHANOL", name: "Ethanol 96% (cosmetic)", casNumber: "64-17-5", materialFunction: "solvent_carrier", density: 0.81, viscosity: 1.2, hansenD: 15.8, hansenP: 8.8, hansenH: 19.4 },
    { code: "REF-LPG-40", name: "LPG propellant 40 (butane/propane)", casNumber: "68476-85-7", materialFunction: "propellant", density: 0.54, notes: "~2.8 bar @25°C typical blend; flammable" },
    { code: "REF-BHT", name: "BHT antioxidant", casNumber: "128-37-0", materialFunction: "antioxidant_stabilizer", density: 1.05, molecularWeight: 220, notes: "MSC/TBHQ/BHA family — internal supply candidates" },
    { code: "REF-EDTA-2NA", name: "Disodium EDTA", casNumber: "139-33-3", materialFunction: "chelator", density: 1.0 },
  ],
};
