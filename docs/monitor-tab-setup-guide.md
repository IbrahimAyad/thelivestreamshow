# Livestream Dashboard - Monitor Tab Setup Guide

## Overview

The Monitor tab provides real-time monitoring of your livestream across Twitch and YouTube platforms with the following features:

- **Picture-in-Picture Broadcast Monitor**: Draggable, resizable preview of your broadcast output
- **Dual-Platform Statistics**: Real-time viewer counts, chat activity, and follower/subscriber metrics
- **Quick Preview**: Preview and control the next queued video or image
- **Stream History Chart**: Visual representation of viewer counts over time
- **Emergency Controls**: Instantly hide all overlays when needed

## Deployment Information

**Production URL**: https://gy77m7pjul0f.space.minimax.io

- **Control Dashboard**: https://gy77m7pjul0f.space.minimax.io/video-player
- **Broadcast View** (for OBS): https://gy77m7pjul0f.space.minimax.io/broadcast/video-player
- **Monitor Tab**: Click the "Monitor" tab in the Control Dashboard

## API Credentials Setup

### Required Environment Variables

The Monitor tab requires the following environment variables to be set in your Supabase project:

1. `TWITCH_CLIENT_ID` - Your Twitch application client ID
2. `TWITCH_OAUTH_TOKEN` - Your Twitch OAuth access token
3. `TWITCH_USERNAME` - Your Twitch username (defaults to 'AbeNasty' if not set)
4. `YOUTUBE_API_KEY` - Your YouTube Data API v3 key (already configured: AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw)
5. `YOUTUBE_CHANNEL_ID` - Your YouTube channel ID

### Step 1: Obtain Twitch API Credentials

#### Create a Twitch Application

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console)
2. Log in with your Twitch account (ibrahimayad13@gmail.com / AbeNasty)
3. Click "Register Your Application"
4. Fill in the details:
   - **Name**: Livestream Dashboard Monitor
   - **OAuth Redirect URLs**: https://localhost
   - **Category**: Broadcasting Suite
5. Click "Create"
6. Click "Manage" on your new application
7. Copy the **Client ID** - this is your `TWITCH_CLIENT_ID`

#### Generate OAuth Token

1. Generate a new Client Secret (click "New Secret")
2. Use the Twitch OAuth Authorization URL to get an access token:

```
https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://localhost&response_type=token&scope=channel:read:subscriptions+user:read:email+channel:read:redemptions
```

3. Replace `YOUR_CLIENT_ID` with your actual Client ID
4. Visit this URL in your browser
5. Click "Authorize"
6. You'll be redirected to `https://localhost#access_token=...`
7. Copy the `access_token` value - this is your `TWITCH_OAUTH_TOKEN`

**Alternative Method** (Using Twitch CLI):

```bash
# Install Twitch CLI
brew install twitchdev/twitch/twitch-cli

# Authenticate
twitch configure
twitch token
```

### Step 2: Obtain YouTube API Credentials

#### YouTube API Key

The YouTube API key is already configured in the system:
- **API Key**: AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw

#### Get Your YouTube Channel ID

**Method 1: From YouTube Studio**
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click on "Settings" (bottom left)
3. Click "Channel" → "Advanced settings"
4. Your Channel ID will be displayed

**Method 2: From Your Channel URL**
1. Go to your YouTube channel
2. Look at the URL - if it's `https://www.youtube.com/channel/UC...`, the part after `/channel/` is your Channel ID
3. If your URL uses a custom name, use Method 1 instead

### Step 3: Set Environment Variables in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vcniezwtltraqramjlux`
3. Navigate to **Settings** → **Edge Functions**
4. Scroll to **Environment Variables** section
5. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `TWITCH_CLIENT_ID` | Your Twitch Client ID from Step 1 |
| `TWITCH_OAUTH_TOKEN` | Your Twitch OAuth token from Step 1 |
| `TWITCH_USERNAME` | Your Twitch username (e.g., 'AbeNasty') |
| `YOUTUBE_CHANNEL_ID` | Your YouTube Channel ID from Step 2 |

**Note**: The `YOUTUBE_API_KEY` is already configured as AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw

6. Click "Save" or "Add Secret" for each variable

### Step 4: Verify Setup

1. Go to https://gy77m7pjul0f.space.minimax.io/video-player
2. Click the "Monitor" tab
3. Wait for stats to load (they refresh every 30 seconds)
4. If you see errors, check the browser console and verify your environment variables

## Using the Monitor Tab

### Picture-in-Picture Broadcast Monitor

- **Drag**: Click and drag the header bar to reposition
- **Minimize**: Click the minimize button to collapse to header only
- **Maximize**: Toggle between 480x270px and 960x540px sizes
- **Pop-out**: Open the broadcast view in a new window

