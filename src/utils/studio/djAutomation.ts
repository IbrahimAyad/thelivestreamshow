/**
 * DJ Automation Layer
 * Allows AI to control DJ hardware/software functions
 */

import { DecisionOutput, MixingDecision } from './aiDecisionEngine';

export interface DJControls {
  // Playback
  play: (deckId: 'A' | 'B') => void;
  pause: (deckId: 'A' | 'B') => void;
  seek: (deckId: 'A' | 'B', position: number) => void;
  loadTrack: (deckId: 'A' | 'B', trackId: string) => Promise<void>;

  // Mixer
  setVolume: (deckId: 'A' | 'B' | 'master', value: number) => void; // 0-1
  setCrossfader: (value: number) => void; // 0-1 (0=A, 1=B)
  setGain: (deckId: 'A' | 'B', value: number) => void; // 0-2

  // EQ
  setEQ: (deckId: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number) => void; // 0-2

  // Effects
  applyEffect: (deckId: 'A' | 'B', effect: string, intensity: number) => void;
  removeEffect: (deckId: 'A' | 'B', effect: string) => void;

  // Performance
  setLoop: (deckId: 'A' | 'B', bars: number) => void;
  triggerHotCue: (deckId: 'A' | 'B', cueNumber: number) => void;
  setTempo: (deckId: 'A' | 'B', bpm: number) => void;

  // Filter
  setFilter: (deckId: 'A' | 'B', value: number) => void; // -1 to 1 (HPF to LPF)
}

export class DJAutomation {
  private controls: DJControls;
  private isAutomating: boolean = false;
  private automationQueue: Array<() => void> = [];
  private currentDeck: 'A' | 'B' = 'A';

  constructor(controls: DJControls) {
    this.controls = controls;
  }

  /**
   * Enable automation
   */
  enable(): void {
    this.isAutomating = true;
  }

  /**
   * Disable automation
   */
  disable(): void {
    this.isAutomating = false;
    this.automationQueue = [];
  }

