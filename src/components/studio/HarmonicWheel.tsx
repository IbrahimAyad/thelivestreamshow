/**
 * HarmonicWheel - Camelot Wheel for harmonic mixing
 *
 * The Camelot Wheel is a visual tool for DJ mixing that shows:
 * - Musical key relationships
 * - Compatible keys for smooth mixing
 * - Energy flow (clockwise = energy up, counter-clockwise = energy down)
 *
 * Camelot system:
 * - Inner ring: Minor keys (1A-12A)
 * - Outer ring: Major keys (1B-12B)
 * - Adjacent keys are compatible
 * - Same number but different letter (e.g., 8A & 8B) are relative major/minor
 *
 * Compatible mixing rules:
 * - Same key (perfect)
 * - +1 or -1 on wheel (energy shift)
 * - Same number, different letter (relative major/minor)
 */

import { useState } from 'react'
import type { MusicTrack } from '@/types/database'

// Camelot Wheel key mappings
export const CAMELOT_KEYS = [
  { id: '1A', key: 'Ab minor', musicalKey: 'G#m', angle: 0, color: '#EF4444' },
  { id: '2A', key: 'Eb minor', musicalKey: 'D#m', angle: 30, color: '#F97316' },
  { id: '3A', key: 'Bb minor', musicalKey: 'A#m', angle: 60, color: '#F59E0B' },
  { id: '4A', key: 'F minor', musicalKey: 'Fm', angle: 90, color: '#EAB308' },
  { id: '5A', key: 'C minor', musicalKey: 'Cm', angle: 120, color: '#84CC16' },
  { id: '6A', key: 'G minor', musicalKey: 'Gm', angle: 150, color: '#22C55E' },
  { id: '7A', key: 'D minor', musicalKey: 'Dm', angle: 180, color: '#10B981' },
  { id: '8A', key: 'A minor', musicalKey: 'Am', angle: 210, color: '#14B8A6' },
  { id: '9A', key: 'E minor', musicalKey: 'Em', angle: 240, color: '#06B6D4' },
  { id: '10A', key: 'B minor', musicalKey: 'Bm', angle: 270, color: '#0EA5E9' },
  { id: '11A', key: 'F# minor', musicalKey: 'F#m', angle: 300, color: '#3B82F6' },
  { id: '12A', key: 'Db minor', musicalKey: 'C#m', angle: 330, color: '#6366F1' },
  { id: '1B', key: 'B major', musicalKey: 'B', angle: 0, color: '#EF4444' },
  { id: '2B', key: 'F# major', musicalKey: 'F#', angle: 30, color: '#F97316' },
  { id: '3B', key: 'Db major', musicalKey: 'C#', angle: 60, color: '#F59E0B' },
  { id: '4B', key: 'Ab major', musicalKey: 'G#', angle: 90, color: '#EAB308' },
  { id: '5B', key: 'Eb major', musicalKey: 'D#', angle: 120, color: '#84CC16' },
  { id: '6B', key: 'Bb major', musicalKey: 'A#', angle: 150, color: '#22C55E' },
  { id: '7B', key: 'F major', musicalKey: 'F', angle: 180, color: '#10B981' },
  { id: '8B', key: 'C major', musicalKey: 'C', angle: 210, color: '#14B8A6' },
  { id: '9B', key: 'G major', musicalKey: 'G', angle: 240, color: '#06B6D4' },
  { id: '10B', key: 'D major', musicalKey: 'D', angle: 270, color: '#0EA5E9' },
  { id: '11B', key: 'A major', musicalKey: 'A', angle: 300, color: '#3B82F6' },
  { id: '12B', key: 'E major', musicalKey: 'E', angle: 330, color: '#6366F1' },
]

interface HarmonicWheelProps {
  deckAKey: string | null // Musical key from Deck A
  deckBKey: string | null // Musical key from Deck B
  onKeySelect?: (camelotKey: string) => void
  showCompatibility?: boolean
  size?: number
  className?: string
}

