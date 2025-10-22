/**
 * Energy Flow - Manages energy transitions between tracks
 */

export interface EnergyProfile {
  level: number; // 0-100
  trend: 'rising' | 'falling' | 'stable';
  bpm: number;
  intensity: number;
}

export interface EnergyTransition {
  from: EnergyProfile;
  to: EnergyProfile;
  duration: number; // seconds
  type: 'smooth' | 'hard' | 'gradual';
}

export function calculateEnergyProfile(bpm: number, intensity: number = 0.5): EnergyProfile {
  const level = Math.min(100, Math.max(0, (bpm - 60) / 2 + intensity * 50));
  
  return {
    level,
    trend: 'stable',
    bpm,
    intensity,
  };
}

export function planEnergyTransition(
  from: EnergyProfile,
  to: EnergyProfile,
  duration: number = 8
): EnergyTransition {
  const type = Math.abs(from.level - to.level) > 30 ? 'hard' : 'smooth';
  
  return {
    from,
    to,
    duration,
    type,
  };
}

export function getOptimalMixPoint(energyProfile: EnergyProfile): number {
  // Return the optimal point to start mixing (in beats)
  if (energyProfile.level > 70) {
    return 16; // High energy - mix earlier
  } else if (energyProfile.level > 40) {
    return 8;  // Medium energy
  } else {
    return 4;  // Low energy - shorter mix
  }
}

export type EnergyStyle = 'aggressive' | 'smooth' | 'gradual' | 'dramatic';

export function getEnergyStyle(transition: EnergyTransition): EnergyStyle {
  const energyDiff = Math.abs(transition.to.level - transition.from.level);
  
  if (energyDiff > 50) return 'dramatic';
  if (energyDiff > 30) return 'aggressive';
  if (energyDiff > 15) return 'gradual';
  return 'smooth';
}

