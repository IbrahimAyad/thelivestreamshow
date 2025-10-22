/**
 * AI DJ Integration Hook
 * Combines AI training, track analysis, context monitoring, and automation
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAITraining } from './useAITraining';
import { useAudioPlayer } from './useAudioPlayer';
import type { DJCommandContext } from '@/utils/studio/aiDjCommands';
import {
  createDJContextMonitor,
  DJContextMonitor,
  DJSessionState
} from '@/utils/studio/djContextMonitor';
import {
  createDJAutomation,
  DJAutomation,
  DJControls
} from '@/utils/studio/djAutomation';
import { analyzeTrack, quickBPMEstimate } from '@/utils/studio/trackAnalysis';
import { Track } from '@/utils/studio/aiContextAnalyzer';
import { DecisionContext } from '@/utils/studio/aiDecisionEngine';
import { UserAction as LearningUserAction } from '@/utils/studio/aiLearningSystem';
import type { MusicTrack } from "@/types/database";

export interface UseAIDJProps {
  djCommandContext?: DJCommandContext;
}

export function useAIDJ(props?: UseAIDJProps) {
  const { djCommandContext } = props || {};
  const aiTraining = useAITraining();
  const audioPlayer = useAudioPlayer();

  const contextMonitorRef = useRef<DJContextMonitor | null>(null);
  const automationRef = useRef<DJAutomation | null>(null);
  const decisionTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize AI DJ systems with real DJ controls
   */
  useEffect(() => {
    console.log('🤖 Initializing AI DJ system...');

    // Create context monitor
    const contextMonitor = createDJContextMonitor();
    contextMonitorRef.current = contextMonitor;
    contextMonitor.start();

    // Create DJ automation with actual controls connected to dual deck system
    const controls: DJControls = {
      // Playback
      play: (deckId: 'A' | 'B') => {
        console.log(`▶️ AI Play deck ${deckId}`);
        if (djCommandContext?.dualDeck) {
          const deck = deckId === 'A' ? djCommandContext.dualDeck.deckA : djCommandContext.dualDeck.deckB;
          deck.play();
        } else if (deckId === 'A') {
          audioPlayer.play();
        }
      },
      pause: (deckId: 'A' | 'B') => {
        console.log(`⏸️ AI Pause deck ${deckId}`);
        if (djCommandContext?.dualDeck) {
          const deck = deckId === 'A' ? djCommandContext.dualDeck.deckA : djCommandContext.dualDeck.deckB;
          deck.pause();
        } else if (deckId === 'A') {
          audioPlayer.pause();
        }
      },
      seek: (deckId: 'A' | 'B', position: number) => {
        console.log(`⏩ AI Seek deck ${deckId} to ${position}s`);
        if (deckId === 'A') {
          audioPlayer.seek(position);
        }
      },
      loadTrack: async (deckId: 'A' | 'B', trackId: string) => {
        console.log(`📀 AI Load track ${trackId} to deck ${deckId}`);
        if (djCommandContext?.dualDeck) {
          const deck = deckId === 'A' ? djCommandContext.dualDeck.deckA : djCommandContext.dualDeck.deckB;
          await deck.loadTrack(trackId);
        }
      },

      // Mixer
      setVolume: (deckId: 'A' | 'B' | 'master', value: number) => {
        console.log(`🔊 AI Set volume ${deckId}: ${(value * 100).toFixed(0)}%`);
        if (deckId === 'master' && djCommandContext?.dualDeck) {
          djCommandContext.dualDeck.mixer.setMasterVolume(value * 100);
        } else if (djCommandContext?.dualDeck) {
          const deck = deckId === 'A' ? djCommandContext.dualDeck.deckA : djCommandContext.dualDeck.deckB;
          deck.setChannelFaderLevel(value * 100);
        } else if (deckId === 'A' || deckId === 'master') {
          audioPlayer.changeVolume(value * 100);
        }
      },
      setCrossfader: (value: number) => {
        console.log(`🎚️ AI Crossfader: ${(value * 100).toFixed(0)}% (${value < 0.5 ? 'A' : 'B'})`);
        if (djCommandContext?.dualDeck) {
          djCommandContext.dualDeck.mixer.setCrossfaderPosition(value * 100);
        }
        // Update context monitor
        contextMonitor.updateMixer({ crossfader: value });
      },
      setGain: (deckId: 'A' | 'B', value: number) => {
        console.log(`🎛️ AI Gain ${deckId}: ${value.toFixed(2)}`);
        if (deckId === 'A' && !djCommandContext?.dualDeck) {
          audioPlayer.changeVolume(value); // Use changeVolume instead of changeGain
        }
        // Note: Gain is controlled via channel fader in dual deck mode
      },

      // EQ
      setEQ: (deckId: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number) => {
        console.log(`🎚️ AI EQ ${deckId} ${band}: ${value.toFixed(2)}`);
        if (djCommandContext?.dualDeck) {
          const deck = deckId === 'A' ? djCommandContext.dualDeck.deckA : djCommandContext.dualDeck.deckB;
          deck.setEQ(band, value);
        }
      },

      // Effects
      applyEffect: (deckId: 'A' | 'B', effect: string, intensity: number) => {
        console.log(`✨ AI Apply ${effect} on deck ${deckId} at ${(intensity * 100).toFixed(0)}%`);
        // Filter effect via filter chain
        if (effect === 'filter' && djCommandContext?.filterChain) {
          const filterValue = (intensity - 0.5) * 2; // Map 0-1 to -1 to 1
          if (filterValue > 0) {
            djCommandContext.filterChain.setLPF(filterValue);
          } else {
            djCommandContext.filterChain.setHPF(Math.abs(filterValue));
          }
        }
      },
      removeEffect: (deckId: 'A' | 'B', effect: string) => {
        console.log(`🚫 AI Remove ${effect} on deck ${deckId}`);
        if (effect === 'filter' && djCommandContext?.filterChain) {
          djCommandContext.filterChain.reset();
        }
      },

      // Performance
      setLoop: (deckId: 'A' | 'B', bars: number) => {
        console.log(`🔁 AI Set ${bars}-bar loop on deck ${deckId}`);
        if (deckId === 'A') {
          audioPlayer.toggleLoop();
        }
      },
      triggerHotCue: (deckId: 'A' | 'B', cueNumber: number) => {
        console.log(`🎯 AI Trigger hot cue ${cueNumber} on deck ${deckId}`);
        if (djCommandContext?.dualDeck) {
          const deck = deckId === 'A' ? djCommandContext.dualDeck.deckA : djCommandContext.dualDeck.deckB;
          deck.cue();
        }
      },
      setTempo: (deckId: 'A' | 'B', bpm: number) => {
        console.log(`⏱️ AI Set tempo ${deckId}: ${bpm} BPM`);
        if (djCommandContext?.dualDeck) {
          const deck = deckId === 'A' ? djCommandContext.dualDeck.deckA : djCommandContext.dualDeck.deckB;
          const currentState = deck.getDeckState();
          const currentBPM = currentState.tempo || 120;
          const tempoRate = bpm / currentBPM;
          deck.setTempoRate(tempoRate);
        } else if (deckId === 'A' && audioPlayer.currentTrack) {
          // audioPlayer doesn't support tempo adjustment
          console.log(`⚠️ Tempo adjustment not supported on single-deck audioPlayer`);
        }
      },

      // Filter
      setFilter: (deckId: 'A' | 'B', value: number) => {
        console.log(`🔈 AI Filter ${deckId}: ${value.toFixed(2)}`);
        if (djCommandContext?.filterChain) {
          if (value > 0) {
            djCommandContext.filterChain.setLPF(value);
          } else {
            djCommandContext.filterChain.setHPF(Math.abs(value));
          }
        }
      },
    };

    const automation = createDJAutomation(controls);
    automationRef.current = automation;

    console.log('✅ AI DJ system initialized with real controls');

    return () => {
      contextMonitor.destroy();
      if (decisionTimerRef.current) {
        clearInterval(decisionTimerRef.current);
      }
    };
  }, [djCommandContext, audioPlayer]);

  /**
   * Update context monitor when track changes
   */
  useEffect(() => {
    if (!audioPlayer.currentTrack || !contextMonitorRef.current) return;

    // Convert MusicTrack to Track format
    const track: Track = {
      id: audioPlayer.currentTrack.id,
      title: audioPlayer.currentTrack.title,
      artist: audioPlayer.currentTrack.artist || 'Unknown',
      bpm: audioPlayer.currentTrack.bpm || quickBPMEstimate(
        audioPlayer.duration,
        audioPlayer.currentTrack.title
      ),
      key: (audioPlayer.currentTrack as any).key || 'C major',
      energy: (audioPlayer.currentTrack as any).energy || 0.6,
      genre: (audioPlayer.currentTrack as any).genre || audioPlayer.currentTrack.category || 'Electronic',
      duration: audioPlayer.duration,
    };

    // Load track onto deck A
    contextMonitorRef.current.loadTrack('A', track);

    // Analyze track if possible
    analyzeTrackAsync(audioPlayer.currentTrack);
  }, [audioPlayer.currentTrack?.id]);

  /**
   * Update context monitor with playback state
   */
  useEffect(() => {
    if (!contextMonitorRef.current) return;

    contextMonitorRef.current.updateDeck('A', {
      isPlaying: audioPlayer.isPlaying,
      position: audioPlayer.playbackPosition,
      timeRemaining: audioPlayer.duration - audioPlayer.playbackPosition,
      volume: audioPlayer.volume,
      tempo: 0, // audioPlayer doesn't expose tempo, default to 0 (no pitch change)
      loopActive: audioPlayer.isLooping,
    });
  }, [
    audioPlayer.isPlaying,
    audioPlayer.playbackPosition,
    audioPlayer.volume,
    audioPlayer.isLooping,
  ]);

  /**
   * Analyze track asynchronously
   */
  const analyzeTrackAsync = useCallback(async (track: MusicTrack) => {
    try {
      console.log('🎵 Analyzing track:', track.title);

      // Quick analysis from metadata
      const quickAnalysis = {
        bpm: track.bpm || quickBPMEstimate(track.duration || 180, track.title),
        key: (track as any).key || 'C major',
        energy: (track as any).energy || 0.6,
        genre: (track as any).genre || track.category || 'Electronic',
        duration: track.duration || 180,
        loudness: -12,
        tempo: 'medium' as const,
        danceability: 0.7,
      };

      console.log('✅ Track analysis complete:', quickAnalysis);

      // Update track in database if needed
      // await updateTrackAnalysis(track.id, quickAnalysis);
    } catch (error) {
      console.error('Failed to analyze track:', error);
    }
  }, []);

  /**
   * Record user action for AI learning
   */
  const recordUserAction = useCallback((
    action: LearningUserAction,
    parameters?: any
  ) => {
    if (!contextMonitorRef.current || !audioPlayer.currentTrack) return;

    const context = contextMonitorRef.current.getAIContext();

    const track: Track | undefined = context.currentTrack ? {
      id: context.currentTrack.id,
      title: context.currentTrack.title,
      artist: context.currentTrack.artist,
      bpm: context.currentTrack.bpm,
      key: context.currentTrack.key,
      energy: context.currentTrack.energy,
      genre: context.currentTrack.genre,
      duration: context.currentTrack.duration,
    } : undefined;

    aiTraining.recordAction(
      action,
      {
        trackA: track,
        crowdEnergy: context.crowdEnergy,
        setEnergy: context.targetEnergy,
      },
      parameters
    );

    // Also record in context monitor
    contextMonitorRef.current.recordAction({
      action: action as any,
      deck: 'A',
      parameters,
    });
  }, [aiTraining, audioPlayer.currentTrack]);

  /**
   * Get AI decision for current context
   */
  const getAIDecision = useCallback(() => {
    if (!contextMonitorRef.current || !audioPlayer.currentTrack) return;

    const context = contextMonitorRef.current.getAIContext();

    if (!context.currentTrack) return;

    const decisionContext: DecisionContext = {
      currentTrack: {
        bpm: context.currentTrack.bpm,
        key: context.currentTrack.key,
        energy: context.currentTrack.energy,
        genre: context.currentTrack.genre,
        duration: context.currentTrack.duration,
        currentPosition: context.playbackPosition,
        timeRemaining: context.timeRemaining,
      },
      nextTrack: context.nextTrack ? {
        bpm: context.nextTrack.bpm,
        key: context.nextTrack.key,
        energy: context.nextTrack.energy,
        genre: context.nextTrack.genre,
        duration: context.nextTrack.duration,
        currentPosition: 0,
        timeRemaining: context.nextTrack.duration,
      } : null,
      mixProgress: context.timeRemaining / context.currentTrack.duration,
      crowdEnergy: context.crowdEnergy,
      setEnergy: context.targetEnergy,
      timeInSet: context.sessionDuration,
    };

    aiTraining.getDecision(decisionContext);
  }, [aiTraining, audioPlayer.currentTrack]);

  /**
   * Enable automatic AI decision making
   */
  const startAutonomousMode = useCallback(() => {
    if (!automationRef.current) return;

    console.log('🤖 Starting autonomous AI DJ mode...');

    aiTraining.setMode('autonomous');
    automationRef.current.enable();

    // Check for decisions every 10 seconds
    decisionTimerRef.current = setInterval(() => {
      getAIDecision();

      // If AI made a decision and auto-apply is on, execute it
      if (aiTraining.state.lastDecision && aiTraining.config.autoApply) {
        automationRef.current?.executeDecision(aiTraining.state.lastDecision);
      }
    }, 10000);

    console.log('✅ Autonomous mode active');
  }, [aiTraining, getAIDecision]);

  /**
   * Disable autonomous mode
   */
  const stopAutonomousMode = useCallback(() => {
    if (!automationRef.current) return;

    console.log('🛑 Stopping autonomous mode');

    automationRef.current.disable();

    if (decisionTimerRef.current) {
      clearInterval(decisionTimerRef.current);
      decisionTimerRef.current = null;
    }
  }, []);

  /**
   * Execute AI decision manually
   */
  const executeAIDecision = useCallback(() => {
    if (!automationRef.current || !aiTraining.state.lastDecision) return;

    console.log('🎛️ Executing AI decision manually');

    automationRef.current.executeDecision(aiTraining.state.lastDecision);
  }, [aiTraining.state.lastDecision]);

  /**
   * Get session statistics
   */
  const getSessionStats = useCallback(() => {
    if (!contextMonitorRef.current) return null;

    return contextMonitorRef.current.getStats();
  }, []);

  return {
    // AI Training
    aiState: aiTraining.state,
    aiConfig: aiTraining.config,
    aiPreferences: aiTraining.preferences,
    aiStatistics: aiTraining.statistics,

    // AI Controls
    startTraining: aiTraining.start,
    stopTraining: aiTraining.stop,
    setMode: aiTraining.setMode,
    setMixingStyle: aiTraining.setMixingStyle,
    setConfidenceThreshold: aiTraining.setConfidenceThreshold,
    setAutoApply: aiTraining.setAutoApply,

    // Actions
    recordUserAction,
    getAIDecision,
    approveDecision: aiTraining.approveDecision,
    rejectDecision: aiTraining.rejectDecision,
    correctDecision: aiTraining.correctDecision,

    // Automation
    startAutonomousMode,
    stopAutonomousMode,
    executeAIDecision,
    isAutomating: automationRef.current?.isActive() || false,

    // Analysis
    analyzeCompatibility: aiTraining.analyzeCompatibility,
    suggestNextTrack: aiTraining.suggestNextTrack,

    // Session
    getSessionStats,

    // Data
    exportData: aiTraining.exportData,
    importData: aiTraining.importData,
    reset: aiTraining.reset,
  };
}
