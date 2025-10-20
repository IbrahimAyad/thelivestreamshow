// =====================================================
// EVENT LISTENER - Subscribes to database events and triggers automation
// =====================================================

import { supabase } from '../supabase'
import type { AutomationEngine } from './AutomationEngine'
import type { TriggerRule } from './types'

export class EventListener {
  private engine: AutomationEngine
  private subscriptions: Map<string, any> = new Map()
  private activeRules: TriggerRule[] = []
  private isListening: boolean = false

  constructor(engine: AutomationEngine) {
    this.engine = engine
  }

  /**
   * Start listening to database events
   */
  async start(): Promise<void> {
    if (this.isListening) {
      console.log('[EventListener] Already listening')
      return
    }

    // Load active trigger rules
    await this.loadTriggerRules()

    // Subscribe to events for each unique table
    const tablesToWatch = this.getTablesFromRules()

    for (const table of tablesToWatch) {
      await this.subscribeToTable(table)
    }

    // Subscribe to trigger_rules changes to update active rules
    await this.subscribeToRuleChanges()

    this.isListening = true
    console.log('[EventListener] Started listening to', tablesToWatch.length, 'tables')
  }

  /**
   * Stop listening to all events
   */
  async stop(): Promise<void> {
    for (const [name, subscription] of this.subscriptions) {
      await subscription.unsubscribe()
      console.log('[EventListener] Unsubscribed from', name)
    }

    this.subscriptions.clear()
    this.isListening = false
    console.log('[EventListener] Stopped')
  }

  /**
   * Reload trigger rules (called when rules are updated)
   */
  async reloadRules(): Promise<void> {
    await this.loadTriggerRules()

    // Re-subscribe to tables (in case new tables were added)
    const tablesToWatch = this.getTablesFromRules()
    for (const table of tablesToWatch) {
      if (!this.subscriptions.has(table)) {
        await this.subscribeToTable(table)
      }
    }
  }

  /**
   * Load all active event-based trigger rules from database
   */
  private async loadTriggerRules(): Promise<void> {
    const { data: rules, error } = await supabase
      .from('trigger_rules')
      .select('*')
      .eq('trigger_type', 'event')
      .eq('enabled', true)

    if (error) {
      console.error('[EventListener] Error loading trigger rules:', error)
      return
    }

    this.activeRules = rules as TriggerRule[]
    console.log('[EventListener] Loaded', this.activeRules.length, 'active event rules')
  }

  /**
   * Get unique list of tables to watch from trigger rules
   */
  private getTablesFromRules(): string[] {
    const tables = new Set<string>()

    for (const rule of this.activeRules) {
      const eventSource = rule.trigger_conditions?.event_source
      if (eventSource) {
        tables.add(eventSource)
      }
    }

    return Array.from(tables)
  }

  /**
   * Subscribe to changes on a specific table
   */
  private async subscribeToTable(tableName: string): Promise<void> {
    // Don't subscribe if already subscribed
    if (this.subscriptions.has(tableName)) {
      return
    }

    const subscription = supabase
      .channel(`${tableName}_events`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => this.handleEvent(tableName, payload)
      )
      .subscribe()

    this.subscriptions.set(tableName, subscription)
    console.log('[EventListener] Subscribed to table:', tableName)
  }

  /**
   * Subscribe to trigger_rules changes to reload rules when they change
   */
  private async subscribeToRuleChanges(): Promise<void> {
    const subscription = supabase
      .channel('trigger_rules_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trigger_rules' },
        () => {
          console.log('[EventListener] Trigger rules changed, reloading...')
          this.reloadRules()
        }
      )
      .subscribe()

    this.subscriptions.set('trigger_rules', subscription)
  }

  /**
   * Handle a database event (INSERT, UPDATE, DELETE)
   */
  private async handleEvent(tableName: string, payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Convert Supabase event type to our format
    const eventTypeMap: Record<string, 'insert' | 'update' | 'delete'> = {
      'INSERT': 'insert',
      'UPDATE': 'update',
      'DELETE': 'delete'
    }

    const mappedEventType = eventTypeMap[eventType as string]
    if (!mappedEventType) {
      console.warn('[EventListener] Unknown event type:', eventType)
      return
    }

    console.log(`[EventListener] ${mappedEventType.toUpperCase()} event on ${tableName}`)

    // Get matching rules for this event
    const matchingRules = this.activeRules.filter(rule => {
      const conditions = rule.trigger_conditions

      // Check event source matches
      if (conditions.event_source !== tableName) return false

      // Check event type matches (or rule accepts any event type)
      if (conditions.event_type !== '*' && conditions.event_type !== mappedEventType) {
        return false
      }

      // Check filters match (if any)
      if (conditions.filters) {
        const recordToCheck = newRecord || oldRecord
        for (const [key, value] of Object.entries(conditions.filters)) {
          if (recordToCheck[key] !== value) return false
        }
      }

      return true
    })

    console.log(`[EventListener] Found ${matchingRules.length} matching rules`)

    // Process each matching rule
    for (const rule of matchingRules) {
      await this.engine.processEvent(
        tableName,
        mappedEventType,
        newRecord || oldRecord,
        [rule]
      )
    }
  }

  /**
   * Get listener status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      activeRules: this.activeRules.length,
      subscribedTables: Array.from(this.subscriptions.keys())
    }
  }
}
