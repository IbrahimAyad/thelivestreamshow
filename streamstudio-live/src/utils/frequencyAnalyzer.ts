/**
 * Frequency Analyzer Utility
 * Extracts bass, mid, and high frequency values from an AnalyserNode
 */

export interface FrequencyBands {
  bass: number  // 0-1 range
  mid: number   // 0-1 range
  high: number  // 0-1 range
}

/**
 * Analyze frequency data from an AnalyserNode and extract bass/mid/high values
 * @param analyser - Web Audio API AnalyserNode
 * @returns FrequencyBands object with bass, mid, high values (0-1 range)
 */
export function analyzeFrequencyBands(analyser: AnalyserNode): FrequencyBands {
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  // Define frequency band ranges (as percentages of total bins)
  // Bass: 0-250Hz (roughly first 5% of bins)
  // Mid: 250Hz-2kHz (roughly next 20% of bins)
  // High: 2kHz-20kHz (remaining bins)
  
  const bassEnd = Math.floor(bufferLength * 0.05)
  const midEnd = Math.floor(bufferLength * 0.25)
  
  // Calculate average amplitude for each band
  let bassSum = 0
  let midSum = 0
  let highSum = 0
  
  for (let i = 0; i < bassEnd; i++) {
    bassSum += dataArray[i]
  }
  
  for (let i = bassEnd; i < midEnd; i++) {
    midSum += dataArray[i]
  }
  
  for (let i = midEnd; i < bufferLength; i++) {
    highSum += dataArray[i]
  }
  
  // Calculate averages (0-255 range from Uint8Array)
  const bassAvg = bassSum / bassEnd
  const midAvg = midSum / (midEnd - bassEnd)
  const highAvg = highSum / (bufferLength - midEnd)
  
  // Normalize to 0-1 range
  return {
    bass: bassAvg / 255,
    mid: midAvg / 255,
    high: highAvg / 255,
  }
}

/**
 * Convert bass/mid/high values back into a full frequency array for visualization
 * @param bass - Bass level (0-1)
 * @param mid - Mid level (0-1)
 * @param high - High level (0-1)
 * @param bufferLength - Desired array length (default: 1024)
 * @returns Uint8Array frequency data suitable for visualizers
 */
export function reconstructFrequencyData(
  bass: number,
  mid: number,
  high: number,
  bufferLength: number = 1024
): Uint8Array {
  const dataArray = new Uint8Array(bufferLength)
  
  const bassEnd = Math.floor(bufferLength * 0.05)
  const midEnd = Math.floor(bufferLength * 0.25)
  
  // Fill bass range
  const bassValue = Math.floor(bass * 255)
  for (let i = 0; i < bassEnd; i++) {
    // Add some variation to make it look more natural
    const variation = (Math.random() - 0.5) * 20
    dataArray[i] = Math.max(0, Math.min(255, bassValue + variation))
  }
  
  // Fill mid range
  const midValue = Math.floor(mid * 255)
  for (let i = bassEnd; i < midEnd; i++) {
    const variation = (Math.random() - 0.5) * 20
    dataArray[i] = Math.max(0, Math.min(255, midValue + variation))
  }
  
  // Fill high range
  const highValue = Math.floor(high * 255)
  for (let i = midEnd; i < bufferLength; i++) {
    const variation = (Math.random() - 0.5) * 20
    dataArray[i] = Math.max(0, Math.min(255, highValue + variation))
  }
  
  return dataArray
}
