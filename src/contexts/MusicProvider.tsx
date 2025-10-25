'use client'
import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode,
} from 'react'
import { createFakeAnalyser } from '@/utils/fakeAnalyser'
import { supabase } from '@/lib/supabase' // ✅ Use singleton instead of creating new client

/** ─────────────────────────────────────────────────────────────────────────────
 *  ENV
 *  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY  - your project
 *  VITE_MUSIC_BUCKET                           - e.g. 'music-audio'
 *  VITE_MUSIC_PUBLIC                           - 'true' to use public object URLs (no signing)
 *  ───────────────────────────────────────────────────────────────────────────── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const MUSIC_BUCKET = (import.meta.env.VITE_MUSIC_BUCKET as string) || 'music-audio'
const USE_PUBLIC = (import.meta.env.VITE_MUSIC_PUBLIC as string) === 'true'

export type Track = {
  id: string
  /** Exact object key in the bucket. May include folders. */
  path: string
  title?: string
  artist?: string
  mime?: string
  duration?: number
}

/** Helper to convert database MusicTrack to playback Track */
export function musicTrackToTrack(dbTrack: any): Track {
  return {
    id: dbTrack.id,
    path: dbTrack.file_path,
    title: dbTrack.title,
    artist: dbTrack.artist || undefined,
    duration: dbTrack.duration || undefined,
    mime: dbTrack.file_format || undefined
  }
}

type MusicAPI = {
  // transport
  play: (t?: Track) => Promise<void>
  pause: () => void
  resume: () => Promise<void>
  stop: () => void
  seek: (sec: number) => void
  setVolume: (v: number) => void           // 0..1
  setDuck: (pct: number) => void           // 0..1 (1 = full duck)
  // queue navigation
  next: () => Promise<void>
  previous: () => Promise<void>
  // state
  current?: Track
  isPlaying: boolean
  currentTime: number
  duration: number
  ready: boolean
  volume: number                          // current volume 0..1
  queue: Track[]                          // playback queue
  error?: string                          // error message
  hasError: boolean                       // error flag
  analyserNode?: AnalyserNode
  // engine accessors (for Studio Decks, if you must)
  getOrCreateAudioContext: () => AudioContext
  getOrCreateMediaElement: () => HTMLAudioElement
  getOrCreateMediaElementSource: () => MediaElementAudioSourceNode
}

const MusicCtx = createContext<MusicAPI | null>(null)
export const useMusic = () => {
  const ctx = useContext(MusicCtx)
  if (!ctx) throw new Error('useMusic must be used within <MusicProvider>')
  return ctx
}

