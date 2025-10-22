import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  generateEmbedding,
  extractKeywords,
  extractEntities,
  calculateImportanceScore,
  detectSentiment
} from '../lib/embeddings';

export interface Memory {
  id: string;
  episodeId?: string;
  sessionId?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  episodeTopic?: string;
  topic: string;
  conversationSnippet: string;
  mentionedEntities: string[];
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'spicy' | 'controversial';
  emotionalTone?: string;
  importanceScore: number;
  recallCount: number;
  lastRecalled?: string;
  createdAt: string;
}

export interface MemorySearchResult extends Memory {
  similarity: number;
}

export interface StoreMemoryParams {
  sessionId?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  episodeTopic?: string;
  topic: string;
  conversationSnippet: string;
  contextMetadata?: Record<string, any> & { type?: string };
  hostId?: string;
  showId?: string;
}

export interface UseBetaBotMemory {
  // Store new memory
  storeMemory: (params: StoreMemoryParams) => Promise<string | null>;
  storeBatchMemories: (memories: StoreMemoryParams[]) => Promise<boolean>;

  // Search memories
  searchMemories: (query: string, threshold?: number, limit?: number) => Promise<MemorySearchResult[]>;
  findByEntity: (entityName: string, limit?: number) => Promise<Memory[]>;
  findByEpisode: (episodeNumber: number) => Promise<Memory[]>;
  findByTopic: (topic: string) => Promise<Memory[]>;

  // Recall memory (increment usage tracking)
  recallMemory: (memoryId: string) => Promise<boolean>;

  // Entity knowledge
  getEntityKnowledge: (entityName: string, entityType?: string) => Promise<any>;
  updateEntityKnowledge: (entityName: string, data: any) => Promise<boolean>;

  // State
  isProcessing: boolean;
  error: string | null;
}

