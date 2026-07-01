// GoalMind — useAI Hook
// Manages AI model lifecycle and provides inference functions.

import { useState, useEffect, useCallback, useRef } from 'react';
import { ensureModelLoaded, unloadAllModels, isModelLoaded, generateText, generateTextStream, synthesizeSpeech } from '@/lib/ai/models';
import type { ModelType } from '@/lib/ai/models';

interface UseAIOptions {
  autoLoad?: boolean; // Load models on mount
  models?: ModelType[]; // Which models to load
}

interface UseAIReturn {
  isReady: boolean;
  loading: boolean;
  loadingModel: ModelType | null;
  error: string | null;
  loadModels: () => Promise<void>;
  analyze: (prompt: string, systemPrompt: string) => Promise<string>;
  analyzeStream: (prompt: string, systemPrompt: string) => AsyncGenerator<string>;
  speak: (text: string) => Promise<ArrayBuffer>;
  cleanup: () => Promise<void>;
}

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const { autoLoad = true, models = ['llm'] } = options;
  
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingModel, setLoadingModel] = useState<ModelType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadModels = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      for (const modelType of models) {
        if (!mountedRef.current) return;
        setLoadingModel(modelType);
        await ensureModelLoaded(modelType, (msg) => {
          console.log(`[GoalMind AI] ${msg}`);
        });
      }

      if (mountedRef.current) {
        setIsReady(true);
        setLoadingModel(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load AI models');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingModel(null);
      }
    }
  }, [models, loading]);

  const analyze = useCallback(async (prompt: string, systemPrompt: string): Promise<string> => {
    if (!isReady) throw new Error('AI models not loaded');
    return generateText(prompt, systemPrompt);
  }, [isReady]);

  const analyzeStream = useCallback(async function* (prompt: string, systemPrompt: string) {
    if (!isReady) throw new Error('AI models not loaded');
    yield* generateTextStream(prompt, systemPrompt);
  }, [isReady]);

  const speak = useCallback(async (text: string): Promise<ArrayBuffer> => {
    if (!isModelLoaded('tts')) {
      await ensureModelLoaded('tts');
    }
    return synthesizeSpeech(text);
  }, []);

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
    };
  }, []);

  return {
    isReady,
    loading,
    loadingModel,
    error,
    loadModels,
    analyze,
    analyzeStream,
    speak,
    cleanup,
  };
}
