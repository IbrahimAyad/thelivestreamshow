/**
 * AI DJ Intelligence - Automatically apply professional DJ techniques
 * during Auto-DJ transitions and playback
 */

import type { ThreeBandEQ } from './eqSystem';
import type { ProfessionalFXChain } from './fxChain';
import type { HotCue } from './hotCues';
import type { Loop } from './loopControls';

export interface AITransitionConfig {
  // Track information
  currentTrack: {
    bpm: number | null;
    key: string | null;
    energy: number;
  };
  nextTrack: {
    bpm: number | null;
    key: string | null;
    energy: number;
  };
  
  // Transition type
  transitionType: 'echo_out' | 'bass_swap' | 'filter_sweep' | 'reverb_tail' | 'quick_cut';
  
  // Duration in seconds
  transitionDuration: number;
}

export interface AITransitionPlan {
  // EQ automation timeline
  eqTimeline: {
    time: number; // seconds from transition start
    currentTrack: { low: number; mid: number; high: number };
    nextTrack: { low: number; mid: number; high: number };
  }[];
  
  // FX automation
  fxTimeline: {
    time: number;
    effect: 'reverb' | 'delay' | 'filter';
    wet: number; // 0-1
    target: 'current' | 'next' | 'both';
  }[];
  
  // Hot cues to set
  suggestedCues: {
    track: 'current' | 'next';
    time: number; // seconds
    label: string;
    type: 'intro' | 'drop' | 'breakdown' | 'outro';
  }[];
  
  // Loop suggestions
  suggestedLoops: {
    track: 'current' | 'next';
    startTime: number;
    duration: number; // bars
    purpose: 'extend_intro' | 'extend_outro' | 'build_tension';
  }[];
}

/**
 * Generate an intelligent transition plan based on track properties
 */
