/**
 * CrossfaderSlider - Professional DJ crossfader between Deck A and Deck B
 *
 * Features:
 * - Smooth slider from A (left) to B (right)
 * - Visual indicators for current position
 * - Curve selection (linear/smooth/fast-cut)
 * - Quick preset buttons (A/Center/B)
 * - Keyboard shortcuts support
 * - Touch-friendly for mobile
 */

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Minus } from 'lucide-react'
import type { CrossfaderCurve } from '@/hooks/studio/useDualDeckAudioPlayer'

interface CrossfaderSliderProps {
  position: number // 0 = full A, 0.5 = center, 1 = full B
  curve: CrossfaderCurve
  onPositionChange: (position: number) => void
  onCurveChange: (curve: CrossfaderCurve) => void
  onPresetA: () => void
  onPresetCenter: () => void
  onPresetB: () => void
  className?: string
}

export function CrossfaderSlider({
  position,
  curve,
  onPositionChange,
  onCurveChange,
  onPresetA,
  onPresetCenter,
  onPresetB,
  className = '',
}: CrossfaderSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // X = Full A, C = Center, V = Full B
      if (e.key === 'x' || e.key === 'X') {
        onPresetA()
      } else if (e.key === 'c' || e.key === 'C') {
        onPresetCenter()
      } else if (e.key === 'v' || e.key === 'V') {
        onPresetB()
      }
      // Arrow keys for fine adjustment
      else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPositionChange(Math.max(0, position - 0.01))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onPositionChange(Math.min(1, position + 0.01))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [position, onPositionChange, onPresetA, onPresetCenter, onPresetB])

  // Calculate visual position percentage
  const positionPercent = (position * 100).toFixed(0)

  // Calculate deck levels based on curve
  const getLevelForDeck = (deck: 'A' | 'B'): number => {
    const normalized = deck === 'A' ? 1 - position : position

    switch (curve) {
      case 'linear':
        return normalized

      case 'smooth':
        return Math.cos((1 - normalized) * Math.PI / 2)

      case 'fast-cut':
        if (deck === 'A') {
          return position < 0.4 ? 1.0 : position < 0.6 ? (0.6 - position) * 5 : 0.0
        } else {
          return position > 0.6 ? 1.0 : position > 0.4 ? (position - 0.4) * 5 : 0.0
        }

      default:
        return normalized
    }
  }

  const levelA = getLevelForDeck('A')
  const levelB = getLevelForDeck('B')

  return (
    <div className={`bg-neutral-900 border border-neutral-700 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Crossfader</h3>

        {/* Curve selector */}
        <div className="flex gap-1 bg-neutral-800 rounded p-1">
          <button
            onClick={() => onCurveChange('linear')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              curve === 'linear'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Linear fade"
          >
            Linear
          </button>
          <button
            onClick={() => onCurveChange('smooth')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              curve === 'smooth'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Smooth equal-power fade"
          >
            Smooth
          </button>
          <button
            onClick={() => onCurveChange('fast-cut')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              curve === 'fast-cut'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Fast cut with sharp transition"
          >
            Fast Cut
          </button>
        </div>
      </div>

      {/* Deck level indicators */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Deck A level */}
        <div>
          <div className="text-xs font-medium text-blue-400 mb-2">DECK A</div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${levelA * 100}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {(levelA * 100).toFixed(0)}%
          </div>
        </div>

        {/* Deck B level */}
        <div>
          <div className="text-xs font-medium text-purple-400 mb-2">DECK B</div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-100"
              style={{ width: `${levelB * 100}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {(levelB * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Main crossfader slider */}
      <div className="relative mb-4">
        {/* Track background */}
        <div className="h-16 bg-neutral-800 rounded-lg relative overflow-hidden">
          {/* Gradient showing A to B */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
            }}
          />

          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-600" />

          {/* Position indicator */}
          <div
            className={`absolute top-1 bottom-1 w-1 rounded-full transition-all duration-100 ${
              isDragging ? 'bg-primary-400 shadow-lg shadow-primary-500/50' : 'bg-white'
            }`}
            style={{
              left: `calc(${position * 100}% - 2px)`,
            }}
          />
        </div>

        {/* Slider input (invisible but functional) */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={position}
          onChange={(e) => onPositionChange(parseFloat(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />

        {/* Labels */}
        <div className="flex justify-between mt-2">
          <span className="text-sm font-bold text-blue-400">A</span>
          <span className="text-xs text-neutral-500 font-mono">{positionPercent}%</span>
          <span className="text-sm font-bold text-purple-400">B</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={onPresetA}
          className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors flex items-center justify-center gap-1"
          title="Crossfader to A (Shortcut: X)"
        >
          <ChevronLeft className="w-4 h-4" />
          Full A
        </button>

        <button
          onClick={onPresetCenter}
          className="py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded font-medium text-sm transition-colors flex items-center justify-center gap-1"
          title="Crossfader to Center (Shortcut: C)"
        >
          <Minus className="w-4 h-4" />
          Center
        </button>

        <button
          onClick={onPresetB}
          className="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-sm transition-colors flex items-center justify-center gap-1"
          title="Crossfader to B (Shortcut: V)"
        >
          Full B
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Curve visualization */}
      <div className="border-t border-neutral-700 pt-4">
        <div className="text-xs font-medium text-neutral-400 mb-2 uppercase">
          Fade Curve Preview
        </div>
        <div className="h-20 bg-neutral-800 rounded relative">
          <svg viewBox="0 0 200 80" className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="40" x2="200" y2="40" stroke="#3F3F46" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="100" y1="0" x2="100" y2="80" stroke="#3F3F46" strokeWidth="1" strokeDasharray="2,2" />

            {/* Curve A (blue) */}
            <path
              d={getCurvePath('A', curve)}
              stroke="#3B82F6"
              strokeWidth="2"
              fill="none"
            />

            {/* Curve B (purple) */}
            <path
              d={getCurvePath('B', curve)}
              stroke="#8B5CF6"
              strokeWidth="2"
              fill="none"
            />

            {/* Current position indicator */}
            <line
              x1={position * 200}
              y1="0"
              x2={position * 200}
              y2="80"
              stroke="#F59E0B"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="flex justify-between mt-1 text-xs text-neutral-500">
          <span>A</span>
          <span>Center</span>
          <span>B</span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 p-2 bg-neutral-800/50 rounded text-xs text-neutral-400">
        <div className="font-medium mb-1">Keyboard Shortcuts:</div>
        <div className="grid grid-cols-3 gap-2">
          <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">X</kbd> → Full A</div>
          <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">C</kbd> → Center</div>
          <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">V</kbd> → Full B</div>
        </div>
        <div className="mt-1">
          <kbd className="px-1 py-0.5 bg-neutral-700 rounded">←</kbd> / <kbd className="px-1 py-0.5 bg-neutral-700 rounded">→</kbd> Nudge
        </div>
      </div>
    </div>
  )
}

// Generate SVG path for crossfader curve
function getCurvePath(deck: 'A' | 'B', curve: CrossfaderCurve): string {
  const points: string[] = []

  for (let x = 0; x <= 200; x += 2) {
    const position = x / 200
    const normalized = deck === 'A' ? 1 - position : position

    let y: number

    switch (curve) {
      case 'linear':
        y = (1 - normalized) * 80
        break

      case 'smooth':
        y = (1 - Math.cos((1 - normalized) * Math.PI / 2)) * 80
        break

      case 'fast-cut':
        if (deck === 'A') {
          if (position < 0.4) y = 0
          else if (position < 0.6) y = ((position - 0.4) * 5) * 80
          else y = 80
        } else {
          if (position > 0.6) y = 0
          else if (position > 0.4) y = (1 - (position - 0.4) * 5) * 80
          else y = 80
        }
        break

      default:
        y = (1 - normalized) * 80
    }

    points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`)
  }

  return points.join(' ')
}
