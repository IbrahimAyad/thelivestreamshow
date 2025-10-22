/**
 * Type definitions for multi-model AI question generation
 * Phase 2 - Multi-Model Voting System
 */

import { GeneratedQuestion, TranscriptAnalysis } from '../../hooks/useProducerAI';

export type AIModel = 'gpt-4o' | 'claude' | 'gemini';

export interface ModelConfig {
  enabled: boolean;
  temperature: number;
  max_tokens: number;
  timeout: number; // milliseconds
}

export interface MultiModelConfig {
  gpt4o: ModelConfig;
  claude: ModelConfig;
  gemini: ModelConfig;
  parallel: boolean;
  fallback_on_error: boolean;
}

export interface ModelGenerationResult {
  questions: GeneratedQuestion[];
  analysis: TranscriptAnalysis;
  cost: number;
  timing: number; // milliseconds
  model: AIModel;
}

export interface MultiModelGenerationResult {
  gpt4o: ModelGenerationResult | null;
  claude: ModelGenerationResult | null;
  gemini: ModelGenerationResult | null;
  totalCost: number;
  totalTiming: number;
  errors: Record<AIModel, string | null>;
}

export interface VotedQuestion {
  question: GeneratedQuestion;
  sourceModel: AIModel;
  votes: {
    gpt4o_score: number;
    claude_score: number;
    gemini_score: number;
    average: number;
  };
  diversity_score: number;
  final_score: number;
  similar_to: string[]; // Question IDs that were deduped as similar
}

export interface VotingConfig {
  similarity_threshold: number; // 0.0-1.0, higher = more similar required for deduplication
  quality_weight: number; // Weight for quality in final score
  diversity_weight: number; // Weight for diversity in final score
  novelty_weight?: number; // Weight for novelty in final score
  min_votes_required: number; // Minimum models that must succeed
}

export interface APIKeys {
  openai: string;
  anthropic: string;
  gemini: string;
}

