/**
 * DeckControl - Control panel for a single DJ deck (A or B)
 *
 * Features:
 * - Play/Pause/Cue buttons
 * - Tempo slider with percentage display
 * - 3-band EQ (Low/Mid/High) with kill buttons
 * - Channel fader
 * - Sync button
 * - Track info display (Title, Artist, BPM, Key)
 * - Beat counter (Beat/Bar/Phrase)
 */

import { useState } from 'react'
import { Play, Pause, Square, RotateCcw, Lock, Unlock, RefreshCw } from 'lucide-react'
import type { DeckId, DeckState } from '@/hooks/studio/useDeckAudioPlayer'
import type { MusicTrack } from '@/types/database'

interface DeckControlProps {
  deckId: DeckId
  deckState: DeckState
  onLoadTrack: (track: MusicTrack) => void
  onPlay: () => void
  onPause: () => void
  onCue: () => void
  onSetCue: () => void
  onSetTempo: (tempo: number) => void
  onToggleKeyLock: () => void
  onSetChannelFader: (level: number) => void
  onSetTrimGain: (level: number) => void
  onSetEQ: (band: 'low' | 'mid' | 'high', value: number) => void
  onKillEQ: (band: 'low' | 'mid' | 'high') => void
  onResetEQ: () => void
  onSync: () => void
  className?: string
}

