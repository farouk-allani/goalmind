// GoalMind — useAI Hook
// Manages on-device AI model lifecycle and provides inference functions.
// TTS output is written to a cache file and played through expo-audio.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  ensureModelLoaded,
  unloadAllModels,
  isModelLoaded,
  generateText,
  generateTextStream,
  synthesizeSpeech,
} from '@/lib/ai/models';
import type { ModelType, ModelProgress } from '@/lib/ai/models';

interface UseAIOptions {
  autoLoad?: boolean; // Load models on mount
  models?: ModelType[]; // Which models to load
}

interface UseAIReturn {
  isReady: boolean;
  loading: boolean;
  loadingModel: ModelType | null;
  /** 0-100 while a model is downloading, null otherwise. */
  downloadPct: number | null;
  error: string | null;
  loadModels: () => Promise<void>;
  analyze: (prompt: string, systemPrompt: string) => Promise<string>;
  analyzeStream: (prompt: string, systemPrompt: string) => AsyncGenerator<string>;
  /** Synthesize speech on-device and play it. */
  speak: (text: string) => Promise<void>;
  cleanup: () => Promise<void>;
}

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const { autoLoad = true, models = ['llm'] } = options;

  // If the requested models are already cached (e.g. the LLM was pre-warmed on
  // the Home screen), report ready immediately so gated buttons don't sit
  // disabled waiting on a redundant load round-trip.
  const [isReady, setIsReady] = useState(() => models.every((m) => isModelLoaded(m)));
  const [loading, setLoading] = useState(false);
  const [loadingModel, setLoadingModel] = useState<ModelType | null>(null);
  const [downloadPct, setDownloadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // Handle to the currently-playing TTS clip so we can stop it if a new line is
  // spoken or the screen unmounts (prevents audio playing "by itself" later).
  const playerRef = useRef<any>(null);

  const stopSpeaking = useCallback(() => {
    if (playerRef.current) {
      try { playerRef.current.remove(); } catch { /* already released */ }
      playerRef.current = null;
    }
  }, []);

  const onProgress = useCallback((p: ModelProgress) => {
    if (mountedRef.current) setDownloadPct(Math.round(p.percentage));
  }, []);

  const loadModels = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      for (const modelType of models) {
        if (!mountedRef.current) return;
        setLoadingModel(modelType);
        await ensureModelLoaded(modelType, onProgress);
      }

      if (mountedRef.current) {
        setIsReady(true);
        setLoadingModel(null);
        setDownloadPct(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load AI models');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingModel(null);
        setDownloadPct(null);
      }
    }
  }, [models, loading, onProgress]);

  const analyze = useCallback(async (prompt: string, systemPrompt: string): Promise<string> => {
    if (!isReady) throw new Error('AI models not loaded');
    return generateText(prompt, systemPrompt);
  }, [isReady]);

  const analyzeStream = useCallback(async function* (prompt: string, systemPrompt: string) {
    if (!isReady) throw new Error('AI models not loaded');
    yield* generateTextStream(prompt, systemPrompt);
  }, [isReady]);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!isModelLoaded('tts')) {
      await ensureModelLoaded('tts', onProgress);
      if (mountedRef.current) setDownloadPct(null);
    }
    // Model download can take a while on first use; bail if the user left.
    if (!mountedRef.current) return;

    const { wavBase64 } = await synthesizeSpeech(text);

    // On-device synthesis takes a few seconds. If the user has since navigated
    // away, do NOT start playback — otherwise it plays "by itself" later.
    if (!mountedRef.current) return;

    if (Platform.OS === 'web') {
      // Web preview: the mock returns silence; use the browser Audio element.
      const audio = new (globalThis as any).Audio(`data:audio/wav;base64,${wavBase64}`);
      await audio.play();
      return;
    }

    // Native: write the WAV to cache and play via expo-audio.
    const FileSystem = await import('expo-file-system/legacy');
    const { createAudioPlayer } = await import('expo-audio');

    if (!mountedRef.current) return;

    const uri = `${FileSystem.cacheDirectory}goalmind-tts-${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(uri, wavBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!mountedRef.current) return;

    // Stop any previous clip still playing, then play this one.
    stopSpeaking();
    const player = createAudioPlayer({ uri });
    playerRef.current = player;
    player.play();
  }, [onProgress, stopSpeaking]);

  const cleanup = useCallback(async () => {
    await unloadAllModels();
    if (mountedRef.current) {
      setIsReady(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad && !isReady && !loading) {
      loadModels();
    }
  }, [autoLoad]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    isReady,
    loading,
    loadingModel,
    downloadPct,
    error,
    loadModels,
    analyze,
    analyzeStream,
    speak,
    cleanup,
  };
}
