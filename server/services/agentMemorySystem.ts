import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import crypto from "crypto";
import {
  generateEmbedding,
  safeCosineSimilarity,
  lexicalOverlapScore,
} from "./embeddingService";

/**
 * Agentic Memory System - MULTI_LLM_PLAYBOOK_v3_2
 * Persistent, self-verifying knowledge system for formulation intelligence
 */

export type MemoryCategory = 
  | "formulation_insight" | "material_property" | "process_parameter"
  | "trial_learning" | "supplier_intelligence" | "compliance_rule"
  | "troubleshooting" | "cost_optimization" | "quality_insight";

export interface Citation {
  type: "trial" | "formulation" | "material" | "document" | "external";
  id: string;
  title: string;
  url?: string;
}

export interface Memory {
  id: number;
  organizationId: string;
  openId?: string;
  fact: string;
  rationale?: string;
  category: MemoryCategory;
  confidence: number;
  citations?: Citation[];
  tags?: string[];
  sourceHash?: string;
  verifiedAt?: Date;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreMemoryParams {
  organizationId: string;
  openId?: string;
  fact: string;
  rationale?: string;
  category: MemoryCategory;
  citations?: Citation[];
  tags?: string[];
  confidence?: number;
}

export interface RetrieveMemoryParams {
  organizationId: string;
  query: string;
  category?: MemoryCategory;
  tags?: string[];
  maxResults?: number;
  verify?: boolean;
}

function generateSourceHash(citations: Citation[]): string {
  const data = JSON.stringify(citations.sort((a, b) => a.id.localeCompare(b.id)));
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 16);
}

