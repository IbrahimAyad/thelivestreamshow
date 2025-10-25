import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

// ✅ SINGLETON PATTERN: Ensure only one Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    // Diagnostic: Log Supabase configuration at startup (only once)
    const projectRef = supabaseUrl?.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
    console.info('[SUPABASE] ✓ Client initialized (singleton)');
    console.info('[SUPABASE] URL:', supabaseUrl);
    console.info('[SUPABASE] PROJ REF:', projectRef);
    console.info('[SUPABASE] MUSIC BUCKET:', 'music');
  } else {
    console.warn('[SUPABASE] ⚠️ Attempted to create multiple clients - using existing instance');
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// Database types
export interface QuestionBanner {
  id: string
  question_text: string
  is_visible: boolean
  animation_speed: number
  background_color: string
  text_color: string
  created_at: string
  updated_at: string
}

export interface BroadcastGraphic {
  id: string
  graphic_type: string
  is_visible: boolean
  position: string
  config: any
  html_file?: string | null
  show_id?: string
  created_at: string
  updated_at: string
}

export interface LowerThird {
  id: string
  template_type: string
  title_text: string
  subtitle_text: string
  is_visible: boolean
  position: string
  animation_style: string
  background_color: string
  text_color: string
  font_size: string
  duration: number
  show_id?: string
  created_at: string
}

export interface AIEngagement {
  id: string
  feature_type: string
  is_active: boolean
  config: any
  created_at: string
  updated_at: string
}

export interface ShowQuestion {
  id: string
  topic: string
  question_text: string
  tts_audio_url: string | null
  tts_generated: boolean
  is_played: boolean
  position: number
  show_on_overlay: boolean
  overlay_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface ShowSegment {
  id: string
  segment_name: string
  segment_topic: string | null
  segment_question: string | null
  is_active: boolean
  timer_seconds: number
  timer_running: boolean
  segment_order: number
  created_at: string
  updated_at: string
}

export interface SoundEffect {
  id: string
  effect_name: string
  effect_type: string
  audio_url: string | null
  volume: number
  is_playing: boolean
  created_at: string
}

export interface BroadcastSettingsValue {
  // Layout preset settings
  layout_preset?: 'default' | 'theater' | 'interview' | 'camera-focus'
  mode?: 'default' | 'theater' | 'interview' | 'camera-focus'
  
  // Color theme settings
  color_theme?: 'cyber-blue' | 'neon-red' | 'matrix-green'
  theme?: string
  
  // Allow any other settings
  [key: string]: any
}

export interface BroadcastSettings {
  id: string
  setting_type: string
  setting_value: BroadcastSettingsValue
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EpisodeInfo {
  id: string
  episode_number: number
  episode_date: string
  episode_title: string
  episode_topic: string
  is_active: boolean
  is_visible?: boolean  // ✅ Control broadcast visibility
  created_at: string
  updated_at: string
}

export interface LowerThirdTemplate {
  id: string
  template_name: string
  guest_name: string
  guest_title: string
  guest_social: string
  is_visible: boolean
  animation_style: string
  created_at: string
  updated_at: string
}

export interface ShowBookmark {
  id: string
  timestamp_seconds: number
  segment_id: string
  bookmark_label: string
  bookmark_notes: string
  created_at: string
}

export interface OperatorNote {
  id: string
  segment_id: string
  note_text: string
  note_type: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface ShowMetadata {
  id: string
  show_start_time: string | null
  total_elapsed_seconds: number
  is_live: boolean
  is_rehearsal: boolean
  auto_advance_enabled: boolean
  active_session_id: string | null
  episode_number: number | null
  episode_title: string | null
  episode_topic: string | null
  created_at: string
  updated_at: string
}

export interface BetaBotSession {
  id: string
  session_name: string
  started_at: string
  ended_at: string | null
  is_active: boolean
  created_at: string
}

export interface BetaBotTranscript {
  id: string
  session_id: string
  transcript_text: string
  confidence: number | null
  timestamp_seconds: number | null
  created_at: string
}

// Show Intro Sequence State Type
export interface ShowIntroState {
  id: string
  current_step: 'idle' | 'song1_playing' | 'crossfading' | 'song2_playing' | 'game_active' | 'resuming' | 'song2_finishing' | 'complete'
  is_running: boolean
  is_paused: boolean
  elapsed_time: number
  show_dj_visualizer: boolean
  show_tomato_game: boolean
  song1_duration: number
  crossfade_duration: number
  song2_pause_point: number
  transition_delay: number
  error: string | null
  created_at: string
  updated_at: string
}

// StreamStudio Audio Sync Types
export interface AudioPlaybackState {
  id: string
  is_playing: boolean | null
  current_track_id: string | null
  volume: number | null
  is_muted: boolean | null
  emergency_mode: string | null
  emergency_previous_state: any | null
  audio_bass: number | null
  audio_mid: number | null
  audio_high: number | null
  is_ducking: boolean | null
  is_looping: boolean | null
  is_shuffling: boolean | null
  playback_position: number | null
  playlist_id: string | null
  updated_at: string | null
}
