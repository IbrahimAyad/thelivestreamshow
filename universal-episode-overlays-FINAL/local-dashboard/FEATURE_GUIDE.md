# Live Stream Production Dashboard - Feature Guide

Comprehensive guide to all features in the Professional Live Stream Production Dashboard.

---

## Table of Contents

1. [Recording & Streaming Controls](#1-recording--streaming-controls)
2. [Scene Source Management](#2-scene-source-management)
3. [Audio Presets System](#3-audio-presets-system)
4. [Lower Thirds & Graphics Control](#4-lower-thirds--graphics-control)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Professional Scene Templates](#6-professional-scene-templates)

---

## 1. Recording & Streaming Controls ⏺️

### Overview
Professional controls for managing OBS recording and streaming with real-time health monitoring.

### Location
**Production Tab** → Left column (for Producers)

### Features

#### Recording Controls
- **Start Recording** - Begin recording to local file
- **Stop Recording** - End current recording
- **Recording Status Indicator** - Red pulsing dot when active
- **Duration Timer** - Shows current recording time (HH:MM:SS)

#### Streaming Controls
- **Go Live** - Start streaming to configured platform
- **End Stream** - Stop current stream
- **Live Status Badge** - Animated "LIVE" indicator when streaming
- **Stream Duration Timer** - Shows current stream uptime

#### Stream Health Monitor
Real-time metrics displayed every 2 seconds while streaming:

| Metric | Description | Healthy Range |
|--------|-------------|---------------|
| **FPS** | Frames per second | 30 or 60 (based on settings) |
| **CPU Usage** | System CPU utilization | < 80% |
| **Dropped Frames** | Frames not sent to stream | < 1% |
| **Memory** | OBS memory usage | Varies |

**Visual Alerts:**
- 🟢 Green: Optimal (< 1% dropped frames)
- 🟡 Yellow: Warning (1-5% dropped frames)
- 🔴 Red: Critical (> 5% dropped frames)

**Critical Warning:**
When dropped frame rate exceeds 5%, a warning appears with recommendations to:
- Reduce stream quality
- Close other applications
- Lower output resolution

### Usage Tips

1. **Always start recording before streaming** - Backup in case stream fails
2. **Monitor stream health closely** - Watch for yellow/red warnings
3. **Test first** - Do a test stream before going live
4. **Check disk space** - Ensure sufficient space for recordings

### Troubleshooting

**Recording won't start?**
- Check that output path is configured in OBS settings
- Verify sufficient disk space
- Ensure no other application is using the camera

**Streaming fails immediately?**
- Verify stream key is configured in OBS
- Check internet connection
- Confirm streaming service is operational

**High dropped frames?**
- Reduce bitrate in OBS settings
- Lower output resolution (try 720p instead of 1080p)
- Close bandwidth-intensive applications
- Use wired connection instead of WiFi

---

## 2. Scene Source Management 🎥

### Overview
Control individual sources within scenes - toggle visibility, lock sources, and view Z-order.

### Location
**Advanced Tab** → Left column (Producers only)

### Features

#### Source List
- **Automatic Loading** - Loads all sources from current scene
- **Real-time Updates** - Reflects changes made in OBS
- **Z-Order Display** - Shows layer stacking (higher = on top)
- **Source Type Badges** - Color-coded by source type

#### Source Controls

**Visibility Toggle** 👁️
- **Show** (Green eye icon) - Source is visible in scene
- **Hide** (Gray eye icon) - Source is hidden
- Click to toggle instantly
- Grayed out appearance when hidden

**Lock/Unlock** 🔒
- **Locked** (Red lock icon) - Source cannot be moved or modified
- **Unlocked** (Gray unlock icon) - Source can be edited
- Prevents accidental changes during live production

#### Category Filters
Quick filter buttons to show specific source types:

- **All** - Show all sources
- **Cameras** - Sources with "cam", "webcam", or "camera" in name
- **Overlays** - Sources with "overlay", "graphic", or "lower" in name
- **Media** - Sources with "video", "media", or "audio" in name

#### Source Type Color Coding

| Color | Source Type |
|-------|-------------|
| 🔵 Blue | Video/Camera sources |
| 🟣 Purple | Browser/Image sources |
| 🟢 Green | Text sources |
| 🟡 Yellow | Audio sources |
| ⚪ Gray | Other sources |

### Workflow Examples

**Example 1: Quickly Hide All Overlays**
1. Click "Overlays" filter
2. Click eye icon on each overlay source to hide
3. Switch to "All" to see all sources again

**Example 2: Lock Critical Sources**
1. Find your main camera source
2. Click lock icon
3. Source is now protected from accidental changes

**Example 3: Check Layer Order**
1. Look at Z-index numbers on the left
2. Higher numbers appear on top
3. If a source is hidden behind another, check its Z-order

### Best Practices

1. **Lock static sources** - Lock backgrounds, logos, and frames
2. **Name sources clearly** - Use descriptive names for easier filtering
3. **Hide unused sources** - Keep scenes clean by hiding inactive sources
4. **Check Z-order** - Ensure overlays are on top of video sources

---

## 3. Audio Presets System 🎚️

### Overview
Save and instantly apply audio mixing configurations for different show segments.

### Location
**Advanced Tab** → Left column (Producers only)

### Pre-built Presets

The system includes 5 default professional presets:

#### 1. Solo Host
- **Use case:** Single host speaking
- **Config:** Host mic 0dB, all others muted (-∞dB)

#### 2. Panel Discussion
- **Use case:** Multiple speakers balanced
- **Config:** All mics at -3dB for balanced levels

#### 3. Video Reaction
- **Use case:** Host reacting to video content
- **Config:**
  - Host mic: -2dB
  - Video audio: -6dB
  - Guest mics: -10dB

#### 4. Interview
- **Use case:** One-on-one interview
- **Config:**
  - Host mic: -3dB
  - Guest 1: -3dB
  - Others: -20dB (background)

#### 5. Music Break
- **Use case:** Playing music during intermission
- **Config:** All mics muted, music source 0dB

### Creating Custom Presets

1. **Set up your audio** - Adjust all audio levels to desired mix
2. **Click "Save Current"** button
3. **Enter preset name** - e.g., "My Custom Mix"
4. **Add description** (optional) - e.g., "For guest interviews"
5. **Click "Save Preset"**
6. New preset appears in your list

### Applying Presets

1. **Select a preset** from the list
2. **Click "Apply Preset"** button
3. **All audio levels update instantly** to match the preset
4. **Active indicator** shows which preset is currently applied
5. **Success notification** confirms application

### Managing Presets

- **Edit** - Modify custom presets (default presets cannot be edited)
- **Delete** - Remove custom presets (trash icon)
- **Duplicate** - Create a copy of existing preset to modify

### Preset Preview

Each preset card shows:
- Preset name and description
- Active/Default status badges
- Preview of first 4 audio source levels
- Apply button

### Use Cases

**Talk Show Workflow:**
1. **Pre-show:** Music Break preset (music playing)
2. **Intro:** Solo Host preset (host introduction)
3. **Main segment:** Panel Discussion preset (all guests active)
4. **Outro:** Solo Host preset (host closing)
5. **Post-show:** Music Break preset (outro music)

**Interview Show Workflow:**
1. Start with Interview preset
2. Switch to Solo Host for monologue segments
3. Back to Interview for Q&A

### Best Practices

1. **Create presets for each show segment** - Makes switching seamless
2. **Test presets before going live** - Verify all sources are configured
3. **Use descriptive names** - "Segment 1", "Guest Interview", etc.
4. **Save variations** - Create multiple versions for different scenarios
5. **Match source names** - Preset sources must match your actual OBS sources

---

## 4. Lower Thirds & Graphics Control 📺

### Overview
Create, manage, and display professional lower third graphics with text overlays.

### Location
**Advanced Tab** → Right column (Producers only)

### OBS Setup Required

**IMPORTANT:** Before using this feature, create these text sources in OBS:

1. **LowerThird_Title** - Main text (guest name, topic, etc.)
   - Font: Arial Bold, 36-48pt
   - Color: White
   - Position: 70px from left, 930px from top

2. **LowerThird_Subtitle** - Secondary text (title, description, etc.)
   - Font: Arial Regular, 24-28pt
   - Color: Light Gray (#CCCCCC)
   - Position: 70px from left, 980px from top

**Optional:** Add a colored background source behind the text

### Template Types

Four pre-built templates for different use cases:

| Template | Icon | Best For |
|----------|------|----------|
| **Guest Name + Title** | 👤 | Identifying speakers |
| **Social Media** | 📱 | Displaying handles/usernames |
| **Topic/Segment** | 📌 | Showing current topic |
| **Breaking News** | 🚨 | Important announcements |

### Creating Lower Thirds

1. **Click "Create New"** button
2. **Select template type** from dropdown
3. **Enter title text** - Main text (required)
   - Examples: "John Doe", "@YourChannel", "Topic: AI Safety"
4. **Enter subtitle text** - Secondary text (optional)
   - Examples: "Expert Guest", "Twitter", "Panel Discussion"
5. **Choose position:**
   - Bottom Left (default)
   - Bottom Center
   - Bottom Right
   - Top
6. **Click "Create"**

### Displaying Lower Thirds

1. **Select a lower third** from the list
2. **Click "Show Lower Third"** button
3. **Text updates in OBS** and becomes visible
4. **Only one lower third shows at a time** - others auto-hide
5. **Click "Hide Lower Third"** when finished

### Queue Navigation

If you have multiple lower thirds:

- **Previous** button - Navigate to previous lower third
- **Next** button - Navigate to next lower third
- **Counter** shows current position (e.g., "2 of 5")
- **Current lower third highlighted** with purple ring

### Managing Lower Thirds

- **Edit** ✏️ - Modify text or template type
- **Delete** 🗑️ - Remove lower third from list
- **Reorder** - Use queue navigation

### Visibility Indicator

Active lower thirds show:
- **Green border** - Currently visible
- **Glowing effect** - Makes it easy to identify what's on screen

### Workflow Example

**Guest Interview Show:**

1. **Pre-create lower thirds:**
   - Guest 1: "Jane Smith" / "Tech Expert"
   - Guest 2: "Bob Johnson" / "Industry Analyst"
   - Social: "@TechTalkShow" / "Follow us on Twitter"
   - Topic: "AI in Healthcare" / "Panel Discussion"

2. **During show:**
   - Guest 1 speaks → Show their lower third
   - Hide after 5-10 seconds
   - Guest 2 speaks → Show their lower third
   - Between segments → Show social media lower third
   - New topic → Show topic lower third

### Best Practices

1. **Keep text concise** - Avoid long names or titles
2. **Create all lower thirds before going live** - Don't create during stream
3. **Use consistent timing** - Show for 5-10 seconds, then hide
4. **Test visibility** - Ensure text is readable on stream
5. **Style in OBS** - Add outlines or shadows for better readability
6. **Position carefully** - Don't block important content

### Troubleshooting

**Lower thirds not appearing?**
- Verify text sources exist in OBS: `LowerThird_Title` and `LowerThird_Subtitle`
- Check that sources are added to the current scene
- Ensure sources are not locked or hidden
- Confirm dashboard is connected to OBS

**Text not updating?**
- Check OBS WebSocket connection
- Verify source names match exactly (case-sensitive)
- Try refreshing the dashboard

---

## 5. User Roles & Permissions 👥

### Overview
Multi-user system with role-based access control for team collaboration.

### Three User Roles

#### 🟣 Producer (Full Control)
**Access Level:** Complete control over all features

**Permissions:**
- ✅ OBS connection and scene switching
- ✅ Recording and streaming controls
- ✅ Source management (show/hide/lock)
- ✅ Full audio mixer control (all sources)
- ✅ Audio preset management
- ✅ Lower thirds control
- ✅ YouTube queue management
- ✅ Timers and rundown editing
- ✅ Notes (read/write/edit)
- ✅ User management
- ✅ Advanced features tab

**Use Cases:**
- Show producer/director
- Technical director
- Production manager

#### 🔵 Host (Limited Production Control)
**Access Level:** Production features with restrictions

**Permissions:**
- ✅ View all scenes (cannot switch)
- ✅ Audio mixer (own microphone only)
- ✅ View rundown and timers
- ✅ View assigned cues
- ✅ Notes (read + add comments)
- ✅ YouTube queue (view only)
- ❌ No OBS connection/scene switching
- ❌ No recording/streaming controls
- ❌ No source management
- ❌ No advanced features

**Use Cases:**
- Show host/presenter
- On-air talent
- Co-host

#### 🟢 Guest (View-Only)
**Access Level:** Minimal, need-to-know information

**Permissions:**
- ✅ View cues assigned to them
- ✅ View current segment info
- ✅ See countdown timers
- ❌ No access to any controls
- ❌ No audio mixer
- ❌ No scene information
- ❌ No editing capabilities

**Use Cases:**
- Guest speakers
- Panel participants
- Interview subjects

### Authentication System

#### Creating an Account

1. **Click "Sign Up"** button (top right)
2. **Enter information:**
   - Display name (optional)
   - Email address
   - Password (minimum 6 characters)
3. **Click "Create Account"**
4. **Check email** for verification link
5. **Verify account** by clicking link
6. **Default role:** Guest (Producer must upgrade)

#### Logging In

1. **Click "Login"** button
2. **Enter credentials:**
   - Email address
   - Password
3. **Click "Login"**
4. **Dashboard loads** with appropriate permissions

#### Logging Out

1. **Click "Logout"** button (top right)
2. **Account marked offline** automatically
3. **Session ends** immediately

### Role Badge Display

Each logged-in user sees:
- Display name or email
- **Role badge** (color-coded):
  - 🟣 Purple: PRODUCER
  - 🔵 Blue: HOST
  - 🟢 Green: GUEST

### Team Status Panel

**Location:** Production tab → Middle column (when logged in)

**Shows:**
- All currently online team members
- Real-time activity status
- Role indicators
- Last active timestamp
- **"You" indicator** for current user

**Activity Indicators:**
- 🟢 Green dot: Currently online
- Last active: "just now", "5m ago", "2h ago", etc.

**Auto-updates:**
- Every 30 seconds: User's last_active timestamp updates
- Real-time: New users logging in/out

### User Management (Producers Only)

**Changing User Roles:**

1. Access Supabase dashboard
2. Navigate to `user_profiles` table
3. Find the user by email
4. Edit the `role` field
5. Save changes
6. User gets new permissions on next login

**Note:** Direct UI for user management can be added as a future enhancement.

### Collaborative Workflows

**Example 1: Live Talk Show**
- **Producer:** Controls OBS, switches scenes, manages audio
- **Host:** Views rundown, sees timer, adjusts own mic
- **Guests:** See cues for when to speak

**Example 2: Panel Discussion**
- **Producer:** Manages all technical aspects
- **Moderator (Host role):** Follows rundown, monitors time
- **3 Panelists (Guest role):** See cues, view countdown

**Example 3: Remote Interview**
- **Producer (in studio):** Full control
- **Host (remote):** Views rundown, adjusts own audio
- **Guest (remote):** Sees cue cards, knows when to speak

### Best Practices

1. **Assign roles appropriately** - Not everyone needs Producer access
2. **Create accounts before show** - Don't add users during live production
3. **Test permissions** - Verify each role has appropriate access
4. **Use Team Status** - Monitor who's online before starting
5. **Communicate offline** - Use voice chat for coordination

---

## 6. Professional Scene Templates 🎨

### Overview
Pre-built OBS scene collections for different show formats, ready to import and customize.

### Available Templates

See the separate **OBS_TEMPLATE_GUIDE.md** in the `obs-templates/` directory for:

1. **Talk Show Setup** - Interview shows, podcasts
2. **Reaction Show Setup** - Video reactions, watch-alongs
3. **Interview Setup** - One-on-one interviews
4. **Panel Discussion Setup** - Multi-person panels

### Quick Start

1. **Choose a template** that matches your show format
2. **Import into OBS** (Scene Collection → Import)
3. **Replace placeholders** with your actual cameras/mics
4. **Customize styling** (colors, fonts, positions)
5. **Connect dashboard** to OBS
6. **Test all scenes** before going live

### Template Features

All templates include:
- ✅ Multiple scene layouts
- ✅ Proper source positioning
- ✅ Lower third placeholders
- ✅ Audio source setup
- ✅ Transition configurations
- ✅ Professional scaling and crops

### Full Documentation

For complete instructions on:
- Importing templates
- Customizing sources
- Configuring lower thirds
- Recommended OBS settings
- Troubleshooting

**See:** `/obs-templates/OBS_TEMPLATE_GUIDE.md`

---

## Support & Resources

### Documentation Files

- **README.md** - Main setup and installation guide
- **FEATURE_GUIDE.md** - This document (feature details)
- **OBS_TEMPLATE_GUIDE.md** - Scene template instructions
- **QUICKSTART.md** - Quick start guide
- **CHANGELOG.md** - Version history and updates

### Getting Help

1. **Check documentation** - Most questions answered in guides
2. **Review OBS settings** - Many issues are OBS configuration
3. **Test with minimal setup** - Isolate problems
4. **Check browser console** - Look for error messages

### Feature Requests

This dashboard is designed to be extensible. Potential future enhancements:

- User management UI (currently done via Supabase)
- Custom transition controls
- Replay buffer management
- Virtual camera controls
- Chat integration
- Multi-platform streaming
- Advanced analytics

---

**Version:** 2.0 (Professional Suite)
**Last Updated:** October 2025
**Created by:** MiniMax Agent
