/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Provides intelligent document search using:
 * - PDF text extraction
 * - Document chunking
 * - Vector embeddings
 * - Semantic search
 * - Hybrid search (semantic + keyword)
 * 
 * Based on ALKEMI v5.1 Specification §16: Document RAG
 */

// @ts-ignore - pdf-parse has CommonJS export
const pdfParse = require("pdf-parse");
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import * as embeddings from "./services/embeddingService";

export interface ChunkMetadata {
  pageNumber?: number;
  section?: string;
  [key: string]: any;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[] | null;
  pageNumber?: number | null;
  metadata?: ChunkMetadata | null;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document: {
    id: string;
    title: string;
    filename: string;
  };
}

/**
 * Extract text from PDF file buffer
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<{
  text: string;
  numPages: number;
  metadata: any;
}> {
  try {
    const data = await pdfParse.default ? pdfParse.default(fileBuffer) : pdfParse(fileBuffer);
    
    return {
      text: data.text,
      numPages: data.numpages,
      metadata: data.info || {},
    };
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Split text into chunks for embedding
 * 
 * Strategy:
 * - Target 500-1000 tokens per chunk
 * - Split on paragraph boundaries when possible
 * - Maintain 100-token overlap between chunks for context
 */
export function chunkText(
  text: string,
  options: {
    maxChunkSize?: number;
    overlap?: number;
  } = {}
): string[] {
  const maxChunkSize = options.maxChunkSize || 800; // tokens (roughly 3200 chars)
  const overlap = options.overlap || 100; // tokens (roughly 400 chars)
  
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxChunkSize * 4;
  const overlapChars = overlap * 4;
  
  const chunks: string[] = [];
  
  // Split on double newlines (paragraphs) first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let previousChunk = '';
  
  for (const paragraph of paragraphs) {
    const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
    
    if (testChunk.length <= maxChars) {
      currentChunk = testChunk;
    } else {
      // Current chunk is full, save it
      if (currentChunk) {
        chunks.push(currentChunk);
        
        // Start new chunk with overlap from previous
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.floor(overlapChars / 5)); // rough word count
        previousChunk = overlapWords.join(' ');
      }
      
      // If paragraph itself is too long, split it
      if (paragraph.length > maxChars) {
        const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
        let sentenceChunk = previousChunk;
        
        for (const sentence of sentences) {
          const testSentence = sentenceChunk + (sentenceChunk ? '. ' : '') + sentence;
          
          if (testSentence.length <= maxChars) {
            sentenceChunk = testSentence;
          } else {
            if (sentenceChunk) {
              chunks.push(sentenceChunk);
            }
            sentenceChunk = sentence;
          }
        }
        
        currentChunk = sentenceChunk;
      } else {
        currentChunk = previousChunk + (previousChunk ? '\n\n' : '') + paragraph;
      }
    }
  }
  
  // Add final chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Generate embedding vector for text.
 *
 * Delegates to the embedding service (Forge /v1/embeddings with a local
 * MiniLM fallback). The former hash-based placeholder produced semantically
 * meaningless vectors and has been removed.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    return await embeddings.generateEmbedding(text);
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate cosine similarity between two vectors.
 *
 * Vectors of differing dimension (chunks embedded by a different provider
 * before a re-embed backfill) score 0 rather than throwing.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  return embeddings.safeCosineSimilarity(a, b);
}

/**
 * Re-embed every chunk whose stored vector doesn't match the current
 * provider's dimension (or is missing). Run after switching embedding
 * providers or to heal legacy hash-based vectors.
 */
export async function reembedAllChunks(organizationId: string): Promise<{ reembedded: number; total: number }> {
  const chunks = await db.getDocumentChunks(organizationId);
  if (chunks.length === 0) return { reembedded: 0, total: 0 };

  // Determine the active provider's dimension from a probe embedding
  const probe = await generateEmbedding("dimension probe");
  const dim = probe.length;

  let reembedded = 0;
  for (const chunk of chunks) {
    if (chunk.embedding && chunk.embedding.length === dim) continue;
    const embedding = await generateEmbedding(chunk.content);
    await db.updateDocumentChunkEmbedding(chunk.id, embedding);
    reembedded++;
  }

  return { reembedded, total: chunks.length };
}

/**
 * Process a document: extract text, chunk, and generate embeddings
 */
export async function processDocument(
  documentId: string,
  fileBuffer: Buffer,
  organizationId: string
): Promise<{
  numChunks: number;
  numPages: number;
}> {
  // Extract text from PDF
  const { text, numPages } = await extractTextFromPDF(fileBuffer);
  
  // Chunk the text
  const chunks = chunkText(text);
  
  // Generate embeddings and store chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    
    await db.createDocumentChunk({
      documentId,
      chunkIndex: i,
      content: chunk,
      embedding,
      metadata: {},
    });
  }
  
  return {
    numChunks: chunks.length,
    numPages,
  };
}

