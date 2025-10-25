import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Settings, Save } from 'lucide-react'
import type { StreamProfile } from '../../lib/supabase'

type QualityPreset = {
  name: string
  resolution: string
  bitrate: number
  fps: number
}

const defaultPresets: QualityPreset[] = [
  { name: 'Low (720p)', resolution: '1280x720', bitrate: 2500, fps: 30 },
  { name: 'Medium (1080p)', resolution: '1920x1080', bitrate: 4500, fps: 30 },
  { name: 'High (1440p)', resolution: '2560x1440', bitrate: 8000, fps: 60 },
  { name: 'Ultra (4K)', resolution: '3840x2160', bitrate: 15000, fps: 60 }
]

export function QualityPresets() {
  const [selectedPreset, setSelectedPreset] = useState<QualityPreset>(defaultPresets[1])
  const [customPresets, setCustomPresets] = useState<StreamProfile[]>([])
  const [customResolution, setCustomResolution] = useState('1920x1080')
  const [customBitrate, setCustomBitrate] = useState(4500)
  const [customFps, setCustomFps] = useState(30)
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    loadCustomPresets()
  }, [])

  const loadCustomPresets = async () => {
    const { data } = await supabase
      .from('stream_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setCustomPresets(data as StreamProfile[])
  }

  const applyPreset = (preset: QualityPreset) => {
    setSelectedPreset(preset)
    // Quality preset applied
    alert(`Quality preset "${preset.name}" applied!`)
  }

  const saveCustomPreset = async () => {
    if (!customName.trim()) {
      alert('Please enter a preset name')
      return
    }

    const qualityConfig = {
      resolution: customResolution,
      bitrate: customBitrate,
      fps: customFps
    }

    await supabase
      .from('stream_profiles')
      .insert({
        name: customName,
        quality_config: qualityConfig,
        scene_config: {},
        audio_config: {},
        source_config: {}
      })

    loadCustomPresets()
    setCustomName('')
    alert('Custom preset saved!')
  }

  const calculateBitrate = (width: number, height: number, fps: number): number => {
    const pixels = width * height
    const baseRate = pixels * fps * 0.1 / 1000
    return Math.round(baseRate)
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-green-500" />
        Stream Quality Presets
      </h2>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {defaultPresets.map(preset => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedPreset.name === preset.name
                ? 'bg-green-600/20 border-green-500'
                : 'bg-[#1a1a1a] border-[#3a3a3a] hover:border-green-500/50'
            }`}
          >
            <div className="font-bold mb-2">{preset.name}</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>{preset.resolution}</div>
              <div>{preset.bitrate} kbps</div>
              <div>{preset.fps} FPS</div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] mb-6">
        <h3 className="font-bold mb-4">Custom Quality Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Resolution</label>
            <select
              value={customResolution}
              onChange={(e) => setCustomResolution(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded"
            >
              <option value="1280x720">1280x720 (720p)</option>
              <option value="1920x1080">1920x1080 (1080p)</option>
              <option value="2560x1440">2560x1440 (1440p)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Frame Rate</label>
            <select
              value={customFps}
              onChange={(e) => setCustomFps(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded"
            >
              <option value="24">24 FPS</option>
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Bitrate (kbps)</label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={customBitrate}
              onChange={(e) => setCustomBitrate(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-400 mt-1">{customBitrate} kbps</div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Preset Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="My Custom Preset"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded"
              />
              <button
                onClick={saveCustomPreset}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded">
        <div className="font-semibold mb-2">Current Settings</div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Resolution</div>
            <div className="font-semibold">{selectedPreset.resolution}</div>
          </div>
          <div>
            <div className="text-gray-400">Bitrate</div>
            <div className="font-semibold">{selectedPreset.bitrate} kbps</div>
          </div>
          <div>
            <div className="text-gray-400">Frame Rate</div>
            <div className="font-semibold">{selectedPreset.fps} FPS</div>
          </div>
        </div>
      </div>
    </div>
  )
}
