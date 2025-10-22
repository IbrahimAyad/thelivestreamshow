import { useCallback } from 'react';
import { useBetaBotConversation, BetaBotMode } from './useBetaBotConversation';
import { useBetaBotMemory, MemorySearchResult } from './useBetaBotMemory';
import { useMultiModelFusion } from './useMultiModelFusion';

export interface EnhancedConversationResult {
  response: string;
  relatedMemories: MemorySearchResult[];
  memoryRecallCount: number;
}

export function useBetaBotConversationWithMemory() {
  const conversation = useBetaBotConversation();
  const memory = useBetaBotMemory();
  const multiModel = useMultiModelFusion();

  /**
   * Chat with BetaBot enhanced with memory recall
   */
  const chatWithMemory = useCallback(async (
    query: string,
    mode?: BetaBotMode,
    onStreamChunk?: (chunk: string) => void
  ): Promise<EnhancedConversationResult> => {
    try {
      console.log('🧠 Enhanced conversation with memory search...');

      // Step 1: Search for relevant memories
      const relatedMemories = await memory.searchMemories(query, 0.75, 3);

      console.log(`📚 Found ${relatedMemories.length} related past conversations`);

      // Step 2: Build enhanced prompt with memory context
      let enhancedQuery = query;

      if (relatedMemories.length > 0) {
        const memoryContext = relatedMemories
          .map((mem, idx) => {
            const episodeRef = mem.episodeNumber
              ? `(Episode #${mem.episodeNumber}${mem.episodeTitle ? `: ${mem.episodeTitle}` : ''})`
              : '';

            return `Memory ${idx + 1} ${episodeRef}:\n${mem.conversationSnippet}`;
          })
          .join('\n\n');

        enhancedQuery = `CONTEXT FROM PAST CONVERSATIONS:
${memoryContext}

CURRENT QUESTION:
${query}

Instructions: Reference relevant past conversations naturally if they help answer the question. Use callbacks like "Remember when we talked about..." or "Like we discussed in episode #X..." Only mention if truly relevant - don't force it.`;

        console.log('✅ Enhanced query with memory context');

        // Track memory recalls
        await Promise.all(
          relatedMemories.map(mem => memory.recallMemory(mem.id))
        );
      }

      // Step 3: Get response from conversation engine
      const response = await conversation.chat(enhancedQuery, mode, onStreamChunk);

      return {
        response,
        relatedMemories,
        memoryRecallCount: relatedMemories.length
      };

    } catch (error) {
      console.error('❌ Error in memory-enhanced conversation:', error);

      // Fallback to regular conversation
      const response = await conversation.chat(query, mode, onStreamChunk);

      return {
        response,
        relatedMemories: [],
        memoryRecallCount: 0
      };
    }
  }, [conversation, memory]);

  /**
   * Store current conversation as memory
   */
  const storeConversationMemory = useCallback(async (
    sessionId: string,
    conversationBuffer: string,
    metadata?: {
      episodeNumber?: number;
      episodeTitle?: string;
      episodeTopic?: string;
      topic?: string;
      contextMetadata?: Record<string, any>;
      hostId?: string;
      showId?: string;
    }
  ): Promise<boolean> => {
    try {
      // Split buffer into meaningful chunks (by topic/paragraph)
      const chunks = splitIntoChunks(conversationBuffer, 500); // ~500 words per chunk

      if (chunks.length === 0) {
        console.log('⚠️ No content to store in memory');
        return false;
      }

      console.log(`🧠 Storing ${chunks.length} conversation chunks as memories...`);

      const memories = chunks.map(chunk => ({
        sessionId,
        episodeNumber: metadata?.episodeNumber,
        episodeTitle: metadata?.episodeTitle,
        episodeTopic: metadata?.episodeTopic,
        topic: metadata?.topic || extractTopicFromText(chunk),
        conversationSnippet: chunk,
        contextMetadata: metadata?.contextMetadata,
        hostId: metadata?.hostId,
        showId: metadata?.showId
      }));

      const success = await memory.storeBatchMemories(memories);

      if (success) {
        console.log(`✅ Stored ${memories.length} memories successfully`);
      }

      return success;

    } catch (error) {
      console.error('❌ Error storing conversation memory:', error);
      return false;
    }
  }, [memory]);

  /**
   * Chat with multi-model fusion and memory recall
   * Uses 2-3 AI models in parallel for highest quality responses
   */
  const chatWithFusion = useCallback(async (
    query: string,
    mode?: BetaBotMode
  ): Promise<EnhancedConversationResult> => {
    try {
      console.log('🔮 Multi-model fusion chat with memory...');

      // Step 1: Search for relevant memories
      const relatedMemories = await memory.searchMemories(query, 0.75, 3);

      console.log(`📚 Found ${relatedMemories.length} related past conversations`);

      // Step 2: Build enhanced prompt with memory context
      let enhancedQuery = query;
      let systemPrompt = 'You are Beta Bot, an AI co-host for a professional live stream. Be conversational, concise (2-3 sentences), and engaging.';

      if (relatedMemories.length > 0) {
        const memoryContext = relatedMemories
          .map((mem, idx) => {
            const episodeRef = mem.episodeNumber
              ? `(Episode #${mem.episodeNumber}${mem.episodeTitle ? `: ${mem.episodeTitle}` : ''})`
              : '';

            return `Memory ${idx + 1} ${episodeRef}:\n${mem.conversationSnippet}`;
          })
          .join('\n\n');

        systemPrompt = `You are Beta Bot, an AI co-host for a professional live stream. You have memory of past conversations. Be conversational, concise (2-3 sentences), and engaging.

CONTEXT FROM PAST CONVERSATIONS:
${memoryContext}

Instructions: Reference relevant past conversations naturally if they help answer the question. Use callbacks like "Remember when we talked about..." or "Like we discussed in episode #X..." Only mention if truly relevant.`;

        enhancedQuery = query;

        // Track memory recalls
        await Promise.all(
          relatedMemories.map(mem => memory.recallMemory(mem.id))
        );
      }

      // Step 3: Use multi-model fusion for highest quality response
      const response = await multiModel.queryWithAutoSelection(enhancedQuery, systemPrompt);

      return {
        response,
        relatedMemories,
        memoryRecallCount: relatedMemories.length
      };

    } catch (error) {
      console.error('❌ Error in fusion conversation:', error);

      // Fallback to regular conversation
      const response = await conversation.chat(query, mode);

      return {
        response,
        relatedMemories: [],
        memoryRecallCount: 0
      };
    }
  }, [conversation, memory, multiModel]);

  return {
    // Enhanced methods
    chatWithMemory,
    chatWithFusion,
    storeConversationMemory,

    // Pass through original methods
    chat: conversation.chat,
    context: conversation.context,
    resetContext: conversation.resetContext,
    isResponding: conversation.isResponding,
    error: conversation.error || memory.error || multiModel.error,

    // Memory-specific
    searchMemories: memory.searchMemories,
    findByEntity: memory.findByEntity,
    findByEpisode: memory.findByEpisode,
    isProcessingMemory: memory.isProcessing,

    // Multi-model specific
    isQueryingMultiModel: multiModel.isQuerying,
    lastMultiModelResponse: multiModel.lastResponse
  };
}