export function MusicProvider({ children }: { children: ReactNode }) {
  /** Persistent, hidden <audio> that never unmounts */
  const audioRef = useRef<HTMLAudioElement | null>(null)
  /** Shared AudioContext + graph */
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const fakeAnalyserRef = useRef<AnalyserNode | null>(null)

  const [current, setCurrent] = useState<Track | undefined>(undefined)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)
  const [volume, setVolumeState] = useState(0.7)
  const [queue, setQueue] = useState<Track[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const [hasError, setHasError] = useState(false)

  /** Create the hidden audio element once */
  const getOrCreateMediaElement = () => {
    if (!audioRef.current) {
      const el = document.createElement('audio')
      el.preload = 'auto'
      el.style.display = 'none'
      document.body.appendChild(el)
      audioRef.current = el
      // listeners
      el.addEventListener('timeupdate', () => setCurrentTime(el.currentTime))
      el.addEventListener('loadedmetadata', () => setDuration(el.duration || 0))
      el.addEventListener('ended', () => setIsPlaying(false))
      el.addEventListener('pause', () => setIsPlaying(false))
      el.addEventListener('play', () => setIsPlaying(true))
      
      // Create fake analyser for visualization (CORS workaround)
      fakeAnalyserRef.current = createFakeAnalyser(el)
      console.log('[MusicProvider] ✓ Fake analyser created for visualization')
    }
    return audioRef.current
  }

  /** Create or reuse a single AudioContext + graph */
  const getOrCreateAudioContext = () => {
    // TEMPORARY WORKAROUND: Skip Web Audio API due to CORS restrictions
    // See MUSIC_CORS_FIX.md for permanent solution
    // Once Supabase bucket CORS is configured, uncomment the code below
    
    /*
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
      audioCtxRef.current = new Ctx()
      // build master graph
      const ctx = audioCtxRef.current
      const src = getOrCreateMediaElementSource() // ensures element + source
      masterGainRef.current = masterGainRef.current ?? ctx.createGain()
      analyserRef.current = analyserRef.current ?? ctx.createAnalyser()
      analyserRef.current.fftSize = 2048

      // connect graph: <audio> src → masterGain → analyser → destination
      try {
        src.disconnect()
      } catch { }
      src.connect(masterGainRef.current)
      masterGainRef.current.connect(analyserRef.current)
      analyserRef.current.connect(ctx.destination)
      setReady(true)
    }
    */
    
    // Fallback: use dummy context, audio plays directly through element
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
      audioCtxRef.current = new Ctx()
    }
    setReady(true)
    return audioCtxRef.current
  }

  /** Cache a single MediaElementSource for the same <audio> (required by spec) */
  const getOrCreateMediaElementSource = () => {
    const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)()
    audioCtxRef.current = ctx
    const el = getOrCreateMediaElement()
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(el)
    }
    return sourceRef.current
  }

  /** Build a playable URL from bucket/key (public or signed) */
  const getPlayableUrl = async (key: string) => {
    if (!key) throw new Error('Missing storage key')
    if (USE_PUBLIC) {
      // Public object URL (matches what Studio was already using)
      return `${SUPABASE_URL}/storage/v1/object/public/${MUSIC_BUCKET}/${key}`
    }
    const { data, error } = await supabase.storage.from(MUSIC_BUCKET).createSignedUrl(key, 3600)
    if (error || !data?.signedUrl) {
      throw new Error(`Storage key missing or inaccessible: bucket=${MUSIC_BUCKET}, path=${key}\n${error?.message || ''}`)
    }
    return data.signedUrl
  }

  /** Transport */
  const play = async (t?: Track) => {
    try {
      setError(undefined)
      setHasError(false)
      const el = getOrCreateMediaElement()
      getOrCreateAudioContext() // ensure context + graph
      if (t) {
        setCurrent(t)
        const url = await getPlayableUrl(t.path)  // ← exact DB key
        // do not recreate <audio>, just swap src
        el.src = url
      } else if (!current) {
        throw new Error('No track selected')
      }
      // first play must be user-gesture initiated in browsers
      await el.play()
      setIsPlaying(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Playback failed'
      setError(message)
      setHasError(true)
      console.error('[MusicProvider] Play error:', err)
      throw err
    }
  }

  const pause = () => {
    const el = getOrCreateMediaElement()
    el.pause()
    setIsPlaying(false)
  }

  const resume = async () => {
    const el = getOrCreateMediaElement()
    await el.play()
    setIsPlaying(true)
  }

  const stop = () => {
    const el = getOrCreateMediaElement()
    el.pause()
    el.currentTime = 0
    setIsPlaying(false)
  }

  const seek = (sec: number) => {
    const el = getOrCreateMediaElement()
    el.currentTime = Math.max(0, Math.min(sec, el.duration || sec))
  }

  const setVolume = (v: number) => {
    const normalizedVolume = Math.max(0, Math.min(1, v))
    setVolumeState(normalizedVolume)
    
    // CORS WORKAROUND: Use HTMLAudioElement.volume instead of GainNode
    // Once CORS is fixed, switch back to Web Audio API gain control
    const el = getOrCreateMediaElement()
    el.volume = normalizedVolume
    
    // Original Web Audio API code (requires CORS headers):
    // const gain = masterGainRef.current ?? getOrCreateAudioContext().createGain()
    // gain.gain.value = normalizedVolume
  }

  // Simple ducking (smooth envelope)
  const setDuck = (pct: number) => {
    const ctx = getOrCreateAudioContext()
    const gain = masterGainRef.current ?? ctx.createGain()
    const target = Math.max(0, Math.min(1, 1 - pct))
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setTargetAtTime(target, ctx.currentTime, 0.08)   // ~80ms attack
    } catch {
      gain.gain.value = target
    }
  }

  /** Queue navigation */
  const next = async () => {
    if (queue.length === 0) return
    const currentIndex = queue.findIndex(t => t.id === current?.id)
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      await play(queue[currentIndex + 1])
    }
  }

  const previous = async () => {
    if (queue.length === 0) return
    const currentIndex = queue.findIndex(t => t.id === current?.id)
    if (currentIndex > 0) {
      await play(queue[currentIndex - 1])
    }
  }

  /** Prevent accidental teardown on unmount (cleanup only removes listeners & keeps element) */
  useEffect(() => {
    // ensure element exists early
    getOrCreateMediaElement()
    return () => {
      // Do NOT close the AudioContext here; keep global engine alive
      // Do NOT remove audio element; iOS will drop playback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const api: MusicAPI = useMemo(() => ({
    play, pause, resume, stop, seek, setVolume, setDuck, next, previous,
    current, isPlaying, currentTime, duration, ready, volume, queue, error, hasError,
    // Use fake analyser for visualization (works without CORS)
    analyserNode: fakeAnalyserRef.current ?? analyserRef.current ?? undefined,
    getOrCreateAudioContext, getOrCreateMediaElement, getOrCreateMediaElementSource,
  }), [current, isPlaying, currentTime, duration, ready, volume, queue, error, hasError])

  return <MusicCtx.Provider value={api}>{children}</MusicCtx.Provider>
}