export async function storeMemory(params: StoreMemoryParams): Promise<Memory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sourceHash = params.citations ? generateSourceHash(params.citations) : null;

  // Embed at write time so retrieval can rank semantically. Non-fatal on
  // failure (or pre-migration schema) — retrieval falls back to lexical.
  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(`${params.fact} ${params.rationale || ""}`);
  } catch (error) {
    console.warn("[Memory] Embedding at store time failed:", error);
  }

  let result: any;
  try {
    result = await db.execute(sql`
      INSERT INTO agent_memories (organization_id, open_id, fact, rationale, category, confidence, citations, tags, source_hash, embedding, is_valid)
      VALUES (${params.organizationId}, ${params.openId || null}, ${params.fact}, ${params.rationale || null},
              ${params.category}, ${params.confidence || 0.8}, ${JSON.stringify(params.citations || [])},
              ${JSON.stringify(params.tags || [])}, ${sourceHash}, ${embedding ? JSON.stringify(embedding) : null}, TRUE)
    `);
  } catch (error: any) {
    if (error?.code === "ER_BAD_FIELD_ERROR" || /Unknown column/i.test(String(error?.message))) {
      // Pre-migration schema without the embedding column
      result = await db.execute(sql`
        INSERT INTO agent_memories (organization_id, open_id, fact, rationale, category, confidence, citations, tags, source_hash, is_valid)
        VALUES (${params.organizationId}, ${params.openId || null}, ${params.fact}, ${params.rationale || null},
                ${params.category}, ${params.confidence || 0.8}, ${JSON.stringify(params.citations || [])},
                ${JSON.stringify(params.tags || [])}, ${sourceHash}, TRUE)
      `);
    } else {
      throw error;
    }
  }

  const insertId = (result as any).insertId || (result as any)[0]?.insertId;
  
  return {
    id: insertId,
    organizationId: params.organizationId,
    openId: params.openId,
    fact: params.fact,
    rationale: params.rationale,
    category: params.category,
    confidence: params.confidence || 0.8,
    citations: params.citations,
    tags: params.tags,
    sourceHash: sourceHash || undefined,
    isValid: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** How many candidate rows to pull for relevance ranking */
const RETRIEVAL_CANDIDATE_POOL = 200;
/** Max memories to lazily embed-and-persist per retrieval call */
const LAZY_EMBED_BUDGET = 20;

function rowToMemory(row: any): Memory & { embedding?: number[] | null } {
  let embedding: number[] | null = null;
  if (row.embedding) {
    try {
      embedding = typeof row.embedding === "string" ? JSON.parse(row.embedding) : row.embedding;
    } catch {
      embedding = null;
    }
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    openId: row.open_id,
    fact: row.fact,
    rationale: row.rationale,
    category: row.category as MemoryCategory,
    confidence: parseFloat(row.confidence) || 0.8,
    citations: typeof row.citations === 'string' ? JSON.parse(row.citations) : row.citations,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    sourceHash: row.source_hash,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
    isValid: Boolean(row.is_valid),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    embedding,
  };
}

/**
 * Retrieve memories ranked by RELEVANCE to the query (embedding similarity
 * with a lexical-overlap fallback), then by confidence.
 *
 * Previously this ignored `query` and `tags` entirely and returned the org's
 * top-N memories by confidence — presenting unrelated facts to the prediction
 * engine as if they were relevant evidence.
 *
 * Memories without a stored embedding are scored lexically and lazily
 * embedded-and-persisted (bounded per call) so the store heals over time.
 * If the `embedding` column doesn't exist yet (pre-migration DB), retrieval
 * still works — ranking just uses the lexical signal.
 */
export async function retrieveMemories(params: RetrieveMemoryParams): Promise<Memory[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = sql`
    SELECT * FROM agent_memories
    WHERE organization_id = ${params.organizationId}
    AND is_valid = TRUE
  `;

  if (params.category) {
    query = sql`${query} AND category = ${params.category}`;
  }

  query = sql`${query} ORDER BY confidence DESC, updated_at DESC LIMIT ${RETRIEVAL_CANDIDATE_POOL}`;

  const results = await db.execute(query);
  const rows = (results as any)[0] || results;
  const candidates = Array.isArray(rows) ? rows.map(rowToMemory) : [];

  const maxResults = params.maxResults || 10;
  if (candidates.length === 0) return [];

  const trimmedQuery = params.query?.trim();
  let ranked: Array<Memory & { embedding?: number[] | null }>;

  if (!trimmedQuery) {
    ranked = candidates;
  } else {
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(trimmedQuery);
    } catch (error) {
      console.warn("[Memory] Query embedding failed, using lexical ranking only:", error);
    }

    const tagSet = new Set((params.tags || []).map(t => t.toLowerCase()));

    const scored = candidates.map(memory => {
      const memoryText = `${memory.fact} ${memory.rationale || ""}`;

      // Semantic signal when both sides have comparable embeddings,
      // otherwise lexical overlap.
      let relevance: number;
      if (queryEmbedding && memory.embedding) {
        relevance = safeCosineSimilarity(queryEmbedding, memory.embedding);
        if (relevance === 0 && memory.embedding.length !== queryEmbedding.length) {
          relevance = lexicalOverlapScore(trimmedQuery, memoryText);
        }
      } else {
        relevance = lexicalOverlapScore(trimmedQuery, memoryText);
      }

      // Tag filter boost (tags param was previously accepted and unused)
      let tagBoost = 0;
      if (tagSet.size > 0 && memory.tags?.length) {
        const overlap = memory.tags.filter(t => tagSet.has(t.toLowerCase())).length;
        tagBoost = 0.1 * (overlap / tagSet.size);
      }

      // Relevance dominates; confidence breaks ties
      return { memory, score: relevance + tagBoost + memory.confidence * 0.05 };
    });

    scored.sort((a, b) => b.score - a.score);
    ranked = scored.map(s => s.memory);

    // Lazily persist embeddings for candidates missing them (fire-and-forget)
    if (queryEmbedding) {
      const missing = candidates.filter(m => !m.embedding).slice(0, LAZY_EMBED_BUDGET);
      if (missing.length > 0) {
        void backfillMemoryEmbeddings(missing).catch(err =>
          console.warn("[Memory] Embedding backfill failed:", err)
        );
      }
    }
  }

  const memories = ranked.slice(0, maxResults).map(({ embedding: _e, ...memory }) => memory as Memory);

  // JIT Verification if requested
  if (params.verify && memories.length > 0) {
    for (const memory of memories) {
      await verifyMemory(memory);
    }
  }

  return memories;
}

/**
 * Persist embeddings for memories that lack them. Tolerates a pre-migration
 * schema (missing `embedding` column) by downgrading to a no-op.
 */
async function backfillMemoryEmbeddings(memories: Array<Memory & { embedding?: number[] | null }>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const memory of memories) {
    try {
      const embedding = await generateEmbedding(`${memory.fact} ${memory.rationale || ""}`);
      await db.execute(sql`
        UPDATE agent_memories SET embedding = ${JSON.stringify(embedding)} WHERE id = ${memory.id}
      `);
    } catch (error: any) {
      // ER_BAD_FIELD_ERROR → embedding column not migrated yet; stop trying
      if (error?.code === "ER_BAD_FIELD_ERROR" || /Unknown column/i.test(String(error?.message))) {
        console.warn("[Memory] embedding column missing — run the agent_memories migration to enable semantic ranking persistence");
        return;
      }
      console.warn(`[Memory] Failed to backfill embedding for memory ${memory.id}:`, error);
    }
  }
}

