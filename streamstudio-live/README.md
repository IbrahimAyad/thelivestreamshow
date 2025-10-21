# StreamStudio Live

A professional broadcast-grade music and sound drops management system for live streaming, designed to integrate seamlessly with OBS Studio and Supabase.

## Features

### Audio Download System (NEW)
- **YouTube Metadata & Copyright Detection**: Analyze YouTube videos for copyright status
- **Direct URL Download**: Automatically download audio from direct MP3/WAV/OGG links
- **Copyright Badges**: Visual indicators for copyright status in UI
- **Multi-Source Support**: YouTube, direct URLs, and more
- **Professional Quality**: 320kbps MP3 downloads when available
- **Legal Compliance**: Built-in warnings and copyright analysis

### Music Library Management
- Upload audio files (MP3, WAV, OGG) to Supabase Storage
- Display library with metadata (title, artist, duration, file size)
- Search and filter functionality
- Audio preview player
- Delete audio files

### Playlist System
- Create, edit, and delete playlists
- Add/remove tracks from playlists
- Drag-and-drop track reordering
- Save configurations to database
- Load and play playlists with shuffle/loop modes

### Sound Drop Quick Access
- Categorized sound drop buttons (Intro, Outro, Stingers, Custom)
- One-click playback
- Visual feedback during playback
- Database-stored sound drop references

### Background Music Player
- Full playback controls (play, pause, stop, previous, next)
- Progress bar with seek functionality
- Current track display
- Loop and shuffle modes
- Volume control with mute toggle

### Audio Ducking System
- Enable/disable auto-ducking
- Configurable ducking level (percentage to reduce music volume)
- Manual ducking trigger
- Smooth volume transitions (600ms fade)
- Database-stored settings

### Audio Visualization
- Real-time audio level meters (VU meters)
- Waveform visualization using Web Audio API
- 60 FPS canvas-based rendering

### OBS Broadcast Overlay
- Transparent background optimized for OBS Browser Source
- "Now Playing" text overlay
- Audio waveform/spectrum visualizer (toggleable)
- Synchronized with control panel via Supabase real-time
- 1920x1080 resolution, 30 FPS optimized

### Real-Time Synchronization
- Supabase real-time subscriptions
- Automatic sync between control panel and broadcast overlay
- Database triggers for state updates

## Tech Stack

- **Frontend**: React 18.3 + TypeScript + Vite
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **Backend**: Supabase (Database + Storage + Real-time)
- **Audio**: Web Audio API
- **Routing**: React Router 6
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm
- Supabase project (existing or new)

### 1. Install Dependencies

```bash
cd music-jingles-system
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the SQL migration to create required tables:

```sql
-- See database/migrations.sql for the full schema
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 4. Storage Bucket Setup

Create a public storage bucket named `music-audio` in your Supabase project:

1. Go to Supabase Dashboard > Storage
2. Create new bucket: `music-audio`
3. Set to **Public**
4. Configure RLS policies for public access

### 5. Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### 6. Production Build

```bash
pnpm build
```

The built files will be in the `dist/` directory.

## Usage

### Control Panel (`/control`)

Main interface for managing music and sound drops:

1. **Upload Audio**: Drag and drop or click to upload MP3/WAV/OGG files
2. **Create Playlists**: Click the + button in the Playlists section
3. **Play Music**: Click play on any track or playlist
4. **Trigger Sound Drops**: Click any sound drop button for instant playback
5. **Configure Ducking**: Enable auto-ducking and set the reduction level

### Broadcast Overlay (`/broadcast`)

OBS-optimized overlay for displaying now playing information:

1. Open OBS Studio
2. Add a **Browser Source**
3. Set URL to: `http://localhost:5173/broadcast` (or your deployed URL)
4. Set resolution: **1920x1080**
5. Set FPS: **30**
6. Check "Shutdown source when not visible" for performance

## Database Schema

### Tables

- **music_library**: Stores all music tracks and sound drops with metadata
- **playlists**: Stores playlists with track ID arrays
- **audio_playback_state**: Real-time playback state for synchronization
- **audio_settings**: System settings including ducking configuration

### Storage Buckets

- **music-audio**: Public bucket for audio files (max 50MB per file)

## Integration with Existing Dashboard

See `docs/INTEGRATION_GUIDE.md` for detailed instructions on merging this system with your existing streaming dashboard.

## Design Specifications

The UI follows a professional dark control interface design:

- **Color Scheme**: Dark neutrals (950-800) with primary blue accents
- **Typography**: Inter for UI, Roboto Mono for metadata
- **Spacing**: 4pt-based system for consistency
- **Animations**: 150-400ms transitions with cubic-bezier easing
- **Accessibility**: WCAG 2.1 AA compliant

Full design tokens available in `docs/design-tokens.json`

## Keyboard Shortcuts

