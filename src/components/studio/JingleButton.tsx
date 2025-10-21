import { Music, Activity } from 'lucide-react'
import type { MusicTrack } from '@/types/database'

interface JingleButtonProps {
  jingle: MusicTrack
  isPlaying: boolean
  onTrigger: (jingle: MusicTrack) => void
}

export function JingleButton({ jingle, isPlaying, onTrigger }: JingleButtonProps) {
  return (
    <button
      onClick={() => onTrigger(jingle)}
      className={`min-w-[80px] min-h-[80px] p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all duration-150 ${
        isPlaying
          ? 'bg-primary-600 border-success-500 border-2 shadow-glow scale-95'
          : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-primary-400 hover:-translate-y-0.5'
      }`}
    >
      {isPlaying ? (
        <Activity className="w-8 h-8 text-neutral-100 animate-pulse" />
      ) : (
        <Music className="w-8 h-8 text-neutral-100" />
      )}
      <span className="text-sm font-medium text-neutral-100 text-center line-clamp-2">
        {jingle.title}
      </span>
    </button>
  )
}