export function DeckControl({
  deckId,
  deckState,
  onPlay,
  onPause,
  onCue,
  onSetCue,
  onSetTempo,
  onToggleKeyLock,
  onSetChannelFader,
  onSetTrimGain,
  onSetEQ,
  onKillEQ,
  onResetEQ,
  onSync,
  className = '',
}: DeckControlProps) {
  const [showEQControls, setShowEQControls] = useState(true)

  const {
    currentTrack,
    isPlaying,
    isCued,
    tempo,
    isKeyLockEnabled,
    bpm,
    musicalKey,
    beatPhase,
    barCount,
    phraseCount,
    channelFader,
    trimGain,
    eqLow,
    eqMid,
    eqHigh,
  } = deckState

  // Calculate effective BPM (with tempo adjustment)
  const effectiveBPM = bpm ? (bpm * tempo).toFixed(1) : '---'

  // Tempo percentage
  const tempoPercent = ((tempo - 1) * 100).toFixed(1)
  const tempoDisplay = tempo >= 1 ? `+${tempoPercent}` : tempoPercent

  // Deck color
  const deckColor = deckId === 'A' ? 'blue' : 'purple'

  return (
    <div className={`bg-neutral-900 border-2 border-${deckColor}-500 rounded-lg p-4 ${className}`}>
      {/* Header with Deck ID */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-3xl font-bold text-${deckColor}-400`}>
          DECK {deckId}
        </div>
        <div className="flex items-center gap-2">
          {/* Sync button */}
          <button
            onClick={onSync}
            disabled={!currentTrack}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              currentTrack
                ? `bg-${deckColor}-600 hover:bg-${deckColor}-700 text-white`
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
            title={`Sync to ${deckId === 'A' ? 'Deck B' : 'Deck A'}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Key Lock toggle */}
          <button
            onClick={onToggleKeyLock}
            disabled={!currentTrack}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              isKeyLockEnabled
                ? `bg-green-600 hover:bg-green-700 text-white`
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
            title="Key Lock (Master Tempo)"
          >
            {isKeyLockEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Track Info */}
      <div className="mb-4 p-3 bg-neutral-800 rounded-lg min-h-[80px]">
        {currentTrack ? (
          <>
            <div className="text-lg font-semibold text-white truncate">
              {currentTrack.title}
            </div>
            {currentTrack.artist && (
              <div className="text-sm text-neutral-400 truncate">
                {currentTrack.artist}
              </div>
            )}
            <div className="flex gap-4 mt-2">
              <div className={`text-sm font-mono text-${deckColor}-400`}>
                {effectiveBPM} BPM
              </div>
              {musicalKey && (
                <div className="text-sm font-mono text-green-400">
                  {musicalKey}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
            No track loaded
          </div>
        )}
      </div>

      {/* Beat Counter */}
      {currentTrack && (
        <div className="mb-4 p-2 bg-neutral-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    beatPhase === b
                      ? `bg-${deckColor}-500 text-white scale-110`
                      : 'bg-neutral-700 text-neutral-500'
                  }`}
                >
                  {b + 1}
                </div>
              ))}
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              Bar {barCount + 1}/8 • Phrase {phraseCount}
            </div>
          </div>
        </div>
      )}

      {/* Transport Controls */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={isCued ? onPlay : onCue}
          disabled={!currentTrack}
          className={`py-3 rounded font-medium transition-colors ${
            isCued
              ? `bg-green-600 hover:bg-green-700 text-white`
              : `bg-yellow-600 hover:bg-yellow-700 text-white`
          } ${!currentTrack && 'opacity-50 cursor-not-allowed'}`}
          title={isCued ? 'Play from Cue' : 'Return to Cue'}
        >
          <div className="flex flex-col items-center gap-1">
            <RotateCcw className="w-5 h-5" />
            <span className="text-xs">CUE</span>
          </div>
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!currentTrack}
          className={`col-span-2 py-3 rounded font-medium transition-colors ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : `bg-${deckColor}-600 hover:bg-${deckColor}-700 text-white`
          } ${!currentTrack && 'opacity-50 cursor-not-allowed'}`}
        >
          <div className="flex flex-col items-center gap-1">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            <span className="text-xs font-bold">
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </span>
          </div>
        </button>

        <button
          onClick={onSetCue}
          disabled={!currentTrack || !isPlaying}
          className={`py-3 rounded font-medium transition-colors ${
            currentTrack && isPlaying
              ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
          title="Set Cue Point"
        >
          <div className="flex flex-col items-center gap-1">
            <Square className="w-5 h-5" />
            <span className="text-xs">SET</span>
          </div>
        </button>
      </div>

      {/* Tempo Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Tempo
          </label>
          <div className={`text-lg font-mono font-bold text-${deckColor}-400`}>
            {tempoDisplay}%
          </div>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.001"
          value={tempo}
          onChange={(e) => onSetTempo(parseFloat(e.target.value))}
          disabled={!currentTrack}
          className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:border-0"
        />
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>50%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      {/* Channel Fader */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Channel Fader
          </label>
          <div className="text-sm font-mono text-white">
            {(channelFader * 100).toFixed(0)}%
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={channelFader}
          onChange={(e) => onSetChannelFader(parseFloat(e.target.value))}
          className={`w-full h-3 bg-neutral-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-${deckColor}-500
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-${deckColor}-500 [&::-moz-range-thumb]:border-0`}
        />
      </div>

      {/* Trim Gain */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Trim (Gain)
          </label>
          <div className="text-sm font-mono text-white">
            {(trimGain * 100).toFixed(0)}%
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="1.5"
          step="0.01"
          value={trimGain}
          onChange={(e) => onSetTrimGain(parseFloat(e.target.value))}
          className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:border-0"
        />
      </div>

      {/* 3-Band EQ */}
      {showEQControls && (
        <div className="border-t border-neutral-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-neutral-400 uppercase">
              3-Band EQ
            </h4>
            <button
              onClick={onResetEQ}
              className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Low (100 Hz) */}
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-xs font-medium text-red-400">LOW</div>
                <div className="text-xs text-neutral-500">100 Hz</div>
              </div>
              <div className="flex flex-col items-center">
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={eqLow}
                  onChange={(e) => onSetEQ('low', parseFloat(e.target.value))}
                  className="h-24 appearance-none bg-neutral-700 rounded-full cursor-pointer
                    [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
                  style={{ width: '8px' }}
                />
                <div className="text-xs font-mono text-white mt-2">
                  {eqLow > 0 ? '+' : ''}{eqLow}dB
                </div>
              </div>
              <button
                onClick={() => onKillEQ('low')}
                className="w-full py-1 rounded text-xs font-bold bg-red-900 hover:bg-red-800 text-white"
              >
                KILL
              </button>
            </div>

            {/* Mid (1 kHz) */}
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-xs font-medium text-yellow-400">MID</div>
                <div className="text-xs text-neutral-500">1 kHz</div>
              </div>
              <div className="flex flex-col items-center">
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={eqMid}
                  onChange={(e) => onSetEQ('mid', parseFloat(e.target.value))}
                  className="h-24 appearance-none bg-neutral-700 rounded-full cursor-pointer
                    [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
                  style={{ width: '8px' }}
                />
                <div className="text-xs font-mono text-white mt-2">
                  {eqMid > 0 ? '+' : ''}{eqMid}dB
                </div>
              </div>
              <button
                onClick={() => onKillEQ('mid')}
                className="w-full py-1 rounded text-xs font-bold bg-yellow-900 hover:bg-yellow-800 text-white"
              >
                KILL
              </button>
            </div>

            {/* High (10 kHz) */}
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-xs font-medium text-blue-400">HIGH</div>
                <div className="text-xs text-neutral-500">10 kHz</div>
              </div>
              <div className="flex flex-col items-center">
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={eqHigh}
                  onChange={(e) => onSetEQ('high', parseFloat(e.target.value))}
                  className="h-24 appearance-none bg-neutral-700 rounded-full cursor-pointer
                    [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
                  style={{ width: '8px' }}
                />
                <div className="text-xs font-mono text-white mt-2">
                  {eqHigh > 0 ? '+' : ''}{eqHigh}dB
                </div>
              </div>
              <button
                onClick={() => onKillEQ('high')}
                className="w-full py-1 rounded text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white"
              >
                KILL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
