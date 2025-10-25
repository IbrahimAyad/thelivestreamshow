# Simple OBS Setup Guide

## 🎯 One Browser Source = Complete Broadcast

With the new browser-based broadcast system, OBS setup is incredibly simple. You only need **ONE Browser Source** to capture the entire broadcast output with all scenes, cameras, graphics, and overlays.

---

## 🚀 3-Step Setup

### Step 1: Create a Scene in OBS

1. Open OBS Studio
2. In the "Scenes" panel (bottom-left), click the **"+"** button
3. Name it: **"Broadcast Output"** (or any name you prefer)
4. Click OK

**Result:** You now have an empty scene ready for your broadcast source

---

### Step 2: Add Browser Source

1. With your new scene selected, click the **"+"** button in the "Sources" panel
2. Select **"Browser"** from the list
3. Name it: **"Live Broadcast View"**
4. Click OK

**You'll now see the Browser Source Properties window.**

---

### Step 3: Configure Browser Source Settings

Fill in the following settings exactly:

| Setting | Value | Why |
|---------|-------|-----|
| **URL** | `https://your-dashboard-url.com/broadcast` | Your actual deployed Broadcast View URL |
| **Width** | `1920` | Full HD width (1080p) |
| **Height** | `1080` | Full HD height (1080p) |
| **FPS** | `30` | Smooth 30 frames per second |
| **CSS** | (leave empty) | No custom styling needed |
| **Shutdown source when not visible** | ❌ **UNCHECKED** | Keeps real-time sync active |
| **Refresh browser when scene becomes active** | ❌ **UNCHECKED** | Prevents interruptions |
| **Control audio via OBS** | ✅ **CHECKED** | Lets OBS manage audio levels |

**Click "OK"** to save

**Result:** Your complete broadcast system is now rendering in OBS!

---

## ✅ Verify Setup

### You should see:

1. The Browser Source fills your OBS canvas (1920x1080)
2. The current active scene from your Producer Dashboard
3. Any active cameras (if configured)
4. Any visible graphics overlays (LIVE indicator, logo, etc.)

### If you see a blank screen:

- Check that the URL is correct
- Ensure you have an active scene selected in Producer Dashboard
- Verify your internet connection (real-time sync requires it)
- Right-click the Browser Source → "Refresh"

---

## 🎬 Production Workflow

### Before Going Live

**In Producer Dashboard:**
1. Select a scene (e.g., "Intermission")
2. Configure cameras (if needed)
3. Prepare lower thirds
4. Add YouTube videos to queue

**In OBS:**
1. Verify Browser Source is showing correctly
2. Check audio levels
3. Set up your streaming settings

### Going Live

**In Producer Dashboard:**
1. Switch to your opening scene
2. Toggle "LIVE Indicator" ON
3. Play intro video (if any)

**In OBS:**
1. Click "Start Streaming"
2. You're live!

### During Stream

**All control happens in Producer Dashboard:**
- Switch scenes with one click
- Show/hide lower thirds
- Play YouTube videos
- Start timers
- Toggle graphics on/off

**OBS automatically displays all changes in real-time.**

---

## 🔧 Advanced OBS Setup (Optional)

### Multiple Scenes for Different Layouts

If you want OBS-level scene switching (in addition to browser scene switching), you can create multiple OBS scenes:

**OBS Scene 1: "Full Broadcast"**
- Browser Source: Broadcast View (1920x1080)
- Use for: Complete browser-controlled output

**OBS Scene 2: "Lower Third Only"**
- Browser Source: Broadcast View (cropped to bottom 200px)
- Use for: Overlay lower third on other OBS sources

**OBS Scene 3: "Timer Only"**
- Browser Source: Broadcast View (cropped to timer area)
- Positioned in corner
- Use for: Timer overlay on other scenes

### Audio Configuration

**Recommended Setup:**

1. Right-click Browser Source → "Advanced Audio Properties"
2. Set **Audio Monitoring** to "Monitor Off"
3. Leave **Audio Tracks** checked for Track 1

**Why:** This sends browser audio (YouTube videos, camera mics) to your stream without hearing it twice in your headphones.

**If you want to hear browser audio:**
- Set Audio Monitoring to "Monitor and Output"
- Use a different audio output device for monitoring

### Hardware Encoding

**To reduce CPU usage:**

