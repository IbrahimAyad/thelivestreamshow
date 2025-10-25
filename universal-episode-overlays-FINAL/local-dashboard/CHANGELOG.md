# Changelog

All notable changes to the Live Stream Production Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-13 - Professional Suite Release

### Major Features Added

This release transforms the dashboard from a basic control panel into a professional broadcast production suite with 6 major enhancements.

#### 1. Recording & Streaming Controls ⏺️
- **Added** Start/Stop recording controls with OBS WebSocket
- **Added** Start/Stop streaming controls (Go Live/End Stream)
- **Added** Real-time stream health monitoring
  - FPS (frames per second) display
  - CPU usage percentage
  - Dropped frames count and percentage
  - Memory usage display
- **Added** Visual health indicators (green/yellow/red)
- **Added** Critical performance warnings (>5% dropped frames)
- **Added** Recording/streaming duration timers (HH:MM:SS format)
- **Added** Live status indicators (pulsing red dot, LIVE badge)

#### 2. Scene Source Management 🎬
- **Added** View all sources in current scene
- **Added** Toggle source visibility (show/hide) via dashboard
- **Added** Lock/unlock sources to prevent accidental changes
- **Added** Category filters (All, Cameras, Overlays, Media)
- **Added** Z-order display (layer stacking visualization)
- **Added** Color-coded source type badges
- **Added** Real-time sync with OBS source changes
- **Added** Source count and scene name display

#### 3. Audio Presets System 🎵
- **Added** Save current audio mix as named preset
- **Added** 5 pre-built professional presets:
  1. Solo Host (host 0dB, others muted)
  2. Panel Discussion (all mics -3dB balanced)
  3. Video Reaction (host -2dB, video -6dB, guests -10dB)
  4. Interview (host & guest 1 at -3dB, others background)
  5. Music Break (all mics muted, music 0dB)
- **Added** One-click preset application
- **Added** Custom preset creation with descriptions
- **Added** Preset management (edit, delete, duplicate)
- **Added** Preview of audio levels in preset cards
- **Added** Active preset indicator
- **Added** Supabase database storage for presets

#### 4. Lower Thirds & Graphics Control 📺
- **Added** Create and manage lower third graphics
- **Added** 4 template types:
  - Guest Name + Title
  - Social Media (handles/usernames)
  - Topic/Segment
  - Breaking News
- **Added** Real-time text updates to OBS text sources
- **Added** Show/hide controls with visual indicators
- **Added** Queue system for multiple lower thirds
- **Added** Navigation (Previous/Next) for queued graphics
- **Added** Position options (bottom-left/center/right, top)
- **Added** Edit and delete functionality
- **Added** Active lower third highlighting (green border)
- **Added** OBS integration via `LowerThird_Title` and `LowerThird_Subtitle` sources

#### 5. User Roles & Permissions 👥
- **Added** Supabase Authentication integration
- **Added** Three user roles with distinct permissions:
  - **Producer:** Full control (all features, OBS, advanced tools)
  - **Host:** Limited control (own mic, view rundown, notes)
  - **Guest:** Minimal access (view cues, timers only)
- **Added** User registration (Sign Up) with email verification
- **Added** User login/logout system
- **Added** Role-based UI rendering (conditional feature access)
- **Added** "Who's Online" team status panel
  - Real-time online/offline indicators
  - Last active timestamps
  - Role badges (color-coded)
  - Activity status (green dot for online)
- **Added** Automatic activity tracking (30-second intervals)
- **Added** User profile database (`user_profiles` table)
- **Added** Role badge display in header

#### 6. Professional Scene Templates 🎨
- **Added** 4 pre-built OBS scene collection templates:
  1. **Talk Show Setup:** Host + guests multi-camera layout
  2. **Reaction Show Setup:** Video player + host camera
  3. **Interview Setup:** Dual camera with focus options
  4. **Panel Discussion Setup:** 4-person grid layouts
- **Added** Comprehensive template documentation (OBS_TEMPLATE_GUIDE.md)
- **Added** Pre-configured sources (cameras, mics, lower thirds, logos)
- **Added** Multiple scenes per template (3-4 scenes each)
- **Added** Professional positioning and scaling
- **Added** Transition configurations
- **Added** Import instructions and customization guide

### Enhanced Features

- **Improved** App.tsx layout with 3-tab system (Production, Advanced, Notes)
- **Improved** Production tab with 12-column grid layout (XL breakpoints)
- **Improved** Header with authentication UI
- **Added** Advanced tab for Producer-only features
- **Enhanced** Audio Mixer with role-based restrictions
- **Enhanced** YouTube Queue with embedded player integration
- **Added** Team Status panel in Production tab
- **Improved** Responsive design for wider screens

