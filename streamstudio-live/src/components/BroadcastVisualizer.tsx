/**
 * Professional Beat-Reactive Broadcast Visualizer
 * Full-screen audio-reactive visualization for OBS streaming
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  drawSpectrumBars,
  drawCircularWaveform,
  drawVinylDisc,
  getFrequencyBands,
  getEnergyColor,
  getEnergyGradient,
  ParticleSystem,
  type FrequencyData,
} from '@/utils/audioVisualizer'
import { extractFrequencyBands } from '@/utils/mockFrequencyData'
import { loadPreset, type VisualizationPreset, VISUALIZATION_PRESETS } from '@/utils/visualizationPresets'
import type { MusicTrack } from '@/types/database'

interface BroadcastVisualizerProps {
  analyser: AnalyserNode | null
  mockFrequencyData?: Uint8Array  // Mock data when analyser is null
  currentTrack: MusicTrack | null
  isPlaying: boolean
  playbackPosition: number
  duration: number
  activeDeck: 'A' | 'B'
  bpm: number | null
  energy: number
  autodjActive: boolean
}

export function BroadcastVisualizer({
  analyser,
  mockFrequencyData,
  currentTrack,
  isPlaying,
  playbackPosition,
  duration,
  activeDeck,
  bpm,
  energy,
  autodjActive,
}: BroadcastVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const vinylRotationRef = useRef(0)
  const lastBeatTimeRef = useRef(0)
  const beatPulseRef = useRef(0)
  const lastUpdateTimeRef = useRef(Date.now())
  const frameCountRef = useRef(0)
  const [localPlaybackPosition, setLocalPlaybackPosition] = useState(playbackPosition)
  
  const [preset, setPreset] = useState<VisualizationPreset>(loadPreset())
  const [frequencyBands, setFrequencyBands] = useState<FrequencyData>({
    low: 0,
    mid: 0,
    high: 0,
    average: 0,
  })
  
  const config = VISUALIZATION_PRESETS[preset]
  const color = getEnergyColor(energy)
  
  // Update local playback position in real-time (smooth updates)
  useEffect(() => {
    setLocalPlaybackPosition(playbackPosition)
  }, [playbackPosition])
  
  // Increment position in real-time when playing
  useEffect(() => {
    if (!isPlaying) {
      lastUpdateTimeRef.current = Date.now()
      return
    }
    
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - lastUpdateTimeRef.current) / 1000
      lastUpdateTimeRef.current = now
      
      setLocalPlaybackPosition(prev => Math.min(prev + elapsed, duration))
    }, 100) // Update every 100ms for smooth progress
    
    return () => clearInterval(interval)
  }, [isPlaying, duration])
  
  // Initialize canvas and particle system
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    particleSystemRef.current = new ParticleSystem(canvas)
    
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Listen for preset changes from localStorage
  useEffect(() => {
    const checkPreset = () => {
      const currentPreset = loadPreset()
      if (currentPreset !== preset) {
        setPreset(currentPreset)
      }
    }
    
    const interval = setInterval(checkPreset, 1000)
    return () => clearInterval(interval)
  }, [preset])
  
  // Beat detection and particle emission
  useEffect(() => {
    if (!analyser || !isPlaying || !bpm || !config.showParticles) return
    
    const beatInterval = (60 / bpm) * 1000 // ms
    const now = Date.now()
    
    if (now - lastBeatTimeRef.current >= beatInterval * 0.95) {
      // Beat detected!
      lastBeatTimeRef.current = now
      beatPulseRef.current = 1.0
      
      // Emit particles
      if (particleSystemRef.current && canvasRef.current) {
        const canvas = canvasRef.current
        const x = canvas.width / 2
        const y = canvas.height / 2
        particleSystemRef.current.emit(x, y, config.particleIntensity, color)
      }
    }
    
    // Decay beat pulse
    if (beatPulseRef.current > 0) {
      beatPulseRef.current -= 0.05
    }
  }, [analyser, isPlaying, bpm, config.showParticles, config.particleIntensity, color])
  
  // Main animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current) return
    
    frameCountRef.current++
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Update frequency data (from analyser OR mock data)
    if (analyser) {
      // Real audio analysis
      const bands = getFrequencyBands(analyser)
      setFrequencyBands(bands)
    } else if (mockFrequencyData) {
      // Mock frequency data for visualization (actually REAL data reconstructed from control panel!)
      const bands = extractFrequencyBands(mockFrequencyData)
      setFrequencyBands({
        low: bands.low,
        mid: bands.mid,
        high: bands.high,
        average: (bands.low + bands.mid + bands.high) / 3,
      })
      
      // Debug log once per second (at 60fps, every 60 frames = 1 second)
      if (frameCountRef.current % 60 === 0) {
        const sum = mockFrequencyData.reduce((a, b) => a + b, 0)
        console.log(`[Visualizer] 🎨 Frame ${frameCountRef.current}: Using REAL data - Bass=${bands.low.toFixed(2)}, Mid=${bands.mid.toFixed(2)}, High=${bands.high.toFixed(2)}, Sum=${sum}`)
      }
    }
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      // Draw vinyl disc (always visible)
      if (config.showVinyl) {
        if (isPlaying) {
          vinylRotationRef.current += 0.02 // Slow rotation when playing
        }
        drawVinylDisc(canvas, centerX, centerY, 150, vinylRotationRef.current, isPlaying)
      }
      
      // Draw circular waveform
      if (config.showCircular && analyser) {
        // Only show with real audio analysis
        drawCircularWaveform(canvas, analyser, centerX, centerY, 180, color)
      }
      
      // Draw spectrum bars
      if (config.showSpectrum) {
        if (preset === 'retro') {
          // Retro grid style
          drawRetroGrid(ctx, canvas.width, canvas.height, frequencyBands.average)
        }
        
        if (analyser) {
          // Real spectrum bars from analyser
          const spectrumY = canvas.height - 200
          const spectrumCanvas = document.createElement('canvas')
          spectrumCanvas.width = canvas.width * 0.8
          spectrumCanvas.height = 150
          
          drawSpectrumBars(spectrumCanvas, analyser, color)
          
          ctx.drawImage(
            spectrumCanvas,
            (canvas.width - spectrumCanvas.width) / 2,
            spectrumY
          )
        } else if (mockFrequencyData) {
          // Mock spectrum bars from mock data
          const spectrumY = canvas.height - 200
          const barWidth = (canvas.width * 0.8) / mockFrequencyData.length
          const startX = (canvas.width - canvas.width * 0.8) / 2
          
          for (let i = 0; i < mockFrequencyData.length; i++) {
            const value = mockFrequencyData[i] / 255
            const barHeight = value * 150
            
            ctx.fillStyle = color
            ctx.fillRect(
              startX + i * barWidth,
              spectrumY + 150 - barHeight,
              barWidth - 1,
              barHeight
            )
          }
        }
      }
      
      // Draw particles
      if (config.showParticles && particleSystemRef.current) {
        particleSystemRef.current.update()
        particleSystemRef.current.draw()
      }
      
      // Beat pulse effect (screen flash)
      if (beatPulseRef.current > 0 && config.showParticles) {
        ctx.fillStyle = `${color}${Math.floor(beatPulseRef.current * 30).toString(16).padStart(2, '0')}`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Border pulse
        ctx.strokeStyle = `${color}${Math.floor(beatPulseRef.current * 180).toString(16).padStart(2, '0')}`
        ctx.lineWidth = 8 * beatPulseRef.current
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
      }
    
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [analyser, mockFrequencyData, isPlaying, config, color, preset, frequencyBands])
  
  // Start animation loop (always running)
  useEffect(() => {
    animate()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])
  
  return (
    <>
      {/* Main visualization canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: config.backgroundColor }}
      />
      
      {/* Now Playing Info */}
      {currentTrack && (
        <div className="absolute bottom-8 left-8 max-w-xl z-10">
          <div className="bg-neutral-900/90 border-2 rounded-lg p-6 shadow-2xl backdrop-blur-sm"
            style={{ borderColor: color }}
          >
            <div className="flex items-start gap-4">
              {/* Album Art / Placeholder */}
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0"
                style={{ backgroundColor: color + '20' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              
              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-1" style={{ color }}>
                  NOW PLAYING
                </p>
                <h2 className="text-2xl font-bold text-white truncate mb-1">
                  {currentTrack.title}
                </h2>
                {currentTrack.artist && (
                  <p className="text-lg text-neutral-300 truncate">
                    {currentTrack.artist}
                  </p>
                )}
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {bpm && (
                    <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: color + '30', color }}>
                      {Math.round(bpm)} BPM
                    </span>
                  )}
                  {currentTrack.musical_key && (
                    <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: color + '30', color }}>
                      {currentTrack.musical_key}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: color + '30', color }}>
                    E{Math.round(energy)}
                  </span>
                  <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-xs font-bold">
                    DECK {activeDeck}
                  </span>
                  {autodjActive && (
                    <span className="px-2 py-1 bg-green-600/30 text-green-300 rounded text-xs font-bold">
                      AUTO-DJ
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>{formatTime(localPlaybackPosition)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${(localPlaybackPosition / duration) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* VU Meters - Show when we have frequency data */}
      {(analyser || mockFrequencyData) && (
        <div className="absolute top-8 right-8 z-10">
          <div className="bg-neutral-900/90 border rounded-lg p-4 shadow-2xl backdrop-blur-sm"
            style={{ borderColor: color }}
          >
            <p className="text-xs font-medium mb-2" style={{ color }}>LEVELS</p>
            <div className="space-y-2">
              <VUMeter label="LOW" value={frequencyBands.low} color={color} />
              <VUMeter label="MID" value={frequencyBands.mid} color={color} />
              <VUMeter label="HIGH" value={frequencyBands.high} color={color} />
            </div>
          </div>
        </div>
      )}
      
      {/* Preset Indicator */}
      <div className="absolute top-8 left-8 z-10">
        <div className="bg-neutral-900/90 border rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm"
          style={{ borderColor: color }}
        >
          <p className="text-xs font-bold" style={{ color }}>
            {VISUALIZATION_PRESETS[preset].name.toUpperCase()}
          </p>
        </div>
      </div>
    </>
  )
}

// Helper: VU Meter component
function VUMeter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-neutral-400 w-10">{label}</span>
      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-75"
          style={{
            width: `${value * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

// Helper: Format time
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Helper: Draw retro grid
function drawRetroGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  ctx.strokeStyle = `#B968FF${Math.floor(intensity * 100 + 50).toString(16).padStart(2, '0')}`
  ctx.lineWidth = 1
  
  // Horizontal lines
  const gridSize = 50
  for (let y = height / 2; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // Vertical lines with perspective
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, height / 2)
    ctx.lineTo(width / 2 + (x - width / 2) * 2, height)
    ctx.stroke()
  }
}
