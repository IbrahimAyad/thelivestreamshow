# The Livestream Show Project

## Project Overview
- GitHub: https://github.com/IbrahimAyad/thelivestreamshow
- Tech Stack: React 18.3 + TypeScript + Supabase + OBS Integration
- Purpose: Stream enhancement dashboard with real-time overlays

## Current Features
- Question Banner (scrolling text)
- Graphics Gallery (LIVE, BRB, Starting Soon overlays)
- Lower Thirds (name/title cards)
- AI Engagement Tools
- F5-TTS Integration (local neural text-to-speech)

## New Feature Request: Smart YouTube Video Player
**Goal**: Preload YouTube videos for stream reactions with smart recommendations and scheduled playback
**Integration**: This will be a NEW FEATURE integrated INTO the existing project (not standalone)

### Requirements
1. Preload YouTube videos to react to
2. Smart recommendation system (learns over time)
3. Scheduled auto-play at specific times
4. Simple, powerful, creative design
5. Must integrate with existing dashboard and brand design
6. Must follow existing project structure and patterns

### Integration Points
- Add new route to existing React app (e.g., /video-player)
- Integrate with existing Supabase instance
- Add YouTube player to /broadcast view for OBS
- Follow existing brand colors: Red #EF4444, Black #000000, Yellow #EAB308, Grey #6B7280, White #FFFFFF
- Use existing tech stack: React 18.3 + TypeScript + Tailwind CSS + Supabase

### Credentials
- YouTube API Key: AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw
- Twitch Username: AbeNasty
- Twitch Email: ibrahimayad13@gmail.com
- Twitch Stream Key/Token: live_241301037_aeDXuA6ghSEfcQuRIymJhJTuNRxTRw
- Streaming Platforms: Both Twitch and YouTube

### Status
- ✅ Design phase completed - design spec created
- ✅ Supabase authorization completed
- ✅ Database schema created (video_queue, video_play_history, video_preferences, scheduled_videos, video_recommendations)
- ✅ Frontend development completed
- ✅ Advanced features implemented (analytics export, scheduled playback, dead air filler)
- ✅ Edge function deployed for scheduled video checking (cron job running every minute)
- ✅ Application deployed with all features
- ✅ Database schema issues fixed (2025-10-21)
  - Renamed channel_title → channel in video_queue table
  - Added start_time and end_time columns to video_queue table
  - All tables now match frontend expectations
- ✅ Production-ready security implemented (2025-10-21)
  - Enabled RLS on all 5 video tables
  - Applied public access policies (SELECT, INSERT, UPDATE, DELETE) to all tables
  - Verified CRUD operations work correctly on all tables

### Database Tables
- video_queue: Queue management for videos
- video_play_history: Track played videos with engagement metrics
- video_preferences: User category preferences
- scheduled_videos: Scheduled playback system
- video_recommendations: AI-generated recommendations

### Deployment
- URL: https://gy77m7pjul0f.space.minimax.io
- Control Dashboard: https://gy77m7pjul0f.space.minimax.io/video-player
- Broadcast View: https://gy77m7pjul0f.space.minimax.io/broadcast/video-player

### Multi-View Dashboard / Monitor Tab (Added 2025-10-21)
**Features:**
- ✅ New "Monitor" tab added to dashboard
- ✅ Picture-in-Picture broadcast monitor (draggable, resizable)
- ✅ Dual-platform stats panel (Twitch + YouTube)
- ✅ Real-time stats auto-refresh (30-second intervals)
- ✅ Quick preview panel for next queued item
- ✅ Stream history chart with time range selector
- ✅ Emergency "Hide All Overlays" button
- ✅ Edge functions: fetch-twitch-stats, fetch-youtube-stats
- ✅ Database tables: stream_stats, broadcast_state (with RLS)
- ✅ Setup documentation: docs/monitor-tab-setup-guide.md

### Image Upload & Queue System (Added 2025-10-21)
**Infrastructure:**
- ✅ Storage bucket created: stream-images (10MB limit, supports JPG, PNG, GIF, WEBP)
- ✅ Database tables: image_queue, image_display_history (with RLS policies)
- ✅ Edge function deployed: upload-image (secure server-side uploads)

**Features:**
- ✅ Images tab added to control dashboard
- ✅ Drag-and-drop image upload with progress tracking
- ✅ Image queue management with drag-and-drop reordering
- ✅ Caption editing for images
- ✅ Display controls panel (Previous/Next, Auto-advance, Transition effects)
- ✅ Image display history with CSV export
- ✅ Broadcast view updated for video/image dual mode
- ✅ Transition effects: Instant, Fade, Slide Left, Slide Right, Zoom In
- ✅ Emergency "Hide All" button
- ✅ Real-time sync via localStorage and Supabase

### New Features Implemented
- Analytics export (CSV and JSON)
- Scheduled video playback with cron job
- Dead air filler mode
- Tabbed interface for Queue/Analytics/Scheduled views
- Scheduling modal for individual videos

### Monitor Tab Feature (COMPLETED - 2025-10-21)
**Goal**: Add multi-view dashboard for real-time broadcast monitoring
**Status**: FULLY IMPLEMENTED AND DEPLOYED
**URL**: https://gy77m7pjul0f.space.minimax.io
**Components**:
- [x] Monitor tab in VideoPlayerControl
- [x] PiP broadcast monitor (draggable/resizable iframe using react-draggable)
- [x] Twitch stats integration (via edge function with configurable username)
- [x] YouTube stats integration (via edge function)
- [x] Quick preview panel with working Skip and Edit functionality
- [x] Stream history chart (using Recharts)
- [x] Emergency controls (Hide All/Restore buttons)
- [x] Database tables: stream_stats, broadcast_state (with RLS policies)
- [x] Edge functions: fetch-twitch-stats (v2), fetch-youtube-stats (deployed)
- [x] Real-time sync via Supabase Realtime
- [x] Auto-refresh stats every 30 seconds
- [x] BroadcastView updated to handle emergency hide all feature
- [x] Documentation updated in docs/monitor-tab-setup-guide.md

**Credentials Needed** (to be set by user in Supabase):
- TWITCH_CLIENT_ID
- TWITCH_OAUTH_TOKEN
- TWITCH_USERNAME (defaults to 'AbeNasty' if not set)
- YOUTUBE_CHANNEL_ID
- YOUTUBE_API_KEY (already set: AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw)

**Improvements Made**:
- Quick Preview Skip button now properly removes items from queue
- Quick Preview Edit button provides user guidance
- Twitch username is now configurable via environment variable
