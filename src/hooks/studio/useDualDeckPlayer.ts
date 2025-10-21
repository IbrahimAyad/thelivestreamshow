/**
 * Dual-Deck Audio Player for Professional DJ Transitions
 * Manages two independent audio decks (A and B) with crossfading capabilities
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { ThreeBandEQ } from '@/utils/eqSystem'
import { ProfessionalFXChain } from '@/utils/fxChain'
import type { MusicTrack } from '@/types/database'

export interface DeckState {
  track: MusicTrack | null
  isPlaying: boolean
  position: number
  duration: number
  volume: number
}

export interface CrossfaderState {
  position: number // 0 = Deck A only, 0.5 = center, 1 = Deck B only
  curve: 'linear' | 'constant-power'
}

export function useDualDeckPlayer() {
  // Deck states
  const [deckA, setDeckA] = useState<DeckState>({
    track: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 1,
  })
  
  const [deckB, setDeckB] = useState<DeckState>({
    track: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 1,
  })
  
  const [crossfader, setCrossfader] = useState<CrossfaderState>({
    position: 0, // Start with Deck A
    curve: 'constant-power',
  })
  
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Audio references
  const audioARef = useRef<HTMLAudioElement | null>(null)
  const audioBRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const playPromiseARef = useRef<Promise<void> | null>(null)
  const playPromiseBRef = useRef<Promise<void> | null>(null)
  
  // Audio nodes
  const sourceARef = useRef<MediaElementAudioSourceNode | null>(null)
  const sourceBRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainARef = useRef<GainNode | null>(null)
  const gainBRef = useRef<GainNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  
  // EQ and FX
  const eqARef = useRef<ThreeBandEQ | null>(null)
  const eqBRef = useRef<ThreeBandEQ | null>(null)
  const fxARef = useRef<ProfessionalFXChain | null>(null)
  const fxBRef = useRef<ProfessionalFXChain | null>(null)
  
  // Initialize audio elements only (no AudioContext yet)
  useEffect(() => {
    // Create audio elements
    const audioA = new Audio()
    const audioB = new Audio()
    audioA.crossOrigin = 'anonymous'
    audioB.crossOrigin = 'anonymous'
    audioA.preload = 'metadata'
    audioB.preload = 'metadata'
    audioARef.current = audioA
    audioBRef.current = audioB
    
    console.log('[DualDeck] Audio elements created (AudioContext NOT created yet)')
    
    // Event listeners for Deck A
    const handleATimeUpdate = () => {
      setDeckA(prev => ({ ...prev, position: audioA.currentTime }))
    }
    const handleALoadedMetadata = () => {
      setDeckA(prev => ({ ...prev, duration: audioA.duration }))
    }
    const handleAEnded = () => {
      setDeckA(prev => ({ ...prev, isPlaying: false }))
    }
    const handleAError = (e: Event) => {
      console.error('[DualDeck A] Audio load error:', e)
    }
    
    audioA.addEventListener('timeupdate', handleATimeUpdate)
    audioA.addEventListener('loadedmetadata', handleALoadedMetadata)
    audioA.addEventListener('ended', handleAEnded)
    audioA.addEventListener('error', handleAError)
    
    // Event listeners for Deck B
    const handleBTimeUpdate = () => {
      setDeckB(prev => ({ ...prev, position: audioB.currentTime }))
    }
    const handleBLoadedMetadata = () => {
      setDeckB(prev => ({ ...prev, duration: audioB.duration }))
    }
    const handleBEnded = () => {
      setDeckB(prev => ({ ...prev, isPlaying: false }))
    }
    const handleBError = (e: Event) => {
      console.error('[DualDeck B] Audio load error:', e)
    }
    
    audioB.addEventListener('timeupdate', handleBTimeUpdate)
    audioB.addEventListener('loadedmetadata', handleBLoadedMetadata)
    audioB.addEventListener('ended', handleBEnded)
    audioB.addEventListener('error', handleBError)
    
    return () => {
      audioA.removeEventListener('timeupdate', handleATimeUpdate)
      audioA.removeEventListener('loadedmetadata', handleALoadedMetadata)
      audioA.removeEventListener('ended', handleAEnded)
      audioA.removeEventListener('error', handleAError)
      
      audioB.removeEventListener('timeupdate', handleBTimeUpdate)
      audioB.removeEventListener('loadedmetadata', handleBLoadedMetadata)
      audioB.removeEventListener('ended', handleBEnded)
      audioB.removeEventListener('error', handleBError)
      
      audioA.pause()
      audioB.pause()
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (eqARef.current) eqARef.current.dispose()
      if (eqBRef.current) eqBRef.current.dispose()
      if (fxARef.current) fxARef.current.disconnect()
      if (fxBRef.current) fxBRef.current.disconnect()
    }
  }, [])
  
  // Initialize AudioContext LAZILY (only when called)
  const initializeAudioContext = useCallback(async () => {
    if (audioContextRef.current || isInitialized) {
      console.log('[DualDeck] AudioContext already initialized')
      return true
    }
    
    try {
      console.log('[DualDeck] 🔧 Initializing AudioContext...')
      
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      audioContextRef.current = ctx
      
      // Resume if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      
      console.log('[DualDeck] AudioContext state:', ctx.state)
      
      if (!audioARef.current || !audioBRef.current) {
        throw new Error('Audio elements not initialized')
      }
      
      // Create source nodes
      const sourceA = ctx.createMediaElementSource(audioARef.current)
      const sourceB = ctx.createMediaElementSource(audioBRef.current)
      sourceARef.current = sourceA
      sourceBRef.current = sourceB
      
      // Create EQ systems
      const eqA = new ThreeBandEQ(ctx)
      const eqB = new ThreeBandEQ(ctx)
      eqARef.current = eqA
      eqBRef.current = eqB
      
      // Create FX chains
      const fxA = new ProfessionalFXChain(ctx)
      const fxB = new ProfessionalFXChain(ctx)
      fxARef.current = fxA
      fxBRef.current = fxB
      
      // Create gain nodes for crossfading
      const gainA = ctx.createGain()
      const gainB = ctx.createGain()
      const masterGain = ctx.createGain()
      gainARef.current = gainA
      gainBRef.current = gainB
      masterGainRef.current = masterGain
      
      // Create analyser
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser
      setAnalyser(analyser)
      
      // Connect audio graph:
      // Deck A: source -> EQ -> FX -> gainA -> masterGain -> analyser -> destination
      // Deck B: source -> EQ -> FX -> gainB -> masterGain -> analyser -> destination
      
      sourceA.connect(eqA.getOutput())
      const eqAOutput = ctx.createGain() // Temporary node for FX connection
      eqA.getOutput().connect(eqAOutput)
      fxA.connect(eqAOutput, gainA)
      
      sourceB.connect(eqB.getOutput())
      const eqBOutput = ctx.createGain()
      eqB.getOutput().connect(eqBOutput)
      fxB.connect(eqBOutput, gainB)
      
      gainA.connect(masterGain)
      gainB.connect(masterGain)
      masterGain.connect(analyser)
      analyser.connect(ctx.destination)
      
      // Set initial volumes (Deck A active, Deck B silent)
      gainA.gain.value = 1.0
      gainB.gain.value = 0.0
      masterGain.gain.value = 0.7
      
      setIsInitialized(true)
      console.log('[DualDeck] ✅ AudioContext initialized successfully')
      
      return true
    } catch (error) {
      console.error('[DualDeck] ❌ Failed to initialize AudioContext:', error)
      return false
    }
  }, [isInitialized])
  
  // Load track to specific deck with retry logic
  const loadTrackToDeck = useCallback(async (deck: 'A' | 'B', track: MusicTrack, maxRetries = 3) => {
    const audio = deck === 'A' ? audioARef.current : audioBRef.current
    if (!audio) {
      console.error(`[DualDeck ${deck}] Audio element not ready`)
      return
    }
    
    console.log(`[DualDeck ${deck}] Loading track:`, track.title)
    
    // Retry logic for loading
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Cancel any current playback
        audio.pause()
        audio.src = ''
        
        // Set new source
        audio.src = track.file_url
        console.log(`[DualDeck ${deck}] Attempt ${attempt}/${maxRetries} - Loading from:`, track.file_url)
        
        // Wait for metadata to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Load timeout')), 10000)
          
          const onLoaded = () => {
            clearTimeout(timeout)
            audio.removeEventListener('loadedmetadata', onLoaded)
            audio.removeEventListener('error', onError)
            resolve()
          }
          
          const onError = (e: Event) => {
            clearTimeout(timeout)
            audio.removeEventListener('loadedmetadata', onLoaded)
            audio.removeEventListener('error', onError)
            reject(e)
          }
          
          audio.addEventListener('loadedmetadata', onLoaded)
          audio.addEventListener('error', onError)
          
          audio.load()
        })
        
        const setState = deck === 'A' ? setDeckA : setDeckB
        setState(prev => ({ ...prev, track, position: 0 }))
        
        console.log(`[DualDeck ${deck}] ✅ Track loaded successfully (duration: ${audio.duration}s)`)
        return
      } catch (error) {
        console.error(`[DualDeck ${deck}] ❌ Load attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = 1000 * attempt
          console.log(`[DualDeck ${deck}] Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          console.error(`[DualDeck ${deck}] ❌ Failed to load track after ${maxRetries} attempts`)
          throw error
        }
      }
    }
  }, [])
  
  // Play specific deck with interruption handling
  const playDeck = useCallback(async (deck: 'A' | 'B') => {
    const audio = deck === 'A' ? audioARef.current : audioBRef.current
    const playPromiseRef = deck === 'A' ? playPromiseARef : playPromiseBRef
    
    if (!audio) {
      console.error(`[DualDeck ${deck}] Audio element not ready`)
      return
    }
    
    // Initialize AudioContext if not done yet
    if (!audioContextRef.current) {
      console.log(`[DualDeck ${deck}] Initializing AudioContext before playback...`)
      const success = await initializeAudioContext()
      if (!success) {
        console.error(`[DualDeck ${deck}] Cannot play: AudioContext initialization failed`)
        return
      }
    }
    
    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === 'suspended') {
      console.log(`[DualDeck ${deck}] Resuming suspended AudioContext...`)
      await audioContextRef.current.resume()
    }
    
    // Cancel any pending play promise
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current
      } catch (e) {
        // Ignore abort errors from previous play
        if (e instanceof DOMException && e.name === 'AbortError') {
          console.log(`[DualDeck ${deck}] Previous play() aborted (expected)`)
        }
      }
    }
    
    try {
      console.log(`[DualDeck ${deck}] Starting playback...`)
      playPromiseRef.current = audio.play()
      await playPromiseRef.current
      playPromiseRef.current = null
      
      const setState = deck === 'A' ? setDeckA : setDeckB
      setState(prev => ({ ...prev, isPlaying: true }))
      
      console.log(`[DualDeck ${deck}] ✅ Playback started`)
    } catch (error) {
      playPromiseRef.current = null
      
      if (error instanceof DOMException && error.name === 'NotSupportedError') {
        console.error(`[DualDeck ${deck}] ❌ Audio format not supported or file not found`)
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`[DualDeck ${deck}] Play() aborted by new request`)
      } else {
        console.error(`[DualDeck ${deck}] ❌ Play error:`, error)
      }
      throw error
    }
  }, [initializeAudioContext])
  
  // Pause specific deck
  const pauseDeck = useCallback((deck: 'A' | 'B') => {
    const audio = deck === 'A' ? audioARef.current : audioBRef.current
    if (!audio) return
    
    audio.pause()
    const setState = deck === 'A' ? setDeckA : setDeckB
    setState(prev => ({ ...prev, isPlaying: false }))
  }, [])
  
  // Seek in specific deck
  const seekDeck = useCallback((deck: 'A' | 'B', time: number) => {
    const audio = deck === 'A' ? audioARef.current : audioBRef.current
    if (!audio) return
    
    audio.currentTime = time
    const setState = deck === 'A' ? setDeckA : setDeckB
    setState(prev => ({ ...prev, position: time }))
  }, [])
  
  // Set crossfader position (0 = A only, 1 = B only)
  const setCrossfaderPosition = useCallback((position: number) => {
    const clampedPosition = Math.max(0, Math.min(1, position))
    
    // Apply crossfade curve
    let gainAValue: number
    let gainBValue: number
    
    if (crossfader.curve === 'constant-power') {
      // Constant power crossfade (smoother, maintains perceived volume)
      const angle = clampedPosition * Math.PI / 2
      gainAValue = Math.cos(angle)
      gainBValue = Math.sin(angle)
    } else {
      // Linear crossfade
      gainAValue = 1 - clampedPosition
      gainBValue = clampedPosition
    }
    
    if (gainARef.current) gainARef.current.gain.value = gainAValue
    if (gainBRef.current) gainBRef.current.gain.value = gainBValue
    
    setCrossfader(prev => ({ ...prev, position: clampedPosition }))
    
    // Update active deck based on crossfader position
    setActiveDeck(clampedPosition < 0.5 ? 'A' : 'B')
  }, [crossfader.curve])
  
  // Automatic crossfade from one deck to another
  const crossfade = useCallback((fromDeck: 'A' | 'B', duration: number = 8) => {
    const startPosition = fromDeck === 'A' ? 0 : 1
    const endPosition = fromDeck === 'A' ? 1 : 0
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      
      const position = startPosition + (endPosition - startPosition) * progress
      setCrossfaderPosition(position)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [setCrossfaderPosition])
  
  // Get EQ for specific deck
  const getDeckEQ = useCallback((deck: 'A' | 'B'): ThreeBandEQ | null => {
    return deck === 'A' ? eqARef.current : eqBRef.current
  }, [])
  
  // Get FX chain for specific deck
  const getDeckFX = useCallback((deck: 'A' | 'B'): ProfessionalFXChain | null => {
    return deck === 'A' ? fxARef.current : fxBRef.current
  }, [])
  
  // Get current active track
  const getCurrentTrack = useCallback(() => {
    return activeDeck === 'A' ? deckA.track : deckB.track
  }, [activeDeck, deckA.track, deckB.track])
  
  // Get current playback position
  const getCurrentPosition = useCallback(() => {
    return activeDeck === 'A' ? deckA.position : deckB.position
  }, [activeDeck, deckA.position, deckB.position])
  
  // Get current duration
  const getCurrentDuration = useCallback(() => {
    return activeDeck === 'A' ? deckA.duration : deckB.duration
  }, [activeDeck, deckA.duration, deckB.duration])
  
  return {
    // Deck states
    deckA,
    deckB,
    activeDeck,
    crossfader,
    analyser,
    audioContext: audioContextRef.current,
    isInitialized,
    
    // Initialization
    initializeAudioContext,
    
    // Deck controls
    loadTrackToDeck,
    playDeck,
    pauseDeck,
    seekDeck,
    
    // Crossfader controls
    setCrossfaderPosition,
    crossfade,
    
    // EQ and FX access
    getDeckEQ,
    getDeckFX,
    
    // Convenience getters for active deck
    getCurrentTrack,
    getCurrentPosition,
    getCurrentDuration,
    isPlaying: activeDeck === 'A' ? deckA.isPlaying : deckB.isPlaying,
  }
}
