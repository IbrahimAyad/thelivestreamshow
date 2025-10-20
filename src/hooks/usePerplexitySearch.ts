import { useState, useCallback } from 'react';

export interface SearchResult {
  answer: string;
  sources?: string[];
  query: string;
}

export interface UsePerplexitySearch {
  search: (query: string, onStreamChunk?: (chunk: string) => void) => Promise<SearchResult>;
  isSearching: boolean;
  error: string | null;
  searchWithFilters: (
    query: string,
    options: {
      recency?: 'day' | 'week' | 'month' | 'year';
      domains?: string[];
      excludeDomains?: string[];
      model?: 'sonar' | 'sonar-pro';
      onStreamChunk?: (chunk: string) => void;
    }
  ) => Promise<SearchResult>;
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export function usePerplexitySearch(): UsePerplexitySearch {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    onStreamChunk?: (chunk: string) => void,
    retryCount = 0
  ): Promise<SearchResult> => {
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    setIsSearching(true);
    setError(null);

    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 25000; // 25 second timeout (faster than before)

    try {
      console.log(`🔍 Searching Perplexity for: "${query.substring(0, 60)}..." (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`⏰ Perplexity API timeout after ${TIMEOUT_MS / 1000} seconds (Attempt ${retryCount + 1})`);
        controller.abort();
      }, TIMEOUT_MS);

      const startTime = Date.now();

      const useStreaming = !!onStreamChunk;

      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar', // Use sonar model for comprehensive answers
          messages: [
            {
              role: 'system',
              content: 'You are a helpful research assistant. Provide comprehensive, well-formatted answers with key facts. Use bullet points and paragraphs for readability.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
          return_citations: true,
          return_images: false,
          stream: useStreaming // Enable streaming if callback provided
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`⏱️ Perplexity response time: ${responseTime}ms`);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }
        console.error('❌ Perplexity API responded with error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Handle streaming response
      if (useStreaming && response.body) {
        console.log('🌊 Streaming enabled, processing chunks...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = '';
        let citations: string[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6); // Remove 'data: ' prefix
                if (dataStr === '[DONE]') continue;

                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content || '';

                  if (content) {
                    fullAnswer += content;
                    onStreamChunk?.(content); // Send chunk to UI
                  }

                  // Citations arrive at the end
                  if (data.citations) {
                    citations = data.citations;
                  }
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse SSE chunk:', dataStr);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        console.log('✅ Streaming complete, final answer length:', fullAnswer.length);
        console.log('📚 Citations:', citations.length, 'sources');

        return {
          answer: fullAnswer || 'No answer found.',
          sources: citations,
          query
        };
      }

      // Handle non-streaming response (fallback)
      const data = await response.json();
      console.log('📦 Perplexity raw response:', data);

      const answer = data.choices?.[0]?.message?.content || 'No answer found.';
      const citations = data.citations || [];

      if (!answer || answer === 'No answer found.') {
        console.warn('⚠️ Perplexity returned empty answer');
      } else {
        console.log('✅ Perplexity answer received:', answer.substring(0, 200) + '...');
      }

      console.log('📚 Citations:', citations.length, 'sources');

      return {
        answer,
        sources: citations,
        query
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const isTimeout = errorMessage.includes('aborted') || (err as any).name === 'AbortError';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');

      // Retry logic for timeouts and network errors
      if ((isTimeout || isNetworkError) && retryCount < MAX_RETRIES) {
        console.warn(`🔄 Retrying Perplexity search (${retryCount + 1}/${MAX_RETRIES})...`);

        // Wait a bit before retrying (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, retryCount), 3000);
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Recursive retry
        return search(query, onStreamChunk, retryCount + 1);
      }

      // Check if it was a timeout (after all retries)
      if (isTimeout) {
        console.error(`⏰ Perplexity search timed out after ${MAX_RETRIES + 1} attempts`);
        setError('Search timed out after multiple attempts.');
        return {
          answer: `Search timed out after ${MAX_RETRIES + 1} attempts. The query may be too complex or the API may be experiencing issues.`,
          sources: [],
          query
        };
      }

      // Network error after all retries
      if (isNetworkError) {
        console.error(`🌐 Network error after ${MAX_RETRIES + 1} attempts:`, errorMessage);
        setError('Network connection issue.');
        return {
          answer: 'Failed to connect to Perplexity API. Please check your internet connection.',
          sources: [],
          query
        };
      }

      // Other errors
      console.error('❌ Perplexity API error:', errorMessage);
      setError(errorMessage);
      return {
        answer: `Failed to get information: ${errorMessage}`,
        sources: [],
        query
      };
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchWithFilters = useCallback(async (
    query: string,
    options: {
      recency?: 'day' | 'week' | 'month' | 'year';
      domains?: string[];
      excludeDomains?: string[];
      model?: 'sonar' | 'sonar-pro';
      onStreamChunk?: (chunk: string) => void;
    }
  ): Promise<SearchResult> => {
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    setIsSearching(true);
    setError(null);

    const TIMEOUT_MS = 25000;

    try {
      console.log(`🔍 Searching Perplexity with filters:`, options);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const startTime = Date.now();
      const useStreaming = !!options.onStreamChunk;

      // Build request body with filters
      const requestBody: any = {
        model: options.model || 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Provide comprehensive, well-formatted answers with key facts. Use bullet points and paragraphs for readability.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        return_citations: true,
        return_images: false,
        stream: useStreaming
      };

      // Add filters if provided
      if (options.recency) {
        requestBody.search_recency_filter = options.recency;
      }

      if (options.domains && options.domains.length > 0) {
        requestBody.search_domain_filter = options.domains;
      }

      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`⏱️ Perplexity response time: ${responseTime}ms (model: ${options.model || 'sonar'})`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      // Handle streaming response
      if (useStreaming && response.body) {
        console.log('🌊 Streaming enabled with filters...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = '';
        let citations: string[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content || '';

                  if (content) {
                    fullAnswer += content;
                    options.onStreamChunk?.(content);
                  }

                  if (data.citations) {
                    citations = data.citations;
                  }
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse SSE chunk');
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return {
          answer: fullAnswer || 'No answer found.',
          sources: citations,
          query
        };
      }

      // Handle non-streaming response
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'No answer found.';
      const citations = data.citations || [];

      console.log('✅ Answer received with filters');

      return {
        answer,
        sources: citations,
        query
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Perplexity API error:', errorMessage);
      setError(errorMessage);
      return {
        answer: `Failed to get information: ${errorMessage}`,
        sources: [],
        query
      };
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    search,
    searchWithFilters,
    isSearching,
    error
  };
}
