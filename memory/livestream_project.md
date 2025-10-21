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

### Status
- ✅ Design phase completed - design spec created
- ✅ Supabase authorization completed
- ✅ Database schema created (video_queue, video_play_history, video_preferences, scheduled_videos, video_recommendations)
- ✅ Frontend development completed
- ✅ Advanced features implemented (analytics export, scheduled playback, dead air filler)
- ✅ Edge function deployed for scheduled video checking (cron job running every minute)
- ✅ Application deployed with all features
- ⏳ Awaiting user testing preference

### Database Tables
- video_queue: Queue management for videos
- video_play_history: Track played videos with engagement metrics
- video_preferences: User category preferences
- scheduled_videos: Scheduled playback system
- video_recommendations: AI-generated recommendations

### Deployment
- URL: https://9ssymohko8u8.space.minimax.io
- Control Dashboard: https://9ssymohko8u8.space.minimax.io/video-player
- Broadcast View: https://9ssymohko8u8.space.minimax.io/broadcast/video-player

### New Features Implemented
- Analytics export (CSV and JSON)
- Scheduled video playback with cron job
- Dead air filler mode
- Tabbed interface for Queue/Analytics/Scheduled views
- Scheduling modal for individual videos