async function verifyMemory(memory: Memory): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a verification assistant. Respond with JSON only: {\"valid\": true/false, \"confidence\": 0.0-1.0, \"notes\": \"reason\"}" },
        { role: "user", content: `Verify this fact is still accurate: "${memory.fact}"\nRationale: ${memory.rationale || "None provided"}` }
      ],
      temperature: 0.1,
    });
    
    const content = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content : "";
    
    const verification = JSON.parse(content);
    
    await db.execute(sql`
      INSERT INTO memory_verification_logs (memory_id, verification_result, old_confidence, new_confidence, verification_notes)
      VALUES (${memory.id}, ${verification.valid ? 'valid' : 'invalid'}, ${memory.confidence}, ${verification.confidence}, ${verification.notes})
    `);
    
    await db.execute(sql`
      UPDATE agent_memories SET confidence = ${verification.confidence}, verified_at = NOW(), is_valid = ${verification.valid}
      WHERE id = ${memory.id}
    `);
  } catch (error) {
    console.error("[Memory Verification] Error:", error);
  }
}

export function injectMemoryContext(basePrompt: string, memories: Memory[]): string {
  if (memories.length === 0) return basePrompt;
  
  const memoryContext = memories.map((m, i) => 
    `[Memory ${i + 1}] (confidence: ${(m.confidence * 100).toFixed(0)}%): ${m.fact}`
  ).join("\n");
  
  return `${basePrompt}\n\n--- Relevant Knowledge from Previous Sessions ---\n${memoryContext}\n--- End of Knowledge ---`;
}

export async function getMemoryStats(organizationId: string): Promise<{
  totalMemories: number;
  byCategory: Record<string, number>;
  avgConfidence: number;
  recentlyVerified: number;
}> {
  const db = await getDb();
  if (!db) return { totalMemories: 0, byCategory: {}, avgConfidence: 0, recentlyVerified: 0 };
  
  const results = await db.execute(sql`
    SELECT COUNT(*) as total, AVG(confidence) as avg_conf,
           SUM(CASE WHEN verified_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent
    FROM agent_memories WHERE organization_id = ${organizationId} AND is_valid = TRUE
  `);
  
  const row = (results as any)[0]?.[0] || {};
  
  return {
    totalMemories: parseInt(row.total) || 0,
    byCategory: {},
    avgConfidence: parseFloat(row.avg_conf) || 0,
    recentlyVerified: parseInt(row.recent) || 0,
  };
}

export async function cleanupInvalidMemories(organizationId: string, olderThanDays: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.execute(sql`
    UPDATE agent_memories SET is_valid = FALSE
    WHERE organization_id = ${organizationId} AND is_valid = TRUE
    AND confidence < 0.3 AND updated_at < DATE_SUB(NOW(), INTERVAL ${olderThanDays} DAY)
  `);
  
  return (result as any).affectedRows || 0;
}


// ==========================================================
// MEMORY FEEDBACK SYSTEM
// ==========================================================

export interface MemoryFeedbackParams {
  memoryId: number;
  openId: string;
  organizationId: string;
  rating: "helpful" | "not_helpful";
  context?: string; // e.g., "prediction", "debate", "patent_analysis"
}

export interface MemoryFeedbackStats {
  memoryId: number;
  helpfulCount: number;
  notHelpfulCount: number;
  totalFeedback: number;
  helpfulRatio: number;
}

/**
 * Submit feedback for a memory (thumbs up/down)
 * Updates memory confidence based on aggregate feedback
 */
export async function submitMemoryFeedback(params: MemoryFeedbackParams): Promise<{ success: boolean; newConfidence?: number }> {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    // Insert or update feedback (upsert)
    await db.execute(sql`
      INSERT INTO memory_feedback (memory_id, open_id, organization_id, rating, context)
      VALUES (${params.memoryId}, ${params.openId}, ${params.organizationId}, ${params.rating}, ${params.context || null})
      ON DUPLICATE KEY UPDATE rating = ${params.rating}, context = ${params.context || null}, created_at = CURRENT_TIMESTAMP
    `);

    // Calculate new confidence based on all feedback
    const feedbackStats = await getMemoryFeedbackStats(params.memoryId);
    
    // Adjust confidence: helpful increases, not_helpful decreases
    // Base adjustment: ±0.05 per feedback, weighted by ratio
    const confidenceAdjustment = calculateConfidenceAdjustment(feedbackStats);
    
    // Get current memory confidence
    const [memoryRow] = await db.execute(sql`
      SELECT confidence FROM agent_memories WHERE id = ${params.memoryId}
    `) as any[];
    
    if (!memoryRow || memoryRow.length === 0) {
      return { success: false };
    }
    
    const currentConfidence = parseFloat(memoryRow[0].confidence) || 0.5;
    const newConfidence = Math.max(0.1, Math.min(0.99, currentConfidence + confidenceAdjustment));
    
    // Update memory confidence
    await db.execute(sql`
      UPDATE agent_memories SET confidence = ${newConfidence}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.memoryId}
    `);

    console.log(`[MemoryFeedback] Memory ${params.memoryId}: ${params.rating}, confidence ${currentConfidence.toFixed(2)} -> ${newConfidence.toFixed(2)}`);
    
    return { success: true, newConfidence };
  } catch (error) {
    console.error("[MemoryFeedback] Error submitting feedback:", error);
    return { success: false };
  }
}

