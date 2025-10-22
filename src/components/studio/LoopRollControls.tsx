/**
 * Loop Roll Controls
 * Instant temporary loops for creating tension and buildup
 */

import { Repeat, Info } from 'lucide-react'
import { getLoopRollInfo, getLoopRollLengths, type LoopRollLength } from '@/utils/studio/loopRoll'

interface LoopRollControlsProps {
  isActive: boolean
  activeLength: LoopRollLength
  onToggle: (length: LoopRollLength) => void
  disabled?: boolean
}

export function LoopRollControls({
  isActive,
  activeLength,
  onToggle,
  disabled = false,
}: LoopRollControlsProps) {
  const lengths = getLoopRollLengths()

  if (disabled) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
        <p className="text-neutral-400 text-sm">Load a track to enable loop roll</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Loop Roll
        </h3>
        {isActive && (
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-green-400 font-medium">ACTIVE</span>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-300">
          <div className="font-semibold mb-1">Press and Hold Looping</div>
          <div className="opacity-80">
            Press a button to start loop, release to continue normal playback. Perfect for buildups!
          </div>
        </div>
      </div>

      {/* Loop Length Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-400 uppercase">
          Loop Length
        </label>
        <div className="grid grid-cols-4 gap-2">
          {lengths.map((length) => {
            const info = getLoopRollInfo(length)
            const isCurrentActive = isActive && activeLength === length

            return (
              <button
                key={length}
                onMouseDown={() => onToggle(length)}
                onMouseUp={() => isActive && onToggle(length)}
                onMouseLeave={() => isActive && activeLength === length && onToggle(length)}
                onTouchStart={() => onToggle(length)}
                onTouchEnd={() => isActive && onToggle(length)}
                className={`px-3 py-3 rounded-lg text-xs font-bold transition-all select-none ${
                  isCurrentActive
                    ? `${info.color} text-white shadow-lg scale-105`
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                <div className="text-sm">{info.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{info.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Loop Display */}
      {isActive && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-400 font-semibold mb-1">🔁 Loop Active</div>
              <div className="text-neutral-400">
                Looping: <span className="text-green-300 font-bold">{getLoopRollInfo(activeLength).label}</span>
              </div>
            </div>
            <div className="text-green-400 text-xl animate-spin">↻</div>
          </div>
        </div>
      )}

      {/* Usage Tips */}
      {!isActive && (
        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-700 rounded p-2 space-y-1">
          <div><span className="font-semibold">💡 Pro Tip:</span> Use shorter loops (1/8, 1/16) for intense buildup effects</div>
          <div><span className="font-semibold">🎵 Creative Use:</span> Layer loop rolls with filter sweeps for dramatic transitions</div>
        </div>
      )}

      {/* Visual Beat Indicator */}
      {isActive && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Loop Cycle
          </label>
          <div className="flex items-center gap-1 h-6 bg-neutral-900 rounded overflow-hidden">
            {Array.from({ length: 16 }).map((_, i) => {
              // Animate the bars based on beat
              const delay = i * 50

              return (
                <div
                  key={i}
                  className={`flex-1 h-full bg-gradient-to-t from-green-600 to-green-400 animate-pulse`}
                  style={{
                    animationDelay: `${delay}ms`,
                    opacity: 0.3 + (i / 16) * 0.7,
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