export function HarmonicWheel({
  deckAKey,
  deckBKey,
  onKeySelect,
  showCompatibility = true,
  size = 400,
  className = '',
}: HarmonicWheelProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  // Convert musical key to Camelot notation
  const musicalKeyToCamelot = (musicalKey: string | null): string | null => {
    if (!musicalKey) return null

    const normalized = musicalKey.trim().replace(/\s+/g, '')
    const found = CAMELOT_KEYS.find(k =>
      k.musicalKey.toLowerCase() === normalized.toLowerCase() ||
      k.key.toLowerCase().replace(/\s+/g, '') === normalized.toLowerCase()
    )

    return found?.id || null
  }

  const deckACamelot = musicalKeyToCamelot(deckAKey)
  const deckBCamelot = musicalKeyToCamelot(deckBKey)

  // Get compatible keys for a given key
  const getCompatibleKeys = (camelotKey: string | null): string[] => {
    if (!camelotKey) return []

    const num = parseInt(camelotKey)
    const letter = camelotKey.slice(-1)

    return [
      camelotKey, // Same key (perfect)
      `${num}${letter === 'A' ? 'B' : 'A'}`, // Relative major/minor (perfect)
      `${num === 12 ? 1 : num + 1}${letter}`, // +1 (energy up)
      `${num === 1 ? 12 : num - 1}${letter}`, // -1 (energy down)
    ]
  }

  const compatibleKeysA = getCompatibleKeys(deckACamelot)
  const compatibleKeysB = getCompatibleKeys(deckBCamelot)

  // Determine key status (deck A, deck B, compatible, etc.)
  const getKeyStatus = (camelotKey: string): 'deck-a' | 'deck-b' | 'compatible-a' | 'compatible-b' | 'both-compatible' | 'none' => {
    if (camelotKey === deckACamelot) return 'deck-a'
    if (camelotKey === deckBCamelot) return 'deck-b'

    const compatibleWithA = compatibleKeysA.includes(camelotKey)
    const compatibleWithB = compatibleKeysB.includes(camelotKey)

    if (compatibleWithA && compatibleWithB) return 'both-compatible'
    if (compatibleWithA) return 'compatible-a'
    if (compatibleWithB) return 'compatible-b'

    return 'none'
  }

  // Generate SVG arc path
  const getArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number): string => {
    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)

    const x1 = 200 + outerRadius * Math.cos(startRad)
    const y1 = 200 + outerRadius * Math.sin(startRad)
    const x2 = 200 + outerRadius * Math.cos(endRad)
    const y2 = 200 + outerRadius * Math.sin(endRad)
    const x3 = 200 + innerRadius * Math.cos(endRad)
    const y3 = 200 + innerRadius * Math.sin(endRad)
    const x4 = 200 + innerRadius * Math.cos(startRad)
    const y4 = 200 + innerRadius * Math.sin(startRad)

    return `
      M ${x1} ${y1}
      A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4}
      Z
    `
  }

  // Get fill color based on status
  const getFillColor = (camelotKey: string): string => {
    const status = showCompatibility ? getKeyStatus(camelotKey) : 'none'

    switch (status) {
      case 'deck-a':
        return '#3B82F6' // Blue
      case 'deck-b':
        return '#8B5CF6' // Purple
      case 'both-compatible':
        return '#22C55E' // Green (compatible with both)
      case 'compatible-a':
        return '#60A5FA' // Light blue
      case 'compatible-b':
        return '#A78BFA' // Light purple
      default:
        return '#27272A' // Neutral dark
    }
  }

  const getTextColor = (camelotKey: string): string => {
    const status = getKeyStatus(camelotKey)
    return status === 'none' ? '#71717A' : '#FFFFFF'
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        className="select-none"
      >
        {/* Outer ring - Major keys (B) */}
        {CAMELOT_KEYS.filter(k => k.id.endsWith('B')).map((key, i) => {
          const startAngle = key.angle - 15
          const endAngle = key.angle + 15

          return (
            <g key={key.id}>
              <path
                d={getArcPath(startAngle, endAngle, 140, 190)}
                fill={getFillColor(key.id)}
                stroke="#171717"
                strokeWidth="2"
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => onKeySelect?.(key.id)}
                onMouseEnter={() => setHoveredKey(key.id)}
                onMouseLeave={() => setHoveredKey(null)}
              />
              <text
                x={200 + 165 * Math.cos((key.angle - 90) * Math.PI / 180)}
                y={200 + 165 * Math.sin((key.angle - 90) * Math.PI / 180)}
                className="text-sm font-bold pointer-events-none"
                fill={getTextColor(key.id)}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {key.id}
              </text>
            </g>
          )
        })}

        {/* Inner ring - Minor keys (A) */}
        {CAMELOT_KEYS.filter(k => k.id.endsWith('A')).map((key) => {
          const startAngle = key.angle - 15
          const endAngle = key.angle + 15

          return (
            <g key={key.id}>
              <path
                d={getArcPath(startAngle, endAngle, 90, 130)}
                fill={getFillColor(key.id)}
                stroke="#171717"
                strokeWidth="2"
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => onKeySelect?.(key.id)}
                onMouseEnter={() => setHoveredKey(key.id)}
                onMouseLeave={() => setHoveredKey(null)}
              />
              <text
                x={200 + 110 * Math.cos((key.angle - 90) * Math.PI / 180)}
                y={200 + 110 * Math.sin((key.angle - 90) * Math.PI / 180)}
                className="text-sm font-bold pointer-events-none"
                fill={getTextColor(key.id)}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {key.id}
              </text>
            </g>
          )
        })}

        {/* Center label */}
        <circle cx="200" cy="200" r="80" fill="#18181B" stroke="#3F3F46" strokeWidth="2" />
        <text
          x="200"
          y="190"
          className="text-xl font-bold"
          fill="#FFFFFF"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Camelot
        </text>
        <text
          x="200"
          y="210"
          className="text-sm"
          fill="#71717A"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Wheel
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-4 w-full max-w-md space-y-2">
        {deckACamelot && (
          <div className="flex items-center gap-2 p-2 bg-blue-500/20 border border-blue-500 rounded">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-blue-400">
              Deck A: {deckACamelot} ({deckAKey})
            </span>
          </div>
        )}

        {deckBCamelot && (
          <div className="flex items-center gap-2 p-2 bg-purple-500/20 border border-purple-500 rounded">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span className="text-sm font-medium text-purple-400">
              Deck B: {deckBCamelot} ({deckBKey})
            </span>
          </div>
        )}

        {showCompatibility && (deckACamelot || deckBCamelot) && (
          <div className="flex items-center gap-2 p-2 bg-green-500/20 border border-green-500 rounded">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-400">
              Compatible keys (smooth mix)
            </span>
          </div>
        )}

        {/* Hovered key info */}
        {hoveredKey && (
          <div className="p-2 bg-neutral-800 border border-neutral-700 rounded">
            <div className="text-sm font-medium text-white">
              {hoveredKey}: {CAMELOT_KEYS.find(k => k.id === hoveredKey)?.key}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Musical: {CAMELOT_KEYS.find(k => k.id === hoveredKey)?.musicalKey}
            </div>
          </div>
        )}
      </div>

      {/* Compatibility info */}
      {deckACamelot && deckBCamelot && (
        <div className="mt-4 p-3 bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-md">
          <div className="text-sm font-medium text-white mb-2">
            Mix Compatibility
          </div>

          {compatibleKeysB.includes(deckACamelot) ? (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">✅ Keys are compatible - Safe to mix!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm">⚠️ Keys may clash - Use EQ or effects</span>
            </div>
          )}

          {/* Compatible keys list */}
          <div className="mt-3 text-xs text-neutral-400">
            <div>Compatible with Deck A ({deckACamelot}):</div>
            <div className="text-neutral-300 mt-1">
              {compatibleKeysA.join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!deckACamelot && !deckBCamelot && (
        <div className="mt-4 p-3 bg-neutral-800/50 rounded text-center text-sm text-neutral-400 max-w-md">
          Load tracks with detected keys to see harmonic mixing suggestions
        </div>
      )}
    </div>
  )
}

// Export helper function
export function musicalKeyToCamelot(key: string | null): string | null {
  if (!key) return null

  const normalized = key.trim().replace(/\s+/g, '')
  const found = CAMELOT_KEYS.find(k =>
    k.musicalKey.toLowerCase() === normalized.toLowerCase() ||
    k.key.toLowerCase().replace(/\s+/g, '') === normalized.toLowerCase()
  )

  return found?.id || null
}