1. OBS Settings → Output
2. Change **Encoder** to:
   - **NVIDIA:** NVENC H.264
   - **AMD:** H264/AVC (AMD)
   - **Intel:** QuickSync H.264

**Result:** GPU handles encoding, CPU stays free for Browser Source rendering

---

## 💡 Pro Tips

### 1. Preview Before Going Live

**Enable OBS Studio Mode:**
- Click "Studio Mode" in OBS
- Left side = Preview
- Right side = Live Output
- Test scenes in preview before switching live

### 2. Use Hotkeys

**Set up OBS hotkeys for:**
- Start/Stop Streaming
- Start/Stop Recording
- Scene switching
- Audio mute toggles

**Access:** OBS Settings → Hotkeys

### 3. Monitor Performance

**Watch these OBS stats (bottom-right):**
- **CPU Usage:** Should stay below 80%
- **FPS:** Should be steady at 30 or 60
- **Dropped Frames:** Should be 0% or very low (<0.5%)

**If performance is poor:**
- Lower Browser Source FPS to 15-20
- Reduce output resolution to 720p
- Close other applications
- Use hardware encoding

### 4. Save Scene Collections

**After setup:**
1. OBS → Scene Collection → Export
2. Save your configuration
3. Can import on other computers

**Result:** Easy setup replication

---

## ⚠️ Common Issues

### Issue: Browser Source is laggy

**Solution:**
- Reduce FPS to 20 or 15
- Close other browser tabs
- Restart OBS
- Check CPU usage (should be <80%)

### Issue: No audio from Browser Source

**Solution:**
- Verify "Control audio via OBS" is checked in Browser Source settings
- Check Browser Source isn't muted in OBS mixer
- Ensure videos in queue have audio
- Test with a known video with sound

### Issue: Real-time changes don't appear

**Solution:**
- Uncheck "Shutdown source when not visible"
- Refresh Browser Source (right-click → Refresh)
- Check internet connection
- Verify Producer Dashboard changes are saving (check Supabase)

### Issue: Camera feeds don't show

**Solution:**
- Grant camera permission in Producer Dashboard
- Verify camera is assigned to a position
- Ensure camera is toggled ON (green eye icon)
- Check that current scene uses cameras (e.g., PiP, Split Screen)
- Refresh Browser Source

### Issue: Graphics appear cut off

**Solution:**
- Verify Browser Source dimensions are 1920x1080
- Check that OBS canvas is 1920x1080 (or 1280x720)
- Don't use "Stretch to screen" - use "Scale to inner bounds"
- Right-click Browser Source → Transform → Fit to Screen

---

## 📄 Recommended OBS Settings

### Video Settings

**File → Settings → Video:**
- **Base Resolution:** 1920x1080
- **Output Resolution:** 1920x1080 (or 1280x720 for lower bandwidth)
- **FPS:** 30 (matches Browser Source)

### Output Settings

**File → Settings → Output → Streaming:**
- **Video Bitrate:** 4500 Kbps (for 1080p) or 2500 Kbps (for 720p)
- **Encoder:** NVENC, QuickSync, or x264
- **Audio Bitrate:** 160 Kbps

### Advanced Settings

**File → Settings → Advanced:**
- **Process Priority:** Normal
- **Color Format:** NV12
- **Color Space:** 709
- **Color Range:** Partial

---

## ✅ Final Checklist

Before going live, verify:

- [ ] Browser Source URL is correct (`/broadcast`)
- [ ] Dimensions are 1920x1080
- [ ] FPS is 30
- [ ] "Shutdown source when not visible" is UNCHECKED
- [ ] Browser Source audio is enabled in OBS mixer
- [ ] Active scene is selected in Producer Dashboard
- [ ] Cameras are configured (if needed)
- [ ] LIVE indicator is ready to toggle ON
- [ ] YouTube videos are queued (if needed)
- [ ] Lower thirds are prepared
- [ ] Internet connection is stable

---

## 🎉 You're Ready to Broadcast!

With just **ONE Browser Source**, your OBS is now displaying a complete professional broadcast system with:
- ✅ Dynamic scene switching
- ✅ Live webcam feeds
- ✅ Professional graphics overlays
- ✅ Real-time lower thirds
- ✅ YouTube video playback
- ✅ Countdown timers
- ✅ Segment information

**Everything controlled from your Producer Dashboard!**

---

**Created by:** MiniMax Agent  
**Last Updated:** 2025-10-13  
**For:** Browser-Based Broadcast Production System
