# Camera Setup Guide

## 📹 WebRTC Browser Camera Integration

Your broadcast system uses WebRTC to access webcams directly in the browser. This means you can use any camera connected to your computer without additional software!

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Grant Camera Permission

1. Open Producer Dashboard
2. Go to **"Advanced"** tab
3. Find **"Camera Setup"** panel
4. Click **"Grant Permission"** button
5. Browser will ask: "Allow access to camera and microphone?"
6. Click **"Allow"**

**Result:** Browser can now detect all connected cameras

### Step 2: Select Cameras

For each position (1-4):

1. **Choose Device:**
   - Click the dropdown menu
   - Select a camera from the list
   - Example: "HD Webcam (04f2:b604)" or "Built-in Camera"

2. **Label the Camera:**
   - Click the label field
   - Type a name: "Host Camera", "Guest 1", etc.
   - This label appears in scenes

3. **Toggle ON:**
   - Click the eye icon
   - Icon turns green = camera is active
   - Icon is gray = camera is off

4. **Optional - Mirror:**
   - Click the flip icon to mirror horizontally
   - Useful for your own camera (text reads correctly)
   - Leave guests' cameras unmirrored

**Result:** Cameras are configured and ready to use!

---

## 🎥 Camera Positions Explained

### Position System

Your broadcast system has **4 camera positions**:

| Position | Default Label | Used In Scenes |
|----------|---------------|----------------|
| Position 1 | Host Camera | PiP, Reaction View, Split Screen, Panel Grid, Interview |
| Position 2 | Guest 1 | Split Screen, Panel Grid, Interview |
| Position 3 | Guest 2 | Panel Grid |
| Position 4 | Guest 3 | Panel Grid |

### How Positions Work

**Picture-in-Picture:**
- Uses Position 1 only (host camera in corner)

**Split Screen / Interview:**
- Uses Position 1 (left side)
- Uses Position 2 (right side)

**Panel Grid:**
- Uses all 4 positions in 2x2 grid
- Position 1: Top-left
- Position 2: Top-right
- Position 3: Bottom-left
- Position 4: Bottom-right

**Reaction View:**
- Uses Position 1 only (host camera in bottom strip)

---

## 🔧 Camera Configuration Options

### 1. Camera Device Selection

**What it does:**
- Assigns a physical camera to a position
- Can be built-in webcam, USB camera, or virtual camera

**How to change:**
1. Find the camera position in Cameras Panel
2. Click the dropdown menu
3. Select different camera device
4. Camera feed updates automatically

### 2. Camera Labels

**What it does:**
- Names the camera position
- Appears as name tag in some scenes
- Helps you identify cameras in Producer Dashboard

**How to change:**
1. Click the label text field
2. Type new name
3. Press Enter
4. Label updates in database and scenes

**Suggested labels:**
- "Host"
- "Guest 1", "Guest 2", "Guest 3"
- "Main Camera"
- "Interview Guest"
- Names: "John", "Sarah", etc.

### 3. Active/Inactive Toggle

**What it does:**
- Turns camera feed on or off
- Inactive cameras don't appear in scenes
- Saves bandwidth when camera not needed

**How to toggle:**
- Click the eye icon
- Green = ON (camera active)
- Red = OFF (camera inactive)

**When to turn OFF:**
- Guest hasn't joined yet
- Camera position not needed for current scene
- Testing other cameras
- Conserving system resources

### 4. Mirror/Flip Setting

**What it does:**
- Flips camera feed horizontally
- Makes text/logos appear correctly when facing camera

**How to toggle:**
- Click the flip icon
- Purple = mirrored
- Gray = normal

**When to use:**
- Mirror your own camera (so you see yourself naturally)
- Don't mirror guests' cameras (they handle their own mirroring)
- Mirror if wearing text on shirt/hoodie

---

## 🎬 Camera Types Supported

### 1. Built-in Webcams
- Laptop integrated cameras
- iMac/MacBook cameras
- Surface/tablet cameras

**Pros:**
- Already available
- No setup required
- Decent quality

