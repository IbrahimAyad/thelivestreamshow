/**
 * LearningEngine
 *
 * Analyzes operator feedback patterns and system performance to:
 * 1. Adjust confidence scores based on approval/rejection history
 * 2. Detect patterns in operator decisions
 * 3. Recommend threshold optimizations
 * 4. Track system effectiveness over time
 */

import type { AutomationEvent } from '../automation/types'

export interface LearningMetrics {
  totalEvents: number
  approvalRate: number
  rejectionRate: number
  autoExecutionRate: number
  avgConfidenceApproved: number
  avgConfidenceRejected: number
  avgExecutionTime: number
  successRate: number
  failureRate: number

  // Trend data
  eventsToday: number
  eventsThisWeek: number
  eventsThisMonth: number

  // Performance by type
  performanceByActionType: Record<string, ActionTypeMetrics>
  performanceByTriggerType: Record<string, TriggerTypeMetrics>

  // Time-based patterns
  hourlyDistribution: number[]
  dailyDistribution: number[]
}

export interface ActionTypeMetrics {
  total: number
  executed: number
  approved: number
  rejected: number
  failed: number
  avgConfidence: number
  successRate: number
}

export interface TriggerTypeMetrics {
  total: number
  executed: number
  avgConfidence: number
  successRate: number
}

export interface OptimizationRecommendation {
  type: 'threshold_increase' | 'threshold_decrease' | 'enable_auto' | 'disable_auto' | 'action_filter'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  currentValue: any
  suggestedValue: any
  impact: string
  confidence: number
}

export interface ConfidenceAdjustment {
  actionType: string
  originalConfidence: number
  adjustedConfidence: number
  reason: string
  adjustment: number
}

export class LearningEngine {
  private events: AutomationEvent[] = []
  private adjustmentHistory: ConfidenceAdjustment[] = []

  // Learning parameters
  private learningRate = 0.1 // How much to adjust based on feedback
  private minEventsForLearning = 10 // Minimum events before making adjustments

  constructor() {
    // Initialize learning engine
  }

  /**
   * Ingest new events for learning
   */
  ingestEvents(events: AutomationEvent[]): void {
    this.events = events
  }

  /**
   * Calculate comprehensive learning metrics
   */
  calculateMetrics(): LearningMetrics {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalEvents = this.events.length
    const approvedEvents = this.events.filter(e => e.operator_action === 'approved')
    const rejectedEvents = this.events.filter(e => e.operator_action === 'rejected')
    const executedEvents = this.events.filter(e => e.outcome === 'executed')
    const failedEvents = this.events.filter(e => e.outcome === 'failed')

    const eventsToday = this.events.filter(e => new Date(e.created_at) >= todayStart).length
    const eventsThisWeek = this.events.filter(e => new Date(e.created_at) >= weekStart).length
    const eventsThisMonth = this.events.filter(e => new Date(e.created_at) >= monthStart).length

    // Calculate rates
    const approvalRate = totalEvents > 0 ? approvedEvents.length / totalEvents : 0
    const rejectionRate = totalEvents > 0 ? rejectedEvents.length / totalEvents : 0
    const autoExecutionRate = totalEvents > 0 ?
      this.events.filter(e => e.execution_mode === 'auto' && e.outcome === 'executed').length / totalEvents : 0
    const successRate = totalEvents > 0 ? executedEvents.length / totalEvents : 0
    const failureRate = totalEvents > 0 ? failedEvents.length / totalEvents : 0

    // Average confidence scores
    const avgConfidenceApproved = approvedEvents.length > 0 ?
      approvedEvents.reduce((sum, e) => sum + (e.confidence || 0), 0) / approvedEvents.length : 0
    const avgConfidenceRejected = rejectedEvents.length > 0 ?
      rejectedEvents.reduce((sum, e) => sum + (e.confidence || 0), 0) / rejectedEvents.length : 0

    // Average execution time
    const eventsWithTime = this.events.filter(e => e.execution_time_ms)
    const avgExecutionTime = eventsWithTime.length > 0 ?
      eventsWithTime.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / eventsWithTime.length : 0

    // Performance by action type
    const performanceByActionType = this.calculateActionTypeMetrics()

    // Performance by trigger type
    const performanceByTriggerType = this.calculateTriggerTypeMetrics()

    // Time distributions
    const hourlyDistribution = this.calculateHourlyDistribution()
    const dailyDistribution = this.calculateDailyDistribution()

    return {
      totalEvents,
      approvalRate,
      rejectionRate,
      autoExecutionRate,
      avgConfidenceApproved,
      avgConfidenceRejected,
      avgExecutionTime,
      successRate,
      failureRate,
      eventsToday,
      eventsThisWeek,
      eventsThisMonth,
      performanceByActionType,
      performanceByTriggerType,
      hourlyDistribution,
      dailyDistribution
    }
  }

