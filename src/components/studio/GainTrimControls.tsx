/**
 * Gain/Trim Controls
 * Professional pre-fader gain staging for DJ mixing
 */

import { AlertTriangle, RotateCcw } from 'lucide-react'

interface GainTrimControlsProps {
  gain: number
  onGainChange: (gain: number) => void
  disabled?: boolean
}

export function GainTrimControls({
  gain,
  onGainChange,
  disabled = false,
}: GainTrimControlsProps) {
  // Calculate gain percentage and dB
  const gainPercentage = Math.round(gain * 100)
  const gainDB = (20 * Math.log10(gain)).toFixed(1)

  // Check if gain is optimal, too low, or too high
  const isOptimal = gain >= 0.6 && gain <= 0.8
  const isTooLow = gain < 0.3
  const isTooHigh = gain > 1.2

  // Handle gain change
  const handleGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onGainChange(value)
  }

  // Reset gain to default (70%)
  const resetGain = () => {
    onGainChange(0.7)
  }

  // Fine adjustment
  const adjustGain = (delta: number) => {
    const newGain = Math.max(0, Math.min(1.5, gain + delta))
    onGainChange(newGain)
  }

  if (disabled) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
        <p className="text-neutral-400 text-sm">Load a track to enable gain controls</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
          🎚️ Gain / Trim
        </h3>
        <button
          onClick={resetGain}
          disabled={gain === 0.7}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            gain !== 0.7
              ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
          title="Reset gain to 70%"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Gain Level Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Input Gain
          </label>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-mono font-bold ${
              isTooHigh ? 'text-red-400' : isTooLow ? 'text-yellow-400' : isOptimal ? 'text-green-400' : 'text-neutral-300'
            }`}>
              {gainPercentage}%
            </span>
            <span className="text-xs text-neutral-500">({gainDB} dB)</span>
          </div>
        </div>

        {/* Gain Slider */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={gain}
            onChange={handleGainChange}
            className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                ${isTooLow ? '#EAB308' : '#22C55E'} 0%,
                ${isTooLow ? '#EAB308' : '#22C55E'} ${Math.min((gain / 1.5) * 100, 40)}%,
                ${isOptimal ? '#22C55E' : isTooHigh ? '#EF4444' : '#404040'} ${Math.min((gain / 1.5) * 100, 40)}%,
                ${isOptimal ? '#22C55E' : isTooHigh ? '#EF4444' : '#404040'} ${Math.min((gain / 1.5) * 100, 53)}%,
                ${isTooHigh ? '#EF4444' : '#404040'} ${Math.min((gain / 1.5) * 100, 53)}%,
                ${isTooHigh ? '#EF4444' : '#404040'} ${(gain / 1.5) * 100}%,
                #404040 ${(gain / 1.5) * 100}%,
                #404040 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>0%</span>
            <span className="text-green-500">OPTIMAL</span>
            <span>150%</span>
          </div>
        </div>

        {/* Fine Adjustment Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => adjustGain(-0.1)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            -10%
          </button>
          <button
            onClick={() => adjustGain(-0.01)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            -1%
          </button>
          <button
            onClick={() => adjustGain(0.01)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            +1%
          </button>
          <button
            onClick={() => adjustGain(0.1)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            +10%
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      {isTooLow && (
        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Gain too low - track may sound quiet</span>
        </div>
      )}

      {isTooHigh && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>⚠️ High gain - risk of clipping/distortion!</span>
        </div>
      )}

      {isOptimal && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
          ✅ Optimal gain level - good headroom
        </div>
      )}

      {/* Visual Level Meter */}
      <div className="pt-3 border-t border-neutral-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Level:</span>
          <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isTooHigh ? 'bg-red-500' : isTooLow ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((gain / 1.5) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      {!isTooHigh && !isTooLow && !isOptimal && (
        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-700 rounded p-2">
          <span className="font-semibold">💡 Pro Tip:</span> Set gain so the loudest parts peak around 60-80% for optimal headroom.
        </div>
      )}
    </div>
  )
}
