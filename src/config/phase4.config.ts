/**
 * Phase 4: Intelligent Question Evolution - Configuration
 *
 * Central configuration for all Phase 4 features.
 * Controls feature flags, performance settings, and AI model parameters.
 */

// ============================================================================
// Feature Flags
// ============================================================================

export const PHASE4_FEATURES = {
  // Master toggle for all Phase 4 features
  enabled: process.env.NEXT_PUBLIC_PHASE4_ENABLED === 'true' || true,

  // Individual feature toggles
  hostProfileLearning: process.env.NEXT_PUBLIC_HOST_PROFILE_ENABLED === 'true' || true,
  engagementTracking: process.env.NEXT_PUBLIC_ENGAGEMENT_TRACKING_ENABLED === 'true' || true,
  topicClustering: process.env.NEXT_PUBLIC_TOPIC_CLUSTERING_ENABLED === 'true' || true,
  followUpChains: process.env.NEXT_PUBLIC_FOLLOWUP_CHAINS_ENABLED === 'true' || true,

  // Experimental features (disabled by default)
  predictiveGeneration: process.env.NEXT_PUBLIC_PREDICTIVE_GENERATION === 'true' || false,
  crossShowLearning: process.env.NEXT_PUBLIC_CROSS_SHOW_LEARNING === 'true' || false
} as const;

// ============================================================================
// Host Profile Configuration
// ============================================================================

export const HOST_PROFILE_CONFIG = {
  // Learning parameters
  minInteractionsForConfidence: parseInt(
    process.env.NEXT_PUBLIC_MIN_INTERACTIONS_FOR_CONFIDENCE || '10'
  ),
  confidenceGrowthRate: parseFloat(
    process.env.NEXT_PUBLIC_CONFIDENCE_GROWTH_RATE || '0.01'
  ), // 1% per interaction
  maxConfidenceScore: 1.0,

  // Preference learning
  preferenceUpdateWeight: 0.1, // How much each interaction affects preferences
  preferenceDecayRate: 0.01, // Daily decay to allow preference changes over time
  minSampleSizeForPreference: 5, // Minimum interactions before trusting a preference

  // Interaction tracking
  trackResponseTime: true,
  trackEdits: true,
  trackSkips: true,
  trackFavorites: true,

  // Default preference values (0.5 = neutral)
  defaultPreferences: {
    technicalDepth: 0.5,
    controversyTolerance: 0.5,
    humor: 0.5,
    philosophical: 0.5,
    practical: 0.5
  },

  // Scoring weights for host fit calculation
  scoringWeights: {
    preferenceMatch: 0.4,
    topicMatch: 0.3,
    lengthMatch: 0.15,
    typeMatch: 0.15
  }
} as const;

// ============================================================================
// Engagement Tracking Configuration
// ============================================================================

export const ENGAGEMENT_CONFIG = {
  // Snapshot intervals
  snapshotInterval: parseInt(
    process.env.NEXT_PUBLIC_ENGAGEMENT_SNAPSHOT_INTERVAL || '60000'
  ), // 60 seconds
  minSnapshotInterval: 30000, // 30 seconds minimum
  maxSnapshotInterval: 300000, // 5 minutes maximum

  // Memory windows
  chatMemoryWindow: 5 * 60 * 1000, // 5 minutes
  viewerMemoryWindow: 10 * 60 * 1000, // 10 minutes

  // Engagement level thresholds
  thresholds: {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    viral: 0.85
  },

  // Baseline calculation
  baselineWindow: 10, // Use last 10 snapshots for baseline
  baselineUpdateInterval: 5 * 60 * 1000, // Update baseline every 5 minutes

  // Sentiment analysis
  sentimentKeywords: {
    positive: [
      'amazing', 'great', 'love', 'awesome', 'excellent', 'brilliant',
      'fantastic', 'perfect', 'wow', 'incredible', 'best', 'fire',
      '🔥', '❤️', '😍', '🎉', '👏', '💯', '✨'
    ],
    negative: [
      'boring', 'bad', 'terrible', 'worst', 'awful', 'hate',
      'stupid', 'lame', 'meh', 'disappointing',
      '👎', '😴', '🙄', '💩'
    ],
    neutral: [
      'okay', 'fine', 'alright', 'hmm', 'interesting'
    ]
  },

  // Scoring formula weights
  scoringWeights: {
    chatActivity: 0.5,
    viewerChange: 0.3,
    sentiment: 0.2
  }
} as const;

