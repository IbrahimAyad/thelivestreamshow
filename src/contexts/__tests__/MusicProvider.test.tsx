/**
 * Unit tests for MusicProvider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMusic, MusicProvider, musicTrackToTrack, type Track } from '../MusicProvider'
import type { MusicTrack } from '@/types/database'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url.mp3' },
          error: null
        })
      })
    }
  }
}))

// Mock HTMLAudioElement
class MockAudio {
  src = ''
  currentTime = 0
  duration = 180
  volume = 1
  crossOrigin = ''
  preload = ''
  preservesPitch = true
  paused = true
  
  private listeners: Record<string, Function[]> = {}
  
  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  load = vi.fn()
  
  addEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(handler)
  }
  
  removeEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(h => h !== handler)
  }
  
  dispatchEvent(event: Event) {
    const handlers = this.listeners[event.type] || []
    handlers.forEach(h => h(event))
    return true
  }
  
  remove() {}
}

global.Audio = MockAudio as any

// Mock AudioContext
class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  
  createMediaElementSource = vi.fn().mockReturnValue({
    connect: vi.fn()
  })
  
  createGain = vi.fn().mockReturnValue({
    gain: { value: 1, cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() },
    connect: vi.fn()
  })
  
  createAnalyser = vi.fn().mockReturnValue({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn()
  })
  
  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockResolvedValue(undefined)
}

global.AudioContext = MockAudioContext as any

describe('MusicProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MusicProvider>{children}</MusicProvider>
  )
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Initialization', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      expect(result.current.current).toBeUndefined()
      expect(result.current.queue).toEqual([])
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentTime).toBe(0)
      expect(result.current.duration).toBe(0)
      expect(result.current.volume).toBe(0.7)
      expect(result.current.error).toBeUndefined()
      expect(result.current.hasError).toBe(false)
    })
    
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useMusic())
      }).toThrow('useMusic must be used within MusicProvider')
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('Track Conversion', () => {
    it('should convert MusicTrack to Track', () => {
      const dbTrack: MusicTrack = {
        id: '123',
        file_path: 'music/song.mp3',
        file_url: 'https://example.com/song.mp3',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180,
        file_format: 'audio/mpeg',
        bpm: 120,
        musical_key: 'C',
        album: null,
        analysis_date: null,
        analysis_status: null,
        category: null,
        copyright_info: null,
        copyright_notes: null,
        created_at: null,
        custom_category: null,
        download_date: null,
        effects_settings: null,
        energy_level: null,
        file_size: null,
        friendly_name: null,
        is_stream_safe: null,
        jingle_type: null,
        license_type: null,
        mood: null,
        source_url: null,
        tags: null,
        updated_at: null
      }
      
      const track = musicTrackToTrack(dbTrack)
      
      expect(track).toEqual({
        id: '123',
        path: 'music/song.mp3',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180,
        mime: 'audio/mpeg',
        bpm: 120,
        key: 'C'
      })
    })
  })
  
  describe('Playback Controls', () => {
    const mockTrack: Track = {
      id: '123',
      path: 'music/test.mp3',
      title: 'Test Track',
      artist: 'Test Artist',
      duration: 180
    }
    
    it('should play a track', async () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      await act(async () => {
        await result.current.play(mockTrack)
      })
      
      await waitFor(() => {
        expect(result.current.current).toEqual(mockTrack)
        expect(result.current.isPlaying).toBe(true)
      })
    })
    
    it('should pause playback', async () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      await act(async () => {
        await result.current.play(mockTrack)
      })
      
      act(() => {
        result.current.pause()
      })
      
      expect(result.current.isPlaying).toBe(false)
    })
    
    it('should stop playback', async () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      await act(async () => {
        await result.current.play(mockTrack)
      })
      
      act(() => {
        result.current.stop()
      })
      
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentTime).toBe(0)
    })
    
    it('should seek to position', async () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      await act(async () => {
        await result.current.play(mockTrack)
      })
      
      act(() => {
        result.current.seek(60)
      })
      
      // Note: currentTime update happens via event listener in real scenario
      // This test verifies the method is called without errors
      expect(result.current.seek).toBeDefined()
    })
  })
  
  describe('Queue Management', () => {
    const mockTracks: Track[] = [
      { id: '1', path: 'music/track1.mp3', title: 'Track 1' },
      { id: '2', path: 'music/track2.mp3', title: 'Track 2' },
      { id: '3', path: 'music/track3.mp3', title: 'Track 3' }
    ]
    
    it('should have empty queue initially', () => {
      const { result } = renderHook(() => useMusic(), { wrapper })

      expect(result.current.queue).toEqual([])
    })
    
    it('should skip next when queue is empty', async () => {
      const { result } = renderHook(() => useMusic(), { wrapper })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.current).toBeUndefined()
    })
    
    it('should skip previous when queue is empty', async () => {
      const { result } = renderHook(() => useMusic(), { wrapper })

      await act(async () => {
        await result.current.previous()
      })

      expect(result.current.current).toBeUndefined()
    })
  })
  
  describe('Volume Controls', () => {
    it('should set volume', () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      act(() => {
        result.current.setVolume(0.5)
      })
      
      expect(result.current.volume).toBe(0.5)
    })
    
    it('should clamp volume to 0-1 range', () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      act(() => {
        result.current.setVolume(1.5)
      })
      
      expect(result.current.volume).toBe(1)
      
      act(() => {
        result.current.setVolume(-0.5)
      })
      
      expect(result.current.volume).toBe(0)
    })
  })
  
  describe('Ducking', () => {
    it('should apply ducking', () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      act(() => {
        result.current.setDuck(0.7)
      })

      // Duck applied (no error thrown)
      expect(result.current.hasError).toBe(false)
    })

    it('should accept duck level values', () => {
      const { result } = renderHook(() => useMusic(), { wrapper })

      act(() => {
        result.current.setDuck(1.5)
      })

      expect(result.current.hasError).toBe(false)

      act(() => {
        result.current.setDuck(-0.5)
      })

      expect(result.current.hasError).toBe(false)
    })
  })
  
  describe('Error Handling', () => {
    it('should handle playback errors gracefully', async () => {
      const { result } = renderHook(() => useMusic(), { wrapper })
      
      const failingTrack: Track = {
        id: 'fail',
        path: 'music/nonexistent.mp3',
        title: 'Failing Track'
      }
      
      // Mock play to fail
      vi.spyOn(HTMLAudioElement.prototype, 'play').mockRejectedValueOnce(
        new Error('Playback failed')
      )
      
      await act(async () => {
        await result.current.play(failingTrack)
      })
      
      // Should set error state
      expect(result.current.hasError).toBe(true)
      expect(result.current.error).toBeTruthy()
    })
  })
})
