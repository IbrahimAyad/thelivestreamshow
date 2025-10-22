/**
 * Headphone Cue System
 * Professional DJ pre-listening with split cue and mix control
 * Allows previewing tracks before playing them to the audience
 */

export interface HeadphoneCueConfig {
  enabled: boolean;
  mixLevel: number; // 0-1 (0 = full cue, 1 = full master)
  splitCue: boolean; // If true: left ear = cue, right ear = master
  volume: number; // 0-1
}

export interface CueChannel {
  audioElement: HTMLAudioElement | null;
  gainNode: GainNode | null;
  playing: boolean;
}

/**
 * Create headphone cue routing with Web Audio API
 * Routes audio to separate output for headphone monitoring
 */
export class HeadphoneCueManager {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private cueGain: GainNode;
  private headphoneGain: GainNode;
  private merger: ChannelMergerNode;
  private splitter: ChannelSplitterNode;

  // Cue channel for previewing
  private cueSource: MediaElementAudioSourceNode | null = null;
  private cueElement: HTMLAudioElement | null = null;

  // Master channel (live output)
  private masterSource: MediaElementAudioSourceNode | null = null;
  private masterElement: HTMLAudioElement | null = null;

  private config: HeadphoneCueConfig = {
    enabled: false,
    mixLevel: 0, // Start with full cue
    splitCue: true,
    volume: 0.8,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    // Create gain nodes
    this.masterGain = audioContext.createGain();
    this.cueGain = audioContext.createGain();
    this.headphoneGain = audioContext.createGain();

    // Create channel merger/splitter for split cue
    this.merger = audioContext.createChannelMerger(2);
    this.splitter = audioContext.createChannelSplitter(2);

    // Set initial volumes
    this.masterGain.gain.value = 1;
    this.cueGain.gain.value = 1;
    this.headphoneGain.gain.value = this.config.volume;

    // Connect headphone output
    this.headphoneGain.connect(audioContext.destination);
  }

  /**
   * Set the cue channel (track to preview)
   */
  setCueChannel(audioElement: HTMLAudioElement | null): void {
    // Disconnect previous cue
    if (this.cueSource) {
      this.cueSource.disconnect();
      this.cueSource = null;
    }

    this.cueElement = audioElement;

    if (audioElement) {
      // Create source from audio element
      this.cueSource = this.audioContext.createMediaElementSource(audioElement);
      this.updateRouting();
    }
  }

  /**
   * Set the master channel (live output)
   */
  setMasterChannel(audioElement: HTMLAudioElement | null): void {
    // Disconnect previous master
    if (this.masterSource) {
      this.masterSource.disconnect();
      this.masterSource = null;
    }

    this.masterElement = audioElement;

    if (audioElement) {
      // Create source from audio element
      this.masterSource = this.audioContext.createMediaElementSource(audioElement);
      this.updateRouting();
    }
  }

  /**
   * Update audio routing based on current configuration
   */
  private updateRouting(): void {
    // Disconnect everything first
    this.masterGain.disconnect();
    this.cueGain.disconnect();
    this.merger.disconnect();

    if (this.config.splitCue) {
      // Split cue mode: left ear = cue, right ear = master
      if (this.cueSource) {
        this.cueSource.connect(this.cueGain);
        this.cueGain.connect(this.splitter);
        this.splitter.connect(this.merger, 0, 0); // Left channel
      }

      if (this.masterSource) {
        this.masterSource.connect(this.masterGain);
        this.masterGain.connect(this.splitter);
        this.splitter.connect(this.merger, 1, 1); // Right channel
      }

      this.merger.connect(this.headphoneGain);
    } else {
      // Mix mode: blend cue and master based on mixLevel
      if (this.cueSource) {
        this.cueSource.connect(this.cueGain);
        this.cueGain.gain.value = 1 - this.config.mixLevel;
        this.cueGain.connect(this.headphoneGain);
      }

      if (this.masterSource) {
        this.masterSource.connect(this.masterGain);
        this.masterGain.gain.value = this.config.mixLevel;
        this.masterGain.connect(this.headphoneGain);
      }
    }
  }

  /**
   * Enable/disable headphone cue
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.headphoneGain.gain.value = enabled ? this.config.volume : 0;
  }

  /**
   * Set mix level (0 = full cue, 1 = full master)
   */
  setMixLevel(level: number): void {
    this.config.mixLevel = Math.max(0, Math.min(1, level));
    if (!this.config.splitCue) {
      this.updateRouting();
    }
  }

  /**
   * Toggle split cue mode
   */
  setSplitCue(enabled: boolean): void {
    this.config.splitCue = enabled;
    this.updateRouting();
  }

  /**
   * Set headphone volume
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.config.enabled) {
      this.headphoneGain.gain.value = this.config.volume;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): HeadphoneCueConfig {
    return { ...this.config };
  }

  /**
   * Play cue channel
   */
  async playCue(): Promise<void> {
    if (this.cueElement && this.config.enabled) {
      try {
        await this.cueElement.play();
      } catch (error) {
        console.error('Failed to play cue:', error);
      }
    }
  }

  /**
   * Pause cue channel
   */
  pauseCue(): void {
    if (this.cueElement) {
      this.cueElement.pause();
    }
  }

  /**
   * Seek cue channel
   */
  seekCue(time: number): void {
    if (this.cueElement) {
      this.cueElement.currentTime = time;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.cueSource) {
      this.cueSource.disconnect();
    }
    if (this.masterSource) {
      this.masterSource.disconnect();
    }
    this.masterGain.disconnect();
    this.cueGain.disconnect();
    this.headphoneGain.disconnect();
    this.merger.disconnect();
    this.splitter.disconnect();
  }
}

/**
 * Create a headphone cue manager instance
 */
export function createHeadphoneCue(audioContext: AudioContext): HeadphoneCueManager {
  return new HeadphoneCueManager(audioContext);
}

/**
 * Default headphone cue configuration
 */
export const DEFAULT_HEADPHONE_CONFIG: HeadphoneCueConfig = {
  enabled: false,
  mixLevel: 0,
  splitCue: true,
  volume: 0.8,
};