// ============================================================================
// Topic Clustering Configuration
// ============================================================================

export const CLUSTERING_CONFIG = {
  // Algorithm selection
  algorithm: (process.env.NEXT_PUBLIC_CLUSTERING_ALGORITHM || 'kmeans') as
    | 'kmeans'
    | 'dbscan'
    | 'hierarchical',

  // General clustering parameters
  minQuestionsForClustering: parseInt(
    process.env.NEXT_PUBLIC_MIN_QUESTIONS_FOR_CLUSTERING || '10'
  ),
  maxClusters: parseInt(process.env.NEXT_PUBLIC_MAX_CLUSTERS || '20'),
  minQuestionsPerCluster: parseInt(
    process.env.NEXT_PUBLIC_MIN_QUESTIONS_PER_CLUSTER || '3'
  ),

  // K-means specific
  kmeans: {
    maxIterations: 50,
    convergenceThreshold: 0.001
  },

  // DBSCAN specific
  dbscan: {
    epsilon: 0.3, // Maximum distance between points
    minPoints: 3 // Minimum points to form a cluster
  },

  // Hierarchical specific
  hierarchical: {
    linkage: 'average' as 'single' | 'complete' | 'average',
    distanceThreshold: 0.5
  },

  // Cluster naming
  maxKeywords: 5,
  minKeywordFrequency: 2,

  // Related cluster discovery
  relatedClusterThreshold: 0.6, // Similarity threshold for related clusters
  maxRelatedClusters: 5,

  // Cluster update frequency
  reclusterInterval: 24 * 60 * 60 * 1000, // 24 hours
  incrementalUpdateThreshold: 10 // New questions before incremental update
} as const;

// ============================================================================
// Follow-up Chain Configuration
// ============================================================================

export const FOLLOWUP_CONFIG = {
  // Chain generation parameters
  defaultOptions: {
    maxDepth: parseInt(process.env.NEXT_PUBLIC_FOLLOWUP_MAX_DEPTH || '2'),
    branchesPerLevel: parseInt(process.env.NEXT_PUBLIC_FOLLOWUP_BRANCHES || '2'),
    minRelevanceScore: parseFloat(
      process.env.NEXT_PUBLIC_FOLLOWUP_MIN_RELEVANCE || '0.7'
    ),
    includeConditionals: true
  },

  // Branch reduction at depth
  branchReductionFactor: 0.5, // Reduce branches by 50% per level

  // AI model for generation
  aiModel: 'gpt-4o-mini', // Cost-effective model
  temperature: 0.8, // Creativity level
  maxTokens: 800,

  // Scoring
  relevanceWeight: 0.6,
  noveltyWeight: 0.4,

  // Usage tracking
  trackUsage: true,
  autoGenerateOnAsk: true, // Auto-generate chains when question is asked

  // Fallback templates (when API fails)
  fallbackTemplates: [
    {
      question: 'Can you elaborate on that point?',
      reasoning: 'Seeks deeper explanation',
      expectedOutcome: 'More detailed response'
    },
    {
      question: 'What are the implications of what you just said?',
      reasoning: 'Explores consequences',
      expectedOutcome: 'Discussion of broader impact'
    },
    {
      question: 'How does this connect to what we discussed earlier?',
      reasoning: 'Links to previous context',
      expectedOutcome: 'Synthesis of ideas'
    },
    {
      question: 'What would be a counterargument to that?',
      reasoning: 'Introduces opposing view',
      expectedOutcome: 'Balanced discussion'
    },
    {
      question: 'Can you give a concrete example?',
      reasoning: 'Grounds abstract in specific',
      expectedOutcome: 'Real-world illustration'
    }
  ]
} as const;