/**
 * Semantic search across document chunks
 */
export async function semanticSearch(
  query: string,
  organizationId: string,
  options: {
    limit?: number;
    minScore?: number;
    documentIds?: string[];
  } = {}
): Promise<SearchResult[]> {
  const limit = options.limit || 5;
  const minScore = options.minScore || 0.5;
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Get all chunks (with optional document filter)
  const chunks = await db.getDocumentChunks(organizationId, options.documentIds);
  
  // Calculate similarity scores
  const results: SearchResult[] = [];
  
  for (const chunk of chunks) {
    if (!chunk.embedding) continue;
    
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    
    if (score >= minScore) {
      results.push({
        chunk,
        score,
        document: {
          id: chunk.documentId,
          title: '', // Will be populated by caller
          filename: '',
        },
      });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  // Return top results
  return results.slice(0, limit);
}

/**
 * Keyword search across document chunks
 */
export async function keywordSearch(
  query: string,
  organizationId: string,
  options: {
    limit?: number;
    documentIds?: string[];
  } = {}
): Promise<SearchResult[]> {
  const limit = options.limit || 5;
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Get all chunks
  const chunks = await db.getDocumentChunks(organizationId, options.documentIds);
  
  // Calculate keyword match scores
  const results: SearchResult[] = [];
  
  for (const chunk of chunks) {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;
    
    // Count keyword matches
    for (const word of queryWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = contentLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    
    // Normalize by chunk length
    score = score / (chunk.content.length / 100);
    
    if (score > 0) {
      results.push({
        chunk,
        score,
        document: {
          id: chunk.documentId,
          title: '',
          filename: '',
        },
      });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, limit);
}

/**
 * Hybrid search combining semantic and keyword search
 */
export async function hybridSearch(
  query: string,
  organizationId: string,
  options: {
    limit?: number;
    semanticWeight?: number;
    keywordWeight?: number;
    documentIds?: string[];
  } = {}
): Promise<SearchResult[]> {
  const limit = options.limit || 5;
  const semanticWeight = options.semanticWeight || 0.7;
  const keywordWeight = options.keywordWeight || 0.3;
  
  // Run both searches in parallel
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, organizationId, { limit: limit * 2, documentIds: options.documentIds }),
    keywordSearch(query, organizationId, { limit: limit * 2, documentIds: options.documentIds }),
  ]);
  
  // Combine scores
  const scoreMap = new Map<string, { chunk: DocumentChunk; semanticScore: number; keywordScore: number; document: any }>();
  
  for (const result of semanticResults) {
    scoreMap.set(result.chunk.id, {
      chunk: result.chunk,
      semanticScore: result.score,
      keywordScore: 0,
      document: result.document,
    });
  }
  
  for (const result of keywordResults) {
    const existing = scoreMap.get(result.chunk.id);
    if (existing) {
      existing.keywordScore = result.score;
    } else {
      scoreMap.set(result.chunk.id, {
        chunk: result.chunk,
        semanticScore: 0,
        keywordScore: result.score,
        document: result.document,
      });
    }
  }
  
  // Calculate combined scores
  const combinedResults: SearchResult[] = Array.from(scoreMap.values()).map(item => ({
    chunk: item.chunk,
    score: item.semanticScore * semanticWeight + item.keywordScore * keywordWeight,
    document: item.document,
  }));
  
  // Sort by combined score
  combinedResults.sort((a, b) => b.score - a.score);
  
  return combinedResults.slice(0, limit);
}

/**
 * Query documents with RAG and generate answer
 */
export async function queryWithRAG(
  question: string,
  organizationId: string,
  options: {
    documentIds?: string[];
    maxChunks?: number;
  } = {}
): Promise<{
  answer: string;
  sources: SearchResult[];
}> {
  const maxChunks = options.maxChunks || 3;
  
  // Search for relevant chunks
  const results = await hybridSearch(question, organizationId, {
    limit: maxChunks,
    documentIds: options.documentIds,
  });
  
  if (results.length === 0) {
    return {
      answer: "I couldn't find any relevant information in the documents to answer your question.",
      sources: [],
    };
  }
  
  // Build context from top chunks
  const context = results
    .map((r, idx) => `[Source ${idx + 1}]\n${r.chunk.content}`)
    .join('\n\n---\n\n');
  
  // Generate answer using LLM
  const systemPrompt = `You are a helpful assistant that answers questions based on provided document excerpts. 
Always cite your sources using [Source N] notation. If the documents don't contain enough information to answer the question, say so clearly.`;
  
  const userPrompt = `Context from documents:\n\n${context}\n\n---\n\nQuestion: ${question}\n\nPlease provide a detailed answer based on the context above, citing your sources.`;
  
  const response = await invokeLLM({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  
  const answerContent = response.choices[0]?.message?.content;
  const answer = typeof answerContent === 'string' ? answerContent : "I couldn't generate an answer.";
  
  return {
    answer,
    sources: results,
  };
}
