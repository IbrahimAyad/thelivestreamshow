/**
 * Audio Layer Manager
 * 
 * Manages sound playback for broadcast graphics overlays with support for:
 * - Auto-play when overlays become visible
 * - Volume control
 * - Audio ducking integration with background music
 * - Multiple concurrent sound playback
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

type MusicTrack = Database['public']['Tables']['music_library']['Row'];

export interface AudioConfig {
  enabled: boolean;
  sound_drop_id: string | null;
  auto_play: boolean;
  volume: number; // 0.0 to 1.0
  enable_ducking: boolean;
  ducking_level: number; // 0.0 to 1.0
}

export interface AudioPlaybackTask {
  id: string;
  audio: HTMLAudioElement;
  soundDropId: string;
  config: AudioConfig;
  onEnded?: () => void;
}

/**
 * Singleton audio layer manager
 */
class AudioLayerManager {
  private static instance: AudioLayerManager | null = null;
  private audioContext: AudioContext | null = null;
  private activeTasks: Map<string, AudioPlaybackTask> = new Map();
  private maxConcurrentSounds = 3;
  private supabase: ReturnType<typeof createClient<Database>> | null = null;
  
  // Track original background music volume for ducking
  private originalBackgroundVolume: number = 0.7;
  private isDucking = false;

  private constructor() {
    // Initialize audio context on first user interaction (browser policy)
    this.initAudioContext();
  }

  static getInstance(): AudioLayerManager {
    if (!AudioLayerManager.instance) {
      AudioLayerManager.instance = new AudioLayerManager();
    }
    return AudioLayerManager.instance;
  }

  /**
   * Initialize Supabase client for fetching sound drops
   */
  initialize(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Initialize Web Audio API context
   */
  private initAudioContext() {
    if (typeof window === 'undefined') return;

    // Create audio context on first user interaction
    const initContext = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🔊 Audio context initialized');
        document.removeEventListener('click', initContext);
        document.removeEventListener('keydown', initContext);
      }
    };

