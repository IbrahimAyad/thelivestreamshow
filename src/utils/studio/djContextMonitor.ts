/**
 * DJ Context Monitor
 * Monitors DJ session in real-time and provides context to AI
 */

import { TrackAnalysis } from './trackAnalysis';
import { Track } from './aiContextAnalyzer';

export interface DJSessionState {
  // Current playback
  deckA: DeckState | null;
  deckB: DeckState | null;
  activeDeck: 'A' | 'B';

  // Mixer state
  crossfader: number; // 0-1
  masterVolume: number; // 0-1

  // Session progress
  sessionStartTime: number;
  sessionDuration: number; // seconds
  tracksPlayed: number;

  // Energy tracking
  currentEnergy: number; // 0-1
  targetEnergy: number; // 0-1
  energyTrend: 'rising' | 'falling' | 'stable';

  // Crowd response (simulated or from feedback)
  crowdEnergy: number; // 0-1

  // Recent history
  recentTracks: Track[];
  recentActions: UserAction[];
}

export interface DeckState {
  track: Track | null;
  isPlaying: boolean;
  position: number; // seconds
  timeRemaining: number; // seconds
  volume: number; // 0-1
  tempo: number; // -1 to 1 (pitch adjustment)
  effectsActive: string[];
  loopActive: boolean;
  loopBars: number;
}

export interface UserAction {
  timestamp: number;
  action: 'play' | 'pause' | 'skip' | 'mix' | 'effect' | 'eq' | 'filter' | 'loop' | 'cue';
  deck: 'A' | 'B';
  parameters?: any;
}

export class DJContextMonitor {
  private state: DJSessionState;
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, (state: DJSessionState) => void> = new Map();

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Create initial session state
   */
  private createInitialState(): DJSessionState {
    return {
      deckA: null,
      deckB: null,
      activeDeck: 'A',
      crossfader: 0,
      masterVolume: 0.8,
      sessionStartTime: Date.now(),
      sessionDuration: 0,
      tracksPlayed: 0,
      currentEnergy: 0.5,
      targetEnergy: 0.6,
      energyTrend: 'stable',
      crowdEnergy: 0.5,
      recentTracks: [],
      recentActions: [],
    };
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.updateInterval) return;

    console.log('🎧 Starting DJ context monitoring...');

    this.updateInterval = setInterval(() => {
      this.updateSessionDuration();
      this.updateEnergyTrend();
      this.notifyListeners();
    }, 1000); // Update every second
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update deck state
   */
  updateDeck(deck: 'A' | 'B', state: Partial<DeckState>): void {
    const deckKey = deck === 'A' ? 'deckA' : 'deckB';

    if (!this.state[deckKey]) {
      this.state[deckKey] = {
        track: null,
        isPlaying: false,
        position: 0,
        timeRemaining: 0,
        volume: 0.8,
        tempo: 0,
        effectsActive: [],
        loopActive: false,
        loopBars: 4,
      };
    }

    this.state[deckKey] = {
      ...this.state[deckKey]!,
      ...state,
    };

    // Update active deck based on crossfader
    if (deck === 'A' && this.state.crossfader < 0.3) {
      this.state.activeDeck = 'A';
    } else if (deck === 'B' && this.state.crossfader > 0.7) {
      this.state.activeDeck = 'B';
    }

    this.notifyListeners();
  }

  /**
   * Load track onto deck
   */
  loadTrack(deck: 'A' | 'B', track: Track): void {
    const deckKey = deck === 'A' ? 'deckA' : 'deckB';

    this.updateDeck(deck, {
      track,
      position: 0,
      timeRemaining: track.duration,
    });

    // Add to recent tracks
    this.state.recentTracks.unshift(track);
    if (this.state.recentTracks.length > 20) {
      this.state.recentTracks.pop();
    }

    this.state.tracksPlayed++;

    // Update energy based on track
    this.state.currentEnergy = track.energy;

    this.notifyListeners();
  }

  /**
   * Update playback position
   */
  updatePosition(deck: 'A' | 'B', position: number, duration: number): void {
    this.updateDeck(deck, {
      position,
      timeRemaining: duration - position,
    });
  }

  /**
   * Update mixer controls
   */
  updateMixer(params: {
    crossfader?: number;
    masterVolume?: number;
  }): void {
    if (params.crossfader !== undefined) {
      this.state.crossfader = params.crossfader;

      // Update active deck based on crossfader
      if (params.crossfader < 0.3) {
        this.state.activeDeck = 'A';
      } else if (params.crossfader > 0.7) {
        this.state.activeDeck = 'B';
      }
    }

    if (params.masterVolume !== undefined) {
      this.state.masterVolume = params.masterVolume;
    }

    this.notifyListeners();
  }