export function generateTransitionPlan(config: AITransitionConfig): AITransitionPlan {
  const { currentTrack, nextTrack, transitionType, transitionDuration } = config;
  const plan: AITransitionPlan = {
    eqTimeline: [],
    fxTimeline: [],
    suggestedCues: [],
    suggestedLoops: [],
  };

  // Determine transition style based on energy change
  const energyChange = nextTrack.energy - currentTrack.energy;
  const isEnergyIncrease = energyChange > 10;
  const isEnergyDecrease = energyChange < -10;

  // 1. EQ Automation Timeline
  if (transitionType === 'bass_swap') {
    // Classic bass swap technique
    plan.eqTimeline = [
      {
        time: 0,
        currentTrack: { low: 0, mid: 0, high: 0 },
        nextTrack: { low: -30, mid: -15, high: -10 },
      },
      {
        time: transitionDuration * 0.25,
        currentTrack: { low: 0, mid: 0, high: 0 },
        nextTrack: { low: -20, mid: -10, high: -5 },
      },
      {
        time: transitionDuration * 0.5,
        currentTrack: { low: -15, mid: 0, high: 0 }, // Start cutting bass on current
        nextTrack: { low: -5, mid: 0, high: 0 }, // Bring in bass on next
      },
      {
        time: transitionDuration * 0.75,
        currentTrack: { low: -30, mid: -10, high: -5 },
        nextTrack: { low: 0, mid: 0, high: 0 },
      },
      {
        time: transitionDuration,
        currentTrack: { low: -100, mid: -100, high: -100 }, // Fade out completely
        nextTrack: { low: 0, mid: 0, high: 0 },
      },
    ];
  } else if (transitionType === 'filter_sweep') {
    // High-pass filter sweep
    plan.eqTimeline = [
      {
        time: 0,
        currentTrack: { low: 0, mid: 0, high: 0 },
        nextTrack: { low: -100, mid: -100, high: -15 }, // Only highs
      },
      {
        time: transitionDuration * 0.5,
        currentTrack: { low: 0, mid: 0, high: 0 },
        nextTrack: { low: -50, mid: -20, high: 0 },
      },
      {
        time: transitionDuration,
        currentTrack: { low: -100, mid: -100, high: -100 },
        nextTrack: { low: 0, mid: 0, high: 0 },
      },
    ];
  } else if (transitionType === 'echo_out') {
    // Smooth EQ fade
    plan.eqTimeline = [
      {
        time: 0,
        currentTrack: { low: 0, mid: 0, high: 0 },
        nextTrack: { low: -30, mid: -30, high: -30 },
      },
      {
        time: transitionDuration,
        currentTrack: { low: -100, mid: -100, high: -100 },
        nextTrack: { low: 0, mid: 0, high: 0 },
      },
    ];
  }

  // 2. FX Automation Timeline
  if (transitionType === 'echo_out') {
    plan.fxTimeline = [
      { time: transitionDuration * 0.6, effect: 'delay', wet: 0.3, target: 'current' },
      { time: transitionDuration * 0.8, effect: 'delay', wet: 0.6, target: 'current' },
      { time: transitionDuration, effect: 'delay', wet: 0, target: 'current' },
    ];
  } else if (transitionType === 'reverb_tail') {
    plan.fxTimeline = [
      { time: transitionDuration * 0.5, effect: 'reverb', wet: 0.4, target: 'current' },
      { time: transitionDuration * 0.7, effect: 'reverb', wet: 0.7, target: 'current' },
      { time: transitionDuration, effect: 'reverb', wet: 0, target: 'both' },
    ];
  }

  if (isEnergyIncrease) {
    // Add filter sweep for energy increase
    plan.fxTimeline.push(
      { time: transitionDuration * 0.8, effect: 'filter', wet: 0.5, target: 'next' },
      { time: transitionDuration, effect: 'filter', wet: 0, target: 'next' }
    );
  }

  // 3. Suggested Hot Cues
  plan.suggestedCues = [
    { track: 'current', time: 30, label: 'Outro Start', type: 'outro' },
    { track: 'next', time: 0, label: 'Intro', type: 'intro' },
    { track: 'next', time: 16, label: 'First Drop', type: 'drop' },
  ];

  // 4. Suggested Loops
  if (isEnergyDecrease) {
    // Extend outro of current track for smooth energy transition
    plan.suggestedLoops.push({
      track: 'current',
      startTime: 60, // Last minute
      duration: 4, // 4-bar loop
      purpose: 'extend_outro',
    });
  } else if (isEnergyIncrease) {
    // Build tension on next track intro
    plan.suggestedLoops.push({
      track: 'next',
      startTime: 8,
      duration: 2, // 2-bar loop
      purpose: 'build_tension',
    });
  }

  return plan;
}

/**
 * Apply AI-generated transition plan to the audio system
 */
export class AITransitionController {
  private intervalId: number | null = null;
  private startTime: number = 0;
  
  constructor(
    private plan: AITransitionPlan,
    private eqSystem: ThreeBandEQ | null,
    private fxChain: ProfessionalFXChain | null
  ) {}

