import { useEffect, useRef, useState } from 'react'
import { VinylEmulator, VinylControlState } from '@/utils/studio/recording'

interface VinylModeProps {
  audioElement: HTMLAudioElement | null
}

export function VinylModePanel({ audioElement }: VinylModeProps) {
  const emulatorRef = useRef<VinylEmulator | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const [state, setState] = useState<VinylControlState>({
    playbackRate: 1.0,
    scratchAmount: 0,
    inertia: 0.95,
    isScratching: false,
  })
  const animationFrameRef = useRef<number | null>(null)

  // Initialize vinyl emulator
  useEffect(() => {
    if (!audioElement) return

    if (!emulatorRef.current) {
      emulatorRef.current = new VinylEmulator(audioElement)
    }

    return () => {
      if (emulatorRef.current) {
        emulatorRef.current.disconnect()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioElement])

  // Update state for UI
  useEffect(() => {
    if (!isEnabled || !emulatorRef.current) return

    const updateState = () => {
      if (emulatorRef.current) {
        setState(emulatorRef.current.getState())
      }
      animationFrameRef.current = requestAnimationFrame(updateState)
    }

    updateState()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isEnabled])

  // Draw vinyl platter
  useEffect(() => {
    if (!canvasRef.current || !isEnabled) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw vinyl record
    ctx.save()
    
    // Outer ring
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#404040'
    ctx.lineWidth = 2
    ctx.stroke()

    // Grooves
    for (let i = 1; i < 10; i++) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * (i / 10), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * (10 - i) / 10})`
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Center label
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = state.isScratching ? '#ef4444' : '#3b82f6'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Playback rate indicator (line from center)
    const angle = (state.playbackRate - 1) * Math.PI
    const lineLength = radius * 0.8
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(
      centerX + Math.cos(angle) * lineLength,
      centerY + Math.sin(angle) * lineLength
    )
    ctx.strokeStyle = state.isScratching ? '#ef4444' : '#60a5fa'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.restore()
  }, [state, isEnabled])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!emulatorRef.current || !isEnabled) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    emulatorRef.current.startScratch(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!emulatorRef.current || !isEnabled) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    emulatorRef.current.updateScratch(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleMouseUp = () => {
    if (!emulatorRef.current || !isEnabled) return
    emulatorRef.current.stopScratch()
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!emulatorRef.current || !isEnabled) return
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const touch = e.touches[0]
    emulatorRef.current.startScratch(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!emulatorRef.current || !isEnabled) return
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const touch = e.touches[0]
    emulatorRef.current.updateScratch(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  const handleTouchEnd = () => {
    if (!emulatorRef.current || !isEnabled) return
    emulatorRef.current.stopScratch()
  }

  const handleInertiaChange = (value: number) => {
    if (!emulatorRef.current) return
    emulatorRef.current.setInertia(value)
  }

  const handleReset = () => {
    if (!emulatorRef.current) return
    emulatorRef.current.reset()
  }

  const handleToggle = () => {
    if (isEnabled && emulatorRef.current) {
      emulatorRef.current.reset()
    }
    setIsEnabled(!isEnabled)
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="text-lg font-semibold">Vinyl Mode</h3>
          {isEnabled && (
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
              ACTIVE
            </span>
          )}
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="w-4 h-4 rounded border-neutral-600 text-indigo-500 focus:ring-indigo-400"
          />
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-4">
          {/* Vinyl Platter */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="cursor-pointer touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-800 rounded">
            <div>
              <span className="text-xs text-neutral-400">Playback Rate</span>
              <div className="text-lg font-mono font-bold text-indigo-400">
                {state.playbackRate > 0 ? '+' : ''}{state.playbackRate.toFixed(2)}x
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-400">Status</span>
              <div className="text-lg font-bold">
                {state.isScratching ? (
                  <span className="text-red-500">SCRATCHING</span>
                ) : (
                  <span className="text-green-500">IDLE</span>
                )}
              </div>
            </div>
          </div>

          {/* Inertia Control */}
          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Inertia (Vinyl Feel)</span>
              <span>{Math.round(state.inertia * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={state.inertia}
              onChange={(e) => handleInertiaChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded font-medium transition-colors"
          >
            Reset to Normal Speed
          </button>

          {/* Instructions */}
          <div className="p-3 bg-neutral-800 rounded border border-neutral-700">
            <p className="text-xs text-neutral-400">
              <strong className="text-neutral-300">How to use:</strong> Drag left/right on the platter to control playback speed. Release to let inertia take over. Higher inertia = more realistic vinyl feel.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