- **Space**: Play/Pause background music
- **Arrow Left**: Previous track
- **Arrow Right**: Next track
- **1-9**: Trigger first 9 sound drops in active category
- **M**: Toggle mute

## Performance Optimizations

- Web Audio API for efficient audio processing
- Canvas-based visualizers using `requestAnimationFrame`
- Debounced database updates to reduce real-time load
- Lazy loading of audio files
- GPU-accelerated CSS animations (`transform` and `opacity` only)

## Troubleshooting

### Audio not playing
- Check browser console for errors
- Ensure Supabase storage bucket is public
- Verify file URLs are accessible
- Check browser's autoplay policy (user interaction required)

### Real-time sync not working
- Verify Supabase real-time is enabled in project settings
- Check network tab for WebSocket connection
- Ensure database triggers are properly set up

### Upload fails
- Check file size (max 50MB)
- Verify storage bucket permissions
- Check browser console for error messages

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub or contact support.

---

**Deployed URL**: https://g9cn1qflg1rl.space.minimax.io

**Control Panel**: https://g9cn1qflg1rl.space.minimax.io/control

**Broadcast Overlay**: https://g9cn1qflg1rl.space.minimax.io/broadcast

**Edge Functions:**
- Play Audio API: https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio
- Get Audio List API: https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-audio-list

---

## AI Director Control (NEW)

Programmatic API control for automated audio management:

### Features

- **Edge Function APIs**: Two Supabase edge functions for AI control
  - `play-audio`: Trigger playback by friendly name or ID
  - `get-audio-list`: Query available audio tracks

- **Friendly Names**: Assign unique identifiers (e.g., "intro", "outro", "jazz-background") for easy API reference

- **Unified Control**: Both UI buttons and API calls use the same playback system

- **Real-Time Sync**: API-triggered actions sync instantly to control panel and broadcast overlay

- **AI Playback Indicator**: Visual feedback when audio is triggered by API

### Quick Example

```javascript
// Play intro sound drop via API
await fetch('https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audio_type: 'jingle',
    identifier: 'intro',
    action: 'play'
  })
});
```

See <filepath>docs/AI_DIRECTOR_API.md</filepath> for complete API documentation.

---

## YouTube Audio Downloader (NEW)

Advanced audio download system with built-in copyright detection:

### Features

- **Direct Audio Downloads**: Automatically download and import audio from direct URLs (MP3, WAV, OGG, M4A)
- **YouTube Copyright Analysis**: Check copyright status before downloading
- **Copyright Badges**: Visual indicators throughout the UI (Safe/Partial/Blocked/Unknown)
- **Legal Compliance**: Built-in warnings and usage recommendations
- **Metadata Extraction**: Automatic title, artist, duration, and thumbnail detection

### Supported Sources

1. **Direct Audio URLs**: Fully automated download and import
2. **YouTube**: Metadata and copyright analysis (manual download required)
3. **Future**: SoundCloud, Freesound.org, and more

### How to Use

1. Click "Download URL" button in Music Library section
2. Paste YouTube URL or direct audio file link
3. Select category (Music or Sound Drop)
4. Add friendly name (optional, for AI Director)
5. Click "Analyze & Download"
6. Review copyright status and metadata
7. For YouTube: Follow manual download instructions if safe to use
8. For direct URLs: Audio automatically added to library

### Copyright Detection

The system analyzes:
- YouTube Data API licensing information
- Embedding permissions
- Copyright notices in titles and descriptions
- Content monetization status

**Copyright Badge Legend:**
- ✅ **Safe for Streaming** (Green): No copyright restrictions detected
- ⚠️ **Partial Use Only** (Yellow): Limited use recommended, respect duration limits
- 🚫 **Copyrighted** (Red): High risk, not recommended for public streaming
- ❓ **Unknown** (Gray): Status unclear, verify manually

**Legal Disclaimer**: You are responsible for ensuring you have rights to use downloaded content. Always respect copyright laws.

See <filepath>docs/YOUTUBE_DOWNLOAD_GUIDE.md</filepath> for complete documentation.

### API Endpoint

```
POST https://vcniezwtltraqramjlux.supabase.co/functions/v1/download-youtube-audio
```

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=... or https://example.com/audio.mp3",
  "category": "music" | "sounddrop",
  "friendly_name": "intro" // optional
}
```

**Response (Direct Download):**
```json
{
  "success": true,
  "audio_id": "uuid",
  "file_url": "https://...",
  "metadata": {
    "copyright_status": { ... }
  }
}
```

**Response (YouTube Metadata):**
```json
{
  "video_id": "abc123",
  "metadata": {
    "title": "Song Title",
    "artist": "Channel Name",
    "duration": 180,
    "copyright_status": {
      "is_copyrighted": true,
      "safe_for_streaming": false,
      "usage_policy": "blocked",
      "warning_message": "..."
    }
  },
  "manual_download_instructions": { ... }
}
```
