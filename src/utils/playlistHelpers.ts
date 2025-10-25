/**
 * Playlist Integration Helpers
 * 
 * Utilities for loading playlists from Supabase and integrating with the global MusicProvider
 */

import { supabase } from '../lib/supabase'
import type { MusicTrack, Playlist } from '../types/database'
import type { Track } from '../contexts/MusicProvider'
import { musicTrackToTrack } from '../contexts/MusicProvider'

/**
 * Load playlist tracks from Supabase
 * 
 * @param playlistId - Playlist ID
 * @returns Array of Track objects ready for playback
 */
export async function loadPlaylistTracks(playlistId: string): Promise<Track[]> {
  try {
    // Fetch playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('track_ids')
      .eq('id', playlistId)
      .single()
    
    if (playlistError) throw playlistError
    if (!playlist?.track_ids || playlist.track_ids.length === 0) {
      console.warn('[PlaylistHelper] Playlist has no tracks:', playlistId)
      return []
    }
    
    // Fetch track details
    const { data: tracks, error: tracksError } = await supabase
      .from('music_library')
      .select('*')
      .in('id', playlist.track_ids)
    
    if (tracksError) throw tracksError
    if (!tracks) return []
    
    // Convert to Track format and maintain playlist order
    const trackMap = new Map(tracks.map(t => [t.id, t]))
    const orderedTracks = playlist.track_ids
      .map(id => trackMap.get(id))
      .filter((t): t is MusicTrack => t !== undefined)
      .map(musicTrackToTrack)
    
    console.log(`[PlaylistHelper] Loaded ${orderedTracks.length} tracks from playlist ${playlistId}`)
    return orderedTracks
  } catch (error) {
    console.error('[PlaylistHelper] Failed to load playlist:', error)
    throw error
  }
}

/**
 * Load all playlists from Supabase
 * 
 * @returns Array of playlists
 */
export async function loadPlaylists(): Promise<Playlist[]> {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[PlaylistHelper] Failed to load playlists:', error)
    throw error
  }
}

/**
 * Create a new playlist
 * 
 * @param name - Playlist name
 * @param trackIds - Array of track IDs (optional)
 * @returns Created playlist
 */
export async function createPlaylist(name: string, trackIds: string[] = []): Promise<Playlist> {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .insert({
        name,
        track_ids: trackIds,
        is_active: true
      })
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error('No data returned from playlist creation')
    
    console.log('[PlaylistHelper] Created playlist:', data.id)
    return data
  } catch (error) {
    console.error('[PlaylistHelper] Failed to create playlist:', error)
    throw error
  }
}

/**
 * Add track to playlist
 * 
 * @param playlistId - Playlist ID
 * @param trackId - Track ID to add
 */
export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  try {
    // Fetch current track_ids
    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('track_ids')
      .eq('id', playlistId)
      .single()
    
    if (fetchError) throw fetchError
    
    const currentTrackIds = playlist?.track_ids || []
    
    // Avoid duplicates
    if (currentTrackIds.includes(trackId)) {
      console.warn('[PlaylistHelper] Track already in playlist')
      return
    }
    
    // Update playlist
    const { error: updateError } = await supabase
      .from('playlists')
      .update({
        track_ids: [...currentTrackIds, trackId],
        updated_at: new Date().toISOString()
      })
      .eq('id', playlistId)
    
    if (updateError) throw updateError
    
    console.log('[PlaylistHelper] Added track to playlist:', playlistId)
  } catch (error) {
    console.error('[PlaylistHelper] Failed to add track to playlist:', error)
    throw error
  }
}

/**
 * Remove track from playlist
 * 
 * @param playlistId - Playlist ID
 * @param trackId - Track ID to remove
 */
export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  try {
    // Fetch current track_ids
    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('track_ids')
      .eq('id', playlistId)
      .single()
    
    if (fetchError) throw fetchError
    
    const currentTrackIds = playlist?.track_ids || []
    const updatedTrackIds = currentTrackIds.filter(id => id !== trackId)
    
    // Update playlist
    const { error: updateError } = await supabase
      .from('playlists')
      .update({
        track_ids: updatedTrackIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', playlistId)
    
    if (updateError) throw updateError
    
    console.log('[PlaylistHelper] Removed track from playlist:', playlistId)
  } catch (error) {
    console.error('[PlaylistHelper] Failed to remove track from playlist:', error)
    throw error
  }
}

/**
 * Delete playlist
 * 
 * @param playlistId - Playlist ID to delete
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
    
    if (error) throw error
    
    console.log('[PlaylistHelper] Deleted playlist:', playlistId)
  } catch (error) {
    console.error('[PlaylistHelper] Failed to delete playlist:', error)
    throw error
  }
}

/**
 * React hook for playlist integration with MusicProvider
 * 
 * Example:
 * ```tsx
 * const { playlists, loadPlaylist, isLoading } = usePlaylistIntegration()
 * 
 * <button onClick={() => loadPlaylist('playlist-id')}>
 *   Load Playlist
 * </button>
 * ```
 */
export function usePlaylistIntegration() {
  const [playlists, setPlaylists] = React.useState<Playlist[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Load all playlists
  const refreshPlaylists = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await loadPlaylists()
      setPlaylists(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load playlists'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Load on mount
  React.useEffect(() => {
    refreshPlaylists()
  }, [refreshPlaylists])
  
  return {
    playlists,
    isLoading,
    error,
    refreshPlaylists,
    loadPlaylistTracks,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist
  }
}

// Note: Import React at the top when using this file
import React from 'react'