  /**
   * Calculate metrics grouped by action type
   */
  private calculateActionTypeMetrics(): Record<string, ActionTypeMetrics> {
    const metrics: Record<string, ActionTypeMetrics> = {}

    // Group events by action type
    const eventsByType = this.events.reduce((acc, event) => {
      if (!acc[event.action_type]) {
        acc[event.action_type] = []
      }
      acc[event.action_type].push(event)
      return acc
    }, {} as Record<string, AutomationEvent[]>)

    // Calculate metrics for each type
    for (const [actionType, events] of Object.entries(eventsByType)) {
      const total = events.length
      const executed = events.filter(e => e.outcome === 'executed').length
      const approved = events.filter(e => e.operator_action === 'approved').length
      const rejected = events.filter(e => e.operator_action === 'rejected').length
      const failed = events.filter(e => e.outcome === 'failed').length

      const avgConfidence = events.reduce((sum, e) => sum + (e.confidence || 0), 0) / total
      const successRate = total > 0 ? executed / total : 0

      metrics[actionType] = {
        total,
        executed,
        approved,
        rejected,
        failed,
        avgConfidence,
        successRate
      }
    }

    return metrics
  }

  /**
   * Calculate metrics grouped by trigger type
   */
  private calculateTriggerTypeMetrics(): Record<string, TriggerTypeMetrics> {
    const metrics: Record<string, TriggerTypeMetrics> = {}

    const eventsByType = this.events.reduce((acc, event) => {
      if (!acc[event.trigger_type]) {
        acc[event.trigger_type] = []
      }
      acc[event.trigger_type].push(event)
      return acc
    }, {} as Record<string, AutomationEvent[]>)

    for (const [triggerType, events] of Object.entries(eventsByType)) {
      const total = events.length
      const executed = events.filter(e => e.outcome === 'executed').length
      const avgConfidence = events.reduce((sum, e) => sum + (e.confidence || 0), 0) / total
      const successRate = total > 0 ? executed / total : 0

      metrics[triggerType] = {
        total,
        executed,
        avgConfidence,
        successRate
      }
    }

    return metrics
  }

  /**
   * Calculate hourly distribution of events (24 hours)
   */
  private calculateHourlyDistribution(): number[] {
    const distribution = new Array(24).fill(0)

    for (const event of this.events) {
      const hour = new Date(event.created_at).getHours()
      distribution[hour]++
    }

    return distribution
  }

  /**
   * Calculate daily distribution of events (7 days)
   */
  private calculateDailyDistribution(): number[] {
    const distribution = new Array(7).fill(0)

    for (const event of this.events) {
      const day = new Date(event.created_at).getDay()
      distribution[day]++
    }

    return distribution
  }

