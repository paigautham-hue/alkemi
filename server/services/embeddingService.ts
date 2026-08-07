/**
 * Embedding Service — real semantic embeddings with a provider chain.
 *
 * Replaces the former character-code-hash "embeddings" in ragService, which
 * carried no semantic structure (cosine similarity over them was noise).
 *
 * Provider chain:
 * 1. Forge gateway `/v1/embeddings` (OpenAI-compatible, text-embedding-3-small,
 *    1536-dim). Availability is probed once and cached for the process.
 * 2. Local ONNX model via @xenova/transformers (all-MiniLM-L6-v2, 384-dim),
 *    lazily loaded on first use so it costs nothing when Forge works.
 *
 * Because the two providers emit different dimensions, every consumer must
 * treat vectors of different lengths as incomparable (similarity 0) rather
 * than an error — see `safeCosineSimilarity`.
 */
import { ENV } from "../_core/env";

export type EmbeddingProvider = "forge" | "local";

const FORGE_EMBEDDINGS_URL =
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/embeddings`
    : "https://forge.manus.im/v1/embeddings";

const FORGE_EMBEDDING_MODEL = "text-embedding-3-small";

/** null = unknown (not probed yet), true/false = probed result */
let forgeAvailable: boolean | null = null;

/** Lazy singleton for the local transformer pipeline */
let localPipelinePromise: Promise<any> | null = null;

async function embedWithForge(texts: string[]): Promise<number[][] | null> {
  if (forgeAvailable === false || !ENV.forgeApiKey) return null;

  try {
    const response = await fetch(FORGE_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({ model: FORGE_EMBEDDING_MODEL, input: texts }),
    });

    if (!response.ok) {
      // 404/405 → endpoint not offered by the gateway; don't retry this process
      if (response.status === 404 || response.status === 405 || response.status === 501) {
        forgeAvailable = false;
        console.warn(
          `[EmbeddingService] Forge embeddings endpoint unavailable (HTTP ${response.status}); falling back to local model`
        );
        return null;
      }
      throw new Error(`Forge embeddings HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      data: Array<{ index: number; embedding: number[] }>;
    };
    if (!payload?.data?.length) {
      forgeAvailable = false;
      return null;
    }

    forgeAvailable = true;
    // Preserve input order
    const sorted = [...payload.data].sort((a, b) => a.index - b.index);
    return sorted.map(d => d.embedding);
  } catch (error) {
    // Network/transient error: don't permanently disable, just fall back this call
    console.warn("[EmbeddingService] Forge embeddings failed:", error);
    return null;
  }
}

async function getLocalPipeline(): Promise<any> {
  if (!localPipelinePromise) {
    localPipelinePromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    })();
  }
  return localPipelinePromise;
}

async function embedWithLocal(texts: string[]): Promise<number[][]> {
  const extractor = await getLocalPipeline();
  const results: number[][] = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data as Float32Array));
  }
  return results;
}

/**
 * Generate an embedding for a single text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

/**
 * Generate embeddings for a batch of texts (preferred — one Forge round trip).
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const truncated = texts.map(t => (t.length > 8000 ? t.slice(0, 8000) : t));

  const forgeResult = await embedWithForge(truncated);
  if (forgeResult) return forgeResult;

  return embedWithLocal(truncated);
}

/**
 * Cosine similarity that treats dimension mismatches (vectors from different
 * providers) as "no signal" instead of throwing.
 */
export function safeCosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Cheap lexical overlap score in [0,1] — fallback relevance signal for records
 * that don't have a stored embedding yet.
 */
export function lexicalOverlapScore(query: string, text: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(w => w.length > 2)
    );
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return 0;
  const textTokens = tokenize(text);
  let hits = 0;
  queryTokens.forEach(token => {
    if (textTokens.has(token)) hits++;
  });
  return hits / queryTokens.size;
}
