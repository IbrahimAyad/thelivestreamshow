/**
 * Slip Mode
 * Play effects, loops, or cues while maintaining the original playback timeline
 * When slip mode ends, playback resumes where it would have been
 */

export interface SlipState {
  isActive: boolean;
  slipStartTime: number; // When slip mode was activated
  slipStartPosition: number; // Track position when slip started
  virtualPosition: number; // Where track "would be" if not slipping
}

export class SlipModeManager {
  private slipState: SlipState = {
    isActive: false,
    slipStartTime: 0,
    slipStartPosition: 0,
    virtualPosition: 0,
  };

  private audioElement: HTMLAudioElement | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Set the audio element to manage
   */
  setAudioElement(element: HTMLAudioElement | null): void {
    this.audioElement = element;
  }

  /**
   * Enter slip mode
   */
  enterSlipMode(): boolean {
    if (!this.audioElement || this.slipState.isActive) return false;

    const currentTime = this.audioElement.currentTime;

    this.slipState = {
      isActive: true,
      slipStartTime: Date.now(),
      slipStartPosition: currentTime,
      virtualPosition: currentTime,
    };

    // Start updating virtual position
    this.startVirtualPositionUpdate();

    return true;
  }

  /**
   * Exit slip mode and return to virtual position
   */
  exitSlipMode(): boolean {
    if (!this.audioElement || !this.slipState.isActive) return false;

    // Jump to virtual position
    this.audioElement.currentTime = this.slipState.virtualPosition;

    // Clear state
    this.slipState.isActive = false;
    this.stopVirtualPositionUpdate();

    return true;
  }

  /**
   * Toggle slip mode
   */
  toggleSlipMode(): boolean {
    if (this.slipState.isActive) {
      return this.exitSlipMode();
    } else {
      return this.enterSlipMode();
    }
  }

  /**
   * Start updating virtual position
   */
  private startVirtualPositionUpdate(): void {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      if (!this.audioElement || !this.slipState.isActive) {
        this.stopVirtualPositionUpdate();
        return;
      }

      // Calculate how much time has passed since slip started
      const elapsedMs = Date.now() - this.slipState.slipStartTime;
      const elapsedSeconds = elapsedMs / 1000;

      // Update virtual position (where track would be if not slipping)
      this.slipState.virtualPosition = this.slipState.slipStartPosition + elapsedSeconds;
    }, 50); // Update every 50ms
  }

  /**
   * Stop updating virtual position
   */
  private stopVirtualPositionUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get current slip state
   */
  getState(): SlipState {
    return { ...this.slipState };
  }

  /**
   * Check if slip mode is active
   */
  isSlipping(): boolean {
    return this.slipState.isActive;
  }

  /**
   * Get virtual position (where track would be)
   */
  getVirtualPosition(): number {
    return this.slipState.virtualPosition;
  }

  /**
   * Get slip offset (how far behind we are)
   */
  getSlipOffset(): number {
    if (!this.audioElement || !this.slipState.isActive) return 0;
    return this.slipState.virtualPosition - this.audioElement.currentTime;
  }

  /**
   * Perform action in slip mode
   * Automatically enters slip mode, performs action, then allows manual exit
   */
  async performSlipAction(action: () => Promise<void> | void): Promise<void> {
    const wasInSlipMode = this.slipState.isActive;

    if (!wasInSlipMode) {
      this.enterSlipMode();
    }

    await action();

    // Note: We don't automatically exit slip mode
    // User must manually exit when they want to return to virtual position
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopVirtualPositionUpdate();
    this.slipState.isActive = false;
  }
}

/**
 * Create slip mode manager
 */
export function createSlipMode(audioElement?: HTMLAudioElement): SlipModeManager {
  const manager = new SlipModeManager();
  if (audioElement) {
    manager.setAudioElement(audioElement);
  }
  return manager;
}

/**
 * Example slip mode actions
 */
export const SLIP_MODE_ACTIONS = {
  /**
   * Play hot cue in slip mode
   */
  playCue: (audioElement: HTMLAudioElement, cueTime: number) => {
    audioElement.currentTime = cueTime;
  },

  /**
   * Play loop in slip mode
   */
  playLoop: (audioElement: HTMLAudioElement, loopStart: number, loopEnd: number) => {
    audioElement.currentTime = loopStart;
    // Set up loop (simplified - actual implementation would use loop controls)
  },

  /**
   * Scratch in slip mode
   */
  scratch: (audioElement: HTMLAudioElement, scratchPosition: number) => {
    audioElement.currentTime = scratchPosition;
  },
} as const;
