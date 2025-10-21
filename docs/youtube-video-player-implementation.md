# YouTube Video Player - Implementation Documentation

## Project Overview

The YouTube Video Player is a smart video queue management system designed for live streaming with YouTube content. It features intelligent recommendations, scheduled playback, and real-time synchronization between control and broadcast interfaces.

## Deployment Information

**Live Application**: https://7nvmfm676gip.space.minimax.io

**Application Routes**:
- **Home**: https://7nvmfm676gip.space.minimax.io
- **Control Dashboard**: https://7nvmfm676gip.space.minimax.io/video-player
- **Broadcast View (OBS)**: https://7nvmfm676gip.space.minimax.io/broadcast/video-player

## Technology Stack

### Frontend
- React 18.3 with TypeScript
- Vite 6.0 build tool
- Tailwind CSS 3.4 for styling
- React Router 6 for navigation
- DND Kit for drag-and-drop queue management
- React YouTube for video playback

### Backend
- Supabase (PostgreSQL database)
- Real-time subscriptions for state synchronization
- YouTube Data API v3 for video search and metadata

### Design System
- Brand Colors: Red (#EF4444), Yellow (#EAB308), Black (#000000), Grey (#6B7280)
- Typography: Inter font family
- Component library: Lucide React for icons

## Features Implemented

### 1. Control Dashboard (/video-player)

#### YouTube Search
- Real-time video search using YouTube Data API
- Displays 12 results with thumbnails, titles, channels, and view counts
- Video duration display on thumbnails
- One-click add to queue

#### Video Queue Manager
- Drag-and-drop reordering with @dnd-kit/sortable
- Visual feedback during drag operations
- Start/end time pickers for video clipping
- Duration calculation display
- Remove individual videos
- Clear all queue button
- Real-time sync across all connected clients

#### Playback Controls
- Play/Pause toggle
- Skip to next video
- Volume slider (0-100%)
- Auto-advance toggle
- State synchronized with broadcast view

#### Smart Recommendations Panel
- AI-generated recommendations based on play history
- Category filters: All, Funny, Fails, Gaming, Tech, Wholesome, Trending
- Energy level badges: Hype, Chill, Funny
- Recommendation scores displayed
- "Surprise Me" button for random selection
- Auto-categorization using video metadata

### 2. Broadcast View (/broadcast/video-player)

#### Full-Screen Video Player
- 1920x1080 optimized for OBS browser source
- YouTube IFrame API integration
- Auto-play support
- Clip start/end time enforcement
- Clean, minimal UI

#### Overlay Display
- "Now Playing" indicator
- Video title and channel display
- Bottom overlay bar (auto-hides when paused)
- Black background with backdrop blur

#### Real-Time Synchronization
- Instant playback state updates
- Queue changes reflected immediately
- Volume control sync
- Play/pause sync

### 3. Smart Recommendation Engine

#### Category Detection
- Automatic video categorization using keywords
- Categories: Funny, Fails, Gaming, Tech, Wholesome, Trending
- Analyzes title and description for keyword matching

#### Energy Level Detection
- Three levels: Hype, Chill, Funny
- Based on keywords and video duration
- Visual badges with distinct colors

#### Preference Learning
- Tracks play history with engagement scores
- Updates category preferences based on watch duration
- Recommendation score calculation:
  - Base category preference score
  - Random factor for diversity
  - Sorted by total score

#### Play History Tracking
- Records video ID, title, channel
- Tracks duration watched vs total duration
- Calculates engagement score (0-1)
- Auto-categorizes played videos
- Updates category preferences

## Database Schema

### video_queue
Stores the current queue of videos to be played.

```sql
CREATE TABLE video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  channel VARCHAR(255),
  thumbnail_url TEXT,
  duration INTEGER,
  start_time INTEGER DEFAULT 0,
  end_time INTEGER,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### video_play_history
Tracks all played videos with engagement metrics.

```sql
CREATE TABLE video_play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  channel VARCHAR(255),
  played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  duration_watched INTEGER,
  engagement_score DECIMAL(3,2),
  category VARCHAR(100)
);
```

### video_preferences
Stores user preferences for different video categories.

```sql
CREATE TABLE video_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) UNIQUE NOT NULL,
  preference_score DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### scheduled_videos
Manages scheduled video playback.

```sql
CREATE TABLE scheduled_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  channel VARCHAR(255),
  thumbnail_url TEXT,
  duration INTEGER,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_play BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  played BOOLEAN DEFAULT false
);
```

### video_recommendations
Stores AI-generated video recommendations.

```sql
CREATE TABLE video_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  channel VARCHAR(255),
  thumbnail_url TEXT,
  recommendation_score DECIMAL(5,2),
  category VARCHAR(100),
  energy_level VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Integration

### YouTube Data API v3

**Endpoints Used**:
- `search` - Search for videos by query
- `videos` - Get detailed video information
- `playlistItems` - Get videos from playlists (future feature)

**API Key**: Configured via environment variable `VITE_YOUTUBE_API_KEY`

**Functions Implemented**:
- `searchYouTubeVideos()` - Search and fetch video details
- `getVideoDetails()` - Get metadata for specific video
- `getPlaylistVideos()` - Import playlist videos (future feature)

## Real-Time Features

### Supabase Realtime

**Queue Synchronization**:
```typescript
supabase
  .channel('video_queue_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'video_queue' },
    () => fetchQueue()
  )
  .subscribe();
