import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AudioPlaybackState } from "@/types/database"

export function usePlaybackSync() {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState | null>(null)
  const [stateId, setStateId] = useState<string | null>(null)

  // Fetch initial state
  useEffect(() => {
    const fetchState = async () => {
      const { data, error } = await supabase
        .from('audio_playback_state')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching playback state:', error)
        return
      }

      if (data) {
        setPlaybackState(data)
        setStateId(data.id)
      }
    }

    fetchState()
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!stateId) return

    const channel = supabase
      .channel('audio_playback_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'audio_playback_state',
          filter: `id=eq.${stateId}`,
        },
        (payload) => {
          setPlaybackState(payload.new as AudioPlaybackState)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [stateId])

  // Update playback state
  const updatePlaybackState = useCallback(
    async (updates: Partial<AudioPlaybackState>) => {
      if (!stateId) return

      const { error } = await supabase
        .from('audio_playback_state')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', stateId)

      if (error) {
        console.error('Error updating playback state:', error)
      }
    },
    [stateId]
  )

  return {
    playbackState,
    updatePlaybackState,
  }
}
