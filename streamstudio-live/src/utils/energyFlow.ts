// Energy Flow Management Utility
// Provides energy progression scoring for DJ transitions

export type EnergyStyle = 'gradual' | 'peak-valley' | 'chill'

/**
 * Calculate energy flow compatibility score
 * @param fromEnergy Source energy level (1-10)
 * @param toEnergy Destination energy level (1-10)
 * @param style Energy progression style
 * @returns Compatibility score (0-100)
 */
export function getEnergyFlowScore(
  fromEnergy: number,
  toEnergy: number,
  style: EnergyStyle = 'gradual'
): number {
  // Handle missing energy data
  if (!fromEnergy || !toEnergy) {
    return 50 // Neutral score for missing data
  }
  
  const change = toEnergy - fromEnergy
  
  switch (style) {
    case 'gradual':
      return getGradualBuildScore(change)
    
    case 'peak-valley':
      return getPeakValleyScore(change, fromEnergy)
    
    case 'chill':
      return getChillFlowScore(change, toEnergy)
    
    default:
      return getGradualBuildScore(change)
  }
}

/**
 * Gradual Build style: Smooth energy progression
 * Prefers small increases, tolerates small decreases
 */
function getGradualBuildScore(change: number): number {
  // +1 to +2: Perfect gradual build
  if (change >= 1 && change <= 2) return 100
  
  // 0: Same energy, very smooth
  if (change === 0) return 85
  
  // -1: Slight drop, acceptable
  if (change === -1) return 70
  
  // +3 to +4: Moderate jump, still okay
  if (change >= 3 && change <= 4) return 60
  
  // -2 to -3: Moderate drop
  if (change >= -3 && change <= -2) return 50
  
  // +5 to +6: Large jump, getting jarring
  if (change >= 5 && change <= 6) return 35
  
  // -4 to -5: Large drop
  if (change >= -5 && change <= -4) return 30
  
  // ±7+: Very jarring transition
  if (Math.abs(change) >= 7) return 10
  
  return 40 // Default for other cases
}

/**
 * Peak & Valley style: Dramatic energy changes
 * Rewards large swings up and down
 */
function getPeakValleyScore(change: number, fromEnergy: number): number {
  const absChange = Math.abs(change)
  
  // Large swings (±3 to ±5): Perfect for this style
  if (absChange >= 3 && absChange <= 5) return 100
  
  // Moderate swings (±2): Good
  if (absChange === 2) return 80
  
  // Extreme swings (±6+): Acceptable for peaks
  if (absChange >= 6) {
    // Prefer building to peaks (high energy)
    if (change > 0 && fromEnergy >= 5) return 90
    // Dramatic drops from peaks
    if (change < 0 && fromEnergy >= 8) return 85
    return 70
  }
  
  // Small changes (±1): Less ideal for this style
  if (absChange === 1) return 60
  
  // No change: Not ideal for peak & valley
  if (change === 0) return 40
  
  return 50
}

/**
 * Chill Flow style: Keep energy low and steady
 * Prefers staying in 1-5 range with minimal changes
 */
function getChillFlowScore(change: number, toEnergy: number): number {
  // Bonus for staying in chill range (1-5)
  const isInChillRange = toEnergy >= 1 && toEnergy <= 5
  const rangeBonus = isInChillRange ? 20 : 0
  
  // Minimal change (±1): Perfect
  if (Math.abs(change) <= 1) return 100
  
  // Small decrease (-2): Good for chill
  if (change === -2) return 85 + rangeBonus
  
  // Small increase (+2): Acceptable
  if (change === 2) return 70 + rangeBonus
  
  // Moderate changes (±3): Less ideal
  if (Math.abs(change) === 3) return 50 + rangeBonus
  
  // Large changes (±4+): Breaks chill vibe
  if (Math.abs(change) >= 4) {
    // Penalty for high energy
    if (toEnergy > 6) return Math.max(0, 30 - ((toEnergy - 6) * 5))
    return 30
  }
  
  return 40 + rangeBonus
}

/**
 * Get time-of-day energy preference (optional feature)
 * @returns Recommended energy range for current time
 */
export function getTimeOfDayEnergyRange(): [number, number] {
  const hour = new Date().getHours()
  
  // Morning (6am-12pm): Moderate energy
  if (hour >= 6 && hour < 12) return [3, 6]
  
  // Afternoon (12pm-6pm): Medium-high energy
  if (hour >= 12 && hour < 18) return [5, 8]
  
  // Evening (6pm-12am): High energy
  if (hour >= 18 && hour < 24) return [6, 10]
  
  // Late night (12am-6am): Low energy
  return [2, 5]
}

/**
 * Calculate time-of-day bonus score
 * @param energyLevel Track energy level
 * @returns Bonus score (0-20)
 */
export function getTimeOfDayBonus(energyLevel: number): number {
  if (!energyLevel) return 0
  
  const [minEnergy, maxEnergy] = getTimeOfDayEnergyRange()
  
  // Within preferred range: full bonus
  if (energyLevel >= minEnergy && energyLevel <= maxEnergy) return 20
  
  // Close to range (±1): partial bonus
  if (energyLevel === minEnergy - 1 || energyLevel === maxEnergy + 1) return 10
  
  // Outside range: no bonus
  return 0
}

/**
 * Get human-readable explanation of energy progression
 * @param fromEnergy Source energy
 * @param toEnergy Destination energy
 * @param style Energy style
 * @returns Explanation string
 */
export function getEnergyFlowReason(
  fromEnergy: number,
  toEnergy: number,
  style: EnergyStyle
): string {
  if (!fromEnergy || !toEnergy) return 'Energy data unavailable'
  
  const change = toEnergy - fromEnergy
  const absChange = Math.abs(change)
  
  // No change
  if (change === 0) {
    return style === 'chill' 
      ? `Steady energy (E${toEnergy})` 
      : `No energy change (E${toEnergy})`
  }
  
  // Direction
  const direction = change > 0 ? 'build' : 'drop'
  const changeText = `${change > 0 ? '+' : ''}${change}`
  
  // Style-specific messaging
  switch (style) {
    case 'gradual':
      if (absChange <= 2) return `Gradual ${direction} (${changeText})`
      if (absChange <= 4) return `Moderate ${direction} (${changeText})`
      return `Large ${direction} (${changeText})`
    
    case 'peak-valley':
      if (absChange >= 3) return `Dynamic ${direction} (${changeText})`
      return `Subtle ${direction} (${changeText})`
    
    case 'chill':
      if (absChange === 1) return `Gentle ${direction} (${changeText})`
      if (absChange === 2) return `Mild ${direction} (${changeText})`
      return `Noticeable ${direction} (${changeText})`
    
    default:
      return `Energy ${direction} (${changeText})`
  }
}
