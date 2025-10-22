/**
 * Visualization Presets - Predefined visualization configurations
 */

export interface VisualizationPreset {
  id: string;
  name: string;
  description: string;
  type: 'bars' | 'waveform' | 'circle' | 'spectrum';
  config: {
    colorScheme: 'default' | 'rainbow' | 'monochrome' | 'gradient';
    barCount?: number;
    smoothing?: number;
    sensitivity?: number;
    gradient?: {
      from: string;
      to: string;
    };
  };
  // Additional properties for visualization
  showParticles?: boolean;
  particleIntensity?: number;
  backgroundColor?: string;
  showVinyl?: boolean;
  showCircular?: boolean;
  showSpectrum?: boolean;
}

export const VISUALIZATION_PRESETS: VisualizationPreset[] = [
  {
    id: 'classic',
    name: 'Classic Bars',
    description: 'Traditional frequency bars',
    type: 'bars',
    config: {
      colorScheme: 'default',
      barCount: 64,
      smoothing: 0.8,
      sensitivity: 1.0,
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow Spectrum',
    description: 'Colorful rainbow bars',
    type: 'bars',
    config: {
      colorScheme: 'rainbow',
      barCount: 128,
      smoothing: 0.7,
      sensitivity: 1.2,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Wave',
    description: 'Clean monochrome waveform',
    type: 'waveform',
    config: {
      colorScheme: 'monochrome',
      smoothing: 0.9,
      sensitivity: 0.8,
    },
  },
  {
    id: 'energy',
    name: 'Energy Pulse',
    description: 'High-energy circular visualization',
    type: 'circle',
    config: {
      colorScheme: 'gradient',
      gradient: {
        from: '#00ff00',
        to: '#ff0000',
      },
      barCount: 64,
      smoothing: 0.6,
      sensitivity: 1.5,
    },
  },
];

export function getPresetById(id: string): VisualizationPreset | undefined {
  return VISUALIZATION_PRESETS.find(preset => preset.id === id);
}

export function getPresetsByType(type: VisualizationPreset['type']): VisualizationPreset[] {
  return VISUALIZATION_PRESETS.filter(preset => preset.type === type);
}

export function loadPreset(id: string): VisualizationPreset | undefined {
  return getPresetById(id);
}

export default { VISUALIZATION_PRESETS, getPresetById, getPresetsByType, loadPreset };

