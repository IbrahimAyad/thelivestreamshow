// Audio clipping utilities using Web Audio API

export interface ClipSettings {
  startTime: number
  endTime: number
  title: string
  friendlyName?: string
}

// Fetch and decode audio file
export async function fetchAndDecodeAudio(
  url: string,
  onProgress?: (progress: number) => void
): Promise<AudioBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch audio file')

  const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Failed to get response reader')

  const chunks: Uint8Array[] = []
  let receivedLength = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    chunks.push(value)
    receivedLength += value.length

    if (onProgress && contentLength > 0) {
      onProgress((receivedLength / contentLength) * 50) // 0-50% for download
    }
  }

  const audioData = new Uint8Array(receivedLength)
  let position = 0
  for (const chunk of chunks) {
    audioData.set(chunk, position)
    position += chunk.length
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const audioBuffer = await audioContext.decodeAudioData(audioData.buffer)

  if (onProgress) onProgress(100) // 100% done

  return audioBuffer
}

// Extract clip from audio buffer
export function extractClip(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const sampleRate = audioBuffer.sampleRate
  const startSample = Math.floor(startTime * sampleRate)
  const endSample = Math.floor(endTime * sampleRate)
  const clipLength = endSample - startSample

  // Create new buffer for the clip
  const clipBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    clipLength,
    sampleRate
  )

  // Copy the selected portion for each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel)
    const clipData = clipBuffer.getChannelData(channel)
    for (let i = 0; i < clipLength; i++) {
      clipData[i] = sourceData[startSample + i]
    }
  }

  return clipBuffer
}

// Convert AudioBuffer to WAV Blob
// Note: Using WAV format for lossless quality and faster client-side processing.
// WAV files maintain original audio quality without encoding overhead.
// If MP3 format is required, clips can be converted using external tools or
// by implementing lamejs library for browser-based MP3 encoding.
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const length = buffer.length * buffer.numberOfChannels * 2 + 44
  const arrayBuffer = new ArrayBuffer(length)
  const view = new DataView(arrayBuffer)
  const channels = []
  let offset = 0
  let pos = 0

  // Write WAV header
  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true)
    pos += 2
  }
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true)
    pos += 4
  }

  // "RIFF" chunk descriptor
  setUint32(0x46464952) // "RIFF"
  setUint32(length - 8) // file length - 8
  setUint32(0x45564157) // "WAVE"

  // "fmt" sub-chunk
  setUint32(0x20746d66) // "fmt "
  setUint32(16) // subchunk1size (16 for PCM)
  setUint16(1) // audio format (1 for PCM)
  setUint16(buffer.numberOfChannels) // number of channels
  setUint32(buffer.sampleRate) // sample rate
  setUint32(buffer.sampleRate * buffer.numberOfChannels * 2) // byte rate
  setUint16(buffer.numberOfChannels * 2) // block align
  setUint16(16) // bits per sample

  // "data" sub-chunk
  setUint32(0x61746164) // "data"
  setUint32(length - pos - 4) // subchunk2size

  // Write interleaved audio data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  while (pos < length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const sample = Math.max(-1, Math.min(1, channels[i][offset])) // clamp
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true) // convert to 16-bit PCM
      pos += 2
    }
    offset++
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

// Generate waveform data for visualization
export function generateWaveformData(
  audioBuffer: AudioBuffer,
  samples: number = 1000
): number[] {
  const rawData = audioBuffer.getChannelData(0) // Use first channel
  const blockSize = Math.floor(rawData.length / samples)
  const waveformData: number[] = []

  for (let i = 0; i < samples; i++) {
    const start = blockSize * i
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j])
    }
    waveformData.push(sum / blockSize)
  }

  return waveformData
}

// Format time for display (seconds to MM:SS.ms)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
}
