/**
 * Hansen Solubility Parameter estimation by group contribution
 * (van Krevelen–Hoftyzer method) from a SMILES structure.
 *
 *   δD = ΣF_d,i / V
 *   δP = √(ΣF_p,i²) / V
 *   δH = √(ΣE_h,i / V)
 *
 * where V is the molar volume (cm³/mol), F in MPa^0.5·cm³/mol, E_h in J/mol.
 *
 * This is an ESTIMATE for materials absent from measured/HSPiP data —
 * expected accuracy ±1–2.5 MPa^0.5 per parameter. Results must always be
 * stored with source 'group_contribution' and wide uncertainty; they rank
 * below any measured or database value in the resolver precedence.
 *
 * SMILES parsing via openchemlib (pure JS). Atom classification covers the
 * functional groups common in coatings/inks/personal-care chemistry; exotic
 * atoms (S, P, Si, metals) abort the estimate rather than guess.
 */
import * as OCL from "openchemlib";

interface GroupContribution {
  fd: number; // MPa^0.5 · cm³/mol
  fp: number; // MPa^0.5 · cm³/mol
  eh: number; // J/mol
}

// van Krevelen–Hoftyzer group contributions (standard published values;
// aromatic per-atom values derived from phenyl/phenylene ring totals)
const GROUPS: Record<string, GroupContribution> = {
  CH3: { fd: 420, fp: 0, eh: 0 },
  CH2: { fd: 270, fp: 0, eh: 0 },
  CH: { fd: 80, fp: 0, eh: 0 },
  C: { fd: -70, fp: 0, eh: 0 },
  "=CH2": { fd: 400, fp: 0, eh: 0 },
  "=CH": { fd: 200, fp: 0, eh: 0 },
  "=C": { fd: 70, fp: 0, eh: 0 },
  arCH: { fd: 240, fp: 20, eh: 0 },
  arC: { fd: 200, fp: 20, eh: 0 },
  OH: { fd: 210, fp: 500, eh: 20000 },
  Oether: { fd: 100, fp: 400, eh: 3000 },
  COOester: { fd: 390, fp: 490, eh: 7000 },
  COOH: { fd: 530, fp: 420, eh: 10000 },
  COketone: { fd: 290, fp: 770, eh: 2000 },
  CHO: { fd: 470, fp: 800, eh: 4500 },
  NH2: { fd: 280, fp: 310, eh: 8400 },
  NH: { fd: 160, fp: 210, eh: 3100 },
  N: { fd: 20, fp: 800, eh: 5000 },
  CN: { fd: 430, fp: 1100, eh: 2500 },
  F: { fd: 220, fp: 0, eh: 0 },
  Cl: { fd: 450, fp: 550, eh: 400 },
  Br: { fd: 550, fp: 0, eh: 0 },
  ringNonAromatic: { fd: 190, fp: 0, eh: 0 },
};

export interface HspEstimate {
  hansenD: number;
  hansenP: number;
  hansenH: number;
  molarVolume: number;
  method: "van_krevelen_group_contribution";
  /** ± per parameter, MPa^0.5 */
  uncertainty: number;
  groupCounts: Record<string, number>;
}

/**
 * Estimate HSP from SMILES + molar volume (cm³/mol = MW / density).
 * Returns null when the structure contains atoms outside the covered set or
 * SMILES parsing fails.
 */
