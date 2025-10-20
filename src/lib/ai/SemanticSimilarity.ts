/**
 * Semantic Similarity Module
 * Uses OpenAI embeddings to detect similar questions for deduplication
 */

import { MODEL_PRICING } from './types';

// LRU cache for embeddings
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Global embedding cache
let embeddingCache = new LRUCache<string, number[]>(1000);

/**
 * Get embedding vector for a text using OpenAI's text-embedding-3-small
 * Caches results to reduce API calls
 */
export async function getEmbedding(
  text: string,
  apiKey?: string
): Promise<number[]> {
  // Check cache first
  const cached = embeddingCache.get(text);
  if (cached) {
    return cached;
  }

  const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key not configured for embeddings');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  const embedding = data.data[0].embedding;

  // Cache it
  embeddingCache.set(text, embedding);

  return embedding;
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where:
 * - 1 = identical vectors
 * - 0 = orthogonal (completely different)
 * - -1 = opposite
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / magnitude;
}

/**
 * Batch get embeddings for multiple texts
 * More efficient than calling getEmbedding multiple times
 */
export async function getBatchEmbeddings(
  texts: string[],
  apiKey?: string
): Promise<number[][]> {
  // Check which texts are already cached
  const results: Array<number[] | null> = texts.map(text => embeddingCache.get(text) || null);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  results.forEach((result, i) => {
    if (result === null) {
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i]);
    }
  });

  // If everything is cached, return immediately
  if (uncachedTexts.length === 0) {
    return results as number[][];
  }

  // Fetch embeddings for uncached texts
  const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key not configured for embeddings');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: uncachedTexts
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  const embeddings = data.data.map((item: any) => item.embedding);

  // Cache the new embeddings and fill in results
  embeddings.forEach((embedding: number[], i: number) => {
    const originalIndex = uncachedIndices[i];
    embeddingCache.set(texts[originalIndex], embedding);
    results[originalIndex] = embedding;
  });

  return results as number[][];
}

/**
 * Calculate embedding API cost for a given number of tokens
 */
export function calculateEmbeddingCost(tokens: number): number {
  return tokens * MODEL_PRICING.embedding.input;
}

/**
 * Estimate token count for text (rough approximation: ~0.75 tokens per word)
 */
export function estimateTokenCount(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 0.75);
}

/**
 * Clear the embedding cache
 * Useful for testing or when memory needs to be freed
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
  console.log('🗑️ Embedding cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number; hitRate: number } {
  return {
    size: embeddingCache.size,
    maxSize: 1000,
    hitRate: 0 // TODO: Track hit/miss ratio
  };
}
