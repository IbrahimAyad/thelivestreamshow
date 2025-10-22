import { Plus, X, GripVertical, Music } from 'lucide-react'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Playlist, MusicTrack } from "@/types/database"

interface PlaylistManagerProps {
  playlists: Playlist[]
  tracks: MusicTrack[]
  currentPlaylistId: string | null
  onCreatePlaylist: (name: string, description?: string) => void
  onSelectPlaylist: (playlistId: string) => void
  onDeletePlaylist: (playlistId: string) => void
  onAddTrack: (playlistId: string, trackId: string) => void
  onRemoveTrack: (playlistId: string, trackId: string) => void
  onReorderTracks: (playlistId: string, trackIds: string[]) => void
}

interface SortableTrackItemProps {
  track: MusicTrack
  onRemove: () => void
}

function SortableTrackItem({ track, onRemove }: SortableTrackItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-neutral-800 rounded px-3 py-2 mb-1 group"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-neutral-400" />
      </div>
      <Music className="w-4 h-4 text-neutral-700 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-100 truncate">{track.title}</div>
        {track.artist && <div className="text-xs text-neutral-400 truncate">{track.artist}</div>}
      </div>
      <div className="text-xs font-mono text-neutral-400">{formatDuration(track.duration)}</div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700 transition-opacity duration-150"
      >
        <X className="w-4 h-4 text-error-500" />
      </button>
    </div>
  )
}

export function PlaylistManager({
  playlists,
  tracks,
  currentPlaylistId,
  onCreatePlaylist,
  onSelectPlaylist,
  onDeletePlaylist,
  onAddTrack,
  onRemoveTrack,
  onReorderTracks,
}: PlaylistManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [showAddTrackModal, setShowAddTrackModal] = useState(false)
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCreate = () => {
    if (!newPlaylistName.trim()) return
    onCreatePlaylist(newPlaylistName, newPlaylistDescription)
    setNewPlaylistName('')
    setNewPlaylistDescription('')
    setShowCreateForm(false)
  }

  const getPlaylistTracks = (playlist: Playlist) => {
    if (!playlist.track_ids) return []
    return playlist.track_ids
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean) as MusicTrack[]
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalDuration = (playlist: Playlist) => {
    const playlistTracks = getPlaylistTracks(playlist)
    return playlistTracks.reduce((sum, track) => sum + (track.duration || 0), 0)
  }

  const handleDragEnd = (event: DragEndEvent, playlistId: string) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist?.track_ids) return

      const oldIndex = playlist.track_ids.indexOf(active.id as string)
      const newIndex = playlist.track_ids.indexOf(over.id as string)

      const newTrackIds = arrayMove(playlist.track_ids, oldIndex, newIndex)
      onReorderTracks(playlistId, newTrackIds)
    }
  }

  const openAddTrackModal = (playlistId: string) => {
    setSelectedPlaylistForAdd(playlistId)
    setShowAddTrackModal(true)
  }

  const handleAddTrack = (trackId: string) => {
    if (selectedPlaylistForAdd) {
      onAddTrack(selectedPlaylistForAdd, trackId)
    }
  }

  const selectedPlaylist = playlists.find((p) => p.id === currentPlaylistId)
  const selectedPlaylistTracks = selectedPlaylist ? getPlaylistTracks(selectedPlaylist) : []
  const availableTracks = tracks.filter(
    (t) => t.category === 'music' && !selectedPlaylist?.track_ids?.includes(t.id)
  )

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-neutral-100">Playlists</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="p-2 bg-primary-600 rounded hover:bg-primary-700 transition-colors duration-150"
        >
          <Plus className="w-5 h-5 text-neutral-100" />
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-4 p-4 bg-neutral-800 rounded-lg">
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-100 text-base mb-2 focus:outline-none focus:border-primary-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newPlaylistDescription}
            onChange={(e) => setNewPlaylistDescription(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-100 text-sm mb-3 focus:outline-none focus:border-primary-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary-600 rounded hover:bg-primary-700 text-neutral-100 text-sm font-medium transition-colors duration-150"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-neutral-700 rounded hover:bg-neutral-600 text-neutral-100 text-sm font-medium transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Playlist List */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all duration-150 ${
              currentPlaylistId === playlist.id
                ? 'bg-neutral-800 border-primary-500 border-l-4'
                : 'bg-neutral-900 border-neutral-700 hover:bg-neutral-800'
            }`}
            onClick={() => onSelectPlaylist(playlist.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-base font-semibold text-neutral-100 mb-1">
                  {playlist.name}
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span>{(playlist.track_ids || []).length} tracks</span>
                  <span>•</span>
                  <span>{formatDuration(getTotalDuration(playlist))}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePlaylist(playlist.id)
                }}
                className="p-1.5 rounded hover:bg-neutral-700 transition-colors duration-150"
              >
                <X className="w-4 h-4 text-error-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Playlist Tracks */}
      {selectedPlaylist && (
        <div className="border-t border-neutral-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-neutral-100">
              {selectedPlaylist.name} Tracks
            </h4>
            <button
              onClick={() => openAddTrackModal(selectedPlaylist.id)}
              className="px-3 py-1.5 bg-primary-600 rounded text-sm font-medium hover:bg-primary-700 transition-colors duration-150"
            >
              Add Track
            </button>
          </div>

          {selectedPlaylistTracks.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">No tracks in this playlist</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(event, selectedPlaylist.id)}
            >
              <SortableContext
                items={selectedPlaylistTracks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="max-h-[300px] overflow-y-auto">
                  {selectedPlaylistTracks.map((track) => (
                    <SortableTrackItem
                      key={track.id}
                      track={track}
                      onRemove={() => onRemoveTrack(selectedPlaylist.id, track.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Add Track Modal */}
      {showAddTrackModal && selectedPlaylistForAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 w-[500px] max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-neutral-100">Add Track to Playlist</h3>
              <button onClick={() => setShowAddTrackModal(false)}>
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-100" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {availableTracks.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">
                  No available tracks to add
                </p>
              ) : (
                <div className="space-y-1">
                  {availableTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        handleAddTrack(track.id)
                        setShowAddTrackModal(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors duration-150"
                    >
                      <Music className="w-5 h-5 text-neutral-700 flex-shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium text-neutral-100 truncate">
                          {track.title}
                        </div>
                        {track.artist && (
                          <div className="text-xs text-neutral-400 truncate">{track.artist}</div>
                        )}
                      </div>
                      <Plus className="w-5 h-5 text-primary-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
