import { invokeLLM } from "../_core/llm";

/**
 * Recursive Language Models (RLM) Framework - MULTI_LLM_PLAYBOOK_v3_2
 * Process documents larger than context windows through smart chunking + hierarchical synthesis
 */

export interface ChunkingOptions {
  maxChunkSize?: number;
  overlap?: number;
  contentType?: "code" | "markdown" | "prose";
}

export interface RLMProgress {
  phase: "chunking" | "processing" | "synthesis";
  current: number;
  total: number;
  percentComplete: number;
}

export interface RLMResult {
  answer: string;
  chunksProcessed: number;
  synthesisRounds: number;
  tokensUsed: number;
}

function detectContentType(content: string): "code" | "markdown" | "prose" {
  if (content.includes("```") || /function\s+\w+|class\s+\w+|import\s+/.test(content)) return "code";
  if (content.includes("# ") || content.includes("## ") || content.includes("- ")) return "markdown";
  return "prose";
}

function smartChunk(content: string, options: ChunkingOptions = {}): string[] {
  const { maxChunkSize = 8000, overlap = 500, contentType = detectContentType(content) } = options;
  
  const chunks: string[] = [];
  let boundaries: number[] = [];
  
  if (contentType === "code") {
    const regex = /\n(?=function |class |export |import )/g;
    let match;
    while ((match = regex.exec(content)) !== null) boundaries.push(match.index);
  } else if (contentType === "markdown") {
    const regex = /\n(?=#{1,3} )/g;
    let match;
    while ((match = regex.exec(content)) !== null) boundaries.push(match.index);
  } else {
    const regex = /\n\n/g;
    let match;
    while ((match = regex.exec(content)) !== null) boundaries.push(match.index);
  }
  
  if (boundaries.length === 0) {
    for (let i = 0; i < content.length; i += maxChunkSize - overlap) {
      chunks.push(content.substring(i, i + maxChunkSize));
    }
    return chunks;
  }
  
  let start = 0;
  for (const boundary of boundaries) {
    if (boundary - start >= maxChunkSize) {
      chunks.push(content.substring(start, boundary));
      start = Math.max(boundary - overlap, start);
    }
  }
  if (start < content.length) {
    chunks.push(content.substring(start));
  }
  
  return chunks;
}

async function processChunks(
  chunks: string[],
  prompt: string,
  onProgress?: (progress: RLMProgress) => void
): Promise<{ summaries: string[]; tokensUsed: number }> {
  const summaries: string[] = [];
  let tokensUsed = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({
      phase: "processing",
      current: i + 1,
      total: chunks.length,
      percentComplete: Math.round(((i + 1) / chunks.length) * 50),
    });
    
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert analyst. Summarize the key information from this chunk relevant to the user's question." },
        { role: "user", content: `Question: ${prompt}\n\nContent chunk ${i + 1}/${chunks.length}:\n${chunks[i]}` }
      ],
      temperature: 0.2,
    });
    
    const content = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content : "";
    summaries.push(content);
    tokensUsed += (response.usage?.total_tokens || 0);
  }
  
  return { summaries, tokensUsed };
}

async function hierarchicalSynthesis(
  summaries: string[],
  prompt: string,
  onProgress?: (progress: RLMProgress) => void
): Promise<{ answer: string; rounds: number; tokensUsed: number }> {
  let current = summaries;
  let rounds = 0;
  let tokensUsed = 0;
  const batchSize = 5;
  
  while (current.length > 1) {
    rounds++;
    const batches: string[][] = [];
    
    for (let i = 0; i < current.length; i += batchSize) {
      batches.push(current.slice(i, i + batchSize));
    }
    
    const nextLevel: string[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      onProgress?.({
        phase: "synthesis",
        current: i + 1,
        total: batches.length,
        percentComplete: 50 + Math.round(((i + 1) / batches.length) * 50),
      });
      
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are synthesizing multiple summaries into a coherent answer." },
          { role: "user", content: `Question: ${prompt}\n\nSummaries to synthesize:\n${batches[i].map((s, j) => `[${j + 1}] ${s}`).join("\n\n")}` }
        ],
        temperature: 0.3,
      });
      
      const content = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0].message.content : "";
      nextLevel.push(content);
      tokensUsed += (response.usage?.total_tokens || 0);
    }
    
    current = nextLevel;
  }
  
  return { answer: current[0] || "", rounds, tokensUsed };
}

export async function processLongDocument(
  content: string,
  prompt: string,
  options: ChunkingOptions = {},
  onProgress?: (progress: RLMProgress) => void
): Promise<RLMResult> {
  onProgress?.({ phase: "chunking", current: 0, total: 1, percentComplete: 0 });
  
  const chunks = smartChunk(content, options);
  console.log(`[RLM] Document split into ${chunks.length} chunks`);
  
  const { summaries, tokensUsed: chunkTokens } = await processChunks(chunks, prompt, onProgress);
  const { answer, rounds, tokensUsed: synthesisTokens } = await hierarchicalSynthesis(summaries, prompt, onProgress);
  
  return {
    answer,
    chunksProcessed: chunks.length,
    synthesisRounds: rounds,
    tokensUsed: chunkTokens + synthesisTokens,
  };
}

export async function analyzePatentWithRLM(patentText: string, question: string, onProgress?: (progress: RLMProgress) => void): Promise<RLMResult> {
  return processLongDocument(patentText, question, { maxChunkSize: 10000, contentType: "prose" }, onProgress);
}

export async function analyzeLiteratureWithRLM(papers: string[], question: string, onProgress?: (progress: RLMProgress) => void): Promise<RLMResult> {
  const combined = papers.join("\n\n=== NEXT PAPER ===\n\n");
  return processLongDocument(combined, question, { maxChunkSize: 8000, contentType: "prose" }, onProgress);
}

export async function analyzeMultipleDocumentsWithGrok(documents: string[], question: string): Promise<RLMResult> {
  const combined = documents.join("\n\n=== NEXT DOCUMENT ===\n\n");
  
  if (combined.length < 500000) {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert analyst with access to multiple documents." },
        { role: "user", content: `Question: ${question}\n\nDocuments:\n${combined}` }
      ],
      temperature: 0.3,
    });
    
    const content = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content : "";
    
    return {
      answer: content,
      chunksProcessed: documents.length,
      synthesisRounds: 0,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }
  
  return processLongDocument(combined, question, { maxChunkSize: 50000 });
}
