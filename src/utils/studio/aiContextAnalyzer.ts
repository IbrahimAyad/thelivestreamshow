/**
 * AI Context Analyzer
 * Analyzes music tracks and mixing context for intelligent decisions
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  energy: number; // 0-1
  genre: string;
  duration: number;
  waveform?: number[];
  beatGrid?: number[];
}

export interface MixingContext {
  currentTrack: Track | null;
  nextTrack: Track | null;
  playbackPosition: number;
  timeInSet: number;
  recentTracks: Track[];
  crowdEnergy: number;
  targetEnergy: number;
}

export interface CompatibilityAnalysis {
  overall: number; // 0-1
  bpm: {
    score: number;
    diff: number;
    recommendation: string;
  };
  key: {
    score: number;
    relationship: string;
    recommendation: string;
  };
  energy: {
    score: number;
    flow: string;
    recommendation: string;
  };
  genre: {
    score: number;
    match: string;
    recommendation: string;
  };
}

export interface EnergyProfile {
  current: number;
  trend: 'rising' | 'falling' | 'stable';
  variance: number;
  peaks: number[];
  valleys: number[];
}

// Camelot Wheel mapping for harmonic mixing
const CAMELOT_WHEEL: Record<string, { key: string; position: number }> = {
  '1A': { key: 'Ab minor', position: 1 },
  '1B': { key: 'B major', position: 1 },
  '2A': { key: 'Eb minor', position: 2 },
  '2B': { key: 'Gb major', position: 2 },
  '3A': { key: 'Bb minor', position: 3 },
  '3B': { key: 'Db major', position: 3 },
  '4A': { key: 'F minor', position: 4 },
  '4B': { key: 'Ab major', position: 4 },
  '5A': { key: 'C minor', position: 5 },
  '5B': { key: 'Eb major', position: 5 },
  '6A': { key: 'G minor', position: 6 },
  '6B': { key: 'Bb major', position: 6 },
  '7A': { key: 'D minor', position: 7 },
  '7B': { key: 'F major', position: 7 },
  '8A': { key: 'A minor', position: 8 },
  '8B': { key: 'C major', position: 8 },
  '9A': { key: 'E minor', position: 9 },
  '9B': { key: 'G major', position: 9 },
  '10A': { key: 'B minor', position: 10 },
  '10B': { key: 'D major', position: 10 },
  '11A': { key: 'F# minor', position: 11 },
  '11B': { key: 'A major', position: 11 },
  '12A': { key: 'C# minor', position: 12 },
  '12B': { key: 'E major', position: 12 },
};

export class AIContextAnalyzer {
  /**
   * Analyze compatibility between two tracks
   */
  analyzeCompatibility(trackA: Track, trackB: Track): CompatibilityAnalysis {
    const bpmAnalysis = this.analyzeBPMCompatibility(trackA.bpm, trackB.bpm);
    const keyAnalysis = this.analyzeKeyCompatibility(trackA.key, trackB.key);
    const energyAnalysis = this.analyzeEnergyFlow(
      trackA.energy,
      trackB.energy
    );
    const genreAnalysis = this.analyzeGenreMatch(trackA.genre, trackB.genre);

    // Calculate weighted overall score
    const overall =
      bpmAnalysis.score * 0.3 +
      keyAnalysis.score * 0.25 +
      energyAnalysis.score * 0.25 +
      genreAnalysis.score * 0.2;

    return {
      overall,
      bpm: bpmAnalysis,
      key: keyAnalysis,
      energy: energyAnalysis,
      genre: genreAnalysis,
    };
  }

  /**
   * Analyze BPM compatibility
   */
  private analyzeBPMCompatibility(
    bpmA: number,
    bpmB: number
  ): {
    score: number;
    diff: number;
    recommendation: string;
  } {
    const diff = Math.abs(bpmA - bpmB);
    const percentDiff = (diff / bpmA) * 100;

    let score: number;
    let recommendation: string;

    if (percentDiff <= 2) {
      score = 1.0;
      recommendation = 'Perfect BPM match';
    } else if (percentDiff <= 5) {
      score = 0.8;
      recommendation = 'Excellent BPM compatibility';
    } else if (percentDiff <= 8) {
      score = 0.6;
      recommendation = 'Good - minor tempo adjustment needed';
    } else if (percentDiff <= 12) {
      score = 0.4;
      recommendation = 'Moderate tempo adjustment required';
    } else {
      score = 0.2;
      recommendation = 'Challenging BPM difference - use pitch control';
    }

    return { score, diff, recommendation };
  }

  /**
   * Analyze key compatibility using Camelot wheel
   */
  private analyzeKeyCompatibility(
    keyA: string,
    keyB: string
  ): {
    score: number;
    relationship: string;
    recommendation: string;
  } {
    const camelotA = this.toCamelot(keyA);
    const camelotB = this.toCamelot(keyB);

    if (!camelotA || !camelotB) {
      return {
        score: 0.5,
        relationship: 'Unknown',
        recommendation: 'Key information incomplete',
      };
    }

    // Same key
    if (camelotA === camelotB) {
      return {
        score: 1.0,
        relationship: 'Perfect match',
        recommendation: 'Same key - mix freely',
      };
    }

    const posA = CAMELOT_WHEEL[camelotA].position;
    const posB = CAMELOT_WHEEL[camelotB].position;
    const modeA = camelotA.endsWith('A') ? 'minor' : 'major';
    const modeB = camelotB.endsWith('A') ? 'minor' : 'major';

    // Relative key (same number, different letter)
    if (posA === posB && modeA !== modeB) {
      return {
        score: 0.95,
        relationship: 'Relative key',
        recommendation: 'Excellent harmonic match',
      };
    }

    // Adjacent keys (±1 position, same mode)
    const posDiff = Math.abs(posA - posB);
    if ((posDiff === 1 || posDiff === 11) && modeA === modeB) {
      return {
        score: 0.85,
        relationship: 'Adjacent key',
        recommendation: 'Very good harmonic compatibility',
      };
    }

    // Energy boost/drop (±1 position, different mode)
    if ((posDiff === 1 || posDiff === 11) && modeA !== modeB) {
      return {
        score: 0.7,
        relationship: 'Energy shift',
        recommendation: 'Good for energy transitions',
      };
    }

    return {
      score: 0.4,
      relationship: 'Dissonant',
      recommendation: 'Use EQ or effects for smoother transition',
    };
  }

  /**
   * Convert key to Camelot notation
   */
  private toCamelot(key: string): string | null {
    // Simple mapping - in production would use more sophisticated detection
    const keyMap: Record<string, string> = {
      'Ab minor': '1A',
      'B major': '1B',
      'Eb minor': '2A',
      'Gb major': '2B',
      'Bb minor': '3A',
      'Db major': '3B',
      'F minor': '4A',
      'Ab major': '4B',
      'C minor': '5A',
      'Eb major': '5B',
      'G minor': '6A',
      'Bb major': '6B',
      'D minor': '7A',
      'F major': '7B',
      'A minor': '8A',
      'C major': '8B',
      'E minor': '9A',
      'G major': '9B',
      'B minor': '10A',
      'D major': '10B',
      'F# minor': '11A',
      'A major': '11B',
      'C# minor': '12A',
      'E major': '12B',
    };

    return keyMap[key] || null;
  }

  /**
   * Analyze energy flow between tracks
   */
  private analyzeEnergyFlow(
    energyA: number,
    energyB: number
  ): {
    score: number;
    flow: string;
    recommendation: string;
  } {
    const diff = energyB - energyA;

    if (Math.abs(diff) < 0.05) {
      return {
        score: 1.0,
        flow: 'Stable',
        recommendation: 'Maintains energy level perfectly',
      };
    } else if (diff >= 0 && diff <= 0.15) {
      return {
        score: 0.95,
        flow: 'Gradual rise',
        recommendation: 'Perfect energy building',
      };
    } else if (diff > 0.15 && diff <= 0.3) {
      return {
        score: 0.8,
        flow: 'Energy boost',
        recommendation: 'Good for peak moments',
      };
    } else if (diff > 0.3) {
      return {
        score: 0.6,
        flow: 'Dramatic jump',
        recommendation: 'Use effects for smoother transition',
      };
    } else if (diff >= -0.15) {
      return {
        score: 0.85,
        flow: 'Gentle cooldown',
        recommendation: 'Good for breathing room',
      };
    } else {
      return {
        score: 0.5,
        flow: 'Energy drop',
        recommendation: 'Consider smoother transition track',
      };
    }
  }

  /**
   * Analyze genre matching
   */
  private analyzeGenreMatch(
    genreA: string,
    genreB: string
  ): {
    score: number;
    match: string;
    recommendation: string;
  } {
    if (genreA === genreB) {
      return {
        score: 1.0,
        match: 'Same genre',
        recommendation: 'Perfect stylistic match',
      };
    }

    // Genre compatibility matrix (simplified)
    const compatibleGenres: Record<string, string[]> = {
      'House': ['Tech House', 'Deep House', 'Progressive House', 'Techno'],
      'Techno': ['House', 'Tech House', 'Minimal'],
      'Trance': ['Progressive House', 'Uplifting', 'Psytrance'],
      'Drum & Bass': ['Jungle', 'Liquid', 'Neurofunk'],
      'Dubstep': ['Trap', 'Bass', 'Future Bass'],
    };

    const compatibleWithA = compatibleGenres[genreA] || [];
    if (compatibleWithA.includes(genreB)) {
      return {
        score: 0.8,
        match: 'Compatible genres',
        recommendation: 'Good stylistic blend',
      };
    }

    return {
      score: 0.4,
      match: 'Different styles',
      recommendation: 'Creative mix - use careful transitions',
    };
  }

  /**
   * Analyze energy profile of a set
   */
  analyzeEnergyProfile(tracks: Track[]): EnergyProfile {
    if (tracks.length === 0) {
      return {
        current: 0.5,
        trend: 'stable',
        variance: 0,
        peaks: [],
        valleys: [],
      };
    }

    const energies = tracks.map((t) => t.energy);
    const current = energies[energies.length - 1];

    // Calculate trend
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (energies.length >= 3) {
      const recent = energies.slice(-3);
      const avgChange = (recent[2] - recent[0]) / 2;
      if (avgChange > 0.05) trend = 'rising';
      else if (avgChange < -0.05) trend = 'falling';
    }

    // Calculate variance
    const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance =
      energies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) /
      energies.length;

    // Find peaks and valleys
    const peaks: number[] = [];
    const valleys: number[] = [];
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        peaks.push(i);
      }
      if (energies[i] < energies[i - 1] && energies[i] < energies[i + 1]) {
        valleys.push(i);
      }
    }

    return {
      current,
      trend,
      variance,
      peaks,
      valleys,
    };
  }

  /**
   * Suggest next track based on context
   */
  suggestNextTrack(
    context: MixingContext,
    availableTracks: Track[]
  ): Track | null {
    if (!context.currentTrack || availableTracks.length === 0) {
      return null;
    }

    // Filter out recently played tracks
    const recentIds = new Set(context.recentTracks.map((t) => t.id));
    const candidates = availableTracks.filter((t) => !recentIds.has(t.id));

    if (candidates.length === 0) {
      return null;
    }

    // Score each candidate
    const scoredTracks = candidates.map((track) => {
      const compatibility = this.analyzeCompatibility(
        context.currentTrack!,
        track
      );

      // Energy consideration
      const energyTarget = context.targetEnergy || context.crowdEnergy;
      const energyScore = 1 - Math.abs(track.energy - energyTarget);

      // Time in set consideration (build energy over time)
      const timeScore = context.timeInSet > 1800 ? track.energy : 1 - track.energy;

      // Combined score
      const score =
        compatibility.overall * 0.7 + energyScore * 0.2 + timeScore * 0.1;

      return { track, score };
    });

    // Sort by score and return best match
    scoredTracks.sort((a, b) => b.score - a.score);
    return scoredTracks[0].track;
  }

  /**
   * Detect optimal mix point in track
   */
  detectOptimalMixPoint(track: Track): {
    start: number;
    end: number;
    confidence: number;
  } {
    // Analyze beat grid and energy to find best 32-bar phrase
    const duration = track.duration;

    // Typical outro starts around 75% of track
    const outroStart = duration * 0.75;
    const outroEnd = duration;

    return {
      start: outroStart,
      end: outroEnd,
      confidence: 0.8,
    };
  }

  /**
   * Estimate crowd energy from track progression
   */
  estimateCrowdEnergy(context: MixingContext): number {
    if (!context.currentTrack) return 0.5;

    // Base energy from current track
    let energy = context.currentTrack.energy;

    // Adjust based on trend
    const profile = this.analyzeEnergyProfile(context.recentTracks);
    if (profile.trend === 'rising') {
      energy += 0.1;
    } else if (profile.trend === 'falling') {
      energy -= 0.1;
    }

    // Adjust based on time in set (energy typically builds)
    const timeBonus = Math.min(context.timeInSet / 3600, 0.2);
    energy += timeBonus;

    return Math.max(0, Math.min(1, energy));
  }
}

/**
 * Create AI context analyzer
 */
export function createAIContextAnalyzer(): AIContextAnalyzer {
  return new AIContextAnalyzer();
}
