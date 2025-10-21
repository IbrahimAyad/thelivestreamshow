import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AudioEffectsChain } from '@/utils/audioEffects'
import type { MusicTrack, AudioPlaybackState, AudioSettings, AudioEffectsConfig } from '@/types/database'

export function useAudioPlayer() {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isDucking, setIsDucking] = useState(false)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [copyrightEnforced, setCopyrightEnforced] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const copyrightTimeoutRef = useRef<number | null>(null)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const duckingGainNodeRef = useRef<GainNode | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(null)
  const effectsChainRef = useRef<AudioEffectsChain | null>(null)

  // Initialize audio element ONLY (no AudioContext yet)
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'metadata'
    audioRef.current = audio

    console.log('[AudioPlayer] Audio element created (AudioContext NOT created yet)')

    // Event listeners
    const handleTimeUpdate = () => {
      setPlaybackPosition(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false)
      } else {
        audio.currentTime = 0
        audio.play().catch(err => console.error('[AudioPlayer] Play on loop failed:', err))
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      
      audio.pause()
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (effectsChainRef.current) {
        effectsChainRef.current.disconnect()
      }
      if (copyrightTimeoutRef.current) {
        clearTimeout(copyrightTimeoutRef.current)
      }
    }
  }, [])

  // Lazy initialize AudioContext (only when needed)
  const initializeAudioContext = useCallback(async () => {
    if (audioContextRef.current || isInitialized) {
      console.log('[AudioPlayer] AudioContext already initialized')
      return true
    }

    if (!audioRef.current) {
      console.error('[AudioPlayer] Audio element not ready')
      return false
    }

    try {
      console.log('[AudioPlayer] 🔧 Initializing AudioContext...')

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      audioContextRef.current = ctx

      // Resume if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      console.log('[AudioPlayer] AudioContext state:', ctx.state)

      const source = ctx.createMediaElementSource(audioRef.current)
      const gainNode = ctx.createGain()
      const duckingGainNode = ctx.createGain()
      const analyserNode = ctx.createAnalyser()
      
      analyserNode.fftSize = 2048
      analyserNode.smoothingTimeConstant = 0.8
      
      // Create effects chain
      const effectsChain = new AudioEffectsChain(ctx)
      effectsChainRef.current = effectsChain
      
      // Connect: source -> gainNode -> duckingGainNode -> effectsChain -> analyser -> destination
      source.connect(gainNode)
      gainNode.connect(duckingGainNode)
      
      // Connect effects chain (it handles internal routing)
      effectsChain.connect(duckingGainNode, analyserNode)
      
      analyserNode.connect(ctx.destination)
      
      sourceNodeRef.current = source
      gainNodeRef.current = gainNode
      duckingGainNodeRef.current = duckingGainNode
      analyserNodeRef.current = analyserNode
      setAnalyser(analyserNode)

      gainNode.gain.value = 0.7
      duckingGainNode.gain.value = 1.0

      setIsInitialized(true)
      console.log('[AudioPlayer] ✅ AudioContext initialized successfully')

      return true
    } catch (error) {
      console.error('[AudioPlayer] ❌ Failed to initialize AudioContext:', error)
      return false
    }
  }, [isInitialized])

  // Load and play track
  const loadTrack = useCallback(async (track: MusicTrack) => {
    if (!audioRef.current) return
    
    audioRef.current.src = track.file_url
    setCurrentTrack(track)
    setPlaybackPosition(0)
    setCopyrightEnforced(false)
    
    // Clear any existing copyright timeout
    if (copyrightTimeoutRef.current) {
      clearTimeout(copyrightTimeoutRef.current)
      copyrightTimeoutRef.current = null
    }
    
    await audioRef.current.load()
    
    // Check if track has copyright restrictions
    if (track.copyright_info && typeof track.copyright_info === 'object') {
      const copyrightInfo = track.copyright_info as any
      if (copyrightInfo.usage_policy === 'partial' && copyrightInfo.playable_duration) {
        // Set timeout to stop playback after allowed duration
        const allowedSeconds = copyrightInfo.playable_duration
        console.log(`Copyright enforcement: Track will be stopped after ${allowedSeconds} seconds`)
      }
    }
  }, [])

  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return
    
    // Initialize AudioContext if not done yet
    if (!audioContextRef.current) {
      console.log('[AudioPlayer] Initializing AudioContext before playback...')
      const success = await initializeAudioContext()
      if (!success) {
        console.error('[AudioPlayer] Cannot play: AudioContext initialization failed')
        return
      }
    }
    
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    
    // Check copyright enforcement
    if (currentTrack.copyright_info && typeof currentTrack.copyright_info === 'object') {
      const copyrightInfo = currentTrack.copyright_info as any
      if (copyrightInfo.usage_policy === 'partial' && copyrightInfo.playable_duration) {
        const allowedSeconds = copyrightInfo.playable_duration
        const currentTime = audioRef.current.currentTime
        const remainingTime = allowedSeconds - currentTime
        
        if (remainingTime > 0) {
          // Set timeout to stop after remaining allowed time
          copyrightTimeoutRef.current = window.setTimeout(() => {
            pause()
            setCopyrightEnforced(true)
            alert(`Playback stopped: This track has copyright restrictions. Only ${allowedSeconds} seconds of playback allowed.`)
          }, remainingTime * 1000)
        } else {
          // Already exceeded allowed time
          alert(`Cannot play: This track has copyright restrictions. Maximum ${allowedSeconds} seconds playback allowed.`)
          return
        }
      }
    }
    
    await audioRef.current.play()
    setIsPlaying(true)
  }, [currentTrack, initializeAudioContext])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
    
    // Clear copyright timeout when paused
    if (copyrightTimeoutRef.current) {
      clearTimeout(copyrightTimeoutRef.current)
      copyrightTimeoutRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
    setPlaybackPosition(0)
    setCopyrightEnforced(false)
    
    // Clear copyright timeout
    if (copyrightTimeoutRef.current) {
      clearTimeout(copyrightTimeoutRef.current)
      copyrightTimeoutRef.current = null
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setPlaybackPosition(time)
  }, [])

  const changeVolume = useCallback((newVolume: number) => {
    if (!gainNodeRef.current) return
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    gainNodeRef.current.gain.value = clampedVolume
    setVolume(clampedVolume)
  }, [])

  const toggleMute = useCallback(() => {
    if (!gainNodeRef.current) return
    const newMutedState = !isMuted
    gainNodeRef.current.gain.value = newMutedState ? 0 : volume
    setIsMuted(newMutedState)
  }, [isMuted, volume])

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffling(prev => !prev)
  }, [])

  // Ducking functionality
  const duck = useCallback(async (level: number) => {
    if (!duckingGainNodeRef.current) return
    setIsDucking(true)
    
    // Smooth transition to ducked volume
    const currentTime = audioContextRef.current?.currentTime || 0
    duckingGainNodeRef.current.gain.cancelScheduledValues(currentTime)
    duckingGainNodeRef.current.gain.setValueAtTime(
      duckingGainNodeRef.current.gain.value,
      currentTime
    )
    duckingGainNodeRef.current.gain.linearRampToValueAtTime(
      level,
      currentTime + 0.6
    )
  }, [])

  const unduck = useCallback(async () => {
    if (!duckingGainNodeRef.current) return
    
    // Smooth transition back to normal volume
    const currentTime = audioContextRef.current?.currentTime || 0
    duckingGainNodeRef.current.gain.cancelScheduledValues(currentTime)
    duckingGainNodeRef.current.gain.setValueAtTime(
      duckingGainNodeRef.current.gain.value,
      currentTime
    )
    duckingGainNodeRef.current.gain.linearRampToValueAtTime(
      1.0,
      currentTime + 0.6
    )
    
    setTimeout(() => setIsDucking(false), 600)
  }, [])

  // Apply audio effects
  const applyEffects = useCallback((effects: AudioEffectsConfig) => {
    if (!effectsChainRef.current) return
    effectsChainRef.current.applyEffects(effects)
  }, [])

  return {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    playbackPosition,
    duration,
    isLooping,
    isShuffling,
    isDucking,
    analyser,
    audioContext: audioContextRef.current,
    audioElement: audioRef.current,
    copyrightEnforced,
    isInitialized,
    initializeAudioContext,
    loadTrack,
    play,
    pause,
    stop,
    seek,
    changeVolume,
    toggleMute,
    toggleLoop,
    toggleShuffle,
    duck,
    unduck,
    applyEffects,
  }
}
