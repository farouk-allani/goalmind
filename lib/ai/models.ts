// GoalMind — QVAC Model Manager
// Manages on-device AI model lifecycle: load, cache, unload.

import { loadModel, unloadModel, completion, textToSpeech } from '@qvac/sdk';
import type { ModelId } from '@qvac/sdk';

export type ModelType = 'llm' | 'embeddings' | 'tts';

interface ModelCache {
  modelId: ModelId;
  modelType: ModelType;
  loadedAt: number;
  memoryUsage: number; // estimated MB
}

// Singleton model cache
const modelCache = new Map<string, ModelCache>();

/**
 * Get or load a model. Returns cached model if already loaded.
 */
export async function ensureModelLoaded(
  modelType: ModelType,
  onProgress?: (progress: string) => void
): Promise<ModelId> {
  const cached = modelCache.get(modelType);
  if (cached) {
    return cached.modelId;
  }

  onProgress?.(`Loading ${modelType} model...`);

  const modelId = await loadModel({ modelType });

  modelCache.set(modelType, {
    modelId,
    modelType,
    loadedAt: Date.now(),
    memoryUsage: estimateMemoryUsage(modelType),
  });

  onProgress?.(`${modelType} model loaded`);
  return modelId;
}

/**
 * Unload a specific model to free memory.
 */
export async function unloadModelByType(modelType: ModelType): Promise<void> {
  const cached = modelCache.get(modelType);
  if (cached) {
    await unloadModel({ modelId: cached.modelId });
    modelCache.delete(modelType);
  }
}

/**
 * Unload all models.
 */
export async function unloadAllModels(): Promise<void> {
  for (const [type, cached] of modelCache) {
    await unloadModel({ modelId: cached.modelId });
  }
  modelCache.clear();
}

/**
 * Check if a model is loaded.
 */
export function isModelLoaded(modelType: ModelType): boolean {
  return modelCache.has(modelType);
}

/**
 * Get cache status for all models.
 */
export function getModelCacheStatus(): Record<ModelType, boolean> {
  return {
    llm: modelCache.has('llm'),
    embeddings: modelCache.has('embeddings'),
    tts: modelCache.has('tts'),
  };
}

/**
 * Estimate memory usage per model type.
 */
function estimateMemoryUsage(modelType: ModelType): number {
  switch (modelType) {
    case 'llm': return 800; // ~800MB for Llama 3.2 1B Q4
    case 'embeddings': return 400; // ~400MB for GTE Large
    case 'tts': return 200; // ~200MB for Piper TTS
    default: return 0;
  }
}

/**
 * Generate text using the LLM model.
 */
export async function generateText(
  prompt: string,
  systemPrompt: string,
  options?: { stream?: boolean; maxTokens?: number }
): Promise<string> {
  const modelId = await ensureModelLoaded('llm');

  const response = completion({
    modelId,
    history: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: options?.stream ?? false,
  });

  if (options?.stream) {
    // For streaming, caller should use generateTextStream instead
    const text = await response.text;
    return text;
  }

  const text = await response.text;
  return text;
}

/**
 * Stream text generation token by token.
 */
export async function* generateTextStream(
  prompt: string,
  systemPrompt: string
): AsyncGenerator<string> {
  const modelId = await ensureModelLoaded('llm');

  const result = completion({
    modelId,
    history: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: true,
  });

  for await (const token of result.tokenStream) {
    yield token;
  }
}

/**
 * Convert text to speech audio.
 */
export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const modelId = await ensureModelLoaded('tts');

  const result = textToSpeech({
    modelId,
    text,
    inputType: 'text',
    stream: false,
  });

  const buffer = await result.buffer;
  return buffer;
}