  /**
   * Execute AI decision automatically
   */
  async executeDecision(decision: DecisionOutput): Promise<boolean> {
    if (!this.isAutomating) {
      console.log('⚠️ Automation disabled, skipping decision execution');
      return false;
    }

    console.log(`🤖 AI executing: ${decision.decision}`, decision);

    try {
      switch (decision.decision) {
        case 'start_mix':
          await this.executeMix(decision);
          break;

        case 'apply_effect':
          this.executeEffect(decision);
          break;

        case 'adjust_eq':
          this.executeEQAdjustment(decision);
          break;

        case 'set_loop':
          this.executeLoop(decision);
          break;

        case 'trigger_hotcue':
          this.executeHotCue(decision);
          break;

        case 'change_tempo':
          this.executeTempChange(decision);
          break;

        case 'crossfade':
          this.executeCrossfade(decision);
          break;

        case 'wait':
          // Do nothing
          break;

        default:
          console.warn('Unknown decision:', decision.decision);
          return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to execute AI decision:', error);
      return false;
    }
  }

  /**
   * Execute mix transition
   */
  private async executeMix(decision: DecisionOutput): Promise<void> {
    const timing = decision.parameters?.timing || 32;
    const intensity = decision.parameters?.intensity || 0.5;

    console.log(`🎚️ Starting mix transition (${timing}s, intensity: ${intensity})`);

    const nextDeck = this.currentDeck === 'A' ? 'B' : 'A';

    // Start next track
    this.controls.play(nextDeck);

    // Gradual crossfade
    const steps = 100;
    const stepDuration = (timing * 1000) / steps;
    const startValue = this.currentDeck === 'A' ? 0 : 1;
    const endValue = nextDeck === 'A' ? 0 : 1;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const eased = this.easeInOutCubic(progress);
      const value = startValue + (endValue - startValue) * eased;

      this.controls.setCrossfader(value);

      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    // Switch active deck
    this.currentDeck = nextDeck;
    console.log(`✅ Mix complete, now on deck ${this.currentDeck}`);
  }

  /**
   * Execute effect application
   */
  private executeEffect(decision: DecisionOutput): void {
    const effect = decision.parameters?.effect || 'filter';
    const intensity = decision.parameters?.intensity || 0.5;

    console.log(`✨ Applying ${effect} at ${(intensity * 100).toFixed(0)}% intensity`);

    this.controls.applyEffect(this.currentDeck, effect, intensity);

    // Remove effect after some time
    setTimeout(() => {
      this.controls.removeEffect(this.currentDeck, effect);
      console.log(`✨ Removed ${effect}`);
    }, 8000);
  }

  /**
   * Execute EQ adjustment
   */
  private executeEQAdjustment(decision: DecisionOutput): void {
    const value = decision.parameters?.value || 0;

    console.log(`🎛️ Adjusting EQ based on energy delta: ${value.toFixed(2)}`);

    if (value < -0.2) {
      // Need more energy - boost highs
      this.controls.setEQ(this.currentDeck, 'high', 1.5);
      this.controls.setEQ(this.currentDeck, 'mid', 1.2);
    } else if (value > 0.2) {
      // Too much energy - reduce highs
      this.controls.setEQ(this.currentDeck, 'high', 0.7);
      this.controls.setEQ(this.currentDeck, 'mid', 0.9);
    } else {
      // Reset to neutral
      this.controls.setEQ(this.currentDeck, 'low', 1.0);
      this.controls.setEQ(this.currentDeck, 'mid', 1.0);
      this.controls.setEQ(this.currentDeck, 'high', 1.0);
    }
  }

  /**
   * Execute loop setting
   */
  private executeLoop(decision: DecisionOutput): void {
    const bars = decision.parameters?.bars || 4;

    console.log(`🔁 Setting ${bars}-bar loop`);

    this.controls.setLoop(this.currentDeck, bars);
  }

  /**
   * Execute hot cue trigger
   */
  private executeHotCue(decision: DecisionOutput): void {
    const cueNumber = decision.parameters?.cueNumber || 1;

    console.log(`🎯 Triggering hot cue ${cueNumber}`);

    this.controls.triggerHotCue(this.currentDeck, cueNumber);
  }

  /**
   * Execute tempo change
   */
  private executeTempChange(decision: DecisionOutput): void {
    const bpm = decision.parameters?.bpm || 128;

    console.log(`⏱️ Changing tempo to ${bpm} BPM`);

    this.controls.setTempo(this.currentDeck, bpm);
  }

  /**
   * Execute crossfade
   */
  private async executeCrossfade(decision: DecisionOutput): Promise<void> {
    const targetValue = decision.parameters?.value || 0.5;
    const duration = decision.parameters?.duration || 2000;

    console.log(`🎚️ Crossfading to ${(targetValue * 100).toFixed(0)}% over ${duration}ms`);

    const steps = 50;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const eased = this.easeInOutCubic(progress);
      const value = eased * targetValue;

      this.controls.setCrossfader(value);

      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Smooth beatmatch transition (align beats between tracks)
   */
  async beatmatch(
    fromDeck: 'A' | 'B',
    toDeck: 'A' | 'B',
    fromBPM: number,
    toBPM: number
  ): Promise<void> {
    console.log(`🎵 Beatmatching: ${fromBPM} BPM → ${toBPM} BPM`);

    // Gradually adjust tempo
    const steps = 20;
    const bpmDiff = toBPM - fromBPM;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentBPM = fromBPM + bpmDiff * progress;
      this.controls.setTempo(fromDeck, currentBPM);

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('✅ Beatmatch complete');
  }

  /**
   * Gradual volume fade
   */
  async fadeVolume(
    deck: 'A' | 'B' | 'master',
    fromVolume: number,
    toVolume: number,
    duration: number
  ): Promise<void> {
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeDiff = toVolume - fromVolume;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const eased = this.easeInOutCubic(progress);
      const volume = fromVolume + volumeDiff * eased;

      this.controls.setVolume(deck, volume);

      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Smart energy transition (combines multiple controls)
   */
  async energyTransition(targetEnergy: number): Promise<void> {
    console.log(`⚡ Transitioning to ${(targetEnergy * 100).toFixed(0)}% energy`);

    if (targetEnergy > 0.7) {
      // High energy: boost highs, apply filter sweep
      this.controls.setEQ(this.currentDeck, 'high', 1.5);
      this.controls.setEQ(this.currentDeck, 'mid', 1.2);
      this.controls.applyEffect(this.currentDeck, 'filter', 0.7);

      setTimeout(() => {
        this.controls.removeEffect(this.currentDeck, 'filter');
      }, 4000);
    } else if (targetEnergy < 0.3) {
      // Low energy: reduce highs, add reverb
      this.controls.setEQ(this.currentDeck, 'high', 0.7);
      this.controls.setEQ(this.currentDeck, 'mid', 0.8);
      this.controls.applyEffect(this.currentDeck, 'reverb', 0.3);
    } else {
      // Medium energy: neutral EQ
      this.controls.setEQ(this.currentDeck, 'low', 1.0);
      this.controls.setEQ(this.currentDeck, 'mid', 1.0);
      this.controls.setEQ(this.currentDeck, 'high', 1.0);
    }
  }

  /**
   * Emergency stop (kill all audio)
   */
  emergencyStop(): void {
    console.log('🛑 EMERGENCY STOP');

    this.controls.setVolume('A', 0);
    this.controls.setVolume('B', 0);
    this.controls.setVolume('master', 0);
    this.controls.pause('A');
    this.controls.pause('B');
  }

  /**
   * Get current automation status
   */
  isActive(): boolean {
    return this.isAutomating;
  }

  /**
   * Get current active deck
   */
  getCurrentDeck(): 'A' | 'B' {
    return this.currentDeck;
  }

  /**
   * Easing function for smooth transitions
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

/**
 * Create DJ automation controller
 */
export function createDJAutomation(controls: DJControls): DJAutomation {
  return new DJAutomation(controls);
}
