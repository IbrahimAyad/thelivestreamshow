/**
 * Sidechain Compression
 * Auto-duck music when microphone is active
 * Professional "radio DJ" effect
 */

export interface SidechainConfig {
  enabled: boolean;
  threshold: number; // Mic level threshold to trigger ducking (0-1)
  ratio: number; // How much to reduce music (0-1, where 0.5 = -6dB)
  attack: number; // How quickly to duck (seconds)
  release: number; // How quickly to restore (seconds)
  knee: number; // Smooth transition amount
}

export class SidechainCompressor {
  private audioContext: AudioContext;
  private musicGain: GainNode;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode;

  private config: SidechainConfig;
  private isActive: boolean = false;
  private monitoringMic: boolean = false;
  private animationFrame: number | null = null;

  constructor(audioContext: AudioContext, musicGain: GainNode) {
    this.audioContext = audioContext;
    this.musicGain = musicGain;

    // Create analyser for mic monitoring
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // Default configuration
    this.config = {
      enabled: false,
      threshold: 0.1, // 10% mic level
      ratio: 0.3, // Duck to 30% volume
      attack: 0.01, // 10ms attack
      release: 0.5, // 500ms release
      knee: 0.1,
    };
  }

  /**
   * Connect microphone input for sidechain analysis
   */
  connectMicrophone(micSource: MediaStreamAudioSourceNode): void {
    micSource.connect(this.analyser);
    this.startMonitoring();
  }

  /**
   * Disconnect microphone
   */
  disconnectMicrophone(): void {
    this.stopMonitoring();
    this.analyser.disconnect();
  }

  /**
   * Start monitoring mic levels
   */
  private startMonitoring(): void {
    if (this.monitoringMic) return;

    this.monitoringMic = true;
    this.monitor();
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    this.monitoringMic = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Monitor mic levels and apply ducking
   */
  private monitor = (): void => {
    if (!this.monitoringMic || !this.config.enabled) {
      this.animationFrame = requestAnimationFrame(this.monitor);
      return;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average mic level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const avgLevel = sum / bufferLength / 255; // Normalize to 0-1

    // Apply ducking if mic level exceeds threshold
    this.applyDucking(avgLevel);

    this.animationFrame = requestAnimationFrame(this.monitor);
  };

  /**
   * Apply ducking based on mic level
   */
  private applyDucking(micLevel: number): void {
    const shouldDuck = micLevel > this.config.threshold;

    const targetGain = shouldDuck ? this.config.ratio : 1.0;
    const timeConstant = shouldDuck ? this.config.attack : this.config.release;

    // Smooth transition
    const currentTime = this.audioContext.currentTime;
    this.musicGain.gain.setTargetAtTime(targetGain, currentTime, timeConstant);

    this.isActive = shouldDuck;
  }

  /**
   * Enable/disable sidechain compression
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      // Restore music volume
      this.musicGain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.musicGain.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 0.1);
      this.isActive = false;
    }
  }

  /**
   * Set threshold level
   */
  setThreshold(threshold: number): void {
    this.config.threshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Set ducking ratio
   */
  setRatio(ratio: number): void {
    this.config.ratio = Math.max(0, Math.min(1, ratio));
  }

  /**
   * Set attack time
   */
  setAttack(attack: number): void {
    this.config.attack = Math.max(0.001, Math.min(1, attack));
  }

  /**
   * Set release time
   */
  setRelease(release: number): void {
    this.config.release = Math.max(0.001, Math.min(5, release));
  }

  /**
   * Get current configuration
   */
  getConfig(): SidechainConfig {
    return { ...this.config };
  }

  /**
   * Check if ducking is currently active
   */
  isDucking(): boolean {
    return this.isActive;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMonitoring();
    this.analyser.disconnect();
    if (this.compressor) {
      this.compressor.disconnect();
    }
  }
}

/**
 * Create sidechain compressor instance
 */
export function createSidechainCompressor(
  audioContext: AudioContext,
  musicGain: GainNode
): SidechainCompressor {
  return new SidechainCompressor(audioContext, musicGain);
}

/**
 * Default sidechain configuration
 */
export const DEFAULT_SIDECHAIN_CONFIG: SidechainConfig = {
  enabled: false,
  threshold: 0.1,
  ratio: 0.3,
  attack: 0.01,
  release: 0.5,
  knee: 0.1,
};

/**
 * Sidechain presets
 */
export const SIDECHAIN_PRESETS = {
  subtle: {
    threshold: 0.15,
    ratio: 0.5,
    attack: 0.02,
    release: 0.8,
  },
  moderate: {
    threshold: 0.1,
    ratio: 0.3,
    attack: 0.01,
    release: 0.5,
  },
  aggressive: {
    threshold: 0.05,
    ratio: 0.15,
    attack: 0.005,
    release: 0.3,
  },
  radio: {
    threshold: 0.08,
    ratio: 0.2,
    attack: 0.005,
    release: 0.6,
  },
} as const;
