/**
 * Transcript Automation Bridge
 * 
 * Bridges Producer AI transcripts to AutomationEngine for keyword detection
 * Listens to betabot_conversation_log table and processes transcripts through automation
 */

import { supabase } from '../supabase'
import type { AutomationEngine } from './AutomationEngine'

export class TranscriptAutomationBridge {
  private engine: AutomationEngine
  private subscription: any = null
  private isRunning: boolean = false
  private hasLoggedError: boolean = false // ✅ Track if we've logged error to prevent spam

  constructor(engine: AutomationEngine) {
    this.engine = engine
  }

  /**
   * Start listening to transcript events
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[TranscriptAutomationBridge] Already running')
      return
    }

    console.log('[TranscriptAutomationBridge] Starting transcript listener...')

    try {
      this.subscription = supabase
        .channel('transcript_automation_bridge')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'betabot_conversation_log'
          },
          async (payload) => {
            const transcript = payload.new as any
            
            // Only process transcripts from the user (not BetaBot responses)
            if (transcript.speaker_type !== 'user' && transcript.speaker_type !== 'host') {
              return
            }

            const transcriptText = transcript.transcript_text
            if (!transcriptText || transcriptText.length === 0) {
              return
            }

            console.log('[TranscriptAutomationBridge] Processing transcript:', transcriptText.substring(0, 50) + '...')

            // Process through automation engine
            await this.engine.processTranscript(transcriptText, {
              confidence: 1.0, // Transcripts from DB are assumed accurate
              timestamp: new Date(transcript.created_at)
            })
          }
        )
        .subscribe((status) => {
          // ✅ EMERGENCY FIX: Reduce log spam from channel errors
          if (status === 'SUBSCRIBED') {
            this.isRunning = true
            this.hasLoggedError = false // Reset error flag on successful subscription
            console.log('[TranscriptAutomationBridge] ✅ Subscribed to betabot_conversation_log')
          } else if (status === 'CLOSED') {
            this.isRunning = false
            if (!this.hasLoggedError) {
              console.warn('[TranscriptAutomationBridge] Connection closed')
            }
          } else if (status === 'CHANNEL_ERROR') {
            this.isRunning = false
            // Only log once to prevent spam
            if (!this.hasLoggedError) {
              console.error('[TranscriptAutomationBridge] Channel error (future errors suppressed)')
              this.hasLoggedError = true
            }
          }
        })
    } catch (error) {
      // ✅ Handle subscription errors silently after first log
      if (!this.hasLoggedError) {
        console.error('[TranscriptAutomationBridge] Failed to start subscription:', error)
        this.hasLoggedError = true
      }
    }
  }

  /**
   * Stop listening to transcript events
   */
  stop(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    this.isRunning = false
    console.log('[TranscriptAutomationBridge] Stopped')
  }

  /**
   * Get current status
   */
  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning }
  }
}
