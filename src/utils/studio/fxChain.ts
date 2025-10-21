/**
 * Professional FX Chain Engine - Phase 5D
 * Implements professional effects: Delay, Reverb, Flanger, Phaser, Bit Crusher
 * Each effect has wet/dry mix control and can be combined
 */

export interface DelayEffect {
  time: number // 0-1 seconds
  feedback: number // 0-1
  wet: number // 0-1
  enabled: boolean
}

export interface ReverbEffect {
  size: 'small' | 'medium' | 'large' | 'hall'
  wet: number // 0-1
  enabled: boolean
}

export interface FlangerEffect {
  rate: number // 0.1-10 Hz
  depth: number // 0-1
  wet: number // 0-1
  enabled: boolean
}

export interface PhaserEffect {
  rate: number // 0.1-10 Hz
  stages: number // 2-12
  wet: number // 0-1
  enabled: boolean
}

export interface BitCrusherEffect {
  bits: number // 1-16
  sampleRate: number // 1000-44100 Hz
  wet: number // 0-1
  enabled: boolean
}

export interface FXChainConfig {
  delay: DelayEffect
  reverb: ReverbEffect
  flanger: FlangerEffect
  phaser: PhaserEffect
  bitCrusher: BitCrusherEffect
}

export interface FXPreset {
  name: string
  description: string
  config: Partial<FXChainConfig>
}

export const FX_PRESETS: FXPreset[] = [
  {
    name: 'Clean',
    description: 'No effects applied',
    config: {
      delay: { time: 0.25, feedback: 0.3, wet: 0, enabled: false },
      reverb: { size: 'medium', wet: 0, enabled: false },
      flanger: { rate: 0.5, depth: 0.5, wet: 0, enabled: false },
      phaser: { rate: 0.5, stages: 4, wet: 0, enabled: false },
      bitCrusher: { bits: 16, sampleRate: 44100, wet: 0, enabled: false },
    },
  },
  {
    name: 'Space Echo',
    description: 'Long delay with reverb',
    config: {
      delay: { time: 0.75, feedback: 0.6, wet: 0.4, enabled: true },
      reverb: { size: 'hall', wet: 0.3, enabled: true },
    },
  },
  {
    name: 'Jet Flanger',
    description: 'Aggressive flanger sweep',
    config: {
      flanger: { rate: 2.0, depth: 0.8, wet: 0.7, enabled: true },
    },
  },
  {
    name: 'Vintage Phaser',
    description: 'Classic phaser effect',
    config: {
      phaser: { rate: 0.8, stages: 6, wet: 0.6, enabled: true },
    },
  },
  {
    name: 'Lo-Fi Crusher',
    description: 'Bit crushing for gritty sound',
    config: {
      bitCrusher: { bits: 4, sampleRate: 8000, wet: 0.5, enabled: true },
    },
  },
  {
    name: 'Radio Effect',
    description: 'Bit crusher with phaser',
    config: {
      bitCrusher: { bits: 8, sampleRate: 16000, wet: 0.4, enabled: true },
      phaser: { rate: 0.3, stages: 4, wet: 0.3, enabled: true },
    },
  },
]

export class ProfessionalFXChain {
  private audioContext: AudioContext
  private inputNode: GainNode
  private outputNode: GainNode
  
  // Effect nodes
  private delayNode: DelayNode
  private delayFeedbackNode: GainNode
  private delayWetNode: GainNode
  private delayDryNode: GainNode
  
  private convolverNode: ConvolverNode
  private reverbWetNode: GainNode
  private reverbDryNode: GainNode
  
  private flangerDelayNode: DelayNode
  private flangerLFO: OscillatorNode
  private flangerGain: GainNode
  private flangerWetNode: GainNode
  private flangerDryNode: GainNode
  
  private phaserNodes: BiquadFilterNode[]
  private phaserLFO: OscillatorNode
  private phaserGain: GainNode
  private phaserWetNode: GainNode
  private phaserDryNode: GainNode
  
