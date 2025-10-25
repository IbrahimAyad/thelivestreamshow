// =====================================================
// TRIGGER DETECTOR - Analyzes events and detects triggers
// =====================================================

import type {
  TriggerRule,
  AutomationDecision,
  KeywordTriggerCondition,
  EventTriggerCondition,
  ContextTriggerCondition,
  TimerTriggerCondition
} from './types'

export class TriggerDetector {
  /**
   * Check if a transcript contains trigger keywords
   */
  detectKeywordTrigger(
    transcript: string,
    rule: TriggerRule
  ): AutomationDecision | null {
    const conditions = rule.trigger_conditions as KeywordTriggerCondition
    const { keywords, match_type, case_sensitive = false } = conditions

    const searchText = case_sensitive ? transcript : transcript.toLowerCase()
    const searchKeywords = case_sensitive ? keywords : keywords.map(k => k.toLowerCase())

    let matched = false

    if (match_type === 'any') {
      // Match if ANY keyword is found
      matched = searchKeywords.some(keyword => searchText.includes(keyword))
    } else if (match_type === 'all') {
      // Match if ALL keywords are found
      matched = searchKeywords.every(keyword => searchText.includes(keyword))
    } else if (match_type === 'exact') {
      // Exact phrase match
      matched = searchKeywords.some(keyword => searchText === keyword)
    }

    if (!matched) return null

    return {
      trigger: {
        type: 'keyword',
        data: {
          transcript,
          matched_keywords: searchKeywords.filter(k => searchText.includes(k))
        },
        confidence: 1.0, // Keyword matches are 100% confident
        source: 'transcript'
      },
      action: {
        type: rule.action_type,
        data: rule.action_params,
        priority: rule.priority
      },
      execution: {
        mode: rule.require_operator_approval ? 'suggested' : 'auto',
        requiresApproval: rule.require_operator_approval,
        timestamp: new Date()
      },
      context: {}
    }
  }

  /**
   * Check if a database event matches trigger conditions
   */
  detectEventTrigger(
    eventSource: string,
    eventType: 'insert' | 'update' | 'delete',
    eventData: Record<string, any>,
    rule: TriggerRule
  ): AutomationDecision | null {
    const conditions = rule.trigger_conditions as EventTriggerCondition

    // Check if event source matches
    if (conditions.event_source !== eventSource) return null

    // Check if event type matches
    if (conditions.event_type !== '*' && conditions.event_type !== eventType) return null

    // Check if filters match (if any)
    if (conditions.filters) {
      for (const [key, value] of Object.entries(conditions.filters)) {
        if (eventData[key] !== value) return null
      }
    }

    return {
      trigger: {
        type: 'event',
        data: {
          event_source: eventSource,
          event_type: eventType,
          event_data: eventData
        },
        confidence: 1.0, // Event matches are 100% confident
        source: eventSource
      },
      action: {
        type: rule.action_type,
        data: rule.action_params,
        priority: rule.priority
      },
      execution: {
        mode: rule.require_operator_approval ? 'suggested' : 'auto',
        requiresApproval: rule.require_operator_approval,
        timestamp: new Date()
      },
      context: {}
    }
  }

  /**
   * Check if conversation context matches trigger conditions
   * This is a simplified version - real implementation would use NLP/AI
   */
  detectContextTrigger(
    conversationContext: {
      sentiment?: string
      topic?: string
      engagement?: string
    },
    rule: TriggerRule
  ): AutomationDecision | null {
    const conditions = rule.trigger_conditions as ContextTriggerCondition

    // Check sentiment
    if (conditions.sentiment && conversationContext.sentiment !== conditions.sentiment) {
      return null
    }

    // Check topic
    if (conditions.topic && conversationContext.topic !== conditions.topic) {
      return null
    }

    // Check engagement
    if (conditions.engagement && conversationContext.engagement !== conditions.engagement) {
      return null
    }

    // Calculate confidence based on how well context matches
    const confidence = conditions.confidence_min || 0.7

    return {
      trigger: {
        type: 'context',
        data: conversationContext,
        confidence,
        source: 'ai_analysis'
      },
      action: {
        type: rule.action_type,
        data: rule.action_params,
        priority: rule.priority
      },
      execution: {
        mode: rule.require_operator_approval || confidence < 0.85 ? 'suggested' : 'auto',
        requiresApproval: rule.require_operator_approval || confidence < 0.85,
        timestamp: new Date()
      },
      context: conversationContext
    }
  }

  /**
   * Check if a timer condition is met
   */
  detectTimerTrigger(
    currentTime: Date,
    showStartTime: Date | null,
    segmentStartTime: Date | null,
    rule: TriggerRule
  ): AutomationDecision | null {
    const conditions = rule.trigger_conditions as TimerTriggerCondition

    let shouldTrigger = false
    let triggerData: Record<string, any> = {}

    if (conditions.type === 'absolute') {
      // Absolute time trigger (would need to be implemented with cron)
      // Not implemented in this simplified version
      return null
    } else if (conditions.type === 'relative') {
      // Relative time trigger (e.g., 5 minutes after show start)
      const referenceTime = conditions.reference === 'show_start' ? showStartTime :
                           conditions.reference === 'segment_start' ? segmentStartTime :
                           new Date()

      if (!referenceTime) return null

      const elapsedSeconds = Math.floor((currentTime.getTime() - referenceTime.getTime()) / 1000)
      const targetSeconds = conditions.offset_seconds || 0

      shouldTrigger = Math.abs(elapsedSeconds - targetSeconds) < 5 // Within 5 seconds

      triggerData = {
        reference: conditions.reference,
        elapsed_seconds: elapsedSeconds,
        target_seconds: targetSeconds
      }
    } else if (conditions.type === 'recurring') {
      // Recurring timer (cron-style)
      // Not implemented in this simplified version
      return null
    }

    if (!shouldTrigger) return null

    return {
      trigger: {
        type: 'timer',
        data: triggerData,
        confidence: 1.0,
        source: 'timer'
      },
      action: {
        type: rule.action_type,
        data: rule.action_params,
        priority: rule.priority
      },
      execution: {
        mode: rule.require_operator_approval ? 'suggested' : 'auto',
        requiresApproval: rule.require_operator_approval,
        timestamp: new Date()
      },
      context: {}
    }
  }

  /**
   * Check if a rule is currently active (day/time restrictions)
   */
  isRuleActive(rule: TriggerRule, currentTime: Date = new Date()): boolean {
    // Check if rule is enabled
    if (!rule.enabled) return false

    // Check active days (handle null/undefined)
    if (rule.active_days && Array.isArray(rule.active_days) && rule.active_days.length > 0) {
      const currentDay = currentTime.getDay() // 0=Sunday, 6=Saturday
      if (!rule.active_days.includes(currentDay)) return false
    }
    // If active_days is null/undefined/empty, assume rule is active all days

    // Check active time range
    if (rule.active_time_start && rule.active_time_end) {
      const currentTimeStr = currentTime.toTimeString().slice(0, 8) // HH:MM:SS
      if (currentTimeStr < rule.active_time_start || currentTimeStr > rule.active_time_end) {
        return false
      }
    }

    // Check execution limit
    if (rule.max_executions_per_show !== null && rule.max_executions_per_show !== undefined) {
      if (rule.current_execution_count >= rule.max_executions_per_show) {
        return false
      }
    }

    return true
  }

  /**
   * Extract keywords from natural language for AI-assisted trigger creation
   * This is a simple version - real implementation would use NLP
   */
  extractPotentialKeywords(text: string): string[] {
    // Remove common words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))

    return [...new Set(words)] // Remove duplicates
  }
}
