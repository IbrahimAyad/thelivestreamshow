// =====================================================
// AUTOMATION ENGINE - Core orchestrator for auto-director system
// =====================================================

import { supabase } from '../supabase'
import { ActionExecutor } from './ActionExecutor'
import { TriggerDetector } from './TriggerDetector'
import { PriorityQueue } from './PriorityQueue'
import type {
  AutomationConfig,
  AutomationDecision,
  AutomationEvent,
  TriggerRule,
  ActionType,
  TriggerType,
  ExecutionMode
} from './types'

export class AutomationEngine {
  private actionExecutor: ActionExecutor
  private triggerDetector: TriggerDetector
  private priorityQueue: PriorityQueue
  private config: AutomationConfig | null = null
  private isRunning: boolean = false
  private showStartTime: Date | null = null
  private eventListener: any = null // Will be set externally

  constructor() {
    this.actionExecutor = new ActionExecutor()
    this.triggerDetector = new TriggerDetector()
    this.priorityQueue = new PriorityQueue()
  }

  /**
   * Set event listener for event-based triggers
   */
  setEventListener(listener: any) {
    this.eventListener = listener
  }

  /**
   * Initialize the automation engine
   */
  async initialize(): Promise<void> {
    await this.loadConfig()
    this.isRunning = true
    console.log('[AutomationEngine] Initialized')
  }

  /**
   * Load automation config from database
   */
  private async loadConfig(): Promise<void> {
    const { data, error } = await supabase
      .from('automation_config')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (error) {
      console.error('[AutomationEngine] Error loading config:', error)
      return
    }

    this.config = data
  }

  /**
   * Set OBS controller for OBS-related actions
   */
  setObsController(controller: any) {
    this.actionExecutor.setObsController(controller)
  }

  /**
   * Mark show as started (for relative timers)
   */
  startShow() {
    this.showStartTime = new Date()
    console.log('[AutomationEngine] Show started at', this.showStartTime)
  }

  /**
   * Process a manual trigger (operator-initiated)
   */
  async manualTrigger(
    actionType: ActionType,
    actionData: Record<string, any>,
    context?: Record<string, any>
  ): Promise<string> {
    const decision: AutomationDecision = {
      trigger: {
        type: 'manual',
        data: context || {},
        confidence: 1.0,
        source: 'operator'
      },
      action: {
        type: actionType,
        data: actionData,
        priority: 0 // Manual triggers are highest priority
      },
      execution: {
        mode: 'manual',
        requiresApproval: false,
        timestamp: new Date()
      },
      context: context || {}
    }

    return await this.processDecision(decision)
  }

  /**
   * Process a keyword from transcript
   */
  async processKeyword(transcript: string, rules: TriggerRule[]): Promise<void> {
    if (!this.shouldProcessTriggers()) return

    for (const rule of rules) {
      if (rule.trigger_type !== 'keyword') continue
      if (!this.triggerDetector.isRuleActive(rule)) continue

      const decision = this.triggerDetector.detectKeywordTrigger(transcript, rule)
      if (decision) {
        await this.processDecision(decision)
      }
    }
  }

  /**
   * Process a database event (insert, update, delete)
   */
  async processEvent(
    eventSource: string,
    eventType: 'insert' | 'update' | 'delete',
    eventData: Record<string, any>,
    rules: TriggerRule[]
  ): Promise<void> {
    if (!this.shouldProcessTriggers()) return

    for (const rule of rules) {
      if (rule.trigger_type !== 'event') continue
      if (!this.triggerDetector.isRuleActive(rule)) continue

      const decision = this.triggerDetector.detectEventTrigger(eventSource, eventType, eventData, rule)
      if (decision) {
        await this.processDecision(decision)
      }
    }
  }

  /**
   * Process transcript for keyword triggers
   */
  async processTranscript(
    transcript: string,
    metadata: { confidence: number; timestamp: Date }
  ): Promise<void> {
    if (!this.shouldProcessTriggers()) return

    // Get all keyword rules from database
    const { data: rules } = await supabase
      .from('trigger_rules')
      .select('*')
      .eq('enabled', true)
      .eq('trigger_type', 'keyword')

    if (!rules || rules.length === 0) return

    for (const rule of rules as TriggerRule[]) {
      if (!this.triggerDetector.isRuleActive(rule)) continue

      const decision = this.triggerDetector.detectKeywordTrigger(transcript, rule, metadata.confidence)
      if (decision) {
        await this.processDecision(decision)
      }
    }
  }

