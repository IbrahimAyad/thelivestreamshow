/**
 * Track Scorer - Scores tracks for DJ mixing compatibility
 */

export interface TrackScore {
  overall: number; // 0-100
  energyMatch: number;
  keyCompatibility: number;
  bpmCompatibility: number;
  genreMatch: number;
}

export interface Track {
  id: string;
  bpm: number;
  key?: string;
  energy?: number;
  genre?: string;
}

export function scoreTrackCompatibility(
  currentTrack: Track,
  nextTrack: Track
): TrackScore {
  const bpmDiff = Math.abs(currentTrack.bpm - nextTrack.bpm);
  const bpmCompatibility = Math.max(0, 100 - (bpmDiff / currentTrack.bpm) * 100);

  const energyMatch = currentTrack.energy && nextTrack.energy
    ? Math.max(0, 100 - Math.abs(currentTrack.energy - nextTrack.energy) * 100)
    : 50;

  // Simple key compatibility (would need proper music theory implementation)
  const keyCompatibility = currentTrack.key && nextTrack.key
    ? currentTrack.key === nextTrack.key ? 100 : 50
    : 50;

  const genreMatch = currentTrack.genre && nextTrack.genre
    ? currentTrack.genre === nextTrack.genre ? 100 : 30
    : 50;

  const overall = (
    bpmCompatibility * 0.4 +
    energyMatch * 0.3 +
    keyCompatibility * 0.2 +
    genreMatch * 0.1
  );

  return {
    overall,
    energyMatch,
    keyCompatibility,
    bpmCompatibility,
    genreMatch,
  };
}

export function findBestNextTrack(
  currentTrack: Track,
  availableTracks: Track[]
): { track: Track; score: TrackScore } | null {
  if (availableTracks.length === 0) return null;

  let bestTrack = availableTracks[0];
  let bestScore = scoreTrackCompatibility(currentTrack, bestTrack);

  for (const track of availableTracks.slice(1)) {
    const score = scoreTrackCompatibility(currentTrack, track);
    if (score.overall > bestScore.overall) {
      bestTrack = track;
      bestScore = score;
    }
  }

  return { track: bestTrack, score: bestScore };
}

export interface ScoredTrack {
  track: Track;
  score: TrackScore;
}

export default { scoreTrackCompatibility, findBestNextTrack, ScoredTrack };

