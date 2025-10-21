// Preset Modes for Beginner-Friendly Auto-DJ
// Each mode automatically configures Auto-DJ settings for different scenarios

import type { AutoDJSettings } from '../types/database';

export interface PresetMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorClass: string;
  settings: Partial<AutoDJSettings>;
  energyRange?: [number, number];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
}

export const PRESET_MODES: PresetMode[] = [
  {
    id: 'morning-calm',
    name: 'Morning Calm',
    description: 'Gentle start to your day with smooth, low-energy tracks',
    icon: 'sunrise',
    colorClass: 'from-yellow-400 to-orange-400',
    settings: {
      enabled: true,
      prefer_harmonic: true,
      strict_bpm: false,
      energy_style: 'chill',
      recency_limit: 10,
    },
    energyRange: [1, 4],
    timeOfDay: 'morning',
  },
  {
    id: 'work-focus',
    name: 'Work Focus',
    description: 'Steady mid-energy flow to keep you productive and focused',
    icon: 'briefcase',
    colorClass: 'from-blue-400 to-cyan-400',
    settings: {
      enabled: true,
      prefer_harmonic: true,
      strict_bpm: true,
      energy_style: 'gradual',
      recency_limit: 15,
    },
    energyRange: [4, 6],
    timeOfDay: 'any',
  },
  {
    id: 'party-time',
    name: 'Party Time',
    description: 'High-energy bangers with dynamic peaks and valleys',
    icon: 'party',
    colorClass: 'from-pink-400 to-purple-400',
    settings: {
      enabled: true,
      prefer_harmonic: true,
      strict_bpm: false,
      energy_style: 'peak-valley',
      recency_limit: 20,
    },
    energyRange: [7, 10],
    timeOfDay: 'evening',
  },
  {
    id: 'chill-evening',
    name: 'Chill Evening',
    description: 'Wind down with mellow vibes and relaxed transitions',
    icon: 'moon',
    colorClass: 'from-indigo-400 to-purple-400',
    settings: {
      enabled: true,
      prefer_harmonic: true,
      strict_bpm: false,
      energy_style: 'chill',
      recency_limit: 12,
    },
    energyRange: [2, 5],
    timeOfDay: 'evening',
  },
];

// Get recommended preset based on time of day
export function getRecommendedPreset(): PresetMode {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    // Morning: 5am - 12pm
    return PRESET_MODES.find(m => m.id === 'morning-calm')!;
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: 12pm - 5pm
    return PRESET_MODES.find(m => m.id === 'work-focus')!;
  } else if (hour >= 17 && hour < 22) {
    // Evening: 5pm - 10pm
    return PRESET_MODES.find(m => m.id === 'party-time')!;
  } else {
    // Night: 10pm - 5am
    return PRESET_MODES.find(m => m.id === 'chill-evening')!;
  }
}

// Get preset by ID
export function getPresetById(id: string): PresetMode | undefined {
  return PRESET_MODES.find(m => m.id === id);
}

// Check if a track matches the preset's energy range
export function isTrackSuitableForPreset(trackEnergy: number | null, preset: PresetMode): boolean {
  if (!trackEnergy || !preset.energyRange) return true;
  
  const [min, max] = preset.energyRange;
  return trackEnergy >= min && trackEnergy <= max;
}
