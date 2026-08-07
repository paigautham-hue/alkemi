/**
 * Curated literature Hansen Solubility Parameters for workhorse
 * formulation raw materials (UV inks/coatings, waterborne emulsions,
 * personal care). Values from Hansen (2007) "HSP: A User's Handbook" and
 * widely-cited supplier/industry data. Units: MPa^0.5; molarVolume cm³/mol.
 *
 * This seed makes the HSP subsystem functional out of the box; the purchased
 * HSPiP dataset imports into the same hsp_reference table and simply widens
 * coverage (same source precedence tier).
 */
export interface HspLiteratureEntry {
  casNumber: string;
  name: string;
  hansenD: number;
  hansenP: number;
  hansenH: number;
  molarVolume?: number;
  source: "literature";
}

export const HSP_LITERATURE: HspLiteratureEntry[] = [
  // --- Solvents ---
  { casNumber: "123-86-4", name: "n-Butyl acetate", hansenD: 15.8, hansenP: 3.7, hansenH: 6.3, molarVolume: 132.5, source: "literature" },
  { casNumber: "141-78-6", name: "Ethyl acetate", hansenD: 15.8, hansenP: 5.3, hansenH: 7.2, molarVolume: 98.5, source: "literature" },
  { casNumber: "67-64-1", name: "Acetone", hansenD: 15.5, hansenP: 10.4, hansenH: 7.0, molarVolume: 74.0, source: "literature" },
  { casNumber: "78-93-3", name: "Methyl ethyl ketone (MEK)", hansenD: 16.0, hansenP: 9.0, hansenH: 5.1, molarVolume: 90.1, source: "literature" },
  { casNumber: "108-88-3", name: "Toluene", hansenD: 18.0, hansenP: 1.4, hansenH: 2.0, molarVolume: 106.8, source: "literature" },
  { casNumber: "1330-20-7", name: "Xylene (mixed)", hansenD: 17.8, hansenP: 1.0, hansenH: 3.1, molarVolume: 121.2, source: "literature" },
  { casNumber: "64-17-5", name: "Ethanol", hansenD: 15.8, hansenP: 8.8, hansenH: 19.4, molarVolume: 58.5, source: "literature" },
  { casNumber: "67-63-0", name: "Isopropanol", hansenD: 15.8, hansenP: 6.1, hansenH: 16.4, molarVolume: 76.8, source: "literature" },
  { casNumber: "71-36-3", name: "n-Butanol", hansenD: 16.0, hansenP: 5.7, hansenH: 15.8, molarVolume: 91.5, source: "literature" },
  { casNumber: "7732-18-5", name: "Water", hansenD: 15.5, hansenP: 16.0, hansenH: 42.3, molarVolume: 18.0, source: "literature" },
  { casNumber: "111-76-2", name: "Butyl glycol (2-butoxyethanol)", hansenD: 16.0, hansenP: 5.1, hansenH: 12.3, molarVolume: 131.6, source: "literature" },
  { casNumber: "57-55-6", name: "Propylene glycol", hansenD: 16.8, hansenP: 9.4, hansenH: 23.3, molarVolume: 73.6, source: "literature" },
  { casNumber: "56-81-5", name: "Glycerol", hansenD: 17.4, hansenP: 12.1, hansenH: 29.3, molarVolume: 73.3, source: "literature" },
  { casNumber: "108-65-6", name: "PM acetate (PGMEA)", hansenD: 15.6, hansenP: 5.6, hansenH: 9.8, molarVolume: 137.1, source: "literature" },
  { casNumber: "872-50-4", name: "N-Methyl-2-pyrrolidone (NMP)", hansenD: 18.0, hansenP: 12.3, hansenH: 7.2, molarVolume: 96.5, source: "literature" },
  { casNumber: "68-12-2", name: "Dimethylformamide (DMF)", hansenD: 17.4, hansenP: 13.7, hansenH: 11.3, molarVolume: 77.0, source: "literature" },
  { casNumber: "110-54-3", name: "n-Hexane", hansenD: 14.9, hansenP: 0.0, hansenH: 0.0, molarVolume: 131.6, source: "literature" },
  { casNumber: "142-82-5", name: "n-Heptane", hansenD: 15.3, hansenP: 0.0, hansenH: 0.0, molarVolume: 147.4, source: "literature" },
  { casNumber: "8052-41-3", name: "Mineral spirits (Stoddard)", hansenD: 15.8, hansenP: 0.1, hansenH: 0.2, molarVolume: 175.0, source: "literature" },

  // --- UV monomers / reactive diluents ---
  { casNumber: "42978-66-5", name: "TPGDA (tripropylene glycol diacrylate)", hansenD: 16.5, hansenP: 5.8, hansenH: 6.0, molarVolume: 289.0, source: "literature" },
  { casNumber: "15625-89-5", name: "TMPTA (trimethylolpropane triacrylate)", hansenD: 16.9, hansenP: 5.9, hansenH: 7.4, molarVolume: 268.0, source: "literature" },
  { casNumber: "13048-33-4", name: "HDDA (1,6-hexanediol diacrylate)", hansenD: 16.5, hansenP: 5.2, hansenH: 6.3, molarVolume: 213.0, source: "literature" },
  { casNumber: "5888-33-5", name: "IBOA (isobornyl acrylate)", hansenD: 16.6, hansenP: 2.9, hansenH: 4.7, molarVolume: 204.0, source: "literature" },
  { casNumber: "2499-95-8", name: "HEA (2-hydroxyethyl acrylate)", hansenD: 16.0, hansenP: 8.8, hansenH: 13.8, molarVolume: 105.0, source: "literature" },
  { casNumber: "868-77-9", name: "HEMA (2-hydroxyethyl methacrylate)", hansenD: 16.8, hansenP: 8.4, hansenH: 12.8, molarVolume: 120.0, source: "literature" },
  { casNumber: "97-90-5", name: "EGDMA (ethylene glycol dimethacrylate)", hansenD: 16.3, hansenP: 5.1, hansenH: 6.7, molarVolume: 183.0, source: "literature" },
  { casNumber: "3524-68-3", name: "PETA (pentaerythritol triacrylate)", hansenD: 17.0, hansenP: 6.8, hansenH: 9.5, molarVolume: 250.0, source: "literature" },

  // --- Oligomers / resins (approximate polymer HSP centers) ---
  { casNumber: "25068-38-6", name: "DGEBA epoxy resin (e.g. DER 331)", hansenD: 18.3, hansenP: 10.5, hansenH: 7.0, molarVolume: 310.0, source: "literature" },
  { casNumber: "25035-69-2", name: "Poly(methyl methacrylate) segment", hansenD: 18.6, hansenP: 10.5, hansenH: 7.5, source: "literature" },
  { casNumber: "9003-01-4", name: "Poly(acrylic acid) segment", hansenD: 17.0, hansenP: 12.0, hansenH: 14.0, source: "literature" },
  { casNumber: "9011-14-7", name: "PMMA (acrylic resin)", hansenD: 18.6, hansenP: 10.5, hansenH: 7.5, source: "literature" },
  { casNumber: "61788-97-4", name: "Epoxy novolac resin", hansenD: 19.0, hansenP: 11.0, hansenH: 9.0, source: "literature" },
  { casNumber: "68083-19-2", name: "Epoxy acrylate oligomer (generic)", hansenD: 17.5, hansenP: 8.5, hansenH: 8.0, source: "literature" },
  { casNumber: "72162-39-1", name: "Aliphatic urethane acrylate (generic)", hansenD: 17.0, hansenP: 6.5, hansenH: 7.5, source: "literature" },

  // --- Photoinitiators ---
  { casNumber: "75980-60-8", name: "TPO (diphenyl(2,4,6-trimethylbenzoyl)phosphine oxide)", hansenD: 19.0, hansenP: 6.6, hansenH: 5.0, molarVolume: 300.0, source: "literature" },
  { casNumber: "947-19-3", name: "Benzophenone-type PI (e.g. Irgacure 907 class)", hansenD: 19.4, hansenP: 8.5, hansenH: 5.5, source: "literature" },
  { casNumber: "119-61-9", name: "Benzophenone", hansenD: 19.4, hansenP: 8.6, hansenH: 5.7, molarVolume: 164.0, source: "literature" },
  { casNumber: "7473-98-5", name: "HMPP (2-hydroxy-2-methylpropiophenone, Darocur 1173)", hansenD: 18.0, hansenP: 8.0, hansenH: 8.5, molarVolume: 160.0, source: "literature" },
  { casNumber: "5495-84-1", name: "ITX (isopropylthioxanthone)", hansenD: 20.0, hansenP: 6.0, hansenH: 5.0, molarVolume: 210.0, source: "literature" },

  // --- Pigments / fillers (surface interaction values) ---
  { casNumber: "13463-67-7", name: "Titanium dioxide (rutile, surface)", hansenD: 24.1, hansenP: 14.9, hansenH: 19.4, source: "literature" },
  { casNumber: "1333-86-4", name: "Carbon black (surface)", hansenD: 21.1, hansenP: 12.3, hansenH: 11.3, source: "literature" },
  { casNumber: "471-34-1", name: "Calcium carbonate (surface)", hansenD: 23.0, hansenP: 12.0, hansenH: 14.0, source: "literature" },
  { casNumber: "14808-60-7", name: "Silica, crystalline (surface)", hansenD: 21.0, hansenP: 13.0, hansenH: 15.0, source: "literature" },
  { casNumber: "147-14-8", name: "Phthalocyanine blue 15:3 (surface)", hansenD: 20.0, hansenP: 8.0, hansenH: 9.0, source: "literature" },

  // --- Personal care / emulsion ---
  { casNumber: "112-72-1", name: "Myristyl alcohol", hansenD: 16.2, hansenP: 2.8, hansenH: 8.0, source: "literature" },
  { casNumber: "36653-82-4", name: "Cetyl alcohol", hansenD: 16.3, hansenP: 2.6, hansenH: 7.6, source: "literature" },
  { casNumber: "8001-79-4", name: "Castor oil", hansenD: 16.1, hansenP: 4.0, hansenH: 10.3, source: "literature" },
  { casNumber: "8042-47-5", name: "White mineral oil", hansenD: 15.8, hansenP: 0.1, hansenH: 0.2, source: "literature" },
  { casNumber: "112-80-1", name: "Oleic acid", hansenD: 16.0, hansenP: 2.8, hansenH: 6.2, source: "literature" },
  { casNumber: "57-10-3", name: "Palmitic acid", hansenD: 15.9, hansenP: 2.6, hansenH: 5.8, source: "literature" },
];
