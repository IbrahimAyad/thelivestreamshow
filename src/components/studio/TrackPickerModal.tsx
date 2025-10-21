import { useState } from 'react'
import { X, Search } from 'lucide-react'
import type { MusicTrack } from '@/types/database'
import { TrackListItem } from './TrackListItem'

interface TrackPickerModalProps {
  isOpen: boolean
  tracks: MusicTrack[]
  onClose: () => void
  onSelect: (track: MusicTrack) => void
}

export function TrackPickerModal({
  isOpen,
  tracks,
  onClose,
  onSelect
}: TrackPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  if (!isOpen) return null
  
  const filteredTracks = tracks.filter(track => {
    const query = searchQuery.toLowerCase()
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      false
    )
  })
  
  const handleSelect = (track: MusicTrack) => {
    onSelect(track)
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-100">Select Track to Lock</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-neutral-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        
        {/* Track List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">No tracks found</div>
          ) : (
            <div>
              {filteredTracks.map(track => (
                <div
                  key={track.id}
                  onClick={() => handleSelect(track)}
                  className="cursor-pointer hover:bg-neutral-800 transition-colors"
                >
                  <TrackListItem
                    track={track}
                    isPlaying={false}
                    isCurrentTrack={false}
                    onPlay={() => handleSelect(track)}
                    onPause={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
