// Harmonic Mixing & Camelot Wheel Utility
// Provides key compatibility scoring for DJ transitions

// Camelot Wheel Mapping (24 keys)
const KEY_TO_CAMELOT: Record<string, string> = {
  // Major keys (B notation)
  'C Major': '8B',
  'Db Major': '3B',
  'D Major': '10B',
  'Eb Major': '5B',
  'E Major': '12B',
  'F Major': '7B',
  'F# Major': '2B',
  'Gb Major': '2B', // Enharmonic equivalent
  'G Major': '9B',
  'Ab Major': '4B',
  'A Major': '11B',
  'Bb Major': '6B',
  'B Major': '1B',
  
  // Minor keys (A notation)
  'C Minor': '5A',
  'C# Minor': '12A',
  'D Minor': '7A',
  'Eb Minor': '2A',
  'E Minor': '9A',
  'F Minor': '4A',
  'F# Minor': '11A',
  'G Minor': '6A',
  'Ab Minor': '1A',
  'A Minor': '8A',
  'Bb Minor': '3A',
  'B Minor': '10A',
}

// Reverse mapping
const CAMELOT_TO_KEY: Record<string, string> = Object.entries(KEY_TO_CAMELOT)
  .reduce((acc, [key, code]) => ({ ...acc, [code]: key }), {})

/**
 * Convert musical key name to Camelot code
 * @param key Musical key (e.g., "C Major", "A Minor")
 * @returns Camelot code (e.g., "8B", "8A") or null if not found
 */
export function keyToCamelot(key: string): string | null {
  return KEY_TO_CAMELOT[key] || null
}

/**
 * Convert Camelot code to musical key name
 * @param code Camelot code (e.g., "8B")
 * @returns Musical key name or null if invalid
 */
export function camelotToKey(code: string): string | null {
  return CAMELOT_TO_KEY[code] || null
}

/**
 * Get list of harmonically compatible Camelot codes
 * @param code Source Camelot code
 * @returns Array of compatible codes with compatibility level
 */
export function getCompatibleKeys(code: string): Array<{ code: string; compatibility: 'perfect' | 'excellent' | 'good' }> {
  if (!code || code.length < 2) return []
  
  const number = parseInt(code.slice(0, -1))
  const letter = code.slice(-1)
  
  if (isNaN(number) || (letter !== 'A' && letter !== 'B')) return []
  
  const compatible: Array<{ code: string; compatibility: 'perfect' | 'excellent' | 'good' }> = []
  
  // Same key (perfect match)
  compatible.push({ code, compatibility: 'perfect' })
  
  // Relative major/minor (excellent)
  const relativeLetter = letter === 'A' ? 'B' : 'A'
  compatible.push({ code: `${number}${relativeLetter}`, compatibility: 'excellent' })
  
  // +1 semitone (excellent)
  const nextNumber = number === 12 ? 1 : number + 1
  compatible.push({ code: `${nextNumber}${letter}`, compatibility: 'excellent' })
  
  // -1 semitone (excellent)
  const prevNumber = number === 1 ? 12 : number - 1
  compatible.push({ code: `${prevNumber}${letter}`, compatibility: 'excellent' })
  
  // +2 semitones (good)
  const next2Number = nextNumber === 12 ? 1 : nextNumber + 1
  compatible.push({ code: `${next2Number}${letter}`, compatibility: 'good' })
  
  // -2 semitones (good)
  const prev2Number = prevNumber === 1 ? 12 : prevNumber - 1
  compatible.push({ code: `${prev2Number}${letter}`, compatibility: 'good' })
  
  return compatible
}

/**
 * Calculate harmonic compatibility score between two keys
 * @param fromKey Source musical key
 * @param toKey Destination musical key
 * @returns Compatibility score (0-100)
 */
export function getKeyCompatibilityScore(fromKey: string, toKey: string): number {
  // Handle missing keys
  if (!fromKey || !toKey || fromKey === 'Unknown' || toKey === 'Unknown') {
    return 50 // Neutral score for unknown keys
  }
  
  const fromCode = keyToCamelot(fromKey)
  const toCode = keyToCamelot(toKey)
  
  if (!fromCode || !toCode) return 50
  
  // Same key
  if (fromCode === toCode) return 100
  
  const fromNumber = parseInt(fromCode.slice(0, -1))
  const fromLetter = fromCode.slice(-1)
  const toNumber = parseInt(toCode.slice(0, -1))
  const toLetter = toCode.slice(-1)
  
  // Relative major/minor (same number, different letter)
  if (fromNumber === toNumber && fromLetter !== toLetter) return 90
  
  // Same mode (A or B), calculate semitone distance
  if (fromLetter === toLetter) {
    const distance = Math.min(
      Math.abs(toNumber - fromNumber),
      12 - Math.abs(toNumber - fromNumber)
    )
    
    // ±1 semitone
    if (distance === 1) return 80
    // ±2 semitones
    if (distance === 2) return 70
    // ±3 semitones
    if (distance === 3) return 60
    // ±4 semitones
    if (distance === 4) return 45
    // ±5 semitones
    if (distance === 5) return 30
    // Tritone (±6 semitones) - avoid
    if (distance === 6) return 0
  }
  
  // Different mode and different root - use semitone distance with penalty
  const distance = Math.min(
    Math.abs(toNumber - fromNumber),
    12 - Math.abs(toNumber - fromNumber)
  )
  
  // Apply penalty for mode mismatch
  const baseScore = Math.max(0, 70 - (distance * 10))
  return Math.max(0, baseScore - 20) // -20 penalty for mode mismatch
}

/**
 * Get human-readable explanation of key compatibility
 * @param fromKey Source key
 * @param toKey Destination key
 * @returns Explanation string
 */
export function getKeyCompatibilityReason(fromKey: string, toKey: string): string {
  if (!fromKey || !toKey || fromKey === 'Unknown' || toKey === 'Unknown') {
    return 'Key data unavailable'
  }
  
  const fromCode = keyToCamelot(fromKey)
  const toCode = keyToCamelot(toKey)
  
  if (!fromCode || !toCode) return 'Invalid key'
  
  if (fromCode === toCode) {
    return `Perfect match (${fromCode})`
  }
  
  const fromNumber = parseInt(fromCode.slice(0, -1))
  const fromLetter = fromCode.slice(-1)
  const toNumber = parseInt(toCode.slice(0, -1))
  const toLetter = toCode.slice(-1)
  
  if (fromNumber === toNumber && fromLetter !== toLetter) {
    return `Relative ${fromLetter === 'B' ? 'minor' : 'major'} (${fromCode} → ${toCode})`
  }
  
  const distance = Math.min(
    Math.abs(toNumber - fromNumber),
    12 - Math.abs(toNumber - fromNumber)
  )
  
  if (fromLetter === toLetter) {
    if (distance === 1) return `±1 semitone (${fromCode} → ${toCode})`
    if (distance === 2) return `±2 semitones (${fromCode} → ${toCode})`
    if (distance === 6) return `Tritone - avoid (${fromCode} → ${toCode})`
    return `${distance} semitones (${fromCode} → ${toCode})`
  }
  
  return `Different mode, ${distance} semitones (${fromCode} → ${toCode})`
}
