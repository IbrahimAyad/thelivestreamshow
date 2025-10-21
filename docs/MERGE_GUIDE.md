# Monitor Tab Feature - Merge Guide

## Overview

This guide provides step-by-step instructions for merging the Monitor tab feature into the main GitHub repository at https://github.com/IbrahimAyad/thelivestreamshow.

**Feature Branch**: Monitor Dashboard
**Target Repository**: https://github.com/IbrahimAyad/thelivestreamshow
**Deployment URL**: https://gy77m7pjul0f.space.minimax.io

## What Was Added/Modified

### New Frontend Components

All new components are located in `youtube-video-player/src/components/monitor/`:

1. **MonitorTab.tsx** - Main container component for the Monitor tab
2. **PiPBroadcastMonitor.tsx** - Draggable picture-in-picture broadcast preview
3. **DualPlatformStats.tsx** - Real-time statistics panel for Twitch and YouTube
4. **QuickPreview.tsx** - Preview and control panel for next queued item
5. **StreamHistoryChart.tsx** - Historical viewer count visualization
6. **EmergencyControls.tsx** - Emergency hide all/restore buttons

### New Custom Hooks

Located in `youtube-video-player/src/hooks/`:

1. **useBroadcastState.ts** - Manages broadcast state with Supabase Realtime sync
2. **useStreamStats.ts** - Fetches and manages Twitch/YouTube statistics

### Modified Files

1. **youtube-video-player/src/pages/VideoPlayerControl.tsx**
   - Added 'monitor' to the Tab type
   - Added Monitor tab button in navigation
   - Added conditional rendering for MonitorTab component
   - Imported MonitorTab component

2. **youtube-video-player/src/pages/BroadcastView.tsx**
   - Added useBroadcastState hook import
   - Added emergency hide all detection logic
   - Updated display conditions to respect hide_all flag

3. **youtube-video-player/package.json**
   - Added dependencies: `recharts`, `react-draggable`

### New Supabase Database Tables

Created via migration: `enable_rls_on_monitor_tables`

#### Table: `stream_stats`
```sql
CREATE TABLE stream_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  viewer_count INTEGER,
  chat_rate FLOAT,
  follower_count INTEGER,
  subscriber_count INTEGER,
  stream_status TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stream_stats_platform ON stream_stats(platform);
CREATE INDEX idx_stream_stats_recorded_at ON stream_stats(recorded_at DESC);
```

#### Table: `broadcast_state`
```sql
CREATE TABLE broadcast_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hide_all BOOLEAN DEFAULT false,
  active_scene TEXT DEFAULT 'none',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_broadcast_state_updated_at ON broadcast_state(updated_at DESC);
```

**RLS Policies**: Both tables have public access policies (SELECT, INSERT, UPDATE, DELETE) for all users.

### New Supabase Edge Functions

Located in `supabase/functions/`:

1. **fetch-twitch-stats/index.ts**
   - Fetches Twitch stream statistics via Helix API
   - Stores data in `stream_stats` table
   - Requires: TWITCH_CLIENT_ID, TWITCH_OAUTH_TOKEN environment variables
   - Optional: TWITCH_USERNAME (defaults to 'AbeNasty')

2. **fetch-youtube-stats/index.ts**
   - Fetches YouTube live stream statistics via Data API v3
   - Stores data in `stream_stats` table
   - Requires: YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID environment variables

### New Documentation

1. **docs/monitor-tab-setup-guide.md** - Complete user setup guide
2. **docs/MERGE_GUIDE.md** - This file
3. **docs/API_SETUP.md** - Detailed API credential setup
4. **docs/FEATURE_SUMMARY.md** - User-facing feature summary

## Step-by-Step Merge Instructions

### Prerequisites

1. Access to the GitHub repository
2. Local development environment set up
3. Supabase project access
4. Node.js and pnpm installed

### Step 1: Pull Changes to Local Repository

```bash
# Navigate to your local repository
cd /path/to/thelivestreamshow

# Ensure you're on the main branch
git checkout main
git pull origin main

# Create a new branch for the monitor feature
git checkout -b feature/monitor-dashboard
```

### Step 2: Copy New Files

Copy the following directories and files from the development workspace:

