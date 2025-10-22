import { Waves } from 'lucide-react'
import type { AudioSettings } from "@/types/database"

interface CrossfadeControlsProps {
  settings: AudioSettings | null
  onUpdateSettings: (updates: Partial<AudioSettings>) => Promise<void>
}

export function CrossfadeControls({ settings, onUpdateSettings }: CrossfadeControlsProps) {
  const handleToggleCrossfade = async () => {
    await onUpdateSettings({
      crossfade_enabled: !settings?.crossfade_enabled,
    })
  }

  const handleDurationChange = async (duration: number) => {
    await onUpdateSettings({
      crossfade_duration: duration,
    })
  }

  const handleToggleEqMatching = async () => {
    await onUpdateSettings({
      auto_eq_matching: !settings?.auto_eq_matching,
    })
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Waves className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold">Crossfade</h3>
      </div>

      <div className="space-y-4">
        {/* Enable/Disable */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.crossfade_enabled || false}
              onChange={handleToggleCrossfade}
              className="w-4 h-4 rounded border-neutral-700 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-base text-neutral-100">Enable Crossfade</span>
          </label>
          <p className="text-xs text-neutral-400 mt-1 ml-6">
            Smoothly transition between tracks
          </p>
        </div>

        {/* Duration Slider */}
        {settings?.crossfade_enabled && (
          <>
            <div>
              <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
                <span>Crossfade Duration</span>
                <span className="text-primary-400">
                  {settings.crossfade_duration || 3} seconds
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={settings.crossfade_duration || 3}
                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>0s</span>
                <span>5s</span>
                <span>10s</span>
              </div>
            </div>

            {/* Auto EQ Matching */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.auto_eq_matching || false}
                  onChange={handleToggleEqMatching}
                  className="w-4 h-4 rounded border-neutral-700 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-base text-neutral-100">Auto EQ Matching</span>
              </label>
              <p className="text-xs text-neutral-400 mt-1 ml-6">
                Analyze and match frequency spectrum for smoother transitions
              </p>
            </div>

            {/* Visual Curve Preview */}
            <div className="bg-neutral-800 border border-neutral-700 rounded p-3">
              <p className="text-xs text-neutral-400 mb-2">Crossfade Curve Preview</p>
              <div className="relative h-20 bg-neutral-900 rounded overflow-hidden">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {/* Fade out curve (current track) */}
                  <path
                    d="M 0,20 Q 50,20 100,80"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  {/* Fade in curve (next track) */}
                  <path
                    d="M 0,80 Q 50,80 100,20"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span className="text-error-500">Track A (fade out)</span>
                <span className="text-success-500">Track B (fade in)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