export function estimateHSPFromSmiles(smiles: string, molarVolumeCm3Mol: number): HspEstimate | null {
  if (!smiles || !Number.isFinite(molarVolumeCm3Mol) || molarVolumeCm3Mol <= 0) return null;

  let mol: any;
  try {
    mol = OCL.Molecule.fromSmiles(smiles);
    mol.ensureHelperArrays(OCL.Molecule.cHelperRings);
  } catch {
    return null;
  }

  const counts: Record<string, number> = {};
  const add = (key: string, n = 1) => {
    counts[key] = (counts[key] || 0) + n;
  };

  const atomCount = mol.getAllAtoms();
  const consumed = new Set<number>(); // atoms already assigned to a multi-atom group

  // --- Pass 1: multi-atom oxygen groups anchored on carbonyl carbons ---
  for (let i = 0; i < atomCount; i++) {
    if (mol.getAtomicNo(i) !== 6 || consumed.has(i)) continue;

    // Find a double-bonded oxygen on this carbon
    let carbonylO = -1;
    let singleO: number[] = [];
    for (let j = 0; j < mol.getConnAtoms(i); j++) {
      const nbr = mol.getConnAtom(i, j);
      if (mol.getAtomicNo(nbr) !== 8) continue;
      const bond = mol.getBond(i, nbr);
      if (mol.getBondOrder(bond) === 2) carbonylO = nbr;
      else singleO.push(nbr);
    }
    if (carbonylO < 0) continue;

    const hOnC = mol.getAllHydrogens(i);
    if (singleO.length > 0) {
      // -C(=O)O- : acid if the single O carries H, else ester
      const o = singleO[0];
      const acid = mol.getAllHydrogens(o) > 0;
      add(acid ? "COOH" : "COOester");
      consumed.add(i);
      consumed.add(carbonylO);
      consumed.add(o);
    } else if (hOnC > 0) {
      add("CHO");
      consumed.add(i);
      consumed.add(carbonylO);
    } else {
      add("COketone");
      consumed.add(i);
      consumed.add(carbonylO);
    }
  }

  // --- Pass 2: nitriles ---
  for (let i = 0; i < atomCount; i++) {
    if (mol.getAtomicNo(i) !== 6 || consumed.has(i)) continue;
    for (let j = 0; j < mol.getConnAtoms(i); j++) {
      const nbr = mol.getConnAtom(i, j);
      if (mol.getAtomicNo(nbr) === 7 && mol.getBondOrder(mol.getBond(i, nbr)) === 3) {
        add("CN");
        consumed.add(i);
        consumed.add(nbr);
      }
    }
  }

  // --- Pass 3: remaining atoms ---
  for (let i = 0; i < atomCount; i++) {
    if (consumed.has(i)) continue;
    const z = mol.getAtomicNo(i);
    const h = mol.getAllHydrogens(i);
    const aromatic = mol.isAromaticAtom(i);
    const pi = mol.getAtomPi(i);

    switch (z) {
      case 6: // carbon
        if (aromatic) add(h > 0 ? "arCH" : "arC");
        else if (pi > 0) add(h >= 2 ? "=CH2" : h === 1 ? "=CH" : "=C");
        else add(h >= 3 ? "CH3" : h === 2 ? "CH2" : h === 1 ? "CH" : "C");
        break;
      case 8: // oxygen
        add(h > 0 ? "OH" : "Oether");
        break;
      case 7: // nitrogen
        add(h >= 2 ? "NH2" : h === 1 ? "NH" : "N");
        break;
      case 9:
        add("F");
        break;
      case 17:
        add("Cl");
        break;
      case 35:
        add("Br");
        break;
      case 1:
        break; // explicit hydrogens are counted on their heavy atom
      default:
        // S, P, Si, metals… — not covered; refuse to guess
        return null;
    }
  }

  // Non-aromatic ring correction
  const ringSet = mol.getRingSet();
  let nonAromaticRings = 0;
  for (let r = 0; r < ringSet.getSize(); r++) {
    if (!ringSet.isAromatic(r)) nonAromaticRings++;
  }
  if (nonAromaticRings > 0) add("ringNonAromatic", nonAromaticRings);

  // --- Sum contributions ---
  let sumFd = 0;
  let sumFp2 = 0;
  let sumEh = 0;
  for (const [key, n] of Object.entries(counts)) {
    const g = GROUPS[key];
    if (!g) continue;
    sumFd += g.fd * n;
    sumFp2 += g.fp * g.fp * n;
    sumEh += g.eh * n;
  }

  const V = molarVolumeCm3Mol;
  const hansenD = sumFd / V;
  const hansenP = Math.sqrt(sumFp2) / V;
  const hansenH = Math.sqrt(Math.max(0, sumEh) / V);

  // Sanity: reject clearly unphysical results
  if (!Number.isFinite(hansenD) || hansenD < 10 || hansenD > 25) return null;

  return {
    hansenD: Math.round(hansenD * 100) / 100,
    hansenP: Math.round(hansenP * 100) / 100,
    hansenH: Math.round(hansenH * 100) / 100,
    molarVolume: V,
    method: "van_krevelen_group_contribution",
    uncertainty: 2.0,
    groupCounts: counts,
  };
}
