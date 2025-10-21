# StreamStudio Live - Dashboard Integration Guide

## Overview

This guide provides step-by-step instructions for integrating **StreamStudio Live** (the professional DJ audio system) into the main **The Live Stream Show** dashboard.

---

## Integration Options

### Option 1: Embedded Route (Recommended)
Add StreamStudio Live as a new route within your existing dashboard.

### Option 2: IFrame Integration
Embed StreamStudio Live as an iframe in your dashboard.

### Option 3: Standalone with Deep Linking
Keep them separate but add navigation links between them.

---

## Option 1: Embedded Route Integration

### Prerequisites
- Your dashboard is a React application
- You're using React Router (or similar routing library)
- Both apps share the same Supabase project

### Step 1: Copy Source Files

```bash
# From the dashboard root directory
mkdir -p src/pages/streamstudio
cp -r ../streamstudio-live/src/* src/pages/streamstudio/
```

### Step 2: Update Import Paths

Since you're moving the files, update relative imports in copied files:

```typescript
// Before
import { Button } from '@/components/ui/button'

// After (if needed)
import { Button } from '../../../components/ui/button'
```

### Step 3: Add Route

In your dashboard's routing file:

```typescript
import { StreamStudioControl } from './pages/streamstudio/pages/ControlPanel'
import { StreamStudioBroadcast } from './pages/streamstudio/pages/BroadcastOverlay'

// Add routes
<Route path="/streamstudio/control" element={<StreamStudioControl />} />
<Route path="/streamstudio/broadcast" element={<StreamStudioBroadcast />} />
```

### Step 4: Add Navigation Link

In your dashboard's sidebar/navigation:

```typescript
<NavLink to="/streamstudio/control">
  <Music className="w-5 h-5" />
  <span>StreamStudio Live</span>
</NavLink>
```

### Step 5: Share Supabase Client

Ensure both use the same Supabase instance:

```typescript
// lib/supabase.ts (shared)
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Option 2: IFrame Integration

### Step 1: Deploy StreamStudio Live Separately

Keep the current deployment at: `https://lvygnr34gdo1.space.minimax.io`

### Step 2: Add IFrame Route

In your dashboard:

```typescript
// pages/StreamStudio.tsx
export function StreamStudioPage() {
  return (
    <div className="h-screen w-full">
      <iframe
        src="https://lvygnr34gdo1.space.minimax.io/control"
        className="w-full h-full border-0"
        title="StreamStudio Live Control Panel"
      />
    </div>
  )
}
```

### Step 3: Add Navigation

```typescript
<NavLink to="/streamstudio">
  <Music className="w-5 h-5" />
  <span>StreamStudio Live</span>
</NavLink>
```

---

## Option 3: Standalone with Deep Linking

### Step 1: Add External Link in Dashboard

```typescript
<a
  href="https://lvygnr34gdo1.space.minimax.io/control"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
>
  <Music className="w-5 h-5" />
  <span>StreamStudio Live</span>
  <ExternalLink className="w-4 h-4" />
</a>
```

### Step 2: Add Back Link in StreamStudio

In StreamStudio's header:

```typescript
<a
  href="https://your-dashboard-url.com"
  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
>
  <ArrowLeft className="w-4 h-4" />
  Back to Dashboard
</a>
```

---

## Shared State Management (Advanced)

If you want to share state between the dashboard and StreamStudio Live:

### Method 1: Supabase Realtime

Both apps already use the same Supabase database. Use realtime subscriptions:

```typescript
// In Dashboard
const { data: audioState } = usePlaybackStateListener()

// Shows current playing track, emergency mode, etc.
```

### Method 2: LocalStorage Events

```typescript
// StreamStudio emits
window.localStorage.setItem('streamstudio:state', JSON.stringify(state))
window.dispatchEvent(new Event('storage'))

// Dashboard listens
window.addEventListener('storage', (e) => {
  if (e.key === 'streamstudio:state') {
    const state = JSON.parse(e.newValue)
    // Update dashboard UI
  }
})
```

---

## Environment Variables

Both apps need these variables:

```bash
VITE_SUPABASE_URL=https://vcniezwtltraqramjlux.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_PROXY_URL=https://your-railway-proxy.up.railway.app
```

---

## Database Tables Required

StreamStudio Live uses these Supabase tables:

- `music_library` - Track storage
- `playlists` - Playlist management
- `audio_playback_state` - Real-time playback sync
- `play_history` - Auto-DJ history
- `auto_dj_settings` - Auto-DJ configuration
- `saved_mixes` - Saved mix playlists
- `dj_analytics` - Analytics data
- `scheduled_events` - Automation timeline
- `ai_chat_history` - AI chat logs

All tables are already created in your Supabase project.

---

## Supabase Edge Functions Required

- `generate-tts` - Text-to-speech (existing)
- `play-audio` - Audio playback trigger
- `get-audio-list` - Audio library query
- `trigger-mix` - Saved mix trigger
- `trigger-sound` - Sound effect trigger
- `get-mixes` - List saved mixes
- `get-dj-status` - Current DJ state
- `ai-dj-chat` - AI chat control
- `scheduled-automation` - Cron job automation

All functions are already deployed.

---

## Testing Integration

### Checklist:

1. **Navigation** - Can you access StreamStudio from dashboard?
2. **Supabase Connection** - Do both apps connect to the same database?
3. **Audio Playback** - Does audio play correctly?
4. **Real-time Sync** - Does broadcast overlay update when control panel changes tracks?
5. **Emergency Controls** - Does PANIC button work?
6. **Mic Ducking** - Does mic input trigger ducking?
7. **Stream-Safe Filter** - Can you filter copyrighted tracks?

---

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution:** Update import paths after copying files.

### Issue: Supabase "Invalid API Key"

**Solution:** Ensure `.env` file is in the correct location and loaded.

### Issue: Audio doesn't play

**Solution:** Check browser autoplay policies. User interaction required.

### Issue: Broadcast overlay doesn't sync

**Solution:** Verify both apps use the same Supabase project and RLS policies allow reads.

---

## Support

For issues or questions:
1. Check the main README.md
2. Review Supabase logs: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/logs
3. Check browser console for errors

---

## Next Steps

After integration:
1. Test all features end-to-end
2. Configure stream-safe music library
3. Set up scheduled automation for your show
4. Test emergency controls before going live
5. Configure mic ducking sensitivity

---

**Last Updated:** October 21, 2025
