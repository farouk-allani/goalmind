// GoalMind — QVAC SDK Type Declarations
// Temporary type declarations until @qvac/sdk publishes types.

declare module '@qvac/sdk' {
  export interface ModelId {
    id: string;
    type: string;
  }

  export interface LoadModelOptions {
    modelType?: 'llm' | 'embeddings' | 'tts';
    modelSrc?: string;
    configSrc?: string;
    eSpeakDataPath?: string;
    modelConfig?: Record<string, any>;
  }

  export interface CompletionOptions {
    modelId: ModelId;
    history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    stream?: boolean;
  }

  export interface CompletionResult {
    text: Promise<string>;
    tokenStream: AsyncIterable<string>;
  }

  export interface TextToSpeechOptions {
    modelId: ModelId;
    text: string;
    inputType: 'text';
    stream?: boolean;
  }

  export interface TextToSpeechResult {
    buffer: Promise<ArrayBuffer>;
  }

  export interface UnloadModelOptions {
    modelId: ModelId;
  }

  // Model constants
  export const LLAMA_3_2_1B_INST_Q4_0: string;
  export const GTE_LARGE_FP16: string;
  export const TTS_PIPER_NORMAN_EN_US_ONNX_MEDIUM: string;
  export const TTS_PIPER_NORMAN_EN_US_ONNX_MEDIUM_CONFIG: string;

  // Core functions
  export function loadModel(options: LoadModelOptions): Promise<ModelId>;
  export function completion(options: CompletionOptions): CompletionResult;
  export function textToSpeech(options: TextToSpeechOptions): TextToSpeechResult;
  export function unloadModel(options: UnloadModelOptions): Promise<void>;

  // RAG functions
  export function ragSaveEmbeddings(options: {
    modelId: ModelId;
    documents: string[];
    chunk?: boolean;
  }): Promise<any>;

  export function ragSearch(options: {
    modelId: ModelId;
    query: string;
    topK?: number;
  }): Promise<any[]>;

  // P2P functions
  export function startQVACProvider(options: {
    topic: string;
    firewall?: any;
  }): Promise<any>;
}
