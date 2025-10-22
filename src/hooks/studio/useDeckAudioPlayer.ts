/**
 * useDeckAudioPlayer - Single deck audio player for dual-deck DJ system
 *
 * This is a simplified version of useAudioPlayer designed to work as one half
 * of a dual-deck system. It handles audio playback, tempo, EQ, and effects
 * for a single deck (A or B).
 *
 * Key differences from useAudioPlayer:
 * - No master output (connected to mixer instead)
 * - Individual channel fader instead of master volume
 * - Per-deck 3-band EQ
 * - No ducking (handled by mixer)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { AudioEffectsChain } from '@/utils/studio/audioEffects'
import type { MusicTrack, AudioEffectsConfig } from '@/types/database'

export type DeckId = 'A' | 'B'

export interface DeckAudioPlayerOptions {
  deckId: DeckId
  sharedAudioContext?: AudioContext
  onBeatTick?: (beat: number, bar: number, phrase: number) => void
}

export interface DeckState {
  // Deck identity
  deckId: DeckId

  // Track info
  currentTrack: MusicTrack | null
  isPlaying: boolean
  playbackPosition: number
  duration: number

  // DJ controls
  tempo: number // 0.5 - 2.0 (50% - 200%)
  bpm: number | null
  musicalKey: string | null
  isKeyLockEnabled: boolean
  isCued: boolean
  cuePoint: number

  // Beat tracking
  beatPhase: number // 0-3 (which beat in bar)
  barCount: number // Which bar in phrase
  phraseCount: number // Total phrases

  // Audio nodes
  channelFader: number // 0-1 volume
  eqLow: number // -1 to 1 (EQ gain)
  eqMid: number
  eqHigh: number
  trimGain: number // 0-1.5 (pre-fader gain)

  // Analysis
  analyser: AnalyserNode | null
}

export function useDeckAudioPlayer(options: DeckAudioPlayerOptions) {
  const { deckId, sharedAudioContext, onBeatTick } = options

  // State
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [tempo, setTempo] = useState(1.0)
  const [isKeyLockEnabled, setIsKeyLockEnabled] = useState(true)
  const [isCued, setIsCued] = useState(false)
  const [cuePoint, setCuePoint] = useState(0)
  const [channelFader, setChannelFader] = useState(0.8)
  const [trimGain, setTrimGain] = useState(0.7)
  const [eqLow, setEqLow] = useState(0)
  const [eqMid, setEqMid] = useState(0)
  const [eqHigh, setEqHigh] = useState(0)
  const [beatPhase, setBeatPhase] = useState(0)
  const [barCount, setBarCount] = useState(0)
  const [phraseCount, setPhraseCount] = useState(0)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const trimGainNodeRef = useRef<GainNode | null>(null)
  const eqLowNodeRef = useRef<BiquadFilterNode | null>(null)
  const eqMidNodeRef = useRef<BiquadFilterNode | null>(null)
  const eqHighNodeRef = useRef<BiquadFilterNode | null>(null)
  const effectsChainRef = useRef<AudioEffectsChain | null>(null)
  const channelFaderNodeRef = useRef<GainNode | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(null)
  const outputNodeRef = useRef<GainNode | null>(null) // Connect to mixer
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'metadata'
    audio.preservesPitch = true
    audio.playbackRate = 1.0
    audioRef.current = audio

    console.log(`[Deck ${deckId}] Audio element created`)

    // Event listeners
    const handleTimeUpdate = () => {
      setPlaybackPosition(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()

      if (audioContextRef.current && !sharedAudioContext) {
        audioContextRef.current.close()
      }
      if (effectsChainRef.current) {
        effectsChainRef.current.disconnect()
      }
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current)
      }
    }
  }, [deckId])

  // Initialize AudioContext and audio graph
  const initializeAudioContext = useCallback(async () => {
    if (audioContextRef.current || !audioRef.current) return

    try {
      console.log(`[Deck ${deckId}] Initializing AudioContext...`)

      // Use shared context or create new one
      const ctx = sharedAudioContext || new AudioContext()
      audioContextRef.current = ctx

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Create audio nodes
      const source = ctx.createMediaElementSource(audioRef.current)
      const trimGainNode = ctx.createGain()

      // 3-band EQ (Low: 100Hz, Mid: 1kHz, High: 10kHz)
      const eqLowNode = ctx.createBiquadFilter()
      eqLowNode.type = 'lowshelf'
      eqLowNode.frequency.value = 100
      eqLowNode.gain.value = 0

      const eqMidNode = ctx.createBiquadFilter()
      eqMidNode.type = 'peaking'
      eqMidNode.frequency.value = 1000
      eqMidNode.Q.value = 1
      eqMidNode.gain.value = 0

      const eqHighNode = ctx.createBiquadFilter()
      eqHighNode.type = 'highshelf'
      eqHighNode.frequency.value = 10000
      eqHighNode.gain.value = 0

      const effectsChain = new AudioEffectsChain(ctx)
      const channelFaderNode = ctx.createGain()
      const analyserNode = ctx.createAnalyser()
      const outputNode = ctx.createGain() // Final output to mixer

      analyserNode.fftSize = 2048
      analyserNode.smoothingTimeConstant = 0.8

      // Set initial gains
      trimGainNode.gain.value = trimGain
      channelFaderNode.gain.value = channelFader
      outputNode.gain.value = 1.0

      // Connect audio graph:
      // source → trim → EQ(low) → EQ(mid) → EQ(high) → effects → fader → analyser → output
      source.connect(trimGainNode)
      trimGainNode.connect(eqLowNode)
      eqLowNode.connect(eqMidNode)
      eqMidNode.connect(eqHighNode)

      effectsChain.connect(eqHighNode, channelFaderNode)

      channelFaderNode.connect(analyserNode)
      analyserNode.connect(outputNode)
      // Note: outputNode is NOT connected to destination - it connects to mixer

      // Save refs
      sourceNodeRef.current = source
      trimGainNodeRef.current = trimGainNode
      eqLowNodeRef.current = eqLowNode
      eqMidNodeRef.current = eqMidNode
      eqHighNodeRef.current = eqHighNode
      effectsChainRef.current = effectsChain
      channelFaderNodeRef.current = channelFaderNode
      analyserNodeRef.current = analyserNode
      outputNodeRef.current = outputNode

      setAnalyser(analyserNode)

      console.log(`[Deck ${deckId}] AudioContext initialized`)

    } catch (error) {
      console.error(`[Deck ${deckId}] Failed to initialize AudioContext:`, error)
    }
  }, [deckId, sharedAudioContext, trimGain, channelFader])

  // Load track
  const loadTrack = useCallback(async (track: MusicTrack) => {
    if (!audioRef.current) return

    try {
      console.log(`[Deck ${deckId}] Loading track:`, track.title)

      // Stop current playback
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)

      // Set new source
      audioRef.current.src = track.url
      await audioRef.current.load()

      // Initialize AudioContext on first track load
      if (!audioContextRef.current) {
        await initializeAudioContext()
      }

      setCurrentTrack(track)
      setPlaybackPosition(0)
      setCuePoint(0)
      setIsCued(true)

      // Extract BPM and key from metadata
      if (track.bpm) {
        // Start beat counter if BPM is available
        startBeatCounter(track.bpm)
      }

      console.log(`[Deck ${deckId}] Track loaded successfully`)

    } catch (error) {
      console.error(`[Deck ${deckId}] Failed to load track:`, error)
    }
  }, [deckId, initializeAudioContext])

  // Play
  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return

    try {
      // Initialize AudioContext if needed
      if (!audioContextRef.current) {
        await initializeAudioContext()
      }

      // Resume AudioContext if suspended
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      await audioRef.current.play()
      setIsPlaying(true)
      setIsCued(false)

      console.log(`[Deck ${deckId}] Playing`)

    } catch (error) {
      console.error(`[Deck ${deckId}] Play failed:`, error)
    }
  }, [deckId, currentTrack, initializeAudioContext])

  // Pause
  const pause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
    console.log(`[Deck ${deckId}] Paused`)
  }, [deckId])

  // Cue (return to cue point and pause)
  const cue = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = cuePoint
    setIsPlaying(false)
    setIsCued(true)
    console.log(`[Deck ${deckId}] Cued at ${cuePoint}s`)
  }, [deckId, cuePoint])

  // Set cue point (current position)
  const setCue = useCallback(() => {
    if (!audioRef.current) return
    const newCuePoint = audioRef.current.currentTime
    setCuePoint(newCuePoint)
    setIsCued(true)
    console.log(`[Deck ${deckId}] Cue point set to ${newCuePoint}s`)
  }, [deckId])

  // Seek
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, Math.min(time, duration))
  }, [duration])

  // Set tempo (playback rate)
  const setTempoRate = useCallback((rate: number) => {
    if (!audioRef.current) return
    const clampedRate = Math.max(0.5, Math.min(2.0, rate))
    audioRef.current.playbackRate = clampedRate
    setTempo(clampedRate)
    console.log(`[Deck ${deckId}] Tempo set to ${(clampedRate * 100).toFixed(1)}%`)
  }, [deckId])

  // Toggle key lock
  const toggleKeyLock = useCallback(() => {
    if (!audioRef.current) return
    const newKeyLock = !isKeyLockEnabled
    audioRef.current.preservesPitch = newKeyLock
    setIsKeyLockEnabled(newKeyLock)
    console.log(`[Deck ${deckId}] Key Lock ${newKeyLock ? 'ON' : 'OFF'}`)
  }, [deckId, isKeyLockEnabled])

  // Set channel fader
  const setChannelFaderLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(0, Math.min(1, level))
    setChannelFader(clampedLevel)
    if (channelFaderNodeRef.current) {
      channelFaderNodeRef.current.gain.value = clampedLevel
    }
  }, [])

  // Set trim gain
  const setTrimGainLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(0, Math.min(1.5, level))
    setTrimGain(clampedLevel)
    if (trimGainNodeRef.current) {
      trimGainNodeRef.current.gain.value = clampedLevel
    }
  }, [])

  // Set EQ
  const setEQ = useCallback((band: 'low' | 'mid' | 'high', value: number) => {
    const clampedValue = Math.max(-30, Math.min(30, value))

    if (band === 'low') {
      setEqLow(clampedValue)
      if (eqLowNodeRef.current) {
        eqLowNodeRef.current.gain.value = clampedValue
      }
    } else if (band === 'mid') {
      setEqMid(clampedValue)
      if (eqMidNodeRef.current) {
        eqMidNodeRef.current.gain.value = clampedValue
      }
    } else {
      setEqHigh(clampedValue)
      if (eqHighNodeRef.current) {
        eqHighNodeRef.current.gain.value = clampedValue
      }
    }
  }, [])

  // Kill EQ band (set to -inf)
  const killEQ = useCallback((band: 'low' | 'mid' | 'high') => {
    setEQ(band, -30)
  }, [setEQ])

  // Reset EQ
  const resetEQ = useCallback(() => {
    setEQ('low', 0)
    setEQ('mid', 0)
    setEQ('high', 0)
  }, [setEQ])

  // Beat counter (simple version - will be enhanced with beat grid)
  const startBeatCounter = useCallback((bpm: number) => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current)
    }

    const beatDuration = (60 / bpm) * 1000 // ms per beat

    beatIntervalRef.current = setInterval(() => {
      if (!isPlaying) return

      setBeatPhase(prev => {
        const newPhase = (prev + 1) % 4

        // First beat of bar
        if (newPhase === 0) {
          setBarCount(prev => {
            const newBar = (prev + 1) % 8

            // First bar of phrase (32 beats = 8 bars)
            if (newBar === 0) {
              setPhraseCount(prev => prev + 1)
            }

            if (onBeatTick) {
              onBeatTick(newPhase, newBar, phraseCount)
            }

            return newBar
          })
        }

        return newPhase
      })
    }, beatDuration)
  }, [isPlaying, onBeatTick, phraseCount])

  // Get output node for mixer connection
  const getOutputNode = useCallback(() => {
    return outputNodeRef.current
  }, [])

  // Apply effects
  const applyEffects = useCallback((config: AudioEffectsConfig) => {
    if (effectsChainRef.current) {
      effectsChainRef.current.applyEffects(config)
    }
  }, [])

  // Get deck state for sync/display
  const getDeckState = useCallback((): DeckState => {
    return {
      deckId,
      currentTrack,
      isPlaying,
      playbackPosition,
      duration,
      tempo,
      bpm: currentTrack?.bpm || null,
      musicalKey: currentTrack?.musical_key || null,
      isKeyLockEnabled,
      isCued,
      cuePoint,
      beatPhase,
      barCount,
      phraseCount,
      channelFader,
      eqLow,
      eqMid,
      eqHigh,
      trimGain,
      analyser,
    }
  }, [
    deckId, currentTrack, isPlaying, playbackPosition, duration, tempo,
    isKeyLockEnabled, isCued, cuePoint, beatPhase, barCount, phraseCount,
    channelFader, eqLow, eqMid, eqHigh, trimGain, analyser
  ])

  return {
    // State
    deckId,
    currentTrack,
    isPlaying,
    playbackPosition,
    duration,
    tempo,
    bpm: currentTrack?.bpm || null,
    musicalKey: currentTrack?.musical_key || null,
    isKeyLockEnabled,
    isCued,
    cuePoint,
    beatPhase,
    barCount,
    phraseCount,
    channelFader,
    eqLow,
    eqMid,
    eqHigh,
    trimGain,
    analyser,
    audioContext: audioContextRef.current,

    // Actions
    loadTrack,
    play,
    pause,
    cue,
    setCue,
    seek,
    setTempoRate,
    toggleKeyLock,
    setChannelFaderLevel,
    setTrimGainLevel,
    setEQ,
    killEQ,
    resetEQ,
    applyEffects,
    getOutputNode,
    getDeckState,
  }
}
