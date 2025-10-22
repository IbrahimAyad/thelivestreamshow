/**
 * Enhanced Auto-DJ with AI Transition Intelligence
 * Integrates automatic track selection with professional DJ transition techniques
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { scoreAllTracks, type ScoredTrack, type AutoDJSettings as AutoDJSettingsType } from '@/utils/studio/trackScorer'
import { 
  generateTransitionPlan, 
  selectTransitionType, 
  AITransitionController,
  type AITransitionConfig,
  type AITransitionPlan,
  type TrackAnalysis
} from '@/utils/aiDjIntelligence'
import type { MusicTrack, AutoDJSettings } from "@/types/database"
import type { ThreeBandEQ } from '@/utils/eqSystem'
import type { ProfessionalFXChain } from '@/utils/fxChain'

interface UseEnhancedAutoDJOptions {
  currentDeck: 'A' | 'B'
  deckATrack: MusicTrack | null
  deckBTrack: MusicTrack | null
  deckAPosition: number
  deckBPosition: number
  deckADuration: number
  deckBDuration: number
  deckAPlaying: boolean
  deckBPlaying: boolean
  allTracks: MusicTrack[]
  onTrackQueue: (deck: 'A' | 'B', track: MusicTrack, reason?: string, score?: number) => void
  onStartTransition: (fromDeck: 'A' | 'B', toDeck: 'A' | 'B', duration: number) => void
  getDeckEQ: (deck: 'A' | 'B') => ThreeBandEQ | null
  getDeckFX: (deck: 'A' | 'B') => ProfessionalFXChain | null
}

export interface TransitionState {
  isActive: boolean
  fromDeck: 'A' | 'B' | null
  toDeck: 'A' | 'B' | null
  plan: AITransitionPlan | null
  type: AITransitionConfig['transitionType'] | null
  duration: number
  progress: number
}

export function useEnhancedAutoDJ(options: UseEnhancedAutoDJOptions) {
  const {
    currentDeck,
    deckATrack,
    deckBTrack,
    deckAPosition,
    deckBPosition,
    deckADuration,
    deckBDuration,
    deckAPlaying,
    deckBPlaying,
    allTracks,
    onTrackQueue,
    onStartTransition,
    getDeckEQ,
    getDeckFX,
  } = options
  
  const [settings, setSettings] = useState<AutoDJSettings | null>(null)
  const [suggestedTrack, setSuggestedTrack] = useState<ScoredTrack | null>(null)
  const [lockedTrack, setLockedTrack] = useState<ScoredTrack | null>(null)
  const [playHistory, setPlayHistory] = useState<any[]>([])
  const [aiEnabled, setAiEnabled] = useState(true)
  
  const [transition, setTransition] = useState<TransitionState>({
    isActive: false,
    fromDeck: null,
    toDeck: null,
    plan: null,
    type: null,
    duration: 8,
    progress: 0,
  })
  
  const suggestionGeneratedRef = useRef(false)
  const trackQueuedRef = useRef(false)
  const transitionControllerRef = useRef<AITransitionController | null>(null)
  
  // Get current active track and position
  const currentTrack = currentDeck === 'A' ? deckATrack : deckBTrack
  const currentPosition = currentDeck === 'A' ? deckAPosition : deckBPosition
  const currentDuration = currentDeck === 'A' ? deckADuration : deckBDuration
  const currentPlaying = currentDeck === 'A' ? deckAPlaying : deckBPlaying
  
  // Load settings
  useEffect(() => {
    fetchSettings()
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
    if (!settings?.enabled || !currentTrack || !currentPlaying || !currentDuration) return
    
    const progress = currentPosition / currentDuration
    
    // Generate suggestion at 50% progress
    if (progress >= 0.5 && !suggestionGeneratedRef.current && !lockedTrack) {
      generateSuggestion()
      suggestionGeneratedRef.current = true
    }
    
    // Prepare transition at 75% progress
    const timeRemaining = currentDuration - currentPosition
    if ((progress >= 0.75 || timeRemaining <= 15) && !trackQueuedRef.current) {
      prepareTransition()
      trackQueuedRef.current = true
    }
  }, [settings?.enabled, currentTrack, currentPlaying, currentPosition, currentDuration, lockedTrack])
  
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
    
    if (scored.length > 0) {
      setSuggestedTrack(scored[0])
      console.log('[AI DJ] Suggestion:', scored[0].track.title, 'Score:', scored[0].totalScore)
    }
  }, [currentTrack, allTracks, playHistory, settings])
  
  // Prepare AI-powered transition
  const prepareTransition = useCallback(async () => {
    const nextTrack = lockedTrack || suggestedTrack
    if (!nextTrack || !currentTrack) return
    
    const nextDeck = currentDeck === 'A' ? 'B' : 'A'
    
    // Load track to the other deck
    onTrackQueue(nextDeck, nextTrack.track, nextTrack.reason, nextTrack.totalScore)
    
    // Generate AI transition plan if AI is enabled
    if (aiEnabled) {
      const currentTrackAnalysis: TrackAnalysis = {
        energy: (currentTrack.energy_level || 50) / 100,
        mood: 'energetic',
        genre: currentTrack.category || 'electronic',
        key: currentTrack.musical_key || 'C',
        bpm: currentTrack.bpm || 120,
        danceability: 0.7,
        valence: 0.6,
        acousticness: 0.2,
        instrumentalness: 0.8
      };
      
      const nextTrackAnalysis: TrackAnalysis = {
        energy: (nextTrack.track.energy_level || 50) / 100,
        mood: 'energetic',
        genre: nextTrack.track.category || 'electronic',
        key: nextTrack.track.musical_key || 'C',
        bpm: nextTrack.track.bpm || 120,
        danceability: 0.7,
        valence: 0.6,
        acousticness: 0.2,
        instrumentalness: 0.8
      };
      
      const transitionType = selectTransitionType(currentTrackAnalysis, nextTrackAnalysis)
      
      const transitionConfig: AITransitionConfig = {
        enabled: true,
        confidenceThreshold: 0.7,
        maxSuggestions: 5,
        preferredTransitionTypes: ['smooth', 'beatmatch'],
        currentTrack: currentTrackAnalysis,
        nextTrack: nextTrackAnalysis,
        transitionType,
        transitionDuration: 8, // 8 seconds default
      }
      
      const plan = generateTransitionPlan(transitionConfig)
      
      setTransition({
        isActive: true,
        fromDeck: currentDeck,
        toDeck: nextDeck,
        plan,
        type: transitionType,
        duration: 8,
        progress: 0,
      })
      
      console.log(`[AI DJ] Transition prepared: ${transitionType}`, plan)
      
      // Start transition when track is near end (5 seconds before)
      const startTransitionIn = Math.max(0, (currentDuration - currentPosition) - 8)
      setTimeout(() => {
        executeTransition(currentDeck, nextDeck, plan, 8)
      }, startTransitionIn * 1000)
    } else {
      // Simple crossfade without AI
      const nextDeck = currentDeck === 'A' ? 'B' : 'A'
      const startTransitionIn = Math.max(0, (currentDuration - currentPosition) - 8)
      setTimeout(() => {
        onStartTransition(currentDeck, nextDeck, 8)
      }, startTransitionIn * 1000)
    }
    
    // Record to play history
    try {
      await supabase.from('play_history').insert({
        track_id: nextTrack.track.id,
        auto_selected: !lockedTrack
      })
      await fetchPlayHistory()
    } catch (error) {
      console.error('Failed to record play history:', error)
    }
  }, [lockedTrack, suggestedTrack, currentTrack, currentDeck, currentDuration, currentPosition, aiEnabled, onTrackQueue, onStartTransition])
  
  // Execute AI transition
  const executeTransition = useCallback((fromDeck: 'A' | 'B', toDeck: 'A' | 'B', plan: AITransitionPlan, duration: number) => {
    const fromEQ = getDeckEQ(fromDeck)
    const toEQ = getDeckEQ(toDeck)
    const fromFX = getDeckFX(fromDeck)
    const toFX = getDeckFX(toDeck)
    
    if (!fromEQ || !toEQ) {
      console.warn('[AI DJ] EQ systems not available, falling back to simple crossfade')
      onStartTransition(fromDeck, toDeck, duration)
      return
    }
    
    // Create AI transition controller
    const controller = new AITransitionController()
    transitionControllerRef.current = controller
    
    // Start AI automation
    controller.start()
    
    // Also start crossfade
    onStartTransition(fromDeck, toDeck, duration)
    
    // Stop AI automation after transition completes
    setTimeout(() => {
      controller.stop()
      transitionControllerRef.current = null
      setTransition(prev => ({ ...prev, isActive: false }))
    }, duration * 1000)
    
    console.log('[AI DJ] Transition executing with AI automation')
  }, [getDeckEQ, getDeckFX, onStartTransition])
  
  // Manual controls
  const skipSuggestion = useCallback(() => {
    // Regenerate suggestion with next best track
    generateSuggestion()
  }, [generateSuggestion])
  
  const lockCustomTrack = useCallback((track: MusicTrack) => {
    if (!currentTrack || !settings) return
    
    const settingsForScoring: AutoDJSettingsType = {
      enabled: settings.enabled,
      prefer_harmonic: settings.prefer_harmonic,
      strict_bpm: settings.strict_bpm,
      energy_style: settings.energy_style as 'gradual' | 'peak-valley' | 'chill',
      recency_limit: settings.recency_limit
    }
    
    const scored = scoreAllTracks(currentTrack, [track], playHistory, settingsForScoring)
    if (scored.length > 0) {
      setLockedTrack(scored[0])
      setSuggestedTrack(null)
    }
  }, [currentTrack, playHistory, settings])
  
  const unlockCustomTrack = useCallback(() => {
    setLockedTrack(null)
    if (suggestionGeneratedRef.current) {
      generateSuggestion()
    }
  }, [generateSuggestion])
  
  const toggleAI = useCallback(() => {
    setAiEnabled(prev => !prev)
  }, [])
  
  return {
    settings,
    suggestedTrack,
    lockedTrack,
    playHistory,
    transition,
    aiEnabled,
    skipSuggestion,
    lockCustomTrack,
    unlockCustomTrack,
    toggleAI,
    updateSettings: setSettings,
  }
}