### Platform Statistics

**Twitch Stats:**
- Current viewer count
- Chat rate (messages per minute)
- Total followers
- Live status indicator

**YouTube Stats:**
- Current viewer count (when live)
- Chat rate (messages per minute)
- Total subscribers
- Live status indicator

**Auto-refresh**: Stats update every 30 seconds automatically
**Manual Refresh**: Click the "Refresh" button to update immediately

### Quick Preview Panel

- Shows the next video or image in your queue
- **Play Now**: Immediately display this item on the broadcast
- **Edit**: Shows instructions to edit in the respective tab (Video Queue or Images)
- **Skip**: Removes this item from the queue permanently

### Stream History Chart

- Visualizes viewer count trends over time
- **Time Ranges**: Last Hour, Last 24 Hours, Last Stream
- **Platform Toggles**: Show/hide Twitch and YouTube lines
- Data is stored in the `stream_stats` table

### Emergency Controls

**Hide All Overlays**:
- Instantly hides all videos and images from the broadcast view
- Useful for emergency situations or sensitive moments
- The broadcast view will show "All overlays hidden"

**Restore**:
- Re-enables the broadcast display
- Returns to the previous active scene (video or image)

## Troubleshooting

### Stats Not Loading

1. **Check environment variables**: Verify all required secrets are set in Supabase
2. **Check API credentials**: Ensure your Twitch OAuth token hasn't expired
3. **Check browser console**: Look for error messages
4. **Test edge functions directly**:
   ```bash
   curl https://vcniezwtltraqramjlux.supabase.co/functions/v1/fetch-twitch-stats
   curl https://vcniezwtltraqramjlux.supabase.co/functions/v1/fetch-youtube-stats
   ```

### Twitch OAuth Token Expired

Twitch OAuth tokens expire after a certain period. If you see "Twitch API credentials not configured" or authentication errors:

1. Generate a new OAuth token using the steps in "Step 1: Obtain Twitch API Credentials"
2. Update the `TWITCH_OAUTH_TOKEN` environment variable in Supabase
3. Refresh the Monitor tab

### YouTube Stats Show "Offline"

This is expected when you're not currently live streaming. YouTube stats only show active data when you have an active live broadcast.

### Emergency Hide All Not Working

1. Ensure both the Control Dashboard and Broadcast View are open
2. Check the browser console for errors
3. Verify the `broadcast_state` table exists in Supabase
4. Check that RLS policies are enabled on the `broadcast_state` table

## Database Tables

The Monitor tab uses two new tables:

### `stream_stats`
Stores historical streaming statistics:
- `platform`: 'twitch' or 'youtube'
- `viewer_count`: Number of concurrent viewers
- `chat_rate`: Messages per minute
- `follower_count`: Total followers (Twitch)
- `subscriber_count`: Total subscribers (YouTube)
- `stream_status`: 'live' or 'offline'
- `recorded_at`: Timestamp

### `broadcast_state`
Stores current broadcast control state:
- `hide_all`: Boolean flag for emergency hide
- `active_scene`: Current scene type ('video', 'image', 'none')
- `updated_at`: Last update timestamp

## Edge Functions

### `fetch-twitch-stats`
**URL**: https://vcniezwtltraqramjlux.supabase.co/functions/v1/fetch-twitch-stats

Fetches real-time statistics from Twitch Helix API for user "AbeNasty".

### `fetch-youtube-stats`
**URL**: https://vcniezwtltraqramjlux.supabase.co/functions/v1/fetch-youtube-stats

Fetches real-time statistics from YouTube Data API v3 for your configured channel.

## Technical Architecture

### Frontend Components
- **MonitorTab**: Main container component
- **PiPBroadcastMonitor**: Draggable iframe preview
- **DualPlatformStats**: Platform statistics display
- **QuickPreview**: Next item preview and controls
- **StreamHistoryChart**: Recharts-based visualization
- **EmergencyControls**: Hide all/restore buttons

### Custom Hooks
- **useBroadcastState**: Manages broadcast state with real-time sync
- **useStreamStats**: Fetches and auto-refreshes platform statistics

### Real-time Features
- Supabase Realtime subscriptions for `broadcast_state` changes
- Auto-refresh polling every 30 seconds for stats
- Immediate updates when emergency controls are triggered

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Supabase edge function logs
3. Review this documentation
4. Check Twitch/YouTube API status pages

## Credits

- **Twitch API**: https://dev.twitch.tv/docs/api/
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **Supabase**: https://supabase.com/docs
- **Recharts**: https://recharts.org
- **React Draggable**: https://github.com/react-grid-layout/react-draggable
