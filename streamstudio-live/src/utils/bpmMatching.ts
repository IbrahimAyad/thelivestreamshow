// BPM Matching Utility
// Provides BPM compatibility scoring for DJ transitions

/**
 * Calculate BPM compatibility score between two tempos
 * @param fromBPM Source tempo
 * @param toBPM Destination tempo
 * @returns Compatibility score (0-100)
 */
export function getBPMCompatibilityScore(fromBPM: number, toBPM: number): number {
  // Handle missing BPM data
  if (!fromBPM || !toBPM || fromBPM <= 0 || toBPM <= 0) {
    return 50 // Neutral score for missing data
  }
  
  const difference = Math.abs(toBPM - fromBPM)
  
  // Exact match (±0.5 BPM)
  if (difference <= 0.5) return 100
  
  // ±1-3 BPM: Excellent (95-100)
  if (difference <= 3) {
    return 100 - (difference * 1.67) // Linear scale: 3 BPM = 95 points
  }
  
  // ±3-6 BPM: Good (80-95)
  if (difference <= 6) {
    return 95 - ((difference - 3) * 5) // Linear scale
  }
  
  // ±6-10 BPM: Acceptable (50-80)
  if (difference <= 10) {
    return 80 - ((difference - 6) * 7.5) // Linear scale
  }
  
  // >10 BPM: Poor (0-50)
  // Exponential penalty for large differences
  const penalty = Math.min(50, (difference - 10) * 2.5)
  return Math.max(0, 50 - penalty)
}

/**
 * Check if two BPMs are in half-time relationship
 * @param bpm1 First tempo
 * @param bpm2 Second tempo
 * @returns True if bpm2 is approximately half of bpm1 (±3 BPM tolerance)
 */
export function isHalfTime(bpm1: number, bpm2: number): boolean {
  if (!bpm1 || !bpm2) return false
  const halfBPM = bpm1 / 2
  return Math.abs(bpm2 - halfBPM) <= 3
}

/**
 * Check if two BPMs are in double-time relationship
 * @param bpm1 First tempo
 * @param bpm2 Second tempo
 * @returns True if bpm2 is approximately double of bpm1 (±3 BPM tolerance)
 */
export function isDoubleTime(bpm1: number, bpm2: number): boolean {
  if (!bpm1 || !bpm2) return false
  const doubleBPM = bpm1 * 2
  return Math.abs(bpm2 - doubleBPM) <= 3
}

/**
 * Calculate BPM compatibility with half-time/double-time support
 * @param fromBPM Source tempo
 * @param toBPM Destination tempo
 * @returns Enhanced score with special handling for tempo relationships
 */
export function getBPMCompatibilityScoreEnhanced(fromBPM: number, toBPM: number): number {
  // Standard matching
  const standardScore = getBPMCompatibilityScore(fromBPM, toBPM)
  
  // Check for half-time (useful for genre transitions)
  if (isHalfTime(fromBPM, toBPM)) {
    return Math.max(standardScore, 85) // Bonus for half-time
  }
  
  // Check for double-time
  if (isDoubleTime(fromBPM, toBPM)) {
    return Math.max(standardScore, 85) // Bonus for double-time
  }
  
  return standardScore
}

/**
 * Get human-readable explanation of BPM compatibility
 * @param fromBPM Source tempo
 * @param toBPM Destination tempo
 * @returns Explanation string
 */
export function getBPMCompatibilityReason(fromBPM: number, toBPM: number): string {
  if (!fromBPM || !toBPM) return 'BPM data unavailable'
  
  const difference = toBPM - fromBPM
  const absDiff = Math.abs(difference)
  
  // Exact match
  if (absDiff <= 0.5) {
    return `Exact match (${fromBPM.toFixed(1)} BPM)`
  }
  
  // Half-time
  if (isHalfTime(fromBPM, toBPM)) {
    return `Half-time transition (${fromBPM.toFixed(1)} → ${toBPM.toFixed(1)} BPM)`
  }
  
  // Double-time
  if (isDoubleTime(fromBPM, toBPM)) {
    return `Double-time transition (${fromBPM.toFixed(1)} → ${toBPM.toFixed(1)} BPM)`
  }
  
  // Close match
  if (absDiff <= 3) {
    return `Very close (${difference > 0 ? '+' : ''}${difference.toFixed(1)} BPM)`
  }
  
  // Moderate difference
  if (absDiff <= 6) {
    return `Close (${difference > 0 ? '+' : ''}${difference.toFixed(1)} BPM)`
  }
  
  // Large difference
  if (absDiff <= 10) {
    return `Moderate difference (${difference > 0 ? '+' : ''}${difference.toFixed(1)} BPM)`
  }
  
  // Very large difference
  return `Large difference (${difference > 0 ? '+' : ''}${difference.toFixed(1)} BPM)`
}
