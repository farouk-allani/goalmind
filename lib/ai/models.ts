// GoalMind — QVAC Model Manager
// Manages on-device AI model lifecycle: load, cache, unload.
// Every function here talks to the real QVAC SDK — no cloud, no API keys.
//
// Models (all pulled from the QVAC model registry on first use):
//   llm        — Llama 3.2 1B Instruct Q4_0 (~800 MB) — analysis, commentary, agents
//   vision     — SmolVLM2 500M multimodal Q8_0 (~600 MB incl. projector) — camera analysis
//   embeddings — EmbeddingGemma 300M Q8_0 (~320 MB) — RAG over football knowledge
//   tts        — Supertonic 3 multilingual Q4_0 — spoken commentary in 30+ languages

import {
  loadModel,
  unloadModel,
  completion,
  textToSpeech,
  embed,
  LLAMA_3_2_1B_INST_Q4_0,
  SMOLVLM2_500M_MULTIMODAL_Q8_0,
  MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0,
  EMBEDDINGGEMMA_300M_Q8_0,
  TTS_MULTILINGUAL_SUPERTONIC3_Q4_0,
} from '@qvac/sdk';

export type ModelType = 'llm' | 'vision' | 'embeddings' | 'tts';

export interface ModelProgress {
  modelType: ModelType;
  percentage: number;
  downloadedMB: number;
  totalMB: number;
}

export type ProgressCallback = (progress: ModelProgress) => void;

interface ModelCacheEntry {
  modelId: string;
  loadedAt: number;
}

// One QVAC model instance per type, shared across the app.
const modelCache = new Map<ModelType, ModelCacheEntry>();
const inflightLoads = new Map<ModelType, Promise<string>>();

const TTS_SAMPLE_RATE = 44100;

function loadByType(modelType: ModelType, onProgress?: ProgressCallback): Promise<string> {
  const progress = (p: { percentage: number; downloaded: number; total: number }) =>
    onProgress?.({
      modelType,
      percentage: p.percentage,
      downloadedMB: p.downloaded / 1e6,
      totalMB: p.total / 1e6,
    });

  // Each branch calls loadModel directly so TypeScript resolves the
  // correct overload for that model family's config.
  switch (modelType) {
    // CPU-only inference: mobile Mali GPUs (e.g. Samsung A15) segfault in
    // ggml's Vulkan backend probe. `device: 'cpu'` disables GPU devices
    // entirely; gpu_layers: 0 keeps all layers on CPU as a belt-and-braces.
    case 'llm':
      return loadModel({
        modelSrc: LLAMA_3_2_1B_INST_Q4_0,
        modelConfig: { ctx_size: 2048, gpu_layers: 0, device: 'cpu' },
        onProgress: progress,
      });
    case 'vision':
      return loadModel({
        modelSrc: SMOLVLM2_500M_MULTIMODAL_Q8_0,
        modelConfig: {
          ctx_size: 2048,
          gpu_layers: 0,
          device: 'cpu',
          projectionModelSrc: MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0,
        },
        onProgress: progress,
      });
    case 'embeddings':
      return loadModel({
        modelSrc: EMBEDDINGGEMMA_300M_Q8_0,
        onProgress: progress,
      });
    case 'tts':
      return loadModel({
        modelSrc: TTS_MULTILINGUAL_SUPERTONIC3_Q4_0,
        modelConfig: {
          ttsEngine: 'supertonic',
          language: 'en',
          voice: 'F1',
          ttsSpeed: 1.05,
          ttsNumInferenceSteps: 5,
        },
        onProgress: progress,
      });
  }
}

/**
 * Get or load a model. Returns the cached model id if already loaded.
 * Concurrent callers share a single load.
 */
export async function ensureModelLoaded(
  modelType: ModelType,
  onProgress?: ProgressCallback
): Promise<string> {
  const cached = modelCache.get(modelType);
  if (cached) return cached.modelId;

  const inflight = inflightLoads.get(modelType);
  if (inflight) return inflight;

  const load = (async () => {
    const modelId = await loadByType(modelType, onProgress);
    modelCache.set(modelType, { modelId, loadedAt: Date.now() });
    return modelId;
  })();

  inflightLoads.set(modelType, load);
  try {
    return await load;
  } finally {
    inflightLoads.delete(modelType);
  }
}

export async function unloadModelByType(modelType: ModelType): Promise<void> {
  const cached = modelCache.get(modelType);
  if (cached) {
    await unloadModel({ modelId: cached.modelId });
    modelCache.delete(modelType);
  }
}

