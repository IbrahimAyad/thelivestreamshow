/**
 * Visualization Presets for Broadcast Overlay
 */

export type VisualizationPreset = 'classic' | 'circular' | 'minimal' | 'particles' | 'retro'

export interface PresetConfig {
  name: string
  description: string
  showSpectrum: boolean
  showCircular: boolean
  showParticles: boolean
  showVinyl: boolean
  particleIntensity: number
  backgroundColor: string
}

export const VISUALIZATION_PRESETS: Record<VisualizationPreset, PresetConfig> = {
  classic: {
    name: 'Classic',
    description: 'Traditional spectrum bars',
    showSpectrum: true,
    showCircular: false,
    showParticles: false,
    showVinyl: false,
    particleIntensity: 0,
    backgroundColor: '#000000',
  },
  circular: {
    name: 'Circular',
    description: 'Radial waveform around vinyl',
    showSpectrum: false,
    showCircular: true,
    showParticles: true,
    showVinyl: true,
    particleIntensity: 10,
    backgroundColor: '#000000',
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean with just now playing info',
    showSpectrum: false,
    showCircular: false,
    showParticles: false,
    showVinyl: false,
    particleIntensity: 0,
    backgroundColor: 'transparent',
  },
  particles: {
    name: 'Particles',
    description: 'Heavy particle effects',
    showSpectrum: true,
    showCircular: false,
    showParticles: true,
    showVinyl: false,
    particleIntensity: 30,
    backgroundColor: '#000000',
  },
  retro: {
    name: 'Retro',
    description: '80s-style grid and neon',
    showSpectrum: true,
    showCircular: false,
    showParticles: true,
    showVinyl: false,
    particleIntensity: 15,
    backgroundColor: '#0a0014',
  },
}

const STORAGE_KEY = 'broadcast-visualization-preset'

export function savePreset(preset: VisualizationPreset): void {
  localStorage.setItem(STORAGE_KEY, preset)
}

export function loadPreset(): VisualizationPreset {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && saved in VISUALIZATION_PRESETS) {
    return saved as VisualizationPreset
  }
  return 'classic'
}
