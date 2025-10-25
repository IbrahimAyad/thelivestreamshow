# OBS Broadcast View Setup Guide

The **Broadcast View** is a clean, professional display interface designed specifically for use as an OBS Browser Source. It eliminates all production controls and shows only viewer-facing content that updates in real-time as you make changes in the producer dashboard.

---

## 🎯 What is Broadcast View?

Broadcast View is a dedicated `/broadcast` route that displays:
- **YouTube Video Player** - Shows currently playing videos from your queue
- **Lower Thirds** - Guest names, social media handles, topics, and breaking news graphics
- **Countdown/Countup Timers** - Large, color-coded timers visible to your audience
- **Current Segment Info** - Displays the active rundown segment details
- **Real-time Sync** - All changes from the producer dashboard appear instantly

**No backend controls, no clutter—just clean, professional broadcast content.**

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Open Broadcast View

1. In the Producer Dashboard, click the **"Broadcast View"** button in the top-right corner
2. A new tab will open at `/broadcast`
3. This is the view you'll add to OBS

**URL Format:** `https://your-dashboard-url.com/broadcast`

### Step 2: Add Browser Source in OBS

1. In OBS, select the scene where you want to display broadcast content
2. Click the **"+"** button in the Sources panel
3. Select **"Browser"** from the list
4. Name it (e.g., "Broadcast View" or "Lower Thirds")
5. Configure the settings (see recommended settings below)

### Step 3: Configure Browser Source Settings

**Recommended Settings:**

| Setting | Value | Notes |
|---------|-------|-------|
| **URL** | `https://your-dashboard-url.com/broadcast` | Your actual deployed URL |
| **Width** | `1920` | Full HD width |
| **Height** | `1080` | Full HD height |
| **FPS** | `30` | Smooth animations |
| **Custom CSS** | (optional) | For transparency or adjustments |
| **Shutdown source when not visible** | ❌ Unchecked | Keeps it in sync |
| **Refresh browser when scene becomes active** | ❌ Unchecked | Maintains state |

**Click "OK" to add the source to your scene.**

---

## 🎨 Customization Options

### In-Browser Settings (Hover Top-Right Corner)

When you open the Broadcast View in a browser, hover over the top-right corner to reveal the settings panel:

- **Transparent Background** - Enable for chroma key or layering
- **Show Timer** - Toggle timer visibility
- **Show Segment Info** - Toggle segment display
- **Show Video Player** - Toggle video player visibility

Settings are saved to localStorage and persist across sessions.

### OBS Transform Controls

You can crop, scale, and position the Broadcast View source in OBS:

**Right-click the source → Transform:**
- **Scale** - Resize to fit your layout
- **Crop** - Show only specific elements (e.g., lower third area only)
- **Position** - Move to any part of your canvas

---

## 📐 Common Use Cases

### 1. Full-Screen Broadcast View
**Use:** Display entire broadcast interface on stream

- Add source at 1920x1080
- No cropping needed
- Shows all elements (video, timer, lower third, segment)

### 2. Lower Third Only
**Use:** Overlay just the name/title graphics at the bottom

- Add source at 1920x1080
- Right-click → Transform → Edit Transform
- Set **Crop (Top)** to `900` pixels
- Position at bottom of screen
- Result: Only the lower third bar is visible

### 3. Timer Overlay
**Use:** Display countdown timer in a corner

- Add source at 1920x1080
- Crop to show only timer area (middle-right section)
- Scale down to ~300x200
- Position in top-right or bottom-right corner

### 4. Picture-in-Picture Video
**Use:** Show YouTube video as an overlay

- Add source at 1920x1080
- Crop to show only video player area (top section)
- Scale down to desired size
- Position anywhere in your scene

---

## 🔄 How Real-Time Sync Works

**Producer Dashboard (Your Control Panel):**
- Add YouTube videos to queue → Broadcast View shows "Now Playing"
- Activate lower third → Broadcast View animates it in
- Start a timer → Broadcast View displays countdown
- Update rundown status → Broadcast View shows current segment

**Broadcast View (In OBS):**
- Listens to Supabase real-time subscriptions
- Updates automatically when you make changes
- No manual refresh needed
- Smooth animations and transitions

