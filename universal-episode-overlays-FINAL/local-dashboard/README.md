# Live Stream Production Dashboard - Local Development Setup

## Overview

This is a professional browser-based production dashboard for controlling OBS Studio and managing live stream shows. Running it locally allows you to connect to OBS WebSocket on localhost, bypassing browser security restrictions.

## Features

### Core Production Features
- **OBS WebSocket Control**: Connect to local OBS instance for scene switching and audio mixing
- **YouTube Queue Manager**: Add videos with real metadata (titles, thumbnails, durations)
- **Embedded YouTube Player**: Watch and control videos directly in the dashboard
- **Audio Mixer**: Control volume and mute settings for all OBS audio sources
- **Production Timers**: Countdown and count-up timers with color-coded displays
- **Show Rundown**: Plan and track show segments with timing
- **Collaborative Notes**: Share notes and cue cards with your team
- **Real-time Sync**: Multi-user collaboration via Supabase

### Professional Suite (NEW)
1. **🔴 Recording & Streaming Controls** - Start/stop recording and streaming with real-time health monitoring (FPS, CPU, dropped frames, bitrate)
2. **🎬 Scene Source Management** - Control individual sources within scenes (show/hide, lock/unlock, Z-order)
3. **🎵 Audio Presets System** - Save and instantly apply audio mixing configurations (5 pre-built presets + custom)
4. **📺 Lower Thirds & Graphics** - Create and display professional lower third graphics with text overlays
5. **👥 User Roles & Permissions** - Multi-user system with Producer/Host/Guest roles and team collaboration
6. **🎨 Professional Scene Templates** - Pre-built OBS scene collections (Talk Show, Interview, Panel, Reaction)

## Prerequisites

