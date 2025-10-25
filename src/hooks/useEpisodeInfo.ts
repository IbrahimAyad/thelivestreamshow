import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface EpisodeInfo {
  id: string
  episode_number: number
  episode_date: string
  episode_title: string
  episode_topic: string
  is_active: boolean
  is_visible: boolean
  created_at: string
  updated_at: string
}

/**
 * Universal Episode Info Hook
 * 
 * Real-time subscription to episode_info table
 * Automatically manages visibility, updates, and data sync
 * 
 * Usage:
 * ```tsx
 * const { episodeInfo, isVisible, toggleVisibility } = useEpisodeInfo()
 * 
 * if (!isVisible || !episodeInfo) return null
 * 
 * return <div>Episode {episodeInfo.episode_number}</div>
 * ```
 */
export function useEpisodeInfo() {
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch initial episode data
    const fetchEpisodeInfo = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('episode_info')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError) throw fetchError

        setEpisodeInfo(data)
      } catch (err) {
        console.error('[useEpisodeInfo] Error fetching episode:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch episode info')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEpisodeInfo()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('episode_info_universal')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'episode_info',
        },
        (payload) => {
          console.log('[useEpisodeInfo] Real-time update:', payload.eventType)

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as EpisodeInfo
            if (newData.is_active) {
              setEpisodeInfo(newData)
            }
          } else if (payload.eventType === 'DELETE') {
            const oldData = payload.old as { id: string }
            if (episodeInfo?.id === oldData.id) {
              setEpisodeInfo(null)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  /**
   * Toggle visibility for current episode
   */
  const toggleVisibility = async () => {
    if (!episodeInfo) return

    try {
      const newVisibility = !episodeInfo.is_visible

      const { error: updateError } = await supabase
        .from('episode_info')
        .update({ is_visible: newVisibility })
        .eq('id', episodeInfo.id)

      if (updateError) throw updateError

      console.log(`✅ [useEpisodeInfo] Visibility toggled: ${newVisibility}`)
    } catch (err) {
      console.error('[useEpisodeInfo] Error toggling visibility:', err)
      throw err
    }
  }

  return {
    episodeInfo,
    isVisible: episodeInfo?.is_visible ?? false,
    isLoading,
    error,
    toggleVisibility,
  }
}
