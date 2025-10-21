import { useState, useEffect } from 'react'
import { ListFilter, Trash2, Play } from 'lucide-react'
import type { SmartPlaylist, MusicTrack } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface SmartPlaylistsPanelProps {
  onLoadPlaylist: (tracks: MusicTrack[]) => void
}

export function SmartPlaylistsPanel({ onLoadPlaylist }: SmartPlaylistsPanelProps) {
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSmartPlaylists()
  }, [])

  const loadSmartPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_playlists')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSmartPlaylists(data || [])
    } catch (error) {
      console.error('Failed to load smart playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadPlaylist = async (playlist: SmartPlaylist) => {
    try {
      const filter = playlist.filter_config as any
      let query = supabase.from('music_library').select('*')

      // Apply filters
      if (filter.tags && filter.tags.length > 0) {
        if (filter.tagsLogic === 'AND') {
          query = query.contains('tags', filter.tags)
        } else {
          query = query.overlaps('tags', filter.tags)
        }
      }

      if (filter.moods && filter.moods.length > 0) {
        query = query.in('mood', filter.moods)
      }

      if (filter.energyRange) {
        query = query
          .gte('energy_level', filter.energyRange[0])
          .lte('energy_level', filter.energyRange[1])
      }

      if (filter.durationRange) {
        query = query
          .gte('duration', filter.durationRange[0])
          .lte('duration', filter.durationRange[1])
      }

      if (filter.categories && filter.categories.length > 0) {
        query = query.in('category', filter.categories)
      }

      const { data, error } = await query
      if (error) throw error

      onLoadPlaylist(data || [])
    } catch (error) {
      console.error('Failed to load smart playlist tracks:', error)
      alert('Failed to load playlist')
    }
  }

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this smart playlist?')) return

    try {
      await supabase.from('smart_playlists').delete().eq('id', id)
      await loadSmartPlaylists()
    } catch (error) {
      console.error('Failed to delete smart playlist:', error)
      alert('Failed to delete playlist')
    }
  }

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
        <p className="text-center text-neutral-400 py-4">Loading smart playlists...</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <ListFilter className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold">Smart Playlists</h3>
      </div>

      {smartPlaylists.length === 0 ? (
        <p className="text-center text-neutral-400 text-sm py-8">
          No smart playlists created yet
        </p>
      ) : (
        <div className="space-y-2">
          {smartPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="group bg-neutral-800 border border-neutral-700 rounded p-3 hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-neutral-100 truncate">
                    {playlist.name}
                  </h4>
                  {playlist.description && (
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleLoadPlaylist(playlist)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-neutral-700 transition-all"
                    title="Load this smart playlist"
                  >
                    <Play className="w-4 h-4 text-primary-400" />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-neutral-700 transition-all"
                    title="Delete this smart playlist"
                  >
                    <Trash2 className="w-4 h-4 text-error-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