export interface UsageMetadata {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Pricing constants (as of October 2025)
export const MODEL_PRICING = {
  'gpt-4o': {
    input: 2.50 / 1_000_000, // $2.50 per 1M input tokens
    output: 10.00 / 1_000_000 // $10.00 per 1M output tokens
  },
  'claude': {
    input: 3.00 / 1_000_000, // $3.00 per 1M input tokens
    output: 15.00 / 1_000_000 // $15.00 per 1M output tokens
  },
  'gemini': {
    input: 0.00 / 1_000_000, // Free tier
    output: 0.00 / 1_000_000 // Free tier
  },
  'embedding': {
    input: 0.02 / 1_000_000, // $0.02 per 1M tokens for text-embedding-3-small
    output: 0
  }
} as const;

export const DEFAULT_MULTI_MODEL_CONFIG: MultiModelConfig = {
  gpt4o: {
    enabled: true,
    temperature: 0.7,
    max_tokens: 1500,
    timeout: 10000
  },
  claude: {
    enabled: true,
    temperature: 0.7,
    max_tokens: 1500,
    timeout: 10000
  },
  gemini: {
    enabled: true,
    temperature: 0.7,
    max_tokens: 1500,
    timeout: 10000
  },
  parallel: true,
  fallback_on_error: true
};

export const DEFAULT_VOTING_CONFIG: VotingConfig = {
  similarity_threshold: 0.8, // 80% similar = duplicate
  quality_weight: 0.7, // 70% weight on quality
  diversity_weight: 0.3, // 30% weight on diversity
  min_votes_required: 2 // At least 2 models must succeed
};

// ============================================================================
// Phase 3: Context Memory Types
// ============================================================================

/**
 * Configuration for context memory system
 */
export interface ContextMemoryConfig {
  enabled: boolean;                    // Toggle context memory on/off
  maxCacheSize: number;                // Max questions in memory (default: 100)
  similarityThreshold: number;         // Block if > this (default: 0.80)
  penaltySimilarityThreshold: number;  // Penalize if > this (default: 0.70)
  penaltyThreshold?: number;           // Alias for penaltySimilarityThreshold
  noveltyBoostThreshold: number;       // Boost if < this (default: 0.60)
  boostThreshold?: number;             // Alias for noveltyBoostThreshold
  temporalDecayHalfLife: number;       // Minutes (default: 30)
  persistenceInterval?: number;        // Persistence interval in minutes
  persistToDatabase: boolean;          // Save to Supabase (default: true)
  retentionDays: number;               // Keep history for X days (default: 30)
}

/**
 * Default context memory configuration
 */
export const DEFAULT_CONTEXT_MEMORY_CONFIG: ContextMemoryConfig = {
  enabled: true,
  maxCacheSize: 100,
  similarityThreshold: 0.80,
  penaltySimilarityThreshold: 0.70,
  noveltyBoostThreshold: 0.60,
  temporalDecayHalfLife: 30,
  persistToDatabase: true,
  retentionDays: 30
};

/**
 * Historical question item stored in context memory
 */
export interface QuestionHistoryItem {
  id?: string;                    // UUID from database
  text: string;                   // Question text
  embedding: number[];            // Vector embedding
  timestamp: Date;                // When was it asked
  confidence: number;             // Original confidence score
  sourceModel: AIModel;           // Which model generated it
  wasUsed: boolean;               // Did host actually use this question
  showId?: string;                // Which show it belongs to
  topicTags?: string[];           // Optional topic tags
}

/**
 * Similarity check result from context memory
 */
export interface SimilarityCheckResult {
  isSimilar: boolean;             // Is this question too similar to history?
  mostSimilarQuestion: string | null;  // Most similar past question
  similarity: number;             // Similarity score (0-1)
  timeAgo: number;                // Minutes since similar question
  shouldFilter: boolean;          // Should we completely filter this out?
  shouldPenalize: boolean;        // Should we reduce its score?
  shouldBoost: boolean;           // Should we boost its score (very novel)?
}

/**
 * Context memory cache structure (in-memory)
 */
export interface ContextMemoryCache {
  showId: string;                 // Current show ID
  questions: QuestionHistoryItem[];  // Historical questions
  maxSize: number;                // Max cache size
  createdAt: Date;                // When cache was initialized
  push: (item: QuestionHistoryItem) => void; // Add question to cache
}

/**
 * Novelty score breakdown
 */
export interface NoveltyScore {
  score: number;                  // Overall novelty (0-1, higher = more novel)
  maxSimilarity: number;          // Highest similarity to any past question
  avgRecentSimilarity: number;    // Average similarity to recent questions
  explorationBonus: number;       // Bonus for exploring new angles
  temporalDecayFactor: number;    // How much temporal decay was applied
}

// ============================================================================
// Phase 4: Intelligent Question Evolution & Host Adaptation
// ============================================================================

/**
 * Question style categories
 */
export type QuestionStyle = 'open-ended' | 'specific' | 'provocative' | 'analytical' | 'unknown';

/**
 * Engagement level categories
 */
export type EngagementLevel = 'low' | 'medium' | 'high' | 'viral';

/**
 * Host profile with learned preferences and patterns
 */
export interface HostProfile {
  id: string;
  hostId: string;
  hostName?: string;
  host_id?: string; // Alias for hostId
  host_name?: string; // Alias for hostName

  // Show statistics
  totalShows: number;
  totalQuestionsGenerated: number;
  totalQuestionsAsked: number;
  totalQuestionsIgnored: number;
  total_questions_analyzed?: number; // Alias for totalQuestionsAsked
  confidence_score?: number; // Alias for confidenceScore

  // Usage metrics
  usageRate: number;        // 0-1, % of generated questions actually used
  avgTimeToUse: number;     // seconds from generation to use

  // Preference metrics
  avgComplexity: number;    // 0-1
  avgLength: number;        // words
  preferredStyle?: QuestionStyle;

