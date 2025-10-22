/**
 * AI Decision Engine
 * Makes intelligent mixing decisions based on learned patterns
 */

export type MixingDecision =
  | 'start_mix'
  | 'apply_effect'
  | 'adjust_eq'
  | 'set_loop'
  | 'trigger_hotcue'
  | 'change_tempo'
  | 'crossfade'
  | 'wait';

export type MixingStyle = 'smooth' | 'energetic' | 'technical' | 'minimal';

export interface TrackContext {
  bpm: number;
  key: string;
  energy: number; // 0-1
  genre: string;
  duration: number;
  currentPosition: number;
  timeRemaining: number;
}

export interface DecisionContext {
  currentTrack: TrackContext;
  nextTrack: TrackContext | null;
  mixProgress: number; // 0-1
  crowdEnergy: number; // 0-1 (simulated or from feedback)
  setEnergy: number; // 0-1 (overall set energy trend)
  timeInSet: number; // seconds
}

export interface DecisionOutput {
  decision: MixingDecision;
  confidence: number; // 0-1
  reasoning: string;
  parameters?: {
    timing?: number; // seconds
    intensity?: number; // 0-1
    effect?: string;
    value?: number;
  };
}

export interface DecisionWeights {
  bpmCompatibility: number;
  keyCompatibility: number;
  energyFlow: number;
  genreMatching: number;
  timing: number;
  crowdResponse: number;
}

export class AIDecisionEngine {
  private weights: DecisionWeights = {
    bpmCompatibility: 0.25,
    keyCompatibility: 0.20,
    energyFlow: 0.20,
    genreMatching: 0.15,
    timing: 0.10,
    crowdResponse: 0.10,
  };

  private mixingStyle: MixingStyle = 'smooth';
  private aggressiveness: number = 0.5; // 0-1
  private creativityLevel: number = 0.5; // 0-1

  /**
   * Main decision-making method
   */
  makeDecision(context: DecisionContext): DecisionOutput {
    // Analyze current situation
    const situation = this.analyzeSituation(context);

    // Determine best action based on situation
    if (situation.needsNewTrack) {
      return this.decideMixTiming(context);
    }

    if (situation.needsEnergyBoost) {
      return this.decideEnergyAdjustment(context);
    }

    if (situation.needsEffects) {
      return this.decideEffectApplication(context);
    }

    if (situation.needsEQAdjustment) {
      return this.decideEQAdjustment(context);
    }

    return {
      decision: 'wait',
      confidence: 0.8,
      reasoning: 'Current mix is stable, monitoring situation',
    };
  }

  /**
   * Analyze current mixing situation
   */
  private analyzeSituation(context: DecisionContext): {
    needsNewTrack: boolean;
    needsEnergyBoost: boolean;
    needsEffects: boolean;
    needsEQAdjustment: boolean;
  } {
    const timeRemaining = context.currentTrack.timeRemaining;
    const energyDelta = context.crowdEnergy - context.setEnergy;

    return {
      needsNewTrack: timeRemaining < 60 && context.nextTrack !== null,
      needsEnergyBoost: energyDelta < -0.2,
      needsEffects: Math.random() < this.creativityLevel * 0.3,
      needsEQAdjustment: Math.abs(energyDelta) > 0.15,
    };
  }

  /**
   * Decide when to start mixing in next track
   */
  private decideMixTiming(context: DecisionContext): DecisionOutput {
    if (!context.nextTrack) {
      return {
        decision: 'wait',
        confidence: 1.0,
        reasoning: 'No next track available',
      };
    }

    const compatibility = this.calculateTrackCompatibility(
      context.currentTrack,
      context.nextTrack
    );

    // Calculate ideal mix point
    const idealMixPoint = this.calculateIdealMixPoint(context, compatibility);

    if (context.currentTrack.timeRemaining <= idealMixPoint) {
      return {
        decision: 'start_mix',
        confidence: compatibility.overall,
        reasoning: `Starting mix: ${compatibility.overall.toFixed(2)} compatibility`,
        parameters: {
          timing: idealMixPoint,
          intensity: this.aggressiveness,
        },
      };
    }

    return {
      decision: 'wait',
      confidence: 0.9,
      reasoning: `Waiting for optimal mix point (${idealMixPoint}s remaining)`,
    };
  }

  /**
   * Calculate track compatibility score
   */
  private calculateTrackCompatibility(
    trackA: TrackContext,
    trackB: TrackContext
  ): {
    bpm: number;
    key: number;
    energy: number;
    genre: number;
    overall: number;
  } {
    // BPM compatibility (within 5% is good)
    const bpmDiff = Math.abs(trackA.bpm - trackB.bpm);
    const bpmScore = Math.max(0, 1 - bpmDiff / (trackA.bpm * 0.05));

    // Key compatibility (Camelot wheel)
    const keyScore = this.calculateKeyCompatibility(trackA.key, trackB.key);

    // Energy flow (should increase gradually or match)
    const energyDiff = trackB.energy - trackA.energy;
    const energyScore =
      energyDiff >= -0.1 && energyDiff <= 0.3
        ? 1.0
        : Math.max(0, 1 - Math.abs(energyDiff) / 0.5);

    // Genre matching
    const genreScore = trackA.genre === trackB.genre ? 1.0 : 0.5;

    // Calculate weighted overall score
    const overall =
      bpmScore * this.weights.bpmCompatibility +
      keyScore * this.weights.keyCompatibility +
      energyScore * this.weights.energyFlow +
      genreScore * this.weights.genreMatching;

    return {
      bpm: bpmScore,
      key: keyScore,
      energy: energyScore,
      genre: genreScore,
      overall,
    };
  }

