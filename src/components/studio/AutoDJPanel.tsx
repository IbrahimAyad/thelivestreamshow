import { useState, useEffect } from 'react'
import { Zap, Lock, Unlock, Sliders } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AutoDJSettings } from '@/types/database'
import type { ScoredTrack } from '@/utils/trackScorer'
import type { EnergyStyle } from '@/utils/energyFlow'
import { SelectionReasonCard } from './SelectionReasonCard'

interface AutoDJPanelProps {
  suggestedTrack: ScoredTrack | null
  lockedTrack: ScoredTrack | null
  onAcceptSuggestion: () => void
  onSkipSuggestion: () => void
  onLockCustomTrack: () => void
  onEnergyRequest: (energy: number) => void
  onSettingsChange: (settings: Partial<AutoDJSettings>) => void
}

export function AutoDJPanel({
  suggestedTrack,
  lockedTrack,
  onAcceptSuggestion,
  onSkipSuggestion,
  onLockCustomTrack,
  onEnergyRequest,
  onSettingsChange
}: AutoDJPanelProps) {
  const [settings, setSettings] = useState<AutoDJSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestedEnergy, setRequestedEnergy] = useState<number>(5)

  // Load settings from database
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_dj_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load Auto-DJ settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (updates: Partial<AutoDJSettings>) => {
    if (!settings) return

    try {
      const { error } = await supabase
        .from('auto_dj_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings.id)

      if (error) throw error

      const newSettings = { ...settings, ...updates }
      setSettings(newSettings)
      onSettingsChange(updates)
    } catch (error) {
      console.error('Failed to update Auto-DJ settings:', error)
    }
  }

  const handleEnergyRequest = () => {
    onEnergyRequest(requestedEnergy)
  }

  if (loading || !settings) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
        <div className="text-center text-neutral-400">Loading Auto-DJ settings...</div>
      </div>
    )
  }

  return (
    <div className={`bg-neutral-900 border rounded-lg p-4 transition-all ${
      settings.enabled ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' : 'border-neutral-700'
    }`}>
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${settings.enabled ? 'text-purple-400' : 'text-neutral-400'}`} />
          <h3 className="text-lg font-semibold text-neutral-100">Auto-DJ Mode</h3>
        </div>
        <button
          onClick={() => updateSetting({ enabled: !settings.enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            settings.enabled ? 'bg-purple-600' : 'bg-neutral-700'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              settings.enabled ? 'transform translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Settings Section */}
          <div className="space-y-3 mb-4 pb-4 border-b border-neutral-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.prefer_harmonic}
                  onChange={(e) => updateSetting({ prefer_harmonic: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-neutral-300">Prefer harmonic mixing</span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.strict_bpm}
                  onChange={(e) => updateSetting({ strict_bpm: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-neutral-300">Strict BPM matching (+/-3)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm text-neutral-300 mb-2">
                Energy progression style
              </label>
              <select
                value={settings.energy_style}
                onChange={(e) => updateSetting({ energy_style: e.target.value as EnergyStyle })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="gradual">Gradual Build</option>
                <option value="peak-valley">Peak & Valley</option>
                <option value="chill">Chill Flow</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-sm text-neutral-300 mb-2">
                <span>Recently played limit</span>
                <span className="text-purple-400">{settings.recency_limit} tracks</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                value={settings.recency_limit}
                onChange={(e) => updateSetting({ recency_limit: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Locked Track Display */}
          {lockedTrack && (
            <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Custom Track Locked</span>
              </div>
              <div className="text-sm text-neutral-100">{lockedTrack.track.title}</div>
              {lockedTrack.track.artist && (
                <div className="text-xs text-neutral-400">{lockedTrack.track.artist}</div>
              )}
            </div>
          )}

          {/* Suggestion Display */}
          {suggestedTrack && !lockedTrack && (
            <div className="mb-4">
              <SelectionReasonCard
                scoredTrack={suggestedTrack}
                onAccept={onAcceptSuggestion}
                onSkip={onSkipSuggestion}
                onLock={onLockCustomTrack}
              />
            </div>
          )}

          {/* Manual Override Controls */}
          <div className="bg-neutral-800 border border-neutral-700 rounded p-3">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-neutral-400" />
              <h4 className="text-sm font-medium text-neutral-100">Manual Override</h4>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-neutral-400 mb-2">
                <span>Request energy level</span>
                <span className="text-purple-400">E{requestedEnergy}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={requestedEnergy}
                onChange={(e) => setRequestedEnergy(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleEnergyRequest}
              className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-colors"
            >
              Find Track at E{requestedEnergy}
            </button>
          </div>
        </>
      )}

      {!settings.enabled && (
        <div className="text-center py-4 text-sm text-neutral-400">
          Enable Auto-DJ to automatically select harmonically compatible tracks
        </div>
      )}
    </div>
  )
}