  /**
   * Record user action
   */
  recordAction(action: Omit<UserAction, 'timestamp'>): void {
    const fullAction: UserAction = {
      ...action,
      timestamp: Date.now(),
    };

    this.state.recentActions.unshift(fullAction);

    // Keep last 50 actions
    if (this.state.recentActions.length > 50) {
      this.state.recentActions.pop();
    }

    this.notifyListeners();
  }

  /**
   * Update crowd energy (from external feedback or simulation)
   */
  updateCrowdEnergy(energy: number): void {
    this.state.crowdEnergy = Math.max(0, Math.min(1, energy));
    this.notifyListeners();
  }

  /**
   * Set target energy level
   */
  setTargetEnergy(energy: number): void {
    this.state.targetEnergy = Math.max(0, Math.min(1, energy));
    this.notifyListeners();
  }

  /**
   * Update session duration
   */
  private updateSessionDuration(): void {
    this.state.sessionDuration = (Date.now() - this.state.sessionStartTime) / 1000;
  }

  /**
   * Analyze and update energy trend
   */
  private updateEnergyTrend(): void {
    // Analyze last 3 tracks
    const lastThreeTracks = this.state.recentTracks.slice(0, 3);

    if (lastThreeTracks.length < 2) {
      this.state.energyTrend = 'stable';
      return;
    }

    const avgChange =
      (lastThreeTracks[0].energy - lastThreeTracks[lastThreeTracks.length - 1].energy) /
      (lastThreeTracks.length - 1);

    if (avgChange > 0.05) {
      this.state.energyTrend = 'rising';
    } else if (avgChange < -0.05) {
      this.state.energyTrend = 'falling';
    } else {
      this.state.energyTrend = 'stable';
    }
  }

  /**
   * Get current session state
   */
  getState(): DJSessionState {
    return { ...this.state };
  }

  /**
   * Get context for AI decision making
   */
  getAIContext(): {
    currentTrack: Track | null;
    nextTrack: Track | null;
    playbackPosition: number;
    timeRemaining: number;
    sessionDuration: number;
    crowdEnergy: number;
    targetEnergy: number;
    energyTrend: 'rising' | 'falling' | 'stable';
    recentTracks: Track[];
  } {
    const activeDeckState = this.state.activeDeck === 'A' ? this.state.deckA : this.state.deckB;
    const nextDeckState = this.state.activeDeck === 'A' ? this.state.deckB : this.state.deckA;

    return {
      currentTrack: activeDeckState?.track || null,
      nextTrack: nextDeckState?.track || null,
      playbackPosition: activeDeckState?.position || 0,
      timeRemaining: activeDeckState?.timeRemaining || 0,
      sessionDuration: this.state.sessionDuration,
      crowdEnergy: this.state.crowdEnergy,
      targetEnergy: this.state.targetEnergy,
      energyTrend: this.state.energyTrend,
      recentTracks: this.state.recentTracks,
    };
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    sessionDuration: string;
    tracksPlayed: number;
    avgEnergy: number;
    mixQuality: number; // 0-1
    actionsPerMinute: number;
  } {
    const durationMinutes = this.state.sessionDuration / 60;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = Math.floor(durationMinutes % 60);
    const sessionDuration = `${hours}h ${minutes}m`;

    const avgEnergy =
      this.state.recentTracks.reduce((sum, track) => sum + track.energy, 0) /
        Math.max(this.state.recentTracks.length, 1);

    // Calculate mix quality based on energy flow consistency
    let mixQuality = 0.7; // Default
    if (this.state.recentTracks.length >= 2) {
      const energyChanges: number[] = [];
      for (let i = 1; i < this.state.recentTracks.length; i++) {
        const change = Math.abs(
          this.state.recentTracks[i - 1].energy - this.state.recentTracks[i].energy
        );
        energyChanges.push(change);
      }
      const avgChange = energyChanges.reduce((sum, val) => sum + val, 0) / energyChanges.length;
      mixQuality = Math.max(0, Math.min(1, 1 - avgChange));
    }

    const actionsPerMinute = (this.state.recentActions.length / durationMinutes) || 0;

    return {
      sessionDuration,
      tracksPlayed: this.state.tracksPlayed,
      avgEnergy,
      mixQuality,
      actionsPerMinute,
    };
  }

  /**
   * Register state change listener
   */
  onStateChange(id: string, callback: (state: DJSessionState) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Unregister state change listener
   */
  offStateChange(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.getState()));
  }

  /**
   * Reset session
   */
  reset(): void {
    this.state = this.createInitialState();
    this.notifyListeners();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

/**
 * Create DJ context monitor
 */
export function createDJContextMonitor(): DJContextMonitor {
  return new DJContextMonitor();
}
