/**
 * Fake AnalyserNode for Audio Visualization (CORS Workaround)
 * 
 * This creates a mock AnalyserNode that generates realistic frequency data
 * based on the audio element's volume, without requiring Web Audio API.
 * 
 * WHY: Web Audio API's MediaElementSource requires CORS headers from storage.
 *      This workaround allows visualizations to work while CORS is being fixed.
 */

export class FakeAnalyserNode {
  private audioElement: HTMLAudioElement
  private _frequencyBinCount: number = 1024
  private phase: number = 0
  private lastUpdateTime: number = Date.now()
  private smoothedVolume: number = 0
  
  // Simulate AnalyserNode properties
  public fftSize: number = 2048
  public smoothingTimeConstant: number = 0.8
  public minDecibels: number = -90
  public maxDecibels: number = -10

  constructor(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement
    this._frequencyBinCount = this.fftSize / 2
  }

  get frequencyBinCount(): number {
    return this._frequencyBinCount
  }

  /**
   * Generate fake frequency data based on current volume and time
   */
  getByteFrequencyData(array: Uint8Array): void {
    const now = Date.now()
    const deltaTime = (now - this.lastUpdateTime) / 1000
    this.lastUpdateTime = now

    // Get current volume (0-1) from audio element
    const currentVolume = this.audioElement.paused ? 0 : this.audioElement.volume

    // Smooth volume changes
    this.smoothedVolume += (currentVolume - this.smoothedVolume) * (1 - this.smoothingTimeConstant)

    // Advance phase for animation
    this.phase += deltaTime * Math.PI * 2 * 0.5 // Rotate at 0.5 Hz

    // Generate frequency bins with realistic distribution
    for (let i = 0; i < array.length; i++) {
      const frequencyRatio = i / array.length

      // Bass (low frequencies) - stronger
      const bassContribution = frequencyRatio < 0.1 
        ? (1 - frequencyRatio / 0.1) * 0.8 
        : 0

      // Mids - medium
      const midContribution = frequencyRatio >= 0.1 && frequencyRatio < 0.4
        ? Math.sin((frequencyRatio - 0.1) / 0.3 * Math.PI) * 0.6
        : 0

      // Highs - weaker, more variation
      const highContribution = frequencyRatio >= 0.4
        ? Math.sin((frequencyRatio - 0.4) / 0.6 * Math.PI) * 0.4
        : 0

      // Combine contributions
      let baseValue = (bassContribution + midContribution + highContribution) * this.smoothedVolume

      // Add some animation/variation based on phase
      const variation = Math.sin(this.phase + i * 0.1) * 0.15 * this.smoothedVolume
      baseValue += variation

      // Add randomness for natural look
      const noise = (Math.random() - 0.5) * 0.1 * this.smoothedVolume
      baseValue += noise

      // Clamp and convert to 0-255 range
      array[i] = Math.max(0, Math.min(255, baseValue * 255))
    }
  }

  /**
   * Generate fake time domain (waveform) data
   */
  getByteTimeDomainData(array: Uint8Array): void {
    const centerValue = 128
    const amplitude = this.smoothedVolume * 127

    for (let i = 0; i < array.length; i++) {
      const t = (i / array.length) * Math.PI * 2
      const wave = Math.sin(t + this.phase) * amplitude
      array[i] = centerValue + wave
    }
  }

  /**
   * Mock methods to satisfy AnalyserNode interface
   */
  getFloatFrequencyData(array: Float32Array): void {
    const uint8Array = new Uint8Array(array.length)
    this.getByteFrequencyData(uint8Array)
    
    for (let i = 0; i < array.length; i++) {
      // Convert 0-255 to decibel range
      const normalized = uint8Array[i] / 255
      array[i] = this.minDecibels + (normalized * (this.maxDecibels - this.minDecibels))
    }
  }

  getFloatTimeDomainData(array: Float32Array): void {
    const uint8Array = new Uint8Array(array.length)
    this.getByteTimeDomainData(uint8Array)
    
    for (let i = 0; i < array.length; i++) {
      // Convert 0-255 to -1 to 1 range
      array[i] = (uint8Array[i] - 128) / 128
    }
  }

  // Stub methods (not needed for basic visualization)
  connect(): void {}
  disconnect(): void {}
}

/**
 * Create a fake AnalyserNode that mimics the real Web Audio API
 */
export function createFakeAnalyser(audioElement: HTMLAudioElement): AnalyserNode {
  const fake = new FakeAnalyserNode(audioElement)
  
  // Cast to AnalyserNode to satisfy TypeScript
  // This is safe because we implement all the methods used by visualizers
  return fake as unknown as AnalyserNode
}
