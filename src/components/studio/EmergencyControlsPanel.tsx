/**
 * Phase 7A - Emergency Broadcast Controls Panel
 * 
 * Provides critical safety buttons for live streaming:
 * - PANIC: Instant mute all audio
 * - FADE OUT: Smooth 2-second fade
 * - BRB MODE: Lower music to 15%
 * - RECOVERY: Restore previous state
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Volume2, VolumeX, RotateCcw, Coffee } from 'lucide-react';
import {
  activatePanicMode,
  activateBRBMode,
  activateFadeOutMode,
  recoverFromEmergency,
  getEmergencyState,
  type EmergencyMode,
} from '@/utils/studio/emergencyControls';
import { supabase } from '@/lib/supabase';

interface EmergencyControlsPanelProps {
  isPlaying: boolean;
  volume: number;
  currentTrack: string | null;
  position: number;
  onFadeOut?: () => void;
}

export function EmergencyControlsPanel({
  isPlaying,
  volume,
  currentTrack,
  position,
  onFadeOut,
}: EmergencyControlsPanelProps) {
  const [emergencyMode, setEmergencyMode] = useState<EmergencyMode>('normal');
  const [previousState, setPreviousState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load emergency state on mount
  useEffect(() => {
    loadEmergencyState();

    // Subscribe to emergency state changes
    const channel = supabase
      .channel('emergency_state')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'audio_playback_state',
        },
        (payload) => {
          if (payload.new) {
            setEmergencyMode(payload.new.emergency_mode || 'normal');
            setPreviousState(payload.new.emergency_previous_state);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadEmergencyState = async () => {
    const state = await getEmergencyState();
    if (state) {
      setEmergencyMode(state.mode);
      setPreviousState(state.previousState);
    }
  };

  const handlePanic = async () => {
    setIsLoading(true);
    const currentState = { isPlaying, volume, track: currentTrack, position };
    await activatePanicMode(currentState);
    setIsLoading(false);
  };

  const handleBRB = async () => {
    setIsLoading(true);
    const currentState = { isPlaying, volume, track: currentTrack, position };
    await activateBRBMode(currentState);
    setIsLoading(false);
  };

  const handleFadeOut = async () => {
    setIsLoading(true);
    const currentState = { isPlaying, volume, track: currentTrack, position };
    await activateFadeOutMode(currentState);
    if (onFadeOut) onFadeOut();
    setIsLoading(false);
  };

  const handleRecover = async () => {
    setIsLoading(true);
    await recoverFromEmergency(previousState);
    setIsLoading(false);
  };

  const isEmergency = emergencyMode !== 'normal';

  return (
    <div
      className={
        isEmergency
          ? 'bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-4'
          : 'bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4'
      }
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className={isEmergency ? 'w-5 h-5 text-red-500' : 'w-5 h-5 text-zinc-400'} />
        <h3 className="text-sm font-medium text-white">
          Emergency Broadcast Controls
          {isEmergency && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
              {emergencyMode.toUpperCase()}
            </span>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* PANIC Button */}
        <button
          onClick={handlePanic}
          disabled={isLoading || emergencyMode === 'panic'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
        >
          <VolumeX className="w-4 h-4" />
          PANIC
        </button>

        {/* FADE OUT Button */}
        <button
          onClick={handleFadeOut}
          disabled={isLoading || emergencyMode === 'fade_out'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          Fade Out
        </button>

        {/* BRB MODE Button */}
        <button
          onClick={handleBRB}
          disabled={isLoading || emergencyMode === 'brb'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Coffee className="w-4 h-4" />
          BRB Mode
        </button>

        {/* RECOVERY Button */}
        <button
          onClick={handleRecover}
          disabled={isLoading || !isEmergency || !previousState}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Recover
        </button>
      </div>

      {/* Status Info */}
      {isEmergency && (
        <div className="mt-3 p-2 bg-red-950/50 rounded text-xs text-red-200">
          <div className="font-semibold mb-1">Emergency Mode Active:</div>
          {emergencyMode === 'panic' && <div>All audio muted instantly</div>}
          {emergencyMode === 'brb' && <div>Music lowered to 15% volume</div>}
          {emergencyMode === 'fade_out' && <div>Smooth fade to silence</div>}
        </div>
      )}
    </div>
  );
}
