import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Square,
} from 'lucide-react'
import { VolumeSlider } from './VolumeSlider'
import { AudioVisualizer } from './AudioVisualizer'
import { useMusic } from '@/contexts/MusicProvider'

/**
 * MusicPlayerControls - Transport controls for global music playback
 * 
 * Uses the global MusicProvider context for persistent playback across route changes.
 * This is separate from the DJ Dual Deck system which handles professional mixing.
 */
export function MusicPlayerControls() {
  const music = useMusic()

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      {/* Current track info */}
      <div className="mb-4">
        {music.current ? (
          <>
            <h3 className="text-lg font-semibold text-neutral-100 truncate">
              {music.current.title || 'Unknown Track'}
            </h3>
            {music.current.artist && (
              <p className="text-sm text-neutral-400 truncate">
                {music.current.artist}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-400">No track selected</p>
        )}
      </div>

      {/* Error display */}
      {music.hasError && music.error && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-400">
          {music.error}
        </div>
      )}

      {/* Audio Visualization */}
      {music.analyserNode && (
        <div className="mb-4">
          <AudioVisualizer analyser={music.analyserNode} height={60} />
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={music.duration || 100}
          value={music.currentTime}
          onChange={(e) => music.seek(Number(e.target.value))}
          className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:border-0"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(music.currentTime / (music.duration || 100)) * 100}%, #3F3F46 ${(music.currentTime / (music.duration || 100)) * 100}%, #3F3F46 100%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono text-neutral-400">
            {formatTime(music.currentTime)}
          </span>
          <span className="text-xs font-mono text-neutral-400">
            {formatTime(music.duration)}
          </span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={music.previous}
          className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
          title="Previous"
          disabled={music.queue.length === 0}
        >
          <SkipBack className="w-5 h-5 text-neutral-100" />
        </button>

        <button
          onClick={music.isPlaying ? music.pause : () => music.current ? music.resume() : undefined}
          className="p-3 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors duration-150"
          title={music.isPlaying ? 'Pause' : 'Play'}
          disabled={!music.current}
        >
          {music.isPlaying ? (
            <Pause className="w-6 h-6 text-neutral-100" />
          ) : (
            <Play className="w-6 h-6 text-neutral-100" />
          )}
        </button>

        <button
          onClick={music.stop}
          className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
          title="Stop"
        >
          <Square className="w-5 h-5 text-neutral-100" />
        </button>

        <button
          onClick={music.next}
          className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
          title="Next"
          disabled={music.queue.length === 0}
        >
          <SkipForward className="w-5 h-5 text-neutral-100" />
        </button>
      </div>

      {/* Volume control */}
      <VolumeSlider
        value={music.volume}
        onChange={music.setVolume}
        onToggleMute={() => music.setVolume(music.volume === 0 ? 0.7 : 0)}
        isMuted={music.volume === 0}
      />

      {/* Queue info - hidden for now as new provider doesn't expose queue */}
      {/* Uncomment when queue functionality is added to MusicProvider */}
      {/*
      {music.queue?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-700">
          <p className="text-xs text-neutral-400">
            Queue: {music.queue.length} track{music.queue.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      */}
    </div>
  )
}