export function useBetaBotMemory(): UseBetaBotMemory {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Store a new memory with semantic embedding
   */
  const storeMemory = useCallback(async (params: StoreMemoryParams): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('🧠 Storing memory:', params.topic);

      // Generate embedding for semantic search
      const embedding = await generateEmbedding(params.conversationSnippet);

      // Extract keywords and entities
      const keywords = extractKeywords(params.conversationSnippet);
      const entities = extractEntities(params.conversationSnippet);

      // Detect sentiment
      const sentiment = detectSentiment(params.conversationSnippet);

      // Calculate importance score
      const importanceScore = calculateImportanceScore(params.conversationSnippet, {
        hasControversialKeywords: sentiment === 'spicy',
        mentionsHost: false, // Could be enhanced to detect host mentions
        emotionalIntensity: sentiment === 'spicy' ? 0.8 : 0.3,
        hasQuestions: params.conversationSnippet.includes('?'),
        uniqueness: 0.5, // Default uniqueness score
        // Could add more context here
      });

      // Insert into database
      const { data, error: insertError } = await supabase
        .from('betabot_memory')
        .insert([{
          episode_id: params.episodeNumber ? `episode-${params.episodeNumber}` : null,
          session_id: params.sessionId,
          episode_number: params.episodeNumber,
          episode_title: params.episodeTitle,
          episode_topic: params.episodeTopic,
          topic: params.topic,
          conversation_snippet: params.conversationSnippet,
          embedding: embedding,
          mentioned_entities: entities,
          keywords: keywords,
          sentiment: sentiment,
          importance_score: importanceScore,
          context_metadata: params.contextMetadata,
          host_id: params.hostId,
          show_id: params.showId
        }])
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error storing memory:', insertError);
        setError(insertError.message);
        return null;
      }

      console.log(`✅ Memory stored with ID: ${data.id}`);
      console.log(`   - Importance: ${importanceScore.toFixed(2)}`);
      console.log(`   - Sentiment: ${sentiment}`);
      console.log(`   - Entities: ${entities.join(', ')}`);
      console.log(`   - Keywords: ${keywords.join(', ')}`);

      return data.id;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error storing memory:', errorMessage);
      setError(errorMessage);
      return null;

    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Store multiple memories in batch (more efficient)
   */
  const storeBatchMemories = useCallback(async (memories: StoreMemoryParams[]): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log(`🧠 Storing ${memories.length} memories in batch`);

      const memoryRecords = await Promise.all(
        memories.map(async (params) => {
          const embedding = await generateEmbedding(params.conversationSnippet);
          const keywords = extractKeywords(params.conversationSnippet);
          const entities = extractEntities(params.conversationSnippet);
          const sentiment = detectSentiment(params.conversationSnippet);
          const importanceScore = calculateImportanceScore(params.conversationSnippet, {
            hasControversialKeywords: sentiment === 'spicy',
            mentionsHost: false,
            emotionalIntensity: sentiment === 'spicy' ? 0.8 : 0.3,
            hasQuestions: params.conversationSnippet.includes('?'),
            uniqueness: 0.5
          });

          return {
            episode_id: params.episodeNumber ? `episode-${params.episodeNumber}` : null,
            session_id: params.sessionId,
            episode_number: params.episodeNumber,
            episode_title: params.episodeTitle,
            episode_topic: params.episodeTopic,
            topic: params.topic,
            conversation_snippet: params.conversationSnippet,
            embedding: embedding,
            mentioned_entities: entities,
            keywords: keywords,
            sentiment: sentiment,
            importance_score: importanceScore,
            context_metadata: params.contextMetadata,
            host_id: params.hostId,
            show_id: params.showId
          };
        })
      );

      const { error: insertError } = await supabase
        .from('betabot_memory')
        .insert(memoryRecords);

      if (insertError) {
        console.error('❌ Error storing batch memories:', insertError);
        setError(insertError.message);
        return false;
      }

      console.log(`✅ Stored ${memories.length} memories successfully`);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error storing batch memories:', errorMessage);
      setError(errorMessage);
      return false;

    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Semantic search for similar memories
   */
  const searchMemories = useCallback(async (
    query: string,
    threshold: number = 0.7,
    limit: number = 5
  ): Promise<MemorySearchResult[]> => {
    try {
      console.log(`🔍 Searching memories for: "${query}"`);

      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);

      // Call the Postgres function for similarity search
      const { data, error: searchError } = await supabase
        .rpc('match_memories', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: limit
        });

      if (searchError) {
        console.error('❌ Error searching memories:', searchError);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} similar memories`);

      return (data || []).map((item: any) => ({
        id: item.id,
        topic: item.topic,
        conversationSnippet: item.conversation_snippet,
        mentionedEntities: item.mentioned_entities || [],
        keywords: [],
        sentiment: item.sentiment || 'neutral',
        importanceScore: item.importance_score || 0,
        recallCount: 0,
        episodeNumber: item.episode_number,
        episodeTitle: item.episode_title,
        createdAt: item.created_at,
        similarity: item.similarity
      }));

    } catch (err) {
      console.error('❌ Error searching memories:', err);
      return [];
    }
  }, []);

  /**
   * Find memories mentioning a specific entity
   */
  const findByEntity = useCallback(async (entityName: string, limit: number = 10): Promise<Memory[]> => {
    try {
      const { data, error: searchError } = await supabase
        .rpc('find_memories_by_entity', {
          entity_name_param: entityName,
          limit_count: limit
        });

      if (searchError) {
        console.error('Error finding memories by entity:', searchError);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        topic: item.topic,
        conversationSnippet: item.conversation_snippet,
        mentionedEntities: [],
        keywords: [],
        sentiment: 'neutral' as const,
        importanceScore: item.importance_score || 0,
        recallCount: 0,
        createdAt: item.created_at
      }));

    } catch (err) {
      console.error('Error finding memories by entity:', err);
      return [];
    }
  }, []);

  /**
   * Find memories from a specific episode
   */
  const findByEpisode = useCallback(async (episodeNumber: number): Promise<Memory[]> => {
    try {
      const { data, error: searchError } = await supabase
        .rpc('get_episode_context', {
          episode_num: episodeNumber
        });

      if (searchError) {
        console.error('Error finding memories by episode:', searchError);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: '', // Not returned by this function
        topic: item.topic,
        conversationSnippet: item.snippet,
        mentionedEntities: item.entities || [],
        keywords: [],
        sentiment: 'neutral' as const,
        importanceScore: item.importance || 0,
        recallCount: 0,
        createdAt: ''
      }));

    } catch (err) {
      console.error('Error finding memories by episode:', err);
      return [];
    }
  }, []);

  /**
   * Find memories by topic keyword
   */
  const findByTopic = useCallback(async (topic: string): Promise<Memory[]> => {
    try {
      const { data, error: searchError } = await supabase
        .from('betabot_memory')
        .select('*')
        .ilike('topic', `%${topic}%`)
        .order('importance_score', { ascending: false })
        .limit(10);

      if (searchError) {
        console.error('Error finding memories by topic:', searchError);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        topic: item.topic,
        conversationSnippet: item.conversation_snippet,
        mentionedEntities: item.mentioned_entities || [],
        keywords: item.keywords || [],
        sentiment: item.sentiment || 'neutral',
        importanceScore: item.importance_score || 0,
        recallCount: item.recall_count || 0,
        lastRecalled: item.last_recalled,
        createdAt: item.created_at
      }));

    } catch (err) {
      console.error('Error finding memories by topic:', err);
      return [];
    }
  }, []);

  /**
   * Increment recall count when a memory is used
   */
  const recallMemory = useCallback(async (memoryId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .rpc('increment_memory_recall', {
          memory_id_param: memoryId
        });

      if (updateError) {
        console.error('Error updating memory recall:', updateError);
        return false;
      }

      return true;

    } catch (err) {
      console.error('Error updating memory recall:', err);
      return false;
    }
  }, []);

  /**
   * Get knowledge about an entity
   */
  const getEntityKnowledge = useCallback(async (
    entityName: string,
    entityType?: string
  ): Promise<any> => {
    try {
      let query = supabase
        .from('betabot_entity_knowledge')
        .select('*')
        .eq('entity_name', entityName);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error: queryError } = await query.single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          return null; // Entity not found
        }
        console.error('Error fetching entity knowledge:', queryError);
        return null;
      }

      return data;

    } catch (err) {
      console.error('Error fetching entity knowledge:', err);
      return null;
    }
  }, []);

  /**
   * Update or create entity knowledge
   */
  const updateEntityKnowledge = useCallback(async (
    entityName: string,
    data: any
  ): Promise<boolean> => {
    try {
      const { error: upsertError } = await supabase
        .from('betabot_entity_knowledge')
        .upsert({
          entity_name: entityName,
          ...data,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error('Error updating entity knowledge:', upsertError);
        return false;
      }

      return true;

    } catch (err) {
      console.error('Error updating entity knowledge:', err);
      return false;
    }
  }, []);

  return {
    storeMemory,
    storeBatchMemories,
    searchMemories,
    findByEntity,
    findByEpisode,
    findByTopic,
    recallMemory,
    getEntityKnowledge,
    updateEntityKnowledge,
    isProcessing,
    error
  };
}
