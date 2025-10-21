// DJ Sound Effects Engine using Web Audio API
// All effects are synthesized client-side (no external files)

export type SoundEffect =
  | 'airHorn'
  | 'siren'
  | 'rewind'
  | 'laserZap'
  | 'riser'
  | 'impact'
  | 'vinyl'
  | 'whiteNoise';

export class SoundEffectsEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private volume: number = 0.6
  private isInitialized: boolean = false

  constructor() {
    // Don't create AudioContext here - wait for user gesture
    console.log('🎵 SoundEffectsEngine created (AudioContext NOT initialized yet)')
  }

  // Lazy initialization - call this AFTER a user gesture
  async initializeAudioContext(): Promise<boolean> {
    if (this.isInitialized && this.audioContext) {
      console.log('🎵 SoundEffectsEngine already initialized')
      return true
    }

    try {
      console.log('🎵 Initializing SoundEffectsEngine AudioContext...')
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = this.volume
      
      await this.audioContext.resume()
      this.isInitialized = true
      console.log('✅ SoundEffectsEngine AudioContext initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize SoundEffectsEngine AudioContext:', error)
      return false
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  }

  getVolume(): number {
    return this.volume
  }

  // Air Horn Effect
  playAirHorn() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.4)

    gain.gain.setValueAtTime(0.8, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.6)
  }

  // Siren Effect
  playSiren() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const duration = 2
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    gain.gain.value = 0.5

    // Oscillate between 400Hz and 800Hz
    for (let i = 0; i < 8; i++) {
      const time = now + (i * 0.25)
      osc.frequency.setValueAtTime(i % 2 === 0 ? 400 : 800, time)
    }

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + duration)
  }

  // Scratch Effect
  playScratch(reverse: boolean = false) {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const duration = 0.3
    
    // Create noise
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    noise.playbackRate.value = reverse ? -1.5 : 1.5
    
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2000
    
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)
    
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    
    noise.start(now)
  }

  // Rewind Effect
  playRewind() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.8)

    gain.gain.setValueAtTime(0.5, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.8)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.8)
  }

  // Record Stop Effect
  playRecordStop() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5)

    gain.gain.setValueAtTime(0.4, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.5)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.5)
  }

  // Gunshot Effect
  playGunshot() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const duration = 0.1
    
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1))
    }
    
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.8, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)
    
    noise.connect(gain)
    gain.connect(this.masterGain)
    
    noise.start(now)
  }

  // Laser Zap Effect
  playLaserZap() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(2000, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3)

    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.3)
  }

  // Crowd Cheer Effect
  playCrowdCheer() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const duration = 1.5
    
    // Pink noise for crowd simulation
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      data[i] *= 0.11
      b6 = white * 0.115926
    }
    
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.7, now + 0.2)
    gain.gain.setValueAtTime(0.7, now + 1.0)
    gain.gain.linearRampToValueAtTime(0, now + duration)
    
    noise.connect(gain)
    gain.connect(this.masterGain)
    
    noise.start(now)
  }

  // DJ Drop/Impact Effect
  playDJDrop() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3)

    gain.gain.setValueAtTime(1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.4)
  }

  // Vinyl Stop Effect
  playVinylStop() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 1.2)

    gain.gain.setValueAtTime(0.5, now)
    gain.gain.linearRampToValueAtTime(0, now + 1.2)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 1.2)
  }

  // Transition Whoosh Effect
  playTransitionWhoosh() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const duration = 0.8
    
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(200, now)
    filter.frequency.exponentialRampToValueAtTime(4000, now + duration)
    filter.Q.value = 10
    
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.6, now + 0.2)
    gain.gain.linearRampToValueAtTime(0, now + duration)
    
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    
    noise.start(now)
  }

  // Alarm Effect
  playAlarm() {
    if (!this.audioContext || !this.masterGain) {
      console.warn('⚠️ SoundEffectsEngine not initialized')
      return
    }
    const now = this.audioContext.currentTime
    const duration = 2
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    gain.gain.value = 0.4

    // Alternate between 800Hz and 1000Hz
    for (let i = 0; i < 10; i++) {
      const time = now + (i * 0.2)
      osc.frequency.setValueAtTime(i % 2 === 0 ? 800 : 1000, time)
    }

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + duration)
  }

  // Resume audio context if suspended (browser autoplay policy)
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  // Generic play method
  async play(effect: SoundEffect, duration?: number) {
    if (!this.isInitialized) {
      console.warn('⚠️ SoundEffectsEngine not initialized, initializing now...')
      await this.initializeAudioContext()
    }
    
    // Resume audio context in case of autoplay policy
    await this.resume()

    switch (effect) {
      case 'airHorn':
        this.playAirHorn()
        break
      case 'siren':
        this.playSiren()
        break
      case 'rewind':
        this.playRewind()
        break
      case 'laserZap':
        this.playLaserZap()
        break
      case 'riser':
        this.playTransitionWhoosh()
        break
      case 'impact':
        this.playDJDrop()
        break
      case 'vinyl':
        this.playVinylStop()
        break
      case 'whiteNoise':
        this.playScratch()
        break
      default:
        console.warn('Unknown sound effect:', effect)
    }
  }

  // Stop all currently playing sounds
  stop() {
    if (!this.audioContext || !this.masterGain) return
    
    // Create a new audio context to stop all sounds
    // This is a simple way to stop all sounds at once
    const currentTime = this.audioContext.currentTime
    this.masterGain.gain.cancelScheduledValues(currentTime)
    this.masterGain.gain.setValueAtTime(0, currentTime)
    this.masterGain.gain.linearRampToValueAtTime(this.volume, currentTime + 0.01)
  }

  // Cleanup
  destroy() {
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

// Singleton instance (lazy creation, AudioContext initialized on first use)
let engineInstance: SoundEffectsEngine | null = null

export function getSoundEffectsEngine(): SoundEffectsEngine {
  if (!engineInstance) {
    engineInstance = new SoundEffectsEngine()
    console.log('🎵 SoundEffectsEngine singleton created (AudioContext will be initialized on first use)')
  }
  return engineInstance
}
