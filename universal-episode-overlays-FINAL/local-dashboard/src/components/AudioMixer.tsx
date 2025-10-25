import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Music } from 'lucide-react'
import { OBSInput } from '../hooks/useOBSWebSocket'

interface AudioMixerProps {
  inputs: OBSInput[]
  onSetMute: (inputName: string, muted: boolean) => void
  onSetVolume: (inputName: string, volumeDb: number) => void
  getInputVolume: (inputName: string) => Promise<any>
  disabled: boolean
}

interface AudioState {
  inputName: string
  volumeDb: number
  volumeMul: number
  muted: boolean
  level: number // Simulated audio level 0-100
}

export const AudioMixer = ({ inputs, onSetMute, onSetVolume, getInputVolume, disabled }: AudioMixerProps) => {
  const [audioStates, setAudioStates] = useState<Map<string, AudioState>>(new Map())

  // Load initial audio states
  useEffect(() => {
    const loadAudioStates = async () => {
      const newStates = new Map<string, AudioState>()
      for (const input of inputs) {
        const volumeData = await getInputVolume(input.inputName)
        if (volumeData) {
          newStates.set(input.inputName, {
            inputName: input.inputName,
            volumeDb: volumeData.volumeDb,
            volumeMul: volumeData.volumeMul,
            muted: volumeData.inputMuted,
            level: Math.random() * 100 // Simulated level
          })
        }
      }
      setAudioStates(newStates)
    }

    if (inputs.length > 0) {
      loadAudioStates()
    }
  }, [inputs, getInputVolume])

  // Simulate realistic audio levels based on volume settings
  // Note: OBS WebSocket 5.x does not provide real-time audio level events
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioStates(prev => {
        const newStates = new Map(prev)
        newStates.forEach((state, key) => {
          if (!state.muted && state.volumeMul > 0) {
            // Simulate more realistic audio with:
            // - Base level proportional to volume setting
            // - Random variation for natural movement
            // - Occasional peaks
            const baseLevel = state.volumeMul * 70 // 0-70% range based on volume
            const variation = (Math.random() - 0.5) * 20 // ±10% variation
            const occasionalPeak = Math.random() > 0.9 ? 15 : 0 // 10% chance of peak
            const simulatedLevel = Math.max(0, Math.min(100, baseLevel + variation + occasionalPeak))
            
            newStates.set(key, {
              ...state,
              level: simulatedLevel
            })
          } else {
            newStates.set(key, { ...state, level: 0 })
          }
        })
        return newStates
      })
    }, 80) // Faster update for smoother animation

    return () => clearInterval(interval)
  }, [])

  const handleVolumeChange = async (inputName: string, value: number) => {
    // Convert 0-100 slider to dB (-60 to 0)
    const volumeDb = (value / 100) * 60 - 60
    await onSetVolume(inputName, volumeDb)
    
    setAudioStates(prev => {
      const newStates = new Map(prev)
      const state = newStates.get(inputName)
      if (state) {
        newStates.set(inputName, { ...state, volumeDb, volumeMul: value / 100 })
      }
      return newStates
    })
  }

  const handleMuteToggle = async (inputName: string) => {
    const state = audioStates.get(inputName)
    if (!state) return
    
    const newMuted = !state.muted
    await onSetMute(inputName, newMuted)
    
    setAudioStates(prev => {
      const newStates = new Map(prev)
      newStates.set(inputName, { ...state, muted: newMuted })
      return newStates
    })
  }

  const getAudioLevelColor = (level: number) => {
    if (level > 80) return 'bg-red-500'
    if (level > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const audioInputs = inputs.filter(input => 
    input.inputKind.includes('audio') || 
    input.inputKind.includes('capture') ||
    input.inputName.toLowerCase().includes('mic') ||
    input.inputName.toLowerCase().includes('audio') ||
    input.inputName.toLowerCase().includes('discord')
  )

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Music className="w-5 h-5" />
          Audio Mixer
        </h2>
        <div className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/30">
          Levels: Simulated
        </div>
      </div>
      <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
        <p><strong>Note:</strong> OBS WebSocket 5.x does not provide real-time audio level monitoring. Audio meters show simulated levels based on volume settings. Use OBS Studio&apos;s built-in audio mixer for accurate level monitoring.</p>
      </div>

      {audioInputs.length === 0 && (
        <p className="text-gray-500 text-sm">No audio sources detected. Connect to OBS first.</p>
      )}

      <div className="space-y-4">
        {audioInputs.map((input) => {
          const state = audioStates.get(input.inputName)
          const volumePercent = state ? Math.round(((state.volumeDb + 60) / 60) * 100) : 50
          const level = state?.level || 0

          return (
            <div key={input.inputUuid} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMuteToggle(input.inputName)}
                    disabled={disabled}
                    className={`p-2 rounded transition-colors ${
                      state?.muted
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {state?.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div>
                    <p className="text-white font-semibold text-sm">{input.inputName}</p>
                    <p className="text-gray-500 text-xs">{input.inputKind}</p>
                  </div>
                </div>
                <span className="text-white font-mono text-sm">{volumePercent}%</span>
              </div>

              {/* Audio Level Meter */}
              <div className="mb-2 h-3 bg-[#0a0a0a] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${getAudioLevelColor(level)}`}
                  style={{ width: `${level}%` }}
                />
              </div>

              {/* Volume Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={volumePercent}
                onChange={(e) => handleVolumeChange(input.inputName, parseInt(e.target.value))}
                disabled={disabled || state?.muted}
                className="w-full h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volumePercent}%, #0a0a0a ${volumePercent}%, #0a0a0a 100%)`
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
