// Track Analysis Utility using Essentia.js
// Client-side audio feature extraction for BPM, musical key, and energy

export interface AnalysisResult {
  bpm: number
  musicalKey: string
  energyLevel: number
  analysisStatus: 'complete' | 'failed'
}

// Musical key mapping for Essentia.js output
const KEY_NAMES = [
  'C Major', 'Db Major', 'D Major', 'Eb Major', 'E Major', 'F Major',
  'F# Major', 'G Major', 'Ab Major', 'A Major', 'Bb Major', 'B Major',
  'C Minor', 'C# Minor', 'D Minor', 'Eb Minor', 'E Minor', 'F Minor',
  'F# Minor', 'G Minor', 'Ab Minor', 'A Minor', 'Bb Minor', 'B Minor'
]

/**
 * Analyze audio file to extract BPM, musical key, and energy level
 * @param fileUrl URL of the audio file to analyze
 * @param onProgress Optional callback for progress updates (0-100)
 * @returns Promise with analysis results
 */
export async function analyzeAudioFile(
  fileUrl: string,
  onProgress?: (progress: number) => void
): Promise<AnalysisResult> {
  try {
    // Check if Essentia is available
    if (typeof window === 'undefined' || !(window as any).Essentia) {
      console.error('Essentia.js not loaded')
      return {
        bpm: 0,
        musicalKey: 'Unknown',
        energyLevel: 5,
        analysisStatus: 'failed'
      }
    }

    const Essentia = (window as any).Essentia
    const essentia = new Essentia(Essentia.EssentiaWASM)

    if (onProgress) onProgress(10)

    // Fetch and decode audio file
    const audioContext = new AudioContext()
    const response = await fetch(fileUrl)
    if (onProgress) onProgress(30)

    const arrayBuffer = await response.arrayBuffer()
    if (onProgress) onProgress(50)

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    if (onProgress) onProgress(60)

    // Get mono audio data
    const audioData = audioBuffer.getChannelData(0)

    // Convert to vector for Essentia
    const signal = essentia.arrayToVector(audioData)

    if (onProgress) onProgress(70)

    // Extract BPM using RhythmExtractor2013
    let bpm = 120 // Default fallback
    try {
      const rhythm = essentia.RhythmExtractor2013(signal)
      bpm = rhythm.bpm || 120
    } catch (err) {
      console.warn('BPM extraction failed, using default:', err)
    }

    if (onProgress) onProgress(80)

    // Extract musical key using KeyExtractor
    let musicalKey = 'C Major' // Default fallback
    try {
      const keyData = essentia.KeyExtractor(signal)
      const keyIndex = keyData.key || 0
      const scale = keyData.scale || 'major'
      
      // Map to readable key name
      if (keyIndex >= 0 && keyIndex < KEY_NAMES.length) {
        musicalKey = KEY_NAMES[keyIndex]
      } else {
        // Fallback mapping
        const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
        const note = noteNames[keyIndex % 12]
        musicalKey = `${note} ${scale === 'major' ? 'Major' : 'Minor'}`
      }
    } catch (err) {
      console.warn('Key extraction failed, using default:', err)
    }

    if (onProgress) onProgress(90)

    // Calculate energy level (1-10 scale) from RMS
    let energyLevel = 5 // Default medium energy
    try {
      const rms = essentia.RMS(signal).rms
      // Normalize RMS to 1-10 scale (typical RMS values are 0-0.3)
      energyLevel = Math.max(1, Math.min(10, Math.round(rms * 30)))
    } catch (err) {
      console.warn('Energy calculation failed, using default:', err)
    }

    if (onProgress) onProgress(100)

    // Clean up
    essentia.delete()
    await audioContext.close()

    return {
      bpm: Math.round(bpm * 10) / 10, // Round to 1 decimal place
      musicalKey,
      energyLevel,
      analysisStatus: 'complete'
    }
  } catch (error) {
    console.error('Audio analysis failed:', error)
    return {
      bpm: 0,
      musicalKey: 'Unknown',
      energyLevel: 5,
      analysisStatus: 'failed'
    }
  }
}

/**
 * Check if Essentia.js is loaded and ready
 */
export function isEssentiaAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Essentia
}