// ============================================================================
// Voting Engine Configuration (Phase 4 Update)
// ============================================================================

export const VOTING_CONFIG_PHASE4 = {
  // Similarity threshold for deduplication
  similarityThreshold: parseFloat(
    process.env.NEXT_PUBLIC_SIMILARITY_THRESHOLD || '0.85'
  ),

  // Minimum vote score to include
  minVoteScore: parseFloat(process.env.NEXT_PUBLIC_MIN_VOTE_SCORE || '0.5'),

  // Scoring weights (Phase 4)
  scoringWeights: {
    // When host profile is enabled
    withHostProfile: {
      quality: 0.5,
      diversity: 0.15,
      novelty: 0.15,
      hostFit: 0.2
    },
    // Fallback when host profile is disabled
    withoutHostProfile: {
      quality: 0.6,
      diversity: 0.2,
      novelty: 0.2,
      hostFit: 0.0
    }
  },

  // Top N questions to return
  topN: 5,

  // Performance optimization
  batchEmbeddings: true,
  maxBatchSize: 100
} as const;

// ============================================================================
// Performance & Cost Configuration
// ============================================================================

export const PERFORMANCE_CONFIG = {
  // Caching
  enableCaching: true,
  cacheInvalidationTime: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 1000, // Max cached items

  // Rate limiting
  rateLimits: {
    embeddings: {
      maxPerMinute: 100,
      maxPerHour: 5000
    },
    openaiApi: {
      maxPerMinute: 60,
      maxPerHour: 3000
    },
    supabaseQueries: {
      maxPerMinute: 200,
      maxPerHour: 10000
    }
  },

  // Cost monitoring
  costLimits: {
    dailyBudget: 10.0, // $10 per day
    monthlyBudget: 200.0, // $200 per month
    alertThreshold: 0.8 // Alert at 80% of budget
  },

  // Batch processing
  batchSizes: {
    embeddings: 50,
    clustering: 100,
    followUpGeneration: 10
  }
} as const;

// ============================================================================
// Database Configuration
// ============================================================================

export const DATABASE_CONFIG = {
  // Connection
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY!,

  // Table names
  tables: {
    hostProfiles: 'host_profiles',
    hostInteractions: 'host_interactions',
    engagementSnapshots: 'engagement_snapshots',
    topicClusters: 'topic_clusters',
    clusterAssignments: 'question_cluster_assignments',
    clusterTransitions: 'cluster_transitions',
    questionChains: 'question_chains'
  },

  // Query optimization
  useIndexes: true,
  maxQueryResults: 1000,
  defaultPageSize: 50
} as const;

// ============================================================================
// Logging & Debugging
// ============================================================================

