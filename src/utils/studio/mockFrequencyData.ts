/**
 * Generate mock frequency data for visualization
 * Used by broadcast overlay to show visuals without loading audio
 */

export interface MockFrequencyDataOptions {
  isPlaying: boolean
  energy?: number // 1-10 scale
  bpm?: number | null
}

let lastFrameTime = 0
let phase = 0
const bassPhase = 0
const midPhase = 0
const highPhase = 0

/**
 * Generate realistic-looking frequency data without actual audio analysis
 */
export function generateMockFrequencyData(
  options: MockFrequencyDataOptions
): Uint8Array {
  const { isPlaying, energy = 5, bpm = 120 } = options
  const bufferLength = 256 // Standard analyser buffer size
  const data = new Uint8Array(bufferLength)

  if (!isPlaying) {
    // When paused, return zeros
    return data
  }

  // Calculate beat phase based on BPM
  const now = Date.now()
  const deltaTime = now - lastFrameTime
  lastFrameTime = now

  const beatsPerSecond = (bpm || 120) / 60
  const phaseIncrement = (deltaTime / 1000) * beatsPerSecond * Math.PI * 2
  phase += phaseIncrement

  // Beat envelope (0-1, pulses with BPM)
  const beatEnvelope = Math.max(0, Math.sin(phase)) ** 2

  // Energy scaling (1-10 -> 0.3-1.0)
  const energyScale = 0.3 + (energy / 10) * 0.7

  // Generate frequency bands
  for (let i = 0; i < bufferLength; i++) {
    const frequencyRatio = i / bufferLength

    // Bass (0-20%): Strong, rhythmic
    if (frequencyRatio < 0.2) {
      const bassStrength = 0.8 + beatEnvelope * 0.4
      const randomness = Math.random() * 0.2
      data[i] = Math.floor((bassStrength + randomness) * energyScale * 255)
    }
    // Mids (20-60%): Melodic, less rhythmic
    else if (frequencyRatio < 0.6) {
      const midStrength = 0.5 + beatEnvelope * 0.2
      const randomness = Math.random() * 0.3
      data[i] = Math.floor((midStrength + randomness) * energyScale * 255)
    }
    // Highs (60-100%): Sparse, decorative
    else {
      const highStrength = 0.3 + beatEnvelope * 0.1
      const randomness = Math.random() * 0.4
      data[i] = Math.floor((highStrength + randomness) * energyScale * 255)
    }
  }

  return data
}

/**
 * Extract frequency bands for VU meters
 */
export function extractFrequencyBands(data: Uint8Array): {
  low: number
  mid: number
  high: number
} {
  const bufferLength = data.length

  // Calculate average for each band
  const lowEnd = Math.floor(bufferLength * 0.2)
  const midEnd = Math.floor(bufferLength * 0.6)

  let lowSum = 0
  let midSum = 0
  let highSum = 0

  for (let i = 0; i < lowEnd; i++) {
    lowSum += data[i]
  }
  for (let i = lowEnd; i < midEnd; i++) {
    midSum += data[i]
  }
  for (let i = midEnd; i < bufferLength; i++) {
    highSum += data[i]
  }

  return {
    low: lowSum / lowEnd / 255,
    mid: midSum / (midEnd - lowEnd) / 255,
    high: highSum / (bufferLength - midEnd) / 255,
  }
}

/**
 * Detect beat from frequency data (simplified)
 */
export function detectBeat(data: Uint8Array, threshold: number = 200): boolean {
  const bufferLength = data.length
  const lowEnd = Math.floor(bufferLength * 0.2)

  let lowSum = 0
  for (let i = 0; i < lowEnd; i++) {
    lowSum += data[i]
  }

  const lowAvg = lowSum / lowEnd
  return lowAvg > threshold
}
