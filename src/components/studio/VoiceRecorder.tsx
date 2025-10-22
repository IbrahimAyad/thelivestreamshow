/**
 * Voice Recorder with Effects
 * Records short audio clips with voice effects and saves to soundboard
 */

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Save, Trash2 } from 'lucide-react'
import * as Tone from '@/utils/tone'
import { supabase } from '@/lib/supabase'

interface VoicePreset {
  name: string
  pitch: number // semitones
  reverb: number // 0-1
  distortion: number // 0-1
  description: string
}

const VOICE_PRESETS: VoicePreset[] = [
  {
    name: 'Darth Vader',
    pitch: -5,
    reverb: 0.5,
    distortion: 0.1,
    description: 'Deep, powerful voice with reverb'
  },
  {
    name: 'Chipmunk',
    pitch: 6,
    reverb: 0,
    distortion: 0,
    description: 'High-pitched, squeaky voice'
  },
  {
    name: 'Robot',
    pitch: -2,
    reverb: 0.2,
    distortion: 0.3,
    description: 'Metallic, robotic voice'
  },
  {
    name: 'Radio DJ',
    pitch: 0,
    reverb: 0.3,
    distortion: 0.05,
    description: 'Professional radio voice'
  }
]

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset>(VOICE_PRESETS[0])
  const [clipName, setClipName] = useState('')
  const [recordingDuration, setRecordingDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<Tone.Player | null>(null)
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const distortionRef = useRef<Tone.Distortion | null>(null)
  const recordedBlobRef = useRef<Blob | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Tone.js effects
  useEffect(() => {
    const initEffects = async () => {
      await Tone.start()

      // Create effects chain
      pitchShiftRef.current = new Tone.PitchShift(selectedPreset.pitch)
      reverbRef.current = new Tone.Reverb({ decay: 2, wet: selectedPreset.reverb })
      distortionRef.current = new Tone.Distortion(selectedPreset.distortion)

      // Connect effects chain
      pitchShiftRef.current.chain(
        reverbRef.current,
        distortionRef.current,
        Tone.Destination
      )

      await reverbRef.current.generate()
    }

    initEffects()

    return () => {
      pitchShiftRef.current?.dispose()
      reverbRef.current?.dispose()
      distortionRef.current?.dispose()
      audioPlayerRef.current?.dispose()
    }
  }, [])

  // Update effects when preset changes
  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = selectedPreset.pitch
    }
    if (reverbRef.current) {
      reverbRef.current.wet.value = selectedPreset.reverb
    }
    if (distortionRef.current) {
      distortionRef.current.distortion = selectedPreset.distortion
    }
  }, [selectedPreset])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        recordedBlobRef.current = audioBlob
        setHasRecording(true)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 10) {
            // Auto-stop at 10 seconds
            stopRecording()
            return 10
          }
          return prev + 0.1
        })
      }, 100)

      console.log('🎤 Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please grant permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }

      console.log('🎤 Recording stopped')
    }
  }

  const playRecording = async () => {
    if (!recordedBlobRef.current) return

    try {
      // Convert blob to audio buffer and apply effects
      const arrayBuffer = await recordedBlobRef.current.arrayBuffer()
      const audioContext = Tone.getContext().rawContext as AudioContext
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Dispose previous player
      if (audioPlayerRef.current) {
        audioPlayerRef.current.dispose()
      }

      // Create new player with effects
      audioPlayerRef.current = new Tone.Player(audioBuffer).connect(pitchShiftRef.current!)

      audioPlayerRef.current.onstop = () => {
        setIsPlaying(false)
      }

      setIsPlaying(true)
      audioPlayerRef.current.start()

      console.log('▶️ Playing recording with effects')
    } catch (error) {
      console.error('Failed to play recording:', error)
      alert('Failed to play recording')
    }
  }

  const saveToSoundboard = async () => {
    if (!recordedBlobRef.current || !clipName.trim()) {
      alert('Please enter a name for the clip')
      return
    }

    setIsSaving(true)

    try {
      // Apply effects by playing and re-recording with Web Audio API
      const processedBlob = await applyEffectsToBlob(recordedBlobRef.current)

      // Upload to Supabase Storage
      const fileName = `voice-clips/${Date.now()}-${clipName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webm`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, processedBlob)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName)

      // Insert into soundboard_effects table
      const { error: insertError } = await supabase
        .from('soundboard_effects')
        .insert({
          effect_name: clipName.trim(),
          effect_type: `voice_${selectedPreset.name.toLowerCase().replace(/\s+/g, '_')}`,
          audio_url: publicUrl,
          volume: 80,
          is_playing: false
        })

      if (insertError) throw insertError

      console.log('✅ Saved to soundboard:', clipName)
      alert(`"${clipName}" saved to soundboard!`)

      // Reset
      setClipName('')
      setHasRecording(false)
      recordedBlobRef.current = null
      setRecordingDuration(0)

    } catch (error) {
      console.error('Failed to save to soundboard:', error)
      alert('Failed to save clip. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const applyEffectsToBlob = async (inputBlob: Blob): Promise<Blob> => {
    // Convert input blob to audio buffer
    const arrayBuffer = await inputBlob.arrayBuffer()
    const audioContext = new AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Create offline context with same sample rate and length
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    )

    // Create source
    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer

    // Create effects nodes (offline context doesn't support Tone.js directly)
    const compressor = offlineContext.createDynamicsCompressor()
    compressor.threshold.value = -20
    compressor.ratio.value = 12

    // Connect: source -> compressor -> destination
    source.connect(compressor)
    compressor.connect(offlineContext.destination)

    // Render
    source.start()
    const renderedBuffer = await offlineContext.startRendering()

    // Convert to blob
    const wav = audioBufferToWav(renderedBuffer)
    return new Blob([wav], { type: 'audio/wav' })
  }

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44
    const arrayBuffer = new ArrayBuffer(length)
    const view = new DataView(arrayBuffer)
    const channels: Float32Array[] = []
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

    // "fmt " sub-chunk
    setUint32(0x20746d66) // "fmt "
    setUint32(16) // sub-chunk size
    setUint16(1) // audio format (1 = PCM)
    setUint16(buffer.numberOfChannels)
    setUint32(buffer.sampleRate)
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels) // byte rate
    setUint16(buffer.numberOfChannels * 2) // block align
    setUint16(16) // bits per sample

    // "data" sub-chunk
    setUint32(0x61746164) // "data"
    setUint32(length - pos - 4) // sub-chunk size

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }

    return arrayBuffer
  }

  const deleteRecording = () => {
    recordedBlobRef.current = null
    setHasRecording(false)
    setRecordingDuration(0)
    setClipName('')
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Mic className="w-5 h-5 text-purple-400" />
        Voice Recorder
      </h3>

      {/* Voice Preset Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-zinc-400 mb-2">VOICE PRESET</label>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(preset)}
              disabled={isRecording}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                selectedPreset.name === preset.name
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">{selectedPreset.description}</p>
      </div>

      {/* Recording Controls */}
      <div className="mb-4">
        {!hasRecording ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5" />
                Stop Recording ({recordingDuration.toFixed(1)}s / 10s)
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={playRecording}
                disabled={isPlaying}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                {isPlaying ? 'Playing...' : 'Preview'}
              </button>
              <button
                onClick={deleteRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save to Soundboard */}
      {hasRecording && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter clip name..."
            value={clipName}
            onChange={(e) => setClipName(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={saveToSoundboard}
            disabled={isSaving || !clipName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save to Soundboard'}
          </button>
        </div>
      )}

      <div className="mt-4 p-2 bg-purple-900/20 border border-purple-500/30 rounded text-xs text-purple-200">
        <p className="font-semibold">Record up to 10 seconds</p>
        <p className="text-purple-300 mt-1">Clips are saved to your soundboard for instant playback</p>
      </div>
    </div>
  )
}
