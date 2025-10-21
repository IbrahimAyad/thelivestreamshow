import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  analyser: AnalyserNode | null
  height?: number
  className?: string
}

export function AudioVisualizer({ analyser, height = 60, className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

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

      ctx.fillStyle = '#0A0A0F'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height

        // Gradient from success to warning to error
        const hue = (dataArray[i] / 255) * 120
        ctx.fillStyle = `hsl(${120 - hue}, 70%, 50%)`

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }
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
      width={800}
      height={height}
      className={`w-full rounded ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