**Frontend Components:**
```bash
# Copy new monitor components
cp -r youtube-video-player/src/components/monitor/ <your-repo>/src/components/

# Copy new hooks
cp youtube-video-player/src/hooks/useBroadcastState.ts <your-repo>/src/hooks/
cp youtube-video-player/src/hooks/useStreamStats.ts <your-repo>/src/hooks/
```

**Edge Functions:**
```bash
# Copy edge functions
cp -r supabase/functions/fetch-twitch-stats/ <your-repo>/supabase/functions/
cp -r supabase/functions/fetch-youtube-stats/ <your-repo>/supabase/functions/
```

**Documentation:**
```bash
# Copy documentation files
cp docs/monitor-tab-setup-guide.md <your-repo>/docs/
cp docs/MERGE_GUIDE.md <your-repo>/docs/
cp docs/API_SETUP.md <your-repo>/docs/
cp docs/FEATURE_SUMMARY.md <your-repo>/docs/
```

### Step 3: Apply File Modifications

#### Modify `src/pages/VideoPlayerControl.tsx`:

1. Add import at the top:
```typescript
import { Monitor as MonitorIcon } from 'lucide-react';
import { MonitorTab } from '@/components/monitor/MonitorTab';
```

2. Update the Tab type:
```typescript
type Tab = 'queue' | 'analytics' | 'scheduled' | 'images' | 'monitor';
```

3. Add conditional rendering before the main return statement:
```typescript
// If Monitor tab is active, render it fullscreen
if (activeTab === 'monitor') {
  return <MonitorTab />;
}
```

4. Add Monitor tab button in the tab navigation (after the Images tab button):
```typescript
<button
  onClick={() => setActiveTab('monitor' as Tab)}
  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
    activeTab === ('monitor' as Tab)
      ? 'text-primary-600 border-primary-600'
      : 'text-neutral-600 border-transparent hover:text-neutral-900'
  }`}
>
  <MonitorIcon className="w-4 h-4 inline mr-1" />
  Monitor
</button>
```

#### Modify `src/pages/BroadcastView.tsx`:

1. Add import:
```typescript
import { useBroadcastState } from '@/hooks/useBroadcastState';
```

2. Add hook usage in the component:
```typescript
const { state: broadcastState } = useBroadcastState();
const hideAll = broadcastState?.hide_all || false;
```

3. Update image display condition:
```typescript
// Change from:
if (displayMode === 'image' && imageDisplayState.currentImageUrl) {

// To:
if (displayMode === 'image' && imageDisplayState.currentImageUrl && !hideAll) {
```

4. Update no content condition:
```typescript
// Change from:
if (displayMode === 'none') {
  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="text-white text-2xl">No content to display</div>
    </div>
  );
}

// To:
if (displayMode === 'none' || hideAll) {
  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      {hideAll ? (
        <div className="text-white text-2xl">All overlays hidden</div>
      ) : (
        <div className="text-white text-2xl">No content to display</div>
      )}
    </div>
  );
}
```

### Step 4: Install Dependencies

```bash
cd youtube-video-player  # or your React app directory
pnpm add recharts react-draggable
```

### Step 5: Create Database Tables

Connect to your Supabase project and run:

```sql
-- Create stream_stats table
CREATE TABLE stream_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  viewer_count INTEGER,
  chat_rate FLOAT,
  follower_count INTEGER,
  subscriber_count INTEGER,
  stream_status TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create broadcast_state table
CREATE TABLE broadcast_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hide_all BOOLEAN DEFAULT false,
  active_scene TEXT DEFAULT 'none',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on stream_stats
ALTER TABLE stream_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON stream_stats
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON stream_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON stream_stats
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON stream_stats
  FOR DELETE USING (true);

-- Enable RLS on broadcast_state
ALTER TABLE broadcast_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON broadcast_state
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON broadcast_state
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON broadcast_state
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON broadcast_state
  FOR DELETE USING (true);

-- Create indexes
CREATE INDEX idx_stream_stats_platform ON stream_stats(platform);
CREATE INDEX idx_stream_stats_recorded_at ON stream_stats(recorded_at DESC);
CREATE INDEX idx_broadcast_state_updated_at ON broadcast_state(updated_at DESC);
```

### Step 6: Deploy Edge Functions

Using Supabase CLI:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy edge functions
supabase functions deploy fetch-twitch-stats
supabase functions deploy fetch-youtube-stats
```

### Step 7: Configure Environment Variables

In your Supabase Dashboard (Settings → Edge Functions → Secrets):

