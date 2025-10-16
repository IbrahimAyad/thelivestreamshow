import { useCallback, useEffect, useRef, useState } from 'react'
import OBSWebSocket from 'obs-websocket-js'

interface OBSAudioConfig {
  host?: string
  port?: number
  password?: string
  audioSourceName?: string
}

interface OBSAudioState {
  connected: boolean
  error: string | null
  audioSources: string[]
  selectedSource: string | null
}

interface AudioChunk {
  data: Int16Array
  sampleRate: number
  channels: number
  timestamp: number
}

export function useOBSAudio(config: OBSAudioConfig = {}) {
  const {
    host = 'localhost',
    port = 4455,
    password = '',
    audioSourceName = null
  } = config

  const [state, setState] = useState<OBSAudioState>({
    connected: false,
    error: null,
    audioSources: [],
    selectedSource: audioSourceName
  })

  const obsRef = useRef<OBSWebSocket | null>(null)
  const audioWSRef = useRef<WebSocket | null>(null)
  const audioBufferRef = useRef<Int16Array[]>([])
  const onAudioChunkRef = useRef<((chunk: AudioChunk) => void) | null>(null)

  // Connect to OBS WebSocket
  const connect = useCallback(async () => {
    try {
      if (obsRef.current) {
        await disconnect()
      }

      console.log('🎬 Connecting to OBS WebSocket...')
      const obs = new OBSWebSocket()

      await obs.connect(`ws://${host}:${port}`, password)
      obsRef.current = obs

      console.log('✅ Connected to OBS WebSocket')

      // Get available audio sources
      const sources = await getAudioSources()

      setState(prev => ({
        ...prev,
        connected: true,
        error: null,
        audioSources: sources
      }))

      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Failed to connect to OBS:', errorMsg)

      setState(prev => ({
        ...prev,
        connected: false,
        error: errorMsg
      }))

      return false
    }
  }, [host, port, password])

  // Disconnect from OBS WebSocket
  const disconnect = useCallback(async () => {
    try {
      if (audioWSRef.current) {
        stopAudioCapture()
      }

      if (obsRef.current) {
        await obsRef.current.disconnect()
        obsRef.current = null
      }

      setState(prev => ({
        ...prev,
        connected: false,
        selectedSource: null
      }))

      console.log('👋 Disconnected from OBS')
    } catch (error) {
      console.error('Error disconnecting from OBS:', error)
    }
  }, [])

  // Get list of audio input sources from OBS
  const getAudioSources = useCallback(async (): Promise<string[]> => {
    if (!obsRef.current) {
      console.warn('⚠️ OBS not connected')
      return []
    }

    try {
      // Get all input sources
      const { inputs } = await obsRef.current.call('GetInputList')

      // Filter for audio sources
      const audioInputs = inputs.filter((input: any) => {
        const kind = input.inputKind?.toLowerCase() || ''
        return kind.includes('audio') || kind.includes('wasapi') || kind.includes('coreaudio')
      })

      const sourceNames = audioInputs.map((input: any) => input.inputName)
      console.log('🎤 Available audio sources:', sourceNames)

      return sourceNames
    } catch (error) {
      console.error('❌ Failed to get audio sources:', error)
      return []
    }
  }, [])

  // Start capturing audio from OBS audio-websocket plugin
  const startAudioCapture = useCallback((sourceName: string, audioWSPort: number = 4456) => {
    if (!obsRef.current || !state.connected) {
      console.error('❌ Cannot start audio capture: OBS not connected')
      return false
    }

    try {
      // Connect to obs-audio-to-websocket plugin
      const audioWS = new WebSocket(`ws://${host}:${audioWSPort}`)

      audioWS.binaryType = 'arraybuffer'

      audioWS.onopen = () => {
        console.log('✅ Connected to OBS Audio WebSocket')

        // Send configuration to start streaming audio from specific source
        audioWS.send(JSON.stringify({
          type: 'subscribe',
          source: sourceName
        }))
      }

      audioWS.onmessage = (event) => {
        if (typeof event.data === 'string') {
          // Control message
          console.log('📨 Audio WS control message:', event.data)
          return
        }

        // Binary audio data
        const buffer = new Uint8Array(event.data)

        // Parse header (28 bytes)
        const dataView = new DataView(buffer.buffer)
        const timestamp = Number(dataView.getBigUint64(0, true))
        const sampleRate = dataView.getUint32(4, true)
        const channels = dataView.getUint32(8, true)
        const bitDepth = dataView.getUint32(12, true)

        // Extract audio samples (after 28-byte header)
        const audioData = buffer.slice(28)
        const samples = new Int16Array(
          audioData.buffer,
          audioData.byteOffset,
          audioData.byteLength / 2
        )

        // Buffer audio chunks
        audioBufferRef.current.push(samples)

        // Trigger callback if set
        if (onAudioChunkRef.current) {
          onAudioChunkRef.current({
            data: samples,
            sampleRate,
            channels,
            timestamp
          })
        }
      }

      audioWS.onerror = (error) => {
        console.error('❌ Audio WebSocket error:', error)
        setState(prev => ({
          ...prev,
          error: 'Audio WebSocket connection failed'
        }))
      }

      audioWS.onclose = () => {
        console.log('👋 Audio WebSocket closed')
        audioWSRef.current = null
      }

      audioWSRef.current = audioWS

      setState(prev => ({
        ...prev,
        selectedSource: sourceName
      }))

      console.log(`🎤 Started audio capture from: ${sourceName}`)
      return true

    } catch (error) {
      console.error('❌ Failed to start audio capture:', error)
      return false
    }
  }, [host, state.connected])

  // Stop audio capture
  const stopAudioCapture = useCallback(() => {
    if (audioWSRef.current) {
      audioWSRef.current.close()
      audioWSRef.current = null
    }

    audioBufferRef.current = []

    setState(prev => ({
      ...prev,
      selectedSource: null
    }))

    console.log('🛑 Stopped audio capture')
  }, [])

  // Set callback for audio chunks
  const onAudioChunk = useCallback((callback: (chunk: AudioChunk) => void) => {
    onAudioChunkRef.current = callback
  }, [])

  // Get buffered audio as blob (for Whisper API)
  const getAudioBlob = useCallback(async (): Promise<Blob | null> => {
    if (audioBufferRef.current.length === 0) {
      return null
    }

    try {
      // Calculate total length
      const totalLength = audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0)

      // Merge all chunks
      const mergedAudio = new Int16Array(totalLength)
      let offset = 0
      for (const chunk of audioBufferRef.current) {
        mergedAudio.set(chunk, offset)
        offset += chunk.length
      }

      // Clear buffer
      audioBufferRef.current = []

      // Convert to WAV format for Whisper
      const wavBuffer = createWavFile(mergedAudio, 48000, 2)

      return new Blob([wavBuffer], { type: 'audio/wav' })

    } catch (error) {
      console.error('❌ Failed to create audio blob:', error)
      return null
    }
  }, [])

  // Create WAV file from PCM data
  const createWavFile = (samples: Int16Array, sampleRate: number, channels: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, channels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * channels * 2, true) // byte rate
    view.setUint16(32, channels * 2, true) // block align
    view.setUint16(34, 16, true) // bits per sample
    writeString(36, 'data')
    view.setUint32(40, samples.length * 2, true)

    // Write audio data
    const dataOffset = 44
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(dataOffset + i * 2, samples[i], true)
    }

    return buffer
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    // State
    connected: state.connected,
    error: state.error,
    audioSources: state.audioSources,
    selectedSource: state.selectedSource,

    // Methods
    connect,
    disconnect,
    getAudioSources,
    startAudioCapture,
    stopAudioCapture,
    onAudioChunk,
    getAudioBlob
  }
}
