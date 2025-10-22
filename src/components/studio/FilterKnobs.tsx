/**
 * Professional DJ Filter Knobs
 * High-Pass and Low-Pass filters for creative mixing
 */

import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { formatFrequency, sliderToFrequency, frequencyToSlider } from '@/utils/studio/filterEffects'

interface FilterKnobsProps {
  audioContext: AudioContext | null
  onHPFChange?: (frequency: number) => void
  onLPFChange?: (frequency: number) => void
  onReset?: () => void
}

export function FilterKnobs({
  audioContext,
  onHPFChange,
  onLPFChange,
  onReset,
}: FilterKnobsProps) {
  // Slider values (0-1 linear scale)
  const [hpfSlider, setHpfSlider] = useState(0) // 0 = 20Hz (neutral)
  const [lpfSlider, setLpfSlider] = useState(1) // 1 = 20kHz (neutral)

  // Actual frequency values
  const hpfFrequency = sliderToFrequency(hpfSlider)
  const lpfFrequency = sliderToFrequency(lpfSlider)

  // Check if filters are active (not at neutral positions)
  const isHPFActive = hpfFrequency > 25 // More than 25Hz = active
  const isLPFActive = lpfFrequency < 19000 // Less than 19kHz = active
  const isAnyActive = isHPFActive || isLPFActive

  // Handle HPF change
  const handleHPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setHpfSlider(value)

    const freq = sliderToFrequency(value)
    onHPFChange?.(freq)
  }

  // Handle LPF change
  const handleLPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setLpfSlider(value)

    const freq = sliderToFrequency(value)
    onLPFChange?.(freq)
  }

  // Reset both filters to neutral
  const handleReset = () => {
    setHpfSlider(0) // 20Hz
    setLpfSlider(1) // 20kHz

    onHPFChange?.(20)
    onLPFChange?.(20000)
    onReset?.()
  }

  if (!audioContext) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
        <p className="text-neutral-400 text-sm">Load a track to enable filters</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
          🎛️ Filter Knobs
        </h3>
        <button
          onClick={handleReset}
          disabled={!isAnyActive}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            isAnyActive
              ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
          title="Reset filters to neutral"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* High-Pass Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            High-Pass Filter
          </label>
          <span className={`text-xs font-mono font-bold ${
            isHPFActive ? 'text-primary-400' : 'text-neutral-500'
          }`}>
            {formatFrequency(hpfFrequency)}
          </span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={hpfSlider}
            onChange={handleHPFChange}
            className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer slider-hpf"
            style={{
              background: isHPFActive
                ? `linear-gradient(to right, #EAB308 0%, #EAB308 ${hpfSlider * 100}%, #404040 ${hpfSlider * 100}%, #404040 100%)`
                : '#404040'
            }}
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>20Hz</span>
            <span className="text-neutral-500">BASS CUT</span>
            <span>20kHz</span>
          </div>
        </div>

        {isHPFActive && (
          <div className="text-xs text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded px-2 py-1">
            💡 Cutting bass below {formatFrequency(hpfFrequency)}
          </div>
        )}
      </div>

      {/* Low-Pass Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Low-Pass Filter
          </label>
          <span className={`text-xs font-mono font-bold ${
            isLPFActive ? 'text-blue-400' : 'text-neutral-500'
          }`}>
            {formatFrequency(lpfFrequency)}
          </span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={lpfSlider}
            onChange={handleLPFChange}
            className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer slider-lpf"
            style={{
              background: isLPFActive
                ? `linear-gradient(to right, #404040 0%, #404040 ${lpfSlider * 100}%, #60A5FA ${lpfSlider * 100}%, #60A5FA 100%)`
                : '#404040'
            }}
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>20Hz</span>
            <span className="text-neutral-500">TREBLE CUT</span>
            <span>20kHz</span>
          </div>
        </div>

        {isLPFActive && (
          <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">
            💡 Cutting treble above {formatFrequency(lpfFrequency)}
          </div>
        )}
      </div>

      {/* Visual indicator */}
      {isAnyActive && (
        <div className="pt-3 border-t border-neutral-700">
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isHPFActive ? 'bg-primary-500 animate-pulse' : 'bg-neutral-600'}`} />
              <span className="text-neutral-400">HPF</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isLPFActive ? 'bg-blue-500 animate-pulse' : 'bg-neutral-600'}`} />
              <span className="text-neutral-400">LPF</span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {!isAnyActive && (
        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-700 rounded p-2">
          <span className="font-semibold">💡 Pro Tip:</span> Use HPF to cut bass during buildups. Use LPF to cut treble during breakdowns.
        </div>
      )}
    </div>
  )
}
