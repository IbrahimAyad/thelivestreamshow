import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Playlist } from "@/types/database"

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all playlists
  const fetchPlaylists = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching playlists:', error)
    } else {
      setPlaylists(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlaylists()
  }, [])

  // Create playlist
  const createPlaylist = useCallback(
    async (name: string, description?: string) => {
      const { error } = await supabase.from('playlists').insert({
        name,
        description: description || null,
        track_ids: [],
      })

      if (error) {
        console.error('Error creating playlist:', error)
        throw error
      }

      await fetchPlaylists()
    },
    [fetchPlaylists]
  )

  // Update playlist
  const updatePlaylist = useCallback(
    async (id: string, updates: Partial<Playlist>) => {
      const { error } = await supabase
        .from('playlists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error updating playlist:', error)
        throw error
      }

      await fetchPlaylists()
    },
    [fetchPlaylists]
  )

  // Delete playlist
  const deletePlaylist = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('playlists').delete().eq('id', id)

      if (error) {
        console.error('Error deleting playlist:', error)
        throw error
      }

      await fetchPlaylists()
    },
    [fetchPlaylists]
  )

  // Add track to playlist
  const addTrackToPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist) return

      const currentTrackIds = playlist.track_ids || []
      if (currentTrackIds.includes(trackId)) return

      await updatePlaylist(playlistId, {
        track_ids: [...currentTrackIds, trackId],
      })
    },
    [playlists, updatePlaylist]
  )

  // Remove track from playlist
  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist) return

      const currentTrackIds = playlist.track_ids || []
      await updatePlaylist(playlistId, {
        track_ids: currentTrackIds.filter((id) => id !== trackId),
      })
    },
    [playlists, updatePlaylist]
  )

  // Reorder tracks in playlist
  const reorderPlaylistTracks = useCallback(
    async (playlistId: string, newTrackIds: string[]) => {
      await updatePlaylist(playlistId, { track_ids: newTrackIds })
    },
    [updatePlaylist]
  )

  return {
    playlists,
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    refreshPlaylists: fetchPlaylists,
  }
}