```

**Playback State Synchronization**:
```typescript
supabase
  .channel('playback_state')
  .on('broadcast', { event: 'playback_update' }, 
    ({ payload }) => setState(payload)
  )
  .subscribe();
```

## Usage Guide

### Setup for OBS

1. **Add Browser Source**:
   - Source URL: `https://7nvmfm676gip.space.minimax.io/broadcast/video-player`
   - Width: 1920
   - Height: 1080
   - Refresh browser when scene becomes active: ✓

2. **Configure Control Dashboard**:
   - Open: `https://7nvmfm676gip.space.minimax.io/video-player`
   - Search for videos
   - Add videos to queue
   - Adjust start/end times for clipping

3. **Control Playback**:
   - Use play/pause button
   - Skip to next video
   - Adjust volume
   - Enable auto-advance for continuous playback

### Video Clipping

1. Add video to queue
2. In queue item, adjust start time (in seconds)
3. Adjust end time (in seconds)
4. Duration display shows clip length
5. Video will play only the specified segment

### Smart Recommendations

1. Search for videos to populate recommendations
2. System auto-categorizes videos
3. Play videos to build preference history
4. Recommendations improve based on watch patterns
5. Use category filters to browse specific types
6. "Surprise Me" adds random recommendation to queue

## Component Architecture

### Custom Hooks

**useQueue()**:
- Manages video queue state
- Provides CRUD operations
- Real-time synchronization
- Drag-and-drop reordering support

**usePlaybackState()**:
- Manages playback state (playing, paused, volume)
- Broadcasts state changes
- Synchronizes across tabs/devices
- Persists state to localStorage

### Key Components

**VideoCard**: Search result card with add-to-queue action

**QueueItem**: Draggable queue item with time controls

**RecommendationCard**: Smart recommendation with category/energy badges

**VideoPlayerControl**: Main control dashboard page

**BroadcastView**: Full-screen OBS player view

## Styling System

### Design Tokens

**Colors**:
- Primary (Red): #EF4444, #DC2626, #B91C1C
- Accent (Yellow): #FBBF24, #EAB308
- Neutral: #FAFAFA to #000000 (11 shades)
- Semantic: Success, Warning, Error, Info

**Spacing**:
- xs: 4px, sm: 8px, md: 12px, lg: 16px
- xl: 24px, 2xl: 32px, 3xl: 48px, 4xl: 64px

**Typography**:
- Font: Inter (sans-serif)
- Sizes: xs (12px) to 3xl (30px)
- Weights: Regular (400), Medium (500), Semibold (600), Bold (700)

**Animations**:
- Fast: 200ms (micro-interactions)
- Normal: 250ms (standard transitions)
- Slow: 300ms (panel animations)
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

## Future Enhancements

### Planned Features
1. **Scheduled Playback**: Auto-play videos at specific times
2. **Playlist Import**: Import entire YouTube playlists
3. **Analytics Dashboard**: View play history charts and statistics
4. **Clip Markers**: Save favorite moments with timestamps
5. **Dead Air Filler**: Auto-play when queue is empty
6. **Multi-user Support**: Role-based access control
7. **Export/Import**: Save and load queue configurations
8. **Keyboard Shortcuts**: Quick controls for streamers

### Technical Improvements
1. Progressive Web App (PWA) support
2. Offline queue caching
3. Background sync for scheduled videos
4. WebSocket optimization for lower latency
5. Server-side rendering for SEO

## Troubleshooting

### Common Issues

**Videos not playing**:
- Check YouTube API key validity
- Verify video ID is correct
- Ensure video is not region-restricted
- Check browser console for errors

**Queue not syncing**:
- Refresh browser
- Check Supabase connection
- Verify real-time subscriptions are active
- Check network tab for errors

**Recommendations not appearing**:
- Perform a search first to populate data
- Check database for video_recommendations table
- Verify recommendation algorithm is running

**OBS browser source black screen**:
- Verify URL is correct
- Check OBS browser source settings
- Ensure dimensions are 1920x1080
- Try refreshing the browser source

## Development

### Local Setup

```bash
cd /workspace/youtube-video-player
pnpm install
pnpm run dev
```

### Environment Variables

Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

### Build

```bash
pnpm run build
```

Output: `dist/` directory

### Type Checking

```bash
pnpm run type-check
```

## Credits

**Author**: MiniMax Agent
**Date**: 2025-10-21
**Project**: The Livestream Show - YouTube Video Player Integration
**GitHub**: https://github.com/IbrahimAyad/thelivestreamshow

## License

This integration is part of The Livestream Show project.
