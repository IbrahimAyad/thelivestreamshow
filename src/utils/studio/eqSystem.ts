/**
 * Professional 3-Band EQ System
 * Uses BiquadFilterNode for Low/Mid/High frequency bands
 */

export interface EQBand {
  frequency: number;
  gain: number; // -100 to +12 dB
  q: number;
  killed: boolean;
}

export interface EQSettings {
  low: EQBand;
  mid: EQBand;
  high: EQBand;
  enabled: boolean;
}

export interface FilterSettings {
  hipass: {
    frequency: number;
    resonance: number;
    enabled: boolean;
  };
  lopass: {
    frequency: number;
    resonance: number;
    enabled: boolean;
  };
}

const DEFAULT_EQ: EQSettings = {
  low: { frequency: 100, gain: 0, q: 1, killed: false },
  mid: { frequency: 1000, gain: 0, q: 1, killed: false },
  high: { frequency: 10000, gain: 0, q: 1, killed: false },
  enabled: true,
};

const DEFAULT_FILTERS: FilterSettings = {
  hipass: { frequency: 20, resonance: 1, enabled: false },
  lopass: { frequency: 20000, resonance: 1, enabled: false },
};

export class ThreeBandEQ {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private lowFilter: BiquadFilterNode;
  private midFilter: BiquadFilterNode;
  private highFilter: BiquadFilterNode;
  private hipassFilter: BiquadFilterNode;
  private lopassFilter: BiquadFilterNode;
  private settings: EQSettings;
  private filterSettings: FilterSettings;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.settings = JSON.parse(JSON.stringify(DEFAULT_EQ));
    this.filterSettings = JSON.parse(JSON.stringify(DEFAULT_FILTERS));

    // Create nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();

    // Create EQ filters (peaking)
    this.lowFilter = audioContext.createBiquadFilter();
    this.lowFilter.type = 'peaking';
    this.lowFilter.frequency.value = 100;
    this.lowFilter.Q.value = 1;
    this.lowFilter.gain.value = 0;

    this.midFilter = audioContext.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1;
    this.midFilter.gain.value = 0;

    this.highFilter = audioContext.createBiquadFilter();
    this.highFilter.type = 'peaking';
    this.highFilter.frequency.value = 10000;
    this.highFilter.Q.value = 1;
    this.highFilter.gain.value = 0;

    // Create hi/lo pass filters
    this.hipassFilter = audioContext.createBiquadFilter();
    this.hipassFilter.type = 'highpass';
    this.hipassFilter.frequency.value = 20;
    this.hipassFilter.Q.value = 1;

    this.lopassFilter = audioContext.createBiquadFilter();
    this.lopassFilter.type = 'lowpass';
    this.lopassFilter.frequency.value = 20000;
    this.lopassFilter.Q.value = 1;