  /**
   * Calculate key compatibility using Camelot wheel
   */
  private calculateKeyCompatibility(keyA: string, keyB: string): number {
    // Simplified: exact match = 1.0, compatible = 0.8, semi-compatible = 0.5
    if (keyA === keyB) return 1.0;

    // Relative/parallel keys
    if (
      (keyA.includes('m') && keyB.includes('M')) ||
      (keyA.includes('M') && keyB.includes('m'))
    ) {
      if (keyA.replace(/[mM]/, '') === keyB.replace(/[mM]/, '')) {
        return 0.8;
      }
    }

    // Adjacent keys on Camelot wheel (simplified)
    return 0.5;
  }

  /**
   * Calculate ideal mix point based on style
   */
  private calculateIdealMixPoint(
    context: DecisionContext,
    compatibility: { overall: number }
  ): number {
    const baseTime = this.mixingStyle === 'smooth' ? 32 : 16;

    // Adjust based on compatibility
    const compatibilityAdjustment = (1 - compatibility.overall) * 16;

    // Adjust based on energy needs
    const energyAdjustment =
      context.crowdEnergy < context.setEnergy ? -8 : 0;

    return Math.max(16, baseTime + compatibilityAdjustment + energyAdjustment);
  }

  /**
   * Decide energy adjustment action
   */
  private decideEnergyAdjustment(context: DecisionContext): DecisionOutput {
    const energyDeficit = context.setEnergy - context.crowdEnergy;

    if (energyDeficit > 0.2) {
      // Need to increase energy
      return {
        decision: 'apply_effect',
        confidence: 0.8,
        reasoning: 'Boosting energy with effect',
        parameters: {
          effect: 'filter',
          intensity: Math.min(energyDeficit, 0.8),
        },
      };
    }

    return {
      decision: 'adjust_eq',
      confidence: 0.7,
      reasoning: 'Fine-tuning energy with EQ',
      parameters: {
        value: energyDeficit,
      },
    };
  }

  /**
   * Decide effect application
   */
  private decideEffectApplication(context: DecisionContext): DecisionOutput {
    const effects = ['echo', 'reverb', 'filter', 'flanger', 'delay'];
    const selectedEffect = effects[Math.floor(Math.random() * effects.length)];

    return {
      decision: 'apply_effect',
      confidence: 0.6 + this.creativityLevel * 0.3,
      reasoning: `Applying ${selectedEffect} for creative variation`,
      parameters: {
        effect: selectedEffect,
        intensity: 0.3 + Math.random() * 0.4,
      },
    };
  }

  /**
   * Decide EQ adjustment
   */
  private decideEQAdjustment(context: DecisionContext): DecisionOutput {
    const energyDelta = context.crowdEnergy - context.setEnergy;

    return {
      decision: 'adjust_eq',
      confidence: 0.75,
      reasoning: 'Adjusting EQ based on energy levels',
      parameters: {
        value: energyDelta,
      },
    };
  }

  /**
   * Update decision weights (learning)
   */
  updateWeights(weights: Partial<DecisionWeights>): void {
    this.weights = { ...this.weights, ...weights };
    this.normalizeWeights();
  }

  /**
   * Normalize weights to sum to 1.0
   */
  private normalizeWeights(): void {
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    Object.keys(this.weights).forEach((key) => {
      this.weights[key as keyof DecisionWeights] /= sum;
    });
  }

  /**
   * Set mixing style
   */
  setMixingStyle(style: MixingStyle): void {
    this.mixingStyle = style;
  }

  /**
   * Set aggressiveness level
   */
  setAggressiveness(level: number): void {
    this.aggressiveness = Math.max(0, Math.min(1, level));
  }

  /**
   * Set creativity level
   */
  setCreativityLevel(level: number): void {
    this.creativityLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * Get current weights
   */
  getWeights(): DecisionWeights {
    return { ...this.weights };
  }

  /**
   * Export engine state
   */
  exportState(): {
    weights: DecisionWeights;
    mixingStyle: MixingStyle;
    aggressiveness: number;
    creativityLevel: number;
  } {
    return {
      weights: this.weights,
      mixingStyle: this.mixingStyle,
      aggressiveness: this.aggressiveness,
      creativityLevel: this.creativityLevel,
    };
  }

  /**
   * Import engine state
   */
  importState(state: {
    weights?: DecisionWeights;
    mixingStyle?: MixingStyle;
    aggressiveness?: number;
    creativityLevel?: number;
  }): void {
    if (state.weights) this.weights = state.weights;
    if (state.mixingStyle) this.mixingStyle = state.mixingStyle;
    if (state.aggressiveness !== undefined)
      this.aggressiveness = state.aggressiveness;
    if (state.creativityLevel !== undefined)
      this.creativityLevel = state.creativityLevel;
  }
}

/**
 * Create AI decision engine
 */
export function createAIDecisionEngine(): AIDecisionEngine {
  return new AIDecisionEngine();
}
