/**
 * DJ Command Context Hook
 * Provides AI-accessible command context for all DJ features
 */

import { useMemo } from 'react'
import type { DJCommandContext } from '@/utils/studio/aiDjCommands'

interface UseDJCommandContextProps {
  audioPlayer: any
  filterChain: any
  quantize: any
  dualDeck?: any
}

export function useDJCommandContext({
  audioPlayer,
  filterChain,
  quantize,
  dualDeck,
}: UseDJCommandContextProps): DJCommandContext {
  return useMemo(() => ({
    filterChain: {
      setHPF: filterChain.setHPF,
      setLPF: filterChain.setLPF,
      reset: filterChain.reset,
    },
    audioPlayer: {
      tempo: audioPlayer.tempo,
      isKeyLockEnabled: audioPlayer.isKeyLockEnabled,
      gain: audioPlayer.gain,
      volume: audioPlayer.volume,
      setTempoRate: audioPlayer.setTempoRate,
      toggleKeyLock: audioPlayer.toggleKeyLock,
      changeGain: audioPlayer.changeGain,
      changeVolume: audioPlayer.changeVolume,
      setLimiterThreshold: audioPlayer.setLimiterThreshold,
      setLimiterRatio: audioPlayer.setLimiterRatio,
      play: audioPlayer.play,
      pause: audioPlayer.pause,
      stop: audioPlayer.stop,
    },
    quantize: {
      enabled: quantize.enabled,
      snapToGrid: quantize.snapToGrid,
      toggle: quantize.toggle,
      changeGrid: quantize.changeGrid,
    },
    dualDeck: dualDeck ? {
      deckA: {
        play: dualDeck.deckA.play,
        pause: dualDeck.deckA.pause,
        cue: dualDeck.deckA.cue,
        setTempoRate: dualDeck.deckA.setTempoRate,
        setEQ: dualDeck.deckA.setEQ,
        killEQ: dualDeck.deckA.killEQ,
        resetEQ: dualDeck.deckA.resetEQ,
        setChannelFaderLevel: dualDeck.deckA.setChannelFaderLevel,
        loadTrack: dualDeck.deckA.loadTrack,
        getDeckState: dualDeck.deckA.getDeckState,
      },
      deckB: {
        play: dualDeck.deckB.play,
        pause: dualDeck.deckB.pause,
        cue: dualDeck.deckB.cue,
        setTempoRate: dualDeck.deckB.setTempoRate,
        setEQ: dualDeck.deckB.setEQ,
        killEQ: dualDeck.deckB.killEQ,
        resetEQ: dualDeck.deckB.resetEQ,
        setChannelFaderLevel: dualDeck.deckB.setChannelFaderLevel,
        loadTrack: dualDeck.deckB.loadTrack,
        getDeckState: dualDeck.deckB.getDeckState,
      },
      mixer: {
        setCrossfaderPosition: dualDeck.setCrossfaderPosition,
        setCrossfaderCurve: dualDeck.setCrossfaderCurve,
        setMasterVolume: dualDeck.setMasterVolume,
        crossfaderToA: dualDeck.crossfaderToA,
        crossfaderToCenter: dualDeck.crossfaderToCenter,
        crossfaderToB: dualDeck.crossfaderToB,
      },
      controls: {
        syncDecks: dualDeck.syncDecks,
        areDecksSynced: dualDeck.areDecksSynced,
        areDecksInKey: dualDeck.areDecksInKey,
      },
    } : undefined,
  }), [audioPlayer, filterChain, quantize, dualDeck])
}
