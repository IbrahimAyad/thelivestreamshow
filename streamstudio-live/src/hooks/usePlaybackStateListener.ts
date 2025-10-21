import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MusicTrack } from '@/types/database'

interface PlaybackState {
  currentTrack: MusicTrack | null
  isPlaying: boolean
  position: number
  duration: number
  bpm: number | null
  energy: number
  autodjActive: boolean
  // Real-time audio analysis data
  audioBass: number
  audioMid: number
  audioHigh: number
}

/**
 * Lightweight hook for broadcast overlay
 * Only listens to playback state - does NOT load or play audio
 */
export function usePlaybackStateListener(): PlaybackState {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autodjActive, setAutodjActive] = useState(false)
  const [audioBass, setAudioBass] = useState(0)
  const [audioMid, setAudioMid] = useState(0)
  const [audioHigh, setAudioHigh] = useState(0)

  // Subscribe to playback state changes
  useEffect(() => {
    console.log('[PlaybackListener] 📡 Subscribing to playback state...')

    const channel = supabase
      .channel('broadcast-playback-state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audio_playback_state',
        },
        async (payload) => {
          console.log('[PlaybackListener] 🔄 Playback state updated:', payload)
          const state = payload.new as any

          if (state.current_track_id) {
            // Fetch track details
            const { data: track } = await supabase
              .from('music_library')
              .select('*')
              .eq('id', state.current_track_id)
              .single()

            if (track) {
              console.log('[PlaybackListener] 🎵 Track:', track.title)
              setCurrentTrack(track)
              setDuration(track.duration || 0)
            }
          }

          setIsPlaying(state.is_playing || false)
          setPosition(state.playback_position || 0)
          setAudioBass(state.audio_bass || 0)
          setAudioMid(state.audio_mid || 0)
          setAudioHigh(state.audio_high || 0)
        }
      )
      .subscribe()

    // Initial fetch
    const fetchInitialState = async () => {
      const { data: state } = await supabase
        .from('audio_playback_state')
        .select('*')
        .single()

      if (state && state.current_track_id) {
        const { data: track } = await supabase
          .from('music_library')
          .select('*')
          .eq('id', state.current_track_id)
          .single()

        if (track) {
          console.log('[PlaybackListener] 🎵 Initial track:', track.title)
          setCurrentTrack(track)
          setDuration(track.duration || 0)
        }

        setIsPlaying(state.is_playing || false)
        setPosition(state.playback_position || 0)
        setAudioBass(state.audio_bass || 0)
        setAudioMid(state.audio_mid || 0)
        setAudioHigh(state.audio_high || 0)
      }
    }

    fetchInitialState()

    return () => {
      console.log('[PlaybackListener] 🔌 Unsubscribing from playback state')
      supabase.removeChannel(channel)
    }
  }, [])

  // Check Auto-DJ status from localStorage
  useEffect(() => {
    const checkAutoDJ = () => {
      const enabled = localStorage.getItem('auto-dj-enabled') === 'true'
      setAutodjActive(enabled)
    }

    checkAutoDJ()
    const interval = setInterval(checkAutoDJ, 2000)
    return () => clearInterval(interval)
  }, [])

  // Update position locally for smooth progress (when playing)
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setPosition((prev) => {
        const next = prev + 0.1
        return next <= duration ? next : duration
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, duration])

  return {
    currentTrack,
    isPlaying,
    position,
    duration,
    bpm: currentTrack?.bpm || null,
    energy: currentTrack?.energy_level || 5,
    autodjActive,
    audioBass,
    audioMid,
    audioHigh,
  }
}
