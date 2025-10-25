# OBS Scene Collection Templates Guide

This directory contains professional OBS scene collection templates designed for different types of live stream productions. These templates provide pre-configured scenes, sources, and layouts that you can import directly into OBS.

## Available Templates

### 1. Talk Show Setup (`talk_show_template.json`)
**Best for:** Interview shows, podcasts, talk shows

**Included Scenes:**
- **Main - Host + Guests**: Host camera at 60% left, 2 guest cameras at 20% each on the right
- **Host Solo**: Host camera fullscreen
- **Guest Spotlight**: One guest fullscreen
- **Intermission**: Logo and music visualization

**Included Sources:**
- 3 Camera inputs (Host, Guest 1, Guest 2)
- 3 Audio inputs (Host Mic, Guest 1 Mic, Guest 2 Mic)
- Lower Third text sources (Title and Subtitle)
- Show logo placeholder

**Recommended Use Cases:**
- Weekly talk shows
- Podcast recordings
- Panel interviews

---

### 2. Reaction Show Setup (`reaction_show_template.json`)
**Best for:** Reaction videos, watch-along streams

**Included Scenes:**
- **Reaction View**: Host camera 30% bottom-right, video player 70% main area
- **Full Video**: Video player fullscreen
- **Host Commentary**: Host camera fullscreen

**Included Sources:**
- Host webcam
- Browser source for video player
- Host microphone
- Lower Third text sources

**Recommended Use Cases:**
- YouTube video reactions
- Movie/TV watch-alongs
- Gaming content reactions

---

### 3. Interview Setup (`interview_template.json`)
**Best for:** One-on-one interviews

**Included Scenes:**
- **Split Screen**: 50/50 dual camera view
- **Interviewer Focus**: Interviewer 80%, interviewee 20% corner
- **Interviewee Focus**: Interviewee 80%, interviewer 20% corner

**Included Sources:**
- 2 Camera inputs (Interviewer, Interviewee)
- 2 Audio inputs (Interviewer Mic, Interviewee Mic)
- Lower Third text sources

**Recommended Use Cases:**
- Professional interviews
- Documentary-style content
- Expert conversations

---

### 4. Panel Discussion Setup (`panel_discussion_template.json`)
**Best for:** Multi-person panels, roundtable discussions

**Included Scenes:**
- **4-Panel Grid**: 4 cameras in 2x2 grid
- **Moderator + 3 Guests**: Moderator larger, 3 guests smaller
- **Active Speaker**: One fullscreen, others as thumbnails

**Included Sources:**
- 4 Camera inputs (Moderator, Panelist 1, 2, 3)
- 4 Audio inputs (Moderator Mic, Panelist 1, 2, 3 Mics)
- Lower Third text sources

**Recommended Use Cases:**
- Panel discussions
- Roundtable debates
- Conference sessions

---

## How to Import Templates into OBS

### Method 1: Import Scene Collection (Recommended)

1. **Open OBS Studio**
2. **Go to:** `Scene Collection` menu at the top
3. **Click:** `Import`
4. **Browse to:** The template JSON file you want to use
5. **Click:** `Open`
6. OBS will create a new scene collection with the template

### Method 2: Manual JSON Import

1. **Locate your OBS config folder:**
   - **Windows:** `%APPDATA%/obs-studio/basic/scenes/`
   - **macOS:** `~/Library/Application Support/obs-studio/basic/scenes/`
   - **Linux:** `~/.config/obs-studio/basic/scenes/`

2. **Copy the template JSON file** to this directory
3. **Restart OBS**
4. **Select the new scene collection** from the Scene Collection menu

---

## Customizing Your Template

### Step 1: Replace Placeholder Sources

After importing, you need to configure the actual devices:

1. **Video Capture Devices (Cameras):**
   - Right-click on camera source → `Properties`
   - Select your actual camera device from the dropdown
   - Adjust resolution and frame rate

2. **Audio Input Capture (Microphones):**
   - Right-click on mic source → `Properties`
   - Select your actual microphone device
   - Adjust audio levels in the mixer

3. **Browser Sources (Video Player):**
   - Right-click on browser source → `Properties`
   - Enter the URL for your video player or website
   - Set width to 1920, height to 1080 for Full HD

4. **Image Sources (Logos):**
   - Right-click on image source → `Properties`
   - Browse to your logo image file
   - Recommended format: PNG with transparency

### Step 2: Adjust Positioning and Scaling

1. **Select a scene** in the Scenes panel
2. **Click on a source** in the Sources panel
3. **Drag to reposition** or use the red handles to resize
4. **Hold Shift** while dragging to maintain aspect ratio
5. **Right-click → Transform** for precise positioning

### Step 3: Configure Lower Thirds