/**
 * Get feedback statistics for a memory
 */
export async function getMemoryFeedbackStats(memoryId: number): Promise<MemoryFeedbackStats> {
  const db = await getDb();
  if (!db) {
    return { memoryId, helpfulCount: 0, notHelpfulCount: 0, totalFeedback: 0, helpfulRatio: 0.5 };
  }

  const [row] = await db.execute(sql`
    SELECT 
      SUM(CASE WHEN rating = 'helpful' THEN 1 ELSE 0 END) as helpful,
      SUM(CASE WHEN rating = 'not_helpful' THEN 1 ELSE 0 END) as not_helpful,
      COUNT(*) as total
    FROM memory_feedback WHERE memory_id = ${memoryId}
  `) as any[];

  const stats = row[0] || { helpful: 0, not_helpful: 0, total: 0 };
  const helpfulCount = parseInt(stats.helpful) || 0;
  const notHelpfulCount = parseInt(stats.not_helpful) || 0;
  const totalFeedback = parseInt(stats.total) || 0;

  return {
    memoryId,
    helpfulCount,
    notHelpfulCount,
    totalFeedback,
    helpfulRatio: totalFeedback > 0 ? helpfulCount / totalFeedback : 0.5,
  };
}

/**
 * Calculate confidence adjustment based on feedback
 * Uses a weighted formula that considers total feedback volume
 */
function calculateConfidenceAdjustment(stats: MemoryFeedbackStats): number {
  if (stats.totalFeedback === 0) return 0;

  // Base adjustment per feedback point
  const baseAdjustment = 0.03;
  
  // Net feedback score (positive for helpful, negative for not helpful)
  const netScore = stats.helpfulCount - stats.notHelpfulCount;
  
  // Apply diminishing returns for large volumes
  const volumeFactor = Math.log10(stats.totalFeedback + 1) + 1;
  
  // Calculate final adjustment
  const adjustment = (netScore * baseAdjustment) / volumeFactor;
  
  // Cap adjustment to prevent extreme swings
  return Math.max(-0.15, Math.min(0.15, adjustment));
}

/**
 * Get user's feedback for a specific memory
 */
export async function getUserMemoryFeedback(
  memoryId: number, 
  openId: string
): Promise<"helpful" | "not_helpful" | null> {
  const db = await getDb();
  if (!db) return null;

  const [row] = await db.execute(sql`
    SELECT rating FROM memory_feedback 
    WHERE memory_id = ${memoryId} AND open_id = ${openId}
  `) as any[];

  if (!row || row.length === 0) return null;
  return row[0].rating as "helpful" | "not_helpful";
}

/**
 * Get all feedback for memories used in a specific context
 */
export async function getContextFeedbackSummary(
  organizationId: string,
  context: string
): Promise<{ totalFeedback: number; helpfulRatio: number; topMemories: number[] }> {
  const db = await getDb();
  if (!db) {
    return { totalFeedback: 0, helpfulRatio: 0.5, topMemories: [] };
  }

  const [rows] = await db.execute(sql`
    SELECT 
      memory_id,
      SUM(CASE WHEN rating = 'helpful' THEN 1 ELSE 0 END) as helpful,
      COUNT(*) as total
    FROM memory_feedback 
    WHERE organization_id = ${organizationId} AND context = ${context}
    GROUP BY memory_id
    ORDER BY helpful DESC
    LIMIT 10
  `) as any[];

  const allRows = rows || [];
  const totalFeedback = allRows.reduce((sum: number, r: any) => sum + parseInt(r.total), 0);
  const totalHelpful = allRows.reduce((sum: number, r: any) => sum + parseInt(r.helpful), 0);
  const topMemories = allRows.slice(0, 5).map((r: any) => r.memory_id);

  return {
    totalFeedback,
    helpfulRatio: totalFeedback > 0 ? totalHelpful / totalFeedback : 0.5,
    topMemories,
  };
}
