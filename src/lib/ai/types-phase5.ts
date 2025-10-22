/**
 * Phase 5: Predictive Intelligence - Type Definitions
 *
 * Types for predictive scoring, cross-show learning, multi-host, and show planning
 */

import { GeneratedQuestion } from '../../hooks/useProducerAI';

// ============================================================================
// Predictive Scoring Types
// ============================================================================

export interface PredictedOutcome {
  id: string;
  questionId: string;
  showId: string;

  // Predictions
  predictedEngagement: number;        // 0-1 score
  predictedHostSatisfaction: number;  // 0-1 score
  predictedConversationDepth: number; // Expected # of exchanges
  predictedFollowUps: number;         // Expected # of follow-up questions
  optimalTimingMinute: number;        // Best minute in show to ask

  // Risk Assessment
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];

  // Model Metadata
  confidenceLevel: number;            // 0-1 confidence in prediction
  modelVersion: string;
  predictionBasis: PredictionBasis;

  // Actual Outcomes (filled after question is asked)
  actualEngagement?: number;
  actualHostSatisfaction?: number;
  actualConversationDepth?: number;
  predictionAccuracy?: number;

  createdAt: Date;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

export interface PredictionBasis {
  similarQuestions: SimilarQuestion[];
  averageOutcome: OutcomeMetrics;
  sampleSize: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface SimilarQuestion {
  questionText: string;
  similarity: number;
  engagement: number;
  hostSatisfaction: number;
  conversationDepth: number;
  askedAt: Date;
}

export interface OutcomeMetrics {
  avgEngagement: number;
  avgHostSatisfaction: number;
  avgConversationDepth: number;
  successRate: number;
}

export interface ShowContext {
  showId: string;
  elapsedMinutes: number;
  totalDuration: number;
  currentEngagement: number;
  recentTopics: string[];
  audienceSize: number;
  showStyle: 'educational' | 'entertaining' | 'debate' | 'interview';
}

// ============================================================================
// Cross-Show Learning Types
// ============================================================================

export interface GlobalQuestionPerformance {
  id: string;
  questionEmbedding: number[];
  questionTextHash: string;

  // Aggregated Metrics
  totalTimesAsked: number;
  avgEngagement: number;
  avgHostSatisfaction: number;
  avgConversationDepth: number;
  successRate: number;

  // Context
  mostCommonTopics: string[];
  bestPerformingContexts: PerformanceContext[];

  // Trends
  firstSeen: Date;
  lastSeen: Date;
  trendingScore: number;

  updatedAt: Date;
}

export interface PerformanceContext {
  context: string;
  avgEngagement: number;
  sampleSize: number;
}

export interface PlatformTrend {
  id: string;
  topicName: string;

  // Trend Metrics
  trendScore: number;      // 0-1 how trending
  velocity: number;         // Rate of growth
  totalMentions: number;

  // Performance
  avgEngagement: number;
  peakEngagementTimes: Date[];

  detectedAt: Date;
  updatedAt: Date;
}

export interface HostArchetype {
  id: string;
  archetypeName: string;

  // Characteristics
  typicalPreferences: {
    technicalDepth: number;
    controversyTolerance: number;
    humor: number;
    philosophical: number;
    practical: number;
  };
  preferredTopics: string[];
  averageShowStyle: string;

  // Hosts in this archetype
  memberHostIds: string[];

  // Performance
  avgEngagement: number;
  successfulQuestionPatterns: QuestionPattern[];

  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionPattern {
  pattern: string;
  description: string;
  successRate: number;
  examples: string[];
}

export interface GlobalInsights {
  topPerformingQuestions: GeneratedQuestion[];
  emergingTrends: PlatformTrend[];
  bestPractices: BestPractice[];
  averageEngagement: number;
  peakTimes: TimeWindow[];
}

export interface BestPractice {
  practice: string;
  description: string;
  impact: number;
  evidence: string[];
}

export interface TimeWindow {
  startMinute: number;
  endMinute: number;
  avgEngagement: number;
  sampleSize: number;
}

// ============================================================================
// Multi-Host Types
// ============================================================================

export interface MultiHostShow {
  id: string;
  showId: string;

  // Hosts
  hostIds: string[];
  hostRoles: Record<string, 'lead' | 'co-host' | 'guest'>;

  // Show Dynamics
  interactionStyle: 'debate' | 'interview' | 'panel' | 'conversation';
  participationBalance: number; // 0-1, 1 = perfect balance

  createdAt: Date;
}

export interface QuestionRouting {
  question: GeneratedQuestion;
  primaryHost: string;
  secondaryHosts: string[];
  routingReasoning: string;
  routingConfidence: number;
  expectedDynamics: {
    likelyAgreement: boolean;
    complementaryPerspectives: boolean;
    debatePotential: number;
  };
}

export interface QuestionRoutingHistory {
  id: string;
  questionId: string;
  showId: string;

  // Routing
  routedToHostId: string;
  routingReasoning: string;
  routingConfidence: number;

  // Actual Outcome
  actualResponderHostId?: string;
  routingAccuracy?: number;

  createdAt: Date;
}

export interface HostParticipationMetrics {
  hostId: string;
  questionsReceived: number;
  questionsAnswered: number;
  avgResponseLength: number;
  totalSpeakingTime: number;
  participationShare: number; // 0-1
}

export interface MultiHostQuestion {
  question: string;
  hostRoles: Map<string, 'lead' | 'supporting' | 'contrarian'>;
  expectedInteraction: string;
}

// ============================================================================
// Show Planning Types
// ============================================================================

export interface ShowPlan {
  id: string;
  showId: string;

