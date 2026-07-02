// GoalMind — Football Knowledge Base with RAG
// Uses QVAC embeddings (EmbeddingGemma 300M, on-device) for retrieval,
// and the on-device LLM for augmented answers. No cloud, no API keys.

import { embedText, embedTexts, generateText } from './models';

// ---- Types ----

export interface Document {
  id: string;
  title: string;
  content: string;
  category: 'rule' | 'history' | 'tactic' | 'player' | 'team' | 'tournament';
  metadata?: Record<string, string>;
}

export interface EmbeddingEntry {
  documentId: string;
  chunk: string;
  embedding: number[];
}

export interface RAGResult {
  document: Document;
  relevantChunk: string;
  similarity: number;
}

// ---- Knowledge Base ----

const FOOTBALL_KNOWLEDGE: Document[] = [
  // Rules
  {
    id: 'rules-offside',
    title: 'Offside Rule',
    content: 'A player is in an offside position if they are nearer to the opponents\' goal line than both the ball and the second-last opponent. A player is not offside if they are in their own half, or level with the second-last opponent, or level with the last two opponents. Being in an offside position is not an offence in itself. The player must be involved in active play by interfering with play, interfering with an opponent, or gaining an advantage from being in that position.',
    category: 'rule',
  },
  {
    id: 'rules-var',
    title: 'VAR (Video Assistant Referee)',
    content: 'VAR reviews four types of decisions: goals, penalty decisions, direct red card incidents, and mistaken identity. The referee can review footage on a pitch-side monitor or accept the VAR\'s advice. VAR only intervenes for clear and obvious errors. The process: incident occurs, VAR reviews, VAR recommends review if clear error, referee makes final decision.',
    category: 'rule',
  },
  {
    id: 'rules-penalty',
    title: 'Penalty Kicks',
    content: 'A penalty kick is awarded when a foul punishable by a direct free kick is committed inside the penalty area. The ball is placed on the penalty mark (12 yards from goal). The goalkeeper must remain on the goal line until the ball is kicked. All other players must be outside the penalty area, behind the penalty mark, and at least 10 yards from the penalty mark.',
    category: 'rule',
  },

  // Tactics
  {
    id: 'tactic-433',
    title: '4-3-3 Formation',
    content: 'The 4-3-3 is an attacking formation with four defenders, three midfielders, and three forwards. The three forwards typically consist of a center forward and two wingers. The midfield trio can be arranged as a single pivot with two attacking midfielders, or a double pivot with one attacking midfielder. Strengths: width in attack, pressing structure, numerical superiority in midfield. Weaknesses: can be exposed on the counter-attack, requires fit full-backs.',
    category: 'tactic',
  },
  {
    id: 'tactic-pressing',
    title: 'High Pressing',
    content: 'High pressing is a defensive strategy where the team pressures the opposition high up the pitch, near their own goal. The aim is to force turnovers in dangerous positions and prevent the opposition from building play from the back. Teams using high press need excellent fitness, coordinated movement, and a high defensive line. Risks: space behind the defense for through balls, fatigue in the second half.',
    category: 'tactic',
  },
  {
    id: 'tactic-counter',
    title: 'Counter-Attack',
    content: 'Counter-attacking is a tactical approach where a team defends deep and transitions quickly to attack when they win the ball. The key is speed of transition — moving the ball forward before the opposition can reorganize. Teams often use fast wingers and a target striker. Effective against teams that commit many players forward. Requires disciplined defending and clinical finishing.',
    category: 'tactic',
  },

  // History
  {
    id: 'history-wc-2022',
    title: 'FIFA World Cup 2022',
    content: 'The 2022 FIFA World Cup was held in Qatar, the first in the Middle East. Argentina won the tournament, beating France in a dramatic final that ended 3-3 after extra time, with Argentina winning 4-2 on penalties. Lionel Messi was named player of the tournament. Kylian Mbappé scored a hat-trick in the final. Morocco became the first African nation to reach the semi-finals.',
    category: 'history',
  },
  {
    id: 'history-wc-2026',
    title: 'FIFA World Cup 2026',
    content: 'The 2026 FIFA World Cup will be hosted jointly by the United States, Canada, and Mexico. It will be the first World Cup with 48 teams, expanded from 32. The tournament will feature 104 matches across 16 cities. The final will be held at MetLife Stadium in New Jersey on July 19, 2026. This will be the first World Cup hosted by three countries.',
    category: 'tournament',
  },
  {
    id: 'history-champions-league',
    title: 'UEFA Champions League',
    content: 'The UEFA Champions League is Europe\'s premier club football competition. Established in 1955 as the European Cup, it was rebranded in 1992. Real Madrid holds the record with 15 titles. The competition features 32 teams in the group stage, with knockout rounds leading to the final. From 2024/25, the format changes to a 36-team league phase with 8 matches each.',
    category: 'tournament',
  },

  // Player Analysis
  {
    id: 'player-messi',
    title: 'Lionel Messi',
    content: 'Lionel Messi is widely regarded as one of the greatest footballers of all time. Born June 24, 1987, in Rosario, Argentina. Known for his dribbling, vision, passing, and finishing. Career highlights: 8 Ballon d\'Or awards, 2022 World Cup winner, 4 Champions League titles with Barcelona, Copa America 2021 winner. Playing style: left-footed, drops deep to create, exceptional close control, lethal in the final third.',
    category: 'player',
  },
  {
    id: 'player-mbappe',
    title: 'Kylian Mbappé',
    content: 'Kylian Mbappé is a French forward born December 20, 1998, in Paris. Known for his explosive pace, clinical finishing, and ability to perform in big moments. Career highlights: 2018 World Cup winner (scored in final), 2022 World Cup hat-trick in final, multiple Ligue 1 titles with PSG. Playing style: blistering pace, direct running, versatile across the front line, clutch performer.',
    category: 'player',
  },

  // Team Analysis
  {
    id: 'team-argentina',
    title: 'Argentina National Team',
    content: 'Argentina is one of the most successful national teams, with 3 World Cup titles (1978, 1986, 2022) and 15 Copa America titles. Current style: organized under Lionel Scaloni, balanced between attack and defense, strong midfield control. Key strengths: Messi\'s creativity, strong team spirit, tactical flexibility. Recent form: 2022 World Cup champions, 2021 Copa America champions.',
    category: 'team',
  },
  {
    id: 'team-france',
    title: 'France National Team',
    content: 'France has won 2 World Cups (1998, 2018) and 2 European Championships. Current style: counter-attacking with pace on the wings, strong defensive organization. Key strengths: Mbappé\'s speed, Griezmann\'s intelligence, physical power throughout the squad. Recent form: 2018 World Cup winners, 2022 World Cup finalists.',
    category: 'team',
  },
];

