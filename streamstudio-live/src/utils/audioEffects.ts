import type { AudioEffectsConfig, EffectPreset } from '@/types/database'

// Effect presets
export const EFFECT_PRESETS: EffectPreset[] = [
  {
    name: 'Studio',
    config: {
      reverb: 0.2,
      echo: 0,
      delay: 0.1,
      bassBoost: 0,
      treble: 0,
      trebleBoost: 0,
      distortion: 0,
      compression: 0.3,
    },
  },
  {
    name: 'Live',
    config: {
      reverb: 0.4,
      echo: 0,
      delay: 0.2,
      bassBoost: 3,
      treble: 0,
      trebleBoost: 0,
      distortion: 0,
      compression: 0.5,
    },
  },
  {
    name: 'Radio',
    config: {
      reverb: 0.1,
      echo: 0,
      delay: 0,
      bassBoost: 0,
      treble: 0,
      trebleBoost: 4,
      distortion: 0,
      compression: 0.7,
    },
  },
  {
    name: 'Club',
    config: {
      reverb: 0.3,
      echo: 0,
      delay: 0.3,
      bassBoost: 6,
      treble: 0,
      trebleBoost: 2,
      distortion: 0.2,
      compression: 0.6,
    },
  },
  {
    name: 'Podcast',
    config: {
      reverb: 0.15,
      echo: 0,
      delay: 0,
      bassBoost: 2,
      treble: 0,
      trebleBoost: 3,
      distortion: 0,
      compression: 0.8,
    },
  },
]

export const DEFAULT_EFFECTS: AudioEffectsConfig = {
  reverb: 0,
  echo: 0,
  delay: 0,
  bassBoost: 0,
  treble: 0,
  trebleBoost: 0,
  distortion: 0,
  compression: 0,
}

// Audio effects chain manager
export class AudioEffectsChain {
  private audioContext: AudioContext
  private inputNode: GainNode
  private outputNode: GainNode
  private bypassNode: GainNode
  private wetNode: GainNode
  
  // Effect nodes
  private reverbNode: ConvolverNode
  private delayNode: DelayNode
  private delayFeedbackNode: GainNode
  private bassFilterNode: BiquadFilterNode
  private trebleFilterNode: BiquadFilterNode
  private distortionNode: WaveShaperNode
  private compressorNode: DynamicsCompressorNode
  
  private currentEffects: AudioEffectsConfig = { ...DEFAULT_EFFECTS }
  private isBypassed: boolean = true

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    
    // Create routing nodes
    this.inputNode = audioContext.createGain()
    this.outputNode = audioContext.createGain()
    this.bypassNode = audioContext.createGain()
    this.wetNode = audioContext.createGain()
    
    // Initially bypass is on (dry signal only)
    this.bypassNode.gain.value = 1.0
    this.wetNode.gain.value = 0.0
    
    // Create effect nodes
    this.reverbNode = audioContext.createConvolver()
    this.delayNode = audioContext.createDelay(5.0)
    this.delayFeedbackNode = audioContext.createGain()
    this.bassFilterNode = audioContext.createBiquadFilter()
    this.trebleFilterNode = audioContext.createBiquadFilter()
    this.distortionNode = audioContext.createWaveShaper()
    this.compressorNode = audioContext.createDynamicsCompressor()
    
    // Configure filters
    this.bassFilterNode.type = 'lowshelf'
    this.bassFilterNode.frequency.value = 200
    this.trebleFilterNode.type = 'highshelf'
    this.trebleFilterNode.frequency.value = 3000
    
    // Set initial delay feedback to zero
    this.delayFeedbackNode.gain.value = 0
    
    // Generate impulse response for reverb
    this.generateReverbImpulse(2.0, 2.0)
    
