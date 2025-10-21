# Monitor Tab - Feature Summary

## What is the Monitor Tab?

The Monitor tab is a comprehensive real-time dashboard that allows streamers to monitor their broadcast output, viewer statistics from multiple platforms, and manage their content queue - all in one unified interface.

**Think of it as your mission control for live streaming.**

## Key Features

### 1. Picture-in-Picture Broadcast Monitor

**What it does**: Shows a live preview of what your viewers see in OBS.

**Features**:
- **Draggable**: Click and drag to reposition anywhere on screen
- **Resizable**: Toggle between normal (480x270) and large (960x540) sizes
- **Minimize**: Collapse to header-only for more screen space
- **Pop-out**: Open broadcast view in separate window

**Use case**: Keep an eye on your broadcast while working in other tabs or applications.

### 2. Dual-Platform Statistics

**What it does**: Displays real-time streaming metrics from both Twitch and YouTube simultaneously.

#### Twitch Statistics
- **Viewer Count**: How many people are watching right now
- **Chat Rate**: Messages per minute in your chat
- **Followers**: Total follower count
- **Live Status**: Red pulsing indicator when you're live

#### YouTube Statistics
- **Viewer Count**: Concurrent viewers on your live stream
- **Chat Rate**: YouTube chat activity (messages/minute)
- **Subscribers**: Total subscriber count
- **Live Status**: Shows when you're actively broadcasting

**Features**:
- **Auto-refresh**: Stats update automatically every 30 seconds
- **Manual Refresh**: Click the "Refresh" button for instant update
- **Last Updated**: Timestamp showing when stats were last fetched
- **Error Handling**: Clear messages if API credentials aren't configured

**Use case**: Monitor your audience across both platforms without switching tabs or applications.

### 3. Quick Preview Panel

**What it does**: Shows the next video or image in your queue with instant control options.

**Features**:
- **Thumbnail Preview**: See what's coming up next
- **Title/Caption**: Display name of the queued content
- **Content Type Badge**: Indicates if it's a video or image

**Control Buttons**:
- **Play Now**: Immediately display this item (skip the rest)
- **Edit**: Get instructions to modify content in respective tab
- **Skip**: Remove this item from queue permanently

**Use case**: Quickly react to chat requests or skip content that's no longer relevant.

### 4. Stream History Chart

**What it does**: Visualizes your viewer count trends over time for both platforms.

**Features**:
- **Dual-line Chart**: Separate lines for Twitch (purple) and YouTube (red)
- **Time Range Selector**: View last hour, last 24 hours, or last stream session
- **Platform Toggles**: Show/hide individual platform data
- **Interactive Tooltips**: Hover to see exact viewer counts at any time
- **Responsive Design**: Adjusts to screen size

**Use case**: Analyze which parts of your stream had the most engagement and identify peak viewing times.

### 5. Emergency Controls

**What it does**: Instantly hide all on-stream overlays with one click.

**Features**:
- **Hide All Overlays**: Large red button to immediately blank the broadcast
- **Restore**: Bring back content with one click
- **Real-time Sync**: Broadcast view updates instantly via Supabase Realtime
- **Visual Feedback**: Shows "All overlays hidden" message on broadcast

**Use cases**:
- Phone call or unexpected interruption
- Sensitive information visible on screen
- Technical difficulties with content
- Need to step away temporarily

### 6. Quick Stats Summary

**What it does**: Displays at-a-glance metrics for your content and audience.

**Metrics Shown**:
- Videos Queued: Number of videos ready to play
- Images Queued: Number of images in queue
- Total Viewers: Combined viewership across both platforms

**Use case**: Quick status check without reading detailed stats.

## How to Use the Monitor Tab

### Getting Started

1. **Navigate to the Dashboard**
   - Go to: https://gy77m7pjul0f.space.minimax.io/video-player

2. **Click the Monitor Tab**
   - Look for the "Monitor" tab in the navigation (5th tab)
   - Tab has a monitor icon

3. **Wait for Stats to Load**
   - First load may take 5-10 seconds
   - Stats will auto-refresh every 30 seconds

### During a Stream

**Pre-Stream Setup**:
1. Open Monitor tab in one browser tab
2. Set up OBS with broadcast view in another tab
3. Position PiP monitor where you can see it
4. Queue up your videos/images in their respective tabs

**While Streaming**:
1. Monitor viewer counts in real-time
2. Watch chat activity rates
3. Use Quick Preview to manage upcoming content
4. Use Emergency Controls if needed
5. Keep broadcast monitor visible to catch any issues

**Post-Stream Analysis**:
1. Review Stream History Chart
2. Identify peak viewer times
3. Compare performance across platforms
4. Plan content timing for future streams

## Who Should Use This?

The Monitor tab is designed for:

- **Multi-platform Streamers**: Broadcasting to both Twitch and YouTube
- **Content Creators**: Using pre-queued videos or images in streams
- **Professional Streamers**: Need comprehensive monitoring and control
- **Stream Managers**: Managing broadcasts for others

