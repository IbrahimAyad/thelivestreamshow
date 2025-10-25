import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

// Supabase client singleton to prevent multiple instances
let supabaseInstance: any = null

// Create singleton instance
if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export const supabase = supabaseInstance

// Database types
export type VideoQueue = {
  id: string
  video_id: string
  title: string
  thumbnail_url: string | null
  duration: number | null
  channel_title: string | null
  position: number
  status: string
  created_at: string
  updated_at: string
}

export type RundownSegment = {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  position: number
  status: string
  segment_type: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export type Note = {
  id: string
  content: string
  note_type: string
  author: string | null
  target_role: string | null
  segment_id: string | null
  is_cue_card: boolean
  created_at: string
  updated_at: string
}

export type AudioPreset = {
  id: string
  name: string
  description: string | null
  config: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TimerConfig = {
  id: string
  name: string
  timer_type: string
  duration_seconds: number | null
  is_running: boolean
  current_value: number
  created_at: string
  updated_at: string
}

export type MediaLibraryItem = {
  id: string
  name: string
  file_url: string
  file_type: 'video' | 'image'
  category: string | null
  show_id: string | null
  tags: string[] | null
  duration_seconds: number | null
  file_size_bytes: number
  thumbnail_url: string | null
  metadata: any
  created_at: string
  updated_at: string
}

export type Playlist = {
  id: string
  name: string
  description: string | null
  is_autoplay: boolean
  created_at: string
  updated_at: string
}

export type PlaylistItem = {
  id: string
  playlist_id: string
  media_id: string
  position: number
  created_at: string
}

export type SceneTemplate = {
  id: string
  name: string
  description: string | null
  layout_type: string
  thumbnail_url: string | null
  config: any
  is_custom: boolean
  created_at: string
  updated_at: string
}

export type AudioTrack = {
  id: string
  name: string
  file_url: string
  duration_seconds: number | null
  category: string
  created_at: string
  updated_at: string
}

export type SoundEffect = {
  id: string
  name: string
  file_url: string
  hotkey: string | null
  category: string
  created_at: string
  updated_at: string
}

export type StreamProfile = {
  id: string
  name: string
  show_id: string | null
  scene_config: any
  audio_config: any
  quality_config: any
  source_config: any
  created_at: string
  updated_at: string
}

export type ClipMarker = {
  id: string
  timestamp: string
  title: string
  notes: string | null
  show_id: string | null
  episode_id: string | null
  is_clipped: boolean
  created_at: string
}

export type Transition = {
  id: string
  name: string
  type: string
  duration_ms: number
  config: any
  created_at: string
}

export type StreamSource = {
  id: string
  source_type: string
  source_url: string | null
  media_id: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  is_active: boolean
  volume: number
  config: any
  created_at: string
  updated_at: string
}