**No OBS WebSocket connection required for Broadcast View!**

---

## 🎬 Workflow Example

**Your Setup:**
1. **Primary Monitor:** OBS Studio with your scenes
2. **Secondary Monitor:** Producer Dashboard for controlling everything
3. **OBS Scene:** Browser Source displaying Broadcast View at `/broadcast`

**During Live Stream:**

| You Do (Producer Dashboard) | Viewers See (Broadcast View in OBS) |
|------------------------------|-------------------------------------|
| Click "Add" on YouTube video | Video appears in Broadcast View |
| Click "Play" on video | "NOW PLAYING" indicator + video plays |
| Activate lower third "Guest Name" | Lower third slides up from bottom |
| Start 5-minute countdown timer | Large countdown appears (5:00 → 0:00) |
| Mark segment "Interview" as in-progress | "CURRENT SEGMENT: Interview" displays |

**Everything syncs in real-time. No manual updates needed.**

---

## 🛠️ Troubleshooting

### Problem: Changes in Producer Dashboard don't appear in Broadcast View

**Solution:**
- Ensure the Browser Source is **active** (visible in current scene)
- Check that "Shutdown source when not visible" is **unchecked**
- Verify the URL is correct (`/broadcast` route)
- Refresh the browser source manually (right-click → Refresh)

### Problem: Text is too small to read

**Solution:**
- Right-click source → Transform → Edit Transform
- Increase **Scale** to 120% or 150%
- Or use OBS's "Fit to Screen" transform option

### Problem: Background is not transparent

**Solution:**
- Open Broadcast View in a regular browser tab
- Hover over top-right corner to reveal settings
- Check **"Transparent Background"**
- Reload the Browser Source in OBS

### Problem: Video player audio interferes with my mic

**Solution:**
- Right-click the Broadcast View source in OBS
- Advanced Audio Properties → Set to **"Monitor Off"**
- Control YouTube audio separately from the producer dashboard

### Problem: Lower thirds don't animate smoothly

**Solution:**
- Ensure FPS is set to **30** in Browser Source settings
- Check your OBS canvas FPS (should be 30 or 60)
- Reduce other heavy sources in the scene

---

## 🎨 Custom CSS (Advanced)

If you want to further customize the appearance in OBS, you can add custom CSS to the Browser Source:

**Example: Make background fully transparent**
```css
body {
  background: transparent !important;
}
```

**Example: Increase font size for all text**
```css
* {
  font-size: 1.2em !important;
}
```

**To add custom CSS:**
1. Right-click Browser Source → Properties
2. Scroll to **"Custom CSS"** field
3. Paste your CSS code
4. Click OK

---

## 📱 Responsive Design

The Broadcast View is optimized for:
- **1920x1080 (Full HD)** - Primary target
- **1280x720 (HD)** - Scales well
- **3840x2160 (4K)** - Upscales beautifully

Text and elements maintain readability at all common broadcast resolutions.

---

## ✅ Best Practices

1. **Keep Browser Source Active**
   - Don't use "Shutdown source when not visible"
   - Ensures real-time updates continue even when not on screen

2. **Use Separate Scenes for Different Layouts**
   - Scene 1: Full Broadcast View
   - Scene 2: Lower Third Only
   - Scene 3: Timer Overlay
   - Switch between scenes as needed

3. **Test Before Going Live**
   - Add a test video in producer dashboard
   - Verify it appears in Broadcast View
   - Test lower thirds and timers
   - Check animations and transitions

4. **Monitor Performance**
   - Browser sources can be CPU-intensive
   - If you experience lag, reduce FPS to 15-20
   - Or crop to show only needed elements

5. **Backup Plan**
   - Have static fallback graphics ready
   - If Broadcast View fails, switch to static scenes
   - Always have a "Technical Difficulties" scene

---

## 🎉 You're All Set!

Your Broadcast View is now integrated with OBS and will display professional broadcast content that updates in real-time as you control your production from the Producer Dashboard.

**Questions or issues?** Check the main dashboard README or contact support.

---

**Created by:** MiniMax Agent  
**Last Updated:** 2025-10-13  
**Dashboard Version:** 2.0 - Professional Production Suite
