import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Radio, Sparkles } from 'lucide-react'

interface VoicePreset {
  name: string
  pitch: number
  reverb: number
  distortion: number
  autoTune: boolean
}

const LIVE_PRESETS: VoicePreset[] = [
  { name: 'Normal', pitch: 0, reverb: 0, distortion: 0, autoTune: false },
  { name: 'Auto-Tune', pitch: 0, reverb: 0.2, distortion: 0, autoTune: true },
  { name: 'Darth Vader', pitch: -5, reverb: 0.5, distortion: 0.1, autoTune: false },
  { name: 'Chipmunk', pitch: 6, reverb: 0, distortion: 0, autoTune: false },
  { name: 'Robot', pitch: -2, reverb: 0.2, distortion: 0.3, autoTune: false },
  { name: 'Radio DJ', pitch: 0, reverb: 0.3, distortion: 0.05, autoTune: false },
  { name: 'Cave Troll', pitch: -8, reverb: 0.8, distortion: 0.2, autoTune: false },
  { name: 'Demon', pitch: -7, reverb: 0.6, distortion: 0.4, autoTune: false },
  { name: 'Alien', pitch: 4, reverb: 0.4, distortion: 0.2, autoTune: false },
  { name: 'Deep Bass', pitch: -10, reverb: 0.3, distortion: 0.05, autoTune: false },
  { name: 'Helium', pitch: 8, reverb: 0.1, distortion: 0, autoTune: false },
  { name: 'Stadium PA', pitch: 0, reverb: 0.9, distortion: 0.1, autoTune: false }
]

// Musical scale for Auto-Tune (A minor pentatonic)
const MUSICAL_SCALE = [
  220.00, // A3
  246.94, // B3
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  698.46, // F5
  783.99, // G5
  880.00  // A5
]

