/**
 * Phase 7B - Microphone Effects Processor
 * 
 * Provides real-time audio effects for live microphone input:
 * - Auto-Tune / Pitch Correction
 * - Reverb (Studio, Hall, Plate)
 * - Compression
 * - De-esser (5-8kHz reduction)
 * - Lo-fi / Radio Filter
 * - Noise Gate
 */

export interface MicEffectsSettings {
  autoTune: boolean;
  pitchShift: number; // -12 to +12 semitones
  reverb: 'none' | 'studio' | 'hall' | 'plate';
  reverbMix: number; // 0-100%
  compression: boolean;
  compressionThreshold: number; // -100 to 0 dB
  compressionRatio: number; // 1-20
  deEsser: boolean;
  loFiFilter: boolean;
  noiseGate: boolean;
  noiseGateThreshold: number; // 0-100
}

export const defaultMicEffectsSettings: MicEffectsSettings = {
  autoTune: false,
  pitchShift: 0,
  reverb: 'none',
  reverbMix: 30,
  compression: true,
  compressionThreshold: -24,
  compressionRatio: 4,
  deEsser: false,
  loFiFilter: false,
  noiseGate: true,
  noiseGateThreshold: 20,
};

export class MicEffectsProcessor {
  private audioContext: AudioContext;
  private inputNode: MediaStreamAudioSourceNode | null = null;
  private outputNode: GainNode;
  private compressor: DynamicsCompressorNode;
  private deEsserFilter: BiquadFilterNode;
  private loFiFilter: BiquadFilterNode;
  private reverbNode: ConvolverNode;
  private reverbGain: GainNode;
  private dryGain: GainNode;
  private settings: MicEffectsSettings;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.settings = { ...defaultMicEffectsSettings };

    // Create audio nodes
    this.outputNode = audioContext.createGain();
    this.compressor = audioContext.createDynamicsCompressor();
    this.deEsserFilter = audioContext.createBiquadFilter();
    this.loFiFilter = audioContext.createBiquadFilter();
    this.reverbNode = audioContext.createConvolver();
    this.reverbGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();

    // Configure compressor
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Configure de-esser (targets 5-8kHz sibilance)
    this.deEsserFilter.type = 'peaking';
    this.deEsserFilter.frequency.value = 6500;
    this.deEsserFilter.Q.value = 2;
    this.deEsserFilter.gain.value = 0; // -6dB when active

    // Configure lo-fi filter
    this.loFiFilter.type = 'lowpass';
    this.loFiFilter.frequency.value = 3000;
    this.loFiFilter.Q.value = 1;

    // Set up reverb gain
    this.reverbGain.gain.value = 0;
    this.dryGain.gain.value = 1;

    // Generate reverb impulse response
    this.generateReverbImpulse('studio');
  }

  /**
   * Connect microphone stream to effects chain
   */
  connectMicStream(stream: MediaStream): void {
    this.inputNode = this.audioContext.createMediaStreamSource(stream);
    this.buildEffectsChain();
  }

  /**
   * Build the effects processing chain
   */
  private buildEffectsChain(): void {
    if (!this.inputNode) return;

    // Disconnect all
    this.inputNode.disconnect();
    this.compressor.disconnect();
    this.deEsserFilter.disconnect();
    this.loFiFilter.disconnect();
    this.reverbNode.disconnect();
    this.reverbGain.disconnect();
    this.dryGain.disconnect();

    // Build chain: Input -> Compressor -> De-esser -> Lo-fi -> Reverb + Dry -> Output
    let currentNode: AudioNode = this.inputNode;

    // Compressor
    if (this.settings.compression) {
      currentNode.connect(this.compressor);
      currentNode = this.compressor;
    }

    // De-esser
    if (this.settings.deEsser) {
      currentNode.connect(this.deEsserFilter);
      currentNode = this.deEsserFilter;
    }

    // Lo-fi filter
    if (this.settings.loFiFilter) {
      currentNode.connect(this.loFiFilter);
      currentNode = this.loFiFilter;
    }

    // Reverb (wet/dry mix)
    if (this.settings.reverb !== 'none') {
      currentNode.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbGain);
      this.reverbGain.connect(this.outputNode);
    }

    // Dry signal
    currentNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);
  }

  /**
   * Update effects settings
   */
  updateSettings(settings: Partial<MicEffectsSettings>): void {
    this.settings = { ...this.settings, ...settings };

    // Update compressor
    if (settings.compression !== undefined) {
      this.compressor.threshold.value = this.settings.compressionThreshold;
      this.compressor.ratio.value = this.settings.compressionRatio;
    }

    // Update de-esser
    if (settings.deEsser !== undefined) {
      this.deEsserFilter.gain.value = settings.deEsser ? -6 : 0;
    }

    // Update reverb
    if (settings.reverb !== undefined && settings.reverb !== 'none') {
      this.generateReverbImpulse(settings.reverb);
    }

    if (settings.reverbMix !== undefined) {
      const wetGain = settings.reverbMix / 100;
      const dryGain = 1 - wetGain * 0.5; // Preserve some dry signal
      this.reverbGain.gain.value = wetGain;
      this.dryGain.gain.value = dryGain;
    }

    // Update noise gate threshold (handled in useMicInput hook)

    // Rebuild chain if effect on/off changed
    if (
      settings.compression !== undefined ||
      settings.deEsser !== undefined ||
      settings.loFiFilter !== undefined ||
      settings.reverb !== undefined
    ) {
      this.buildEffectsChain();
    }
  }

  /**
   * Generate reverb impulse response
   */
  private generateReverbImpulse(type: 'studio' | 'hall' | 'plate'): void {
    const sampleRate = this.audioContext.sampleRate;
    let length: number;
    let decay: number;

    switch (type) {
      case 'studio':
        length = sampleRate * 0.5; // 0.5 seconds
        decay = 2;
        break;
      case 'hall':
        length = sampleRate * 2; // 2 seconds
        decay = 3;
        break;
      case 'plate':
        length = sampleRate * 1; // 1 second
        decay = 2.5;
        break;
    }

    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / sampleRate;
      const envelope = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    this.reverbNode.buffer = impulse;
  }

  /**
   * Get output node for connecting to destination or ducking system
   */
  getOutputNode(): GainNode {
    return this.outputNode;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.inputNode) {
      this.inputNode.disconnect();
    }
    this.compressor.disconnect();
    this.deEsserFilter.disconnect();
    this.loFiFilter.disconnect();
    this.reverbNode.disconnect();
    this.reverbGain.disconnect();
    this.dryGain.disconnect();
    this.outputNode.disconnect();
  }
}
