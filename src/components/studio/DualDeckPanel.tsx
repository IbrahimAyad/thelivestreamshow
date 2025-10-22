/**
 * DualDeckPanel - Professional dual-deck DJ interface
 *
 * This is the main container that combines:
 * - Deck A control panel
 * - Deck B control panel
 * - Crossfader mixer
 * - Jog wheels
 * - Beat counters
 * - Harmonic wheel
 * - Dual waveform display (if available)
 *
 * Layout philosophy:
 * - Top: Deck controls with jog wheels
 * - Center: Crossfader mixer
 * - Side: Harmonic wheel
 * - Bottom: Beat counters
 */

import { useState } from 'react'
import type { useDualDeckAudioPlayer } from '@/hooks/studio/useDualDeckAudioPlayer'
import { DeckControl } from './DeckControl'
import { JogWheel } from './JogWheel'
import { CrossfaderSlider } from './CrossfaderSlider'
import { BeatCounterDisplay } from './BeatCounterDisplay'
import { HarmonicWheel } from './HarmonicWheel'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { MusicTrack } from '@/types/database'

interface DualDeckPanelProps {
  dualDeck: ReturnType<typeof useDualDeckAudioPlayer>
  onLoadTrack?: (deck: 'A' | 'B', track: MusicTrack) => void
  className?: string
}