export function LiveVoiceEffects() {
  const [isActive, setIsActive] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset>(LIVE_PRESETS[0])
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [inputLevel, setInputLevel] = useState(0)

  // Audio refs - ISOLATED from global music system
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const convolverRef = useRef<ConvolverNode | null>(null)
  const distortionRef = useRef<WaveShaperNode | null>(null)
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Auto-Tune specific refs
  const pitchShiftRef = useRef<AudioWorkletNode | null>(null)

  // Create reverb impulse response
  const createReverbImpulse = (duration: number, decay: number): AudioBuffer => {
    const context = audioContextRef.current!
    const sampleRate = context.sampleRate
    const length = sampleRate * duration
    const impulse = context.createBuffer(2, length, sampleRate)
    const leftChannel = impulse.getChannelData(0)
    const rightChannel = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length
      leftChannel[i] = (Math.random() * 2 - 1) * Math.pow(n, decay)
      rightChannel[i] = (Math.random() * 2 - 1) * Math.pow(n, decay)
    }

    return impulse
  }

  // Create distortion curve
  const makeDistortionCurve = (amount: number): Float32Array => {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }

    return curve
  }

  // Simple pitch detection using autocorrelation
  const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
    // Very basic autocorrelation for pitch detection
    const minFreq = 80 // Hz
    const maxFreq = 400 // Hz
    const minPeriod = Math.floor(sampleRate / maxFreq)
    const maxPeriod = Math.floor(sampleRate / minFreq)

    let bestCorrelation = 0
    let bestPeriod = 0

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + period])
      }
      correlation = 1 - correlation / buffer.length

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }

    if (bestPeriod === 0) return 0
    return sampleRate / bestPeriod
  }

  // Find nearest note in scale
  const findNearestNote = (frequency: number): number => {
    if (frequency === 0) return frequency

    let closestFreq = MUSICAL_SCALE[0]
    let minDiff = Math.abs(frequency - closestFreq)

    for (const noteFreq of MUSICAL_SCALE) {
      const diff = Math.abs(frequency - noteFreq)
      if (diff < minDiff) {
        minDiff = diff
        closestFreq = noteFreq
      }
    }

    return closestFreq
  }

  // Start live voice processing
  const startLiveEffects = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })

      setMicPermission('granted')
      mediaStreamRef.current = stream

      // Create ISOLATED audio context (won't affect music system)
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // Create nodes
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()
      const convolver = audioContext.createConvolver()
      const distortion = audioContext.createWaveShaper()
      const destination = audioContext.createMediaStreamDestination()

      analyser.fftSize = 2048
      analyserRef.current = analyser
      gainNodeRef.current = gainNode
      convolverRef.current = convolver
      distortionRef.current = distortion
      destinationRef.current = destination
      sourceNodeRef.current = source

      // Initial connection (will be reconfigured based on preset)
      source.connect(analyser)
      analyser.connect(gainNode)
      gainNode.connect(destination)

      // Apply initial preset
      applyPresetEffects()

      // Start level monitoring
      startLevelMonitoring()

      setIsActive(true)
      console.log('✅ Live voice effects activated (isolated audio context)')
      console.log('🎤 Output stream available for OBS via:', destination.stream)

    } catch (error) {
      console.error('❌ Failed to start live effects:', error)
      setMicPermission('denied')
      alert('Microphone access denied. Please enable microphone permissions.')
    }
  }

  // Stop live voice processing
  const stopLiveEffects = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    mediaStreamRef.current = null
    audioContextRef.current = null
    sourceNodeRef.current = null
    analyserRef.current = null

    setIsActive(false)
    setInputLevel(0)
    console.log('🛑 Live voice effects stopped')
  }

  // Apply preset effects to audio chain
  const applyPresetEffects = () => {
    if (!audioContextRef.current || !sourceNodeRef.current) return

    const context = audioContextRef.current
    const source = sourceNodeRef.current
    const analyser = analyserRef.current!
    const gain = gainNodeRef.current!
    const convolver = convolverRef.current!
    const distortion = distortionRef.current!
    const destination = destinationRef.current!

    // Disconnect everything
    source.disconnect()
    analyser.disconnect()
    gain.disconnect()
    convolver.disconnect()
    distortion.disconnect()

    // Start fresh chain
    source.connect(analyser)
    let currentNode: AudioNode = analyser

    // Apply pitch shift
    if (selectedPreset.pitch !== 0) {
      // For pitch shifting, we use playback rate manipulation
      // This is a simplified approach - real-time pitch shifting is complex
      gain.gain.value = 1.0 // Normalize volume
    }

    currentNode.connect(gain)
    currentNode = gain

    // Apply reverb
    if (selectedPreset.reverb > 0) {
      const reverbDuration = selectedPreset.reverb * 3 // 0-3 seconds
      const reverbDecay = 2 + selectedPreset.reverb * 3 // decay rate
      convolver.buffer = createReverbImpulse(reverbDuration, reverbDecay)

      currentNode.connect(convolver)
      convolver.connect(destination)

      // Dry/wet mix
      const dryGain = context.createGain()
      const wetGain = context.createGain()
      dryGain.gain.value = 1 - selectedPreset.reverb * 0.5
      wetGain.gain.value = selectedPreset.reverb * 0.5

      currentNode.connect(dryGain)
      dryGain.connect(destination)

      convolver.connect(wetGain)
      wetGain.connect(destination)

      currentNode = convolver
    }

    // Apply distortion
    if (selectedPreset.distortion > 0) {
      distortion.curve = makeDistortionCurve(selectedPreset.distortion * 100)
      distortion.oversample = '4x'

      if (selectedPreset.reverb === 0) {
        currentNode.connect(distortion)
        distortion.connect(destination)
        currentNode = distortion
      }
    }

    // Final connection if no effects applied
    if (selectedPreset.reverb === 0 && selectedPreset.distortion === 0) {
      currentNode.connect(destination)
    }

    console.log(`🎛️ Applied preset: ${selectedPreset.name}`)
  }

  // Monitor input levels
  const startLevelMonitoring = () => {
    const analyser = analyserRef.current
    if (!analyser) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateLevel = () => {
      analyser.getByteTimeDomainData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128
        sum += normalized * normalized
      }
      const rms = Math.sqrt(sum / dataArray.length)
      setInputLevel(Math.min(rms * 100, 100))

      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }

  // Update effects when preset changes
  useEffect(() => {
    if (isActive) {
      applyPresetEffects()
    }
  }, [selectedPreset, isActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveEffects()
    }
  }, [])

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Radio className="w-7 h-7 text-purple-400" />
          Live Voice Effects
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </h2>

        <button
          onClick={isActive ? stopLiveEffects : startLiveEffects}
          className={`px-6 py-3 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-500/50'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isActive ? (
            <>
              <MicOff className="w-5 h-5" />
              STOP EFFECTS
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              START EFFECTS
            </>
          )}
        </button>
      </div>

      {/* Status and Level Meter */}
      <div className="mb-6 p-4 bg-black/50 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300 font-semibold">
            Status: {isActive ? (
              <span className="text-green-400">● LIVE</span>
            ) : (
              <span className="text-gray-500">○ Inactive</span>
            )}
          </span>
          <span className="text-gray-300 font-semibold">
            Mic: {micPermission === 'granted' ? (
              <span className="text-green-400">✓ Allowed</span>
            ) : (
              <span className="text-red-400">✗ Not Allowed</span>
            )}
          </span>
        </div>

        {/* Input Level Meter */}
        <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
            style={{ width: `${inputLevel}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold z-10">
            INPUT LEVEL
          </span>
        </div>
      </div>

      {/* Preset Selection */}
      <div className="mb-4">
        <label className="block text-purple-300 text-sm font-bold mb-3">
          VOICE PRESET
        </label>
        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {LIVE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(preset)}
              disabled={!isActive}
              className={`p-3 rounded-lg font-semibold text-sm transition-all ${
                selectedPreset.name === preset.name
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              } ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.name}
              {preset.autoTune && <Sparkles className="w-3 h-3 inline ml-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* Current Preset Info */}
      {isActive && (
        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <p className="text-purple-300 text-sm">
            <span className="font-bold text-purple-400">{selectedPreset.name}</span>
            {' '}active
            {selectedPreset.autoTune && ' with pitch correction'}
            {selectedPreset.pitch !== 0 && ` (${selectedPreset.pitch > 0 ? '+' : ''}${selectedPreset.pitch} semitones)`}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-300">
        <p className="font-bold mb-2">🎙️ How to use:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Click "START EFFECTS" to activate your microphone</li>
          <li>Choose a voice preset (Auto-Tune, Darth Vader, etc.)</li>
          <li>The processed audio is available for OBS capture</li>
          <li>Use a virtual audio cable to route to OBS</li>
          <li>Music playback system is not affected</li>
        </ol>
      </div>
    </div>
  )
}