**Important:** The dashboard controls lower thirds via text sources named:
- `LowerThird_Title` - Main text (e.g., guest name)
- `LowerThird_Subtitle` - Secondary text (e.g., guest title)

**Styling Recommendations:**
- **Font:** Arial Bold for title, Arial Regular for subtitle
- **Size:** 36-48pt for title, 24-28pt for subtitle
- **Color:** White (#FFFFFF) for title, Light Gray (#CCCCCC) for subtitle
- **Outline:** 2-3px black outline for better readability
- **Position:** 50px from left edge, 930px from top (bottom area)

**To customize:**
1. Right-click on `LowerThird_Title` → `Properties`
2. Adjust font, size, color, and effects
3. Click on the source and drag to reposition
4. Repeat for `LowerThird_Subtitle`

### Step 4: Add Filters for Professional Look

**For Camera Sources:**
1. Right-click → `Filters`
2. **Add:**
   - **Color Correction** - Adjust brightness, contrast, saturation
   - **Chroma Key** - If using green screen
   - **Sharpen** - Slight sharpening (0.1 - 0.3)

**For Audio Sources:**
1. Right-click → `Filters`
2. **Add:**
   - **Noise Suppression** - Remove background noise
   - **Noise Gate** - Cut audio below threshold
   - **Compressor** - Even out volume levels
   - **Gain** - Boost or reduce overall volume

---

## Dashboard Integration

Once your template is set up, the Live Stream Production Dashboard can control:

✅ **Scene Switching** - Change between all scenes
✅ **Source Visibility** - Show/hide individual sources
✅ **Audio Mixing** - Control all microphone levels
✅ **Lower Thirds** - Update text and toggle visibility
✅ **Recording/Streaming** - Start/stop recording and streaming
✅ **Stream Health** - Monitor bitrate, dropped frames, CPU usage

---

## Recommended OBS Settings

### Video Settings
- **Base Canvas Resolution:** 1920x1080 (Full HD)
- **Output Resolution:** 1920x1080 or 1280x720 (HD)
- **FPS:** 30 or 60 (60 for gaming, 30 for talk shows)

### Output Settings (Streaming)
- **Encoder:** x264 or NVENC (if you have NVIDIA GPU)
- **Bitrate:** 
  - 1080p60: 6000 Kbps
  - 1080p30: 4500 Kbps
  - 720p30: 2500 Kbps
- **Keyframe Interval:** 2 seconds
- **Preset:** veryfast (x264) or Quality (NVENC)

### Output Settings (Recording)
- **Recording Format:** MP4 or MKV
- **Encoder:** Same as stream or use high-quality preset
- **Recording Quality:** High or Indistinguishable

### Audio Settings
- **Sample Rate:** 48 kHz
- **Channels:** Stereo
- **Desktop Audio:** Your system audio device
- **Mic/Auxiliary Audio:** Your primary microphone

---

## Troubleshooting

### Sources Not Appearing?
- Check that the device is connected and recognized by your OS
- Try selecting a different device in source properties
- Restart OBS after connecting new devices

### Dashboard Can't Control Sources?
- Ensure source names match exactly (case-sensitive)
- Check that OBS WebSocket is enabled and connected
- Verify the dashboard is connected to OBS (green status)

### Lower Thirds Not Showing?
- Confirm text sources are named `LowerThird_Title` and `LowerThird_Subtitle`
- Check that sources are added to the current scene
- Verify sources are not locked or hidden

### Performance Issues?
- Lower your output resolution (try 720p)
- Reduce FPS to 30
- Use a faster encoder preset
- Close unnecessary applications
- Disable browser source hardware acceleration

---

## Tips for Professional Production

1. **Always test before going live**
   - Run through all scenes
   - Test audio levels for each microphone
   - Verify lower thirds appear correctly
   - Check stream health metrics

2. **Use the Dashboard's Audio Presets**
   - Create presets for different segments
   - Save time by switching quickly
   - Maintain consistent audio levels

3. **Leverage the Rundown Editor**
   - Plan your show structure in advance
   - Add cues for scene switches
   - Include notes for talking points

4. **Monitor Stream Health**
   - Keep an eye on dropped frames
   - Watch CPU usage
   - Adjust bitrate if experiencing network issues

5. **Practice Switching**
   - Familiarize yourself with keyboard shortcuts
   - Use the dashboard's scene switcher for quick access
   - Test all transitions before going live

---

## Support

For additional help:
- **OBS Documentation:** https://obsproject.com/docs/
- **OBS Forums:** https://obsproject.com/forum/
- **Dashboard Issues:** Check the main README.md

---

**Version:** 1.0
**Last Updated:** October 2025
**Created by:** MiniMax Agent