**Cons:**
- Fixed position
- Limited quality
- Can't be repositioned

### 2. USB Webcams
- Logitech C920/C922/C930e
- Razer Kiyo
- Any USB camera

**Pros:**
- Better quality than built-in
- Adjustable position
- Often have better mics

**Cons:**
- Need to purchase
- Require USB port
- May need drivers

### 3. Virtual Cameras
- OBS Virtual Camera
- Snap Camera
- ManyCam
- XSplit VCam

**Pros:**
- Can use DSLR/mirrorless cameras
- Apply filters/effects
- Professional quality

**Cons:**
- Requires additional software
- More complex setup
- Higher CPU usage

### 4. Phone Cameras (via Apps)
- DroidCam
- EpocCam
- iVCam

**Pros:**
- Use phone as webcam
- High quality
- Wireless option

**Cons:**
- Requires app installation
- May have latency
- Needs phone mount

---

## ⚙️ Technical Details

### Browser Permissions

**First-time setup:**
- Browser requests camera/microphone access
- You must click "Allow" for each domain
- Permission is saved for future visits

**If permission denied:**
1. Click the lock icon in browser address bar
2. Find "Camera" permissions
3. Change to "Allow"
4. Refresh page

### Supported Browsers

**Recommended:**
- ✅ Google Chrome (best performance)
- ✅ Microsoft Edge (Chromium-based)
- ✅ Brave Browser

**Supported:**
- ⚠️ Firefox (works, but may have WebRTC issues)
- ⚠️ Safari (works on macOS/iOS, limited features)

**Not Supported:**
- ❌ Internet Explorer

### Device Enumeration

**How detection works:**
1. You grant camera permission
2. Browser calls `navigator.mediaDevices.enumerateDevices()`
3. All video input devices are listed
4. You select which device for each position

**Device ID:**
- Each camera has a unique `deviceId`
- This ID is saved in database
- Camera is accessed using this ID

### Resolution & Quality

**Default settings:**
- Browser requests default camera resolution
- Usually 720p or 1080p depending on camera
- No manual resolution selection (uses camera default)

**To improve quality:**
- Use better camera hardware
- Ensure good lighting
- Position camera at appropriate distance
- Clean camera lens

---

## 💡 Pro Tips

### Lighting

**Make a huge difference:**
- Face a window or light source
- Don't sit with bright window behind you (backlit)
- Use ring light or desk lamp
- Avoid overhead lighting (creates shadows)

**Recommended setup:**
- Key light: Main light source (45° angle)
- Fill light: Softens shadows (opposite side)
- Backlight: Separates you from background (optional)

### Camera Positioning

**Height:**
- Camera at eye level or slightly above
- Don't point camera up (unflattering angle)
- Don't point camera down (too much)

**Distance:**
- Arm's length away (about 2-3 feet)
- Not too close (distortion)
- Not too far (lose detail)

**Framing:**
- Head room: Small space above head
- Look room: Space in direction you're looking
- Center yourself in frame

### Audio Quality

**Cameras have mics, but:**
- Built-in camera mics are usually poor
- Consider separate microphone
- USB mic (Blue Yeti, Audio-Technica)
- XLR setup for professional quality

**In Producer Dashboard:**
- Audio controls can adjust each camera's mic volume
- Use Audio Presets to save mic level configurations

### Background

**Keep it clean:**
- Declutter visible area
- No laundry, mess, or personal items
- Consider neutral wall or bookshelf
- Virtual backgrounds (if using virtual camera software)

### Multiple Cameras (Advanced)

**If using 4 cameras:**
- Ensure good lighting for all positions
- Balance audio levels across all mics
- Test each camera feed before going live
- Consider using USB hub for multiple USB cameras

---

## 🔍 Troubleshooting

### Problem: No cameras detected

**Solution:**
1. Click "Grant Permission" again
2. Check browser permissions (address bar lock icon)
3. Ensure camera is plugged in (USB cameras)
4. Try different USB port
5. Restart browser
6. Check if another app is using camera (close it)

