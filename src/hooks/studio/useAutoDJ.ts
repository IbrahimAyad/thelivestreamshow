// Auto-DJ Integration Hook
// Manages automatic track selection and queueing

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { scoreAllTracks, findTrackByEnergy, type ScoredTrack, type AutoDJSettings as AutoDJSettingsType, type PlayHistoryEntry } from '@/utils/studio/trackScorer'
import type { MusicTrack, AutoDJSettings } from '@/types/database'

interface UseAutoDJOptions {
  currentTrack: MusicTrack | null
  isPlaying: boolean
  playbackPosition: number
  duration: number
  allTracks: MusicTrack[]
  onTrackQueue: (track: MusicTrack, reason?: string, score?: number) => void
}

export function useAutoDJ({
  currentTrack,
  isPlaying,
  playbackPosition,
  duration,
  allTracks,
  onTrackQueue
}: UseAutoDJOptions) {
  const [settings, setSettings] = useState<AutoDJSettings | null>(null)
  const [suggestedTrack, setSuggestedTrack] = useState<ScoredTrack | null>(null)
  const [lockedTrack, setLockedTrack] = useState<ScoredTrack | null>(null)
  const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([])
  const [scoredTracks, setScoredTracks] = useState<ScoredTrack[]>([])
  
  const suggestionGeneratedRef = useRef(false)
  const trackQueuedRef = useRef(false)
  
  // Load settings
  useEffect(() => {
    fetchSettings()
  }, [])
  
  // Load play history
  useEffect(() => {
    fetchPlayHistory()
  }, [])
  
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_dj_settings')
        .select('*')
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      if (data) setSettings(data)
    } catch (error) {
      console.error('Failed to fetch Auto-DJ settings:', error)
    }
  }
  
  const fetchPlayHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('play_history')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setPlayHistory(data || [])
    } catch (error) {
      console.error('Failed to fetch play history:', error)
    }
  }
  
  // Reset suggestion when track changes
  useEffect(() => {
    suggestionGeneratedRef.current = false
    trackQueuedRef.current = false
    setSuggestedTrack(null)
    setLockedTrack(null)
  }, [currentTrack?.id])
  
  // Monitor playback progress for Auto-DJ
  useEffect(() => {
    if (!settings?.enabled || !currentTrack || !isPlaying || !duration) return
    
    const progress = playbackPosition / duration
    
    // Generate suggestion at 50% progress
    if (progress >= 0.5 && !suggestionGeneratedRef.current && !lockedTrack) {
      generateSuggestion()
      suggestionGeneratedRef.current = true
    }
    
    // Auto-queue at 90% progress or 10 seconds before end
    const timeRemaining = duration - playbackPosition
    if ((progress >= 0.9 || timeRemaining <= 10) && !trackQueuedRef.current) {
      queueNextTrack()
      trackQueuedRef.current = true
    }
  }, [settings?.enabled, currentTrack, isPlaying, playbackPosition, duration, lockedTrack])
  
  // Generate automatic suggestion
  const generateSuggestion = useCallback(() => {
    if (!currentTrack || !settings) return
    
    const settingsForScoring: AutoDJSettingsType = {
      enabled: settings.enabled,
      prefer_harmonic: settings.prefer_harmonic,
      strict_bpm: settings.strict_bpm,
      energy_style: settings.energy_style as 'gradual' | 'peak-valley' | 'chill',
      recency_limit: settings.recency_limit
    }
    
    const scored = scoreAllTracks(
      currentTrack,
      allTracks,
      playHistory,
      settingsForScoring
    )
    
    setScoredTracks(scored)
    
    if (scored.length > 0) {
      setSuggestedTrack(scored[0])
      console.log('Auto-DJ suggestion:', scored[0].track.title, 'Score:', scored[0].totalScore)
    }
  }, [currentTrack, allTracks, playHistory, settings])
  
  // Queue next track
  const queueNextTrack = useCallback(async () => {
    const nextTrack = lockedTrack || suggestedTrack
    
    if (!nextTrack) return
    
    // Record to play history
    try {
      await supabase.from('play_history').insert({
        track_id: nextTrack.track.id,
        auto_selected: !lockedTrack
      })
      
      // Refresh history
      await fetchPlayHistory()
    } catch (error) {
      console.error('Failed to record play history:', error)
    }
    
    // Queue track with reason and score
    const reason = lockedTrack ? 'Custom locked track' : nextTrack.reason
    onTrackQueue(nextTrack.track, reason, nextTrack.totalScore)
    
    console.log('Auto-DJ queued:', nextTrack.track.title)
  }, [lockedTrack, suggestedTrack, onTrackQueue])
  
  // Manual override: Accept suggestion
  const acceptSuggestion = useCallback(() => {
    if (!suggestedTrack) return
    // Suggestion is already queued at 90%, this just confirms it
    console.log('Suggestion accepted:', suggestedTrack.track.title)
  }, [suggestedTrack])
  
  // Manual override: Skip to next best
  const skipSuggestion = useCallback(() => {
    if (scoredTracks.length < 2) return
    
    // Get next best track (index 1)
    const nextBest = scoredTracks[1]
    setSuggestedTrack(nextBest)
    console.log('Skipped to next best:', nextBest.track.title, 'Score:', nextBest.totalScore)
  }, [scoredTracks])
  
  // Manual override: Lock custom track
  const lockCustomTrack = useCallback((track: MusicTrack) => {
    if (!currentTrack || !settings) return
    
    const settingsForScoring: AutoDJSettingsType = {
      enabled: settings.enabled,
      prefer_harmonic: settings.prefer_harmonic,
      strict_bpm: settings.strict_bpm,
      energy_style: settings.energy_style as 'gradual' | 'peak-valley' | 'chill',
      recency_limit: settings.recency_limit
    }
    
    // Score the locked track
    const scored = scoreAllTracks(
      currentTrack,
      [track],
      playHistory,
      settingsForScoring
    )
    
    if (scored.length > 0) {
      setLockedTrack(scored[0])
      setSuggestedTrack(null)
      console.log('Locked custom track:', track.title)
    }
  }, [currentTrack, playHistory, settings])
  
  // Manual override: Unlock custom track
  const unlockCustomTrack = useCallback(() => {
    setLockedTrack(null)
    // Re-generate suggestion
    if (suggestionGeneratedRef.current) {
      generateSuggestion()
    }
    console.log('Unlocked custom track')
  }, [generateSuggestion])
  
  // Manual override: Request specific energy level
  const requestEnergy = useCallback((targetEnergy: number) => {
    if (!currentTrack || !settings) return
    
    const settingsForScoring: AutoDJSettingsType = {
      enabled: settings.enabled,
      prefer_harmonic: settings.prefer_harmonic,
      strict_bpm: settings.strict_bpm,
      energy_style: settings.energy_style as 'gradual' | 'peak-valley' | 'chill',
      recency_limit: settings.recency_limit
    }
    
    const energyTrack = findTrackByEnergy(
      currentTrack,
      allTracks,
      playHistory,
      settingsForScoring,
      targetEnergy
    )
    
    if (energyTrack) {
      setSuggestedTrack(energyTrack)
      console.log('Energy request:', energyTrack.track.title, 'at E' + targetEnergy)
    } else {
      alert(`No tracks found at energy level ${targetEnergy}`)
    }
  }, [currentTrack, allTracks, playHistory, settings])
  
  // Update settings
  const updateSettings = useCallback((updates: Partial<AutoDJSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null)
  }, [])
  
  return {
    settings,
    suggestedTrack,
    lockedTrack,
    playHistory,
    acceptSuggestion,
    skipSuggestion,
    lockCustomTrack,
    unlockCustomTrack,
    requestEnergy,
    updateSettings,
    refreshHistory: fetchPlayHistory
  }
}