    // Connect chain: input -> hipass -> low -> mid -> high -> lopass -> output
    this.inputNode.connect(this.hipassFilter);
    this.hipassFilter.connect(this.lowFilter);
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.lopassFilter);
    this.lopassFilter.connect(this.outputNode);
  }

  /**
   * Connect input source to EQ
   */
  connect(source: AudioNode): void {
    source.connect(this.inputNode);
  }

  /**
   * Get output node for further processing
   */
  getOutput(): AudioNode {
    return this.outputNode;
  }

  /**
   * Set low band gain
   */
  setLowGain(gain: number, rampTime: number = 0.05): void {
    const clampedGain = Math.max(-100, Math.min(12, gain));
    const now = this.audioContext.currentTime;
    this.lowFilter.gain.cancelScheduledValues(now);
    this.lowFilter.gain.setTargetAtTime(clampedGain, now, rampTime);
    this.settings.low.gain = clampedGain;
    this.settings.low.killed = false;
  }

  /**
   * Set mid band gain
   */
  setMidGain(gain: number, rampTime: number = 0.05): void {
    const clampedGain = Math.max(-100, Math.min(12, gain));
    const now = this.audioContext.currentTime;
    this.midFilter.gain.cancelScheduledValues(now);
    this.midFilter.gain.setTargetAtTime(clampedGain, now, rampTime);
    this.settings.mid.gain = clampedGain;
    this.settings.mid.killed = false;
  }

  /**
   * Set high band gain
   */
  setHighGain(gain: number, rampTime: number = 0.05): void {
    const clampedGain = Math.max(-100, Math.min(12, gain));
    const now = this.audioContext.currentTime;
    this.highFilter.gain.cancelScheduledValues(now);
    this.highFilter.gain.setTargetAtTime(clampedGain, now, rampTime);
    this.settings.high.gain = clampedGain;
    this.settings.high.killed = false;
  }

  /**
   * Kill (mute) a frequency band instantly
   */
  killBand(band: 'low' | 'mid' | 'high'): void {
    const now = this.audioContext.currentTime;
    switch (band) {
      case 'low':
        this.lowFilter.gain.cancelScheduledValues(now);
        this.lowFilter.gain.setValueAtTime(-100, now);
        this.settings.low.killed = true;
        break;
      case 'mid':
        this.midFilter.gain.cancelScheduledValues(now);
        this.midFilter.gain.setValueAtTime(-100, now);
        this.settings.mid.killed = true;
        break;
      case 'high':
        this.highFilter.gain.cancelScheduledValues(now);
        this.highFilter.gain.setValueAtTime(-100, now);
        this.settings.high.killed = true;
        break;
    }
  }

  /**
   * Restore a killed band to previous gain
   */
  restoreBand(band: 'low' | 'mid' | 'high'): void {
    switch (band) {
      case 'low':
        if (this.settings.low.killed) {
          this.setLowGain(this.settings.low.gain);
        }
        break;
      case 'mid':
        if (this.settings.mid.killed) {
          this.setMidGain(this.settings.mid.gain);
        }
        break;
      case 'high':
        if (this.settings.high.killed) {
          this.setHighGain(this.settings.high.gain);
        }
        break;
    }
  }

  /**
   * Toggle kill state of a band
   */
  toggleKill(band: 'low' | 'mid' | 'high'): void {
    const killed = this.settings[band].killed;
    if (killed) {
      this.restoreBand(band);
    } else {
      this.killBand(band);
    }
  }

  /**
   * Set hi-pass filter
   */
  setHipass(frequency: number, resonance: number = 1): void {
    const now = this.audioContext.currentTime;
    this.hipassFilter.frequency.cancelScheduledValues(now);
    this.hipassFilter.frequency.setTargetAtTime(frequency, now, 0.05);
    this.hipassFilter.Q.value = resonance;
    this.filterSettings.hipass.frequency = frequency;
    this.filterSettings.hipass.resonance = resonance;
    this.filterSettings.hipass.enabled = frequency > 20;
  }

  /**
   * Set lo-pass filter
   */
  setLopass(frequency: number, resonance: number = 1): void {
    const now = this.audioContext.currentTime;
    this.lopassFilter.frequency.cancelScheduledValues(now);
    this.lopassFilter.frequency.setTargetAtTime(frequency, now, 0.05);
    this.lopassFilter.Q.value = resonance;
    this.filterSettings.lopass.frequency = frequency;
    this.filterSettings.lopass.resonance = resonance;
    this.filterSettings.lopass.enabled = frequency < 20000;
  }

  /**
   * Apply preset EQ curve
   */
  applyPreset(preset: 'flat' | 'club' | 'radio' | 'bass-boost' | 'vocal'): void {
    switch (preset) {
      case 'flat':
        this.setLowGain(0);
        this.setMidGain(0);
        this.setHighGain(0);
        break;
      case 'club':
        this.setLowGain(6);
        this.setMidGain(-2);
        this.setHighGain(4);
        break;
      case 'radio':
        this.setLowGain(-6);
        this.setMidGain(3);
        this.setHighGain(2);
        break;
      case 'bass-boost':
        this.setLowGain(9);
        this.setMidGain(0);
        this.setHighGain(0);
        break;
      case 'vocal':
        this.setLowGain(-3);
        this.setMidGain(6);
        this.setHighGain(2);
        break;
    }
  }

  /**
   * Reset all EQ settings
   */
  reset(): void {
    this.setLowGain(0);
    this.setMidGain(0);
    this.setHighGain(0);
    this.setHipass(20);
    this.setLopass(20000);
  }

  /**
   * Get current settings
   */
  getSettings(): EQSettings {
    return JSON.parse(JSON.stringify(this.settings));
  }

  /**
   * Get current filter settings
   */
  getFilterSettings(): FilterSettings {
    return JSON.parse(JSON.stringify(this.filterSettings));
  }

  /**
   * Disconnect and cleanup
   */
  dispose(): void {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
    this.lowFilter.disconnect();
    this.midFilter.disconnect();
    this.highFilter.disconnect();
    this.hipassFilter.disconnect();
    this.lopassFilter.disconnect();
  }
}

/**
 * Bass Swap utility for deck-to-deck transitions
 */
export class BassSwap {
  /**
   * Swap low frequencies between two EQ instances
   */
  static swap(deckA: ThreeBandEQ, deckB: ThreeBandEQ, duration: number = 1.0): void {
    const settingsA = deckA.getSettings();
    const settingsB = deckB.getSettings();

    // Gradually swap low gains
    const steps = 20;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const gainA = settingsA.low.gain * (1 - progress) + settingsB.low.gain * progress;
      const gainB = settingsB.low.gain * (1 - progress) + settingsA.low.gain * progress;

      setTimeout(() => {
        deckA.setLowGain(gainA, stepDuration);
        deckB.setLowGain(gainB, stepDuration);
      }, i * stepDuration * 1000);
    }
  }
}
