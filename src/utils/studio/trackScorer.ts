// Track Scoring Algorithm - Composite Auto-DJ Intelligence
// Combines harmonic, BPM, energy, and recency scoring

import { getKeyCompatibilityScore, getKeyCompatibilityReason } from './harmonicMixing'
import { getBPMCompatibilityScoreEnhanced, getBPMCompatibilityReason } from './bpmMatching'
import { getEnergyFlowScore, getEnergyFlowReason, type EnergyStyle } from './energyFlow'
import type { MusicTrack } from '@/types/database'

export interface AutoDJSettings {
  enabled: boolean
  prefer_harmonic: boolean
  strict_bpm: boolean
  energy_style: EnergyStyle
  recency_limit: number
}

export interface PlayHistoryEntry {
  track_id: string
  played_at: string
  auto_selected: boolean
}

export interface ScoredTrack {
  track: MusicTrack
  totalScore: number
  harmonicScore: number
  bpmScore: number
  energyScore: number
  recencyScore: number
  reason: string
  harmonicReason: string
  bpmReason: string
  energyReason: string
}

/**
 * Calculate recency penalty score
 * @param trackId Track to check
 * @param playHistory Recent play history
 * @param recencyLimit Number of recent tracks to consider
 * @returns Recency score (0-100)
 */
function getRecencyScore(
  trackId: string,
  playHistory: PlayHistoryEntry[],
  recencyLimit: number
): number {
  // Find track in history
  const historyIndex = playHistory.findIndex(entry => entry.track_id === trackId)
  
  // Never played: perfect score
  if (historyIndex === -1) return 100
  
  // Recently played: apply penalty based on position
  const position = historyIndex + 1 // 1-indexed
  
  // Currently playing or just played (position 1-2): very low score
  if (position <= 2) return 0
  
  // Played 3-4 tracks ago: low score
  if (position <= 4) return 10
  
  // Played 5-9 tracks ago: moderate score
  if (position <= 9) return 50
  
  // Played 10+ tracks ago: good score
  if (position >= recencyLimit) return 80
  
  // Linear interpolation between 9 and recencyLimit
  const range = recencyLimit - 9
  const positionInRange = position - 9
  return 50 + ((positionInRange / range) * 30)
}

/**
 * Score a single candidate track against current track
 * @param currentTrack Currently playing track
 * @param candidateTrack Candidate for next track
 * @param playHistory Recent play history
 * @param settings Auto-DJ settings
 * @returns Scored track with breakdown
 */
export function scoreTrack(
  currentTrack: MusicTrack,
  candidateTrack: MusicTrack,
  playHistory: PlayHistoryEntry[],
  settings: AutoDJSettings
): ScoredTrack {
  // Don't score the same track
  if (currentTrack.id === candidateTrack.id) {
    return {
      track: candidateTrack,
      totalScore: 0,
      harmonicScore: 0,
      bpmScore: 0,
      energyScore: 0,
      recencyScore: 0,
      reason: 'Currently playing',
      harmonicReason: '',
      bpmReason: '',
      energyReason: ''
    }
  }
  
  // Calculate individual scores
  const harmonicScore = getKeyCompatibilityScore(
    currentTrack.musical_key || 'Unknown',
    candidateTrack.musical_key || 'Unknown'
  )
  
  let bpmScore = getBPMCompatibilityScoreEnhanced(
    currentTrack.bpm || 0,
    candidateTrack.bpm || 0
  )
  
  // Strict BPM mode: only allow ±3 BPM
  if (settings.strict_bpm) {
    const bpmDiff = Math.abs((candidateTrack.bpm || 0) - (currentTrack.bpm || 0))
    if (bpmDiff > 3) {
      bpmScore = Math.min(bpmScore, 30) // Heavy penalty
    }
  }
  
  const energyScore = getEnergyFlowScore(
    currentTrack.energy_level || 5,
    candidateTrack.energy_level || 5,
    settings.energy_style
  )
  
  const recencyScore = getRecencyScore(
    candidateTrack.id,
    playHistory,
    settings.recency_limit
  )
  
  // Calculate weighted total score
  // Weights: Harmonic 30%, BPM 30%, Energy 25%, Recency 15%
  let harmonicWeight = 0.30
  let bpmWeight = 0.30
  const energyWeight = 0.25
  const recencyWeight = 0.15
  
  // Adjust weights if harmonic mixing is not preferred
  if (!settings.prefer_harmonic) {
    harmonicWeight = 0.15
    bpmWeight = 0.45 // Give more weight to BPM instead
  }
  
  const totalScore = 
    (harmonicScore * harmonicWeight) +
    (bpmScore * bpmWeight) +
    (energyScore * energyWeight) +
    (recencyScore * recencyWeight)
  
  // Generate human-readable reasons
  const harmonicReason = getKeyCompatibilityReason(
    currentTrack.musical_key || 'Unknown',
    candidateTrack.musical_key || 'Unknown'
  )
  
  const bpmReason = getBPMCompatibilityReason(
    currentTrack.bpm || 0,
    candidateTrack.bpm || 0
  )
  
  const energyReason = getEnergyFlowReason(
    currentTrack.energy_level || 5,
    candidateTrack.energy_level || 5,
    settings.energy_style
  )
  
  // Composite reason
  const reason = `${harmonicReason} | ${bpmReason} | ${energyReason}`
  
  return {
    track: candidateTrack,
    totalScore: Math.round(totalScore),
    harmonicScore: Math.round(harmonicScore),
    bpmScore: Math.round(bpmScore),
    energyScore: Math.round(energyScore),
    recencyScore: Math.round(recencyScore),
    reason,
    harmonicReason,
    bpmReason,
    energyReason
  }
}

/**
 * Score all candidate tracks and return sorted list
 * @param currentTrack Currently playing track
 * @param allTracks All available tracks
 * @param playHistory Recent play history
 * @param settings Auto-DJ settings
 * @returns Sorted array of scored tracks (highest first)
 */
export function scoreAllTracks(
  currentTrack: MusicTrack,
  allTracks: MusicTrack[],
  playHistory: PlayHistoryEntry[],
  settings: AutoDJSettings
): ScoredTrack[] {
  // Filter tracks with complete analysis data
  const analyzedTracks = allTracks.filter(track => 
    track.id !== currentTrack.id &&
    track.analysis_status === 'complete' &&
    track.bpm &&
    track.musical_key &&
    track.energy_level
  )
  
  // Score each track
  const scoredTracks = analyzedTracks.map(track => 
    scoreTrack(currentTrack, track, playHistory, settings)
  )
  
  // Sort by total score (descending)
  return scoredTracks.sort((a, b) => b.totalScore - a.totalScore)
}

/**
 * Find best track matching a specific energy level
 * @param currentTrack Currently playing track
 * @param allTracks All available tracks
 * @param playHistory Recent play history
 * @param settings Auto-DJ settings
 * @param targetEnergy Desired energy level (±1)
 * @returns Best matching track or null
 */
export function findTrackByEnergy(
  currentTrack: MusicTrack,
  allTracks: MusicTrack[],
  playHistory: PlayHistoryEntry[],
  settings: AutoDJSettings,
  targetEnergy: number
): ScoredTrack | null {
  // Score all tracks
  const scored = scoreAllTracks(currentTrack, allTracks, playHistory, settings)
  
  // Filter to target energy range (±1)
  const energyFiltered = scored.filter(st => {
    const energy = st.track.energy_level || 5
    return energy >= targetEnergy - 1 && energy <= targetEnergy + 1
  })
  
  // Return highest scoring track in energy range
  return energyFiltered.length > 0 ? energyFiltered[0] : null
}
