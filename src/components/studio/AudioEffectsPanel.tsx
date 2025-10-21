import { useState, useEffect } from 'react'
import { Sliders, RotateCcw, Save } from 'lucide-react'
import type { AudioEffectsConfig, EffectPreset, MusicTrack } from '@/types/database'
import { EFFECT_PRESETS, DEFAULT_EFFECTS } from '@/utils/audioEffects'
import { supabase } from '@/lib/supabase'

interface AudioEffectsPanelProps {
  track: MusicTrack | null
  onEffectsChange: (effects: AudioEffectsConfig) => void
  onSaveVariation?: (variationName: string, effects: AudioEffectsConfig) => Promise<void>
}

export function AudioEffectsPanel({
  track,
  onEffectsChange,
  onSaveVariation,
}: AudioEffectsPanelProps) {
  const [effects, setEffects] = useState<AudioEffectsConfig>(DEFAULT_EFFECTS)
  const [selectedPreset, setSelectedPreset] = useState<string>('Custom')
  const [variationName, setVariationName] = useState('')
  const [saving, setSaving] = useState(false)

  // Load track effects settings
  useEffect(() => {
    if (track?.effects_settings) {
      try {
        const savedEffects = typeof track.effects_settings === 'string' 
          ? JSON.parse(track.effects_settings)
          : track.effects_settings
        setEffects({ ...DEFAULT_EFFECTS, ...savedEffects })
        setSelectedPreset('Custom')
      } catch (e) {
        setEffects(DEFAULT_EFFECTS)
      }
    } else {
      setEffects(DEFAULT_EFFECTS)
    }
  }, [track])

  const handleEffectChange = (key: keyof AudioEffectsConfig, value: number) => {
    const newEffects = { ...effects, [key]: value }
    setEffects(newEffects)
    setSelectedPreset('Custom')
    onEffectsChange(newEffects)
  }

  const handlePresetSelect = (preset: EffectPreset) => {
    setEffects(preset.config)
    setSelectedPreset(preset.name)
    onEffectsChange(preset.config)
  }

  const handleReset = () => {
    setEffects(DEFAULT_EFFECTS)
    setSelectedPreset('Custom')
    onEffectsChange(DEFAULT_EFFECTS)
  }

  const handleSaveToTrack = async () => {
    if (!track) return
    
    try {
      await supabase
        .from('music_library')
        .update({ effects_settings: effects })
        .eq('id', track.id)
      
      alert('Effects settings saved to track!')
    } catch (error) {
      console.error('Failed to save effects:', error)
      alert('Failed to save effects settings')
    }
  }

  const handleSaveVariation = async () => {
    if (!track || !variationName.trim() || !onSaveVariation) return
    
    setSaving(true)
    try {
      await onSaveVariation(variationName.trim(), effects)
      setVariationName('')
      alert('Variation saved successfully!')
    } catch (error) {
      console.error('Failed to save variation:', error)
      alert('Failed to save variation')
    } finally {
      setSaving(false)
    }
  }

  if (!track) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold">Audio Effects</h3>
        </div>
        <p className="text-neutral-400 text-sm text-center py-8">
          Select a track to apply effects
        </p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold">Audio Effects</h3>
        </div>
        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-neutral-800 transition-colors"
          title="Reset to default"
        >
          <RotateCcw className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-neutral-400 mb-2">
          EFFECT PRESETS
        </label>
        <div className="grid grid-cols-3 gap-2">
          {EFFECT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                selectedPreset === preset.name
                  ? 'bg-primary-600 text-neutral-100'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Effect Controls */}
      <div className="space-y-4">
        {/* Reverb */}
        <div>
          <div className="flex justify-between text-xs font-medium text-neutral-400 mb-1">
            <span>Reverb</span>
            <span>{(effects.reverb * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.reverb}
            onChange={(e) => handleEffectChange('reverb', parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Delay/Echo */}
        <div>
          <div className="flex justify-between text-xs font-medium text-neutral-400 mb-1">
            <span>Delay/Echo</span>
            <span>{effects.delay.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.delay}
            onChange={(e) => handleEffectChange('delay', parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Bass Boost */}
        <div>
          <div className="flex justify-between text-xs font-medium text-neutral-400 mb-1">
            <span>Bass Boost</span>
            <span>{effects.bassBoost.toFixed(1)} dB</span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={effects.bassBoost}
            onChange={(e) => handleEffectChange('bassBoost', parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Treble Boost */}
        <div>
          <div className="flex justify-between text-xs font-medium text-neutral-400 mb-1">
            <span>Treble Boost</span>
            <span>{effects.trebleBoost.toFixed(1)} dB</span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={effects.trebleBoost}
            onChange={(e) => handleEffectChange('trebleBoost', parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Distortion */}
        <div>
          <div className="flex justify-between text-xs font-medium text-neutral-400 mb-1">
            <span>Distortion</span>
            <span>{(effects.distortion * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.distortion}
            onChange={(e) => handleEffectChange('distortion', parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Compression */}
        <div>
          <div className="flex justify-between text-xs font-medium text-neutral-400 mb-1">
            <span>Compression</span>
            <span>{(effects.compression * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.compression}
            onChange={(e) => handleEffectChange('compression', parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Save Actions */}
      <div className="mt-4 pt-4 border-t border-neutral-700 space-y-2">
        <button
          onClick={handleSaveToTrack}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save to Track
        </button>
        
        {onSaveVariation && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Variation name..."
              value={variationName}
              onChange={(e) => setVariationName(e.target.value)}
              className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={handleSaveVariation}
              disabled={!variationName.trim() || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-neutral-100 rounded font-medium transition-colors text-sm"
            >
              {saving ? 'Saving...' : 'Save Variation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