  /**
   * Process conversation context (AI-detected)
   */
  async processContext(
    context: { sentiment?: string; topic?: string; engagement?: string },
    rules: TriggerRule[]
  ): Promise<void> {
    if (!this.shouldProcessTriggers()) return

    for (const rule of rules) {
      if (rule.trigger_type !== 'context') continue
      if (!this.triggerDetector.isRuleActive(rule)) continue

      const decision = this.triggerDetector.detectContextTrigger(context, rule)
      if (decision) {
        await this.processDecision(decision)
      }
    }
  }

  /**
   * Check if we should process triggers (respects emergency stop, enabled state, etc.)
   */
  private shouldProcessTriggers(): boolean {
    if (!this.isRunning) return false
    if (!this.config) return false
    if (!this.config.automation_enabled) return false
    if (this.config.emergency_stop) return false
    return true
  }

  /**
   * Process an automation decision (queue, check safety, execute or suggest)
   */
  private async processDecision(decision: AutomationDecision): Promise<string> {
    // Check if action type is allowed
    if (!this.isActionAllowed(decision.action.type)) {
      console.log('[AutomationEngine] Action not allowed:', decision.action.type)
      return ''
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      console.log('[AutomationEngine] Rate limit exceeded')
      await this.logEvent(decision, 'skipped', 'Rate limit exceeded')
      return ''
    }

    // Check cooldown
    if (this.priorityQueue.isOnCooldown(decision.action.type, this.config?.cooldown_seconds || 5)) {
      const remaining = this.priorityQueue.getCooldownRemaining(decision.action.type, this.config?.cooldown_seconds || 5)
      console.log(`[AutomationEngine] Action on cooldown: ${decision.action.type} (${remaining}s remaining)`)
      await this.logEvent(decision, 'skipped', `Cooldown: ${remaining}s remaining`)
      return ''
    }

    // Determine execution mode based on confidence and config
    const executionMode = this.determineExecutionMode(decision)
    decision.execution.mode = executionMode

    // Add to queue
    const queueId = this.priorityQueue.enqueue(decision)

    // If auto-execute mode, execute immediately
    if (executionMode === 'auto' && this.config?.auto_execute_enabled) {
      await this.executeNextInQueue()
    } else if (executionMode === 'suggested') {
      // Create suggestion for operator
      await this.createSuggestion(decision)
    }

    return queueId
  }

  /**
   * Determine execution mode based on confidence and config
   */
  private determineExecutionMode(decision: AutomationDecision): ExecutionMode {
    // Manual triggers always execute
    if (decision.trigger.type === 'manual') return 'manual'

    // If approval required, always suggest
    if (decision.execution.requiresApproval) return 'suggested'

    // Check if action requires confirmation
    if (this.config?.require_confirmation_for.includes(decision.action.type)) {
      return 'suggested'
    }

    // If auto-execute is disabled, everything is a suggestion
    if (!this.config?.auto_execute_enabled) return 'suggested'

    // Check confidence thresholds
    const confidence = decision.trigger.confidence || 0

    if (confidence >= (this.config?.confidence_auto_execute || 0.85)) {
      return 'auto'
    } else if (confidence >= (this.config?.confidence_suggest || 0.60)) {
      return 'suggested'
    } else {
      // Below suggestion threshold - just log
      return 'suggested'
    }
  }

  /**
   * Execute the next decision in the priority queue
   */
  async executeNextInQueue(): Promise<void> {
    const queuedDecision = this.priorityQueue.dequeue()
    if (!queuedDecision) return

    const { decision } = queuedDecision
    const startTime = Date.now()

    try {
      const result = await this.actionExecutor.execute(
        decision.action.type,
        decision.action.data
      )

      // Record execution for cooldown tracking
      this.priorityQueue.recordExecution(decision.action.type)

      // Log successful execution
      await this.logEvent(
        decision,
        'executed',
        undefined,
        Date.now() - startTime
      )

      console.log('[AutomationEngine] Executed:', decision.action.type, result)
    } catch (error) {
      // Log failed execution
      await this.logEvent(
        decision,
        'failed',
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime
      )

      console.error('[AutomationEngine] Execution failed:', error)
    }
  }

