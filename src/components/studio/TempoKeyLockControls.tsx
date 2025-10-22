/**
 * Tempo and Key Lock (Master Tempo) Controls
 * Professional DJ tempo control without pitch changes
 */

import { useState } from 'react'
import { Lock, Unlock, RotateCcw } from 'lucide-react'

interface TempoKeyLockControlsProps {
  tempo: number
  isKeyLockEnabled: boolean
  onTempoChange: (rate: number) => void
  onKeyLockToggle: () => void
  disabled?: boolean
}

export function TempoKeyLockControls({
  tempo,
  isKeyLockEnabled,
  onTempoChange,
  onKeyLockToggle,
  disabled = false,
}: TempoKeyLockControlsProps) {
  // Calculate BPM percentage
  const tempoPercentage = Math.round(tempo * 100)
  const tempoOffset = tempoPercentage - 100

  // Handle tempo slider change
  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onTempoChange(value)
  }

  // Reset tempo to 100%
  const resetTempo = () => {
    onTempoChange(1.0)
  }

  // Tempo fine adjustment
  const adjustTempo = (delta: number) => {
    const newTempo = Math.max(0.5, Math.min(2.0, tempo + delta))
    onTempoChange(newTempo)
  }

  if (disabled) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
        <p className="text-neutral-400 text-sm">Load a track to enable tempo controls</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
          🎵 Tempo & Key Lock
        </h3>
        <button
          onClick={resetTempo}
          disabled={tempo === 1.0}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            tempo !== 1.0
              ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
          title="Reset tempo to 100%"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Key Lock Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Key Lock (Master Tempo)
          </label>
          <button
            onClick={onKeyLockToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
              isKeyLockEnabled
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
          >
            {isKeyLockEnabled ? (
              <>
                <Lock className="w-4 h-4" />
                ENABLED
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                DISABLED
              </>
            )}
          </button>
        </div>
        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-700 rounded p-2">
          {isKeyLockEnabled ? (
            <>✅ Pitch locked - tempo changes won't affect key</>
          ) : (
            <>⚠️ Pitch unlocked - tempo changes will affect key (vinyl effect)</>
          )}
        </div>
      </div>

      {/* Tempo Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Tempo
          </label>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-mono font-bold ${
              tempoOffset > 0 ? 'text-green-400' : tempoOffset < 0 ? 'text-red-400' : 'text-neutral-300'
            }`}>
              {tempoOffset > 0 ? '+' : ''}{tempoOffset}%
            </span>
            <span className="text-xs text-neutral-500">({tempoPercentage}%)</span>
          </div>
        </div>

        {/* Tempo Slider */}
        <div className="relative">
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.001"
            value={tempo}
            onChange={handleTempoChange}
            className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: tempo !== 1.0
                ? tempo > 1.0
                  ? `linear-gradient(to right, #404040 0%, #404040 50%, #22C55E 50%, #22C55E ${(tempo - 0.5) / 1.5 * 100}%, #404040 ${(tempo - 0.5) / 1.5 * 100}%, #404040 100%)`
                  : `linear-gradient(to right, #404040 0%, #404040 ${(tempo - 0.5) / 1.5 * 100}%, #EF4444 ${(tempo - 0.5) / 1.5 * 100}%, #EF4444 50%, #404040 50%, #404040 100%)`
                : '#404040'
            }}
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>50%</span>
            <span className="text-neutral-400">100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Fine Adjustment Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => adjustTempo(-0.01)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            -1%
          </button>
          <button
            onClick={() => adjustTempo(-0.001)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            -0.1%
          </button>
          <button
            onClick={() => adjustTempo(0.001)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            +0.1%
          </button>
          <button
            onClick={() => adjustTempo(0.01)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium"
          >
            +1%
          </button>
        </div>
      </div>

      {/* Visual Indicator */}
      {tempo !== 1.0 && (
        <div className="pt-3 border-t border-neutral-700">
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${tempo > 1.0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-neutral-400">
              {tempo > 1.0 ? 'Faster' : 'Slower'} than original
            </span>
          </div>
        </div>
      )}

      {/* Pro Tip */}
      {tempo === 1.0 && (
        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-700 rounded p-2">
          <span className="font-semibold">💡 Pro Tip:</span> Use tempo control to match BPM between tracks for seamless mixing.
        </div>
      )}
    </div>
  )
}
