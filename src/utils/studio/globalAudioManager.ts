/**
 * Global Audio Manager
 * 
 * Manages persistent HTML audio elements that survive React component unmounts
 * and tab switches. This ensures music continues playing seamlessly across
 * the entire application.
 */

export class GlobalAudioManager {
  private static deckAElement: HTMLAudioElement | null = null
  private static deckBElement: HTMLAudioElement | null = null
  private static initialized = false

  /**
   * Initialize or retrieve the audio element for a specific deck
   */
  static getAudioElement(deckId: 'A' | 'B'): HTMLAudioElement {
    if (!this.initialized) {
      this.initialize()
    }

    return deckId === 'A' ? this.deckAElement! : this.deckBElement!
  }

  /**
   * Initialize persistent audio elements
   */
  private static initialize() {
    console.log('[GlobalAudioManager] Initializing persistent audio elements...')

    // Create Deck A audio element
    if (!this.deckAElement) {
      this.deckAElement = new Audio()
      this.deckAElement.crossOrigin = 'anonymous'
      this.deckAElement.preload = 'metadata'
      this.deckAElement.preservesPitch = true
      this.deckAElement.playbackRate = 1.0
      console.log('[GlobalAudioManager] Deck A audio element created')
    }

    // Create Deck B audio element
    if (!this.deckBElement) {
      this.deckBElement = new Audio()
      this.deckBElement.crossOrigin = 'anonymous'
      this.deckBElement.preload = 'metadata'
      this.deckBElement.preservesPitch = true
      this.deckBElement.playbackRate = 1.0
      console.log('[GlobalAudioManager] Deck B audio element created')
    }

    this.initialized = true
    console.log('[GlobalAudioManager] ✅ Initialized')
  }

  /**
   * Check if audio manager is initialized
   */
  static isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get both deck elements
   */
  static getAllElements(): { deckA: HTMLAudioElement; deckB: HTMLAudioElement } {
    if (!this.initialized) {
      this.initialize()
    }

    return {
      deckA: this.deckAElement!,
      deckB: this.deckBElement!
    }
  }

  /**
   * Cleanup (should only be called when app is closing)
   */
  static cleanup() {
    console.log('[GlobalAudioManager] Cleaning up...')
    
    if (this.deckAElement) {
      this.deckAElement.pause()
      this.deckAElement.src = ''
    }
    
    if (this.deckBElement) {
      this.deckBElement.pause()
      this.deckBElement.src = ''
    }

    console.log('[GlobalAudioManager] ✅ Cleaned up')
  }
}

// Cleanup on page unload (not on tab switch!)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    GlobalAudioManager.cleanup()
  })
}