  // Advanced preferences
  technical_depth_preference?: number; // 0-1
  controversy_tolerance?: number; // 0-1
  humor_preference?: number; // 0-1
  philosophical_preference?: number; // 0-1
  practical_preference?: number; // 0-1
  preferred_topics?: string[]; // Array of preferred topics
  avoided_topics?: string[]; // Array of avoided topics

  // Distributions
  topicDistribution: Record<string, number>;  // topic -> frequency
  stylePreferences: Record<QuestionStyle, number>;  // style -> preference (0-1)

  // Learning metadata
  lastAnalyzedAt?: Date;
  confidenceScore: number;  // 0-1, confidence in profile accuracy

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Global question insight with success metrics
 */
export interface QuestionInsight {
  id: string;

  // Question content
  questionText: string;
  embedding: number[];

  // Context
  showId: string;
  hostId?: string;
  analysisId?: string;
  timestamp: Date;

  // Characteristics
  topic?: string;
  complexity: number;    // 0-1
  length: number;        // words
  style: QuestionStyle;

  // Source
  sourceModel: AIModel;
  generationScore?: number;

  // Usage
  wasUsed: boolean;
  timeToUse?: number;    // seconds
  usedAt?: Date;

  // Engagement metrics
  chatActivityBefore?: number;
  chatActivityAfter?: number;
  chatActivityChange?: number;

  viewerCountBefore?: number;
  viewerCountAfter?: number;
  viewerRetention?: number;

  sentimentBefore?: number;
  sentimentAfter?: number;
  sentimentChange?: number;

  // Computed scores
  engagementScore?: number;  // 0-1
  impactScore?: number;      // 0-1

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Topic cluster with relationships
 */
export interface TopicCluster {
  id: string;
  name: string;
  keywords: string[];
  description?: string;

  // Cluster representation
  centroidEmbedding: number[];

  // Statistics
  questionCount: number;
  avgEngagement?: number;
  avgSuccessRate?: number;

  // Related clusters
  relatedClusters: Array<{
    clusterId: string;
    similarity: number;
    transitionCount: number;
  }>;

  // Metadata
  firstSeen: Date;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Engagement snapshot at a point in time
 */
export interface EngagementSnapshot {
  id: string;
  showId: string;
  timestamp: Date;

  // Chat metrics
  chatMessagesPerMinute: number;
  uniqueChatters: number;
  chatSentiment?: number;  // -1 to 1

  // Viewer metrics
  viewerCount: number;
  viewerCountChange: number;  // % change from baseline
  avgWatchTime?: number;      // seconds

  // Social metrics
  tweetRate?: number;       // tweets per minute
  socialSentiment?: number; // -1 to 1

  // Context
  currentQuestionId?: string;
  currentTopic?: string;

  // Computed
  engagementLevel: EngagementLevel;
  engagementScore: number;  // 0-1

  // Detected interests
  audienceInterests: string[];
  topKeywords: string[];

  createdAt: Date;
}

/**
 * Follow-up question in a chain
 */
export interface QuestionChain {
  id: string;

  // Hierarchy
  rootQuestionId?: string;
  parentQuestionId?: string;
  followUpQuestion: string;

  // Metadata
  depth: number;           // 1 = immediate follow-up, 2+  = deeper
  branchIndex: number;     // which branch if multiple

  // Conditional logic
  condition?: string;      // when this follow-up applies
  reasoning?: string;      // why this makes sense
  expectedOutcome?: string;

  // Quality
  relevanceScore?: number; // 0-1
  noveltyScore?: number;   // 0-1

  // Usage
  wasUsed: boolean;
  usedAt?: Date;

  createdAt: Date;
}

/**
 * Question impact prediction
 */
export interface QuestionImpactPrediction {
  questionId: string;
  questionText: string;

  // Predicted metrics
  predictedUsageProbability: number;     // 0-1, will host use it?
  predictedEngagementScore: number;      // 0-1, audience engagement
  predictedImpactScore: number;          // 0-1, overall impact

  // Contributing factors
  hostFitScore: number;       // 0-1, match with host profile
  topicFitScore: number;      // 0-1, fits current topic flow
  timingScore: number;        // 0-1, good time to ask
  noveltyScore: number;       // 0-1, from Phase 3