### Problem: Camera shows "Camera not available"

**Solution:**
- Camera might be in use by another app
- Close Zoom, Skype, Teams, etc.
- Restart browser
- Unplug and replug USB camera
- Check camera drivers (Device Manager on Windows)

### Problem: Camera is laggy or freezes

**Solution:**
- Close other browser tabs
- Close other applications
- Use lower resolution camera
- Try different USB port (USB 3.0 if available)
- Update camera drivers
- Restart computer

### Problem: Audio but no video

**Solution:**
- Camera is toggled OFF (click eye icon to turn ON)
- Wrong camera selected (check device dropdown)
- Camera covered/lens cap on
- Refresh browser

### Problem: Video but no audio

**Solution:**
- Camera mic might be muted in Audio Mixer panel
- Check system audio settings
- Ensure correct mic input is selected
- Test with different camera

### Problem: Mirror setting doesn't save

**Solution:**
- Check internet connection (settings save to Supabase)
- Refresh page and try again
- Clear browser cache
- Check browser console for errors

### Problem: Multiple devices with same name

**Solution:**
- Device labels come from OS/drivers
- Look for device ID suffix (e.g., "USB Camera (0c45:6366)")
- Try unplugging one camera to identify
- Rename cameras in Device Manager (Windows) or System Preferences (macOS)

---

## 📊 Performance Optimization

### Bandwidth Considerations

**Each camera stream uses bandwidth:**
- 1 camera (720p): ~1-2 Mbps
- 2 cameras: ~2-4 Mbps
- 4 cameras: ~4-8 Mbps

**If bandwidth limited:**
- Use fewer cameras
- Lower camera resolution
- Turn off cameras not currently in scene

### CPU Usage

**WebRTC uses CPU for:**
- Video encoding
- Audio processing
- Real-time rendering

**To reduce CPU load:**
- Close unnecessary browser tabs
- Close other applications
- Use hardware acceleration in browser
- Lower camera count

**Check CPU usage:**
- Windows: Task Manager
- macOS: Activity Monitor
- In-browser: Chrome Task Manager (Shift+Esc)

### Browser Performance

**For best performance:**
- Use Chrome or Edge
- Enable hardware acceleration (chrome://settings → System)
- Close unused tabs
- Restart browser before long streams
- Clear browser cache periodically

---

## ✅ Pre-Stream Camera Checklist

Before going live:

- [ ] All cameras detected and listed
- [ ] Cameras assigned to correct positions
- [ ] Camera labels set (Host, Guest 1, etc.)
- [ ] All cameras toggled ON (green eye icon)
- [ ] Mirror settings configured
- [ ] Lighting looks good on all cameras
- [ ] Audio levels tested for each camera
- [ ] Camera framing/positioning checked
- [ ] Background tidy for all camera positions
- [ ] Test scene with cameras (e.g., Panel Grid)
- [ ] Verify cameras appear in Broadcast View
- [ ] OBS Browser Source showing camera feeds

---

## 🎓 Advanced Topics

### Virtual Camera Software

**To use DSLR or advanced cameras:**

1. **Install virtual camera software:**
   - OBS Studio (free, with Virtual Camera output)
   - ManyCam (paid, with effects)
   - XSplit VCam (paid, background removal)

2. **Configure virtual camera:**
   - Set up DSLR in virtual camera software
   - Enable virtual camera output
   - Select virtual camera in Producer Dashboard

**Benefits:**
- Professional camera quality
- Apply filters/effects
- Background replacement
- Picture-in-picture within camera

### Multi-Guest Remote Setup

**For remote guests:**

1. **Guest joins via video call:**
   - Zoom, Google Meet, Discord, etc.

2. **Capture their video:**
   - Use OBS Virtual Camera to capture call window
   - Or use NDI tools for network camera feeds

3. **Route to Broadcast System:**
   - Select OBS Virtual Camera in Camera Setup panel
   - Guest appears in assigned position

**Alternative: Browser-based guests**
- Guest opens Broadcast View in their browser
- Their camera accesses their own webcam
