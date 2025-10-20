// =====================================================
// PRIORITY QUEUE - Manages automation decision ordering
// =====================================================

import { AutomationDecision, QueuedDecision, Priority } from './types'

export class PriorityQueue {
  private queue: QueuedDecision[] = []
  private executionHistory: Map<string, Date> = new Map() // actionType -> lastExecutionTime

  /**
   * Add a decision to the queue with priority ordering
   */
  enqueue(decision: AutomationDecision): string {
    const id = this.generateId()
    const queuedDecision: QueuedDecision = {
      decision,
      queuedAt: new Date(),
      priority: decision.action.priority,
      id
    }

    // Insert in priority order (0 = highest, 5 = lowest)
    const insertIndex = this.queue.findIndex(item => item.priority > queuedDecision.priority)

    if (insertIndex === -1) {
      this.queue.push(queuedDecision)
    } else {
      this.queue.splice(insertIndex, 0, queuedDecision)
    }

    return id
  }

  /**
   * Get the highest priority decision without removing it
   */
  peek(): QueuedDecision | null {
    return this.queue[0] || null
  }

  /**
   * Remove and return the highest priority decision
   */
  dequeue(): QueuedDecision | null {
    return this.queue.shift() || null
  }

  /**
   * Remove a specific decision by ID
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id)
    if (index !== -1) {
      this.queue.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get all queued decisions (read-only)
   */
  getAll(): QueuedDecision[] {
    return [...this.queue]
  }

  /**
   * Get count of queued decisions
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Clear all queued decisions
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Check if an action is on cooldown
   */
  isOnCooldown(actionType: string, cooldownSeconds: number): boolean {
    const lastExecution = this.executionHistory.get(actionType)
    if (!lastExecution) return false

    const timeSinceLastMs = Date.now() - lastExecution.getTime()
    const cooldownMs = cooldownSeconds * 1000

    return timeSinceLastMs < cooldownMs
  }

  /**
   * Record that an action was executed (for cooldown tracking)
   */
  recordExecution(actionType: string): void {
    this.executionHistory.set(actionType, new Date())
  }

  /**
   * Get time until action is off cooldown (in seconds)
   */
  getCooldownRemaining(actionType: string, cooldownSeconds: number): number {
    const lastExecution = this.executionHistory.get(actionType)
    if (!lastExecution) return 0

    const timeSinceLastMs = Date.now() - lastExecution.getTime()
    const cooldownMs = cooldownSeconds * 1000
    const remainingMs = Math.max(0, cooldownMs - timeSinceLastMs)

    return Math.ceil(remainingMs / 1000)
  }

  /**
   * Check rate limit: count actions in last N seconds
   */
  getRecentExecutionCount(windowSeconds: number = 60): number {
    const windowMs = windowSeconds * 1000
    const cutoffTime = Date.now() - windowMs

    let count = 0
    for (const [, executionTime] of this.executionHistory) {
      if (executionTime.getTime() > cutoffTime) {
        count++
      }
    }

    return count
  }

  /**
   * Clean up old execution history (older than 5 minutes)
   */
  cleanupHistory(): void {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)

    for (const [actionType, executionTime] of this.executionHistory) {
      if (executionTime.getTime() < fiveMinutesAgo) {
        this.executionHistory.delete(actionType)
      }
    }
  }

  /**
   * Generate unique ID for queued decision
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const priorityCounts: Record<Priority, number> = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    }

    for (const item of this.queue) {
      priorityCounts[item.priority]++
    }

    return {
      total: this.queue.length,
      byPriority: priorityCounts,
      oldestQueuedAt: this.queue[this.queue.length - 1]?.queuedAt,
      newestQueuedAt: this.queue[0]?.queuedAt
    }
  }
}
