// =====================================================
// AUTO-DIRECTOR SYSTEM - TYPE DEFINITIONS
// =====================================================

export type TriggerType = 'manual' | 'timer' | 'keyword' | 'ai' | 'event' | 'context'
export type ExecutionMode = 'auto' | 'suggested' | 'manual' | 'scheduled'
export type Outcome = 'executed' | 'skipped' | 'overridden' | 'failed' | 'pending'
export type OperatorAction = 'approved' | 'rejected' | 'modified' | null

export type ActionType =
  | 'betabot.mood'
  | 'betabot.movement'
  | 'betabot.speaking'
  | 'obs.scene'
  | 'obs.source.show'
  | 'obs.source.hide'
  | 'obs.transition'
  | 'graphic.show'
  | 'graphic.hide'
  | 'question.indicate'
  | 'soundboard.play'
  | 'segment.switch'
  | 'lower_third.show'
  | 'lower_third.hide'

export type Priority = 0 | 1 | 2 | 3 | 4 | 5
// 0 = Emergency/Manual Override
// 1 = Critical (technical issues, safety)
// 2 = High (scheduled events, rundown)
// 3 = Normal (AI suggestions, smart triggers)
// 4 = Low (background enhancements)
// 5 = Background (logging, analytics)

// =====================================================
// DATABASE SCHEMA TYPES
// =====================================================

export interface AutomationEvent {
  id: string
  created_at: string

  // Trigger
  trigger_type: TriggerType
  trigger_data: Record<string, any>
  confidence?: number

  // Action
  action_type: ActionType
  action_data: Record<string, any>

  // Execution
  execution_mode: ExecutionMode
  outcome?: Outcome
  operator_action?: OperatorAction

  // Context
  show_segment?: string
  show_timestamp?: string
  execution_time_ms?: number
  error_message?: string

  metadata?: Record<string, any>
}

export interface AutomationConfig {
  id: string
  updated_at: string

  // Control
  automation_enabled: boolean
  auto_execute_enabled: boolean
  emergency_stop: boolean

  // Thresholds
  confidence_auto_execute: number
  confidence_suggest: number
  confidence_log_only: number

  // Safety
  max_actions_per_minute: number
  cooldown_seconds: number
  debounce_seconds: number

  // Permissions
  allowed_action_types: ActionType[]

  // OBS
  obs_enabled: boolean
  obs_websocket_url: string
  obs_password?: string

  // AI
  ai_provider: string
  ai_model: string
  ai_context_window: number

  // Operator
  show_suggestions_ui: boolean
  require_confirmation_for: ActionType[]

  metadata?: Record<string, any>
}

export interface TriggerRule {
  id: string
  created_at: string
  updated_at: string

  // Identity
  rule_name: string
  description?: string
  enabled: boolean
  priority: Priority

  // Trigger
  trigger_type: TriggerType
  trigger_conditions: Record<string, any>

  // Action
  action_type: ActionType
  action_params: Record<string, any>

  // Advanced
  require_operator_approval: boolean
  max_executions_per_show?: number
  current_execution_count: number

  // Scheduling
  active_days: number[]
  active_time_start?: string
  active_time_end?: string

  created_by?: string
  metadata?: Record<string, any>
}

// =====================================================
// AUTOMATION ENGINE TYPES
// =====================================================

export interface AutomationDecision {
  // What triggered this decision
  trigger: {
    type: TriggerType
    data: Record<string, any>
    confidence?: number
    source?: string
  }

  // What action to take
  action: {
    type: ActionType
    data: Record<string, any>
    priority: Priority
  }

  // How to execute
  execution: {
    mode: ExecutionMode
    requiresApproval: boolean
    timestamp: Date
  }

  // Context
  context: {
    showSegment?: string
    showTimestamp?: number
    conversationState?: string
  }
}

export interface ActionResult {
  success: boolean
  actionType: ActionType
  executionTimeMs: number
  error?: string
  metadata?: Record<string, any>
}

// =====================================================
// TRIGGER DETECTOR TYPES
// =====================================================

export interface KeywordTriggerCondition {
  keywords: string[]
  match_type: 'any' | 'all' | 'exact'
  case_sensitive?: boolean
}

export interface EventTriggerCondition {
  event_source: string // Table name or event source
  event_type: 'insert' | 'update' | 'delete' | '*'
  filters?: Record<string, any>
}

export interface ContextTriggerCondition {
  sentiment?: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  topic?: string
  engagement?: 'very_high' | 'high' | 'medium' | 'low'
  confidence_min?: number
}

export interface TimerTriggerCondition {
  type: 'absolute' | 'relative' | 'recurring'
  offset_seconds?: number
  reference?: 'show_start' | 'segment_start' | 'now'
  cron?: string // For recurring timers
}

// =====================================================
// ACTION EXECUTOR TYPES
// =====================================================

export interface BetaBotMoodAction {
  mood: 'calm' | 'excited' | 'thoughtful' | 'playful' | 'serious'
  intensity?: number // 1-10
}

export interface BetaBotMovementAction {
  movement: 'idle' | 'nodding' | 'gesturing' | 'leaning'
}

export interface ObsSceneAction {
  sceneName: string
  transition?: string
  transitionDuration?: number
}

export interface ObsSourceAction {
  sourceName: string
  sceneName?: string
  visible: boolean
}

export interface GraphicAction {
  graphic_type: string
  graphic_id?: string
  duration?: number
}

export interface QuestionIndicatorAction {
  show: boolean
  question_id?: string
}

export interface SoundboardAction {
  effect_name: string
}

export interface SegmentAction {
  segment_id: string
}

export interface LowerThirdAction {
  lower_third_id: string
  duration?: number
}

// =====================================================
// PRIORITY QUEUE TYPES
// =====================================================

export interface QueuedDecision {
  decision: AutomationDecision
  queuedAt: Date
  priority: Priority
  id: string
}

// =====================================================
// OBS CONTROLLER TYPES
// =====================================================

export interface ObsConnectionStatus {
  connected: boolean
  version?: string
  error?: string
}

export interface ObsScene {
  sceneName: string
  sceneIndex: number
}

export interface ObsSource {
  sourceName: string
  sourceType: string
  sourceKind: string
}

// =====================================================
// HOOKS TYPES
// =====================================================

export interface UseAutomationEngineReturn {
  isEnabled: boolean
  isAutoExecuteEnabled: boolean
  emergencyStop: boolean
  recentEvents: AutomationEvent[]
  pendingDecisions: QueuedDecision[]
  config: AutomationConfig | null
  obsController: any | null // ObsController instance for UI components
  transcriptListener: any | null // TranscriptListener instance for UI components
  aiAnalyzer: any | null // AIContextAnalyzer instance for UI components
  aiCoordinator: any | null // AICoordinator instance for UI components
  updateConfig: (updates: Partial<AutomationConfig>) => Promise<void>
  toggleAutomation: () => Promise<void>
  toggleAutoExecute: () => Promise<void>
  triggerEmergencyStop: () => Promise<void>
  manualTrigger: (actionType: ActionType, actionData: Record<string, any>) => Promise<void>
  approveSuggestion: (eventId: string) => Promise<void>
  rejectSuggestion: (eventId: string) => Promise<void>
}

export interface UseObsControllerReturn {
  isConnected: boolean
  connectionStatus: ObsConnectionStatus
  currentScene?: string
  availableScenes: ObsScene[]
  connect: () => Promise<void>
  disconnect: () => void
  switchScene: (sceneName: string, transition?: string) => Promise<void>
  toggleSource: (sourceName: string, visible: boolean) => Promise<void>
  getScenes: () => Promise<ObsScene[]>
}
