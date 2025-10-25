import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ListVideo, Plus, Trash2, Play, Edit2, GripVertical } from 'lucide-react'
import type { Playlist, PlaylistItem, MediaLibraryItem } from '../../lib/supabase'

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems] = useState<(PlaylistItem & { media?: MediaLibraryItem })[]>([])
  const [allMedia, setAllMedia] = useState<MediaLibraryItem[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')

  useEffect(() => {
    loadPlaylists()
    loadAllMedia()
  }, [])

  useEffect(() => {
    if (selectedPlaylist) {
      loadPlaylistItems(selectedPlaylist.id)
    }
  }, [selectedPlaylist])

  const loadPlaylists = async () => {
    const { data } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setPlaylists(data as Playlist[])
  }

  const loadPlaylistItems = async (playlistId: string) => {
    const { data } = await supabase
      .from('playlist_items')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position')
    
    if (data) {
      const itemsWithMedia = await Promise.all(
        data.map(async (item: PlaylistItem) => {
          const { data: mediaData } = await supabase
            .from('media_library')
            .select('*')
            .eq('id', item.media_id)
            .maybeSingle()
          
          return { ...item, media: mediaData as MediaLibraryItem | undefined }
        })
      )
      setPlaylistItems(itemsWithMedia)
    }
  }

  const loadAllMedia = async () => {
    const { data } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setAllMedia(data as MediaLibraryItem[])
  }

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return

    const { data } = await supabase
      .from('playlists')
      .insert({
        name: newPlaylistName,
        description: newPlaylistDesc || null,
        is_autoplay: false
      })
      .select()
      .maybeSingle()

    if (data) {
      setPlaylists([data as Playlist, ...playlists])
      setNewPlaylistName('')
      setNewPlaylistDesc('')
      setShowCreateDialog(false)
    }
  }

  const deletePlaylist = async (id: string) => {
    if (!confirm('Delete this playlist?')) return

    await supabase.from('playlist_items').delete().eq('playlist_id', id)
    await supabase.from('playlists').delete().eq('id', id)
    
    setPlaylists(playlists.filter(p => p.id !== id))
    if (selectedPlaylist?.id === id) setSelectedPlaylist(null)
  }

  const addMediaToPlaylist = async (mediaId: string) => {
    if (!selectedPlaylist) return

    const maxPosition = playlistItems.reduce((max, item) => Math.max(max, item.position), -1)

    await supabase
      .from('playlist_items')
      .insert({
        playlist_id: selectedPlaylist.id,
        media_id: mediaId,
        position: maxPosition + 1
      })

    loadPlaylistItems(selectedPlaylist.id)
  }

  const removeFromPlaylist = async (itemId: string) => {
    await supabase.from('playlist_items').delete().eq('id', itemId)
    if (selectedPlaylist) loadPlaylistItems(selectedPlaylist.id)
  }

  const toggleAutoplay = async (playlist: Playlist) => {
    await supabase
      .from('playlists')
      .update({ is_autoplay: !playlist.is_autoplay })
      .eq('id', playlist.id)
    
    loadPlaylists()
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ListVideo className="w-6 h-6 text-purple-500" />
          Playlist Manager
        </h2>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Playlist
        </button>
      </div>

      {showCreateDialog && (
        <div className="mb-6 p-4 bg-[#1a1a1a] rounded border border-purple-500/30">
          <h3 className="font-bold mb-3">Create New Playlist</h3>
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded mb-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newPlaylistDesc}
            onChange={(e) => setNewPlaylistDesc(e.target.value)}
            className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={createPlaylist}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateDialog(false)
                setNewPlaylistName('')
                setNewPlaylistDesc('')
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-gray-400 mb-3">PLAYLISTS</h3>
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              className={`p-3 rounded border cursor-pointer ${
                selectedPlaylist?.id === playlist.id
                  ? 'bg-purple-600/20 border-purple-500'
                  : 'bg-[#1a1a1a] border-[#3a3a3a] hover:border-purple-500/50'
              }`}
              onClick={() => setSelectedPlaylist(playlist)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{playlist.name}</div>
                  {playlist.description && (
                    <div className="text-xs text-gray-400 mt-1">{playlist.description}</div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePlaylist(playlist.id)
                  }}
                  className="p-1 hover:bg-red-600 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleAutoplay(playlist)
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    playlist.is_autoplay ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  {playlist.is_autoplay ? 'Autoplay ON' : 'Autoplay OFF'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-2">
          {selectedPlaylist ? (
            <>
              <h3 className="font-bold text-sm text-gray-400 mb-3">
                PLAYLIST ITEMS - {selectedPlaylist.name}
              </h3>
              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
                {playlistItems.map(item => (
                  <div key={item.id} className="bg-[#1a1a1a] rounded border border-[#3a3a3a] p-3 flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-600" />
                    <div className="w-16 h-12 bg-black rounded">
                      {item.media?.file_type === 'image' ? (
                        <img src={item.media.file_url} alt="" className="w-full h-full object-cover rounded" />
                      ) : item.media?.file_type === 'video' ? (
                        <video src={item.media.file_url} className="w-full h-full object-cover rounded" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{item.media?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">Position: {item.position + 1}</div>
                    </div>
                    <button
                      onClick={() => removeFromPlaylist(item.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {playlistItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No items in this playlist</div>
                )}
              </div>

              <h3 className="font-bold text-sm text-gray-400 mb-3">ADD MEDIA</h3>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {allMedia.map(media => (
                  <div
                    key={media.id}
                    className="bg-[#1a1a1a] rounded border border-[#3a3a3a] p-2 flex items-center gap-2 cursor-pointer hover:border-purple-500/50"
                    onClick={() => addMediaToPlaylist(media.id)}
                  >
                    <div className="w-12 h-9 bg-black rounded">
                      {media.file_type === 'image' ? (
                        <img src={media.file_url} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        <video src={media.file_url} className="w-full h-full object-cover rounded" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{media.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{media.file_type}</div>
                    </div>
                    <Plus className="w-4 h-4 text-purple-500" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ListVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a playlist to view and edit items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