// ---- Embedding Cache ----

let embeddingCache: EmbeddingEntry[] = [];
let embeddingsLoaded = false;

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Split a document into chunks for embedding.
 */
function chunkDocument(doc: Document, maxChunkSize: number = 200): string[] {
  const sentences = doc.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Initialize the knowledge base by computing embeddings for all documents.
 * Uses QVAC embeddings model for local vector computation.
 */
export async function initializeKnowledgeBase(
  onProgress?: (progress: string) => void
): Promise<void> {
  if (embeddingsLoaded) return;

  onProgress?.('Loading embeddings model...');

  // Chunk every document, then embed all chunks in one batched QVAC call.
  const pending: { documentId: string; chunk: string }[] = [];
  for (const doc of FOOTBALL_KNOWLEDGE) {
    for (const chunk of chunkDocument(doc)) {
      pending.push({ documentId: doc.id, chunk });
    }
  }

  onProgress?.(`Embedding ${pending.length} chunks on-device...`);
  const vectors = await embedTexts(pending.map((p) => p.chunk));

  embeddingCache = pending.map((p, i) => ({
    documentId: p.documentId,
    chunk: p.chunk,
    embedding: vectors[i],
  }));

  embeddingsLoaded = true;
  onProgress?.(`Knowledge base ready: ${FOOTBALL_KNOWLEDGE.length} documents, ${embeddingCache.length} chunks`);
}

/**
 * Query the knowledge base using RAG.
 * Returns the most relevant documents for a given query.
 */
export async function queryKnowledgeBase(
  query: string,
  topK: number = 3
): Promise<RAGResult[]> {
  if (!embeddingsLoaded) {
    await initializeKnowledgeBase();
  }

  // Compute query embedding with the real on-device model
  const queryEmbedding = await embedText(query);

  // Find most similar chunks
  const similarities = embeddingCache.map(entry => ({
    documentId: entry.documentId,
    chunk: entry.chunk,
    similarity: cosineSimilarity(queryEmbedding, entry.embedding),
  }));

  // Sort by similarity and take top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topResults = similarities.slice(0, topK);

  // Map to documents
  const results: RAGResult[] = [];
  for (const result of topResults) {
    const doc = FOOTBALL_KNOWLEDGE.find(d => d.id === result.documentId);
    if (doc) {
      results.push({
        document: doc,
        relevantChunk: result.chunk,
        similarity: result.similarity,
      });
    }
  }

  return results;
}

/**
 * Generate an answer using RAG (Retrieval-Augmented Generation).
 * Retrieves relevant context and generates an answer using QVAC LLM.
 */
export async function ragQuery(
  question: string,
  options?: {
    maxContextChunks?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const { maxContextChunks = 3, systemPrompt } = options || {};

  // Retrieve relevant context
  const context = await queryKnowledgeBase(question, maxContextChunks);

  if (context.length === 0) {
    return 'I don\'t have relevant information about that topic in my knowledge base.';
  }

  // Build context string
  const contextStr = context
    .map(c => `[${c.document.category.toUpperCase()}] ${c.document.title}: ${c.relevantChunk}`)
    .join('\n\n');

  // Generate answer using QVAC LLM
  const defaultSystemPrompt = `You are GoalMind, a football expert AI assistant. Answer questions using ONLY the provided context. If the context doesn't contain enough information, say so. Be concise and accurate. Use football terminology correctly.`;

  const prompt = `Context from football knowledge base:\n${contextStr}\n\nQuestion: ${question}\n\nAnswer based on the context above:`;

  const response = await generateText(prompt, systemPrompt || defaultSystemPrompt);
  return response;
}

/**
 * Get all available documents in the knowledge base.
 */
export function getKnowledgeDocuments(): Document[] {
  return [...FOOTBALL_KNOWLEDGE];
}

/**
 * Get documents by category.
 */
export function getDocumentsByCategory(category: Document['category']): Document[] {
  return FOOTBALL_KNOWLEDGE.filter(d => d.category === category);
}

/**
 * Check if knowledge base is initialized.
 */
export function isKnowledgeBaseReady(): boolean {
  return embeddingsLoaded;
}
