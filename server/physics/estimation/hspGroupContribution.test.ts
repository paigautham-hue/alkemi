/**
 * Group-contribution HSP estimation — validation against literature values.
 * Tolerance ±2.5 MPa^0.5 (the method's documented accuracy class).
 */
import { describe, it, expect } from "vitest";
import { estimateHSPFromSmiles } from "./hspGroupContribution";

describe("estimateHSPFromSmiles (van Krevelen)", () => {
  it("acetone (lit: 15.5 / 10.4 / 7.0, V=74)", () => {
    const est = estimateHSPFromSmiles("CC(=O)C", 74);
    expect(est).not.toBeNull();
    expect(est!.hansenD).toBeGreaterThan(13);
    expect(est!.hansenD).toBeLessThan(18);
    expect(est!.hansenP).toBeGreaterThan(7.9);
    expect(est!.hansenP).toBeLessThan(13);
    expect(est!.hansenH).toBeGreaterThan(4.5);
    expect(est!.hansenH).toBeLessThan(9.5);
  });

  it("ethanol (lit: 15.8 / 8.8 / 19.4, V=58.5)", () => {
    const est = estimateHSPFromSmiles("CCO", 58.5);
    expect(est).not.toBeNull();
    expect(est!.hansenD).toBeGreaterThan(13);
    expect(est!.hansenD).toBeLessThan(18.5);
    expect(est!.hansenP).toBeGreaterThan(6.3);
    expect(est!.hansenP).toBeLessThan(11.3);
    expect(est!.hansenH).toBeGreaterThan(16.5);
    expect(est!.hansenH).toBeLessThan(22);
  });

  it("toluene (lit: 18.0 / 1.4 / 2.0, V=106.8)", () => {
    const est = estimateHSPFromSmiles("Cc1ccccc1", 106.8);
    expect(est).not.toBeNull();
    expect(est!.hansenD).toBeGreaterThan(15.5);
    expect(est!.hansenD).toBeLessThan(20.5);
    expect(est!.hansenP).toBeLessThan(4);
    expect(est!.hansenH).toBeLessThan(4.5);
  });

  it("n-butyl acetate (lit: 15.8 / 3.7 / 6.3, V=132.5)", () => {
    const est = estimateHSPFromSmiles("CCCCOC(=O)C", 132.5);
    expect(est).not.toBeNull();
    expect(est!.hansenD).toBeGreaterThan(13.3);
    expect(est!.hansenD).toBeLessThan(18.3);
    expect(est!.hansenP).toBeGreaterThan(1.2);
    expect(est!.hansenP).toBeLessThan(6.5);
    expect(est!.hansenH).toBeGreaterThan(3.8);
    expect(est!.hansenH).toBeLessThan(8.8);
  });

  it("counts ester group once (not ketone + ether)", () => {
    const est = estimateHSPFromSmiles("CCCCOC(=O)C", 132.5);
    expect(est!.groupCounts["COOester"]).toBe(1);
    expect(est!.groupCounts["COketone"]).toBeUndefined();
    expect(est!.groupCounts["Oether"]).toBeUndefined();
  });

  it("refuses structures with uncovered atoms (siloxane)", () => {
    expect(estimateHSPFromSmiles("C[Si](C)(C)O[Si](C)(C)C", 150)).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(estimateHSPFromSmiles("not-smiles!!!", 100)).toBeNull();
    expect(estimateHSPFromSmiles("CCO", 0)).toBeNull();
  });
});
