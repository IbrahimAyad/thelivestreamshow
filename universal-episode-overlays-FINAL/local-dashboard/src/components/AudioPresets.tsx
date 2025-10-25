import { useState, useEffect } from 'react'
import { Volume2, Save, Trash2, Plus, Check } from 'lucide-react'
import OBSWebSocket from 'obs-websocket-js'
import { supabase } from '../lib/supabase'

interface AudioPresetsProps {
  obs: OBSWebSocket
  connected: boolean
  inputs: any[]
}

interface AudioPreset {
  id: string
  name: string
  description: string
  config: Record<string, number>
  is_active?: boolean
}

const DEFAULT_PRESETS: Omit<AudioPreset, 'id'>[] = [
  {
    name: 'Solo Host',
    description: 'Host microphone at normal level, all others muted',
    config: { 'Host Mic': 0, 'Guest 1': -100, 'Guest 2': -100, 'Music': -100 },
    is_active: false
  },
  {
    name: 'Panel Discussion',
    description: 'All microphones balanced at -3dB',
    config: { 'Host Mic': -3, 'Guest 1': -3, 'Guest 2': -3, 'Music': -100 },
    is_active: false
  },
  {
    name: 'Video Reaction',
    description: 'Host at -2dB, video at -6dB, guests lowered',
    config: { 'Host Mic': -2, 'Video Audio': -6, 'Guest 1': -10, 'Guest 2': -10, 'Music': -100 },
    is_active: false
  },
  {
    name: 'Interview',
    description: 'Host and Guest 1 balanced, others background',
    config: { 'Host Mic': -3, 'Guest 1': -3, 'Guest 2': -20, 'Music': -100 },
    is_active: false
  },
  {
    name: 'Music Break',
    description: 'All mics muted, music at full volume',
    config: { 'Host Mic': -100, 'Guest 1': -100, 'Guest 2': -100, 'Music': 0 },
    is_active: false
  }
]

export function AudioPresets({ obs, connected, inputs }: AudioPresetsProps) {
  const [presets, setPresets] = useState<AudioPreset[]>([])
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDesc, setNewPresetDesc] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_presets')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        // Create default presets if none exist
        await createDefaultPresets()
      } else {
        setPresets(data as unknown as AudioPreset[])
      }
    } catch (err) {
      console.error('Failed to load presets:', err)
    }
  }

  const createDefaultPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_presets')
        .insert(DEFAULT_PRESETS)
        .select()

      if (error) throw error
      if (data) {
        setPresets(data as unknown as AudioPreset[])
      }
    } catch (err) {
      console.error('Failed to create default presets:', err)
    }
  }

  const applyPreset = async (preset: AudioPreset) => {
    if (!connected) {
      alert('Please connect to OBS first')
      return
    }

    setLoading(true)
    try {
      // Apply each audio level from the preset
      for (const [sourceName, volumeDb] of Object.entries(preset.config)) {
        // Check if source exists in current inputs
        const sourceExists = inputs.some(input => input.inputName === sourceName)
        if (sourceExists) {
          try {
            await obs.call('SetInputVolume', {
              inputName: sourceName,
              inputVolumeDb: volumeDb
            })
            // Mute if volume is -100 or less
            await obs.call('SetInputMute', {
              inputName: sourceName,
              inputMuted: volumeDb <= -100
            })
          } catch (err) {
            console.warn(`Failed to set volume for ${sourceName}:`, err)
          }
        }
      }
      setActivePresetId(preset.id)
      
      // Show success message
      const tempDiv = document.createElement('div')
      tempDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50'
      tempDiv.textContent = `✓ Applied preset: ${preset.name}`
      document.body.appendChild(tempDiv)
      setTimeout(() => tempDiv.remove(), 3000)
    } catch (err: any) {
      alert('Failed to apply preset: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentAsPreset = async () => {
    if (!connected || !newPresetName.trim()) return

    setLoading(true)
    try {
      // Get current audio levels for all inputs
      const config: Record<string, number> = {}
      
      for (const input of inputs) {
        try {
          const volumeData = await obs.call('GetInputVolume', { inputName: input.inputName })
          config[input.inputName] = (volumeData as any).inputVolumeDb
        } catch (err) {
          console.warn(`Failed to get volume for ${input.inputName}:`, err)
        }
      }

      const { data, error } = await supabase
        .from('audio_presets')
        .insert({
          name: newPresetName.trim(),
          description: newPresetDesc.trim(),
          config: config,
          is_default: false
        })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setPresets([...presets, data[0] as unknown as AudioPreset])
        setShowSaveModal(false)
        setNewPresetName('')
        setNewPresetDesc('')
      }
    } catch (err: any) {
      alert('Failed to save preset: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const deletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return

    try {
      const { error } = await supabase
        .from('audio_presets')
        .delete()
        .eq('id', presetId)

      if (error) throw error

      setPresets(presets.filter(p => p.id !== presetId))
      if (activePresetId === presetId) {
        setActivePresetId(null)
      }
    } catch (err: any) {
      alert('Failed to delete preset: ' + err.message)
    }
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Audio Presets
        </h2>
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={!connected || loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Save Current
        </button>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={`bg-[#1a1a1a] rounded p-4 border-2 transition-all ${
              activePresetId === preset.id
                ? 'border-purple-600 shadow-lg shadow-purple-900/50'
                : 'border-[#3a3a3a] hover:border-[#4a4a4a]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  {preset.name}
                  {activePresetId === preset.id && (
                    <span className="bg-purple-600 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">{preset.description}</div>
              </div>
              <button
                onClick={() => deletePreset(preset.id)}
                className="text-red-400 hover:text-red-300 p-1"
                title="Delete preset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Config Preview */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              {Object.entries(preset.config).slice(0, 4).map(([source, db]) => (
                <div key={source} className="flex justify-between text-gray-400">
                  <span className="truncate">{source}:</span>
                  <span className="font-mono">{db <= -100 ? 'MUTED' : `${db}dB`}</span>
                </div>
              ))}
            </div>

            {/* Apply Button */}
            <button
              onClick={() => applyPreset(preset)}
              disabled={!connected || loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 rounded font-semibold transition-colors"
            >
              Apply Preset
            </button>
          </div>
        ))}
      </div>

      {presets.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No presets available. Create one to get started!
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Save Current Audio as Preset</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Preset Name</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  placeholder="e.g., My Custom Mix"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description (Optional)</label>
                <textarea
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 h-20"
                  placeholder="Describe when to use this preset..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveCurrentAsPreset}
                  disabled={!newPresetName.trim() || loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 rounded font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Preset
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false)
                    setNewPresetName('')
                    setNewPresetDesc('')
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
