# StreamStudio Live

**Professional Audio Control System for Live Streaming**

[![Deploy Status](https://img.shields.io/badge/status-production-success)](https://lvygnr34gdo1.space.minimax.io)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-green)](https://supabase.com)

## Overview

StreamStudio Live is a broadcast-grade audio control system designed for professional DJs and live streamers. It provides comprehensive music playback, sound effects management, real-time audio processing, and advanced live production safety features—all optimized for integration with OBS Studio and streaming platforms.

**Live Deployment**: [https://lvygnr34gdo1.space.minimax.io](https://lvygnr34gdo1.space.minimax.io)

---

## Key Features

### Core Audio System
- **Music Library Management**: Upload, organize, and preview audio files (MP3, WAV, OGG)
- **Playlist System**: Create, edit, and manage playlists with drag-and-drop reordering
- **Sound Drop Quick Access**: Categorized instant-play buttons for intro, outro, stingers
- **Real-Time Audio Visualization**: Waveform displays and VU meters using Web Audio API
- **OBS Broadcast Overlay**: Dedicated transparent overlay for "Now Playing" and visualizers

### Professional DJ Tools (Phases 1-6)
- **Dual-Deck DJ System**: Professional dual-turntable interface with crossfader
- **Audio Effects Processor**: Reverb, delay, bass/treble boost, distortion, compression with presets
- **Smart Playlists**: Auto-generated playlists based on tags, mood, energy level, and duration
- **Crossfade System**: Smooth track transitions with auto-EQ matching (0-10 second overlap)
- **Beat Matching**: BPM detection and harmonic mixing with Camelot wheel compatibility
- **Hot Cues & Loops**: Set up to 8 cue points per track with seamless looping
- **Professional Sampler**: 16-pad sampler with one-shot and loop modes
- **FX Chain Builder**: Stack multiple effects with customizable order and wet/dry mix
- **Waveform Visualization**: Full-track and zoomed waveforms with playback position
- **Auto-DJ System**: Intelligent track selection with energy flow management
- **AI Director Control**: Programmatic API for automated show control
- **Mix Recording**: Record live DJ sets to WAV format with automatic upload
- **Analytics Dashboard**: Session analytics with energy flow graphs and mix quality scoring
- **PWA Support**: Installable mobile app with offline capabilities
- **Scheduled Automation**: Timeline-based event scheduler with recurring tasks
- **AI Chat Control**: Natural language interface for DJ commands

### Tier 1 Live Production Features (Phase 7)
- **Emergency Broadcast Controls**: PANIC button, fade-out, BRB mode, and recovery
- **Mic Ducking System**: Live microphone input with auto-ducking and real-time effects
- **Stream-Safe Music System**: Copyright detection and stream-safe track filtering
- **Ducking Indicator**: Real-time visual feedback when mic ducking is active

### Content Acquisition
- **YouTube Audio Download**: Metadata extraction and copyright analysis
- **Direct URL Download**: Automatic import from direct audio file links
- **Copyright Detection**: Visual badges showing stream-safety status

---

## Tech Stack

- **Frontend**: React 18.3.1 + TypeScript 5.6
- **Build Tool**: Vite 6.0
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **Backend**: Supabase (PostgreSQL + Edge Functions + Real-time + Storage)
- **Audio Processing**: Web Audio API (zero additional audio libraries)
- **UI Components**: Radix UI + Shadcn
- **Routing**: React Router 6
- **Icons**: Lucide React
- **State Management**: React Hooks + Supabase Real-time

---

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account (free tier works)
- OBS Studio (optional, for broadcast overlay)

### Installation

```bash
# Clone the repository
cd music-jingles-system

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the SQL migrations in your Supabase SQL Editor:

```bash
# Run migrations in order:
1. database/migrations.sql
2. database/migrations_auto_dj.sql
3. database/migrations_dj_features.sql
4. database/migrations_track_analysis.sql
5. database/migrations_phase7_safety.sql
```

### Storage Bucket Setup

1. Go to Supabase Dashboard → Storage
2. Create bucket: `music-audio` (public)
3. Set file size limit: 50MB
4. Enable RLS policies for public access

### Development Server

```bash
pnpm dev
```

App available at: `http://localhost:5173`

### Production Build

```bash
pnpm build
```

Output: `dist/` directory

---

## Application Routes

- **`/`** - Redirects to `/control`
- **`/control`** - Main DJ control panel (full interface)
- **`/broadcast`** - OBS overlay (transparent, 1920×1080)

---

## Documentation

- **[Features Guide](docs/FEATURES.md)** - Complete feature list organized by phase
- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - Step-by-step guide for integrating into existing dashboards
- **[API Reference](docs/API_REFERENCE.md)** - Edge functions, database schemas, hooks, and utilities
- **[Phase 7 Summary](docs/PHASE_7_SUMMARY.md)** - Tier 1 live production features documentation

### Additional Guides

- [DJ Features Guide](docs/DJ_FEATURES_GUIDE.md) - DJ tools and professional audio effects
- [AI Director API](docs/AI_DIRECTOR_API.md) - Programmatic control API
- [YouTube Download Guide](docs/YOUTUBE_DOWNLOAD_GUIDE.md) - Audio download and copyright system
- [Track Analysis Guide](docs/TRACK_ANALYSIS_GUIDE.md) - BPM detection and harmonic mixing
- [Client-Side Architecture](docs/CLIENT_SIDE_ARCHITECTURE.md) - Technical architecture overview

---

## Usage

### Control Panel (`/control`)

1. **Upload Audio**: Drag and drop MP3/WAV/OGG files into the music library
2. **Create Playlists**: Click + button, add tracks, reorder with drag-and-drop
3. **Play Music**: Click play on any track or playlist
4. **Trigger Sound Drops**: Click category-organized buttons for instant playback
5. **Enable DJ Tools**: Click "DJ Tools" button in header for advanced features
6. **Emergency Controls**: Use PANIC, Fade Out, or BRB mode during live streams
7. **Mic Input**: Start mic with auto-ducking for live voiceovers

### Broadcast Overlay (`/broadcast`)

OBS Studio Integration:

1. Add **Browser Source**
2. URL: `https://lvygnr34gdo1.space.minimax.io/broadcast`
3. Resolution: **1920×1080**
4. FPS: **30**
5. Check "Shutdown source when not visible"

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Previous Track |
| `→` | Next Track |
| `M` | Toggle Mute |
| `1-9` | Trigger Sound Drops 1-9 |
| `Shift + P` | PANIC (Emergency Mute) |

---

## Performance Optimizations

- **Web Audio API**: Hardware-accelerated audio processing
- **Canvas Rendering**: 60 FPS visualizations using `requestAnimationFrame`
- **Debounced Updates**: Reduced database writes for real-time state
- **Lazy Loading**: Audio files loaded on-demand
- **GPU Acceleration**: CSS animations using `transform` and `opacity`
- **Service Worker**: PWA caching for offline functionality

---

## Browser Compatibility

| Browser | Desktop | Mobile | PWA Install | Web Audio |
|---------|---------|--------|-------------|----------|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ❌ | ✅ |
| Safari | ✅ | ✅ | ✅ (iOS) | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |

---

## Troubleshooting

### Audio Not Playing

- Check browser console for errors
- Verify Supabase storage bucket is public
- Ensure file URLs are accessible
- Check browser autoplay policy (user interaction required)

### Real-Time Sync Issues

- Verify Supabase real-time is enabled (Project Settings → API)
- Check WebSocket connection in Network tab
- Ensure database triggers are active

### Upload Failures

- Check file size (max 50MB)
- Verify storage bucket permissions (public access)
- Check browser console for specific error messages

### Emergency Controls Not Working

- Ensure `migrations_phase7_safety.sql` has been run
- Check `audio_playback_state` table has `emergency_mode` column
- Verify RLS policies allow updates

---

## Deployment

**Production URL**: https://lvygnr34gdo1.space.minimax.io

Deployed using Vite build to static hosting with:
- Minified JavaScript/CSS
- Gzip compression
- CDN distribution
- HTTPS enabled
- Service worker for PWA

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or feature requests:
- GitHub Issues (recommended)
- Documentation: See `/docs` directory
- API Reference: [API_REFERENCE.md](docs/API_REFERENCE.md)

---

## Project Status

**Status**: Production Ready  
**Latest Version**: Phase 7 Complete  
**Last Updated**: October 21, 2025  
**Deployment**: Live and Operational

---

**Built with ❤️ for professional live streamers and DJs**
