/**
 * useShowIntroSequence - Timeline-based show intro orchestrator
 * 
 * Manages the automated intro sequence:
 * 1. Song 1 plays (Deck A) with DJ visualizer
 * 2. Crossfade to Song 2 (Deck B)
 * 3. Pause Song 2 at 1:19.5 and show tomato game
 * 4. Wait for boss defeated (no timer)
 * 5. Resume Song 2 from 1:19.5 and transition to main screen
 * 6. Song 2 completes naturally
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { useDualDeckAudioPlayer } from './studio/useDualDeckAudioPlayer'

export type IntroStep = 
  | 'idle'           // Not started
  | 'song1_playing'  // 0:00-3:30 - Song 1 on Deck A
  | 'crossfading'    // 3:30-4:30 - Crossfade to Deck B
  | 'song2_playing'  // 4:30-5:49 - Song 2 to 1:19.5
  | 'game_active'    // Paused at 1:19.5, waiting for boss defeat
  | 'resuming'       // Boss defeated, resuming song
  | 'song2_finishing'// Song 2 playing to end
  | 'complete'       // Sequence finished

export interface IntroSequenceConfig {
  song1Duration: number      // 3:30 (210 seconds)
  crossfadeDuration: number  // 1:00 (60 seconds)
  song2PausePoint: number    // 1:19.5 (79.5 seconds)
  transitionDelay: number    // 1 second (wait for ELIMINATED)
}

export interface IntroSequenceState {
  currentStep: IntroStep
  elapsedTime: number
  isRunning: boolean
  isPaused: boolean
  error: string | null
}

const DEFAULT_CONFIG: IntroSequenceConfig = {
  song1Duration: 210,        // 3:30
  crossfadeDuration: 60,     // 1:00
  song2PausePoint: 79.5,     // 1:19.5
  transitionDelay: 1,        // 1 second
}

export function useShowIntroSequence(
  dualDeck: ReturnType<typeof useDualDeckAudioPlayer>,
  config: Partial<IntroSequenceConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [currentStep, setCurrentStep] = useState<IntroStep>('idle')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(0)
  const stateIdRef = useRef<string>('00000000-0000-0000-0000-000000000001') // Fixed ID for single row

  // Sync state to Supabase whenever it changes
  useEffect(() => {
    const syncToSupabase = async () => {
      try {
        await supabase
          .from('show_intro_state')
          .update({
            current_step: currentStep,
            is_running: isRunning,
            is_paused: isPaused,
            elapsed_time: Math.floor(elapsedTime),
            show_dj_visualizer: currentStep === 'song1_playing' || currentStep === 'crossfading' || currentStep === 'song2_playing' || currentStep === 'song2_finishing',
            show_tomato_game: currentStep === 'game_active',
            error: error,
          })
          .eq('id', stateIdRef.current)
        
        console.log(`[ShowIntro] State synced to Supabase: ${currentStep}`)
      } catch (err) {
        console.error('[ShowIntro] Failed to sync state to Supabase:', err)
      }
    }

    syncToSupabase()
  }, [currentStep, isRunning, isPaused, error]) // Removed elapsedTime to reduce updates!

  // Listen for boss defeated event from game iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BOSS_DEFEATED') {
        console.log('[ShowIntro] Boss defeated! Resuming sequence...')
        handleBossDefeated()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [currentStep])

  // Monitor deck playback position for auto-progression
  useEffect(() => {
    if (!isRunning || isPaused) return

    const checkProgress = setInterval(() => {
      const deckAState = dualDeck.deckA.getDeckState()
      const deckBState = dualDeck.deckB.getDeckState()

      console.log(`[ShowIntro] Progress check - Step: ${currentStep}, Elapsed: ${elapsedTime.toFixed(1)}s, DeckA: ${deckAState.playbackPosition.toFixed(1)}s, DeckB: ${deckBState.playbackPosition.toFixed(1)}s`)

      // Step: song1_playing → crossfading (use elapsed time for reliability)
      if (currentStep === 'song1_playing' && elapsedTime >= fullConfig.song1Duration) {
        console.log('[ShowIntro] ⏭️ Song 1 duration reached, starting crossfade...')
        setCurrentStep('crossfading')
      }

      // Step: crossfading → song2_playing (use elapsed time)
      if (currentStep === 'crossfading' && elapsedTime >= fullConfig.song1Duration + fullConfig.crossfadeDuration) {
        console.log('[ShowIntro] ⏭️ Crossfade complete, Song 2 playing...')
        setCurrentStep('song2_playing')
      }

      // Step: song2_playing → game_active (use Deck B position OR elapsed time)
      const song2ElapsedTime = elapsedTime - fullConfig.song1Duration - fullConfig.crossfadeDuration
      if (currentStep === 'song2_playing' && (deckBState.playbackPosition >= fullConfig.song2PausePoint || song2ElapsedTime >= fullConfig.song2PausePoint)) {
        console.log('[ShowIntro] ⏭️ Reached pause point, activating game...')
        setCurrentStep('game_active')
      }

      // Step: song2_finishing → complete
      if (currentStep === 'song2_finishing' && !deckBState.isPlaying && deckBState.playbackPosition >= deckBState.duration - 1) {
        console.log('[ShowIntro] ⏭️ Song 2 complete, sequence finished!')
        setCurrentStep('complete')
        stop()
      }

    }, 500) // Check every 500ms (more frequent logging)

    return () => clearInterval(checkProgress)
  }, [isRunning, isPaused, currentStep, elapsedTime, dualDeck, fullConfig])

  // Update elapsed time
  useEffect(() => {
    if (!isRunning || isPaused) return

    const updateTimer = () => {
      const now = Date.now()
      const elapsed = (now - startTimeRef.current) / 1000
      setElapsedTime(elapsed)
      timerRef.current = requestAnimationFrame(updateTimer)
    }

    timerRef.current = requestAnimationFrame(updateTimer)

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
      }
    }
  }, [isRunning, isPaused])

  // Execute step actions
  useEffect(() => {
    if (!isRunning) return

    switch (currentStep) {
      case 'song1_playing':
        executeSong1Step()
        break
      case 'crossfading':
        executeCrossfadeStep()
        break
      case 'song2_playing':
        executeSong2Step()
        break
      case 'game_active':
        executeGameStep()
        break
      case 'resuming':
        executeResumeStep()
        break
    }
  }, [currentStep, isRunning])

  const executeSong1Step = async () => {
    console.log('[ShowIntro] Step 1: Playing Song 1 on Deck A...')
    try {
      const deckAState = dualDeck.deckA.getDeckState()
      
      // Check if track is loaded
      if (!deckAState.currentTrack) {
        const errorMsg = 'No track loaded on Deck A'
        setError(errorMsg)
        console.error('[ShowIntro] ❌', errorMsg)
        return
      }
      
      console.log('[ShowIntro] Deck A track:', deckAState.currentTrack.title)
      
      // CRITICAL: Ensure AudioContext is initialized and resumed
      console.log('[ShowIntro] Deck A AudioContext:', dualDeck.deckA.audioContext)
      
      if (!dualDeck.deckA.audioContext) {
        console.log('[ShowIntro] ⚠️ AudioContext not initialized yet, will initialize on play...')
      } else if (dualDeck.deckA.audioContext.state === 'suspended') {
        console.log('[ShowIntro] ⚠️ Resuming suspended AudioContext...')
        try {
          await dualDeck.deckA.audioContext.resume()
          console.log('[ShowIntro] ✅ AudioContext state:', dualDeck.deckA.audioContext.state)
        } catch (resumeErr) {
          const errorMsg = `Failed to resume AudioContext: ${resumeErr}`
          setError(errorMsg)
          console.error('[ShowIntro] ❌', errorMsg)
          return
        }
      } else {
        console.log('[ShowIntro] ✅ AudioContext state:', dualDeck.deckA.audioContext.state)
      }

      // Ensure Deck A is ready and playing
      if (!deckAState.isPlaying) {
        console.log('[ShowIntro] Starting Deck A playback...')
        try {
          await dualDeck.deckA.play()
          
          // Double-check after play attempt
          const newState = dualDeck.deckA.getDeckState()
          console.log('[ShowIntro] Deck A playing:', newState.isPlaying)
          
          if (!newState.isPlaying) {
            const errorMsg = 'Deck A play() succeeded but isPlaying=false. Check browser autoplay policy.'
            setError(errorMsg)
            console.error('[ShowIntro] ⚠️', errorMsg)
          }
        } catch (playErr: any) {
          const errorType = playErr.name || 'Unknown'
          let errorMsg = `Failed to play Deck A: ${playErr.message || playErr}`
          
          // Provide specific recovery suggestions
          if (errorType === 'NotAllowedError') {
            errorMsg += ' (Browser blocked autoplay - click Debug Audio to verify user interaction)'
          } else if (errorType === 'AbortError') {
            errorMsg += ' (Playback was aborted - check if another play() was called)'
          } else if (errorType === 'NotSupportedError') {
            errorMsg += ' (Audio format not supported or metadata not loaded)'
          }
          
          setError(errorMsg)
          console.error('[ShowIntro] ❌', errorMsg, playErr)
          return
        }
      }
      
      // Set crossfader to full A
      dualDeck.setCrossfaderPosition(0)
      
      console.log('[ShowIntro] ✅ Song 1 playing, crossfader at A')
    } catch (err: any) {
      const errorMsg = `Failed to start Song 1: ${err.message || err}`
      setError(errorMsg)
      console.error('[ShowIntro] ❌ Error:', err)
    }
  }

  const executeCrossfadeStep = async () => {
    console.log('[ShowIntro] Step 2: Crossfading to Song 2...')
    try {
      // Ensure AudioContext is active
      if (dualDeck.deckB.audioContext?.state === 'suspended') {
        console.log('[ShowIntro] ⚠️ Resuming Deck B AudioContext...')
        try {
          await dualDeck.deckB.audioContext.resume()
          console.log('[ShowIntro] ✅ Deck B AudioContext state:', dualDeck.deckB.audioContext.state)
        } catch (resumeErr) {
          const errorMsg = `Failed to resume Deck B AudioContext: ${resumeErr}`
          setError(errorMsg)
          console.error('[ShowIntro] ❌', errorMsg)
          return
        }
      }

      // Start Deck B if not playing
      if (!dualDeck.deckB.getDeckState().isPlaying) {
        console.log('[ShowIntro] Starting Deck B playback...')
        try {
          await dualDeck.deckB.play()
          
          // Verify playback started
          const deckBState = dualDeck.deckB.getDeckState()
          if (!deckBState.isPlaying) {
            const errorMsg = 'Deck B play() succeeded but isPlaying=false'
            setError(errorMsg)
            console.error('[ShowIntro] ⚠️', errorMsg)
          }
        } catch (playErr: any) {
          const errorType = playErr.name || 'Unknown'
          let errorMsg = `Failed to play Deck B: ${playErr.message || playErr}`
          
          if (errorType === 'NotAllowedError') {
            errorMsg += ' (Browser blocked autoplay)'
          } else if (errorType === 'AbortError') {
            errorMsg += ' (Playback was aborted)'
          }
          
          setError(errorMsg)
          console.error('[ShowIntro] ❌', errorMsg, playErr)
          return
        }
      }

      // Animate crossfader from A (0) to B (1) over duration
      const startPosition = dualDeck.mixer.crossfaderPosition
      const startTime = Date.now()
      const duration = fullConfig.crossfadeDuration * 1000 // ms

      const animateCrossfade = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const position = startPosition + (1 - startPosition) * progress

        dualDeck.setCrossfaderPosition(position)
        console.log(`[ShowIntro] Crossfade progress: ${(progress * 100).toFixed(1)}%`)

        if (progress < 1) {
          requestAnimationFrame(animateCrossfade)
        }
      }

      animateCrossfade()
    } catch (err: any) {
      const errorMsg = `Failed to crossfade: ${err.message || err}`
      setError(errorMsg)
      console.error('[ShowIntro] ❌ Crossfade error:', err)
    }
  }

  const executeSong2Step = () => {
    console.log('[ShowIntro] Step 3: Song 2 playing to pause point...')
    // Song 2 already playing from crossfade, just monitor position
  }

  const executeGameStep = async () => {
    console.log('[ShowIntro] Step 4: Pausing Song 2, showing game...')
    try {
      // Pause Deck B at current position
      dualDeck.deckB.pause()
      
      // Show tomato game graphic (via Supabase)
      await toggleGraphic('brb_tomato_game', true)
      
      // Hide DJ visualizer
      await toggleGraphic('ai_dj_visualizer', false)
      
      console.log('[ShowIntro] Game active. Waiting for boss defeat...')
    } catch (err) {
      setError(`Failed to activate game: ${err}`)
      console.error(err)
    }
  }

  const executeResumeStep = async () => {
    console.log('[ShowIntro] Step 5: Resuming Song 2 from pause point...')
    try {
      // Wait for ELIMINATED animation (1 second)
      await new Promise(resolve => setTimeout(resolve, fullConfig.transitionDelay * 1000))
      
      // Fade out game
      try {
        await toggleGraphic('brb_tomato_game', false)
      } catch (graphicErr) {
        console.warn('[ShowIntro] ⚠️ Failed to hide game graphic:', graphicErr)
        // Continue anyway
      }
      
      // Resume Song 2 from where it paused
      try {
        await dualDeck.deckB.play()
        
        // Verify playback resumed
        const deckBState = dualDeck.deckB.getDeckState()
        if (!deckBState.isPlaying) {
          const errorMsg = 'Failed to resume Deck B - isPlaying still false'
          setError(errorMsg)
          console.error('[ShowIntro] ⚠️', errorMsg)
        }
      } catch (playErr: any) {
        const errorMsg = `Failed to resume Deck B: ${playErr.message || playErr}`
        setError(errorMsg)
        console.error('[ShowIntro] ❌', errorMsg, playErr)
        return
      }
      
      // Show main screen graphic
      try {
        await toggleGraphic('ai_dj_visualizer', true)
      } catch (graphicErr) {
        console.warn('[ShowIntro] ⚠️ Failed to show visualizer graphic:', graphicErr)
        // Continue anyway
      }
      
      // Move to finishing step
      setCurrentStep('song2_finishing')
      
      console.log('[ShowIntro] ✅ Song 2 resumed, playing to end...')
    } catch (err: any) {
      const errorMsg = `Failed to resume: ${err.message || err}`
      setError(errorMsg)
      console.error('[ShowIntro] ❌', errorMsg, err)
    }
  }

  const handleBossDefeated = () => {
    if (currentStep === 'game_active') {
      setCurrentStep('resuming')
    }
  }

  // Helper to toggle graphics via Supabase
  const toggleGraphic = async (graphicType: string, visible: boolean) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { error } = await supabase
        .from('broadcast_graphics')
        .update({
          is_visible: visible,
          updated_at: new Date().toISOString()
        })
        .eq('graphic_type', graphicType)
      
      if (error) throw error
      
      console.log(`[ShowIntro] ${visible ? 'Showed' : 'Hid'} graphic: ${graphicType}`)
    } catch (err) {
      console.error(`Failed to toggle graphic ${graphicType}:`, err)
      throw err
    }
  }

  // Control methods
  const start = useCallback(async () => {
    console.log('[ShowIntro] Starting intro sequence...')
    
    // Ensure both tracks are loaded
    const deckATrack = dualDeck.deckA.getDeckState().currentTrack
    const deckBTrack = dualDeck.deckB.getDeckState().currentTrack
    
    if (!deckATrack || !deckBTrack) {
      setError('Please load both songs before starting')
      console.error('[ShowIntro] ❌ Missing tracks - Deck A:', deckATrack?.title, 'Deck B:', deckBTrack?.title)
      return
    }
    
    console.log('[ShowIntro] ✅ Both tracks loaded')
    console.log('[ShowIntro] Deck A:', deckATrack.title)
    console.log('[ShowIntro] Deck B:', deckBTrack.title)
    
    // CRITICAL: Ensure both AudioContexts are running before starting sequence
    console.log('[ShowIntro] Checking AudioContext states...')
    
    const deckAContext = dualDeck.deckA.audioContext
    const deckBContext = dualDeck.deckB.audioContext
    
    // Resume Deck A AudioContext if suspended OR recreate if closed
    if (deckAContext) {
      if (deckAContext.state === 'closed') {
        console.log('[ShowIntro] ⚠️ Deck A AudioContext is CLOSED - will reinitialize on play')
        // Can't resume a closed context - it will be recreated when needed
      } else if (deckAContext.state === 'suspended') {
        console.log('[ShowIntro] ⚠️ Deck A AudioContext suspended, resuming...')
        try {
          await deckAContext.resume()
          console.log('[ShowIntro] ✅ Deck A AudioContext state:', deckAContext.state)
        } catch (err) {
          console.error('[ShowIntro] ❌ Failed to resume Deck A AudioContext:', err)
          setError('Failed to resume Deck A audio')
          return
        }
      } else {
        console.log('[ShowIntro] ✅ Deck A AudioContext state:', deckAContext.state)
      }
    } else {
      console.log('[ShowIntro] ⚠️ Deck A AudioContext not initialized yet (will initialize on play)')
    }
    
    // Resume Deck B AudioContext if suspended OR recreate if closed
    if (deckBContext) {
      if (deckBContext.state === 'closed') {
        console.log('[ShowIntro] ⚠️ Deck B AudioContext is CLOSED - will reinitialize on play')
        // Can't resume a closed context - it will be recreated when needed
      } else if (deckBContext.state === 'suspended') {
        console.log('[ShowIntro] ⚠️ Deck B AudioContext suspended, resuming...')
        try {
          await deckBContext.resume()
          console.log('[ShowIntro] ✅ Deck B AudioContext state:', deckBContext.state)
        } catch (err) {
          console.error('[ShowIntro] ❌ Failed to resume Deck B AudioContext:', err)
          setError('Failed to resume Deck B audio')
          return
        }
      } else {
        console.log('[ShowIntro] ✅ Deck B AudioContext state:', deckBContext.state)
      }
    } else {
      console.log('[ShowIntro] ⚠️ Deck B AudioContext not initialized yet (will initialize on play)')
    }
    
    // Verify both contexts are running (if they exist)
    // Note: 'closed' state is OK - it will be recreated on play
    if (deckAContext && deckAContext.state !== 'running' && deckAContext.state !== 'closed') {
      setError(`Deck A AudioContext failed to resume (state: ${deckAContext.state})`)
      console.error('[ShowIntro] ❌ Deck A AudioContext not running')
      return
    }
    if (deckBContext && deckBContext.state !== 'running' && deckBContext.state !== 'closed') {
      setError(`Deck B AudioContext failed to resume (state: ${deckBContext.state})`)
      console.error('[ShowIntro] ❌ Deck B AudioContext not running')
      return
    }
    
    console.log('[ShowIntro] ✅ All AudioContexts ready')
    
    setCurrentStep('song1_playing')
    setIsRunning(true)
    setIsPaused(false)
    setElapsedTime(0)
    setError(null)
    startTimeRef.current = Date.now()
  }, [dualDeck])

  const pause = useCallback(() => {
    console.log('[ShowIntro] Pausing sequence...')
    setIsPaused(true)
    pauseTimeRef.current = Date.now()
    
    // Pause both decks
    dualDeck.deckA.pause()
    dualDeck.deckB.pause()
  }, [dualDeck])

  const resume = useCallback(() => {
    console.log('[ShowIntro] Resuming sequence...')
    setIsPaused(false)
    
    // Adjust start time to account for pause duration
    const pauseDuration = Date.now() - pauseTimeRef.current
    startTimeRef.current += pauseDuration
    
    // Resume appropriate deck
    if (currentStep === 'song1_playing' || currentStep === 'crossfading') {
      dualDeck.deckA.play()
    }
    if (currentStep === 'crossfading' || currentStep === 'song2_playing' || currentStep === 'song2_finishing') {
      dualDeck.deckB.play()
    }
  }, [currentStep, dualDeck])

  const stop = useCallback(() => {
    console.log('[ShowIntro] Stopping sequence...')
    setIsRunning(false)
    setIsPaused(false)
    setCurrentStep('idle')
    setElapsedTime(0)
    
    // Stop both decks
    dualDeck.deckA.pause()
    dualDeck.deckB.pause()
    
    // Reset crossfader
    dualDeck.setCrossfaderPosition(0.5)
  }, [dualDeck])

  const skipToStep = useCallback((step: IntroStep) => {
    console.log(`[ShowIntro] Skipping to step: ${step}`)
    setCurrentStep(step)
  }, [])

  return {
    // State
    state: {
      currentStep,
      elapsedTime,
      isRunning,
      isPaused,
      error,
    },
    
    // Controls
    start,
    pause,
    resume,
    stop,
    skipToStep,
    
    // Config
    config: fullConfig,
  }
}
