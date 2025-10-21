# StreamStudio Live - API Reference

**Complete API Documentation for Edge Functions, Database Schemas, Hooks, and Utilities**

---

## Table of Contents

1. [Supabase Edge Functions](#supabase-edge-functions)
2. [Database Tables](#database-tables)
3. [React Hooks](#react-hooks)
4. [Utility Functions](#utility-functions)
5. [Type Definitions](#type-definitions)
6. [Web Audio API Integration](#web-audio-api-integration)

---

## Supabase Edge Functions

**Base URL**: `https://your-project.supabase.co/functions/v1`

**Authorization**: All endpoints require Bearer token authentication

```bash
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

### 1. play-audio

**Endpoint**: `POST /play-audio`

**Description**: Play, pause, or stop audio tracks by friendly name or ID.

**Request Body**:

```json
{
  "audio_type": "music" | "jingle",
  "identifier": "string",  // friendly_name or track ID
  "action": "play" | "pause" | "stop"
}
```

**Response** (Success):

```json
{
  "success": true,
  "message": "Playback started",
  "track_id": "uuid",
  "track_title": "Song Title"
}
```

**Response** (Error):

```json
{
  "error": "Track not found",
  "details": "No track found with identifier: intro"
}
```

**Example**:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/play-audio \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_type": "jingle",
    "identifier": "intro",
    "action": "play"
  }'
```

---

### 2. get-audio-list

**Endpoint**: `POST /get-audio-list`

**Description**: Retrieve list of all audio tracks with optional filtering.

**Request Body** (Optional):

```json
{
  "category": "music" | "jingle",
  "jingle_type": "intro" | "outro" | "stinger" | "custom",
  "has_friendly_name": true,
  "is_stream_safe": true
}
```

**Response**:

```json
{
  "tracks": [
    {
      "id": "uuid",
      "title": "Track Title",
      "artist": "Artist Name",
      "duration": 180,
      "file_url": "https://...",
      "category": "music",
      "friendly_name": "intro",
      "is_stream_safe": true,
      "copyright_status": { ... }
    }
  ],
  "count": 42
}
```

**Example**:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/get-audio-list \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"category": "music", "is_stream_safe": true}'
```

---

### 3. trigger-sound

**Endpoint**: `POST /trigger-sound`

**Description**: Trigger a sound effect by name.

**Request Body**:

```json
{
  "sound_name": "airhorn" | "siren" | "laser" | "scratch" | string
}
```

**Response**:

```json
{
  "success": true,
  "message": "Sound triggered",
  "sound_id": "uuid"
}
```

---

### 4. trigger-mix

**Endpoint**: `POST /trigger-mix`

**Description**: Play a saved DJ mix.

**Request Body**:

```json
{
  "mix_id": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Mix started",
  "mix_name": "Saturday Night Mix",
  "duration": 3600
}
```

---

### 5. get-dj-status

**Endpoint**: `GET /get-dj-status`

**Description**: Get current DJ system status.

**Response**:

```json
{
  "is_playing": true,
  "current_track": {
    "id": "uuid",
    "title": "Current Song",
    "artist": "Artist"
  },
  "playback_position": 45.5,
  "volume": 0.7,
  "emergency_mode": "normal",
  "is_ducking": false,
  "auto_dj_active": true,
  "deck_a": { ... },
  "deck_b": { ... },
  "crossfader_position": 0
}
```

---

### 6. get-mixes

**Endpoint**: `GET /get-mixes`

**Description**: Retrieve list of saved DJ mixes.

**Response**:

```json
{
  "mixes": [
    {
      "id": "uuid",
      "name": "Mix Name",
      "duration": 3600,
      "file_url": "https://...",
      "created_at": "2025-10-21T12:00:00Z"
    }
  ]
}
```

---

### 7. download-youtube-audio

**Endpoint**: `POST /download-youtube-audio`

**Description**: Analyze YouTube video for copyright and provide download metadata.

**Request Body**:

```json
{
  "url": "https://youtube.com/watch?v=...",
  "category": "music" | "sounddrop",
  "friendly_name": "optional-name"
}
```

**Response** (YouTube):

```json
{
  "video_id": "abc123",
  "metadata": {
    "title": "Video Title",
    "artist": "Channel Name",
    "duration": 180,
    "thumbnail": "https://...",
    "copyright_status": {
      "is_copyrighted": true,
      "safe_for_streaming": false,
      "usage_policy": "blocked",
      "warning_message": "This content is copyrighted..."
    }
  },
  "manual_download_instructions": { ... }
}
```

**Response** (Direct URL):

```json
{
  "success": true,
  "audio_id": "uuid",
  "file_url": "https://...",
  "metadata": {
    "title": "Audio File",
    "duration": 180
  }
}
```

---

## Database Tables

### music_library

**Description**: Stores all audio tracks and metadata.

**Schema**:

```sql
CREATE TABLE music_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  duration INTEGER,                    -- seconds
  file_size INTEGER,                   -- bytes
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_format TEXT,                    -- mp3, wav, ogg
  category TEXT,                       -- 'music' or 'jingle'
  jingle_type TEXT,                    -- 'intro', 'outro', 'stinger', 'custom'
  friendly_name TEXT UNIQUE,           -- API identifier
  
  -- DJ Features (Phase 5)
  effects_settings JSONB,              -- Audio effect presets
  tags JSONB,                          -- Custom tags array
  mood TEXT,                           -- Track mood
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  custom_category TEXT,
  
  -- Track Analysis (Phase 4)
  bpm REAL,                            -- Beats per minute
  musical_key TEXT,                    -- Camelot wheel notation
  waveform_data JSONB,                 -- Waveform visualization data
  beat_grid JSONB,                     -- Beat markers
  
  -- Copyright (Phase 2)
  is_stream_safe BOOLEAN DEFAULT false,
  copyright_notes TEXT,
  license_type TEXT,                   -- 'royalty_free', 'creative_commons', etc.
  copyright_status JSONB,              -- Detailed copyright info
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:

```sql
CREATE INDEX idx_music_library_category ON music_library(category);
CREATE INDEX idx_music_library_jingle_type ON music_library(jingle_type);
CREATE INDEX idx_music_library_tags ON music_library USING GIN (tags);
CREATE INDEX idx_music_library_stream_safe ON music_library(is_stream_safe);
CREATE INDEX idx_music_library_energy_level ON music_library(energy_level);
```

---

### playlists

**Description**: User-created playlists.

**Schema**:

```sql
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  track_ids UUID[],                    -- Array of music_library IDs
  crossfade_enabled BOOLEAN DEFAULT false,
  default_crossfade_duration INTEGER CHECK (default_crossfade_duration >= 0 AND default_crossfade_duration <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### audio_playback_state

**Description**: Real-time playback state for synchronization.

**Schema**:

```sql
CREATE TABLE audio_playback_state (
  id INTEGER PRIMARY KEY DEFAULT 1,    -- Single row table
  current_track_id UUID,
  playlist_id UUID,
  is_playing BOOLEAN DEFAULT false,
  playback_position REAL DEFAULT 0,    -- seconds
  volume REAL DEFAULT 0.7,             -- 0.0 to 1.0
  is_muted BOOLEAN DEFAULT false,
  is_looping BOOLEAN DEFAULT false,
  is_shuffling BOOLEAN DEFAULT false,
  is_ducking BOOLEAN DEFAULT false,
  
  -- Emergency Controls (Phase 7)
  emergency_mode TEXT DEFAULT 'normal' CHECK (emergency_mode IN ('normal', 'panic', 'brb', 'fade_out')),
  emergency_previous_state JSONB,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### audio_settings

**Description**: Global audio system settings.

**Schema**:

```sql
CREATE TABLE audio_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,    -- Single row table
  ducking_enabled BOOLEAN DEFAULT true,
  ducking_level REAL DEFAULT 0.3,      -- 0.0 to 1.0
  background_music_volume REAL DEFAULT 0.7,
  jingles_volume REAL DEFAULT 0.8,
  show_waveform BOOLEAN DEFAULT true,
  
  -- Crossfade (Phase 5)
  crossfade_enabled BOOLEAN DEFAULT false,
  crossfade_duration INTEGER DEFAULT 3 CHECK (crossfade_duration >= 0 AND crossfade_duration <= 10),
  auto_eq_matching BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### smart_playlists

**Description**: Auto-generated playlists based on criteria.

**Schema**:

```sql
CREATE TABLE smart_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filter_config JSONB NOT NULL,        -- Filter criteria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**filter_config Example**:

```json
{
  "tags": ["upbeat", "electronic"],
  "tag_logic": "AND",
  "moods": ["Energetic", "Happy"],
  "energy_range": [7, 10],
  "duration_range": [0, 300],
  "categories": ["music"]
}
```

---

### hot_cues

**Description**: Saved hot cue points for tracks.

**Schema**:

```sql
CREATE TABLE hot_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES music_library(id) ON DELETE CASCADE,
  cue_number INTEGER CHECK (cue_number >= 1 AND cue_number <= 8),
  position REAL NOT NULL,               -- seconds
  name TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### saved_mixes

**Description**: Recorded DJ mixes.

**Schema**:

```sql
CREATE TABLE saved_mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration INTEGER,                     -- seconds
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,                    -- bytes
  track_list JSONB,                     -- Array of track IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### dj_analytics

**Description**: Session analytics and statistics.

**Schema**:

```sql
CREATE TABLE dj_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  total_tracks_played INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  energy_curve JSONB,                   -- Time-series energy data
  track_history JSONB,                  -- Played tracks with metadata
  transition_scores JSONB,              -- Mix quality scores
  genre_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### auto_dj_settings

**Description**: Auto-DJ configuration.

**Schema**:

```sql
CREATE TABLE auto_dj_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT false,
  preset_mode TEXT DEFAULT 'party_time',
  energy_target INTEGER DEFAULT 7 CHECK (energy_target >= 1 AND energy_target <= 10),
  bpm_matching_enabled BOOLEAN DEFAULT true,
  harmonic_mixing_enabled BOOLEAN DEFAULT true,
  transition_duration INTEGER DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### scheduled_events

**Description**: Automated scheduler events.

**Schema**:

```sql
CREATE TABLE scheduled_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,             -- 'play_track', 'trigger_mix', etc.
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  recurrence TEXT,                      -- 'once', 'daily', 'weekly'
  payload JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_executed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### ai_chat_history

**Description**: AI chat command history.

**Schema**:

```sql
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  command TEXT NOT NULL,
  intent TEXT NOT NULL,
  response TEXT,
  executed_action JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## React Hooks

### useAudioPlayer

**Description**: Main audio playback hook with Web Audio API integration.

**Location**: `src/hooks/useAudioPlayer.ts`

**Usage**:

```typescript
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

function MyComponent() {
  const {
    isPlaying,
    volume,
    currentTrack,
    playTrack,
    pause,
    stop,
    setVolume,
    seek,
    applyEffects,
  } = useAudioPlayer();
  
  return (
    <button onClick={() => playTrack(trackId)}>
      {isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}
```

**Return Values**:

```typescript
{
  isPlaying: boolean;
  volume: number;                      // 0-100
  currentTrack: Track | null;
  position: number;                    // seconds
  duration: number;                    // seconds
  audioContext: AudioContext | null;
  
  playTrack: (trackId: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  seek: (position: number) => void;
  applyEffects: (effects: EffectSettings) => void;
}
```

---

### useDualDeckPlayer

**Description**: Dual-deck DJ system with crossfader.

**Location**: `src/hooks/useDualDeckPlayer.ts`

**Usage**:

```typescript
import { useDualDeckPlayer } from '@/hooks/useDualDeckPlayer';

const {
  deckA,
  deckB,
  crossfaderPosition,
  setCrossfaderPosition,
  loadTrackToDeck,
  syncDecks,
} = useDualDeckPlayer();
```

---

### useAutoDJ

**Description**: Intelligent auto-DJ with energy flow management.

**Location**: `src/hooks/useAutoDJ.ts`

**Usage**:

```typescript
import { useAutoDJ } from '@/hooks/useAutoDJ';

const {
  isActive,
  currentMode,
  nextTrack,
  startAutoDJ,
  stopAutoDJ,
  setMode,
} = useAutoDJ();
```

---

### useMicInput

**Description**: Live microphone input with auto-ducking.

**Location**: `src/hooks/useMicInput.ts`

**Usage**:

```typescript
import { useMicInput } from '@/hooks/useMicInput';

const {
  isActive,
  micLevel,
  isDucking,
  error,
  startMic,
  stopMic,
  updateDuckingSettings,
} = useMicInput(audioContext, onDuckingChange);
```

---

### useBeatDetection

**Description**: BPM detection and beat grid generation.

**Location**: `src/hooks/useBeatDetection.ts`

**Usage**:

```typescript
import { useBeatDetection } from '@/hooks/useBeatDetection';

const {
  bpm,
  beatGrid,
  analyzeBPM,
  isAnalyzing,
} = useBeatDetection();

await analyzeBPM(audioBuffer);
```

---

### useHotCues

**Description**: Hot cue point management.

**Location**: `src/hooks/useHotCues.ts`

**Usage**:

```typescript
import { useHotCues } from '@/hooks/useHotCues';

const {
  cues,
  setCue,
  jumpToCue,
  deleteCue,
  loadCuesForTrack,
} = useHotCues(trackId);
```

---

## Utility Functions

### emergencyControls

**Location**: `src/utils/emergencyControls.ts`

**Functions**:

```typescript
// Activate PANIC mode (instant mute)
export async function activatePanicMode(
  currentState: PlaybackState
): Promise<void>;

// Activate BRB mode (15% volume)
export async function activateBRBMode(
  currentState: PlaybackState
): Promise<void>;

// Activate fade-out mode (2s fade)
export async function activateFadeOutMode(
  currentState: PlaybackState
): Promise<void>;

// Recover from emergency
export async function recoverFromEmergency(
  previousState: PlaybackState | null
): Promise<void>;

// Get current emergency state
export async function getEmergencyState(): Promise<EmergencyState | null>;
```

---

### audioEffects

**Location**: `src/utils/audioEffects.ts`

**Functions**:

```typescript
// Apply reverb effect
export function applyReverb(
  audioContext: AudioContext,
  input: AudioNode,
  output: AudioNode,
  amount: number  // 0-100
): void;

// Apply delay/echo
export function applyDelay(
  audioContext: AudioContext,
  input: AudioNode,
  output: AudioNode,
  delayTime: number,  // 0-1 seconds
  feedback: number    // 0-100
): void;

// Apply bass boost
export function applyBassBoost(
  audioContext: AudioContext,
  input: AudioNode,
  output: AudioNode,
  gain: number  // -10 to +10 dB
): void;

// Apply compression
export function applyCompression(
  audioContext: AudioContext,
  input: AudioNode,
  output: AudioNode,
  amount: number  // 0-100
): void;
```

---

### crossfadeManager

**Location**: `src/utils/crossfadeManager.ts`

**Class**: `CrossfadeManager`

```typescript
class CrossfadeManager {
  constructor(audioContext: AudioContext);
  
  // Start crossfade between tracks
  crossfade(
    currentTrack: AudioBuffer,
    nextTrack: AudioBuffer,
    duration: number,
    onComplete: () => void
  ): void;
  
  // Analyze track ending for optimal crossfade
  analyzeTrackEnding(audioBuffer: AudioBuffer): {
    hasSilentEnding: boolean;
    optimalStartTime: number;
  };
}
```

---

### trackAnalyzer

**Location**: `src/utils/trackAnalyzer.ts`

**Functions**:

```typescript
// Detect BPM of audio track
export async function detectBPM(
  audioBuffer: AudioBuffer
): Promise<number>;

// Detect musical key
export async function detectKey(
  audioBuffer: AudioBuffer
): Promise<string>;  // Camelot notation

// Generate waveform data
export function generateWaveform(
  audioBuffer: AudioBuffer,
  width: number  // pixels
): number[];  // Normalized amplitude values

// Generate beat grid
export async function generateBeatGrid(
  audioBuffer: AudioBuffer,
  bpm: number
): Promise<number[]>;  // Array of beat positions in seconds
```

---

### harmonicMixing

**Location**: `src/utils/harmonicMixing.ts`

**Functions**:

```typescript
// Get compatible keys for harmonic mixing
export function getCompatibleKeys(key: string): string[];

// Check if two keys are compatible
export function areKeysCompatible(
  key1: string,
  key2: string
): boolean;

// Get Camelot wheel position
export function getCamelotPosition(key: string): {
  hour: number;
  mode: 'A' | 'B';
};
```

---

### analyticsEngine

**Location**: `src/utils/analyticsEngine.ts`

**Functions**:

```typescript
// Track session data
export async function trackSessionData(
  sessionId: string,
  userId: string
): Promise<void>;

// Calculate mix quality score
export function calculateMixQuality(analytics: Analytics): {
  overallScore: number;      // 0-100
  harmonicScore: number;
  bpmScore: number;
  energyFlowScore: number;
};

// Generate energy flow graph data
export function generateEnergyFlowGraph(
  analytics: Analytics
): { time: number; energy: number }[];

// Calculate track statistics
export async function calculateTrackStatistics(
  userId: string
): Promise<TrackStats[]>;

// Export session report as CSV
export function exportSessionReport(analytics: Analytics): string;
```

---

## Type Definitions

**Location**: `src/types/database.ts`

### Track

```typescript
export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  file_size?: number;
  file_url: string;
  file_path: string;
  file_format?: string;
  category?: 'music' | 'jingle';
  jingle_type?: 'intro' | 'outro' | 'stinger' | 'custom';
  friendly_name?: string;
  effects_settings?: EffectSettings;
  tags?: string[];
  mood?: string;
  energy_level?: number;
  custom_category?: string;
  bpm?: number;
  musical_key?: string;
  waveform_data?: number[];
  beat_grid?: number[];
  is_stream_safe?: boolean;
  copyright_notes?: string;
  license_type?: string;
  copyright_status?: CopyrightStatus;
  created_at?: string;
  updated_at?: string;
}
```

### EffectSettings

```typescript
export interface EffectSettings {
  reverb: number;           // 0-100
  delay: number;            // 0-1 seconds
  bassBoost: number;        // -10 to +10 dB
  trebleBoost: number;      // -10 to +10 dB
  distortion: number;       // 0-100
  compression: number;      // 0-100
}
```

### CopyrightStatus

```typescript
export interface CopyrightStatus {
  is_copyrighted: boolean;
  safe_for_streaming: boolean;
  usage_policy: 'full' | 'partial' | 'blocked' | 'unknown';
  playable_duration?: number;
  warning_message?: string;
  license_type?: string;
}
```

### EmergencyMode

```typescript
export type EmergencyMode = 'normal' | 'panic' | 'brb' | 'fade_out';
```

---

## Web Audio API Integration

### Audio Node Chain

```
AudioElement
  ↓
GainNode (volume control)
  ↓
GainNode (ducking)
  ↓
BiquadFilterNode (bass)
  ↓
BiquadFilterNode (treble)
  ↓
WaveShaperNode (distortion)
  ↓
DelayNode (echo)
  ↓
ConvolverNode (reverb)
  ↓
DynamicsCompressorNode (compression)
  ↓
AnalyserNode (visualization)
  ↓
AudioContext.destination
```

### Creating Audio Context

```typescript
const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(audioElement);
const gainNode = audioContext.createGain();

source.connect(gainNode);
gainNode.connect(audioContext.destination);
```

---

**Last Updated**: October 21, 2025  
**Version**: Phase 7 Complete  
**Status**: Production Ready
