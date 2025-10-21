# Integration Guide: YouTube Video Player for The Livestream Show

This guide explains how to integrate the YouTube Video Player feature into your existing repository.

## Quick Overview

The YouTube Video Player has been developed as a standalone feature and is ready for integration into your existing project at https://github.com/IbrahimAyad/thelivestreamshow.

**Live Demo**: https://7nvmfm676gip.space.minimax.io

## Integration Steps

### 1. Copy Source Files

Copy the following directories from `/workspace/youtube-video-player/src/` to your project:

```
src/
  components/video-player/
    - VideoCard.tsx
    - QueueItem.tsx
    - RecommendationCard.tsx
  
  pages/
    - VideoPlayerControl.tsx
    - BroadcastView.tsx
  
  hooks/
    - useQueue.ts
    - usePlaybackState.ts
  
  lib/
    - youtube.ts
    - recommendations.ts
    - supabase.ts (merge with existing)
  
  types/
    - video.ts
```

### 2. Install Dependencies

Add these packages to your project:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-youtube
```

### 3. Environment Variables

Add to your `.env` file:

```env
VITE_YOUTUBE_API_KEY=AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw
```

### 4. Update Routes

In your main App.tsx or router configuration, add:

```typescript
import { VideoPlayerControl } from './pages/VideoPlayerControl';
import { BroadcastView } from './pages/BroadcastView';

// Add to your Routes:
<Route path="/video-player" element={<VideoPlayerControl />} />
<Route path="/broadcast/video-player" element={<BroadcastView />} />
```

### 5. Database Setup

The database tables have already been created in your Supabase instance:
- `video_queue`
- `video_play_history`
- `video_preferences`
- `scheduled_videos`
- `video_recommendations`

No additional database setup required.

### 6. Navigation Integration

Add links to your existing dashboard navigation:

```typescript
<NavLink to="/video-player">
  <Monitor className="w-5 h-5" />
  YouTube Player
</NavLink>

<NavLink to="/broadcast/video-player">
  <Tv className="w-5 h-5" />
  Broadcast View
</NavLink>
```

## File Structure in Your Project

```
your-project/
  src/
    components/
      video-player/          # NEW: YouTube player components
      [your existing components]
    
    pages/
      VideoPlayerControl.tsx # NEW: Control dashboard
      BroadcastView.tsx      # NEW: OBS broadcast view
      [your existing pages]
    
    hooks/
      useQueue.ts            # NEW: Queue management
      usePlaybackState.ts    # NEW: Playback state sync
      [your existing hooks]
    
    lib/
      youtube.ts             # NEW: YouTube API utilities
      recommendations.ts     # NEW: Smart recommendation engine
      supabase.ts            # EXISTING: Add YouTube features
```

## Usage in Your Livestream

### For OBS Setup:

1. **Add Browser Source**:
   - URL: `http://localhost:5173/broadcast/video-player` (development)
   - URL: `https://your-domain.com/broadcast/video-player` (production)
   - Width: 1920
   - Height: 1080

2. **Control Panel**:
   - Open control dashboard in browser
   - Search and queue videos
   - Control playback during stream

### Integration with Existing Features:

This feature works alongside your existing:
- Question Banner
- Graphics Gallery
- Lower Thirds
- AI Engagement Tools
- F5-TTS Integration

## Customization

### Brand Colors

The feature already uses your brand colors:
- Red: #EF4444 (primary actions)
- Yellow: #EAB308 (accents)
- Black/Grey: Neutral UI

To modify colors, update `tailwind.config.js`.

### Layout Adjustments

All components use Tailwind CSS classes. Modify responsive breakpoints in component files if needed.

## Testing

1. **Development**:
   ```bash
   pnpm run dev
   ```
   Navigate to `http://localhost:5173/video-player`

2. **Production Build**:
   ```bash
   pnpm run build
   pnpm run preview
   ```

3. **OBS Integration Test**:
   - Add browser source with broadcast view URL
   - Test playback controls
   - Verify real-time sync

## API Quotas

YouTube Data API v3 has daily quotas:
- Default: 10,000 units/day
- Search: 100 units per request
- Video details: 1 unit per request

Monitor usage in Google Cloud Console.

## Support & Maintenance

### Common Modifications

**Change default search results count**:
```typescript
// In src/lib/youtube.ts
export async function searchYouTubeVideos(query: string, maxResults: number = 12)
// Change 12 to your desired number
```

**Modify recommendation categories**:
```typescript
// In src/lib/recommendations.ts
const CATEGORY_KEYWORDS: Record<VideoCategory, string[]> = {
  // Add or modify categories here
};
```

**Adjust energy level detection**:
```typescript
// In src/lib/recommendations.ts
const ENERGY_KEYWORDS = {
  // Modify keyword mappings
};
```

## Troubleshooting Integration

### Build Errors

**TypeScript errors with react-youtube**:
The implementation includes a type workaround. If issues persist:
```typescript
const YouTube = YouTubeComponent as any;
```

**Missing dependencies**:
```bash
pnpm install
```

**Tailwind classes not applying**:
Ensure `tailwind.config.js` includes:
```javascript
content: [
  './src/**/*.{ts,tsx}',
]
```

### Runtime Issues

**Supabase connection errors**:
- Verify environment variables
- Check Supabase project is active
- Confirm database tables exist

**YouTube API errors**:
- Verify API key is valid
- Check quota hasn't been exceeded
- Ensure API is enabled in Google Cloud Console

## Deployment Checklist

- [ ] Copy all source files
- [ ] Install dependencies
- [ ] Add environment variables
- [ ] Update routes
- [ ] Test locally
- [ ] Build production version
- [ ] Deploy to hosting
- [ ] Configure OBS browser source
- [ ] Test live stream integration

## Files Reference

All integration files are located in:
- Source code: `/workspace/youtube-video-player/src/`
- Documentation: `/workspace/docs/youtube-video-player-implementation.md`
- Design spec: `/workspace/docs/youtube-video-player-design-spec.md`

## Contact & Support

For questions or issues with this integration:
1. Review the implementation documentation
2. Check the design specification
3. Consult the troubleshooting section
4. Review component source code for inline comments

---

**Integration completed**: 2025-10-21
**Compatible with**: React 18.3, TypeScript, Tailwind CSS 3.4, Supabase
**Tested on**: Vite 6.0 build system
