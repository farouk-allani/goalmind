// Web-only mock of @qvac/sdk.
//
// The real QVAC SDK runs native on-device inference (llama.cpp / ggml) and
// cannot bundle or run in a browser. This stub is aliased in metro.config.js
// for `platform === 'web'` so the UI is browsable. Native builds (android/ios)
// resolve the real @qvac/sdk instead.
//
// Responses are canned — there is NO real AI here.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Model registry constants referenced by lib/ai/models.ts.
export const LLAMA_3_2_1B_INST_Q4_0 = { src: 'mock://llama-3.2-1b', name: 'llama-3.2-1b (web mock)' };
export const SMOLVLM2_500M_MULTIMODAL_Q8_0 = { src: 'mock://smolvlm2-500m', name: 'smolvlm2 (web mock)' };
export const MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 = { src: 'mock://smolvlm2-mmproj', name: 'smolvlm2-mmproj (web mock)' };
export const EMBEDDINGGEMMA_300M_Q8_0 = { src: 'mock://embeddinggemma-300m', name: 'embeddinggemma (web mock)' };
export const TTS_MULTILINGUAL_SUPERTONIC3_Q4_0 = { src: 'mock://supertonic3', name: 'supertonic3 (web mock)' };

export async function loadModel({ modelSrc, onProgress }) {
  for (let pct = 0; pct <= 100; pct += 25) {
    onProgress?.({ percentage: pct, downloaded: pct * 1e6, total: 100e6 });
    await delay(80);
  }
  return `web-mock-${(modelSrc && modelSrc.name) || 'model'}`;
}

export async function unloadModel() {}

const MOCK_COMPLETION =
  '[Web preview] On-device AI runs only in the native app. ' +
  'Build with `npx expo run:android --device` to see real QVAC inference.';

export function completion({ stream } = {}) {
  const tokens = MOCK_COMPLETION.split(/(?= )/);

  async function* eventIterator() {
    for (const t of tokens) {
      await delay(30);
      yield { type: 'contentDelta', text: t };
    }
  }
  async function* tokenIterator() {
    for (const t of tokens) {
      await delay(30);
      yield t;
    }
  }

  return {
    events: eventIterator(),
    tokenStream: tokenIterator(),
    final: (async () => {
      if (!stream) await delay(300);
      return { contentText: MOCK_COMPLETION, toolCalls: [], raw: { fullText: MOCK_COMPLETION } };
    })(),
    text: (async () => MOCK_COMPLETION)(),
  };
}

export function textToSpeech() {
  return {
    buffer: (async () => {
      await delay(200);
      return new Int16Array(4410); // 0.1s of silence
    })(),
  };
}

export async function embed({ text }) {
  // Deterministic pseudo-vectors — enough to exercise the RAG ranking UI.
  const embedOne = (s) =>
    new Array(64).fill(0).map((_, i) => Math.sin(i * 0.7 + s.length * 0.31 + s.charCodeAt(0)));
  await delay(50);
  return { embedding: Array.isArray(text) ? text.map(embedOne) : embedOne(text) };
}
