// Crossfade Manager for smooth track transitions

export interface CrossfadeConfig {
  enabled: boolean
  duration: number // in seconds (0-10)
  autoEqMatching: boolean
}

export class CrossfadeManager {
  private audioContext: AudioContext
  private currentSource: AudioBufferSourceNode | null = null
  private currentGain: GainNode | null = null
  private nextSource: AudioBufferSourceNode | null = null
  private nextGain: GainNode | null = null
  private nextBuffer: AudioBuffer | null = null
  private destination: AudioNode
  private config: CrossfadeConfig
  private crossfadeTimeout: number | null = null

  constructor(audioContext: AudioContext, destination: AudioNode, config: CrossfadeConfig) {
    this.audioContext = audioContext
    this.destination = destination
    this.config = config
  }

  // Update configuration
  updateConfig(config: Partial<CrossfadeConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // Load audio buffer from URL
  async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return await this.audioContext.decodeAudioData(arrayBuffer)
  }

  // Start playback with optional crossfade from previous track
  async startPlayback(
    buffer: AudioBuffer,
    startTime: number = 0,
    crossfadeFromCurrent: boolean = false
  ): Promise<void> {
    const source = this.audioContext.createBufferSource()
    const gain = this.audioContext.createGain()
    
    source.buffer = buffer
    source.connect(gain)
    gain.connect(this.destination)
    
    const now = this.audioContext.currentTime
    
    if (crossfadeFromCurrent && this.currentSource && this.currentGain && this.config.enabled) {
      // Crossfade
      const duration = this.config.duration
      
      // Fade out current track
      this.currentGain.gain.cancelScheduledValues(now)
      this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, now)
      this.currentGain.gain.linearRampToValueAtTime(0, now + duration)
      
      // Fade in new track
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(1, now + duration)
      
      // Start new source
      source.start(now, startTime)
      
      // Stop old source after crossfade
      if (this.currentSource) {
        this.currentSource.stop(now + duration)
      }
    } else {
      // No crossfade, direct start
      gain.gain.setValueAtTime(1, now)
      source.start(now, startTime)
      
      // Stop current if exists
      if (this.currentSource) {
        this.currentSource.stop(now)
      }
    }
    
    // Update references
    this.currentSource = source
    this.currentGain = gain
  }

  // Preload next track for seamless transition
  async preloadNextTrack(url: string): Promise<void> {
    this.nextBuffer = await this.loadAudioBuffer(url)
  }

  // Schedule crossfade to next track
  scheduleCrossfade(timeUntilCrossfade: number): void {
    if (!this.config.enabled || !this.nextBuffer) return
    
    // Clear any existing timeout
    if (this.crossfadeTimeout !== null) {
      clearTimeout(this.crossfadeTimeout)
    }
    
    // Schedule crossfade
    this.crossfadeTimeout = window.setTimeout(() => {
      this.transitionToNext()
    }, timeUntilCrossfade * 1000)
  }

  // Transition to next track
  private async transitionToNext(): Promise<void> {
    if (!this.nextBuffer) return
    
    await this.startPlayback(this.nextBuffer, 0, true)
    this.nextBuffer = null
  }

  // Analyze track for optimal crossfade point
  analyzeTrackForCrossfade(buffer: AudioBuffer): number {
    // Analyze last 10 seconds for silence or fade-out
    const duration = buffer.duration
    const analyzeWindow = Math.min(10, duration)
    const startSample = Math.max(0, Math.floor((duration - analyzeWindow) * buffer.sampleRate))
    const endSample = buffer.length
    
    const channelData = buffer.getChannelData(0)
    let silenceDetected = false
    let fadeOutPoint = duration
    
    // Check for silence in last 10 seconds
    const silenceThreshold = 0.01
    let consecutiveSilentSamples = 0
    const silenceRequiredSamples = buffer.sampleRate * 0.5 // 0.5 seconds of silence
    
    for (let i = startSample; i < endSample; i++) {
      if (Math.abs(channelData[i]) < silenceThreshold) {
        consecutiveSilentSamples++
        if (consecutiveSilentSamples >= silenceRequiredSamples) {
          silenceDetected = true
          fadeOutPoint = (i - silenceRequiredSamples) / buffer.sampleRate
          break
        }
      } else {
        consecutiveSilentSamples = 0
      }
    }
    
    // If silence detected, start crossfade before silence
    if (silenceDetected) {
      return Math.max(0, fadeOutPoint - this.config.duration)
    }
    
    // Otherwise, crossfade in last configured duration
    return Math.max(0, duration - this.config.duration)
  }

  // Stop playback
  stop(): void {
    const now = this.audioContext.currentTime
    
    if (this.currentSource) {
      this.currentSource.stop(now)
      this.currentSource = null
    }
    
    if (this.nextSource) {
      this.nextSource.stop(now)
      this.nextSource = null
    }
    
    if (this.crossfadeTimeout !== null) {
      clearTimeout(this.crossfadeTimeout)
      this.crossfadeTimeout = null
    }
  }

  // Clean up
  dispose(): void {
    this.stop()
    this.nextBuffer = null
    this.currentGain = null
    this.nextGain = null
  }
}
