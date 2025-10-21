/**
 * Professional Sampler Engine
 * Loads and plays WAV samples with one-shot and loop modes
 */

export interface SamplePad {
  id: number; // 0-15 for 16 pads
  name: string;
  audioBuffer: AudioBuffer | null;
  file_url: string | null;
  mode: 'one-shot' | 'loop';
  volume: number; // 0-1
  color: string;
  keyboardShortcut: string;
}

export interface PlayingSample {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  padId: number;
  startTime: number;
}

const PAD_COLORS = [
  // Row 1 (Q-U-I-O)
  '#ff0080', '#00d4ff', '#ffaa00', '#00ff88',
  // Row 2 (A-S-D-F)
  '#aa00ff', '#ffff00', '#ff4444', '#4488ff',
  // Row 3 (Z-X-C-V)
  '#ff6600', '#00ffff', '#ff00ff', '#88ff00',
  // Row 4 (1-2-3-4)
  '#ff0000', '#00ff00', '#0000ff', '#ffff88',
];

const PAD_SHORTCUTS = [
  // Row 1
  'q', 'w', 'e', 'r',
  // Row 2
  'a', 's', 'd', 'f',
  // Row 3
  'z', 'x', 'c', 'v',
  // Row 4
  '1', '2', '3', '4',
];

export class ProfessionalSampler {
  private audioContext: AudioContext;
  private pads: SamplePad[];
  private playingSamples: Map<number, PlayingSample>;
  private masterGain: GainNode;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
    this.pads = this.initializePads();
    this.playingSamples = new Map();

    // Create master gain node
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.8;
  }

  private initializePads(): SamplePad[] {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      name: `Pad ${i + 1}`,
      audioBuffer: null,
      file_url: null,
      mode: 'one-shot',
      volume: 1.0,
      color: PAD_COLORS[i],
      keyboardShortcut: PAD_SHORTCUTS[i],
    }));
  }

  /**
   * Load a sample from URL into a pad
   */
  async loadSample(padId: number, url: string, name?: string): Promise<void> {
    if (padId < 0 || padId >= 16) {
      throw new Error('Invalid pad ID');
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.pads[padId].audioBuffer = audioBuffer;
      this.pads[padId].file_url = url;
      if (name) {
        this.pads[padId].name = name;
      }
    } catch (error) {
      console.error(`Failed to load sample for pad ${padId}:`, error);
      throw error;
    }
  }

  /**
   * Load a sample from File object
   */
  async loadSampleFromFile(padId: number, file: File, name?: string): Promise<void> {
    if (padId < 0 || padId >= 16) {
      throw new Error('Invalid pad ID');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.pads[padId].audioBuffer = audioBuffer;
      this.pads[padId].file_url = URL.createObjectURL(file);
      this.pads[padId].name = name || file.name.replace(/\.[^/.]+$/, '');
    } catch (error) {
      console.error(`Failed to load sample from file for pad ${padId}:`, error);
      throw error;
    }
  }

  /**
   * Play a pad
   */
  play(padId: number): void {
    if (padId < 0 || padId >= 16) {
      console.error('Invalid pad ID');
      return;
    }

    const pad = this.pads[padId];
    if (!pad.audioBuffer) {
      console.warn(`Pad ${padId} has no sample loaded`);
      return;
    }

    // Stop any currently playing sample from this pad (if one-shot)
    if (pad.mode === 'one-shot' && this.playingSamples.has(padId)) {
      this.stop(padId);
    }

    // Create source and gain node
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = pad.audioBuffer;
    source.loop = pad.mode === 'loop';
    gainNode.gain.value = pad.volume;

    // Connect: source -> gain -> master -> destination
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Start playback
    source.start(0);

    // Track playing sample
    const playingSample: PlayingSample = {
      source,
      gainNode,
      padId,
      startTime: this.audioContext.currentTime,
    };
    this.playingSamples.set(padId, playingSample);

    // Auto-remove on end (for one-shot)
    if (pad.mode === 'one-shot') {
      source.onended = () => {
        this.playingSamples.delete(padId);
      };
    }
  }

  /**
   * Stop a playing pad
   */
  stop(padId: number): void {
    const playingSample = this.playingSamples.get(padId);
    if (playingSample) {
      playingSample.source.stop();
      this.playingSamples.delete(padId);
    }
  }

  /**
   * Stop all playing samples
   */
  stopAll(): void {
    this.playingSamples.forEach((sample) => {
      sample.source.stop();
    });
    this.playingSamples.clear();
  }

  /**
   * Check if a pad is currently playing
   */
  isPlaying(padId: number): boolean {
    return this.playingSamples.has(padId);
  }

  /**
   * Set pad mode (one-shot or loop)
   */
  setPadMode(padId: number, mode: 'one-shot' | 'loop'): void {
    if (padId >= 0 && padId < 16) {
      this.pads[padId].mode = mode;
    }
  }

  /**
   * Set pad volume
   */
  setPadVolume(padId: number, volume: number): void {
    if (padId >= 0 && padId < 16) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.pads[padId].volume = clampedVolume;

      // Update currently playing sample volume
      const playingSample = this.playingSamples.get(padId);
      if (playingSample) {
        playingSample.gainNode.gain.value = clampedVolume;
      }
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = clampedVolume;
  }

  /**
   * Clear a pad
   */
  clearPad(padId: number): void {
    if (padId >= 0 && padId < 16) {
      this.stop(padId);
      this.pads[padId].audioBuffer = null;
      this.pads[padId].file_url = null;
      this.pads[padId].name = `Pad ${padId + 1}`;
    }
  }

  /**
   * Get all pads
   */
  getPads(): SamplePad[] {
    return this.pads;
  }

  /**
   * Get a specific pad
   */
  getPad(padId: number): SamplePad | null {
    return this.pads[padId] || null;
  }

  /**
   * Get keyboard shortcut for pad
   */
  getKeyboardShortcut(padId: number): string {
    return PAD_SHORTCUTS[padId] || '';
  }

  /**
   * Get pad ID from keyboard key
   */
  getPadIdFromKey(key: string): number | null {
    const index = PAD_SHORTCUTS.indexOf(key.toLowerCase());
    return index >= 0 ? index : null;
  }

  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.stopAll();
    this.masterGain.disconnect();
  }
}