  private crusherNode: WaveShaperNode
  private crusherWetNode: GainNode
  private crusherDryNode: GainNode
  
  private config: FXChainConfig
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    
    // Initialize default config
    this.config = {
      delay: { time: 0.25, feedback: 0.3, wet: 0, enabled: false },
      reverb: { size: 'medium', wet: 0, enabled: false },
      flanger: { rate: 0.5, depth: 0.5, wet: 0, enabled: false },
      phaser: { rate: 0.5, stages: 4, wet: 0, enabled: false },
      bitCrusher: { bits: 16, sampleRate: 44100, wet: 0, enabled: false },
    }
    
    // Create input/output nodes
    this.inputNode = audioContext.createGain()
    this.outputNode = audioContext.createGain()
    
    // ====== DELAY EFFECT ======
    this.delayNode = audioContext.createDelay(1.0)
    this.delayFeedbackNode = audioContext.createGain()
    this.delayWetNode = audioContext.createGain()
    this.delayDryNode = audioContext.createGain()
    
    this.delayNode.delayTime.value = 0.25
    this.delayFeedbackNode.gain.value = 0.3
    this.delayWetNode.gain.value = 0
    this.delayDryNode.gain.value = 1
    
    // ====== REVERB EFFECT ======
    this.convolverNode = audioContext.createConvolver()
    this.reverbWetNode = audioContext.createGain()
    this.reverbDryNode = audioContext.createGain()
    
    this.reverbWetNode.gain.value = 0
    this.reverbDryNode.gain.value = 1
    
    // Generate impulse response for reverb
    this.generateImpulseResponse('medium')
    
    // ====== FLANGER EFFECT ======
    this.flangerDelayNode = audioContext.createDelay(0.02)
    this.flangerLFO = audioContext.createOscillator()
    this.flangerGain = audioContext.createGain()
    this.flangerWetNode = audioContext.createGain()
    this.flangerDryNode = audioContext.createGain()
    
    this.flangerDelayNode.delayTime.value = 0.005
    this.flangerGain.gain.value = 0.005
    this.flangerLFO.frequency.value = 0.5
    this.flangerWetNode.gain.value = 0
    this.flangerDryNode.gain.value = 1
    this.flangerLFO.start()
    
    // ====== PHASER EFFECT ======
    this.phaserNodes = []
    this.phaserLFO = audioContext.createOscillator()
    this.phaserGain = audioContext.createGain()
    this.phaserWetNode = audioContext.createGain()
    this.phaserDryNode = audioContext.createGain()
    
    this.phaserGain.gain.value = 800
    this.phaserLFO.frequency.value = 0.5
    this.phaserWetNode.gain.value = 0
    this.phaserDryNode.gain.value = 1
    this.phaserLFO.start()
    
    this.createPhaserStages(4)
    
    // ====== BIT CRUSHER EFFECT ======
    this.crusherNode = audioContext.createWaveShaper()
    this.crusherWetNode = audioContext.createGain()
    this.crusherDryNode = audioContext.createGain()
    