- **Node.js 18+** (Download from https://nodejs.org)
- **pnpm** package manager (Install: `npm install -g pnpm`)
- **OBS Studio 28.0+** with WebSocket enabled
- **YouTube Data API v3 Key** (for video metadata fetching)
- **Supabase Account** (free tier works - already configured)
- **Optional:** Email for authentication (if using user roles)

## Quick Start

### Step 1: Install Dependencies

```bash
cd local-dashboard
pnpm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory (or edit if it exists):

```env
# Supabase Configuration (already configured)
VITE_SUPABASE_URL=https://vcniezwtltraqramjlux.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ

# YouTube Data API v3 Key (required for video metadata)
# Get your key from: https://console.cloud.google.com/apis/credentials
VITE_YOUTUBE_API_KEY=AIzaSyAb8RN6KHEoasVNg5Nv2nOxmFbGJLvFTLsIXn-IAtIX_PIuut2Q

# Discord Webhook URL (optional - for stream notifications)
# Create a webhook in your Discord server: Server Settings > Integrations > Webhooks
# Learn more: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
VITE_DISCORD_WEBHOOK_URL=
```

**Note:** The YouTube API key above is pre-configured. You can replace it with your own if needed.

### Step 3: Enable OBS WebSocket

1. Open **OBS Studio**
2. Go to **Tools → WebSocket Server Settings**
3. Check **"Enable WebSocket server"**
4. Note the **Server Port** (default: 4455)
5. Click **"Show Connect Info"** to view/copy the password
6. Click **"OK"** to save

### Step 4: Run the Development Server

```bash
pnpm run dev
```

The application will start at **http://localhost:5173**

### Step 5: Connect to OBS

1. Open your browser to **http://localhost:5173**
2. **(Optional)** Create an account:
   - Click **"Sign Up"** in the top right
   - Enter email and password
   - Default role is **Guest** (Producer must upgrade you for full access)
3. In the **"OBS WebSocket Connection"** panel:
   - Enter: `ws://localhost:4455`
   - Enter your OBS WebSocket password
   - Click **"Connect to OBS"**
4. You're ready to start producing!

### Step 6: Set Up Lower Thirds (Optional)

For the Lower Thirds feature to work:

1. **In OBS Studio**, add two text sources:
   - Name: `LowerThird_Title` (Main text - 36-48pt Arial Bold)
   - Name: `LowerThird_Subtitle` (Secondary text - 24-28pt Arial Regular)
2. Position them in the lower third of your scene (recommended: 70px from left, 930px from top)
3. Style with white text, add outline/shadow for readability
4. Hide them by default (eye icon in OBS)
5. The dashboard will control their visibility and text content

## Getting a YouTube API Key

If you don't have a YouTube Data API v3 key:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key
5. (Optional) Restrict the API key:
   - Click on your API key to edit
   - Under "Application restrictions", select "HTTP referrers"
   - Add `http://localhost:5173` as an allowed referrer
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"

**Note:** The YouTube API has a free quota of 10,000 units/day. Each video metadata fetch costs 1 unit.

## Building for Production

To create a production build:

```bash
pnpm run build
```

The optimized files will be in the `dist/` directory.

To preview the production build locally:

```bash
pnpm run preview
```

## Project Structure

```
local-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── AudioMixer.tsx
│   │   ├── ConnectionPanel.tsx
│   │   ├── NotesPanel.tsx
│   │   ├── RundownEditor.tsx
│   │   ├── SceneSwitcher.tsx
│   │   ├── TimerPanel.tsx
│   │   └── YouTubeQueue.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useOBSWebSocket.ts
│   ├── lib/                 # Utilities
│   │   └── supabase.ts
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── .env                     # Environment variables
├── package.json
├── vite.config.ts
└── README.md                # This file
```

## Troubleshooting

### Cannot Connect to OBS

**Problem:** "Connection failed" error when trying to connect.

**Solutions:**
1. Verify OBS Studio is running
2. Check that WebSocket server is enabled in OBS (Tools → WebSocket Server Settings)
3. Confirm you're using the correct address: `ws://localhost:4455`
4. Verify the password matches what's shown in OBS WebSocket settings
5. Make sure no firewall is blocking port 4455
6. Try restarting OBS Studio

### YouTube Videos Not Loading Metadata

**Problem:** Videos show "Failed to add video" error.

**Solutions:**
1. Verify your YouTube API key is correctly set in `.env`
2. Make sure the `.env` file is in the root directory
3. Restart the development server after changing `.env`
4. Check that the video ID is valid (try opening the video on YouTube)
5. Verify your API key has YouTube Data API v3 enabled
6. Check your API quota hasn't been exceeded (10,000 units/day free tier)

**Fallback:** If you don't have an API key, the edge function will fail but you can still manually enter video IDs. The queue will work without metadata.

### Audio Mixer Shows No Sources

**Problem:** Audio mixer is empty after connecting to OBS.

**Solutions:**
1. Make sure you have audio sources in OBS (microphone, desktop audio, etc.)
2. Try switching scenes in OBS to trigger a refresh
3. Disconnect and reconnect to OBS from the dashboard
4. Check the browser console for errors (F12)

### Real-Time Sync Not Working

**Problem:** Changes from other users aren't appearing.

**Solutions:**
1. Check your internet connection
2. Verify the Supabase URL and key are correct in `.env`
3. Open browser console (F12) and look for WebSocket connection errors
4. Try refreshing the page

### Audio Levels Not Moving

**Important:** Audio level meters are simulated based on volume settings. OBS WebSocket 5.x does not provide real-time audio level data like version 4.x did. 

**For accurate audio monitoring:**
- Use OBS Studio's built-in audio mixer
- The dashboard's audio meters show approximate levels based on your volume settings
- Volume controls and mute buttons work correctly

### Port Already in Use

**Problem:** "Port 5173 is already in use" when starting dev server.

**Solutions:**
1. Stop any other Vite dev servers running
2. Change the port in `vite.config.ts`:
   ```typescript
   export default defineConfig({
     server: {
       port: 3000 // Use a different port
     }
   })
   ```
3. Kill the process using port 5173:
   - Windows: `netstat -ano | findstr :5173` then `taskkill /PID <PID> /F`
   - Mac/Linux: `lsof -ti:5173 | xargs kill`

## Advanced Configuration

### Changing OBS WebSocket Port

If your OBS WebSocket is on a different port:

1. In the dashboard, enter: `ws://localhost:YOUR_PORT`
2. Or if OBS is on another computer: `ws://192.168.1.100:4455`

### Using a Different Supabase Project

If you want to use your own Supabase project:

1. Create a new Supabase project at https://supabase.com
2. Create the required tables (see `TECHNICAL_DOCUMENTATION.md` for schema)
3. Update `.env` with your Supabase URL and anon key
4. Enable real-time for all tables

### Customizing the UI

The dashboard uses TailwindCSS for styling. To customize:

1. Edit `tailwind.config.js` for theme colors
2. Modify component files in `src/components/` for layout changes
3. Update `src/App.tsx` for overall structure changes

## Discord Notifications (NEW)

### Real-Time Stream Alerts

The dashboard can send automatic notifications to your Discord channel for important stream events!

**Notification Types:**
- 🔴 **Stream Start** - Alerts when your stream goes live
- 📢 **Topic Updates** - Notifies when discussion topics change
- 🎤 **Guest Announcements** - Announces when guests join
- 📴 **Stream End** - Summary when stream concludes
- 🗓️ **Schedule Reminders** - Upcoming stream alerts

### Setting Up Discord Webhooks

**Step 1: Create Discord Webhook**
1. Open your Discord server
2. Go to **Server Settings → Integrations → Webhooks**
3. Click **"Create Webhook"**
4. Configure:
   - **Name**: "Livestream Bot" (or your choice)
   - **Channel**: Select notification channel
   - **Avatar**: Upload image (optional)
5. Click **"Copy Webhook URL"**
6. Keep this URL secure!

**Step 2: Configure Dashboard**
1. Navigate to the **Settings** tab in the dashboard
2. Find the **"Discord Notifications"** panel
3. Paste your webhook URL
4. Click **"Save"**
5. Click **"Test"** to verify connection
6. Toggle **"Enabled"** to activate

**Step 3: Customize Notifications**
Toggle which events trigger notifications:
- ✅ Stream Start (recommended)
- ✅ Topic Changes
- ✅ Guest Announcements
- ✅ Schedule Reminders
- ✅ Stream End

### Automatic Notifications

Once configured, Discord notifications are sent automatically:

- **Stream Start**: When you set a live episode in Production > Live Broadcast Control
- **Topic Changes**: When you update the current discussion topic
- **Guest Announcements**: Template available for manual triggers
- **Schedule Reminders**: Template available for upcoming streams

### Notification Log

The Settings panel shows real-time status:
- ✅ **Sent** - Successfully delivered
- ❌ **Failed** - Error occurred (see details)
- ⏳ **Sending** - In progress

Keeps last 10 notifications for troubleshooting.

### Troubleshooting Discord

**Notifications Not Sending:**
1. Verify "Enabled" toggle is on
2. Check webhook URL starts with `https://discord.com/api/webhooks/`
3. Click "Test" to verify connection
4. Check notification type toggles are enabled
5. Review notification log for errors

**Webhook Not Found Error:**
- Webhook may have been deleted in Discord
- Create a new webhook and update URL

**Rate Limit Errors:**
- Discord limits: 5 requests per 2 seconds
- System automatically retries
- Consider disabling less important notification types

See `docs/DISCORD_INTEGRATION_GUIDE.md` for detailed documentation.

## Features Overview

### Production Tab

**Scene Control** (Producers only)
- Click any scene to switch instantly
- Current scene highlighted in red with "LIVE" indicator
- Automatic updates when scenes change in OBS

**Recording & Streaming Controls** (Producers only - NEW)
- Start/Stop recording and streaming
- Live status indicators with timers
- Real-time stream health monitoring:
  - FPS, CPU usage, memory
  - Dropped frames percentage
  - Visual alerts for performance issues

**Audio Mixer** (Producers full access, Hosts own mic only)
- Individual volume sliders for each audio source
- Mute/unmute buttons
- Color-coded level meters (green → yellow → red)
- Note: Levels are simulated; use OBS for accurate monitoring

**YouTube Queue & Player** (All users can view, Producers manage)
- Paste YouTube URL or video ID
- Automatically fetches title, thumbnail, duration, channel
- Reorder with up/down arrows
- Click play button to mark as "Now Playing"
- Embedded player to watch videos in dashboard
- Queue syncs across all connected users

**Timers** (All users)
- Create countdown or count-up timers
- Color-coded: green → yellow → red as time runs out
- Start/pause/reset controls
- Syncs in real-time across devices

**Team Status** (When logged in - NEW)
- See who's currently online
- View team member roles
- Real-time activity indicators

### Advanced Tab (Producers Only - NEW)

**Source Manager**
- View all sources in current scene
- Toggle visibility (show/hide sources)
- Lock/unlock sources to prevent accidental changes
- Category filters (Cameras, Overlays, Media)
- Z-order display (layer stacking)
- Color-coded source type badges

**Audio Presets**
- 5 pre-built professional presets:
  - Solo Host
  - Panel Discussion
  - Video Reaction
  - Interview
  - Music Break
- Save current audio mix as custom preset
- Apply presets instantly
- Edit and delete custom presets
- Preview of audio levels for each preset

**Lower Thirds & Graphics**
- Create text overlays for guests, topics, social media
- 4 template types (Guest Name, Social Media, Topic, Breaking)
- Show/hide with one click
- Queue system for multiple graphics
- Real-time text updates to OBS
- Position options (bottom-left/center/right, top)

### Notes & Rundown Tab (All users)

**Rundown Editor**
- Add segments with titles, descriptions, durations
- Track status: pending → in-progress → completed
- Color coding for visual organization
- Auto-calculated total show duration

**Notes & Cue Cards**
- Create notes for different roles (Host, Producer, Director)
- Flag important notes as cue cards
- Filter by type: general, technical, script, reminder
- Real-time sharing with team

### User Roles & Access Control (NEW)

**Producer Role** (Full Control)
- All OBS controls (scenes, sources, recording/streaming)
- Audio mixer (all sources)
- Advanced features (presets, lower thirds, source management)
- User management
- Full access to all features

**Host Role** (Limited Control)
- View-only scene information
- Audio mixer (own microphone only)
- View rundown and timers
- View assigned cues
- Notes (read + add comments)
- YouTube queue (view only)

**Guest Role** (Minimal Access)
- View cues assigned to them
- View current segment info
- See countdown timers
- No controls or editing

### Professional OBS Scene Templates (NEW)

Pre-configured scene collections in `/obs-templates/`:

1. **Talk Show Setup** - Host + guests layout with multiple scenes
2. **Reaction Show Setup** - Video player + host cam
3. **Interview Setup** - Dual camera with focus options
4. **Panel Discussion Setup** - 4-person grid layouts

Each template includes:
- Multiple scene layouts
- Proper source positioning and scaling
- Lower third text source placeholders
- Audio source configurations
- Transition settings

See `/obs-templates/OBS_TEMPLATE_GUIDE.md` for import instructions.

## Multi-User Collaboration & Authentication

### Role-Based Access

The dashboard now supports three user roles with different permission levels:

**Producer** (Full Access)
- Controls all OBS features
- Manages scenes, sources, recording, streaming
- Access to advanced features (presets, lower thirds)
- Can manage other users

**Host** (Production Assistant)
- Views rundown and timers
- Can adjust their own microphone
- Access to notes and cues
- View-only for most features

**Guest** (Minimal Access)
- View assigned cues
- See countdown timers
- View current segment
- No control features

### Creating Accounts

1. Click **"Sign Up"** in top right
2. Enter email and password
3. Verify email (check inbox)
4. Default role: **Guest**
5. Producer must upgrade role via Supabase dashboard

### Team Collaboration Features

- **Who's Online** - See team members currently logged in
- **Real-time Sync** - All changes sync across users
- **Activity Tracking** - Last active timestamps
- **Role Indicators** - Color-coded badges (Purple=Producer, Blue=Host, Green=Guest)

### Upgrading User Roles

Producers can change user roles in the Supabase dashboard:

1. Go to https://vcniezwtltraqramjlux.supabase.co
2. Navigate to Table Editor → `user_profiles`
3. Find the user by email
4. Edit the `role` field (producer/host/guest)
5. Save changes
6. User gets new permissions on next login

All changes sync in real-time via Supabase.

## Performance Tips

1. **Close unused browser tabs** to reduce resource usage
2. **Use Chrome or Edge** for best performance
3. **Keep OBS and dashboard on same computer** for lowest latency
4. **Limit the number of timers** running simultaneously
5. **Clear old rundown segments** after shows to reduce database size

## Security Considerations

**For Local Development:**
- OBS WebSocket password should be strong
- Only connect to OBS on trusted networks
- Don't share your `.env` file (it's in `.gitignore`)

