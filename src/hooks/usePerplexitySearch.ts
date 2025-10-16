import { useState, useCallback } from 'react';

export interface SearchResult {
  urls: string[];
  query: string;
  type: 'images' | 'videos';
}

export interface UsePerplexitySearch {
  search: (query: string, type: 'images' | 'videos') => Promise<SearchResult>;
  isSearching: boolean;
  error: string | null;
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export function usePerplexitySearch(): UsePerplexitySearch {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, type: 'images' | 'videos'): Promise<SearchResult> => {
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    setIsSearching(true);
    setError(null);

    try {
      const prompt = `Find 5 high-quality ${type} URLs about: ${query}. Return only a JSON object with this exact format: {"urls": ["url1", "url2", "url3", "url4", "url5"]}. Only include direct ${type} URLs, no article links.`;

      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that finds image and video URLs. Always respond with valid JSON containing an array of URLs.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Search failed');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      // Try to extract JSON from the response
      let parsedData;
      try {
        // Find JSON in the response
        const jsonMatch = content.match(/\{[^}]*"urls"[^}]*\}/s);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          parsedData = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('Failed to parse Perplexity response:', content);
        parsedData = { urls: [] };
      }

      return {
        urls: parsedData.urls || [],
        query,
        type
      };

    } catch (err) {
      console.error('Perplexity API error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      return { urls: [], query, type };
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    search,
    isSearching,
    error
  };
}
