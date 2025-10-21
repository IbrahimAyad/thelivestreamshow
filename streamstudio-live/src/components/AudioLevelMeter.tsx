import { useEffect, useRef } from 'react'

interface AudioLevelMeterProps {
  analyser: AnalyserNode | null
  orientation?: 'horizontal' | 'vertical'
  height?: number
  width?: number
  className?: string
}

export function AudioLevelMeter({
  analyser,
  orientation = 'horizontal',
  height = 6,
  width = 200,
  className = '',
}: AudioLevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const peakLevelRef = useRef(0)
  const peakTimeRef = useRef(0)

  useEffect(() => {
    if (!analyser || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      // Calculate average level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
      const level = average / 255

      // Track peak
      const now = Date.now()
      if (level > peakLevelRef.current || now - peakTimeRef.current > 800) {
        peakLevelRef.current = level
        peakTimeRef.current = now
      }

      // Clear canvas
      ctx.fillStyle = '#27272A'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw level bar
      const barWidth = canvas.width * level
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      
      if (level < 0.7) {
        gradient.addColorStop(0, '#10B981') // success-500
        gradient.addColorStop(1, '#10B981')
      } else if (level < 0.9) {
        gradient.addColorStop(0, '#10B981')
        gradient.addColorStop(0.7, '#F59E0B') // warning-500
        gradient.addColorStop(1, '#F59E0B')
      } else {
        gradient.addColorStop(0, '#10B981')
        gradient.addColorStop(0.7, '#F59E0B')
        gradient.addColorStop(0.9, '#EF4444') // error-500
        gradient.addColorStop(1, '#EF4444')
      }

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, barWidth, canvas.height)

      // Draw peak indicator
      const peakX = canvas.width * peakLevelRef.current
      ctx.fillStyle = '#EF4444'
      ctx.fillRect(peakX - 2, 0, 4, canvas.height)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyser])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded-full ${className}`}
    />
  )
}