  /**
   * Adjust confidence score based on historical operator feedback
   */
  adjustConfidence(
    actionType: string,
    originalConfidence: number,
    triggerType: string
  ): ConfidenceAdjustment {
    // Get historical events for this action type
    const historicalEvents = this.events.filter(e =>
      e.action_type === actionType &&
      e.operator_action !== undefined
    )

    if (historicalEvents.length < this.minEventsForLearning) {
      return {
        actionType,
        originalConfidence,
        adjustedConfidence: originalConfidence,
        reason: 'Insufficient data for learning',
        adjustment: 0
      }
    }

    // Calculate approval rate
    const approvals = historicalEvents.filter(e => e.operator_action === 'approved').length
    const rejections = historicalEvents.filter(e => e.operator_action === 'rejected').length
    const approvalRate = approvals / (approvals + rejections)

    // Calculate average confidence of approved vs rejected
    const approvedEvents = historicalEvents.filter(e => e.operator_action === 'approved')
    const rejectedEvents = historicalEvents.filter(e => e.operator_action === 'rejected')

    const avgApprovedConfidence = approvedEvents.length > 0 ?
      approvedEvents.reduce((sum, e) => sum + (e.confidence || 0), 0) / approvedEvents.length : 0
    const avgRejectedConfidence = rejectedEvents.length > 0 ?
      rejectedEvents.reduce((sum, e) => sum + (e.confidence || 0), 0) / rejectedEvents.length : 0

    // Determine adjustment
    let adjustment = 0
    let reason = ''

    if (approvalRate > 0.8) {
      // High approval rate - boost confidence
      adjustment = this.learningRate * 0.15
      reason = `High approval rate (${Math.round(approvalRate * 100)}%) for ${actionType}`
    } else if (approvalRate < 0.4) {
      // High rejection rate - reduce confidence
      adjustment = -this.learningRate * 0.15
      reason = `High rejection rate (${Math.round((1 - approvalRate) * 100)}%) for ${actionType}`
    } else if (originalConfidence < avgApprovedConfidence) {
      // Similar to approved suggestions - slight boost
      adjustment = this.learningRate * 0.05
      reason = `Confidence similar to approved suggestions`
    } else if (originalConfidence > avgRejectedConfidence && rejectedEvents.length > 5) {
      // Similar to rejected suggestions - slight reduction
      adjustment = -this.learningRate * 0.05
      reason = `Confidence similar to rejected suggestions`
    }

    const adjustedConfidence = Math.max(0, Math.min(1, originalConfidence + adjustment))

    const result: ConfidenceAdjustment = {
      actionType,
      originalConfidence,
      adjustedConfidence,
      reason: reason || 'No adjustment needed',
      adjustment
    }

    this.adjustmentHistory.push(result)

    return result
  }

  /**
   * Generate optimization recommendations based on data analysis
   */
  generateRecommendations(currentConfig: {
    autoExecuteThreshold: number
    requireApprovalThreshold: number
    autoExecutionEnabled: boolean
  }): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []
    const metrics = this.calculateMetrics()

    // Recommendation 1: Adjust auto-execute threshold if approval rate is very high
    if (metrics.approvalRate > 0.9 && metrics.totalEvents > 50) {
      if (currentConfig.autoExecuteThreshold > 0.75) {
        recommendations.push({
          type: 'threshold_decrease',
          priority: 'high',
          title: 'Lower Auto-Execute Threshold',
          description: `You're approving ${Math.round(metrics.approvalRate * 100)}% of suggestions. Consider lowering the auto-execute threshold to reduce manual approvals.`,
          currentValue: currentConfig.autoExecuteThreshold,
          suggestedValue: Math.max(0.75, currentConfig.autoExecuteThreshold - 0.1),
          impact: `Could auto-execute ${Math.round((metrics.approvalRate - 0.9) * 100)}% more actions`,
          confidence: 0.85
        })
      }
    }

    // Recommendation 2: Increase threshold if rejection rate is high
    if (metrics.rejectionRate > 0.4 && metrics.totalEvents > 30) {
      recommendations.push({
        type: 'threshold_increase',
        priority: 'high',
        title: 'Increase Approval Threshold',
        description: `You're rejecting ${Math.round(metrics.rejectionRate * 100)}% of suggestions. Consider raising the threshold to reduce low-quality suggestions.`,
        currentValue: currentConfig.requireApprovalThreshold,
        suggestedValue: Math.min(0.75, currentConfig.requireApprovalThreshold + 0.1),
        impact: `Could reduce approval requests by ${Math.round(metrics.rejectionRate * 100)}%`,
        confidence: 0.80
      })
    }