**For Team Use:**
- The dashboard has public database access for ease of use
- Don't store sensitive information in notes or rundowns
- For production use, consider adding authentication

## Updates and Maintenance

**Updating Dependencies:**
```bash
pnpm update
```

**Checking for OBS WebSocket Updates:**
- OBS Studio automatically includes the latest WebSocket version
- Check for OBS updates regularly: Help → Check for Updates

## Support

For issues or questions:

1. Check this README's Troubleshooting section
2. Review the browser console for errors (F12)
3. Verify OBS WebSocket is working with other tools
4. Check Supabase dashboard for database connectivity

## License

Built by MiniMax Agent - 2025

## Additional Documentation

- **FEATURE_GUIDE.md** - Comprehensive guide to all features with examples
- **OBS_TEMPLATE_GUIDE.md** - How to import and customize OBS scene templates
- **QUICKSTART.md** - Quick start guide for new users
- **CHANGELOG.md** - Version history and updates

## Credits

**Technologies:**
- React + TypeScript
- Vite
- TailwindCSS
- Supabase (Real-time database + Authentication)
- obs-websocket-js (OBS control)
- YouTube Data API v3
- react-youtube (YouTube player embed)

---

**Quick Reference Commands:**

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Type checking
pnpm run type-check
```

**Happy Streaming!** 🎬
