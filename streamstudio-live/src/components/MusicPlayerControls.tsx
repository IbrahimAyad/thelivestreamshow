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
import type { MusicTrack } from '@/types/database'

interface MusicPlayerControlsProps {
  currentTrack: MusicTrack | null
  isPlaying: boolean
  playbackPosition: number
  duration: number
  volume: number
  isMuted: boolean
  isLooping: boolean
  isShuffling: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onPrevious: () => void
  onNext: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onToggleLoop: () => void
  onToggleShuffle: () => void
}

export function MusicPlayerControls({
  currentTrack,
  isPlaying,
  playbackPosition,
  duration,
  volume,
  isMuted,
  isLooping,
  isShuffling,
  onPlay,
  onPause,
  onStop,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onToggleShuffle,
}: MusicPlayerControlsProps) {
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
        {currentTrack ? (
          <>
            <h3 className="text-lg font-semibold text-neutral-100 truncate">
              {currentTrack.title}
            </h3>
            {currentTrack.artist && (
              <p className="text-sm text-neutral-400 truncate">
                {currentTrack.artist}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-400">No track selected</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={playbackPosition}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:border-0"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(playbackPosition / (duration || 100)) * 100}%, #3F3F46 ${(playbackPosition / (duration || 100)) * 100}%, #3F3F46 100%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono text-neutral-400">
            {formatTime(playbackPosition)}
          </span>
          <span className="text-xs font-mono text-neutral-400">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={onToggleShuffle}
          className={`p-2 rounded transition-colors duration-150 ${
            isShuffling
              ? 'bg-primary-600 text-neutral-100'
              : 'hover:bg-neutral-800 text-neutral-400'
          }`}
          title="Shuffle"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        <button
          onClick={onPrevious}
          className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
          title="Previous"
        >
          <SkipBack className="w-5 h-5 text-neutral-100" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-3 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors duration-150"
          title={isPlaying ? 'Pause' : 'Play'}
          disabled={!currentTrack}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-neutral-100" />
          ) : (
            <Play className="w-6 h-6 text-neutral-100" />
          )}
        </button>

        <button
          onClick={onStop}
          className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
          title="Stop"
        >
          <Square className="w-5 h-5 text-neutral-100" />
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
          title="Next"
        >
          <SkipForward className="w-5 h-5 text-neutral-100" />
        </button>

        <button
          onClick={onToggleLoop}
          className={`p-2 rounded transition-colors duration-150 ${
            isLooping
              ? 'bg-primary-600 text-neutral-100'
              : 'hover:bg-neutral-800 text-neutral-400'
          }`}
          title="Loop"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Volume control */}
      <VolumeSlider
        value={volume}
        onChange={onVolumeChange}
        onToggleMute={onToggleMute}
        isMuted={isMuted}
      />
    </div>
  )
}