    // Recommendation 3: Enable auto-execution if disabled but high approval rate
    if (!currentConfig.autoExecutionEnabled && metrics.approvalRate > 0.85 && metrics.totalEvents > 40) {
      recommendations.push({
        type: 'enable_auto',
        priority: 'medium',
        title: 'Enable Auto-Execution',
        description: `High approval rate (${Math.round(metrics.approvalRate * 100)}%) suggests the system is making good decisions. Consider enabling auto-execution.`,
        currentValue: false,
        suggestedValue: true,
        impact: `Could automate ${Math.round(metrics.approvalRate * 100)}% of suggestions`,
        confidence: 0.75
      })
    }

    // Recommendation 4: Disable auto-execution if failure rate is high
    if (currentConfig.autoExecutionEnabled && metrics.failureRate > 0.15 && metrics.totalEvents > 20) {
      recommendations.push({
        type: 'disable_auto',
        priority: 'high',
        title: 'Disable Auto-Execution',
        description: `High failure rate (${Math.round(metrics.failureRate * 100)}%) detected. Consider disabling auto-execution until issues are resolved.`,
        currentValue: true,
        suggestedValue: false,
        impact: 'Prevent automatic failures, require manual approval',
        confidence: 0.90
      })
    }

    // Recommendation 5: Filter out poorly performing action types
    for (const [actionType, actionMetrics] of Object.entries(metrics.performanceByActionType)) {
      if (actionMetrics.total > 10 && actionMetrics.successRate < 0.3) {
        recommendations.push({
          type: 'action_filter',
          priority: 'medium',
          title: `Filter ${actionType} Actions`,
          description: `Low success rate (${Math.round(actionMetrics.successRate * 100)}%) for ${actionType}. Consider disabling or adjusting this action type.`,
          currentValue: 'enabled',
          suggestedValue: 'disabled',
          impact: `Reduce failed actions by ${actionMetrics.failed}`,
          confidence: 0.70
        })
      }
    }

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.confidence - a.confidence
    })
  }

  /**
   * Export metrics as CSV
   */
  exportMetricsCSV(): string {
    const metrics = this.calculateMetrics()

    let csv = 'Metric,Value\n'
    csv += `Total Events,${metrics.totalEvents}\n`
    csv += `Approval Rate,${(metrics.approvalRate * 100).toFixed(2)}%\n`
    csv += `Rejection Rate,${(metrics.rejectionRate * 100).toFixed(2)}%\n`
    csv += `Auto-Execution Rate,${(metrics.autoExecutionRate * 100).toFixed(2)}%\n`
    csv += `Success Rate,${(metrics.successRate * 100).toFixed(2)}%\n`
    csv += `Failure Rate,${(metrics.failureRate * 100).toFixed(2)}%\n`
    csv += `Avg Confidence (Approved),${(metrics.avgConfidenceApproved * 100).toFixed(2)}%\n`
    csv += `Avg Confidence (Rejected),${(metrics.avgConfidenceRejected * 100).toFixed(2)}%\n`
    csv += `Avg Execution Time,${metrics.avgExecutionTime.toFixed(2)}ms\n`
    csv += `Events Today,${metrics.eventsToday}\n`
    csv += `Events This Week,${metrics.eventsThisWeek}\n`
    csv += `Events This Month,${metrics.eventsThisMonth}\n`

    csv += '\nAction Type,Total,Executed,Approved,Rejected,Failed,Avg Confidence,Success Rate\n'
    for (const [type, data] of Object.entries(metrics.performanceByActionType)) {
      csv += `${type},${data.total},${data.executed},${data.approved},${data.rejected},${data.failed},${(data.avgConfidence * 100).toFixed(2)}%,${(data.successRate * 100).toFixed(2)}%\n`
    }

    return csv
  }

  /**
   * Export events as JSON
   */
  exportEventsJSON(): string {
    return JSON.stringify(this.events, null, 2)
  }

  /**
   * Get adjustment history
   */
  getAdjustmentHistory(): ConfidenceAdjustment[] {
    return [...this.adjustmentHistory]
  }

  /**
   * Update learning rate
   */
  setLearningRate(rate: number): void {
    this.learningRate = Math.max(0, Math.min(1, rate))
  }

  /**
   * Get learning rate
   */
  getLearningRate(): number {
    return this.learningRate
  }
}
