/**
 * Phase 7A - Emergency Broadcast Controls
 * 
 * Provides instant safety features for live streaming:
 * - PANIC: Instant mute of all audio
 * - FADE OUT: Smooth 2-second fade to silence
 * - BRB MODE: Auto-fade music to 15% volume
 * - RECOVERY: Restore previous audio state
 */

import { supabase } from '../lib/supabase';

export type EmergencyMode = 'normal' | 'panic' | 'brb' | 'fade_out';

export interface EmergencyState {
  mode: EmergencyMode;
  previousState: {
    isPlaying: boolean;
    volume: number;
    track: string | null;
    position: number;
  } | null;
}

/**
 * Activate PANIC mode - instant mute of all audio
 */
export async function activatePanicMode(
  currentState: { isPlaying: boolean; volume: number; track: string | null; position: number }
): Promise<void> {
  try {
    await supabase
      .from('audio_playback_state')
      .update({
        emergency_mode: 'panic',
        emergency_previous_state: currentState,
        volume: 0,
        is_playing: false,
      })
      .eq('id', 1);
    
    console.log('🚨 PANIC MODE ACTIVATED - All audio muted');
  } catch (error) {
    console.error('Failed to activate panic mode:', error);
  }
}

/**
 * Activate BRB (Be Right Back) mode - fade music to 15%
 */
export async function activateBRBMode(
  currentState: { isPlaying: boolean; volume: number; track: string | null; position: number }
): Promise<void> {
  try {
    await supabase
      .from('audio_playback_state')
      .update({
        emergency_mode: 'brb',
        emergency_previous_state: currentState,
        volume: 15, // 15% volume for background music during BRB
      })
      .eq('id', 1);
    
    console.log('🔄 BRB MODE ACTIVATED - Music lowered to 15%');
  } catch (error) {
    console.error('Failed to activate BRB mode:', error);
  }
}

/**
 * Activate FADE OUT mode - smooth 2-second fade to silence
 */
export async function activateFadeOutMode(
  currentState: { isPlaying: boolean; volume: number; track: string | null; position: number }
): Promise<void> {
  try {
    await supabase
      .from('audio_playback_state')
      .update({
        emergency_mode: 'fade_out',
        emergency_previous_state: currentState,
      })
      .eq('id', 1);
    
    console.log('📉 FADE OUT MODE ACTIVATED - 2-second fade to silence');
  } catch (error) {
    console.error('Failed to activate fade out mode:', error);
  }
}

/**
 * Recover from emergency mode - restore previous state
 */
export async function recoverFromEmergency(
  previousState: { isPlaying: boolean; volume: number; track: string | null; position: number } | null
): Promise<void> {
  if (!previousState) {
    console.warn('No previous state to recover');
    return;
  }

  try {
    await supabase
      .from('audio_playback_state')
      .update({
        emergency_mode: 'normal',
        emergency_previous_state: null,
        volume: previousState.volume,
        is_playing: previousState.isPlaying,
        playback_position: previousState.position,
      })
      .eq('id', 1);
    
    console.log('✅ EMERGENCY RECOVERY - Previous state restored');
  } catch (error) {
    console.error('Failed to recover from emergency:', error);
  }
}

/**
 * Get current emergency state
 */
export async function getEmergencyState(): Promise<EmergencyState | null> {
  try {
    // ✅ BACKEND FIX: Use RPC function instead of direct table query
    const { data, error } = await supabase.rpc('get_emergency_state');

    if (error) throw error;

    if (!data) return null;

    return {
      mode: (data.emergency_mode as EmergencyMode) || 'normal',
      previousState: data.emergency_previous_state as any,
    };
  } catch (error) {
    console.error('Failed to get emergency state:', error);
    return null;
  }
}

/**
 * Execute smooth fade out over duration
 */
export function executeFadeOut(
  audioElement: HTMLAudioElement | null,
  duration: number = 2000
): void {
  if (!audioElement) return;

  const startVolume = audioElement.volume;
  const startTime = Date.now();
  const fadeInterval = 50; // Update every 50ms

  const fadeStep = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const newVolume = startVolume * (1 - progress);

    audioElement.volume = newVolume;

    if (progress < 1) {
      setTimeout(fadeStep, fadeInterval);
    } else {
      audioElement.pause();
      audioElement.volume = 0;
    }
  };

  fadeStep();
}