    // Build the effects chain (but not connected to input yet)
    this.buildEffectsChain()
  }

  // Generate impulse response for convolver (reverb)
  private generateReverbImpulse(duration: number, decay: number) {
    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)
    const impulseL = impulse.getChannelData(0)
    const impulseR = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const n = length - i
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay)
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay)
    }

    this.reverbNode.buffer = impulse
  }

  // Create distortion curve
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180
    
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }
    
    return curve
  }

  // Build internal effects chain
  private buildEffectsChain(): void {
    // Chain: wetNode -> bass -> treble -> distortion -> delay -> reverb -> compressor -> outputNode
    this.wetNode.connect(this.bassFilterNode)
    this.bassFilterNode.connect(this.trebleFilterNode)
    this.trebleFilterNode.connect(this.distortionNode)
    this.distortionNode.connect(this.delayNode)
    this.delayNode.connect(this.reverbNode)
    this.reverbNode.connect(this.compressorNode)
    this.compressorNode.connect(this.outputNode)
    
    // Delay feedback loop (initially at zero gain)
    this.delayNode.connect(this.delayFeedbackNode)
    this.delayFeedbackNode.connect(this.delayNode)
  }

  // Connect the effects chain to source and destination
  connect(
    sourceNode: AudioNode,
    destinationNode: AudioNode
  ): void {
    // Route input to both bypass and wet paths
    sourceNode.connect(this.inputNode)
    this.inputNode.connect(this.bypassNode)
    this.inputNode.connect(this.wetNode)
    
    // Both paths merge at output
    this.bypassNode.connect(this.outputNode)
    this.outputNode.connect(destinationNode)
  }

  // Check if any effects are active
  private hasActiveEffects(effects: AudioEffectsConfig): boolean {
    return effects.reverb > 0 ||
           effects.delay > 0 ||
           effects.bassBoost !== 0 ||
           effects.trebleBoost !== 0 ||
           effects.distortion > 0 ||
           effects.compression > 0
  }

  // Update bypass/wet routing
  private updateRouting(): void {
    const shouldBypass = !this.hasActiveEffects(this.currentEffects)
    
    if (shouldBypass && !this.isBypassed) {
      // Switch to bypass
      this.bypassNode.gain.value = 1.0
      this.wetNode.gain.value = 0.0
      this.isBypassed = true
    } else if (!shouldBypass && this.isBypassed) {
      // Switch to wet (effects active)
      this.bypassNode.gain.value = 0.0
      this.wetNode.gain.value = 1.0
      this.isBypassed = false
    }
  }

  // Apply effects configuration
  applyEffects(effects: AudioEffectsConfig): void {
    this.currentEffects = { ...effects }
    
    // Update bypass/wet routing based on whether effects are active
    this.updateRouting()
    
    // Delay
    this.delayNode.delayTime.value = Math.max(0, Math.min(1, effects.delay))
    this.delayFeedbackNode.gain.value = effects.delay > 0 ? 0.3 : 0
    
    // Bass boost
    this.bassFilterNode.gain.value = effects.bassBoost
    
    // Treble boost
    this.trebleFilterNode.gain.value = effects.trebleBoost
    
    // Distortion
    if (effects.distortion > 0) {
      this.distortionNode.curve = this.makeDistortionCurve(effects.distortion * 100)
      this.distortionNode.oversample = '4x'
    } else {
      this.distortionNode.curve = null
    }
    
    // Compression
    this.compressorNode.threshold.value = -24
    this.compressorNode.knee.value = 30
    this.compressorNode.ratio.value = 2 + effects.compression * 10
    this.compressorNode.attack.value = 0.003
    this.compressorNode.release.value = 0.25
  }

  // Get current effects
  getEffects(): AudioEffectsConfig {
    return { ...this.currentEffects }
  }

  // Reset to default
  reset(): void {
    this.applyEffects(DEFAULT_EFFECTS)
  }

  // Disconnect and clean up
  disconnect(): void {
    this.inputNode.disconnect()
    this.bypassNode.disconnect()
    this.wetNode.disconnect()
    this.bassFilterNode.disconnect()
    this.trebleFilterNode.disconnect()
    this.distortionNode.disconnect()
    this.delayNode.disconnect()
    this.delayFeedbackNode.disconnect()
    this.reverbNode.disconnect()
    this.compressorNode.disconnect()
    this.outputNode.disconnect()
  }
}