  /**
   * Create a suggestion for the operator to approve/reject
   */
  private async createSuggestion(decision: AutomationDecision): Promise<void> {
    // Log as pending suggestion
    await this.logEvent(decision, 'pending')

    // In a real implementation, this would emit an event that the UI listens to
    // For now, just log it
    console.log('[AutomationEngine] Suggestion created:', decision.action.type)
  }

  /**
   * Approve a pending suggestion
   */
  async approveSuggestion(eventId: string): Promise<void> {
    const { data: event } = await supabase
      .from('automation_events')
      .select('*')
      .eq('id', eventId)
      .eq('outcome', 'pending')
      .single()

    if (!event) {
      console.error('[AutomationEngine] Suggestion not found or already processed:', eventId)
      return
    }

    // Execute the action
    const startTime = Date.now()
    try {
      await this.actionExecutor.execute(event.action_type, event.action_data)

      // Update event as executed
      await supabase
        .from('automation_events')
        .update({
          outcome: 'executed',
          operator_action: 'approved',
          execution_time_ms: Date.now() - startTime
        })
        .eq('id', eventId)

      console.log('[AutomationEngine] Suggestion approved and executed:', eventId)
    } catch (error) {
      await supabase
        .from('automation_events')
        .update({
          outcome: 'failed',
          operator_action: 'approved',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          execution_time_ms: Date.now() - startTime
        })
        .eq('id', eventId)

      console.error('[AutomationEngine] Approved suggestion failed:', error)
    }
  }

  /**
   * Reject a pending suggestion
   */
  async rejectSuggestion(eventId: string): Promise<void> {
    await supabase
      .from('automation_events')
      .update({
        outcome: 'skipped',
        operator_action: 'rejected'
      })
      .eq('id', eventId)

    console.log('[AutomationEngine] Suggestion rejected:', eventId)
  }

  /**
   * Check if action type is allowed
   */
  private isActionAllowed(actionType: ActionType): boolean {
    if (!this.config) return false
    return this.config.allowed_action_types.includes(actionType)
  }

  /**
   * Check rate limit (max actions per minute)
   */
  private checkRateLimit(): boolean {
    if (!this.config) return false

    const recentCount = this.priorityQueue.getRecentExecutionCount(60)
    return recentCount < this.config.max_actions_per_minute
  }

  /**
   * Log an automation event to database
   */
  private async logEvent(
    decision: AutomationDecision,
    outcome: 'executed' | 'skipped' | 'overridden' | 'failed' | 'pending',
    errorMessage?: string,
    executionTimeMs?: number
  ): Promise<void> {
    const event: Partial<AutomationEvent> = {
      trigger_type: decision.trigger.type,
      trigger_data: decision.trigger.data,
      confidence: decision.trigger.confidence,
      action_type: decision.action.type,
      action_data: decision.action.data,
      execution_mode: decision.execution.mode,
      outcome,
      error_message: errorMessage,
      execution_time_ms: executionTimeMs,
      show_segment: decision.context.showSegment,
      metadata: {
        priority: decision.action.priority,
        source: decision.trigger.source
      }
    }

    await supabase.from('automation_events').insert([event])
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<AutomationConfig>): Promise<void> {
    await supabase
      .from('automation_config')
      .update(updates)
      .eq('id', '00000000-0000-0000-0000-000000000001')

    await this.loadConfig()
  }

  /**
   * Emergency stop - pause all automation
   */
  async emergencyStop(): Promise<void> {
    await this.updateConfig({ emergency_stop: true })
    this.priorityQueue.clear()
    console.log('[AutomationEngine] EMERGENCY STOP activated')
  }

  /**
   * Resume from emergency stop
   */
  async resume(): Promise<void> {
    await this.updateConfig({ emergency_stop: false })
    console.log('[AutomationEngine] Resumed from emergency stop')
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      queueSize: this.priorityQueue.size(),
      queueStats: this.priorityQueue.getStats()
    }
  }
}