    this.crusherWetNode.gain.value = 0
    this.crusherDryNode.gain.value = 1
    this.updateBitCrusher(16, 44100)
  }
  
  connect(source: AudioNode, destination: AudioNode): void {
    // Connect source to input
    source.connect(this.inputNode)
    
    // Chain effects in parallel (each with wet/dry mix)
    // Delay
    this.inputNode.connect(this.delayDryNode)
    this.inputNode.connect(this.delayNode)
    this.delayNode.connect(this.delayFeedbackNode)
    this.delayFeedbackNode.connect(this.delayNode) // Feedback loop
    this.delayNode.connect(this.delayWetNode)
    
    // Reverb
    this.delayDryNode.connect(this.reverbDryNode)
    this.delayWetNode.connect(this.reverbDryNode)
    this.delayDryNode.connect(this.convolverNode)
    this.delayWetNode.connect(this.convolverNode)
    this.convolverNode.connect(this.reverbWetNode)
    
    // Flanger
    this.reverbDryNode.connect(this.flangerDryNode)
    this.reverbWetNode.connect(this.flangerDryNode)
    this.reverbDryNode.connect(this.flangerDelayNode)
    this.reverbWetNode.connect(this.flangerDelayNode)
    this.flangerLFO.connect(this.flangerGain)
    this.flangerGain.connect(this.flangerDelayNode.delayTime as any)
    this.flangerDelayNode.connect(this.flangerWetNode)
    
    // Phaser
    this.flangerDryNode.connect(this.phaserDryNode)
    this.flangerWetNode.connect(this.phaserDryNode)
    
    let phaserChain: AudioNode = this.flangerDryNode
    if (this.phaserNodes.length > 0) {
      this.flangerDryNode.connect(this.phaserNodes[0])
      this.flangerWetNode.connect(this.phaserNodes[0])
      for (let i = 0; i < this.phaserNodes.length - 1; i++) {
        this.phaserNodes[i].connect(this.phaserNodes[i + 1])
      }
      phaserChain = this.phaserNodes[this.phaserNodes.length - 1]
    }
    phaserChain.connect(this.phaserWetNode)
    
    // Bit Crusher
    this.phaserDryNode.connect(this.crusherDryNode)
    this.phaserWetNode.connect(this.crusherDryNode)
    this.phaserDryNode.connect(this.crusherNode)
    this.phaserWetNode.connect(this.crusherNode)
    this.crusherNode.connect(this.crusherWetNode)
    
    // Final mix to output
    this.crusherDryNode.connect(this.outputNode)
    this.crusherWetNode.connect(this.outputNode)
    
    // Connect output to destination
    this.outputNode.connect(destination)
  }
  
  disconnect(): void {
    this.inputNode.disconnect()
    this.outputNode.disconnect()
  }
  
  // ====== DELAY METHODS ======
  setDelay(config: Partial<DelayEffect>): void {
    this.config.delay = { ...this.config.delay, ...config }
    
    if (config.time !== undefined) {
      this.delayNode.delayTime.value = config.time
    }
    if (config.feedback !== undefined) {
      this.delayFeedbackNode.gain.value = config.feedback
    }
    if (config.wet !== undefined) {
      this.delayWetNode.gain.value = config.enabled ? config.wet : 0
      this.delayDryNode.gain.value = config.enabled ? (1 - config.wet) : 1
    }
    if (config.enabled !== undefined) {
      const wet = config.enabled ? this.config.delay.wet : 0
      this.delayWetNode.gain.value = wet
      this.delayDryNode.gain.value = 1 - wet
    }
  }
  
  // ====== REVERB METHODS ======
  setReverb(config: Partial<ReverbEffect>): void {
    this.config.reverb = { ...this.config.reverb, ...config }
    
    if (config.size !== undefined) {
      this.generateImpulseResponse(config.size)
    }
    if (config.wet !== undefined) {
      this.reverbWetNode.gain.value = config.enabled ? config.wet : 0
      this.reverbDryNode.gain.value = config.enabled ? (1 - config.wet) : 1
    }
    if (config.enabled !== undefined) {
      const wet = config.enabled ? this.config.reverb.wet : 0
      this.reverbWetNode.gain.value = wet
      this.reverbDryNode.gain.value = 1 - wet
    }
  }
  
  private generateImpulseResponse(size: 'small' | 'medium' | 'large' | 'hall'): void {
    const sizeMap = {
      small: 0.5,
      medium: 1.0,
      large: 2.0,
      hall: 4.0,
    }
    
    const duration = sizeMap[size]
    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Exponential decay with random noise
        const decay = Math.pow(1 - i / length, 2)
        channelData[i] = (Math.random() * 2 - 1) * decay
      }
    }
    
    this.convolverNode.buffer = impulse
  }
  
  // ====== FLANGER METHODS ======
  setFlanger(config: Partial<FlangerEffect>): void {
    this.config.flanger = { ...this.config.flanger, ...config }
    
    if (config.rate !== undefined) {
      this.flangerLFO.frequency.value = config.rate
    }
    if (config.depth !== undefined) {
      this.flangerGain.gain.value = config.depth * 0.01
    }
    if (config.wet !== undefined) {
      this.flangerWetNode.gain.value = config.enabled ? config.wet : 0
      this.flangerDryNode.gain.value = config.enabled ? (1 - config.wet) : 1
    }
    if (config.enabled !== undefined) {
      const wet = config.enabled ? this.config.flanger.wet : 0
      this.flangerWetNode.gain.value = wet
      this.flangerDryNode.gain.value = 1 - wet
    }
  }
  
  // ====== PHASER METHODS ======
  setPhaser(config: Partial<PhaserEffect>): void {
    this.config.phaser = { ...this.config.phaser, ...config }
    
    if (config.rate !== undefined) {
      this.phaserLFO.frequency.value = config.rate
    }
    if (config.stages !== undefined) {
      this.createPhaserStages(config.stages)
    }
    if (config.wet !== undefined) {
      this.phaserWetNode.gain.value = config.enabled ? config.wet : 0
      this.phaserDryNode.gain.value = config.enabled ? (1 - config.wet) : 1
    }
    if (config.enabled !== undefined) {
      const wet = config.enabled ? this.config.phaser.wet : 0
      this.phaserWetNode.gain.value = wet
      this.phaserDryNode.gain.value = 1 - wet
    }
  }
  
  private createPhaserStages(stages: number): void {
    // Disconnect old phaser nodes
    this.phaserNodes.forEach(node => node.disconnect())
    this.phaserNodes = []
    
    // Create new allpass filters
    for (let i = 0; i < stages; i++) {
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'allpass'
      filter.frequency.value = 350 + (i * 50)
      filter.Q.value = 1
      this.phaserNodes.push(filter)
      
      // Connect LFO to frequency
      this.phaserLFO.connect(this.phaserGain)
      this.phaserGain.connect(filter.frequency as any)
    }
  }
  
  // ====== BIT CRUSHER METHODS ======
  setBitCrusher(config: Partial<BitCrusherEffect>): void {
    this.config.bitCrusher = { ...this.config.bitCrusher, ...config }
    
    if (config.bits !== undefined || config.sampleRate !== undefined) {
      const bits = config.bits ?? this.config.bitCrusher.bits
      const sampleRate = config.sampleRate ?? this.config.bitCrusher.sampleRate
      this.updateBitCrusher(bits, sampleRate)
    }
    if (config.wet !== undefined) {
      this.crusherWetNode.gain.value = config.enabled ? config.wet : 0
      this.crusherDryNode.gain.value = config.enabled ? (1 - config.wet) : 1
    }
    if (config.enabled !== undefined) {
      const wet = config.enabled ? this.config.bitCrusher.wet : 0
      this.crusherWetNode.gain.value = wet
      this.crusherDryNode.gain.value = 1 - wet
    }
  }
  
  private updateBitCrusher(bits: number, sampleRate: number): void {
    const samples = 65536
    const curve = new Float32Array(samples)
    const step = Math.pow(0.5, bits)
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * 2 - 1
      const crushed = Math.floor(x / step) * step
      curve[i] = crushed
    }
    
    this.crusherNode.curve = curve
  }
  
  // ====== PRESET METHODS ======
  applyPreset(preset: FXPreset): void {
    if (preset.config.delay) this.setDelay(preset.config.delay)
    if (preset.config.reverb) this.setReverb(preset.config.reverb)
    if (preset.config.flanger) this.setFlanger(preset.config.flanger)
    if (preset.config.phaser) this.setPhaser(preset.config.phaser)
    if (preset.config.bitCrusher) this.setBitCrusher(preset.config.bitCrusher)
  }
  
  getConfig(): FXChainConfig {
    return { ...this.config }
  }
}