1. Add `TWITCH_CLIENT_ID`
2. Add `TWITCH_OAUTH_TOKEN`
3. Add `TWITCH_USERNAME` (optional, defaults to 'AbeNasty')
4. Add `YOUTUBE_CHANNEL_ID`
5. Verify `YOUTUBE_API_KEY` is set (AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw)

See <filepath>docs/API_SETUP.md</filepath> for detailed instructions on obtaining these credentials.

### Step 8: Build and Test

```bash
# Build the application
pnpm run build

# Test locally
pnpm run dev
```

**Testing Checklist:**
- [ ] Video queue tab loads without errors
- [ ] Analytics tab loads without errors
- [ ] Scheduled tab loads without errors
- [ ] Images tab loads without errors
- [ ] Monitor tab loads without errors
- [ ] Can add videos to queue
- [ ] Can add images to queue
- [ ] Monitor tab shows platform stats (may show errors if API keys not configured)
- [ ] PiP broadcast monitor is draggable
- [ ] Quick Preview shows next item
- [ ] Emergency "Hide All" button works
- [ ] Broadcast view responds to "Hide All" command
- [ ] "Restore" button brings back content

### Step 9: Commit and Push

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add Monitor tab feature with Twitch/YouTube stats integration

- Added Monitor tab with real-time platform statistics
- Implemented PiP broadcast monitor (draggable/resizable)
- Added Quick Preview panel for queue management
- Created Stream History Chart with Recharts
- Implemented Emergency Controls (Hide All/Restore)
- Added Supabase edge functions for Twitch and YouTube APIs
- Created database tables: stream_stats, broadcast_state
- Added comprehensive documentation"

# Push to remote
git push origin feature/monitor-dashboard
```

### Step 10: Create Pull Request

1. Go to GitHub: https://github.com/IbrahimAyad/thelivestreamshow
2. Click "Pull requests" → "New pull request"
3. Select `feature/monitor-dashboard` branch
4. Fill in PR description:
   - Link to this MERGE_GUIDE.md
   - List key features
   - Note any breaking changes (none in this case)
   - Mention required environment variables
5. Request review if applicable
6. Merge when approved

## Environment Variables Reference

### Required for Full Functionality

| Variable | Description | Where to Get |
|----------|-------------|-------------|
| TWITCH_CLIENT_ID | Twitch application client ID | Twitch Developer Console |
| TWITCH_OAUTH_TOKEN | Twitch OAuth access token | OAuth authorization flow |
| TWITCH_USERNAME | Twitch channel username | Your Twitch profile (defaults to 'AbeNasty') |
| YOUTUBE_CHANNEL_ID | YouTube channel ID | YouTube Studio settings |
| YOUTUBE_API_KEY | YouTube Data API v3 key | Already configured |

### Optional Variables

None currently.

## Rollback Instructions

If you need to rollback this feature:

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>

# Or reset to before the merge (dangerous, only if not pushed)
git reset --hard <commit-before-merge>
```

**Database rollback:**
```sql
DROP TABLE IF EXISTS stream_stats CASCADE;
DROP TABLE IF EXISTS broadcast_state CASCADE;
```

**Edge functions:**
```bash
supabase functions delete fetch-twitch-stats
supabase functions delete fetch-youtube-stats
```

## Known Issues and Limitations

1. **Twitch OAuth Token Expiration**: Twitch OAuth tokens expire. Users need to regenerate them periodically.
2. **YouTube Offline State**: YouTube stats only show data when actively live streaming.
3. **Chart Data Retention**: Historical chart data is stored indefinitely. Consider implementing data cleanup for old records.
4. **API Rate Limits**: Both Twitch and YouTube have rate limits. Current polling interval (30s) is well within limits.

## Support and Troubleshooting

See <filepath>docs/monitor-tab-setup-guide.md</filepath> for:
- Detailed troubleshooting steps
- Common error messages and solutions
- API credential verification

## Additional Resources

- **Feature Summary**: <filepath>docs/FEATURE_SUMMARY.md</filepath>
- **API Setup Guide**: <filepath>docs/API_SETUP.md</filepath>
- **User Setup Guide**: <filepath>docs/monitor-tab-setup-guide.md</filepath>
- **Twitch API Docs**: https://dev.twitch.tv/docs/api/
- **YouTube API Docs**: https://developers.google.com/youtube/v3