### New Components

- `StreamControls.tsx` - Recording and streaming management
- `SourceManager.tsx` - Scene source control
- `AudioPresets.tsx` - Audio preset system
- `LowerThirds.tsx` - Lower third graphics manager
- `Auth.tsx` - Authentication UI
- `TeamStatus.tsx` - Online team members display

### Database Changes

- **Added** `audio_presets` table
  - id, name, description, config (JSONB), is_default, created_at
- **Added** `lower_thirds` table
  - id, template_type, title_text, subtitle_text, is_visible, position, created_at
- **Added** `user_profiles` table
  - id (FK to auth.users), email, display_name, role, is_online, last_active

### Documentation

- **Added** FEATURE_GUIDE.md - Comprehensive feature documentation
- **Added** OBS_TEMPLATE_GUIDE.md - Scene template import and customization guide
- **Added** MIGRATION_GUIDE.md - Upgrade instructions from v1.x
- **Updated** README.md - Expanded with new features, authentication, and setup steps
- **Updated** CHANGELOG.md - This file

### Configuration

- **Added** YouTube API key to .env (VITE_YOUTUBE_API_KEY)
- **Updated** Supabase configuration for authentication
- **Added** Role-based access control logic

### Breaking Changes

- **Changed** UI layout from 2 tabs to 3 tabs
- **Changed** Production tab grid from 3 columns to 12-column responsive grid
- **Added** Authentication requirement for advanced features
- **Added** Role restrictions (Guest users have limited access)
- **Requires** OBS text sources named `LowerThird_Title` and `LowerThird_Subtitle` for lower thirds feature

### Deployment

- **Updated** Deployed URL: https://ggi5h4n1l6el.space.minimax.io
- **Note:** OBS WebSocket connections only work on localhost (security restrictions)
- **Recommended** Use local development for OBS control

---

## [1.1.0] - 2025-10-12 - YouTube Player Integration

### Added
- Embedded YouTube player in dashboard
- `YouTubePlayer.tsx` component
- `react-youtube` dependency
- Real-time video control from queue
- Player positioned in Production tab (right column)

### Changed
- YouTube queue now includes "Play" button
- Clicking play updates the embedded player
- Player shows video from queue selection

### Fixed
- Video metadata fetching via Supabase Edge Function

---

## [1.0.0] - 2025-10-11 - Initial Release

### Added

#### Core Features
- OBS WebSocket connection panel
- Scene switcher with live indicator
- Audio mixer with volume sliders and mute controls
- YouTube queue manager with metadata fetching
- Production timers (countdown and count-up)
- Show rundown editor
- Collaborative notes panel
- Real-time synchronization via Supabase

#### Components
- `ConnectionPanel.tsx` - OBS WebSocket connection
- `SceneSwitcher.tsx` - Scene selection and switching
- `AudioMixer.tsx` - Audio source control
- `YouTubeQueue.tsx` - YouTube video queue
- `TimerPanel.tsx` - Production timers
- `RundownEditor.tsx` - Show segment planning
- `NotesPanel.tsx` - Collaborative notes
- `ErrorBoundary.tsx` - Error handling

#### Hooks
- `useOBSWebSocket.ts` - OBS WebSocket integration
- `use-mobile.tsx` - Mobile device detection

#### Configuration
- Vite + React + TypeScript setup
- TailwindCSS for styling
- Supabase integration
- Environment variable configuration

#### Database Tables
- `youtube_queue` - Video queue storage
- `timers` - Production timers
- `rundown_segments` - Show rundown
- `production_notes` - Collaborative notes

#### Documentation
- README.md with setup instructions
- QUICKSTART.md for new users
- ENHANCEMENT_ROADMAP.md for future features

#### OBS Integration
- Scene list fetching
- Scene switching
- Audio source detection
- Volume control (-60dB to 0dB)
- Mute/unmute functionality
- Real-time event listeners

#### YouTube Integration
- Video ID or URL parsing
- Metadata fetching via YouTube Data API v3
- Supabase Edge Function (`youtube-metadata`)
- Thumbnail display
- Duration formatting
- Channel information

### Technical Stack
- React 18
- TypeScript 5
- Vite 6
- TailwindCSS 3
- Supabase (Database + Edge Functions)
- obs-websocket-js 5
- Lucide React (icons)

---

## Release History

- **v2.0.0** - Professional Suite (October 13, 2025)
- **v1.1.0** - YouTube Player Integration (October 12, 2025)
- **v1.0.0** - Initial Release (October 11, 2025)

---

**Note:** All dates are based on project timeline. Actual deployment may vary.