export function DualDeckPanel({
  dualDeck,
  onLoadTrack,
  className = '',
}: DualDeckPanelProps) {
  const [showHarmonicWheel, setShowHarmonicWheel] = useState(true)
  const [showBeatCounters, setShowBeatCounters] = useState(true)

  const {
    deckA,
    deckB,
    mixer,
    setCrossfaderPosition,
    setCrossfaderCurve,
    crossfaderToA,
    crossfaderToCenter,
    crossfaderToB,
    syncDecks,
  } = dualDeck

  // Get deck states
  const deckAState = deckA.getDeckState()
  const deckBState = deckB.getDeckState()

  return (
    <div className={`bg-neutral-950 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">
          Professional DJ Decks
        </h2>
        <p className="text-neutral-400">
          Dual-deck mixing system with harmonic analysis
        </p>
      </div>

      {/* Main DJ interface grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Deck A */}
        <div className="col-span-5 space-y-4">
          {/* Deck A Control */}
          <DeckControl
            deckId="A"
            deckState={deckAState}
            onLoadTrack={(track) => {
              deckA.loadTrack(track)
              onLoadTrack?.('A', track)
            }}
            onPlay={deckA.play}
            onPause={deckA.pause}
            onCue={deckA.cue}
            onSetCue={deckA.setCue}
            onSetTempo={deckA.setTempoRate}
            onToggleKeyLock={deckA.toggleKeyLock}
            onSetChannelFader={deckA.setChannelFaderLevel}
            onSetTrimGain={deckA.setTrimGainLevel}
            onSetEQ={deckA.setEQ}
            onKillEQ={deckA.killEQ}
            onResetEQ={deckA.resetEQ}
            onSync={() => syncDecks('B')} // Sync A to B
          />

          {/* Deck A Jog Wheel */}
          <div className="flex justify-center">
            <JogWheel
              deckId="A"
              isPlaying={deckA.isPlaying}
              playbackPosition={deckA.playbackPosition}
              onPitchBend={(delta) => {
                // Temporary tempo nudge
                const newTempo = deckA.tempo + delta * 0.001
                deckA.setTempoRate(newTempo)
              }}
              onScratch={(delta) => {
                // Direct playback position change
                const newPosition = deckA.playbackPosition + delta * 0.1
                deckA.seek(newPosition)
              }}
              size={240}
            />
          </div>
        </div>

        {/* Center: Mixer */}
        <div className="col-span-2 flex flex-col justify-center">
          <CrossfaderSlider
            position={mixer.crossfaderPosition}
            curve={mixer.crossfaderCurve}
            onPositionChange={setCrossfaderPosition}
            onCurveChange={setCrossfaderCurve}
            onPresetA={crossfaderToA}
            onPresetCenter={crossfaderToCenter}
            onPresetB={crossfaderToB}
          />

          {/* Master volume */}
          <div className="mt-6 p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
            <div className="text-xs font-medium text-neutral-400 uppercase mb-2">
              Master Volume
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={mixer.masterVolume}
              onChange={(e) => dualDeck.setMasterVolume(parseFloat(e.target.value))}
              className="w-full h-3 bg-neutral-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:border-0"
            />
            <div className="text-center text-sm font-mono text-white mt-2">
              {(mixer.masterVolume * 100).toFixed(0)}%
            </div>
          </div>

          {/* Sync status */}
          {dualDeck.areDecksSynced() && (
            <div className="mt-4 p-2 bg-green-500/20 border border-green-500 rounded text-center">
              <div className="text-xs font-bold text-green-400">
                ✅ DECKS SYNCED
              </div>
            </div>
          )}

          {dualDeck.areDecksInKey() && (
            <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500 rounded text-center">
              <div className="text-xs font-bold text-blue-400">
                🎵 IN KEY
              </div>
            </div>
          )}
        </div>

        {/* Right: Deck B */}
        <div className="col-span-5 space-y-4">
          {/* Deck B Control */}
          <DeckControl
            deckId="B"
            deckState={deckBState}
            onLoadTrack={(track) => {
              deckB.loadTrack(track)
              onLoadTrack?.('B', track)
            }}
            onPlay={deckB.play}
            onPause={deckB.pause}
            onCue={deckB.cue}
            onSetCue={deckB.setCue}
            onSetTempo={deckB.setTempoRate}
            onToggleKeyLock={deckB.toggleKeyLock}
            onSetChannelFader={deckB.setChannelFaderLevel}
            onSetTrimGain={deckB.setTrimGainLevel}
            onSetEQ={deckB.setEQ}
            onKillEQ={deckB.killEQ}
            onResetEQ={deckB.resetEQ}
            onSync={() => syncDecks('A')} // Sync B to A
          />

          {/* Deck B Jog Wheel */}
          <div className="flex justify-center">
            <JogWheel
              deckId="B"
              isPlaying={deckB.isPlaying}
              playbackPosition={deckB.playbackPosition}
              onPitchBend={(delta) => {
                const newTempo = deckB.tempo + delta * 0.001
                deckB.setTempoRate(newTempo)
              }}
              onScratch={(delta) => {
                const newPosition = deckB.playbackPosition + delta * 0.1
                deckB.seek(newPosition)
              }}
              size={240}
            />
          </div>
        </div>
      </div>

      {/* Beat Counters (collapsible) */}
      <div className="mt-6">
        <button
          onClick={() => setShowBeatCounters(!showBeatCounters)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors mb-3"
        >
          {showBeatCounters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Beat Counters
        </button>

        {showBeatCounters && (
          <div className="grid grid-cols-2 gap-4">
            <BeatCounterDisplay
              deckId="A"
              beatPhase={deckA.beatPhase}
              barCount={deckA.barCount}
              phraseCount={deckA.phraseCount}
              bpm={deckA.bpm}
              isPlaying={deckA.isPlaying}
            />

            <BeatCounterDisplay
              deckId="B"
              beatPhase={deckB.beatPhase}
              barCount={deckB.barCount}
              phraseCount={deckB.phraseCount}
              bpm={deckB.bpm}
              isPlaying={deckB.isPlaying}
            />
          </div>
        )}
      </div>

      {/* Harmonic Wheel (collapsible) */}
      <div className="mt-6">
        <button
          onClick={() => setShowHarmonicWheel(!showHarmonicWheel)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors mb-3"
        >
          {showHarmonicWheel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Harmonic Mixing Wheel
        </button>

        {showHarmonicWheel && (
          <div className="flex justify-center">
            <HarmonicWheel
              deckAKey={deckA.musicalKey}
              deckBKey={deckB.musicalKey}
              showCompatibility={true}
              size={500}
            />
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-6 p-4 bg-neutral-900/50 border border-neutral-700 rounded text-xs text-neutral-400">
        <div className="font-medium text-white mb-2">⌨️ Keyboard Shortcuts:</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="font-medium text-neutral-300 mb-1">Deck A:</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">Q</kbd> Play/Pause</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">A</kbd> Cue</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">Z</kbd> Sync</div>
          </div>
          <div>
            <div className="font-medium text-neutral-300 mb-1">Deck B:</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">P</kbd> Play/Pause</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">;</kbd> Cue</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">/</kbd> Sync</div>
          </div>
          <div>
            <div className="font-medium text-neutral-300 mb-1">Crossfader:</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">X</kbd> Full A</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">C</kbd> Center</div>
            <div><kbd className="px-1 py-0.5 bg-neutral-700 rounded">V</kbd> Full B</div>
          </div>
        </div>
      </div>
    </div>
  )
}
