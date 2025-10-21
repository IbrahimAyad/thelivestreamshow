/**
 * Audio Visualization Utility
 * High-performance Canvas-based visualizations using Web Audio API
 */

export interface VisualizationConfig {
  fftSize: number
  smoothing: number
  minDecibels: number
  maxDecibels: number
}

export interface FrequencyData {
  low: number // 0-1 (20-250 Hz)
  mid: number // 0-1 (250-2000 Hz)
  high: number // 0-1 (2000-20000 Hz)
  average: number // 0-1
}

const DEFAULT_CONFIG: VisualizationConfig = {
  fftSize: 2048,
  smoothing: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
}

/**
 * Get frequency data from analyser node
 */
export function getFrequencyData(analyser: AnalyserNode): Uint8Array {
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(dataArray)
  return dataArray
}

/**
 * Get waveform (time domain) data from analyser
 */
export function getWaveformData(analyser: AnalyserNode): Uint8Array {
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteTimeDomainData(dataArray)
  return dataArray
}

/**
 * Calculate frequency band energies
 */
export function getFrequencyBands(analyser: AnalyserNode): FrequencyData {
  const dataArray = getFrequencyData(analyser)
  const bufferLength = dataArray.length
  
  // Frequency bins (each bin = sampleRate / fftSize)
  // Assuming 44100 Hz sample rate and fftSize 2048:
  // Each bin = 44100 / 2048 = 21.5 Hz
  
  // Low: 20-250 Hz (bins 1-12)
  const lowStart = 1
  const lowEnd = 12
  let lowSum = 0
  for (let i = lowStart; i < lowEnd; i++) {
    lowSum += dataArray[i]
  }
  const low = lowSum / (lowEnd - lowStart) / 255
  
  // Mid: 250-2000 Hz (bins 12-93)
  const midStart = 12
  const midEnd = 93
  let midSum = 0
  for (let i = midStart; i < midEnd; i++) {
    midSum += dataArray[i]
  }
  const mid = midSum / (midEnd - midStart) / 255
  
  // High: 2000-20000 Hz (bins 93-930)
  const highStart = 93
  const highEnd = Math.min(930, bufferLength)
  let highSum = 0
  for (let i = highStart; i < highEnd; i++) {
    highSum += dataArray[i]
  }
  const high = highSum / (highEnd - highStart) / 255
  
  // Average of all frequencies
  let totalSum = 0
  for (let i = 0; i < bufferLength; i++) {
    totalSum += dataArray[i]
  }
  const average = totalSum / bufferLength / 255
  
  return { low, mid, high, average }
}

/**
 * Draw spectrum bars visualization
 */
export function drawSpectrumBars(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  color: string = '#00D9FF'
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const dataArray = getFrequencyData(analyser)
  const bufferLength = Math.min(128, dataArray.length) // Limit bars
  
  const width = canvas.width
  const height = canvas.height
  const barWidth = (width / bufferLength) * 0.8
  const barSpacing = (width / bufferLength) * 0.2
  
  ctx.clearRect(0, 0, width, height)
  
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * height
    const x = i * (barWidth + barSpacing)
    const y = height - barHeight
    
    // Gradient from color to transparent
    const gradient = ctx.createLinearGradient(x, y, x, height)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, color + '40') // 25% opacity
    
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)
  }
}

/**
 * Draw circular waveform visualization
 */
export function drawCircularWaveform(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  centerX: number,
  centerY: number,
  radius: number,
  color: string = '#00D9FF'
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const dataArray = getWaveformData(analyser)
  const bufferLength = dataArray.length
  const sliceAngle = (Math.PI * 2) / bufferLength
  
  ctx.beginPath()
  
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0 // Normalize to 0-2
    const r = radius + (v - 1) * 30 // Oscillate around base radius
    const angle = sliceAngle * i
    
    const x = centerX + Math.cos(angle) * r
    const y = centerY + Math.sin(angle) * r
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
}

/**
 * Draw vinyl disc graphic
 */
export function drawVinylDisc(
  canvas: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number, // radians
  isPlaying: boolean
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  
  // Vinyl disc body
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
  gradient.addColorStop(0, '#1a1a1a')
  gradient.addColorStop(0.3, '#0a0a0a')
  gradient.addColorStop(0.7, '#1a1a1a')
  gradient.addColorStop(1, '#000000')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Grooves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let r = radius * 0.3; r < radius; r += 3) {
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  // Center label
  const labelRadius = radius * 0.25
  ctx.fillStyle = isPlaying ? '#00D9FF' : '#333'
  ctx.beginPath()
  ctx.arc(0, 0, labelRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // Center hole
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(0, 0, labelRadius * 0.3, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}

/**
 * Particle system for beat effects
 */
export class ParticleSystem {
  private particles: Particle[] = []
  private maxParticles = 100
  
  constructor(private canvas: HTMLCanvasElement) {}
  
  emit(x: number, y: number, count: number = 20, color: string = '#00D9FF'): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break
      
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 3 + 2
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.02,
        size: Math.random() * 3 + 2,
        color,
      })
    }
  }
  
  update(): void {
    this.particles = this.particles.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1 // Gravity
      p.life -= p.decay
      return p.life > 0
    })
  }
  
  draw(): void {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    
    this.particles.forEach((p) => {
      ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  decay: number
  size: number
  color: string
}

/**
 * Get energy-based color scheme
 */
export function getEnergyColor(energy: number): string {
  if (energy < 40) {
    // Low energy: Blue/Cyan
    return '#00D9FF'
  } else if (energy < 70) {
    // Medium energy: Purple/Magenta
    return '#B968FF'
  } else {
    // High energy: Red/Orange
    return '#FF6B35'
  }
}

/**
 * Get energy-based gradient
 */
export function getEnergyGradient(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  energy: number
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
  
  if (energy < 40) {
    // Low energy: Blue gradient
    gradient.addColorStop(0, '#00D9FF')
    gradient.addColorStop(1, '#0099CC')
  } else if (energy < 70) {
    // Medium energy: Purple gradient
    gradient.addColorStop(0, '#B968FF')
    gradient.addColorStop(1, '#8B3DFF')
  } else {
    // High energy: Red/Orange gradient
    gradient.addColorStop(0, '#FF6B35')
    gradient.addColorStop(1, '#FF3D00')
  }
  
  return gradient
}
