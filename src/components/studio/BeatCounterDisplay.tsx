/**
 * BeatCounterDisplay - Visual beat/bar/phrase counter for DJ mixing
 *
 * Displays:
 * - Current beat (1-4) with pulsing animation
 * - Current bar (1-8) in current phrase
 * - Phrase number
 * - Progress bar through 32-beat phrase
 *
 * Essential for:
 * - Beat matching between decks
 * - Knowing when to mix/transition
 * - Phrase-aligned mixing (professional technique)
 */

import { useEffect, useState } from 'react'
import type { DeckId } from '@/hooks/studio/useDeckAudioPlayer'

interface BeatCounterDisplayProps {
  deckId: DeckId
  beatPhase: number // 0-3 (which beat in the bar)
  barCount: number // 0-7 (which bar in the phrase)
  phraseCount: number // Total phrase count
  bpm: number | null
  isPlaying: boolean
  className?: string
}

export function BeatCounterDisplay({
  deckId,
  beatPhase,
  barCount,
  phraseCount,
  bpm,
  isPlaying,
  className = '',
}: BeatCounterDisplayProps) {
  const [pulseKey, setPulseKey] = useState(0)

  const deckColor = deckId === 'A' ? 'blue' : 'purple'

  // Trigger pulse animation on beat 1
  useEffect(() => {
    if (beatPhase === 0 && isPlaying) {
      setPulseKey(prev => prev + 1)
    }
  }, [beatPhase, isPlaying])

  // Calculate progress through phrase (32 beats = 8 bars * 4 beats)
  const beatsInPhrase = 32
  const currentBeat = barCount * 4 + beatPhase + 1
  const phraseProgress = (currentBeat / beatsInPhrase) * 100

  // Determine if we're on a phrase boundary (bar 1, beat 1)
  const isPhraseBoundary = barCount === 0 && beatPhase === 0

  return (
    <div className={`bg-neutral-900 border border-neutral-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-xs font-medium text-${deckColor}-400 uppercase`}>
          Beat Counter • Deck {deckId}
        </h4>
        {bpm && (
          <div className={`text-xs font-mono text-${deckColor}-400`}>
            {bpm.toFixed(1)} BPM
          </div>
        )}
      </div>

      {/* Beat indicator (1-4) */}
      <div className="mb-4">
        <div className="text-xs text-neutral-400 mb-2">BEATS</div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((beat) => {
            const isActive = beatPhase === beat
            const isBeat1 = beat === 0

            return (
              <div
                key={beat}
                className={`relative flex-1 h-12 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-100 ${
                  isActive
                    ? isBeat1
                      ? `bg-${deckColor}-500 text-white scale-110 shadow-lg shadow-${deckColor}-500/50`
                      : `bg-${deckColor}-600 text-white scale-105`
                    : 'bg-neutral-800 text-neutral-600'
                }`}
                style={{
                  animation: isActive && isBeat1 ? `pulse-${pulseKey} 0.3s ease-out` : 'none',
                }}
              >
                {beat + 1}

                {/* Beat 1 special indicator */}
                {isBeat1 && isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bar indicator (1-8) */}
      <div className="mb-4">
        <div className="text-xs text-neutral-400 mb-2">
          BAR {barCount + 1} / 8
        </div>
        <div className="grid grid-cols-8 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((bar) => (
            <div
              key={bar}
              className={`h-2 rounded transition-all ${
                bar === barCount
                  ? `bg-${deckColor}-500`
                  : bar < barCount
                  ? `bg-${deckColor}-700`
                  : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Phrase counter and progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-neutral-400">PHRASE</div>
          <div className={`text-lg font-bold font-mono text-${deckColor}-400`}>
            #{phraseCount}
          </div>
        </div>

        {/* Phrase progress bar (32 beats) */}
        <div className="relative h-3 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r from-${deckColor}-600 to-${deckColor}-400 transition-all duration-100`}
            style={{ width: `${phraseProgress}%` }}
          />

          {/* Bar divisions (8 bars) */}
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-neutral-700"
              style={{ left: `${(i / 8) * 100}%` }}
            />
          ))}
        </div>

        <div className="flex justify-between mt-1 text-xs text-neutral-500">
          <span>Beat 1</span>
          <span>Beat 32</span>
        </div>
      </div>

      {/* Phrase boundary indicator */}
      {isPhraseBoundary && isPlaying && (
        <div className={`p-2 bg-${deckColor}-500/20 border border-${deckColor}-500 rounded text-center animate-pulse`}>
          <div className={`text-sm font-bold text-${deckColor}-400`}>
            🎵 PHRASE BOUNDARY
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            Perfect mix point
          </div>
        </div>
      )}

      {/* Status indicator */}
      {!isPlaying && (
        <div className="mt-3 text-center text-xs text-neutral-500">
          ⏸️ Paused - Counter inactive
        </div>
      )}

      {/* Beat matching guide */}
      {isPlaying && (
        <div className="mt-3 p-2 bg-neutral-800/50 rounded text-xs text-neutral-400">
          <div className="font-medium mb-1">💡 Mixing Guide:</div>
          <ul className="space-y-0.5 text-neutral-500">
            <li>• Mix on <strong className="text-white">Beat 1</strong> (downbeat)</li>
            <li>• Best on <strong className="text-white">Phrase boundaries</strong></li>
            <li>• 8 bars = 1 phrase (32 beats)</li>
          </ul>
        </div>
      )}
    </div>
  )
}

// Add pulse animation keyframes via styled component or global CSS
// For now, using inline style animation
