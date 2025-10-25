import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface EpisodeInfo {
  id: string
  episode_number: number
  episode_title: string
  episode_topic: string | null
  episode_date: string | null
  season_number: number
  show_name: string
  is_visible: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UseEpisodeInfoReturn {
  episodeData: EpisodeInfo | null
  isVisible: boolean
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  toggleVisibility: () => Promise<void>
}

/**
 * Universal Episode Data Hook
 * 
 * This hook provides a clean interface for any overlay component to access
 * episode data from the episode_info table with real-time updates.
 * 
 * Usage:
 * ```tsx
 * const { episodeData, isVisible, toggleVisibility } = useEpisodeInfo()
 * 
 * if (!isVisible || !episodeData) return null
 * 
 * return <YourOverlay episodeData={episodeData} />
 * ```
 */
export function useEpisodeInfo(): UseEpisodeInfoReturn {
  const [episodeData, setEpisodeData] = useState<EpisodeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEpisodeData = async () => {
    try {
      setError(null)
      setLoading(true)

      const { data, error: queryError } = await supabase
        .from('episode_info')
        .select('*')
        .eq('is_active', true)
        .eq('is_visible', true)
        .maybeSingle()

      if (queryError) {
        console.error('Error loading episode data:', queryError)
        setError(queryError.message)
        setEpisodeData(null)
      } else {
        setEpisodeData(data)
      }
    } catch (err) {
      console.error('Failed to load episode data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setEpisodeData(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async () => {
    if (!episodeData) return

    try {
      const newVisibility = !episodeData.is_visible
      
      const { data, error } = await supabase
        .from('episode_info')
        .update({ is_visible: newVisibility })
        .eq('id', episodeData.id)
        .select()
        .single()

      if (error) {
        console.error('Error toggling visibility:', error)
        setError(error.message)
      } else {
        setEpisodeData(data)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    loadEpisodeData()

    // Real-time subscription for episode_info changes
    const channel = supabase
      .channel('universal_episode_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_info'
      }, (payload) => {
        console.log('Episode data changed:', payload)
        
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newData = payload.new as EpisodeInfo
          
          // Only show if both is_active and is_visible are true
          if (newData.is_active && newData.is_visible) {
            setEpisodeData(newData)
          } else {
            setEpisodeData(null)
          }
        } else if (payload.eventType === 'DELETE') {
          setEpisodeData(null)
        }
        
        setError(null)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return {
    episodeData,
    isVisible: episodeData?.is_visible === true && episodeData?.is_active === true,
    loading,
    error,
    refetch: loadEpisodeData,
    toggleVisibility
  }
}

export default useEpisodeInfo