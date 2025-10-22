/**
 * React Hook for Multi-Model AI Fusion
 *
 * Coordinates queries across multiple AI models and synthesizes responses
 */

import { useState, useCallback } from 'react';
import {
  multiModelQuery,
  selectModelsForQuestion,
  SynthesizedResponse
} from '../lib/multiModelFusion';

export interface UseMultiModelFusion {
  // Current state
  isQuerying: boolean;
  lastResponse: SynthesizedResponse | null;
  error: string | null;

  // Methods
  query: (
    question: string,
    options?: {
      systemPrompt?: string;
      models?: Array<'gpt4' | 'claude' | 'perplexity'>;
      requireRealTime?: boolean;
    }
  ) => Promise<string>;
  queryWithAutoSelection: (question: string, systemPrompt?: string) => Promise<string>;
  reset: () => void;

  // Stats
  totalQueries: number;
  averageResponseTime: number;
}

export function useMultiModelFusion(): UseMultiModelFusion {
  const [isQuerying, setIsQuerying] = useState(false);
  const [lastResponse, setLastResponse] = useState<SynthesizedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalQueries, setTotalQueries] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  /**
   * Query multiple models with explicit configuration
   */
  const query = useCallback(async (
    question: string,
    options: {
      systemPrompt?: string;
      models?: Array<'gpt4' | 'claude' | 'perplexity'>;
      requireRealTime?: boolean;
    } = {}
  ): Promise<string> => {
    setIsQuerying(true);
    setError(null);

    try {
      console.log('🚀 Multi-model fusion query:', question);

      const result = await multiModelQuery(question, options);

      setLastResponse(result);
      setTotalQueries(prev => prev + 1);
      setResponseTimes(prev => [...prev, result.totalTime].slice(-10)); // Keep last 10

      console.log(`✅ Multi-model response: "${result.finalAnswer.substring(0, 100)}..."`);
      console.log(`📊 Used models: ${result.modelsUsed.join(', ')}`);
      console.log(`⏱️ Total time: ${result.totalTime}ms`);

      return result.finalAnswer;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Multi-model query failed';
      console.error('❌ Multi-model fusion error:', errorMessage);
      setError(errorMessage);
      throw err;

    } finally {
      setIsQuerying(false);
    }
  }, []);

  /**
   * Query with automatic model selection based on question type
   */
  const queryWithAutoSelection = useCallback(async (
    question: string,
    systemPrompt?: string
  ): Promise<string> => {
    const selectedModels = selectModelsForQuestion(question);

    console.log(`🤖 Auto-selected models for question: ${selectedModels.join(', ')}`);

    return query(question, {
      models: selectedModels,
      systemPrompt
    });
  }, [query]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLastResponse(null);
    setError(null);
    setTotalQueries(0);
    setResponseTimes([]);
  }, []);

  // Calculate average response time
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  return {
    isQuerying,
    lastResponse,
    error,
    query,
    queryWithAutoSelection,
    reset,
    totalQueries,
    averageResponseTime
  };
}
