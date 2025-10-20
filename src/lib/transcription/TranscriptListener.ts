// =====================================================
// TRANSCRIPT LISTENER - Real-time speech-to-text
// =====================================================

import type { AutomationEngine } from '../automation/AutomationEngine'

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onerror: ((event: any) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: ((event: Event) => void) | null
  onstart: ((event: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new(): SpeechRecognition
    }
  }
}

export interface TranscriptSegment {
  id: string
  transcript: string
  confidence: number
  timestamp: Date
  isFinal: boolean
}

export interface TranscriptListenerStatus {
  isListening: boolean
  isSupported: boolean
  error?: string
  segmentCount: number
  lastTranscript?: string
}

export class TranscriptListener {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private automationEngine: AutomationEngine | null = null
  private segments: TranscriptSegment[] = []
  private maxSegments: number = 100
  private onTranscriptCallback?: (segment: TranscriptSegment) => void

  constructor(automationEngine?: AutomationEngine) {
    this.automationEngine = automationEngine || null
    this.initializeRecognition()
  }

  /**
   * Initialize Web Speech API
   */
  private initializeRecognition(): void {
    if (!this.isSupported()) {
      console.warn('[TranscriptListener] Web Speech API not supported in this browser')
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

    this.recognition = new SpeechRecognitionAPI()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1

    // Set up event listeners
    this.recognition.onresult = this.handleResult.bind(this)
    this.recognition.onerror = this.handleError.bind(this)
    this.recognition.onend = this.handleEnd.bind(this)
    this.recognition.onstart = this.handleStart.bind(this)

    console.log('[TranscriptListener] Initialized with Web Speech API')
  }

  /**
   * Check if Web Speech API is supported
   */
  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  /**
   * Start listening to audio
   */
  start(): void {
    if (!this.recognition) {
      console.error('[TranscriptListener] Recognition not initialized')
      return
    }

    if (this.isListening) {
      console.warn('[TranscriptListener] Already listening')
      return
    }

    try {
      this.recognition.start()
      console.log('[TranscriptListener] Started listening')
    } catch (error) {
      console.error('[TranscriptListener] Error starting:', error)
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.recognition) {
      return
    }

    if (!this.isListening) {
      return
    }

    try {
      this.recognition.stop()
      console.log('[TranscriptListener] Stopped listening')
    } catch (error) {
      console.error('[TranscriptListener] Error stopping:', error)
    }
  }

  /**
   * Handle recognition start
   */
  private handleStart(event: Event): void {
    this.isListening = true
    console.log('[TranscriptListener] Recognition started')
  }

  /**
   * Handle recognition end
   */
  private handleEnd(event: Event): void {
    this.isListening = false
    console.log('[TranscriptListener] Recognition ended')

    // Auto-restart if we want continuous listening
    if (this.recognition) {
      setTimeout(() => {
        if (!this.isListening) {
          console.log('[TranscriptListener] Auto-restarting...')
          this.start()
        }
      }, 1000)
    }
  }

  /**
   * Handle recognition errors
   */
  private handleError(event: any): void {
    console.error('[TranscriptListener] Error:', event.error)

    // Don't treat 'no-speech' as a critical error
    if (event.error === 'no-speech') {
      console.log('[TranscriptListener] No speech detected, continuing...')
      return
    }

    // Handle other errors
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      console.error('[TranscriptListener] Microphone permission denied')
    }
  }

  /**
   * Handle recognition results
   */
  private handleResult(event: SpeechRecognitionEvent): void {
    const results = event.results
    const resultIndex = event.resultIndex

    for (let i = resultIndex; i < results.length; i++) {
      const result = results[i]
      const alternative = result[0]
      const transcript = alternative.transcript.trim()
      const confidence = alternative.confidence

      if (!transcript) continue

      // Create segment
      const segment: TranscriptSegment = {
        id: `${Date.now()}-${i}`,
        transcript,
        confidence,
        timestamp: new Date(),
        isFinal: result.isFinal
      }

      // Only process final results for automation
      if (result.isFinal) {
        console.log('[TranscriptListener] Final:', transcript, `(${Math.round(confidence * 100)}%)`)

        // Add to segments
        this.addSegment(segment)

        // Trigger automation if engine is set
        if (this.automationEngine) {
          this.processKeywords(transcript, confidence)
        }

        // Call callback if set
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(segment)
        }
      } else {
        console.log('[TranscriptListener] Interim:', transcript)
      }
    }
  }

  /**
   * Process transcript for keywords and trigger automation
   */
  private async processKeywords(transcript: string, confidence: number): Promise<void> {
    if (!this.automationEngine) return

    try {
      // Normalize transcript for keyword matching
      const normalizedTranscript = transcript.toLowerCase().trim()

      // Pass to AutomationEngine for keyword detection
      await this.automationEngine.processTranscript(normalizedTranscript, {
        confidence,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('[TranscriptListener] Error processing keywords:', error)
    }
  }

  /**
   * Add segment to history
   */
  private addSegment(segment: TranscriptSegment): void {
    this.segments.push(segment)

    // Limit segments to max
    if (this.segments.length > this.maxSegments) {
      this.segments.shift()
    }
  }

  /**
   * Get recent segments
   */
  getSegments(limit?: number): TranscriptSegment[] {
    if (limit) {
      return this.segments.slice(-limit)
    }
    return [...this.segments]
  }

  /**
   * Clear segment history
   */
  clearSegments(): void {
    this.segments = []
  }

  /**
   * Get listener status
   */
  getStatus(): TranscriptListenerStatus {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported(),
      segmentCount: this.segments.length,
      lastTranscript: this.segments.length > 0
        ? this.segments[this.segments.length - 1].transcript
        : undefined
    }
  }

  /**
   * Set callback for new transcripts
   */
  onTranscript(callback: (segment: TranscriptSegment) => void): void {
    this.onTranscriptCallback = callback
  }

  /**
   * Set automation engine
   */
  setAutomationEngine(engine: AutomationEngine): void {
    this.automationEngine = engine
  }

  /**
   * Get full transcript text (all segments combined)
   */
  getFullTranscript(): string {
    return this.segments
      .filter(s => s.isFinal)
      .map(s => s.transcript)
      .join(' ')
  }
}
