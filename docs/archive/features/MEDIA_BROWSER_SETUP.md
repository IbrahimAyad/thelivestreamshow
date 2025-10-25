# Media Browser Overlay Setup Guide

## What Changed?

BetaBot now uses a **full-screen iframe overlay** to show Google Images or YouTube results instead of extracting URLs from Perplexity.

### Old Approach ❌
```
BetaBot → Perplexity API → Parse URLs → Database → Display images
```
**Problems:** Complex, unreliable URL extraction, CORS issues, limited results

### New Approach ✅
```
BetaBot → Trigger overlay → iframe shows Google/YouTube → Done!
```
**Benefits:** Simpler, better results, more reliable, natural browsing

## Setup Instructions

### 1. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create betabot_media_browser table
CREATE TABLE IF NOT EXISTS betabot_media_browser (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('images', 'videos')),
  session_id UUID REFERENCES betabot_sessions(id) ON DELETE CASCADE,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_betabot_media_browser_session
  ON betabot_media_browser(session_id);

CREATE INDEX IF NOT EXISTS idx_betabot_media_browser_created
  ON betabot_media_browser(created_at DESC);

-- Enable RLS
ALTER TABLE betabot_media_browser ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read media browser"
  ON betabot_media_browser FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert media browser"
  ON betabot_media_browser FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_media_browser;
```

Or run the migration file:
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f supabase-migrations/create-betabot-media-browser-table.sql
```

### 2. Rebuild and Deploy

Already done! The code is built and ready.

### 3. Test It

1. Open your **Broadcast Overlay View** in OBS
2. Open the **BetaBot Control Panel**
3. Start a BetaBot session
4. Say: **"Hey BetaBot, show me pictures of cats"**
5. Watch the overlay appear with Google Images!

## How It Works

### Voice Commands

| Command | Result |
|---------|--------|
| "show me **pictures** of X" | Google Images search for X |
| "show me **images** of X" | Google Images search for X |
| "show me X" (default) | Google Images search for X |
| "show me **videos** of X" | YouTube search for X |

### Overlay Features

- **Auto-detects content type**: Keywords like "video" trigger YouTube
- **30-second auto-close**: Countdown timer shows remaining time
- **Manual close**: Click the ✕ button anytime
- **Smooth animations**: Slide-in effect with loading indicator
- **Full-screen**: Takes over entire broadcast overlay
- **Beautiful header**: Shows search query and controls

### Technical Details

**MediaBrowserOverlay Component:**
- Uses `<iframe>` to embed Google/YouTube
- Sandbox mode for security
- CSS animations for smooth transitions
- Responsive design

**Database Flow:**
```
1. BetaBot detects "show me..." phrase
2. Inserts row into betabot_media_browser table
3. BroadcastOverlayView real-time subscription fires
4. MediaBrowserOverlay component renders
5. iframe loads Google Images or YouTube
6. Auto-closes after 30 seconds
```

**URLs Generated:**
- Images: `https://www.google.com/search?q={query}&tbm=isch`
- Videos: `https://www.youtube.com/results?search_query={query}`

## Customization

### Change Auto-Close Duration

In `BroadcastOverlayView.tsx` line 469:
```tsx
durationSeconds={30}  // Change to any value in seconds
```

### Detect Different Keywords

In `BetaBotControlPanel.tsx` line 280:
```tsx
const type = event.query.toLowerCase().includes('video') ? 'videos' : 'images';

// Add more conditions:
const type = event.query.toLowerCase().match(/video|clip|movie/)
  ? 'videos'
  : 'images';
```

### Style Changes

All styles are inline in `MediaBrowserOverlay.tsx` - edit the `<style>` tag to customize colors, sizes, animations, etc.

## Troubleshooting

### Overlay doesn't appear
- Check Supabase SQL Editor: Is the table created?
- Check console: Any real-time subscription errors?
- Check RLS policies: Are they enabled?

### iframe shows "blocked" message
- Google/YouTube may block embeds in some regions
- Try adding `allow-scripts allow-same-origin` to sandbox (already included)

### Search doesn't work
- Check console: Is the visual search phrase being detected?
- Check database: Is a row being inserted?
- Check BroadcastOverlayView: Is the subscription active?

## Migration from Old System

The old `betabot_visual_content` table is still functional for backward compatibility. You can:

1. **Keep both**: Old system still works alongside new one
2. **Remove old**: Delete `VisualContentDisplay` component and subscriptions
3. **Migrate data**: Not needed - new system doesn't store URLs

## Next Steps

- Test with different queries
- Adjust auto-close duration to your preference
- Customize styling to match your broadcast theme
- Add keyboard shortcuts for manual control

Enjoy the simplified visual search! 🎉