  // Plan Structure
  segments: ShowSegment[];
  totalDuration: number; // minutes

  // Planning Metadata
  planningStyle: 'energetic' | 'thoughtful' | 'balanced';
  mainTopics: string[];

  // Real-time Adaptation
  originalPlan: ShowSegment[];
  currentPlan: ShowSegment[];
  planChanges: PlanChange[];

  // Performance
  predictedEngagementCurve: EngagementPoint[];
  actualEngagementCurve: EngagementPoint[];
  planEffectiveness?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ShowSegment {
  name: string; // "Opening", "Deep Dive", "Lightning Round"
  duration: number; // minutes
  questions: GeneratedQuestion[];
  targetEngagement: 'warm-up' | 'peak' | 'wind-down';
  pacing: 'fast' | 'medium' | 'slow';
  topics: string[];
}

export interface PlanChange {
  timestamp: Date;
  changeType: 'add_question' | 'remove_question' | 'reorder' | 'change_segment';
  reason: string;
  impact: string;
}

export interface EngagementPoint {
  minute: number;
  engagement: number;
}

export interface ShowPlanningParams {
  showLength: number; // minutes
  hostIds: string[];
  mainTopics: string[];
  desiredPacing: 'energetic' | 'thoughtful' | 'balanced';
  style: 'educational' | 'entertaining' | 'debate';
}

export interface EngagementCurve {
  points: EngagementPoint[];
  predictedPeak: number; // minute
  predictedTrough: number; // minute
  predictedAverage: number;
}

// ============================================================================
// Prediction Dashboard Types
// ============================================================================

export interface QuestionPrediction {
  question: GeneratedQuestion;
  predictedEngagement: number;
  predictedHostSatisfaction?: number; // Add missing property
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors?: any[]; // Add missing property
  optimalTiming: 'now' | 'soon' | 'later';
  optimalTimingMinute?: number; // Add missing property
  reasoning: string;
  confidenceLevel: number;
}

export interface ShowHealth {
  overallScore: number;
  engagementTrend: 'rising' | 'falling' | 'stable';
  pacingScore: number;
  audienceRetention: number;
  engagementCurve?: number; // Alias for engagementTrend
  effectivenessScore?: number; // Additional effectiveness metric
  currentEngagement?: number; // Current engagement level
  riskFactors?: any[]; // Risk factors array
  recommendations?: any[]; // Recommendations array
}

export interface Recommendation {
  suggestedQuestion: GeneratedQuestion;
  reasoning: string;
  type?: string; // Add missing property
  urgency: 'immediate' | 'next' | 'consider';
  expectedImpact: number;
}

export interface PredictionDashboard {
  questionPredictions: QuestionPrediction[];
  showHealth: ShowHealth;
  recommendations: Recommendation[];
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface SuccessFactor {
  factor: string;
  contribution: number; // 0-1 how much this factor contributed
  confidence: number;   // 0-1 confidence in this analysis
  description: string;
}

export interface QuestionAnalysis {
  successFactors: SuccessFactor[];
  underperformingAspects: string[];
  improvementSuggestions: string[];
}

export interface TopicPerformance {
  name: string;
  predictedEngagement: number;
  reasoning: string;
  optimalTimeOfDay?: number;
  optimalDayOfWeek?: number;
}

// ============================================================================
// ML/Training Types
// ============================================================================

export interface TrainingData {
  features: TrainingFeatures;
  labels: TrainingLabels;
}

export interface TrainingFeatures {
  // Question features
  questionEmbedding: number[];
  questionLength: number;
  technicalLevel: number;
  controversyLevel: number;

  // Context features
  showMinute: number;
  showDuration: number;
  currentEngagement: number;
  audienceSize: number;

  // Host features
  hostTechnicalPreference: number;
  hostControversyTolerance: number;
  hostExperienceLevel: number;

  // Topic features
  topicClusterId: string;
  topicPopularity: number;
  topicRecency: number;
}

export interface TrainingLabels {
  engagement: number;
  hostSatisfaction: number;
  conversationDepth: number;
  success: boolean;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number; // mean squared error for regression
  r2Score: number; // R-squared for regression
}

// ============================================================================
// Config Types
// ============================================================================

export interface PredictiveScoringConfig {
  minHistoricalData: number;      // Minimum questions needed for predictions
  similarityThreshold: number;     // How similar questions must be to use as basis
  maxPredictionAge: number;        // Max age in hours for prediction cache
  confidenceThreshold: number;     // Minimum confidence to show prediction
  modelVersion: string;
}

export interface CrossShowLearningConfig {
  optInEnabled: boolean;
  anonymizeData: boolean;
  minShowsForTrends: number;
  minSimilarityForTransfer: number;
  maxArchetypeMembers: number;
}

export interface MultiHostConfig {
  minRoutingConfidence: number;
  balanceThreshold: number;      // Max deviation from perfect balance
  maxHosts: number;
}

export interface ShowPlanningConfig {
  minSegmentDuration: number;    // minutes
  maxSegmentDuration: number;    // minutes
  defaultSegments: string[];
  allowDynamicReplanning: boolean;
}
