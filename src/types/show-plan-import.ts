/**
 * Type definitions for importing show plans from Abe I Stream
 * Phase 6.1: Pre-Show Planning Integration
 */

/**
 * Question item within a segment
 */
export interface QuestionItem {
  id: string;
  text: string;
  estimatedDuration: number; // in minutes
}

/**
 * Individual show segment (maps to "parts" in Abe I Stream)
 */
export interface ShowSegment {
  id: string;
  order: number;
  name: string;
  description: string;
  duration: number; // in minutes
  questions: QuestionItem[];
  expectedEngagement: number; // 0-1 scale
}

/**
 * Engagement curve data for a single segment
 */
export interface SegmentEngagementCurve {
  segmentId: string;
  startMinute: number;
  endMinute: number;
  predictedEngagement: number; // 0-1 scale
  confidenceLevel: number; // 0-1 scale
}

/**
 * Complete engagement curve for the show
 */
export interface EngagementCurve {
  segments: SegmentEngagementCurve[];
  overallPrediction: number; // 0-1 scale
  source: string;
  generatedAt: string; // ISO timestamp
}

/**
 * Metadata about the show plan
 */
export interface ShowPlanMetadata {
  source: 'abe_stream';
  format: string; // Show format (e.g., "Interview", "Panel Discussion")
  title: string;
  hook?: string;
  throughline?: string;
  panelists?: string[];
  createdAt: string; // ISO timestamp
  version: string;
}

/**
 * Main export structure from Abe I Stream
 * This matches the Phase 5 show_plans table schema
 */
export interface AbeStreamExport {
  showId: string;
  segments: ShowSegment[];
  totalDuration: number; // in minutes
  predictedEngagementCurve: EngagementCurve;
  originalPlan: ShowSegment[]; // Initial plan
  currentPlan: ShowSegment[]; // Can be adapted during live show
  metadata: ShowPlanMetadata;
}

/**
 * Import result status
 */
export interface ImportResult {
  success: boolean;
  showId?: string;
  message: string;
  errors?: string[];
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Parsed plan from JSON with validation results
 */
export interface ParsedPlan {
  data: AbeStreamExport | null;
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Saved show plan from database
 */
export interface SavedShowPlan {
  id: string;
  show_id: string;
  host_id: string;
  segments: ShowSegment[];
  total_duration: number;
  predicted_engagement_curve: EngagementCurve;
  original_plan: ShowSegment[];
  current_plan: ShowSegment[];
  metadata: ShowPlanMetadata;
  effectiveness_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Show plan selector option
 */
export interface PlanOption {
  id: string;
  title: string;
  format: string;
  duration: number;
  createdAt: string;
  segmentCount: number;
  questionCount: number;
}
