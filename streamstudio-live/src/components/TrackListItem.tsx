import { Play, Pause, Trash2, Music, Scissors, Edit, Loader, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import type { MusicTrack } from '@/types/database'
import { CopyrightBadge } from './CopyrightBadge'

interface TrackListItemProps {
  track: MusicTrack
  isPlaying: boolean
  isCurrentTrack: boolean
  onPlay: (track: MusicTrack) => void
  onPause: () => void
  onDelete: (track: MusicTrack) => void
  onCreateClip?: (track: MusicTrack) => void
  onEditMetadata?: (track: MusicTrack) => void
}

export function TrackListItem({
  track,
  isPlaying,
  isCurrentTrack,
  onPlay,
  onPause,
  onDelete,
  onCreateClip,
  onEditMetadata,
}: TrackListItemProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 B'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div
      className={`group h-14 px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center gap-3 hover:bg-neutral-800 transition-colors duration-150 ${
        isCurrentTrack ? 'border-l-4 border-l-primary-500 bg-primary-600/10' : ''
      }`}
    >
      <button
        onClick={() => (isPlaying && isCurrentTrack ? onPause() : onPlay(track))}
        className="flex-shrink-0 p-1.5 rounded hover:bg-neutral-700 transition-colors duration-150"
      >
        {isPlaying && isCurrentTrack ? (
          <Pause className="w-5 h-5 text-primary-400" />
        ) : (
          <Play className="w-5 h-5 text-neutral-400 group-hover:text-primary-400" />
        )}
      </button>

      <Music className="w-5 h-5 text-neutral-700 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div
          className={`text-base font-medium truncate ${
            isCurrentTrack ? 'text-primary-400' : 'text-neutral-100'
          }`}
        >
          {track.title}
          {track.friendly_name && (
            <span className="ml-2 text-xs font-mono text-info-500 bg-info-500/10 px-2 py-0.5 rounded">
              @{track.friendly_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {track.artist && (
            <div className="text-sm text-neutral-400 truncate">{track.artist}</div>
          )}
          {track.copyright_info && Object.keys(track.copyright_info as any).length > 0 && (
            <CopyrightBadge copyrightInfo={track.copyright_info as any} className="scale-90 origin-left" />
          )}
        </div>
      </div>

      {/* Stream Safety Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {track.is_stream_safe && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>Stream Safe</span>
          </div>
        )}
        {!track.is_stream_safe && track.license_type === 'copyrighted' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
            <XCircle className="w-3 h-3" />
            <span>Copyrighted</span>
          </div>
        )}
        {!track.is_stream_safe && track.license_type === 'personal_use' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
            <AlertTriangle className="w-3 h-3" />
            <span>Personal Use</span>
          </div>
        )}
      </div>

      {/* Analysis badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {track.analysis_status === 'analyzing' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
            <Loader className="w-3 h-3 animate-spin" />
            <span>Analyzing...</span>
          </div>
        )}
        
        {track.analysis_status === 'complete' && track.bpm && (
          <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs font-mono text-purple-400">
            {track.bpm} BPM
          </div>
        )}
        
        {track.analysis_status === 'complete' && track.musical_key && (
          <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs font-mono text-green-400">
            {track.musical_key}
          </div>
        )}
        
        {track.analysis_status === 'complete' && track.energy_level && (
          <div
            className={`px-2 py-1 rounded text-xs font-bold ${
              track.energy_level >= 8
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : track.energy_level >= 4
                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
            }`}
          >
            E{track.energy_level}
          </div>
        )}
      </div>

      <div className="text-sm font-mono text-neutral-400 flex-shrink-0">
        {formatDuration(track.duration)}
      </div>

      <div className="text-xs font-mono text-neutral-400 flex-shrink-0 w-16 text-right">
        {formatFileSize(track.file_size)}
      </div>

      {onEditMetadata && (
        <button
          onClick={() => onEditMetadata(track)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-neutral-700 transition-all duration-150"
          title="Edit metadata (tags, mood, energy)"
        >
          <Edit className="w-4 h-4 text-green-400" />
        </button>
      )}

      {onCreateClip && (
        <button
          onClick={() => onCreateClip(track)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-neutral-700 transition-all duration-150"
          title="Create clip from this track"
        >
          <Scissors className="w-4 h-4 text-blue-400" />
        </button>
      )}

      <button
        onClick={() => onDelete(track)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-neutral-700 transition-all duration-150"
      >
        <Trash2 className="w-4 h-4 text-error-500" />
      </button>
    </div>
  )
}