  // Confidence
  confidenceLevel: number;    // 0-1, prediction confidence

  // Recommendations
  optimalTiming?: string;     // "now" | "wait-5-min" | "save-for-later"
  suggestedFollowUps: QuestionChain[];
}

/**
 * Host profile manager configuration
 */
export interface HostProfileConfig {
  enabled: boolean;
  minQuestionsForProfile: number;    // minimum questions before building profile
  profileUpdateInterval: number;     // ms between profile updates
  adaptiveWeighting: boolean;        // adjust question scores based on profile
  learningRate: number;              // 0-1, how quickly to adapt to new data
}

/**
 * Default host profile configuration
 */
export const DEFAULT_HOST_PROFILE_CONFIG: HostProfileConfig = {
  enabled: true,
  minQuestionsForProfile: 20,
  profileUpdateInterval: 300000,  // 5 minutes
  adaptiveWeighting: true,
  learningRate: 0.1
};

/**
 * Cross-show learning configuration
 */
export interface CrossShowLearningConfig {
  enabled: boolean;
  minSimilarShows: number;           // minimum similar shows for insights
  similarityThreshold: number;       // 0-1, how similar shows must be
  lookbackDays: number;              // how many days of history to consider
  useSuccessfulOnly: boolean;        // only learn from successful questions
}

/**
 * Default cross-show learning configuration
 */
export const DEFAULT_CROSS_SHOW_LEARNING_CONFIG: CrossShowLearningConfig = {
  enabled: true,
  minSimilarShows: 3,
  similarityThreshold: 0.70,
  lookbackDays: 30,
  useSuccessfulOnly: false
};

/**
 * Topic clustering configuration
 */
export interface TopicClusteringConfig {
  enabled: boolean;
  minQuestionsPerCluster: number;    // minimum questions to form a cluster
  maxClusters: number;               // maximum number of clusters
  clusteringAlgorithm: 'kmeans' | 'dbscan' | 'hierarchical';
  reclusleringInterval: number;      // ms between re-clustering
}

/**
 * Default topic clustering configuration
 */
export const DEFAULT_TOPIC_CLUSTERING_CONFIG: TopicClusteringConfig = {
  enabled: true,
  minQuestionsPerCluster: 5,
  maxClusters: 20,
  clusteringAlgorithm: 'kmeans',
  reclusleringInterval: 3600000  // 1 hour
};

/**
 * Engagement tracking configuration
 */
export interface EngagementTrackingConfig {
  enabled: boolean;
  snapshotInterval: number;          // ms between snapshots
  chatAnalysisEnabled: boolean;
  viewerMetricsEnabled: boolean;
  socialMetricsEnabled: boolean;
  sentimentAnalysisEnabled: boolean;
}

/**
 * Default engagement tracking configuration
 */
export const DEFAULT_ENGAGEMENT_TRACKING_CONFIG: EngagementTrackingConfig = {
  enabled: true,
  snapshotInterval: 60000,  // 1 minute
  chatAnalysisEnabled: true,
  viewerMetricsEnabled: true,
  socialMetricsEnabled: false,
  sentimentAnalysisEnabled: true
};

/**
 * Phase 4 enhanced configuration (combines all Phase 4 features)
 */
export interface Phase4Config {
  hostProfile: HostProfileConfig;
  crossShowLearning: CrossShowLearningConfig;
  topicClustering: TopicClusteringConfig;
  engagementTracking: EngagementTrackingConfig;
}

/**
 * Default Phase 4 configuration
 */
export const DEFAULT_PHASE4_CONFIG: Phase4Config = {
  hostProfile: DEFAULT_HOST_PROFILE_CONFIG,
  crossShowLearning: DEFAULT_CROSS_SHOW_LEARNING_CONFIG,
  topicClustering: DEFAULT_TOPIC_CLUSTERING_CONFIG,
  engagementTracking: DEFAULT_ENGAGEMENT_TRACKING_CONFIG
};
