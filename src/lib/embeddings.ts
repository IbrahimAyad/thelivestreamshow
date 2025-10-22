/**
 * Embeddings Generation Library
 *
 * Generates semantic embeddings for conversation snippets using OpenAI
 * Enables similarity search for memory recall
 */

import OpenAI from 'openai';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }

  return openaiClient;
}

/**
 * Generate embedding vector for a text string
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getOpenAIClient();

    console.log(`🧠 Generating embedding for text: "${text.substring(0, 50)}..."`);

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    const embedding = response.data[0].embedding;

    console.log(`✅ Generated embedding vector (${embedding.length} dimensions)`);

    return embedding;

  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than individual calls
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const client = getOpenAIClient();

    console.log(`🧠 Generating embeddings for ${texts.length} texts (batch)`);

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float'
    });

    const embeddings = response.data.map(item => item.embedding);

    console.log(`✅ Generated ${embeddings.length} embedding vectors`);

    return embeddings;

  } catch (error) {
    console.error('❌ Error generating embeddings batch:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns value between -1 and 1 (higher = more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embedding vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

  return similarity;
}

/**
 * Extract keywords from text using simple frequency analysis
 * More sophisticated than regex, but lighter than NLP libraries
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'so', 'than', 'too', 'very', 'just'
  ]);

  // Tokenize and clean
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count frequency
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  // Sort by frequency and return top N
  const keywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return keywords;
}

/**
 * Extract named entities from text (simple pattern matching)
 * For more sophisticated NER, would use spaCy or similar
 */
export function extractEntities(text: string): string[] {
  const entities = new Set<string>();

  // Pattern 1: Capitalized words (potential proper nouns)
  const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const capitalizedMatches = text.match(capitalizedPattern) || [];
  capitalizedMatches.forEach(entity => {
    // Filter out common non-entities
    if (!['The', 'This', 'That', 'These', 'Those', 'A', 'An'].includes(entity)) {
      entities.add(entity);
    }
  });

  // Pattern 2: Known entity types (could expand with more patterns)
  const patterns = [
    // People titles
    /(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    // Hashtags (topics)
    /#(\w+)/g,
    // @ mentions
    /@(\w+)/g
  ];

  patterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => entities.add(match[1] || match[0]));
  });

  return Array.from(entities);
}

/**
 * Calculate importance score for a conversation snippet
 * Based on multiple factors
 */
export function calculateImportanceScore(
  snippet: string,
  context: {
    hasControv

ersialKeywords?: boolean;
    mentionsHost?: boolean;
    emotionalIntensity?: number; // 0-1
    hasQuestions?: boolean;
    uniqueness?: number; // 0-1 (how unique compared to other snippets)
  } = {}
): number {
  let score = 0.5; // Base score

  // Factor 1: Length (longer conversations tend to be more substantial)
  const wordCount = snippet.split(/\s+/).length;
  if (wordCount > 100) score += 0.1;
  if (wordCount > 200) score += 0.1;

  // Factor 2: Controversial keywords
  if (context.hasControversialKeywords) score += 0.2;

  // Factor 3: Host mentioned (more relevant)
  if (context.mentionsHost) score += 0.15;

  // Factor 4: Emotional intensity
  if (context.emotionalIntensity) {
    score += context.emotionalIntensity * 0.15;
  }

  // Factor 5: Contains questions (engaging content)
  if (context.hasQuestions || /\?/.test(snippet)) {
    score += 0.1;
  }

  // Factor 6: Uniqueness (novel topics are more important)
  if (context.uniqueness) {
    score += context.uniqueness * 0.2;
  }

  // Normalize to 0-1 range
  return Math.min(1, Math.max(0, score));
}

/**
 * Detect sentiment from text (simple keyword-based)
 * For more accuracy, would use a sentiment analysis API
 */
export function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'spicy' {
  const lowerText = text.toLowerCase();

  // Spicy/controversial indicators
  const spicyKeywords = ['controversial', 'disagree', 'wrong', 'ridiculous', 'insane', 'wild', 'hot take', 'unpopular opinion'];
  if (spicyKeywords.some(kw => lowerText.includes(kw))) {
    return 'spicy';
  }

  // Positive indicators
  const positiveKeywords = ['good', 'great', 'excellent', 'love', 'amazing', 'wonderful', 'fantastic', 'agree', 'right'];
  const positiveCount = positiveKeywords.filter(kw => lowerText.includes(kw)).length;

  // Negative indicators
  const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'poor', 'disappointing'];
  const negativeCount = negativeKeywords.filter(kw => lowerText.includes(kw)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
