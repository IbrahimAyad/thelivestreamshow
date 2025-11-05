/**
 * Voice Recorder with Effects
 * Records short audio clips with voice effects and saves to soundboard
 */

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Save, Trash2 } from 'lucide-react'
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
  },
  {
    name: 'Cave Troll',
    pitch: -8,
    reverb: 0.8,
    distortion: 0.2,
    description: 'Deep monster voice in a cave'
  },
  {
    name: 'Demon',
    pitch: -7,
    reverb: 0.6,
    distortion: 0.4,
    description: 'Evil demonic voice with distortion'
  },
  {
    name: 'Telephone',
    pitch: 0,
    reverb: 0,
    distortion: 0.15,
    description: 'Old telephone/walkie-talkie sound'
  },
  {
    name: 'Alien',
    pitch: 4,
    reverb: 0.4,
    distortion: 0.2,
    description: 'Otherworldly alien voice'
  },
  {
    name: 'Deep Bass',
    pitch: -10,
    reverb: 0.3,
    distortion: 0.05,
    description: 'Ultra-deep bass voice'
  },
  {
    name: 'Helium',
    pitch: 8,
    reverb: 0.1,
    distortion: 0,
    description: 'Extreme helium balloon voice'
  },
  {
    name: 'Stadium PA',
    pitch: 0,
    reverb: 0.9,
    distortion: 0.1,
    description: 'Announcer in a huge stadium'
  },
  {
    name: 'Underwater',
    pitch: -3,
    reverb: 0.7,
    distortion: 0.05,
    description: 'Muffled underwater sound'
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
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const recordedBlobRef = useRef<Blob | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Web Audio API context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop()
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

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
    if (!recordedBlobRef.current || !audioContextRef.current) return

    try {
      // Stop any currently playing audio
      if (audioSourceRef.current) {
        audioSourceRef.current.stop()
        audioSourceRef.current = null
      }

      // Convert blob to audio buffer
      const arrayBuffer = await recordedBlobRef.current.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)

      // Create source node
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer

      // Apply pitch shift based on preset (semitones to playback rate)
      const pitchShiftFactor = Math.pow(2, selectedPreset.pitch / 12)
      source.playbackRate.value = pitchShiftFactor

      // Create reverb (convolver)
      const convolver = audioContextRef.current.createConvolver()
      const reverbBuffer = createReverbImpulse(audioContextRef.current, 2, selectedPreset.reverb)
      convolver.buffer = reverbBuffer

      // Create distortion (waveshaper)
      const distortion = audioContextRef.current.createWaveShaper()
      distortion.curve = makeDistortionCurve(selectedPreset.distortion * 400)

      // Create gain nodes
      const dryGain = audioContextRef.current.createGain()
      const wetGain = audioContextRef.current.createGain()
      const masterGain = audioContextRef.current.createGain()

      dryGain.gain.value = 1 - selectedPreset.reverb
      wetGain.gain.value = selectedPreset.reverb
      masterGain.gain.value = 0.8

      // Connect chain: source → distortion → [dry + wet(reverb)] → master → destination
      source.connect(distortion)
      distortion.connect(dryGain)
      distortion.connect(convolver)
      convolver.connect(wetGain)
      dryGain.connect(masterGain)
      wetGain.connect(masterGain)
      masterGain.connect(audioContextRef.current.destination)

      // Handle playback end
      source.onended = () => {
        setIsPlaying(false)
        audioSourceRef.current = null
      }

      audioSourceRef.current = source
      setIsPlaying(true)
      source.start(0)

      console.log(`▶️ Playing with ${selectedPreset.name} effect`)
    } catch (error) {
      console.error('Failed to play recording:', error)
      alert('Failed to play recording')
      setIsPlaying(false)
    }
  }

  // Create reverb impulse response
  const createReverbImpulse = (audioContext: AudioContext | OfflineAudioContext, duration: number, decay: number) => {
    const sampleRate = audioContext.sampleRate
    const length = sampleRate * duration
    const impulse = audioContext.createBuffer(2, length, sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const n = length - i
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay * 3)
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay * 3)
    }

    return impulse
  }

  // Create distortion curve
  const makeDistortionCurve = (amount: number) => {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }

    return curve
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

    // Calculate new length based on pitch shift
    const pitchShiftFactor = Math.pow(2, selectedPreset.pitch / 12)
    const newLength = Math.floor(audioBuffer.length / pitchShiftFactor)

    // Create offline context with adjusted length
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      newLength,
      audioBuffer.sampleRate
    )

    // Create source with pitch shift
    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer
    source.playbackRate.value = pitchShiftFactor

    // Create reverb
    const convolver = offlineContext.createConvolver()
    const reverbBuffer = createReverbImpulse(offlineContext, 2, selectedPreset.reverb)
    convolver.buffer = reverbBuffer

    // Create distortion
    const distortion = offlineContext.createWaveShaper()
    distortion.curve = makeDistortionCurve(selectedPreset.distortion * 400)

    // Create gain nodes
    const dryGain = offlineContext.createGain()
    const wetGain = offlineContext.createGain()
    const compressor = offlineContext.createDynamicsCompressor()

    dryGain.gain.value = 1 - selectedPreset.reverb
    wetGain.gain.value = selectedPreset.reverb
    compressor.threshold.value = -20
    compressor.ratio.value = 4

    // Connect: source → distortion → [dry + wet(reverb)] → compressor → destination
    source.connect(distortion)
    distortion.connect(dryGain)
    distortion.connect(convolver)
    convolver.connect(wetGain)
    dryGain.connect(compressor)
    wetGain.connect(compressor)
    compressor.connect(offlineContext.destination)

    // Render
    source.start()
    const renderedBuffer = await offlineContext.startRendering()

    console.log(`✅ Applied ${selectedPreset.name} effect to recording`)

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
        <label className="block text-xs font-medium text-zinc-400 mb-2">VOICE PRESET ({VOICE_PRESETS.length} effects)</label>
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {VOICE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(preset)}
              disabled={isRecording}
              className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
                selectedPreset.name === preset.name
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          <span className="text-purple-400 font-semibold">{selectedPreset.name}:</span> {selectedPreset.description}
        </p>
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