    document.addEventListener('click', initContext, { once: true });
    document.addEventListener('keydown', initContext, { once: true });
  }

  /**
   * Play sound drop for an overlay
   */
  async playOverlaySound(
    soundDropId: string,
    config: Partial<AudioConfig> = {},
    onEnded?: () => void
  ): Promise<void> {
    if (!this.supabase) {
      console.error('❌ AudioLayerManager not initialized. Call initialize() first.');
      return;
    }

    // Check concurrent sound limit
    if (this.activeTasks.size >= this.maxConcurrentSounds) {
      console.warn('⚠️ Max concurrent sounds reached, skipping playback');
      return;
    }

    try {
      // Fetch sound drop details from database
      const { data: soundDrop, error } = await this.supabase
        .from('music_library')
        .select('*')
        .eq('id', soundDropId)
        .single();

      if (error || !soundDrop) {
        console.error('❌ Failed to fetch sound drop:', error?.message);
        return;
      }

      // Create full config with defaults
      const fullConfig: AudioConfig = {
        enabled: true,
        sound_drop_id: soundDropId,
        auto_play: true,
        volume: config.volume ?? 0.8,
        enable_ducking: config.enable_ducking ?? false,
        ducking_level: config.ducking_level ?? 0.3,
      };

      // Create and configure audio element
      const audio = new Audio();
      audio.src = soundDrop.file_url || '';
      audio.volume = fullConfig.volume;
      audio.preload = 'auto';

      // Apply ducking if enabled
      if (fullConfig.enable_ducking) {
        this.applyDucking(fullConfig.ducking_level);
      }

      // Create playback task
      const taskId = `${soundDropId}-${Date.now()}`;
      const task: AudioPlaybackTask = {
        id: taskId,
        audio,
        soundDropId,
        config: fullConfig,
        onEnded,
      };

      // Setup event handlers
      audio.onended = () => {
        this.handleAudioEnded(taskId);
      };

      audio.onerror = (err) => {
        console.error(`❌ Audio playback error for ${soundDrop.title}:`, err);
        this.handleAudioEnded(taskId);
      };

      // Store task and play
      this.activeTasks.set(taskId, task);
      
      await audio.play();
      console.log(`🔊 Playing sound: ${soundDrop.title} (volume: ${Math.round(fullConfig.volume * 100)}%)`);

    } catch (error) {
      console.error('❌ Error playing overlay sound:', error);
    }
  }

  /**
   * Handle audio playback completion
   */
  private handleAudioEnded(taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    // Remove ducking if this was the last ducking sound
    if (task.config.enable_ducking) {
      const hasDuckingSounds = Array.from(this.activeTasks.values())
        .filter(t => t.id !== taskId && t.config.enable_ducking)
        .length > 0;

      if (!hasDuckingSounds) {
        this.removeDucking();
      }
    }

    // Call completion callback
    if (task.onEnded) {
      task.onEnded();
    }

    // Cleanup
    task.audio.remove();
    this.activeTasks.delete(taskId);

    console.log(`✅ Sound playback completed: ${taskId}`);
  }

  /**
   * Apply audio ducking to background music
   */
  private applyDucking(duckingLevel: number) {
    if (this.isDucking) return;

    this.isDucking = true;
    const targetVolume = this.originalBackgroundVolume * (1 - duckingLevel);

    // Emit ducking event for global music engine
    const duckingEvent = new CustomEvent('audio-ducking', {
      detail: {
        enabled: true,
        targetVolume,
        duckingLevel,
      },
    });
    window.dispatchEvent(duckingEvent);

    console.log(`🔊 Applying audio ducking: ${Math.round((1 - duckingLevel) * 100)}% of original volume`);
  }

  /**
   * Remove audio ducking from background music
   */
  private removeDucking() {
    if (!this.isDucking) return;

    this.isDucking = false;

    // Emit un-ducking event
    const duckingEvent = new CustomEvent('audio-ducking', {
      detail: {
        enabled: false,
        targetVolume: this.originalBackgroundVolume,
        duckingLevel: 0,
      },
    });
    window.dispatchEvent(duckingEvent);

    console.log('🔊 Removing audio ducking');
  }

  /**
   * Stop a specific sound playback
   */
  stopSound(taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.audio.pause();
    task.audio.currentTime = 0;
    this.handleAudioEnded(taskId);
  }

  /**
   * Stop all active sounds
   */
  stopAllSounds() {
    const taskIds = Array.from(this.activeTasks.keys());
    taskIds.forEach(taskId => this.stopSound(taskId));
  }

  /**
   * Preview a sound drop (for UI preview buttons)
   */
  async previewSound(soundDropId: string, duration: number = 3000): Promise<void> {
    await this.playOverlaySound(
      soundDropId,
      { volume: 0.5, enable_ducking: false },
      () => {
        console.log('🎵 Preview ended');
      }
    );

    // Stop preview after duration
    setTimeout(() => {
      const previewTask = Array.from(this.activeTasks.values())
        .find(task => task.soundDropId === soundDropId);
      
      if (previewTask) {
        this.stopSound(previewTask.id);
      }
    }, duration);
  }

  /**
   * Set original background music volume (for ducking calculations)
   */
  setOriginalBackgroundVolume(volume: number) {
    this.originalBackgroundVolume = volume;
  }

  /**
   * Get active playback tasks count
   */
  getActiveTasksCount(): number {
    return this.activeTasks.size;
  }

  /**
   * Check if a specific sound is currently playing
   */
  isSoundPlaying(soundDropId: string): boolean {
    return Array.from(this.activeTasks.values())
      .some(task => task.soundDropId === soundDropId);
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.stopAllSounds();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const audioLayerManager = AudioLayerManager.getInstance();

// Export for testing
export { AudioLayerManager };
