/**
 * Producer AI Hook - Background worker for transcript analysis
 *
 * Responsibilities:
 * - Listen to stream transcripts continuously
 * - Generate follow-up questions based on conversation flow
 * - Suggest segment transitions
 * - Analyze discussion topics
 *
 * Does NOT handle:
 * - Wake phrase responses (that's BetaBot's job)
 * - Real-time search queries
 * - Direct user interactions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MultiModelQuestionGenerator } from '../lib/ai/MultiModelQuestionGenerator';
import { VotingEngine } from '../lib/ai/VotingEngine';
import { ContextMemoryManager } from '../lib/ai/ContextMemoryManager';
import { HostProfileManager } from '../lib/ai/HostProfileManager';
import {
  DEFAULT_MULTI_MODEL_CONFIG,
  DEFAULT_VOTING_CONFIG,
  DEFAULT_CONTEXT_MEMORY_CONFIG,
  DEFAULT_HOST_PROFILE_CONFIG,
  MultiModelConfig,
  VotingConfig,
  ContextMemoryConfig,
  HostProfileConfig,
  MultiModelGenerationResult,
  VotedQuestion,
  AIModel
} from '../lib/ai/types';

export interface ProducerAIConfig {
  enabled: boolean;
  analysisInterval: number; // seconds between analyses
  minTranscriptLength: number; // minimum words before analysis
  questionQuality: 'high' | 'medium' | 'low'; // confidence threshold
  autoAddToQueue: boolean; // automatically add questions to show_questions table
  // NEW: Phase 2 Multi-Model Configuration
  useMultiModel?: boolean; // Enable multi-model voting system
  multiModelConfig?: MultiModelConfig; // Configuration for each model
  votingConfig?: VotingConfig; // Configuration for voting/ranking
  // NEW: Phase 3 Context Memory Configuration
  contextMemoryConfig?: ContextMemoryConfig; // Configuration for context memory
  // NEW: Phase 4 Host Profile Configuration
  hostProfileConfig?: HostProfileConfig; // Configuration for host profile learning
  hostId?: string; // Host ID for profile tracking
}

export interface GeneratedQuestion {
  question_text: string;
  confidence: number;
  reasoning: string;
  context_summary: string;
  expected_direction?: string; // NEW: What type of discussion this might spark
  quality_score?: { // NEW: Breakdown of question quality
    depth: number;
    engagement: number;
    relevance: number;
    practicality: number;
  };
  source_model?: AIModel; // NEW Phase 2: Which AI model generated this question
}

export interface TranscriptAnalysis {
  reasoning_chain?: { // NEW: Chain-of-Thought reasoning
    topic_identification: string;
    conversation_state: 'deepening' | 'plateau' | 'exhausted';
    unexplored_angles: string[];
    momentum_assessment: string;
  };
  topic_summary: string;
  key_points: string[];
  questions: GeneratedQuestion[];
  segment_recommendation?: {
    should_transition: boolean;
    reason: string;
    confidence?: number; // NEW: Confidence in recommendation
  };
}

// NEW: Conversation state detection for adaptive timing
export interface ConversationState {
  type: 'rapid_exchange' | 'deep_discussion' | 'silence' | 'topic_shift' | 'normal';
  wordsPerMinute: number;
  speakerChanges: number;
  questionDetected: boolean;
  topicStability: number; // minutes on current topic
}

export interface UseProducerAI {
  isAnalyzing: boolean;
  isEnabled: boolean;
  config: ProducerAIConfig;
  updateConfig: (updates: Partial<ProducerAIConfig>) => void;
  lastAnalysis: TranscriptAnalysis | null;
  analysisCount: number;
  questionsGenerated: number;
  error: string | null;
  manualAnalyze: () => Promise<void>;
  conversationState: ConversationState | null; // NEW: Current conversation state
  nextAnalysisIn: number; // NEW: Seconds until next analysis
  // NEW Phase 2: Multi-Model Results
  multiModelResult: MultiModelGenerationResult | null; // Raw results from all models
  votedQuestions: VotedQuestion[]; // Ranked questions after voting
  // NEW Phase 3: Context Memory Stats
  contextMemoryStats: {
    totalQuestions: number;
    recentQuestions: number;
    showId: string;
    cacheAge: number;
  } | null;
  // NEW Phase 4: Host Profile Stats
  hostProfileStats: {
    hostId: string;
    hostName?: string;
    totalShows: number;
    usageRate: number;
    avgTimeToUse: number;
    preferredStyle?: string;
    confidenceScore: number;
    topTopics: Array<{ topic: string; score: number }>;
    sessionStats: {
      questionsGenerated: number;
      questionsUsed: number;
      currentUsageRate: number;
    };
  } | null;
}

const DEFAULT_CONFIG: ProducerAIConfig = {
  enabled: false,
  analysisInterval: 120, // 2 minutes
  minTranscriptLength: 100, // 100 words minimum
  questionQuality: 'medium',
  autoAddToQueue: true,
  // Phase 2: Multi-Model Configuration (disabled by default for backward compatibility)
  useMultiModel: false,
  multiModelConfig: DEFAULT_MULTI_MODEL_CONFIG,
  votingConfig: DEFAULT_VOTING_CONFIG,
  // Phase 3: Context Memory Configuration
  contextMemoryConfig: DEFAULT_CONTEXT_MEMORY_CONFIG,
  // Phase 4: Host Profile Configuration
  hostProfileConfig: DEFAULT_HOST_PROFILE_CONFIG,
  hostId: undefined
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export function useProducerAI(): UseProducerAI {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [config, setConfig] = useState<ProducerAIConfig>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('producer_ai_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [lastAnalysis, setLastAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [questionsGenerated, setQuestionsGenerated] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null); // NEW
  const [nextAnalysisIn, setNextAnalysisIn] = useState(120); // NEW
  // NEW Phase 2: Multi-Model State
  const [multiModelResult, setMultiModelResult] = useState<MultiModelGenerationResult | null>(null);
  const [votedQuestions, setVotedQuestions] = useState<VotedQuestion[]>([]);
  // NEW Phase 3: Context Memory State
  const [contextMemoryStats, setContextMemoryStats] = useState<{
    totalQuestions: number;
    recentQuestions: number;
    showId: string;
    cacheAge: number;
  } | null>(null);
  // NEW Phase 4: Host Profile State
  const [hostProfileStats, setHostProfileStats] = useState<{
    hostId: string;
    hostName?: string;
    totalShows: number;
    usageRate: number;
    avgTimeToUse: number;
    preferredStyle?: string;
    confidenceScore: number;
    topTopics: Array<{ topic: string; score: number }>;
    sessionStats: {
      questionsGenerated: number;
      questionsUsed: number;
      currentUsageRate: number;
    };
  } | null>(null);

  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedTranscriptIdRef = useRef<string | null>(null);
  const transcriptBufferRef = useRef<string>('');
  const lastTopicRef = useRef<string>(''); // NEW: Track topic changes
  const topicStartTimeRef = useRef<Date>(new Date()); // NEW: Track topic duration
  const contextMemoryRef = useRef<ContextMemoryManager | null>(null); // NEW Phase 3: Context Memory Manager
  const hostProfileRef = useRef<HostProfileManager | null>(null); // NEW Phase 4: Host Profile Manager
  const aiCoordinatorRef = useRef<import('../lib/ai/AICoordinator').AICoordinator | null>(null); // NEW: AI Coordinator

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('producer_ai_config', JSON.stringify(config));
  }, [config]);

  // Watch for AI Automation toggle in show_metadata
  useEffect(() => {
    const loadShowMetadata = async () => {
      const { data } = await supabase
        .from('show_metadata')
        .select('auto_advance_enabled, id')
        .single();

      if (data && data.auto_advance_enabled !== config.enabled) {
        console.log(`🤖 Producer AI: AI Automation toggled to ${data.auto_advance_enabled ? 'ON' : 'OFF'}`);
        setConfig(prev => ({ ...prev, enabled: data.auto_advance_enabled }));
      }

      // NEW Phase 3: Initialize context memory for show
      if (data?.id && config.contextMemoryConfig?.enabled) {
        console.log(`📚 Context Memory: Initializing for show ${data.id}`);
        const contextMemory = new ContextMemoryManager(
          supabase,
          config.contextMemoryConfig
        );
        await contextMemory.initializeForShow(data.id);
        contextMemoryRef.current = contextMemory;

        // Update stats
        const stats = contextMemory.getCacheStats();
        setContextMemoryStats(stats);
        console.log(`✅ Context Memory: Initialized with ${stats.totalQuestions} historical questions`);
      }

      // NEW Phase 4: Initialize host profile manager
      if (config.hostProfileConfig?.enabled && config.hostId) {
        console.log(`👤 Host Profile: Initializing for host ${config.hostId}`);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

        const hostProfile = new HostProfileManager(
          supabaseUrl,
          supabaseKey,
          config.hostProfileConfig
        );

        await hostProfile.initializeForHost(config.hostId);
        hostProfileRef.current = hostProfile;

        // Update stats
        const stats = hostProfile.getProfileStats();
        setHostProfileStats(stats);
        console.log(`✅ Host Profile: Initialized (confidence: ${stats?.confidenceScore.toFixed(2)})`);
      }

      // NEW: Initialize AI Coordinator
      if (data?.auto_advance_enabled && !aiCoordinatorRef.current) {
        console.log('🎯 Initializing AI Coordinator...');
        const { AICoordinator } = await import('../lib/ai/AICoordinator');

        aiCoordinatorRef.current = new AICoordinator({
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL!,
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
          hostId: config.hostId,
          enablePredictions: true,
          enableHostProfile: config.hostProfileConfig?.enabled,
          enableContextMemory: config.contextMemoryConfig?.enabled,
          openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY
        });

        await aiCoordinatorRef.current.initialize();
        console.log('✅ AI Coordinator initialized');
      }
    };

    loadShowMetadata();

    const channel = supabase
      .channel('producer_ai_metadata_sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'show_metadata'
      }, (payload) => {
        const newValue = payload.new.auto_advance_enabled;
        if (newValue !== undefined && newValue !== config.enabled) {
          console.log(`🤖 Producer AI: AI Automation toggled to ${newValue ? 'ON' : 'OFF'}`);
          setConfig(prev => ({ ...prev, enabled: newValue }));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();

      // NEW Phase 3: Cleanup context memory on unmount
      if (contextMemoryRef.current) {
        contextMemoryRef.current.stopAndPersist();
        contextMemoryRef.current = null;
      }

      // NEW Phase 4: Cleanup host profile manager on unmount
      if (hostProfileRef.current) {
        hostProfileRef.current.updateProfile(); // Final update before cleanup
        hostProfileRef.current.destroy();
        hostProfileRef.current = null;
      }
    };
  }, []); // Only run once on mount

  const updateConfig = useCallback((updates: Partial<ProducerAIConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * NEW: Detect conversation state from recent transcripts
   */
  const detectConversationState = useCallback((transcripts: Array<{ transcript: string; created_at: string; speaker_type?: string }>): ConversationState => {
    if (transcripts.length === 0) {
      return {
        type: 'silence',
        wordsPerMinute: 0,
        speakerChanges: 0,
        questionDetected: false,
        topicStability: 0
      };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Calculate words per minute
    const recentTranscripts = transcripts.filter(t =>
      new Date(t.created_at).getTime() > oneMinuteAgo
    );

    const recentWords = recentTranscripts
      .map(t => t.transcript.split(/\s+/).length)
      .reduce((sum, count) => sum + count, 0);

    const wordsPerMinute = recentWords;

    // Calculate speaker changes (last 10 segments)
    const recent10 = transcripts.slice(-10);
    const speakerChanges = recent10.reduce((changes, t, i, arr) => {
      if (i === 0) return 0;
      return changes + (t.speaker_type !== arr[i - 1].speaker_type ? 1 : 0);
    }, 0);

    // Detect questions in recent transcripts
    const questionDetected = transcripts
      .slice(-3)
      .some(t => t.transcript.includes('?'));

    // Calculate topic stability (how long on current topic)
    const topicStability = lastTopicRef.current
      ? (Date.now() - topicStartTimeRef.current.getTime()) / 1000 / 60
      : 0;

    // Determine state type
    let type: ConversationState['type'] = 'normal';

    if (wordsPerMinute < 30) {
      type = 'silence';
    } else if (questionDetected) {
      type = 'topic_shift';
    } else if (wordsPerMinute > 150 || speakerChanges > 7) {
      type = 'rapid_exchange';
    } else if (topicStability > 10 && wordsPerMinute < 80) {
      type = 'deep_discussion';
    }

    return {
      type,
      wordsPerMinute,
      speakerChanges,
      questionDetected,
      topicStability
    };
  }, []);

  /**
   * NEW: Calculate next analysis interval based on conversation state
   */
  const calculateNextInterval = useCallback((state: ConversationState): number => {
    const BASE_INTERVAL = config.analysisInterval; // Use configured base interval

    switch (state.type) {
      case 'rapid_exchange':
        return Math.max(30, BASE_INTERVAL * 0.5); // 60s for 120s base, minimum 30s
      case 'topic_shift':
        return Math.max(20, BASE_INTERVAL * 0.25); // 30s for 120s base, immediate
      case 'silence':
        return BASE_INTERVAL * 2; // 240s - wait longer during silence
      case 'deep_discussion':
        return BASE_INTERVAL * 1.5; // 180s - less frequent during deep discussion
      default:
        return BASE_INTERVAL; // 120s - normal
    }
  }, [config.analysisInterval]);

  /**
   * Analyze transcript buffer and generate questions
   */
  const analyzeTranscripts = useCallback(async (transcriptText: string): Promise<TranscriptAnalysis | null> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check minimum length
    const wordCount = transcriptText.trim().split(/\s+/).length;
    if (wordCount < config.minTranscriptLength) {
      console.log(`📊 Producer AI: Skipping analysis - only ${wordCount} words (need ${config.minTranscriptLength})`);
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log(`🤖 Producer AI: Analyzing ${wordCount} words of transcript...`);

      const systemPrompt = `You are Producer AI, an expert broadcast producer analyzing live philosophical discussions.

<task>
Analyze the conversation transcript and generate 2-4 high-quality follow-up questions that will:
1. Deepen intellectual discourse (not surface-level)
2. Challenge assumptions or explore counterpoints
3. Connect to broader themes or real-world examples
4. Engage both panelists and audience
</task>

<context>
Show: "Abe I Stream"
Format: Philosophical/cultural discussion livestream
Audience: Intellectually curious viewers seeking depth
Host Style: Socratic questioning, values nuance over quick takes
</context>

<thinking>
Use this reasoning framework:

Step 1: TOPIC IDENTIFICATION
- What is the core topic being discussed?
- What are the 2-3 main arguments or viewpoints?
- What assumptions are being made?

Step 2: CONVERSATION MOMENTUM
- Is the discussion deepening or becoming repetitive?
- Are there unexplored angles or counterarguments?
- Has the topic been exhausted? (check for circular reasoning)

Step 3: QUESTION GENERATION
For each potential question, evaluate:
- Intellectual depth: Does it move beyond obvious responses?
- Engagement potential: Will it spark interesting discussion?
- Relevance: Does it naturally follow from the conversation?
- Practical applicability: Can it connect to real-world examples?

Assign confidence based on:
- High (0.8-1.0): Question builds on established context, addresses gap in discussion
- Medium (0.6-0.79): Question is relevant but somewhat tangential
- Low (0.4-0.59): Question might disrupt flow or be too basic
</thinking>

<output_format>
{
  "reasoning_chain": {
    "topic_identification": "Brief summary of core topic",
    "conversation_state": "deepening | plateau | exhausted",
    "unexplored_angles": ["angle 1", "angle 2"],
    "momentum_assessment": "Explanation of current conversation momentum"
  },
  "topic_summary": "One-sentence summary",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "questions": [
    {
      "question_text": "The actual question",
      "confidence": 0.85,
      "reasoning": "Why this question is valuable (specific to current conversation)",
      "context_summary": "What in the transcript led to this question",
      "expected_direction": "What type of discussion this might spark",
      "quality_score": {
        "depth": 0.9,
        "engagement": 0.8,
        "relevance": 0.85,
        "practicality": 0.7
      }
    }
  ],
  "segment_recommendation": {
    "should_transition": false,
    "reason": "Specific reason based on conversation analysis",
    "confidence": 0.75
  }
}
</output_format>

<quality_criteria>
EXCELLENT questions (0.8+):
- Build on specific points made in transcript
- Introduce productive tension or counterpoint
- Have clear relevance to broader themes
- Likely to generate 3+ minutes of quality discussion

GOOD questions (0.6-0.79):
- Relevant to general topic
- May deepen one aspect of discussion
- Somewhat predictable but valuable

WEAK questions (below 0.6):
- Generic or could apply to any similar discussion
- Simple yes/no or factual questions
- Disrupt conversation flow
- Too obvious or surface-level
</quality_criteria>

Generate 2-4 questions maximum. Prioritize quality over quantity.`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this transcript:\n\n${transcriptText}` }
          ],
          temperature: 0.7,
          max_tokens: 1500, // Increased for Chain-of-Thought response
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices?.[0]?.message?.content || '{}';
      const analysis: TranscriptAnalysis = JSON.parse(analysisText);

      console.log(`✅ Producer AI: Generated ${analysis.questions.length} questions`);
      console.log(`📊 Topic: ${analysis.topic_summary}`);

      // NEW: Log reasoning chain
      if (analysis.reasoning_chain) {
        console.log(`🧠 Reasoning Chain:`);
        console.log(`   Topic: ${analysis.reasoning_chain.topic_identification}`);
        console.log(`   State: ${analysis.reasoning_chain.conversation_state}`);
        console.log(`   Momentum: ${analysis.reasoning_chain.momentum_assessment}`);
        if (analysis.reasoning_chain.unexplored_angles.length > 0) {
          console.log(`   Unexplored: ${analysis.reasoning_chain.unexplored_angles.join(', ')}`);
        }
      }

      setLastAnalysis(analysis);
      setAnalysisCount(prev => prev + 1);

      // Filter questions by quality threshold
      const qualityThresholds = { high: 0.8, medium: 0.6, low: 0.4 };
      const threshold = qualityThresholds[config.questionQuality];
      const qualityQuestions = analysis.questions.filter(q => q.confidence >= threshold);

      console.log(`🎯 Producer AI: ${qualityQuestions.length}/${analysis.questions.length} questions meet quality threshold (${config.questionQuality})`);

      // Auto-add to queue if enabled
      if (config.autoAddToQueue && qualityQuestions.length > 0) {
        // Route through AI Coordinator if available
        if (aiCoordinatorRef.current) {
          console.log('🎯 Routing questions through AI Coordinator...');

          for (const q of qualityQuestions) {
            const result = await aiCoordinatorRef.current.submitQuestion({
              question: q,
              source: 'producer_ai',
              metadata: {
                topic: analysis.topic_summary,
                confidence: q.confidence,
                reasoning: q.reasoning,
                context_summary: q.context_summary,
                expected_direction: q.expected_direction,
                quality_score: q.quality_score,
                reasoning_chain: analysis.reasoning_chain,
                analysis_timestamp: new Date().toISOString()
              }
            });

            if (result.status === 'approved') {
              console.log(`✅ Question approved by coordinator (priority: ${result.priority})`);
              setQuestionsGenerated(prev => prev + 1);
            } else if (result.status === 'flagged') {
              console.log(`⚠️ Question flagged for review: ${result.reason}`);
            } else if (result.status === 'rejected') {
              console.log(`❌ Question rejected: ${result.reason}`);
            }
          }
        } else {
          // Fallback to direct insert if coordinator not available
          console.log('⚠️ AI Coordinator not available, using direct insert');

          const questionsToInsert = qualityQuestions.map(q => ({
            topic: analysis.topic_summary,
            question_text: q.question_text,
            position: 0,
            tts_generated: false,
            tts_audio_url: null,
            context_metadata: {
              source: 'producer_ai',
              confidence: q.confidence,
              reasoning: q.reasoning,
              context_summary: q.context_summary,
              expected_direction: q.expected_direction,
              quality_score: q.quality_score,
              reasoning_chain: analysis.reasoning_chain,
              analysis_timestamp: new Date().toISOString()
            }
          }));

          const { error: insertError } = await supabase
            .from('show_questions')
            .insert(questionsToInsert);

          if (insertError) {
            console.error('❌ Producer AI: Failed to add questions to queue:', insertError);
          } else {
            console.log(`✅ Producer AI: Added ${qualityQuestions.length} questions to queue`);
            setQuestionsGenerated(prev => prev + qualityQuestions.length);
          }
        }
      }

      return analysis;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      console.error('❌ Producer AI error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [config]);

  /**
   * NEW Phase 2: Multi-Model Question Generation
   * Uses multiple AI models in parallel with voting
   */
  const analyzeWithMultiModel = useCallback(async (transcriptText: string): Promise<TranscriptAnalysis | null> => {
    const apiKeys = {
      openai: import.meta.env.VITE_OPENAI_API_KEY!,
      anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY!,
      gemini: import.meta.env.VITE_GEMINI_API_KEY!
    };

    if (!apiKeys.openai) {
      throw new Error('OpenAI API key not configured');
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🎯 Multi-Model Analysis: Starting parallel generation...');

      // Initialize multi-model generator
      const generator = new MultiModelQuestionGenerator(
        config.multiModelConfig || DEFAULT_MULTI_MODEL_CONFIG,
        apiKeys
      );

      // Generate questions from all models in parallel
      const result = await generator.generateQuestions(transcriptText);
      setMultiModelResult(result);

      // Collect all questions from all models
      const allQuestions: Array<GeneratedQuestion & { source_model?: AIModel }> = [];
      if (result.gpt4o) allQuestions.push(...result.gpt4o.questions);
      if (result.claude) allQuestions.push(...result.claude.questions);
      if (result.gemini) allQuestions.push(...result.gemini.questions);

      console.log(`📊 Total questions generated: ${allQuestions.length}`);

      if (allQuestions.length === 0) {
        console.log('⚠️ No questions generated from any model');
        return null;
      }

      // Initialize voting engine with context memory (Phase 3) and host profile (Phase 4)
      const votingEngine = new VotingEngine(
        config.votingConfig || DEFAULT_VOTING_CONFIG,
        contextMemoryRef.current || undefined,
        hostProfileRef.current || undefined
      );

      // Rank questions using voting (now with context memory filtering)
      const ranked = await votingEngine.rankQuestions(allQuestions);
      setVotedQuestions(ranked);

      console.log(`🏆 Top ${ranked.length} questions after voting`);

      // NEW Phase 3: Add ranked questions to context memory
      if (contextMemoryRef.current && ranked.length > 0) {
        for (const votedQuestion of ranked) {
          await contextMemoryRef.current.addQuestion(
            votedQuestion.question,
            votedQuestion.sourceModel
          );
        }

        // Update stats
        const stats = contextMemoryRef.current.getCacheStats();
        setContextMemoryStats(stats);
        console.log(`📚 Context Memory: Now tracking ${stats.totalQuestions} questions (${stats.recentQuestions} recent)`);
      }

      // NEW Phase 4: Record questions in host profile
      if (hostProfileRef.current && ranked.length > 0 && data?.id) {
        for (const votedQuestion of ranked) {
          await hostProfileRef.current.recordQuestionGenerated(
            votedQuestion.question,
            votedQuestion.sourceModel,
            data.id,
            [] // Embedding will be calculated later if needed
          );
        }

        // Update stats
        const stats = hostProfileRef.current.getProfileStats();
        setHostProfileStats(stats);
        console.log(`👤 Host Profile: Tracked ${ranked.length} questions (confidence: ${stats?.confidenceScore.toFixed(2)})`);
      }

      // Use the top-ranked question's analysis as the primary analysis
      const primaryAnalysis = result.gpt4o?.analysis || result.claude?.analysis || result.gemini?.analysis;

      if (!primaryAnalysis) {
        console.log('⚠️ No analysis available from any model');
        return null;
      }

      // Replace questions with voted/ranked questions
      const finalAnalysis: TranscriptAnalysis = {
        ...primaryAnalysis,
        questions: ranked.map(vq => vq.question)
      };

      setLastAnalysis(finalAnalysis);
      setAnalysisCount(prev => prev + 1);

      // Auto-add high-quality questions to queue if enabled
      if (config.autoAddToQueue) {
        const qualityThreshold = config.questionQuality === 'high' ? 0.8 :
                                 config.questionQuality === 'medium' ? 0.6 : 0.4;

        const qualityQuestions = ranked.filter(vq => vq.final_score >= qualityThreshold);

        if (qualityQuestions.length === 0) {
          console.log(`⚠️ No questions met quality threshold (${qualityThreshold})`);
          return finalAnalysis;
        }

        // Route through AI Coordinator if available
        if (aiCoordinatorRef.current) {
          console.log('🎯 Routing multi-model questions through AI Coordinator...');

          for (const vq of qualityQuestions) {
            const result = await aiCoordinatorRef.current.submitQuestion({
              question: vq.question,
              source: 'producer_ai',
              metadata: {
                source_type: 'multi_model',
                confidence: vq.question.confidence,
                reasoning: vq.question.reasoning,
                context_summary: vq.question.context_summary,
                expected_direction: vq.question.expected_direction,
                quality_score: vq.question.quality_score,
                source_model: vq.sourceModel,
                voting_scores: vq.votes,
                diversity_score: vq.diversity_score,
                final_score: vq.final_score,
                reasoning_chain: primaryAnalysis.reasoning_chain,
                analysis_timestamp: new Date().toISOString()
              }
            });

            if (result.status === 'approved') {
              console.log(`✅ Multi-model question approved (priority: ${result.priority})`);
              setQuestionsGenerated(prev => prev + 1);
            } else if (result.status === 'flagged') {
              console.log(`⚠️ Multi-model question flagged: ${result.reason}`);
            } else if (result.status === 'rejected') {
              console.log(`❌ Multi-model question rejected: ${result.reason}`);
            }
          }
        } else {
          // Fallback to direct insert
          console.log('⚠️ AI Coordinator not available, using direct insert');

          const questionsToInsert = qualityQuestions.map(vq => ({
            question_text: vq.question.question_text,
            status: 'pending' as const,
            metadata: {
              source: 'producer_ai_multi_model',
              confidence: vq.question.confidence,
              reasoning: vq.question.reasoning,
              context_summary: vq.question.context_summary,
              expected_direction: vq.question.expected_direction,
              quality_score: vq.question.quality_score,
              source_model: vq.sourceModel,
              voting_scores: vq.votes,
              diversity_score: vq.diversity_score,
              final_score: vq.final_score,
              reasoning_chain: primaryAnalysis.reasoning_chain,
              analysis_timestamp: new Date().toISOString()
            }
          }));

          const { error: insertError } = await supabase
            .from('show_questions')
            .insert(questionsToInsert);

          if (insertError) {
            console.error('❌ Multi-Model: Failed to add questions to queue:', insertError);
          } else {
            console.log(`✅ Multi-Model: Added ${qualityQuestions.length} voted questions to queue`);
            setQuestionsGenerated(prev => prev + qualityQuestions.length);
          }
        }
      }

      return finalAnalysis;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Multi-model analysis failed';
      console.error('❌ Multi-Model error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [config]);

  /**
   * Fetch recent transcripts and build buffer
   */
  const fetchRecentTranscripts = useCallback(async (): Promise<{
    text: string;
    transcripts: Array<{ transcript: string; created_at: string; speaker_type?: string }>;
  }> => {
    try {
      // Get transcripts from last 3 minutes
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('betabot_conversation_log')
        .select('id, transcript_text, created_at, speaker_type')
        .gte('created_at', threeMinutesAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('📊 Producer AI: No recent transcripts found');
        return { text: '', transcripts: [] };
      }

      // Build transcript buffer
      const transcriptText = data.map(t => t.transcript_text).join(' ');

      // Map to simplified format for state detection
      const transcripts = data.map(t => ({
        transcript: t.transcript_text,
        created_at: t.created_at,
        speaker_type: t.speaker_type
      }));

      // Track last analyzed ID to avoid re-analyzing
      if (data.length > 0) {
        lastAnalyzedTranscriptIdRef.current = data[data.length - 1].id;
      }

      console.log(`📊 Producer AI: Fetched ${data.length} transcript entries (${transcriptText.split(' ').length} words)`);

      return { text: transcriptText, transcripts };

    } catch (err) {
      console.error('❌ Producer AI: Failed to fetch transcripts:', err);
      return { text: '', transcripts: [] };
    }
  }, []);

  /**
   * Manual analysis trigger
   */
  const manualAnalyze = useCallback(async () => {
    console.log('🎬 Producer AI: Manual analysis triggered');
    const { text, transcripts } = await fetchRecentTranscripts();

    // Detect conversation state
    const state = detectConversationState(transcripts);
    setConversationState(state);
    console.log(`🔍 Conversation State: ${state.type} (${state.wordsPerMinute} WPM, ${state.speakerChanges} speaker changes)`);

    if (text) {
      // Use multi-model if enabled, otherwise single-model
      if (config.useMultiModel) {
        console.log('🎯 Using Multi-Model Analysis (Phase 2)');
        await analyzeWithMultiModel(text);
      } else {
        console.log('🤖 Using Single-Model Analysis (GPT-4o)');
        await analyzeTranscripts(text);
      }
    } else {
      setError('No transcripts available to analyze');
    }
  }, [fetchRecentTranscripts, analyzeTranscripts, analyzeWithMultiModel, detectConversationState, config.useMultiModel]);

  /**
   * Automatic analysis loop with adaptive timing
   */
  useEffect(() => {
    if (!config.enabled) {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
      console.log('🛑 Producer AI: Disabled');
      return;
    }

    console.log(`▶️ Producer AI: Adaptive analysis enabled (base interval: ${config.analysisInterval}s)`);

    const runAnalysis = async () => {
      if (isAnalyzing) {
        console.log('⏳ Producer AI: Already analyzing, skipping...');
        // Schedule next run with current interval
        const nextInterval = nextAnalysisIn || config.analysisInterval;
        analysisTimerRef.current = setTimeout(runAnalysis, nextInterval * 1000);
        return;
      }

      // Fetch transcripts with full data
      const { text, transcripts } = await fetchRecentTranscripts();

      // Detect conversation state
      const state = detectConversationState(transcripts);
      setConversationState(state);

      // Track topic changes
      if (lastAnalysis && lastAnalysis.topic_summary !== lastTopicRef.current) {
        console.log(`📍 Topic change detected: "${lastTopicRef.current}" → "${lastAnalysis.topic_summary}"`);
        lastTopicRef.current = lastAnalysis.topic_summary;
        topicStartTimeRef.current = new Date();
      }

      // Log conversation state
      console.log(`🔍 Conversation State: ${state.type}`);
      console.log(`   • ${state.wordsPerMinute} WPM`);
      console.log(`   • ${state.speakerChanges} speaker changes`);
      console.log(`   • ${state.questionDetected ? 'Question detected' : 'No questions'}`);
      console.log(`   • Topic stability: ${state.topicStability.toFixed(1)} minutes`);

      // Run analysis if we have transcripts
      if (text) {
        // Use multi-model if enabled, otherwise single-model
        if (config.useMultiModel) {
          await analyzeWithMultiModel(text);
        } else {
          await analyzeTranscripts(text);
        }
      }

      // Calculate next interval based on state
      const nextInterval = calculateNextInterval(state);
      setNextAnalysisIn(nextInterval);

      // Log adaptive timing decision
      if (nextInterval !== config.analysisInterval) {
        const multiplier = (nextInterval / config.analysisInterval).toFixed(2);
        console.log(`⏱️ Adaptive Timing: Next analysis in ${nextInterval}s (${multiplier}x base interval)`);
      } else {
        console.log(`⏱️ Timing: Next analysis in ${nextInterval}s (normal interval)`);
      }

      // Schedule next run with adaptive interval
      analysisTimerRef.current = setTimeout(runAnalysis, nextInterval * 1000);
    };

    // Run immediately on enable
    runAnalysis();

    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
    };
  }, [config.enabled, config.analysisInterval, config.useMultiModel, isAnalyzing, fetchRecentTranscripts, analyzeTranscripts, analyzeWithMultiModel, detectConversationState, calculateNextInterval, lastAnalysis]);

  return {
    isAnalyzing,
    isEnabled: config.enabled,
    config,
    updateConfig,
    lastAnalysis,
    analysisCount,
    questionsGenerated,
    error,
    manualAnalyze,
    conversationState, // NEW: Current conversation state
    nextAnalysisIn, // NEW: Seconds until next analysis
    multiModelResult, // NEW Phase 2: Raw multi-model results
    votedQuestions, // NEW Phase 2: Voted/ranked questions
    contextMemoryStats, // NEW Phase 3: Context memory statistics
    hostProfileStats // NEW Phase 4: Host profile statistics
  };
}
