// GoalMind — QVAC AI Integration
// All inference runs on-device. No cloud, no API keys.

import { loadModel, completion, unloadModel, textToSpeech, type ModelId } from '@qvac/sdk';

// Model identifiers
const MODELS = {
  LLM: 'llama-3.2-1b-instruct-q4_0',
  EMBEDDINGS: 'gte-large-fp16',
  TTS: 'piper-norman-en-us-medium',
} as const;

export interface AIModelHandle {
  modelId: ModelId;
  modelType: 'llm' | 'embeddings' | 'tts';
}

/**
 * Load an on-device AI model into memory.
 * Models are cached after first load for instant subsequent use.
 */
export async function loadAIModel(
  modelType: keyof typeof MODELS
): Promise<AIModelHandle> {
  const modelId = await loadModel({
    modelType: modelType === 'LLM' ? 'llm' : modelType === 'EMBEDDINGS' ? 'embeddings' : 'tts',
  });
  
  return { modelId, modelType: modelType === 'LLM' ? 'llm' : modelType === 'EMBEDDINGS' ? 'embeddings' : 'tts' };
}

/**
 * Generate tactical analysis from match description.
 * Runs entirely on-device via QVAC LLM.
 */
export async function analyzeMatchTactics(
  handle: AIModelHandle,
  matchContext: string
): Promise<string> {
  const response = completion({
    modelId: handle.modelId,
    history: [
      {
        role: 'system',
        content: `You are GoalMind, an expert football tactical analyst. 
Analyze the match data provided and give concise, actionable tactical insights.
Focus on: formations, pressing patterns, key threats, momentum shifts.
Be direct and technical. No fluff. Use football terminology correctly.
Respond in 2-3 short paragraphs maximum.`,
      },
      {
        role: 'user',
        content: matchContext,
      },
    ],
    stream: false,
  });

  const text = await response.text;
  return text;
}

/**
 * Generate match prediction using on-device inference.
 * Returns structured prediction data.
 */
export async function predictMatchOutcome(
  handle: AIModelHandle,
  homeTeam: string,
  awayTeam: string,
  homeStats: string,
  awayStats: string
): Promise<string> {
  const response = completion({
    modelId: handle.modelId,
    history: [
      {
        role: 'system',
        content: `You are a football match prediction engine. 
Given team statistics, predict the match outcome.
Respond ONLY with valid JSON in this exact format:
{"homeWin": 0.45, "draw": 0.25, "awayWin": 0.30, "expectedGoalsHome": 1.5, "expectedGoalsAway": 1.2, "reasoning": "brief explanation"}
Probabilities must sum to 1.0.`,
      },
      {
        role: 'user',
        content: `Match: ${homeTeam} vs ${awayTeam}\n\nHome team stats:\n${homeStats}\n\nAway team stats:\n${awayStats}`,
      },
    ],
    stream: false,
  });

  const text = await response.text;
  return text;
}

/**
 * Generate AI commentary for a match event.
 * Produces natural language commentary in the specified language.
 */
export async function generateCommentary(
  handle: AIModelHandle,
  event: string,
  language: string = 'en'
): Promise<string> {
  const langInstruction = language === 'en' 
    ? '' 
    : `Respond in ${language}.`;

  const response = completion({
    modelId: handle.modelId,
    history: [
      {
        role: 'system',
        content: `You are an exciting football commentator. 
Generate short, energetic commentary for match events.
Keep it to 1-2 sentences. Be vivid and dramatic but not cheesy.
${langInstruction}`,
      },
      {
        role: 'user',
        content: event,
      },
    ],
    stream: false,
  });

  const text = await response.text;
  return text;
}

/**
 * Stream commentary token by token for real-time display.
 */
export async function* streamCommentary(
  handle: AIModelHandle,
  event: string
): AsyncGenerator<string> {
  const result = completion({
    modelId: handle.modelId,
    history: [
      {
        role: 'system',
        content: 'You are an exciting football commentator. Generate short, energetic commentary. 1-2 sentences max.',
      },
      {
        role: 'user',
        content: event,
      },
    ],
    stream: true,
  });

  for await (const token of result.tokenStream) {
    yield token;
  }
}

/**
 * Convert text commentary to speech audio buffer.
 * Runs entirely on-device via QVAC TTS.
 */
export async function speakCommentary(
  ttsModelId: ModelId,
  text: string
): Promise<ArrayBuffer> {
  const result = textToSpeech({
    modelId: ttsModelId,
    text,
    inputType: 'text',
    stream: false,
  });

  const buffer = await result.buffer;
  return buffer;
}

/**
 * Unload a model to free device memory.
 */
export async function freeModel(handle: AIModelHandle): Promise<void> {
  await unloadModel({ modelId: handle.modelId });
}
