/**
 * Beat Matching Panel - Master Component for Phase 5A
 * Combines waveform display, hot cues, and loop controls
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MusicTrack } from "@/types/database";
import { useBeatDetection } from '@/hooks/studio/useBeatDetection';
import { useWaveform } from '@/hooks/studio/useWaveform';
import { useHotCues } from '@/hooks/studio/useHotCues';
import { useLoops } from '@/hooks/studio/useLoops';
import { WaveformDisplay } from './WaveformDisplay';
import { HotCuesPanel } from './HotCuesPanel';
import { LoopControlsPanel } from './LoopControlsPanel';

interface BeatMatchingPanelProps {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  playbackPosition: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function BeatMatchingPanel({
  currentTrack,
  isPlaying,
  playbackPosition,
  duration,
  onSeek,
  className = '',
}: BeatMatchingPanelProps) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  // Initialize hooks
  const beatDetection = useBeatDetection(currentTrack);
  const waveform = useWaveform(currentTrack);
  const hotCues = useHotCues(currentTrack, playbackPosition, {
    onCueJump: onSeek,
    enableKeyboardShortcuts: true,
  });
  const loops = useLoops(playbackPosition, {
    beatGrid: beatDetection.beatGrid,
    onSeek,
    enableKeyboardShortcuts: true,
  });

  // Check loop playback (jump back when loop ends)
  useEffect(() => {
    if (isPlaying && loops.loop?.isActive) {
      loops.checkLoopJump(playbackPosition);
    }
  }, [isPlaying, playbackPosition, loops.loop?.isActive]);

  // Load audio file and analyze when track changes
  useEffect(() => {
    if (!currentTrack || currentTrack.id === currentTrackIdRef.current) return;

    currentTrackIdRef.current = currentTrack.id;
    loadAndAnalyzeTrack(currentTrack);
  }, [currentTrack]);

  const loadAndAnalyzeTrack = async (track: MusicTrack) => {
    setIsLoadingAudio(true);

    try {
      // Initialize AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Fetch audio file
      const response = await fetch(track.file_url);
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio
      const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);

      // Generate waveform
      await waveform.generateWaveform(decodedBuffer);

      // Detect beats
      await beatDetection.analyzeBeat(decodedBuffer);
    } catch (error) {
      console.error('Failed to load and analyze track:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleSetCue = useCallback(
    (cueId: number, time: number) => {
      hotCues.setCue(cueId, time);
    },
    [hotCues.setCue]
  );

  const handleDeleteCue = useCallback(
    (cueId: number) => {
      hotCues.deleteCue(cueId);
    },
    [hotCues.deleteCue]
  );

  const handleCreateLoop = useCallback(
    (bars: 1 | 2 | 4 | 8) => {
      loops.createLoopAt(playbackPosition, bars);
    },
    [loops.createLoopAt, playbackPosition]
  );

  if (!currentTrack) {
    return (
      <div className={`bg-neutral-900 border border-neutral-700 rounded-lg p-6 ${className}`}>
        <div className="text-center text-neutral-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <p className="text-lg font-medium">No Track Loaded</p>
          <p className="text-sm mt-1">Load a track to use beat-matching and waveform tools</p>
        </div>
      </div>
    );
  }

  const beatTimes = beatDetection.beatGrid?.beats || [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Waveform Display */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Professional Waveform</h3>
            <p className="text-xs text-gray-500">Frequency-colored with beat markers</p>
          </div>
          {beatDetection.beatGrid && (
            <div className="text-right">
              <div className="text-sm text-cyan-400 font-mono">
                {beatDetection.beatGrid.bpm.toFixed(1)} BPM
              </div>
              <div className="text-xs text-gray-500">
                Confidence: {(beatDetection.beatGrid.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        <WaveformDisplay
          waveformData={waveform.waveformData}
          beatTimes={beatTimes}
          cues={hotCues.cues}
          loop={loops.loop}
          currentTime={playbackPosition}
          duration={duration}
          onSeek={onSeek}
          isGenerating={waveform.isGenerating || beatDetection.isAnalyzing || isLoadingAudio}
        />

        {(beatDetection.error || waveform.error) && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
            {beatDetection.error || waveform.error}
          </div>
        )}
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Hot Cues Panel */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <HotCuesPanel
            cues={hotCues.cues}
            currentTime={playbackPosition}
            duration={duration}
            onJumpToCue={hotCues.jumpToCue}
            onSetCue={handleSetCue}
            onDeleteCue={handleDeleteCue}
            isLoading={hotCues.isLoading}
          />
        </div>

        {/* Loop Controls Panel */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <LoopControlsPanel
            loop={loops.loop}
            currentTime={playbackPosition}
            onCreateLoop={handleCreateLoop}
            onToggleLoop={loops.toggleLoop}
            onHalveLoop={loops.halveLoop}
            onDoubleLoop={loops.doubleLoop}
            onMoveLoopForward={loops.moveLoopForward}
            onMoveLoopBackward={loops.moveLoopBackward}
            onClearLoop={loops.clearLoop}
            beatGridAvailable={!!beatDetection.beatGrid}
          />
        </div>
      </div>
    </div>
  );
}