  start() {
    this.startTime = Date.now();
    this.intervalId = window.setInterval(() => {
      this.update();
    }, 100); // Update every 100ms
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private update() {
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds

    // Apply EQ changes
    const currentEQState = this.interpolateEQState(elapsed);
    if (currentEQState && this.eqSystem) {
      // Apply to current track (this would need track-specific EQ in real implementation)
      this.eqSystem.setLowGain(currentEQState.currentTrack.low);
      this.eqSystem.setMidGain(currentEQState.currentTrack.mid);
      this.eqSystem.setHighGain(currentEQState.currentTrack.high);
    }

    // Apply FX changes
    const activeFX = this.plan.fxTimeline.filter(
      fx => Math.abs(fx.time - elapsed) < 0.15 // Within 150ms window
    );

    for (const fx of activeFX) {
      if (this.fxChain) {
        // Apply effect based on type
        if (fx.effect === 'delay') {
          this.fxChain.setDelay({ wet: fx.wet, enabled: fx.wet > 0 });
        } else if (fx.effect === 'reverb') {
          this.fxChain.setReverb({ wet: fx.wet, enabled: fx.wet > 0 });
        }
      }
    }
  }

  private interpolateEQState(time: number) {
    const { eqTimeline } = this.plan;
    if (eqTimeline.length === 0) return null;

    // Find surrounding keyframes
    let prevFrame = eqTimeline[0];
    let nextFrame = eqTimeline[eqTimeline.length - 1];

    for (let i = 0; i < eqTimeline.length - 1; i++) {
      if (time >= eqTimeline[i].time && time <= eqTimeline[i + 1].time) {
        prevFrame = eqTimeline[i];
        nextFrame = eqTimeline[i + 1];
        break;
      }
    }

    // Linear interpolation
    const duration = nextFrame.time - prevFrame.time;
    const progress = duration > 0 ? (time - prevFrame.time) / duration : 1;

    const lerp = (a: number, b: number) => a + (b - a) * progress;

    return {
      currentTrack: {
        low: lerp(prevFrame.currentTrack.low, nextFrame.currentTrack.low),
        mid: lerp(prevFrame.currentTrack.mid, nextFrame.currentTrack.mid),
        high: lerp(prevFrame.currentTrack.high, nextFrame.currentTrack.high),
      },
      nextTrack: {
        low: lerp(prevFrame.nextTrack.low, nextFrame.nextTrack.low),
        mid: lerp(prevFrame.nextTrack.mid, nextFrame.nextTrack.mid),
        high: lerp(prevFrame.nextTrack.high, nextFrame.nextTrack.high),
      },
    };
  }
}

/**
 * Select best transition type based on track properties
 */
export function selectTransitionType(
  currentTrack: AITransitionConfig['currentTrack'],
  nextTrack: AITransitionConfig['nextTrack']
): AITransitionConfig['transitionType'] {
  const energyChange = nextTrack.energy - currentTrack.energy;

  // High energy increase: use filter sweep
  if (energyChange > 20) {
    return 'filter_sweep';
  }

  // Energy decrease: use reverb tail
  if (energyChange < -20) {
    return 'reverb_tail';
  }

  // BPM match: use bass swap (classic technique)
  if (currentTrack.bpm && nextTrack.bpm && Math.abs(currentTrack.bpm - nextTrack.bpm) < 5) {
    return 'bass_swap';
  }

  // Harmonic match: use echo out
  if (currentTrack.key && nextTrack.key && areKeysCompatible(currentTrack.key, nextTrack.key)) {
    return 'echo_out';
  }

  // Default: quick cut for dissimilar tracks
  return 'quick_cut';
}

/**
 * Check if two musical keys are compatible for mixing
 */
function areKeysCompatible(key1: string, key2: string): boolean {
  // Simplified Camelot wheel compatibility check
  // In a real implementation, use the full harmonicMixing.ts utility
  const camelotMap: { [key: string]: string } = {
    'C': '8B', 'Cm': '5A', 'C#': '3B', 'C#m': '12A',
    'D': '10B', 'Dm': '7A', 'D#': '5B', 'D#m': '2A',
    'E': '12B', 'Em': '9A', 'F': '7B', 'Fm': '4A',
    'F#': '2B', 'F#m': '11A', 'G': '9B', 'Gm': '6A',
    'G#': '4B', 'G#m': '1A', 'A': '11B', 'Am': '8A',
    'A#': '6B', 'A#m': '3A', 'B': '1B', 'Bm': '10A',
  };

  const code1 = camelotMap[key1];
  const code2 = camelotMap[key2];

  if (!code1 || !code2) return false;

  // Perfect match
  if (code1 === code2) return true;

  // Adjacent keys
  const num1 = parseInt(code1);
  const num2 = parseInt(code2);
  const letter1 = code1.slice(-1);
  const letter2 = code2.slice(-1);

  // Same letter, adjacent numbers
  if (letter1 === letter2 && Math.abs(num1 - num2) === 1) return true;

  // Energy change (A to B or B to A with same number)
  if (num1 === num2 && letter1 !== letter2) return true;

  return false;
}