/**
 * Split long text into chunks of approximately maxWords
 */
function splitIntoChunks(text: string, maxWords: number = 500): string[] {
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    const paragraphWordCount = words.length;

    if (currentWordCount + paragraphWordCount > maxWords && currentChunk.length > 0) {
      // Current chunk is full, save it
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [paragraph];
      currentWordCount = paragraphWordCount;
    } else {
      // Add to current chunk
      currentChunk.push(paragraph);
      currentWordCount += paragraphWordCount;
    }
  }

  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  // Filter out very short chunks (< 50 words)
  return chunks.filter(chunk => {
    const wordCount = chunk.split(/\s+/).length;
    return wordCount >= 50;
  });
}

/**
 * Extract a topic from text (simple approach using first meaningful sentence)
 */
function extractTopicFromText(text: string): string {
  // Remove common filler phrases
  const cleaned = text
    .replace(/^(um|uh|well|so|okay|alright)\s+/i, '')
    .replace(/\s+(you know|like|basically)\s+/gi, ' ')
    .trim();

  // Get first sentence
  const firstSentence = cleaned.split(/[.!?]/)[0]?.trim();

  if (!firstSentence) return 'General Discussion';

  // If it's a question, extract topic from question
  if (firstSentence.endsWith('?')) {
    // Extract key nouns/verbs (simple heuristic)
    const words = firstSentence.split(/\s+/);
    const meaningfulWords = words.filter(w => w.length > 4);

    if (meaningfulWords.length > 0) {
      return meaningfulWords.slice(0, 3).join(' ');
    }
  }

  // Return first sentence (max 50 chars)
  return firstSentence.length > 50
    ? firstSentence.substring(0, 47) + '...'
    : firstSentence;
}
