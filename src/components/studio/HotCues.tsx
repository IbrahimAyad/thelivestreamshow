import { useState } from 'react'

interface HotCue {
  id: number
  time: number | null
  color: string
}

interface HotCuesProps {
  currentTime: number
  duration: number
  onJumpToCue: (time: number) => void
  className?: string
}

const CUE_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-cyan-500',
]

export function HotCues({ currentTime, duration, onJumpToCue, className = '' }: HotCuesProps) {
  const [cues, setCues] = useState<HotCue[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      time: null,
      color: CUE_COLORS[i],
    }))
  )

  const setCueAtCurrentTime = (id: number) => {
    setCues(prev =>
      prev.map(cue =>
        cue.id === id ? { ...cue, time: currentTime } : cue
      )
    )
  }

  const deleteCue = (id: number) => {
    setCues(prev =>
      prev.map(cue =>
        cue.id === id ? { ...cue, time: null } : cue
      )
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCueClick = (cue: HotCue) => {
    if (cue.time !== null) {
      // Jump to cue
      onJumpToCue(cue.time)
    } else {
      // Set cue at current time
      setCueAtCurrentTime(cue.id)
    }
  }

  const handleCueRightClick = (e: React.MouseEvent, cue: HotCue) => {
    e.preventDefault()
    if (cue.time !== null) {
      deleteCue(cue.id)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {cues.map(cue => (
        <button
          key={cue.id}
          onClick={() => handleCueClick(cue)}
          onContextMenu={(e) => handleCueRightClick(e, cue)}
          className={`
            relative flex-1 aspect-square rounded-md border-2
            transition-all duration-200
            ${cue.time !== null
              ? `${cue.color} border-white/30 hover:border-white/60 hover:scale-105`
              : 'bg-gray-700/50 border-gray-600/50 hover:border-gray-500 hover:bg-gray-700'
            }
            active:scale-95
            group
          `}
          title={
            cue.time !== null
              ? `Cue ${cue.id}: ${formatTime(cue.time)} • Click to jump • Right-click to delete`
              : `Cue ${cue.id}: Empty • Click to set at current time`
          }
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
            <span className={`
              text-xs font-bold
              ${cue.time !== null ? 'text-white' : 'text-gray-400'}
            `}>
              {cue.id}
            </span>
            {cue.time !== null && (
              <span className="text-[10px] font-mono text-white/90 mt-0.5">
                {formatTime(cue.time)}
              </span>
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-900 border border-gray-700 rounded text-gray-400 whitespace-nowrap">
              Shift+{cue.id}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