export async function unloadAllModels(): Promise<void> {
  for (const [, cached] of modelCache) {
    await unloadModel({ modelId: cached.modelId });
  }
  modelCache.clear();
}

export function isModelLoaded(modelType: ModelType): boolean {
  return modelCache.has(modelType);
}

export function getModelCacheStatus(): Record<ModelType, boolean> {
  return {
    llm: modelCache.has('llm'),
    vision: modelCache.has('vision'),
    embeddings: modelCache.has('embeddings'),
    tts: modelCache.has('tts'),
  };
}

// ---- Text generation ----

/**
 * Generate text with the on-device LLM.
 */
export async function generateText(prompt: string, systemPrompt: string): Promise<string> {
  const modelId = await ensureModelLoaded('llm');

  const run = completion({
    modelId,
    history: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: false,
  });

  const final = await run.final;
  return final.contentText.trim();
}

/**
 * Stream text generation token by token.
 */
export async function* generateTextStream(
  prompt: string,
  systemPrompt: string
): AsyncGenerator<string> {
  const modelId = await ensureModelLoaded('llm');

  const run = completion({
    modelId,
    history: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: true,
  });

  for await (const event of run.events) {
    if (event.type === 'contentDelta') yield event.text;
  }
}

/**
 * Generate a JSON object that conforms to the given schema.
 * Uses QVAC structured output (GBNF grammar enforced by llama.cpp),
 * so the result always parses.
 */
export async function generateStructured<T>(
  prompt: string,
  systemPrompt: string,
  schema: Record<string, unknown>,
  schemaName: string
): Promise<T> {
  const modelId = await ensureModelLoaded('llm');

  const run = completion({
    modelId,
    history: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: false,
    responseFormat: {
      type: 'json_schema',
      json_schema: { name: schemaName, schema },
    },
  });

  const final = await run.final;
  return JSON.parse(final.contentText) as T;
}

// ---- Vision ----

/**
 * Analyze an image (e.g. a camera capture of the pitch or broadcast) with the
 * on-device multimodal model. `imagePath` is a local filesystem path.
 */
export async function analyzeImage(
  imagePath: string,
  prompt: string,
  onProgress?: ProgressCallback
): Promise<string> {
  const modelId = await ensureModelLoaded('vision', onProgress);

  const run = completion({
    modelId,
    history: [
      {
        role: 'user',
        content: prompt,
        attachments: [{ path: imagePath }],
      },
    ],
    stream: false,
  });

  const final = await run.final;
  return final.contentText.trim();
}

/**
 * Stream an image analysis token by token.
 */
export async function* analyzeImageStream(
  imagePath: string,
  prompt: string,
  onProgress?: ProgressCallback
): AsyncGenerator<string> {
  const modelId = await ensureModelLoaded('vision', onProgress);

  const run = completion({
    modelId,
    history: [{ role: 'user', content: prompt, attachments: [{ path: imagePath }] }],
    stream: true,
  });

  for await (const event of run.events) {
    if (event.type === 'contentDelta') yield event.text;
  }
}

// ---- Embeddings ----

/**
 * Embed one or more texts with the on-device embeddings model.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const modelId = await ensureModelLoaded('embeddings');
  const { embedding } = await embed({ modelId, text: texts });
  return embedding;
}

export async function embedText(text: string): Promise<number[]> {
  const modelId = await ensureModelLoaded('embeddings');
  const { embedding } = await embed({ modelId, text });
  return embedding;
}

// ---- Text to speech ----

export interface SpeechResult {
  /** Raw PCM samples (Int16, mono). */
  samples: Int16Array;
  sampleRate: number;
  /** Complete WAV file encoded as base64 — playable via expo-audio with a data/file URI. */
  wavBase64: string;
}

/**
 * Synthesize speech on-device with Supertonic 3 (multilingual).
 */
export async function synthesizeSpeech(text: string): Promise<SpeechResult> {
  const modelId = await ensureModelLoaded('tts');

  const result = textToSpeech({
    modelId,
    text,
    inputType: 'text',
    stream: false,
  });

  const samples = (await result.buffer) as unknown as Int16Array;
  return {
    samples,
    sampleRate: TTS_SAMPLE_RATE,
    wavBase64: pcmToWavBase64(samples, TTS_SAMPLE_RATE),
  };
}

// ---- WAV encoding (for playback via expo-audio) ----

function pcmToWavBase64(samples: Int16Array, sampleRate: number): string {
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  new Int16Array(buffer, 44).set(samples);

  // base64 encode without Buffer (RN-safe)
  const bytes = new Uint8Array(buffer);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? chars[b2 & 63] : '=';
  }
  return out;
}