export const LOGGING_CONFIG = {
  // Log levels
  level: (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',

  // Feature-specific logging
  features: {
    hostProfile: process.env.NEXT_PUBLIC_LOG_HOST_PROFILE === 'true' || false,
    engagement: process.env.NEXT_PUBLIC_LOG_ENGAGEMENT === 'true' || false,
    clustering: process.env.NEXT_PUBLIC_LOG_CLUSTERING === 'true' || false,
    followUps: process.env.NEXT_PUBLIC_LOG_FOLLOWUPS === 'true' || false,
    voting: process.env.NEXT_PUBLIC_LOG_VOTING === 'true' || true
  },

  // Performance logging
  logPerformanceMetrics: true,
  logApiCosts: true,
  logCacheHitRate: true
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validatePhase4Config(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  if (!DATABASE_CONFIG.supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!DATABASE_CONFIG.supabaseKey) {
    errors.push('SUPABASE_SERVICE_KEY is required');
  }
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required for embeddings and follow-ups');
  }

  // Check configuration values
  if (ENGAGEMENT_CONFIG.snapshotInterval < ENGAGEMENT_CONFIG.minSnapshotInterval) {
    errors.push(
      `Snapshot interval (${ENGAGEMENT_CONFIG.snapshotInterval}) is below minimum (${ENGAGEMENT_CONFIG.minSnapshotInterval})`
    );
  }

  if (CLUSTERING_CONFIG.minQuestionsPerCluster < 2) {
    warnings.push('minQuestionsPerCluster should be at least 2 for meaningful clusters');
  }

  if (FOLLOWUP_CONFIG.defaultOptions.maxDepth > 3) {
    warnings.push('maxDepth > 3 may generate too many follow-ups and increase costs');
  }

  // Check scoring weights sum to 1.0
  const withHostWeights = Object.values(VOTING_CONFIG_PHASE4.scoringWeights.withHostProfile);
  const weightSum = withHostWeights.reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    errors.push(
      `Voting scoring weights must sum to 1.0 (current: ${weightSum.toFixed(2)})`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getActiveFeatures(): string[] {
  const active: string[] = [];

  if (PHASE4_FEATURES.hostProfileLearning) active.push('Host Profile Learning');
  if (PHASE4_FEATURES.engagementTracking) active.push('Engagement Tracking');
  if (PHASE4_FEATURES.topicClustering) active.push('Topic Clustering');
  if (PHASE4_FEATURES.followUpChains) active.push('Follow-up Chains');
  if (PHASE4_FEATURES.predictiveGeneration) active.push('Predictive Generation');
  if (PHASE4_FEATURES.crossShowLearning) active.push('Cross-Show Learning');

  return active;
}

export function getConfigSummary(): string {
  const validation = validatePhase4Config();
  const activeFeatures = getActiveFeatures();

  return `
Phase 4 Configuration Summary
==============================
Status: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}
Active Features: ${activeFeatures.length > 0 ? activeFeatures.join(', ') : 'None'}

Host Profile:
  - Min interactions for confidence: ${HOST_PROFILE_CONFIG.minInteractionsForConfidence}
  - Preference update weight: ${HOST_PROFILE_CONFIG.preferenceUpdateWeight}

Engagement:
  - Snapshot interval: ${ENGAGEMENT_CONFIG.snapshotInterval}ms
  - Chat memory window: ${ENGAGEMENT_CONFIG.chatMemoryWindow}ms

Clustering:
  - Algorithm: ${CLUSTERING_CONFIG.algorithm}
  - Max clusters: ${CLUSTERING_CONFIG.maxClusters}
  - Min per cluster: ${CLUSTERING_CONFIG.minQuestionsPerCluster}

Follow-ups:
  - Max depth: ${FOLLOWUP_CONFIG.defaultOptions.maxDepth}
  - Branches per level: ${FOLLOWUP_CONFIG.defaultOptions.branchesPerLevel}
  - AI model: ${FOLLOWUP_CONFIG.aiModel}

Voting:
  - Quality weight: ${VOTING_CONFIG_PHASE4.scoringWeights.withHostProfile.quality}
  - Diversity weight: ${VOTING_CONFIG_PHASE4.scoringWeights.withHostProfile.diversity}
  - Novelty weight: ${VOTING_CONFIG_PHASE4.scoringWeights.withHostProfile.novelty}
  - Host fit weight: ${VOTING_CONFIG_PHASE4.scoringWeights.withHostProfile.hostFit}

${validation.errors.length > 0 ? `\nErrors:\n${validation.errors.map(e => `  ❌ ${e}`).join('\n')}` : ''}
${validation.warnings.length > 0 ? `\nWarnings:\n${validation.warnings.map(w => `  ⚠️  ${w}`).join('\n')}` : ''}
  `.trim();
}

// Auto-validate on import in development
if (process.env.NODE_ENV === 'development') {
  const validation = validatePhase4Config();
  if (!validation.isValid) {
    console.error('❌ Phase 4 Configuration Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Phase 4 Configuration Warnings:', validation.warnings);
  }
  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ Phase 4 configuration is valid');
    console.log(`   Active features: ${getActiveFeatures().join(', ')}`);
  }
}
