import { memo, useState, useMemo, useCallback } from 'react'
import { Bookmark } from 'lucide-react'
import { useMusic } from '@/contexts/MusicProvider'

interface QuickCuesPanelProps {
  onJumpToCue: (time: number) => void
  className?: string
}

/**
 * QuickCuesPanel - Optimized panel with 1 hot cue + 7 sound drops
 *
 * Performance optimized:
 * - NO currentTime prop to prevent 60+ re-renders per second
 * - Uses useMusic() hook internally only when setting hot cue
 * - Empty sound drop placeholders (user configures later)
 */
export const QuickCuesPanel = memo(function QuickCuesPanel({
  onJumpToCue,
  className = ''
}: QuickCuesPanelProps) {
  const music = useMusic()
  const [hotCueTime, setHotCueTime] = useState<number | null>(null)
  const [soundDrops, setSoundDrops] = useState<Array<{name: string, color: string} | null>>([
    null, null, null, null, null, null, null
  ])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleHotCueClick = useCallback(() => {
    if (hotCueTime !== null) {
      // Jump to cue
      onJumpToCue(hotCueTime)
    } else {
      // Set cue at current playback time
      setHotCueTime(music.currentTime)
    }
  }, [hotCueTime, music.currentTime, onJumpToCue])

  const handleHotCueRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setHotCueTime(null)
  }, [])

  const handleSoundDropClick = useCallback((index: number) => {
    // TODO: User will configure sound effects via click
    console.log(`Sound drop ${index + 1} clicked - configure effect here`)
  }, [])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Hot Cue Button */}
      <button
        onClick={handleHotCueClick}
        onContextMenu={handleHotCueRightClick}
        className={`
          relative flex-1 aspect-square rounded-md border-2
          transition-all duration-200
          ${hotCueTime !== null
            ? 'bg-red-500 border-white/30 hover:border-white/60 hover:scale-105'
            : 'bg-gray-700/50 border-gray-600/50 hover:border-gray-500 hover:bg-gray-700'
          }
          active:scale-95
          group
        `}
        title={
          hotCueTime !== null
            ? `Hot Cue: ${formatTime(hotCueTime)} • Click to jump • Right-click to clear`
            : `Hot Cue: Empty • Click to set at current time`
        }
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
          <Bookmark className={`w-4 h-4 ${hotCueTime !== null ? 'text-white' : 'text-gray-400'}`} />
          {hotCueTime !== null && (
            <span className="text-[10px] font-mono text-white/90 mt-0.5">
              {formatTime(hotCueTime)}
            </span>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-900 border border-gray-700 rounded text-gray-400 whitespace-nowrap">
            Hot Cue
          </span>
        </div>
      </button>

      {/* Sound Drop Buttons - Empty placeholders */}
      {soundDrops.map((drop, index) => (
        <button
          key={index}
          onClick={() => handleSoundDropClick(index)}
          className={`
            relative flex-1 aspect-square rounded-md border-2
            ${drop ? drop.color : 'bg-gray-700/30'}
            ${drop ? 'border-white/20' : 'border-gray-600/50 border-dashed'}
            hover:border-white/60 hover:scale-105
            active:scale-95
            transition-all duration-200
            group
          `}
          title={drop ? `Play ${drop.name}` : `Sound Drop ${index + 1} • Click to configure`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
            {drop ? (
              <>
                <span className="text-lg">{index + 1}</span>
                <span className="text-[9px] font-bold text-white/90 mt-0.5 leading-none">
                  {drop.name}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">+</span>
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-900 border border-gray-700 rounded text-gray-400 whitespace-nowrap">
              {index + 1}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
})