## Requirements

### To Use Basic Features
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection
- Active Twitch and/or YouTube channels

### To Enable Full Statistics
- Twitch API credentials (Client ID + OAuth Token)
- YouTube Channel ID
- Supabase environment variables configured

See <filepath>docs/API_SETUP.md</filepath> for detailed setup instructions.

## Known Limitations

### API-Related
1. **Twitch OAuth Token Expiration**
   - Tokens expire after ~60 days
   - Must be manually regenerated
   - Stats will show errors when expired

2. **YouTube Offline Status**
   - Stats only populate when actively live streaming
   - Will show subscriber count but zero viewers when offline

3. **Chat Rate Estimation**
   - Chat rates are calculated estimates, not exact counts
   - Based on viewer count and recent chat messages

### Technical Limitations
1. **Browser Support**
   - Requires modern browser with ES6+ support
   - Drag-and-drop may not work on mobile devices

2. **Real-time Updates**
   - Stats refresh every 30 seconds (not instant)
   - Chart data updates every 60 seconds
   - Emergency controls update in real-time

3. **Data Retention**
   - Historical chart data stored indefinitely
   - May require manual cleanup for long-term users

### Feature Limitations
1. **Edit Button**
   - Currently provides instructions rather than opening modal
   - Must switch to Video Queue or Images tab to edit

2. **Platform Support**
   - Only supports Twitch and YouTube
   - No Facebook Gaming, Kick, or other platforms

3. **Single Channel**
   - Monitors one channel per platform
   - Cannot track multiple channels simultaneously

## Privacy and Security

### Data Storage
- Stream statistics stored in your Supabase database
- No data shared with third parties
- Historical data retained for your analysis

### API Credentials
- Stored securely in Supabase environment variables
- Never exposed to frontend code
- Edge functions handle all API calls server-side

### Broadcasting
- Broadcast monitor shows your OBS output
- No external recording or streaming
- PiP window is local to your browser only

## Performance Impact

### Network Usage
- **API Polling**: ~10 KB every 30 seconds
- **Chart Data**: ~5 KB every 60 seconds
- **Real-time Sync**: Minimal (websocket)
- **Total**: Very low bandwidth usage

### CPU/Memory
- **Chart Rendering**: Minimal (Recharts optimized)
- **PiP Monitor**: One iframe embed
- **Overall**: Negligible performance impact

## Comparison with Other Solutions

### vs StreamLabs Dashboard
- **Monitor Tab Advantages**:
  - Integrated with content queue management
  - Dual-platform support in one view
  - Emergency controls for broadcast
  - No third-party account required

- **StreamLabs Advantages**:
  - More detailed analytics
  - Mobile app support
  - Alerts and notifications

### vs OBS Stats Dock
- **Monitor Tab Advantages**:
  - Multi-platform statistics
  - Historical charting
  - Content queue integration
  - Web-based (accessible anywhere)

- **OBS Stats Advantages**:
  - Native integration
  - Real-time encoding stats
  - No browser required

### vs Twitch/YouTube Analytics
- **Monitor Tab Advantages**:
  - Real-time data
  - Unified cross-platform view
  - Streaming-focused metrics
  - Content control integration

- **Platform Analytics Advantages**:
  - Historical trends over months
  - Detailed demographic data
  - Revenue analytics
  - Official platform support

## Future Enhancement Ideas

**Potential Features** (not yet implemented):
- Multi-channel support per platform
- Mobile responsive layout
- Discord bot integration
- Automated clip creation based on viewer peaks
- Chat message display and moderation
- Alerts and notifications
- Export stream reports
- Platform comparison analytics
- OAuth token auto-refresh

## Getting Help

### Documentation
- **Setup Guide**: <filepath>docs/monitor-tab-setup-guide.md</filepath>
- **API Setup**: <filepath>docs/API_SETUP.md</filepath>
- **Merge Guide**: <filepath>docs/MERGE_GUIDE.md</filepath>

### Troubleshooting
Common issues and solutions in <filepath>docs/monitor-tab-setup-guide.md</filepath> under "Troubleshooting" section.

### Support Resources
- **Twitch API Docs**: https://dev.twitch.tv/docs/api/
- **YouTube API Docs**: https://developers.google.com/youtube/v3
- **Supabase Docs**: https://supabase.com/docs

## Summary

The Monitor tab transforms your streaming dashboard from a simple content manager into a comprehensive broadcast control center. With real-time statistics, emergency controls, and integrated queue management, you can focus on creating great content while staying informed about your audience and maintaining full control over your broadcast.

**Key Benefits**:
- Monitor multiple platforms simultaneously
- Quick reaction to audience trends
- Emergency broadcast control
- Integrated content management
- Historical performance analysis

**Perfect for streamers who want professional-grade monitoring without the complexity of multiple tools and applications.**
