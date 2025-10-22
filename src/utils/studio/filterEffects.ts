/**
 * Professional DJ Filter Effects
 * High-Pass and Low-Pass filters for creative mixing
 */

export interface FilterSettings {
  hpfFrequency: number  // 20 - 20000 Hz
  lpfFrequency: number  // 20 - 20000 Hz
  hpfEnabled: boolean
  lpfEnabled: boolean
}

export class DJFilterChain {
  private audioContext: AudioContext
  private hpFilter: BiquadFilterNode
  private lpFilter: BiquadFilterNode
  private inputNode: GainNode
  private outputNode: GainNode

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext

    // Create filter nodes
    this.hpFilter = audioContext.createBiquadFilter()
    this.hpFilter.type = 'highpass'
    this.hpFilter.frequency.value = 20 // Default: pass all frequencies
    this.hpFilter.Q.value = 0.7071 // Butterworth response

    this.lpFilter = audioContext.createBiquadFilter()
    this.lpFilter.type = 'lowpass'
    this.lpFilter.frequency.value = 20000 // Default: pass all frequencies
    this.lpFilter.Q.value = 0.7071 // Butterworth response

    // Create input/output nodes
    this.inputNode = audioContext.createGain()
    this.outputNode = audioContext.createGain()

    // Connect: input → HPF → LPF → output
    this.inputNode.connect(this.hpFilter)
    this.hpFilter.connect(this.lpFilter)
    this.lpFilter.connect(this.outputNode)
  }

  /**
   * Set High-Pass Filter frequency
   * @param frequency Hz (20 - 20000)
   */
  setHPF(frequency: number) {
    const clampedFreq = Math.max(20, Math.min(20000, frequency))

    // Smooth parameter changes to avoid clicks
    const now = this.audioContext.currentTime
    this.hpFilter.frequency.cancelScheduledValues(now)
    this.hpFilter.frequency.setTargetAtTime(clampedFreq, now, 0.01)
  }

  /**
   * Set Low-Pass Filter frequency
   * @param frequency Hz (20 - 20000)
   */
  setLPF(frequency: number) {
    const clampedFreq = Math.max(20, Math.min(20000, frequency))

    const now = this.audioContext.currentTime
    this.lpFilter.frequency.cancelScheduledValues(now)
    this.lpFilter.frequency.setTargetAtTime(clampedFreq, now, 0.01)
  }

  /**
   * Reset both filters to neutral (full frequency range)
   */
  reset() {
    this.setHPF(20)
    this.setLPF(20000)
  }

  /**
   * Get current filter settings
   */
  getSettings(): FilterSettings {
    return {
      hpfFrequency: this.hpFilter.frequency.value,
      lpfFrequency: this.lpFilter.frequency.value,
      hpfEnabled: this.hpFilter.frequency.value > 20,
      lpfEnabled: this.lpFilter.frequency.value < 20000,
    }
  }

  /**
   * Connect audio source to filter chain
   */
  connect(source: AudioNode, destination: AudioNode) {
    source.connect(this.inputNode)
    this.outputNode.connect(destination)
  }

  /**
   * Disconnect filter chain
   */
  disconnect() {
    this.inputNode.disconnect()
    this.outputNode.disconnect()
  }

  /**
   * Get input node (for connecting sources)
   */
  getInput(): AudioNode {
    return this.inputNode
  }

  /**
   * Get output node (for connecting destinations)
   */
  getOutput(): AudioNode {
    return this.outputNode
  }
}

/**
 * Convert frequency to display string
 */
export function formatFrequency(hz: number): string {
  if (hz >= 1000) {
    return `${(hz / 1000).toFixed(1)}kHz`
  }
  return `${Math.round(hz)}Hz`
}

/**
 * Convert linear slider value (0-1) to logarithmic frequency (20-20000)
 */
export function sliderToFrequency(value: number): number {
  // Logarithmic scale for better control
  const minLog = Math.log10(20)
  const maxLog = Math.log10(20000)
  const logValue = minLog + value * (maxLog - minLog)
  return Math.pow(10, logValue)
}

/**
 * Convert frequency to linear slider value (0-1)
 */
export function frequencyToSlider(frequency: number): number {
  const minLog = Math.log10(20)
  const maxLog = Math.log10(20000)
  const freqLog = Math.log10(Math.max(20, Math.min(20000, frequency)))
  return (freqLog - minLog) / (maxLog - minLog)
}
