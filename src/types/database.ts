export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          command: string
          created_at: string | null
          executed_action: Json | null
          id: string
          intent: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          command: string
          created_at?: string | null
          executed_action?: Json | null
          id?: string
          intent: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          command?: string
          created_at?: string | null
          executed_action?: Json | null
          id?: string
          intent?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_coordinator_logs: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      ai_engagement: {
        Row: {
          config: Json | null
          created_at: string | null
          feature_type: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          feature_type: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          feature_type?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audio_playback_state: {
        Row: {
          audio_bass: number | null
          audio_high: number | null
          audio_mid: number | null
          current_track_id: string | null
          emergency_mode: string | null
          emergency_previous_state: Json | null
          id: string
          is_ducking: boolean | null
          is_looping: boolean | null
          is_muted: boolean | null
          is_playing: boolean | null
          is_shuffling: boolean | null
          playback_position: number | null
          playlist_id: string | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          audio_bass?: number | null
          audio_high?: number | null
          audio_mid?: number | null
          current_track_id?: string | null
          emergency_mode?: string | null
          emergency_previous_state?: Json | null
          id?: string
          is_ducking?: boolean | null
          is_looping?: boolean | null
          is_muted?: boolean | null
          is_playing?: boolean | null
          is_shuffling?: boolean | null
          playback_position?: number | null
          playlist_id?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          audio_bass?: number | null
          audio_high?: number | null
          audio_mid?: number | null
          current_track_id?: string | null
          emergency_mode?: string | null
          emergency_previous_state?: Json | null
          id?: string
          is_ducking?: boolean | null
          is_looping?: boolean | null
          is_muted?: boolean | null
          is_playing?: boolean | null
          is_shuffling?: boolean | null
          playback_position?: number | null
          playlist_id?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      audio_presets: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audio_settings: {
        Row: {
          auto_eq_matching: boolean | null
          background_music_volume: number | null
          crossfade_duration: number | null
          crossfade_enabled: boolean | null
          ducking_enabled: boolean | null
          ducking_level: number | null
          id: string
          jingles_volume: number | null
          show_waveform: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_eq_matching?: boolean | null
          background_music_volume?: number | null
          crossfade_duration?: number | null
          crossfade_enabled?: boolean | null
          ducking_enabled?: boolean | null
          ducking_level?: number | null
          id?: string
          jingles_volume?: number | null
          show_waveform?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_eq_matching?: boolean | null
          background_music_volume?: number | null
          crossfade_duration?: number | null
          crossfade_enabled?: boolean | null
          ducking_enabled?: boolean | null
          ducking_level?: number | null
          id?: string
          jingles_volume?: number | null
          show_waveform?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audio_tracks: {
        Row: {
          created_at: string | null
          duration: number | null
          file_url: string
          id: string
          is_background: boolean | null
          name: string
          tags: string[] | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_url: string
          id?: string
          is_background?: boolean | null
          name: string
          tags?: string[] | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_url?: string
          id?: string
          is_background?: boolean | null
          name?: string
          tags?: string[] | null
          volume?: number | null
        }
        Relationships: []
      }
      auto_dj_settings: {
        Row: {
          enabled: boolean | null
          energy_style: string | null
          id: string
          prefer_harmonic: boolean | null
          recency_limit: number | null
          strict_bpm: boolean | null
          updated_at: string | null
        }
        Insert: {
          enabled?: boolean | null
          energy_style?: string | null
          id?: string
          prefer_harmonic?: boolean | null
          recency_limit?: number | null
          strict_bpm?: boolean | null
          updated_at?: string | null
        }
        Update: {
          enabled?: boolean | null
          energy_style?: string | null
          id?: string
          prefer_harmonic?: boolean | null
          recency_limit?: number | null
          strict_bpm?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_config: {
        Row: {
          ai_context_window: number | null
          ai_model: string | null
          ai_provider: string | null
          allowed_action_types: Json | null
          auto_execute_enabled: boolean | null
          automation_enabled: boolean | null
          confidence_auto_execute: number | null
          confidence_log_only: number | null
          confidence_suggest: number | null
          cooldown_seconds: number | null
          debounce_seconds: number | null
          emergency_stop: boolean | null
          id: string
          max_actions_per_minute: number | null
          metadata: Json | null
          obs_enabled: boolean | null
          obs_password: string | null
          obs_websocket_url: string | null
          require_confirmation_for: Json | null
          show_suggestions_ui: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_context_window?: number | null
          ai_model?: string | null
          ai_provider?: string | null
          allowed_action_types?: Json | null
          auto_execute_enabled?: boolean | null
          automation_enabled?: boolean | null
          confidence_auto_execute?: number | null
          confidence_log_only?: number | null
          confidence_suggest?: number | null
          cooldown_seconds?: number | null
          debounce_seconds?: number | null
          emergency_stop?: boolean | null
          id?: string
          max_actions_per_minute?: number | null
          metadata?: Json | null
          obs_enabled?: boolean | null
          obs_password?: string | null
          obs_websocket_url?: string | null
          require_confirmation_for?: Json | null
          show_suggestions_ui?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_context_window?: number | null
          ai_model?: string | null
          ai_provider?: string | null
          allowed_action_types?: Json | null
          auto_execute_enabled?: boolean | null
          automation_enabled?: boolean | null
          confidence_auto_execute?: number | null
          confidence_log_only?: number | null
          confidence_suggest?: number | null
          cooldown_seconds?: number | null
          debounce_seconds?: number | null
          emergency_stop?: boolean | null
          id?: string
          max_actions_per_minute?: number | null
          metadata?: Json | null
          obs_enabled?: boolean | null
          obs_password?: string | null
          obs_websocket_url?: string | null
          require_confirmation_for?: Json | null
          show_suggestions_ui?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_events: {
        Row: {
          action_params: Json | null
          action_result: Json | null
          action_type: string
          approved_at: string | null
          approved_by: string | null
          confidence: number | null
          created_at: string | null
          error_message: string | null
          error_stack: string | null
          execution_time_ms: number | null
          id: string
          outcome: string | null
          priority: number | null
          question_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          segment_id: string | null
          show_id: string | null
          status: string
          trigger_data: Json | null
          trigger_source: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_params?: Json | null
          action_result?: Json | null
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          execution_time_ms?: number | null
          id?: string
          outcome?: string | null
          priority?: number | null
          question_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          segment_id?: string | null
          show_id?: string | null
          status?: string
          trigger_data?: Json | null
          trigger_source?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_params?: Json | null
          action_result?: Json | null
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          execution_time_ms?: number | null
          id?: string
          outcome?: string | null
          priority?: number | null
          question_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          segment_id?: string | null
          show_id?: string | null
          status?: string
          trigger_data?: Json | null
          trigger_source?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_bot_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      betabot_conversation_log: {
        Row: {
          audio_timestamp: string | null
          created_at: string | null
          id: string
          session_id: string | null
          speaker_type: string | null
          transcript_text: string
        }
        Insert: {
          audio_timestamp?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          speaker_type?: string | null
          transcript_text: string
        }
        Update: {
          audio_timestamp?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          speaker_type?: string | null
          transcript_text?: string
        }
        Relationships: []
      }
      betabot_generated_questions: {
        Row: {
          confidence_score: number | null
          conversation_context: string | null
          created_at: string | null
          generated_by: string | null
          id: string
          is_approved: boolean | null
          is_used: boolean | null
          question_text: string
        }
        Insert: {
          confidence_score?: number | null
          conversation_context?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_approved?: boolean | null
          is_used?: boolean | null
          question_text: string
        }
        Update: {
          confidence_score?: number | null
          conversation_context?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_approved?: boolean | null
          is_used?: boolean | null
          question_text?: string
        }
        Relationships: []
      }
      betabot_interactions: {
        Row: {
          ai_provider: string | null
          bot_response: string | null
          created_at: string | null
          id: string
          interaction_type: string | null
          response_time_ms: number | null
          user_input: string | null
        }
        Insert: {
          ai_provider?: string | null
          bot_response?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          response_time_ms?: number | null
          user_input?: string | null
        }
        Update: {
          ai_provider?: string | null
          bot_response?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          response_time_ms?: number | null
          user_input?: string | null
        }
        Relationships: []
      }
      betabot_media_browser: {
        Row: {
          content_type: string
          created_at: string | null
          id: string
          is_visible: boolean | null
          search_query: string
          session_id: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          search_query: string
          session_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          search_query?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "betabot_media_browser_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "betabot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      betabot_mood: {
        Row: {
          id: string
          incoming_count: number | null
          mood: string
          movement: string | null
          show_incoming: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          incoming_count?: number | null
          mood?: string
          movement?: string | null
          show_incoming?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          incoming_count?: number | null
          mood?: string
          movement?: string | null
          show_incoming?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      betabot_movement: {
        Row: {
          id: string
          is_active: boolean | null
          movement: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          movement?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          movement?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      betabot_sessions: {
        Row: {
          created_at: string | null
          current_state: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          mode: string | null
          session_name: string
          show_id: string | null
          started_at: string | null
          total_direct_interactions: number | null
          total_questions_asked: number | null
          total_questions_generated: number | null
          total_responses: number | null
          total_transcript_words: number | null
          tts_provider: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_state?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          session_name: string
          show_id?: string | null
          started_at?: string | null
          total_direct_interactions?: number | null
          total_questions_asked?: number | null
          total_questions_generated?: number | null
          total_responses?: number | null
          total_transcript_words?: number | null
          tts_provider?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_state?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          session_name?: string
          show_id?: string | null
          started_at?: string | null
          total_direct_interactions?: number | null
          total_questions_asked?: number | null
          total_questions_generated?: number | null
          total_responses?: number | null
          total_transcript_words?: number | null
          tts_provider?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      betabot_transcripts: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          session_id: string | null
          timestamp_seconds: number | null
          transcript_text: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          timestamp_seconds?: number | null
          transcript_text: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          timestamp_seconds?: number | null
          transcript_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "betabot_transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "betabot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      betabot_visual_content: {
        Row: {
          content_type: string | null
          content_urls: Json | null
          conversation_context: string | null
          displayed_at: string | null
          id: string
          search_query: string
          session_id: string | null
          triggered_by: string | null
        }
        Insert: {
          content_type?: string | null
          content_urls?: Json | null
          conversation_context?: string | null
          displayed_at?: string | null
          id?: string
          search_query: string
          session_id?: string | null
          triggered_by?: string | null
        }
        Update: {
          content_type?: string | null
          content_urls?: Json | null
          conversation_context?: string | null
          displayed_at?: string | null
          id?: string
          search_query?: string
          session_id?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      broadcast_cameras: {
        Row: {
          camera_device_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_mirrored: boolean | null
          label: string | null
          position: string
          updated_at: string | null
        }
        Insert: {
          camera_device_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mirrored?: boolean | null
          label?: string | null
          position: string
          updated_at?: string | null
        }
        Update: {
          camera_device_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mirrored?: boolean | null
          label?: string | null
          position?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      broadcast_graphics: {
        Row: {
          auto_play_sound: boolean | null
          config: Json | null
          created_at: string | null
          display_mode: string | null
          graphic_type: string
          html_file: string | null
          id: string
          is_template: boolean | null
          is_visible: boolean | null
          position: string | null
          show_id: string | null
          sound_drop_id: string | null
          updated_at: string | null
          z_index: number | null
        }
        Insert: {
          auto_play_sound?: boolean | null
          config?: Json | null
          created_at?: string | null
          display_mode?: string | null
          graphic_type: string
          html_file?: string | null
          id?: string
          is_template?: boolean | null
          is_visible?: boolean | null
          position?: string | null
          show_id?: string | null
          sound_drop_id?: string | null
          updated_at?: string | null
          z_index?: number | null
        }
        Update: {
          auto_play_sound?: boolean | null
          config?: Json | null
          created_at?: string | null
          display_mode?: string | null
          graphic_type?: string
          html_file?: string | null
          id?: string
          is_template?: boolean | null
          is_visible?: boolean | null
          position?: string | null
          show_id?: string | null
          sound_drop_id?: string | null
          updated_at?: string | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_graphics_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_metadata: {
        Row: {
          active_sponsor_id: string | null
          created_at: string | null
          current_episode_id: string | null
          current_hashtag: string | null
          current_show_id: string | null
          current_topic: string | null
          display_social_media: boolean | null
          display_sponsors: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          active_sponsor_id?: string | null
          created_at?: string | null
          current_episode_id?: string | null
          current_hashtag?: string | null
          current_show_id?: string | null
          current_topic?: string | null
          display_social_media?: boolean | null
          display_sponsors?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          active_sponsor_id?: string | null
          created_at?: string | null
          current_episode_id?: string | null
          current_hashtag?: string | null
          current_show_id?: string | null
          current_topic?: string | null
          display_social_media?: boolean | null
          display_sponsors?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_broadcast_metadata_episode"
            columns: ["current_episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_broadcast_metadata_show"
            columns: ["current_show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_scenes: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          layout_type: string
          scene_name: string
          show_id: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout_type: string
          scene_name: string
          show_id?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout_type?: string
          scene_name?: string
          show_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_scenes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_settings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          setting_type: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          setting_type: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          setting_type?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clip_markers: {
        Row: {
          created_at: string | null
          episode_id: string | null
          id: string
          is_clipped: boolean | null
          notes: string | null
          show_id: string | null
          timestamp: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          episode_id?: string | null
          id?: string
          is_clipped?: boolean | null
          notes?: string | null
          show_id?: string | null
          timestamp?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          episode_id?: string | null
          id?: string
          is_clipped?: boolean | null
          notes?: string | null
          show_id?: string | null
          timestamp?: string | null
          title?: string | null
        }
        Relationships: []
      }
      discord_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          notify_guest: boolean | null
          notify_schedule: boolean | null
          notify_stream_end: boolean | null
          notify_stream_start: boolean | null
          notify_topic_change: boolean | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notify_guest?: boolean | null
          notify_schedule?: boolean | null
          notify_stream_end?: boolean | null
          notify_stream_start?: boolean | null
          notify_topic_change?: boolean | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notify_guest?: boolean | null
          notify_schedule?: boolean | null
          notify_stream_end?: boolean | null
          notify_stream_start?: boolean | null
          notify_topic_change?: boolean | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      dj_analytics: {
        Row: {
          created_at: string | null
          energy_curve: Json | null
          genre_breakdown: Json | null
          id: string
          session_end: string | null
          session_id: string
          session_start: string
          total_duration_seconds: number | null
          total_tracks_played: number | null
          track_history: Json | null
          transition_scores: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          energy_curve?: Json | null
          genre_breakdown?: Json | null
          id?: string
          session_end?: string | null
          session_id: string
          session_start: string
          total_duration_seconds?: number | null
          total_tracks_played?: number | null
          track_history?: Json | null
          transition_scores?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          energy_curve?: Json | null
          genre_breakdown?: Json | null
          id?: string
          session_end?: string | null
          session_id?: string
          session_start?: string
          total_duration_seconds?: number | null
          total_tracks_played?: number | null
          track_history?: Json | null
          transition_scores?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      effect_variations: {
        Row: {
          created_at: string | null
          effects_config: Json
          file_path: string
          file_url: string
          id: string
          original_track_id: string
          variation_name: string
        }
        Insert: {
          created_at?: string | null
          effects_config: Json
          file_path: string
          file_url: string
          id?: string
          original_track_id: string
          variation_name: string
        }
        Update: {
          created_at?: string | null
          effects_config?: Json
          file_path?: string
          file_url?: string
          id?: string
          original_track_id?: string
          variation_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "effect_variations_original_track_id_fkey"
            columns: ["original_track_id"]
            isOneToOne: false
            referencedRelation: "music_library"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_questions: {
        Row: {
          created_at: string | null
          enhanced_text: string
          id: string
          original_question_id: string | null
          search_result_id: string | null
        }
        Insert: {
          created_at?: string | null
          enhanced_text: string
          id?: string
          original_question_id?: string | null
          search_result_id?: string | null
        }
        Update: {
          created_at?: string | null
          enhanced_text?: string
          id?: string
          original_question_id?: string | null
          search_result_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_questions_original_question_id_fkey"
            columns: ["original_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_questions_search_result_id_fkey"
            columns: ["search_result_id"]
            isOneToOne: false
            referencedRelation: "search_results"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_guests: {
        Row: {
          appearance_order: number | null
          created_at: string | null
          episode_id: string
          guest_id: string
          id: string
          is_featured: boolean | null
          role: string | null
        }
        Insert: {
          appearance_order?: number | null
          created_at?: string | null
          episode_id: string
          guest_id: string
          id?: string
          is_featured?: boolean | null
          role?: string | null
        }
        Update: {
          appearance_order?: number | null
          created_at?: string | null
          episode_id?: string
          guest_id?: string
          id?: string
          is_featured?: boolean | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_episode_guests_episode"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_episode_guests_guest"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_info: {
        Row: {
          created_at: string | null
          episode_date: string | null
          episode_number: number | null
          episode_title: string | null
          episode_topic: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          episode_date?: string | null
          episode_number?: number | null
          episode_title?: string | null
          episode_topic?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          episode_date?: string | null
          episode_number?: number | null
          episode_title?: string | null
          episode_topic?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      episodes: {
        Row: {
          air_date: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          episode_number: number
          id: string
          is_live: boolean | null
          season_number: number | null
          show_id: string
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          air_date?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          episode_number: number
          id?: string
          is_live?: boolean | null
          season_number?: number | null
          show_id: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          air_date?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          episode_number?: number
          id?: string
          is_live?: boolean | null
          season_number?: number | null
          show_id?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_episodes_show"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      global_question_performance: {
        Row: {
          avg_conversation_depth: number | null
          avg_engagement: number | null
          avg_host_satisfaction: number | null
          best_performing_contexts: Json | null
          first_seen: string | null
          id: string
          last_seen: string | null
          most_common_topics: string[] | null
          question_embedding: string
          question_text_hash: string
          success_rate: number | null
          total_times_asked: number | null
          trending_score: number | null
          updated_at: string | null
        }
        Insert: {
          avg_conversation_depth?: number | null
          avg_engagement?: number | null
          avg_host_satisfaction?: number | null
          best_performing_contexts?: Json | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          most_common_topics?: string[] | null
          question_embedding: string
          question_text_hash: string
          success_rate?: number | null
          total_times_asked?: number | null
          trending_score?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_conversation_depth?: number | null
          avg_engagement?: number | null
          avg_host_satisfaction?: number | null
          best_performing_contexts?: Json | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          most_common_topics?: string[] | null
          question_embedding?: string
          question_text_hash?: string
          success_rate?: number | null
          total_times_asked?: number | null
          trending_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      graphics_presets: {
        Row: {
          animation_duration: number | null
          animation_type: string | null
          created_at: string | null
          created_by: string | null
          css_styles: string | null
          default_content: Json | null
          display_duration: number | null
          graphic_type: string
          id: string
          is_built_in: boolean | null
          keyboard_shortcut: string | null
          name: string
          style_variant: string | null
          template_html: string | null
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          animation_duration?: number | null
          animation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          default_content?: Json | null
          display_duration?: number | null
          graphic_type: string
          id?: string
          is_built_in?: boolean | null
          keyboard_shortcut?: string | null
          name: string
          style_variant?: string | null
          template_html?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          animation_duration?: number | null
          animation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          default_content?: Json | null
          display_duration?: number | null
          graphic_type?: string
          id?: string
          is_built_in?: boolean | null
          keyboard_shortcut?: string | null
          name?: string
          style_variant?: string | null
          template_html?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          bio: string | null
          company: string | null
          created_at: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          name: string
          photo_url: string | null
          title: string | null
          twitter: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name: string
          photo_url?: string | null
          title?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name?: string
          photo_url?: string | null
          title?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      host_archetypes: {
        Row: {
          archetype_name: string
          average_show_style: string | null
          avg_engagement: number | null
          created_at: string | null
          id: string
          member_host_ids: string[] | null
          preferred_topics: string[] | null
          successful_question_patterns: Json | null
          typical_preferences: Json
          updated_at: string | null
        }
        Insert: {
          archetype_name: string
          average_show_style?: string | null
          avg_engagement?: number | null
          created_at?: string | null
          id?: string
          member_host_ids?: string[] | null
          preferred_topics?: string[] | null
          successful_question_patterns?: Json | null
          typical_preferences: Json
          updated_at?: string | null
        }
        Update: {
          archetype_name?: string
          average_show_style?: string | null
          avg_engagement?: number | null
          created_at?: string | null
          id?: string
          member_host_ids?: string[] | null
          preferred_topics?: string[] | null
          successful_question_patterns?: Json | null
          typical_preferences?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      live_stream_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          session_name: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          session_name: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          session_name?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      lower_thirds: {
        Row: {
          animation_style: string | null
          background_color: string | null
          created_at: string | null
          duration: number | null
          font_size: string | null
          id: string
          is_visible: boolean | null
          position: string | null
          show_id: string | null
          subtitle_text: string | null
          template_type: string
          text_color: string | null
          title_text: string | null
        }
        Insert: {
          animation_style?: string | null
          background_color?: string | null
          created_at?: string | null
          duration?: number | null
          font_size?: string | null
          id?: string
          is_visible?: boolean | null
          position?: string | null
          show_id?: string | null
          subtitle_text?: string | null
          template_type: string
          text_color?: string | null
          title_text?: string | null
        }
        Update: {
          animation_style?: string | null
          background_color?: string | null
          created_at?: string | null
          duration?: number | null
          font_size?: string | null
          id?: string
          is_visible?: boolean | null
          position?: string | null
          show_id?: string | null
          subtitle_text?: string | null
          template_type?: string
          text_color?: string | null
          title_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lower_thirds_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      lower_thirds_templates: {
        Row: {
          animation_style: string | null
          created_at: string | null
          guest_name: string | null
          guest_social: string | null
          guest_title: string | null
          id: string
          is_visible: boolean | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          animation_style?: string | null
          created_at?: string | null
          guest_name?: string | null
          guest_social?: string | null
          guest_title?: string | null
          id?: string
          is_visible?: boolean | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          animation_style?: string | null
          created_at?: string | null
          guest_name?: string | null
          guest_social?: string | null
          guest_title?: string | null
          id?: string
          is_visible?: boolean | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      media_library: {
        Row: {
          category: string | null
          created_at: string | null
          duration: number | null
          file_size: number | null
          file_url: string
          id: string
          name: string
          show_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          name: string
          show_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          name?: string
          show_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_host_shows: {
        Row: {
          created_at: string | null
          host_ids: string[]
          host_roles: Json | null
          id: string
          interaction_style: string | null
          participation_balance: number | null
          show_id: string
        }
        Insert: {
          created_at?: string | null
          host_ids: string[]
          host_roles?: Json | null
          id?: string
          interaction_style?: string | null
          participation_balance?: number | null
          show_id: string
        }
        Update: {
          created_at?: string | null
          host_ids?: string[]
          host_roles?: Json | null
          id?: string
          interaction_style?: string | null
          participation_balance?: number | null
          show_id?: string
        }
        Relationships: []
      }
      music_library: {
        Row: {
          album: string | null
          analysis_date: string | null
          analysis_status: string | null
          artist: string | null
          bpm: number | null
          category: string | null
          copyright_info: Json | null
          copyright_notes: string | null
          created_at: string | null
          custom_category: string | null
          download_date: string | null
          duration: number | null
          effects_settings: Json | null
          energy_level: number | null
          file_format: string | null
          file_path: string
          file_size: number | null
          file_url: string
          friendly_name: string | null
          id: string
          is_stream_safe: boolean | null
          jingle_type: string | null
          license_type: string | null
          mood: string | null
          musical_key: string | null
          source_url: string | null
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          album?: string | null
          analysis_date?: string | null
          analysis_status?: string | null
          artist?: string | null
          bpm?: number | null
          category?: string | null
          copyright_info?: Json | null
          copyright_notes?: string | null
          created_at?: string | null
          custom_category?: string | null
          download_date?: string | null
          duration?: number | null
          effects_settings?: Json | null
          energy_level?: number | null
          file_format?: string | null
          file_path: string
          file_size?: number | null
          file_url: string
          friendly_name?: string | null
          id?: string
          is_stream_safe?: boolean | null
          jingle_type?: string | null
          license_type?: string | null
          mood?: string | null
          musical_key?: string | null
          source_url?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          album?: string | null
          analysis_date?: string | null
          analysis_status?: string | null
          artist?: string | null
          bpm?: number | null
          category?: string | null
          copyright_info?: Json | null
          copyright_notes?: string | null
          created_at?: string | null
          custom_category?: string | null
          download_date?: string | null
          duration?: number | null
          effects_settings?: Json | null
          energy_level?: number | null
          file_format?: string | null
          file_path?: string
          file_size?: number | null
          file_url?: string
          friendly_name?: string | null
          id?: string
          is_stream_safe?: boolean | null
          jingle_type?: string | null
          license_type?: string | null
          mood?: string | null
          musical_key?: string | null
          source_url?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          author: string | null
          content: string
          created_at: string | null
          id: string
          is_cue_card: boolean | null
          note_type: string | null
          segment_id: string | null
          target_role: string | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_cue_card?: boolean | null
          note_type?: string | null
          segment_id?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_cue_card?: boolean | null
          note_type?: string | null
          segment_id?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      operator_notes: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          note_text: string
          note_type: string | null
          segment_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          note_text: string
          note_type?: string | null
          segment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          note_text?: string
          note_type?: string | null
          segment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_notes_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "show_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_trends: {
        Row: {
          avg_engagement: number | null
          detected_at: string | null
          id: string
          peak_engagement_times: string[] | null
          topic_name: string
          total_mentions: number | null
          trend_score: number | null
          updated_at: string | null
          velocity: number | null
        }
        Insert: {
          avg_engagement?: number | null
          detected_at?: string | null
          id?: string
          peak_engagement_times?: string[] | null
          topic_name: string
          total_mentions?: number | null
          trend_score?: number | null
          updated_at?: string | null
          velocity?: number | null
        }
        Update: {
          avg_engagement?: number | null
          detected_at?: string | null
          id?: string
          peak_engagement_times?: string[] | null
          topic_name?: string
          total_mentions?: number | null
          trend_score?: number | null
          updated_at?: string | null
          velocity?: number | null
        }
        Relationships: []
      }
      play_history: {
        Row: {
          auto_selected: boolean | null
          id: string
          played_at: string | null
          track_id: string
        }
        Insert: {
          auto_selected?: boolean | null
          id?: string
          played_at?: string | null
          track_id: string
        }
        Update: {
          auto_selected?: boolean | null
          id?: string
          played_at?: string | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_library"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          autoplay: boolean | null
          created_at: string | null
          id: string
          media_id: string
          playlist_id: string
          position: number
        }
        Insert: {
          autoplay?: boolean | null
          created_at?: string | null
          id?: string
          media_id: string
          playlist_id: string
          position: number
        }
        Update: {
          autoplay?: boolean | null
          created_at?: string | null
          id?: string
          media_id?: string
          playlist_id?: string
          position?: number
        }
        Relationships: []
      }
      playlists: {
        Row: {
          category: string | null
          created_at: string | null
          crossfade_enabled: boolean | null
          default_crossfade_duration: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          track_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          crossfade_enabled?: boolean | null
          default_crossfade_duration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          track_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          crossfade_enabled?: boolean | null
          default_crossfade_duration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          track_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      predicted_outcomes: {
        Row: {
          actual_conversation_depth: number | null
          actual_engagement: number | null
          actual_host_satisfaction: number | null
          confidence_level: number | null
          created_at: string | null
          id: string
          model_version: string | null
          optimal_timing_minute: number | null
          predicted_conversation_depth: number | null
          predicted_engagement: number | null
          predicted_follow_ups: number | null
          predicted_host_satisfaction: number | null
          prediction_accuracy: number | null
          prediction_basis: Json | null
          question_id: string | null
          risk_factors: Json | null
          risk_level: string | null
          show_id: string
        }
        Insert: {
          actual_conversation_depth?: number | null
          actual_engagement?: number | null
          actual_host_satisfaction?: number | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          model_version?: string | null
          optimal_timing_minute?: number | null
          predicted_conversation_depth?: number | null
          predicted_engagement?: number | null
          predicted_follow_ups?: number | null
          predicted_host_satisfaction?: number | null
          prediction_accuracy?: number | null
          prediction_basis?: Json | null
          question_id?: string | null
          risk_factors?: Json | null
          risk_level?: string | null
          show_id: string
        }
        Update: {
          actual_conversation_depth?: number | null
          actual_engagement?: number | null
          actual_host_satisfaction?: number | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          model_version?: string | null
          optimal_timing_minute?: number | null
          predicted_conversation_depth?: number | null
          predicted_engagement?: number | null
          predicted_follow_ups?: number | null
          predicted_host_satisfaction?: number | null
          prediction_accuracy?: number | null
          prediction_basis?: Json | null
          question_id?: string | null
          risk_factors?: Json | null
          risk_level?: string | null
          show_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predicted_outcomes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predicted_outcomes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "recent_question_history"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_ai_analyses: {
        Row: {
          analysis_timestamp: string
          claude_questions: Json | null
          created_at: string | null
          embedding_time_ms: number | null
          gemini_questions: Json | null
          gpt4o_questions: Json | null
          id: string
          processing_time_ms: number | null
          session_id: string | null
          show_id: string
          top_question: string | null
          top_question_score: number | null
          transcript_duration: number | null
          transcript_text: string
          voted_questions: Json | null
          voting_time_ms: number | null
        }
        Insert: {
          analysis_timestamp?: string
          claude_questions?: Json | null
          created_at?: string | null
          embedding_time_ms?: number | null
          gemini_questions?: Json | null
          gpt4o_questions?: Json | null
          id?: string
          processing_time_ms?: number | null
          session_id?: string | null
          show_id: string
          top_question?: string | null
          top_question_score?: number | null
          transcript_duration?: number | null
          transcript_text: string
          voted_questions?: Json | null
          voting_time_ms?: number | null
        }
        Update: {
          analysis_timestamp?: string
          claude_questions?: Json | null
          created_at?: string | null
          embedding_time_ms?: number | null
          gemini_questions?: Json | null
          gpt4o_questions?: Json | null
          id?: string
          processing_time_ms?: number | null
          session_id?: string | null
          show_id?: string
          top_question?: string | null
          top_question_score?: number | null
          transcript_duration?: number | null
          transcript_text?: string
          voted_questions?: Json | null
          voting_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_ai_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "producer_ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_ai_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          multi_model_enabled: boolean | null
          show_id: string
          started_at: string
          total_analyses: number | null
          total_questions_generated: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          multi_model_enabled?: boolean | null
          show_id: string
          started_at?: string
          total_analyses?: number | null
          total_questions_generated?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          multi_model_enabled?: boolean | null
          show_id?: string
          started_at?: string
          total_analyses?: number | null
          total_questions_generated?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_banners: {
        Row: {
          animation_speed: number | null
          background_color: string | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          question_text: string
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          animation_speed?: number | null
          background_color?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          question_text: string
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          animation_speed?: number | null
          background_color?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          question_text?: string
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_history: {
        Row: {
          confidence: number
          created_at: string | null
          embedding: string | null
          id: string
          question_text: string
          show_id: string
          source_model: string
          timestamp: string
          topic_tags: string[] | null
          updated_at: string | null
          was_used: boolean | null
        }
        Insert: {
          confidence?: number
          created_at?: string | null
          embedding?: string | null
          id?: string
          question_text: string
          show_id: string
          source_model: string
          timestamp?: string
          topic_tags?: string[] | null
          updated_at?: string | null
          was_used?: boolean | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          embedding?: string | null
          id?: string
          question_text?: string
          show_id?: string
          source_model?: string
          timestamp?: string
          topic_tags?: string[] | null
          updated_at?: string | null
          was_used?: boolean | null
        }
        Relationships: []
      }
      question_queue: {
        Row: {
          displayed_at: string | null
          id: string
          position: number
          question_id: string | null
          queued_at: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          displayed_at?: string | null
          id?: string
          position: number
          question_id?: string | null
          queued_at?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          displayed_at?: string | null
          id?: string
          position?: number
          question_id?: string | null
          queued_at?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_queue_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_stream_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_routing_history: {
        Row: {
          actual_responder_host_id: string | null
          created_at: string | null
          id: string
          question_id: string | null
          routed_to_host_id: string
          routing_accuracy: number | null
          routing_confidence: number | null
          routing_reasoning: string | null
          show_id: string | null
        }
        Insert: {
          actual_responder_host_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          routed_to_host_id: string
          routing_accuracy?: number | null
          routing_confidence?: number | null
          routing_reasoning?: string | null
          show_id?: string | null
        }
        Update: {
          actual_responder_host_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          routed_to_host_id?: string
          routing_accuracy?: number | null
          routing_confidence?: number | null
          routing_reasoning?: string | null
          show_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_routing_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_routing_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "recent_question_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_routing_history_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "multi_host_show_stats"
            referencedColumns: ["show_id"]
          },
          {
            foreignKeyName: "question_routing_history_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "multi_host_shows"
            referencedColumns: ["show_id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          priority: number | null
          question_text: string
          session_id: string | null
          similarity_score: number | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          question_text: string
          session_id?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          question_text?: string
          session_id?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_stream_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rundown_segments: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number
          id: string
          position: number
          segment_type: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds: number
          id?: string
          position: number
          segment_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          position?: number
          segment_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_mixes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          name: string
          track_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          track_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          track_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      scene_presets: {
        Row: {
          action_sequence: Json | null
          automation_config: Json | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_favorite: boolean
          is_public: boolean
          last_used_at: string | null
          name: string
          tags: string[] | null
          trigger_rules: Json | null
          updated_at: string
          use_count: number
        }
        Insert: {
          action_sequence?: Json | null
          automation_config?: Json | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          last_used_at?: string | null
          name: string
          tags?: string[] | null
          trigger_rules?: Json | null
          updated_at?: string
          use_count?: number
        }
        Update: {
          action_sequence?: Json | null
          automation_config?: Json | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          last_used_at?: string | null
          name?: string
          tags?: string[] | null
          trigger_rules?: Json | null
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      scene_templates: {
        Row: {
          animation_config: Json | null
          category: string | null
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          is_custom: boolean | null
          layout_type: string
          name: string
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          animation_config?: Json | null
          category?: string | null
          config: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_custom?: boolean | null
          layout_type: string
          name: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          animation_config?: Json | null
          category?: string | null
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_custom?: boolean | null
          layout_type?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_events: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          event_name: string
          event_type: string
          id: string
          last_executed: string | null
          payload: Json
          recurrence: string | null
          scheduled_time: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          event_name: string
          event_type: string
          id?: string
          last_executed?: string | null
          payload: Json
          recurrence?: string | null
          scheduled_time: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          event_name?: string
          event_type?: string
          id?: string
          last_executed?: string | null
          payload?: Json
          recurrence?: string | null
          scheduled_time?: string
          user_id?: string | null
        }
        Relationships: []
      }
      search_results: {
        Row: {
          citations: Json | null
          created_at: string | null
          id: string
          question_id: string | null
          results: Json
          search_query: string
        }
        Insert: {
          citations?: Json | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          results: Json
          search_query: string
        }
        Update: {
          citations?: Json | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          results?: Json
          search_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_results_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      show_bookmarks: {
        Row: {
          bookmark_label: string | null
          bookmark_notes: string | null
          created_at: string | null
          id: string
          segment_id: string | null
          timestamp_seconds: number
        }
        Insert: {
          bookmark_label?: string | null
          bookmark_notes?: string | null
          created_at?: string | null
          id?: string
          segment_id?: string | null
          timestamp_seconds: number
        }
        Update: {
          bookmark_label?: string | null
          bookmark_notes?: string | null
          created_at?: string | null
          id?: string
          segment_id?: string | null
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "show_bookmarks_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "show_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      show_metadata: {
        Row: {
          active_session_id: string | null
          auto_advance_enabled: boolean | null
          created_at: string | null
          id: string
          is_live: boolean | null
          is_rehearsal: boolean | null
          show_start_time: string | null
          total_elapsed_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          active_session_id?: string | null
          auto_advance_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_live?: boolean | null
          is_rehearsal?: boolean | null
          show_start_time?: string | null
          total_elapsed_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          active_session_id?: string | null
          auto_advance_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_live?: boolean | null
          is_rehearsal?: boolean | null
          show_start_time?: string | null
          total_elapsed_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      show_plans: {
        Row: {
          actual_engagement_curve: Json | null
          created_at: string | null
          current_plan: Json | null
          host_id: string | null
          id: string
          main_topics: string[] | null
          metadata: Json | null
          original_plan: Json | null
          plan_changes: Json[] | null
          plan_effectiveness: number | null
          planning_style: string | null
          predicted_engagement_curve: Json | null
          segments: Json
          show_id: string
          total_duration: number | null
          updated_at: string | null
        }
        Insert: {
          actual_engagement_curve?: Json | null
          created_at?: string | null
          current_plan?: Json | null
          host_id?: string | null
          id?: string
          main_topics?: string[] | null
          metadata?: Json | null
          original_plan?: Json | null
          plan_changes?: Json[] | null
          plan_effectiveness?: number | null
          planning_style?: string | null
          predicted_engagement_curve?: Json | null
          segments: Json
          show_id: string
          total_duration?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_engagement_curve?: Json | null
          created_at?: string | null
          current_plan?: Json | null
          host_id?: string | null
          id?: string
          main_topics?: string[] | null
          metadata?: Json | null
          original_plan?: Json | null
          plan_changes?: Json[] | null
          plan_effectiveness?: number | null
          planning_style?: string | null
          predicted_engagement_curve?: Json | null
          segments?: Json
          show_id?: string
          total_duration?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      show_questions: {
        Row: {
          context_metadata: Json | null
          created_at: string | null
          id: string
          is_played: boolean | null
          is_template: boolean | null
          overlay_triggered_at: string | null
          position: number | null
          question_text: string
          show_id: string | null
          show_on_overlay: boolean | null
          source: string | null
          topic: string
          tts_audio_url: string | null
          tts_generated: boolean | null
          updated_at: string | null
        }
        Insert: {
          context_metadata?: Json | null
          created_at?: string | null
          id?: string
          is_played?: boolean | null
          is_template?: boolean | null
          overlay_triggered_at?: string | null
          position?: number | null
          question_text: string
          show_id?: string | null
          show_on_overlay?: boolean | null
          source?: string | null
          topic: string
          tts_audio_url?: string | null
          tts_generated?: boolean | null
          updated_at?: string | null
        }
        Update: {
          context_metadata?: Json | null
          created_at?: string | null
          id?: string
          is_played?: boolean | null
          is_template?: boolean | null
          overlay_triggered_at?: string | null
          position?: number | null
          question_text?: string
          show_id?: string | null
          show_on_overlay?: boolean | null
          source?: string | null
          topic?: string
          tts_audio_url?: string | null
          tts_generated?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "show_questions_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      show_segments: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          segment_name: string
          segment_order: number | null
          segment_question: string | null
          segment_topic: string | null
          show_id: string | null
          timer_running: boolean | null
          timer_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          segment_name: string
          segment_order?: number | null
          segment_question?: string | null
          segment_topic?: string | null
          show_id?: string | null
          timer_running?: boolean | null
          timer_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          segment_name?: string
          segment_order?: number | null
          segment_question?: string | null
          segment_topic?: string | null
          show_id?: string | null
          timer_running?: boolean | null
          timer_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "show_segments_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      show_sessions: {
        Row: {
          analytics: Json | null
          betabot_interactions: Json | null
          betabot_session_id: string | null
          bookmarks: Json | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          ended_at: string | null
          episode_date: string | null
          episode_number: number | null
          episode_title: string | null
          episode_topic: string | null
          graphics_used: Json | null
          id: string
          questions_generated: Json | null
          questions_rejected: Json | null
          questions_used: Json | null
          segments_completed: Json | null
          show_id: string | null
          show_notes: string | null
          social_media_clips: Json | null
          soundboard_effects_played: Json | null
          status: string | null
          team_id: string | null
          youtube_description: string | null
        }
        Insert: {
          analytics?: Json | null
          betabot_interactions?: Json | null
          betabot_session_id?: string | null
          bookmarks?: Json | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          episode_date?: string | null
          episode_number?: number | null
          episode_title?: string | null
          episode_topic?: string | null
          graphics_used?: Json | null
          id?: string
          questions_generated?: Json | null
          questions_rejected?: Json | null
          questions_used?: Json | null
          segments_completed?: Json | null
          show_id?: string | null
          show_notes?: string | null
          social_media_clips?: Json | null
          soundboard_effects_played?: Json | null
          status?: string | null
          team_id?: string | null
          youtube_description?: string | null
        }
        Update: {
          analytics?: Json | null
          betabot_interactions?: Json | null
          betabot_session_id?: string | null
          bookmarks?: Json | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          episode_date?: string | null
          episode_number?: number | null
          episode_title?: string | null
          episode_topic?: string | null
          graphics_used?: Json | null
          id?: string
          questions_generated?: Json | null
          questions_rejected?: Json | null
          questions_used?: Json | null
          segments_completed?: Json | null
          show_id?: string | null
          show_notes?: string | null
          social_media_clips?: Json | null
          soundboard_effects_played?: Json | null
          status?: string | null
          team_id?: string | null
          youtube_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "show_sessions_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          avg_viewer_count: number | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          default_automation_config: Json | null
          default_hashtag: string | null
          default_obs_scene: string | null
          description: string | null
          episode_count: number
          id: string
          is_active: boolean
          is_archived: boolean
          is_template: boolean
          last_aired_at: string | null
          logo_url: string | null
          name: string
          next_scheduled_at: string | null
          primary_color: string | null
          schedule_day: number | null
          schedule_time: string | null
          schedule_type: string | null
          secondary_color: string | null
          slug: string
          social_instagram: string | null
          social_twitter: string | null
          social_youtube: string | null
          team_id: string | null
          timezone: string | null
          total_episodes: number
          total_watch_time: number | null
          updated_at: string | null
        }
        Insert: {
          avg_viewer_count?: number | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          default_automation_config?: Json | null
          default_hashtag?: string | null
          default_obs_scene?: string | null
          description?: string | null
          episode_count?: number
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_template?: boolean
          last_aired_at?: string | null
          logo_url?: string | null
          name: string
          next_scheduled_at?: string | null
          primary_color?: string | null
          schedule_day?: number | null
          schedule_time?: string | null
          schedule_type?: string | null
          secondary_color?: string | null
          slug: string
          social_instagram?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          team_id?: string | null
          timezone?: string | null
          total_episodes?: number
          total_watch_time?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_viewer_count?: number | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          default_automation_config?: Json | null
          default_hashtag?: string | null
          default_obs_scene?: string | null
          description?: string | null
          episode_count?: number
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_template?: boolean
          last_aired_at?: string | null
          logo_url?: string | null
          name?: string
          next_scheduled_at?: string | null
          primary_color?: string | null
          schedule_day?: number | null
          schedule_time?: string | null
          schedule_type?: string | null
          secondary_color?: string | null
          slug?: string
          social_instagram?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          team_id?: string | null
          timezone?: string | null
          total_episodes?: number
          total_watch_time?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_playlists: {
        Row: {
          created_at: string | null
          description: string | null
          filter_config: Json
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          filter_config: Json
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          filter_config?: Json
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sound_effects: {
        Row: {
          category: string | null
          created_at: string | null
          file_url: string
          hotkey: string | null
          id: string
          name: string
          volume: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_url: string
          hotkey?: string | null
          id?: string
          name: string
          volume?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_url?: string
          hotkey?: string | null
          id?: string
          name?: string
          volume?: number | null
        }
        Relationships: []
      }
      soundboard_effects: {
        Row: {
          audio_url: string | null
          created_at: string | null
          effect_name: string
          effect_type: string
          id: string
          is_playing: boolean | null
          volume: number | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          effect_name: string
          effect_type: string
          id?: string
          is_playing?: boolean | null
          volume?: number | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          effect_name?: string
          effect_type?: string
          id?: string
          is_playing?: boolean | null
          volume?: number | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          ad_duration_seconds: number | null
          created_at: string | null
          display_priority: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          ad_duration_seconds?: number | null
          created_at?: string | null
          display_priority?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          ad_duration_seconds?: number | null
          created_at?: string | null
          display_priority?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      stream_profiles: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          show_id: string | null
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          show_id?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          show_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stream_sources: {
        Row: {
          config: Json | null
          created_at: string | null
          height: number | null
          id: string
          is_active: boolean | null
          media_id: string | null
          name: string | null
          position_x: number | null
          position_y: number | null
          source_type: string
          source_url: string | null
          updated_at: string | null
          volume: number | null
          width: number | null
          z_index: number | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          media_id?: string | null
          name?: string | null
          position_x?: number | null
          position_y?: number | null
          source_type: string
          source_url?: string | null
          updated_at?: string | null
          volume?: number | null
          width?: number | null
          z_index?: number | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          media_id?: string | null
          name?: string | null
          position_x?: number | null
          position_y?: number | null
          source_type?: string
          source_url?: string | null
          updated_at?: string | null
          volume?: number | null
          width?: number | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_sources_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_library"
            referencedColumns: ["id"]
          },
        ]
      }
      streaming_presets: {
        Row: {
          audio_config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          graphics_config: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_built_in: boolean | null
          keyboard_shortcuts: Json | null
          name: string
          preset_type: string
          quick_actions: Json | null
          scene_template_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          audio_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          graphics_config?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_built_in?: boolean | null
          keyboard_shortcuts?: Json | null
          name: string
          preset_type: string
          quick_actions?: Json | null
          scene_template_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          audio_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          graphics_config?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_built_in?: boolean | null
          keyboard_shortcuts?: Json | null
          name?: string
          preset_type?: string
          quick_actions?: Json | null
          scene_template_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      timer_configs: {
        Row: {
          created_at: string | null
          current_value: number | null
          duration_seconds: number | null
          id: string
          is_running: boolean | null
          name: string
          timer_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          duration_seconds?: number | null
          id?: string
          is_running?: boolean | null
          name: string
          timer_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          duration_seconds?: number | null
          id?: string
          is_running?: boolean | null
          name?: string
          timer_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timers: {
        Row: {
          created_at: string | null
          duration: number
          elapsed: number | null
          id: string
          is_running: boolean | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration: number
          elapsed?: number | null
          id?: string
          is_running?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number
          elapsed?: number | null
          id?: string
          is_running?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          audio_timestamp: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          metadata: Json | null
          session_id: string | null
          transcript_text: string
        }
        Insert: {
          audio_timestamp?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          transcript_text: string
        }
        Update: {
          audio_timestamp?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          transcript_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_stream_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      transitions: {
        Row: {
          config: Json | null
          created_at: string | null
          duration_ms: number | null
          id: string
          is_default: boolean | null
          name: string
          type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      trigger_rules: {
        Row: {
          action_params: Json | null
          action_type: string
          active_days: number[] | null
          active_time_end: string | null
          active_time_start: string | null
          cooldown_seconds: number | null
          created_at: string | null
          created_by: string | null
          current_execution_count: number | null
          description: string | null
          enabled: boolean | null
          id: string
          last_executed_at: string | null
          max_executions_per_show: number | null
          priority: number | null
          require_operator_approval: boolean | null
          rule_name: string
          show_id: string | null
          trigger_conditions: Json
          trigger_type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          action_params?: Json | null
          action_type: string
          active_days?: number[] | null
          active_time_end?: string | null
          active_time_start?: string | null
          cooldown_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          current_execution_count?: number | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_executed_at?: string | null
          max_executions_per_show?: number | null
          priority?: number | null
          require_operator_approval?: boolean | null
          rule_name: string
          show_id?: string | null
          trigger_conditions: Json
          trigger_type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          action_params?: Json | null
          action_type?: string
          active_days?: number[] | null
          active_time_end?: string | null
          active_time_start?: string | null
          cooldown_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          current_execution_count?: number | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_executed_at?: string | null
          max_executions_per_show?: number | null
          priority?: number | null
          require_operator_approval?: boolean | null
          rule_name?: string
          show_id?: string | null
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trigger_rules_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_save_presets: boolean | null
          created_at: string | null
          default_preset_id: string | null
          id: string
          keyboard_shortcuts_enabled: boolean | null
          preferences: Json | null
          show_tooltips: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_save_presets?: boolean | null
          created_at?: string | null
          default_preset_id?: string | null
          id?: string
          keyboard_shortcuts_enabled?: boolean | null
          preferences?: Json | null
          show_tooltips?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_save_presets?: boolean | null
          created_at?: string | null
          default_preset_id?: string | null
          id?: string
          keyboard_shortcuts_enabled?: boolean | null
          preferences?: Json | null
          show_tooltips?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_default_preset_id_fkey"
            columns: ["default_preset_id"]
            isOneToOne: false
            referencedRelation: "streaming_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          display_name: string | null
          email: string
          id: string
          is_online: boolean | null
          last_active: string | null
          role: string | null
        }
        Insert: {
          display_name?: string | null
          email: string
          id: string
          is_online?: boolean | null
          last_active?: string | null
          role?: string | null
        }
        Update: {
          display_name?: string | null
          email?: string
          id?: string
          is_online?: boolean | null
          last_active?: string | null
          role?: string | null
        }
        Relationships: []
      }
      video_queue: {
        Row: {
          channel_title: string | null
          created_at: string | null
          duration: number | null
          id: string
          position: number
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_id: string
        }
        Insert: {
          channel_title?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          position: number
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_id: string
        }
        Update: {
          channel_title?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          position?: number
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_sessions: {
        Row: {
          activity_count: number | null
          ended_at: string | null
          id: string | null
          session_mode: string | null
          session_type: string | null
          show_id: string | null
          started_at: string | null
        }
        Relationships: []
      }
      global_topic_performance: {
        Row: {
          avg_engagement: number | null
          success_rate: number | null
          topic: string | null
          total_times_asked: number | null
        }
        Relationships: []
      }
      multi_host_show_stats: {
        Row: {
          avg_routing_accuracy: number | null
          interaction_style: string | null
          num_hosts: number | null
          participation_balance: number | null
          show_id: string | null
          successful_routings: number | null
          total_questions_routed: number | null
        }
        Relationships: []
      }
      prediction_performance_summary: {
        Row: {
          avg_accuracy: number | null
          avg_actual_engagement: number | null
          avg_confidence: number | null
          avg_predicted_engagement: number | null
          high_risk_count: number | null
          low_risk_count: number | null
          medium_risk_count: number | null
          show_id: string | null
          total_predictions: number | null
        }
        Relationships: []
      }
      recent_question_history: {
        Row: {
          age_minutes: number | null
          confidence: number | null
          id: string | null
          question_text: string | null
          show_id: string | null
          source_model: string | null
          timestamp: string | null
          was_used: boolean | null
        }
        Insert: {
          age_minutes?: never
          confidence?: number | null
          id?: string | null
          question_text?: string | null
          show_id?: string | null
          source_model?: string | null
          timestamp?: string | null
          was_used?: boolean | null
        }
        Update: {
          age_minutes?: never
          confidence?: number | null
          id?: string | null
          question_text?: string | null
          show_id?: string | null
          source_model?: string | null
          timestamp?: string | null
          was_used?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_current_session: {
        Args: { p_end_time?: string; p_session_id: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_platform_trends: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_question_history: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      clone_template_to_show: {
        Args: {
          p_episode_number?: number
          p_episode_title?: string
          p_new_show_name: string
          p_template_id: string
        }
        Returns: string
      }
      find_similar_questions: {
        Args: {
          exclude_id?: string
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          created_at: string
          id: string
          question_text: string
          similarity: number
          status: string
        }[]
      }
      find_similar_questions_with_outcomes: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          asked_at: string
          conversation_depth: number
          engagement_score: number
          host_satisfaction: number
          question_text: string
          similarity: number
        }[]
      }
      generate_youtube_description: {
        Args: { p_session_id: string }
        Returns: string
      }
      get_similar_questions: {
        Args: {
          max_results?: number
          query_embedding: string
          show_filter?: string
          similarity_threshold?: number
        }
        Returns: {
          id: string
          question_text: string
          question_timestamp: string
          similarity: number
          source_model: string
          was_used: boolean
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      save_as_template: {
        Args: {
          p_current_show_id: string
          p_template_description: string
          p_template_name: string
        }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


// Custom type aliases for convenience
export type MusicTrack = Database['public']['Tables']['music_library']['Row']
export type Playlist = Database['public']['Tables']['playlists']['Row']
export type AudioPlaybackState = Database['public']['Tables']['audio_playback_state']['Row']
export type AutoDJSettings = Database['public']['Tables']['auto_dj_settings']['Row']
export type AudioSettings = Database['public']['Tables']['audio_settings']['Row']
export type SmartPlaylist = Database['public']['Tables']['smart_playlists']['Row']

// Audio effects configuration
export interface AudioEffectsConfig {
  reverb: number
  echo: number
  delay: number
  bassBoost: number
  treble: number
  trebleBoost: number
  distortion: number
  compression: number
}

// Effect preset configuration
export interface EffectPresetConfig {
  name: string
  config: AudioEffectsConfig
}

// Type alias for backward compatibility
export type EffectPreset = EffectPresetConfig

// Smart Playlist Filter
export interface SmartPlaylistFilter {
  bpm?: { min: number; max: number }
  energy?: { min: number; max: number }
  genre?: string[]
  tags?: string[]
  key?: string[]
  dateAdded?: { after?: string; before?: string }
}

// Additional types for copyright info
export interface CopyrightInfo {
  status: string
  claimDetails?: string[]
  canUse?: boolean
}
