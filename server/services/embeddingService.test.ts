/**
 * Embedding service — pure-function tests (no network/model download).
 */
import { describe, it, expect } from "vitest";
import { safeCosineSimilarity, lexicalOverlapScore } from "./embeddingService";

describe("safeCosineSimilarity", () => {
  it("computes cosine similarity for aligned vectors", () => {
    expect(safeCosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 6);
    expect(safeCosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(safeCosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 6);
  });

  it("returns 0 (not throw) on dimension mismatch — mixed-provider vectors", () => {
    expect(safeCosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  it("returns 0 for empty or zero vectors", () => {
    expect(safeCosineSimilarity([], [])).toBe(0);
    expect(safeCosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("lexicalOverlapScore", () => {
  it("scores full overlap as 1", () => {
    expect(lexicalOverlapScore("epoxy viscosity", "The epoxy viscosity was high")).toBe(1);
  });

  it("scores partial overlap proportionally", () => {
    // query tokens: {epoxy, viscosity}; text contains only "epoxy"
    expect(lexicalOverlapScore("epoxy viscosity", "epoxy resin blend")).toBeCloseTo(0.5, 6);
  });

  it("ignores short stop-like tokens (<=2 chars)", () => {
    expect(lexicalOverlapScore("of at it", "completely unrelated text")).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(lexicalOverlapScore("TiO2 Pigment", "tio2 pigment dispersion")).toBe(1);
  });
});
