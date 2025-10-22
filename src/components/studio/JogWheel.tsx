/**
 * JogWheel - Touch-sensitive DJ jog wheel for scratching and pitch bend
 *
 * Features:
 * - Circular vinyl-style wheel
 * - Touch/mouse drag detection
 * - Pitch bend mode (while playing)
 * - Scratch mode (while stopped or touching platter)
 * - Realistic vinyl texture
 * - Rotation animation
 * - Velocity-sensitive scratching
 *
 * Usage:
 * - Outer ring: Pitch bend (nudge tempo while playing)
 * - Inner platter: Scratch (manipulate playback position)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { DeckId } from '@/hooks/studio/useDeckAudioPlayer'

interface JogWheelProps {
  deckId: DeckId
  isPlaying: boolean
  playbackPosition: number
  onPitchBend: (delta: number) => void // Temporary tempo adjustment
  onScratch: (delta: number) => void // Direct playback position change
  onTouchStart?: () => void
  onTouchEnd?: () => void
  size?: number // Width/height in pixels
  className?: string
}

export function JogWheel({
  deckId,
  isPlaying,
  playbackPosition,
  onPitchBend,
  onScratch,
  onTouchStart,
  onTouchEnd,
  size = 280,
  className = '',
}: JogWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isTouched, setIsTouched] = useState(false)
  const [touchMode, setTouchMode] = useState<'outer' | 'inner'>('outer')
  const [velocity, setVelocity] = useState(0)

  const wheelRef = useRef<HTMLDivElement>(null)
  const lastAngleRef = useRef(0)
  const lastTimeRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)

  const deckColor = deckId === 'A' ? '#3B82F6' : '#8B5CF6' // blue or purple

  // Rotate wheel based on playback position when playing
  useEffect(() => {
    if (isPlaying && !isTouched) {
      // Simulate vinyl rotation (360 degrees per second for visual effect)
      const rotationSpeed = 360 // degrees per second
      const animate = () => {
        setRotation(prev => (prev + rotationSpeed / 60) % 360) // 60 FPS
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, isTouched])

  // Calculate angle from center of wheel
  const getAngle = useCallback((clientX: number, clientY: number): number => {
    if (!wheelRef.current) return 0

    const rect = wheelRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    return Math.atan2(clientY - centerY, clientX - centerX)
  }, [])

  // Calculate distance from center
  const getDistanceFromCenter = useCallback((clientX: number, clientY: number): number => {
    if (!wheelRef.current) return 0

    const rect = wheelRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    return Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2))
  }, [])

  // Handle touch/mouse start
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return

    isDraggingRef.current = true
    setIsTouched(true)
    onTouchStart?.()

    const rect = wheelRef.current.getBoundingClientRect()
    const radius = rect.width / 2
    const distance = getDistanceFromCenter(clientX, clientY)

    // Determine if touching outer ring (pitch bend) or inner platter (scratch)
    const mode = distance > radius * 0.7 ? 'outer' : 'inner'
    setTouchMode(mode)

    lastAngleRef.current = getAngle(clientX, clientY)
    lastTimeRef.current = Date.now()

    console.log(`[JogWheel ${deckId}] Touch started - Mode: ${mode}`)
  }, [deckId, getAngle, getDistanceFromCenter, onTouchStart])

  // Handle touch/mouse move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !wheelRef.current) return

    const currentAngle = getAngle(clientX, clientY)
    const currentTime = Date.now()

    // Calculate angular delta
    let angleDelta = currentAngle - lastAngleRef.current

    // Handle angle wrap-around
    if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI
    if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI

    // Calculate velocity (radians per millisecond)
    const timeDelta = currentTime - lastTimeRef.current
    const angularVelocity = timeDelta > 0 ? angleDelta / timeDelta : 0

    setVelocity(angularVelocity * 1000) // Convert to radians/second

    // Update rotation for visual feedback
    setRotation(prev => {
      const newRotation = prev + (angleDelta * 180 / Math.PI)
      return newRotation % 360
    })

    // Apply pitch bend or scratch based on mode
    if (touchMode === 'outer') {
      // Pitch bend mode (outer ring)
      // Small tempo adjustments for nudging
      const pitchBendAmount = angleDelta * 0.5 // Scale factor
      onPitchBend(pitchBendAmount)

    } else {
      // Scratch mode (inner platter)
      // Direct playback manipulation
      const scratchAmount = angleDelta * 2 // Larger scale for scratching
      onScratch(scratchAmount)
    }

    lastAngleRef.current = currentAngle
    lastTimeRef.current = currentTime

  }, [touchMode, getAngle, onPitchBend, onScratch])

  // Handle touch/mouse end
  const handleEnd = useCallback(() => {
    isDraggingRef.current = false
    setIsTouched(false)
    setVelocity(0)
    onTouchEnd?.()

    console.log(`[JogWheel ${deckId}] Touch ended`)
  }, [deckId, onTouchEnd])

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault()
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Add/remove global mouse/touch listeners
  useEffect(() => {
    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Jog wheel */}
      <div
        ref={wheelRef}
        className="relative select-none touch-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Outer ring (pitch bend area) */}
        <div
          className="absolute inset-0 rounded-full bg-neutral-800 border-4 border-neutral-700 cursor-grab active:cursor-grabbing"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isTouched ? 'none' : 'transform 0.1s',
          }}
        >
          {/* Ring notches for visual feedback */}
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 h-full w-0.5 origin-bottom"
              style={{
                transform: `translateX(-50%) rotate(${i * 6}deg)`,
                opacity: i % 5 === 0 ? 0.5 : 0.2,
              }}
            >
              <div className="h-3 bg-neutral-600" />
            </div>
          ))}
        </div>

        {/* Inner platter (scratch area) */}
        <div
          className="absolute inset-6 rounded-full bg-gradient-radial from-neutral-700 to-neutral-900 border-2 border-neutral-600"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isTouched ? 'none' : 'transform 0.1s',
            boxShadow: isTouched ? `0 0 20px ${deckColor}` : 'none',
          }}
        >
          {/* Vinyl grooves */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-neutral-600"
              style={{
                margin: `${i * 6 + 8}px`,
                opacity: 0.3,
              }}
            />
          ))}

          {/* Center label */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              width: size * 0.25,
              height: size * 0.25,
              backgroundColor: deckColor,
              color: 'white',
              boxShadow: `0 4px 12px ${deckColor}`,
            }}
          >
            {deckId}
          </div>

          {/* Rotation indicator line */}
          <div
            className="absolute top-0 left-1/2 w-1 bg-white -translate-x-1/2"
            style={{ height: size * 0.15 }}
          />
        </div>

        {/* Touch indicator ring */}
        {isTouched && (
          <div
            className="absolute inset-0 rounded-full border-4 animate-pulse pointer-events-none"
            style={{
              borderColor: deckColor,
              boxShadow: `0 0 30px ${deckColor}`,
            }}
          />
        )}

        {/* Mode indicator (outer ring vs inner platter) */}
        {isTouched && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold text-white whitespace-nowrap"
            style={{
              backgroundColor: deckColor,
            }}
          >
            {touchMode === 'outer' ? '🎵 Pitch Bend Mode' : '🎨 Scratch Mode'}
          </div>
        )}
      </div>

      {/* Status display */}
      <div className="mt-4 space-y-1 text-center">
        {/* Playing indicator */}
        <div className={`text-sm font-medium ${isPlaying ? 'text-green-400' : 'text-neutral-500'}`}>
          {isPlaying ? '▶️ PLAYING' : '⏸️ PAUSED'}
        </div>

        {/* Velocity indicator (when scratching) */}
        {isTouched && Math.abs(velocity) > 0.1 && (
          <div className="text-xs text-neutral-400 font-mono">
            Velocity: {velocity.toFixed(1)} rad/s
          </div>
        )}

        {/* Deck info */}
        <div className="text-xs text-neutral-500">
          Deck {deckId} Jog Wheel
        </div>
      </div>

      {/* Instructions (hidden when touched) */}
      {!isTouched && (
        <div className="mt-2 text-xs text-neutral-500 text-center max-w-xs">
          <p className="mb-1 font-medium">Touch outer ring to pitch bend</p>
          <p>Touch center platter to scratch</p>
        </div>
      )}
    </div>
  )
}
