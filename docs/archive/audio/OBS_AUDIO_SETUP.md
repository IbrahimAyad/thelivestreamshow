# OBS Audio Integration Setup Guide

## Overview

BetaBot now supports capturing audio directly from OBS Studio instead of browser microphone. This is **significantly better for streaming** because:

- ✅ **Isolates microphone from stream audio** - No feedback loops!
- ✅ **More reliable audio capture** - Professional streaming setup
- ✅ **Captures exactly what OBS hears** - Same audio your viewers hear
- ✅ **Works during live streams** - Browser mic can't capture properly during streams

## Prerequisites

### 1. OBS Studio v28 or Higher
**OBS WebSocket 5.0 is built-in** to OBS Studio v28+

- Download from: https://obsproject.com/
- Check your version: Help → About OBS Studio
- If you have an older version, update to v28+

### 2. obs-audio-to-websocket Plugin
This specialized plugin streams audio from OBS sources to WebSocket clients.

**Download:**
- GitHub: https://github.com/bryanveloso/obs-audio-to-websocket
- Or build from source if needed

**Installation:**
1. Download the latest release for your OS
2. Extract the plugin files
3. Copy to OBS plugins directory:
   - **Windows**: `C:\Program Files\obs-studio\obs-plugins\64bit\`
   - **macOS**: `/Library/Application Support/obs-studio/plugins/`
   - **Linux**: `~/.config/obs-studio/plugins/`
4. Restart OBS Studio

## Configuration Steps

### Step 1: Enable OBS WebSocket Server

1. Open OBS Studio
2. Go to **Tools → WebSocket Server Settings**
3. Check **"Enable WebSocket server"**
4. Note the settings:
   - **Server Port**: 4455 (default)
   - **Server Password**: Set a password (recommended for security)
5. Click **OK**

### Step 2: Configure obs-audio-to-websocket Plugin

1. In OBS, go to **Tools → Audio to WebSocket Settings**
2. Configure:
   - **WebSocket Port**: 4456 (different from main OBS WebSocket!)
   - **Audio Source**: Select your microphone/audio input
   - **Sample Rate**: 48000 Hz (recommended)
   - **Channels**: 2 (Stereo)
   - **Bit Depth**: 16-bit
3. Click **Start Server** or enable **"Auto-start with OBS"**
4. Click **OK**

### Step 3: Configure BetaBot Control Panel

1. Open BetaBot Control Panel in your browser
2. Under **Audio Input Source**, select **"OBS Audio"**
3. Fill in OBS WebSocket Connection settings:
   - **Host**: `localhost` (if OBS is on same machine)
   - **WebSocket Port**: `4455` (main OBS WebSocket port)
   - **Password**: Your OBS WebSocket password (if set)
   - **Audio WebSocket Port**: `4456` (obs-audio-to-websocket port)
4. Click **"Connect to OBS"**
5. After connection, select your audio source from dropdown
6. Click **"Start Session"** to begin listening

## Network Configuration

### Running OBS on Same Machine (Default)
- Host: `localhost` or `127.0.0.1`
- No firewall changes needed

### Running OBS on Different Machine
- Host: IP address of OBS machine (e.g., `192.168.1.100`)
- **Firewall**: Open ports 4455 and 4456 on OBS machine
- **Security**: Use strong WebSocket password

## Audio Flow Diagram

```
Microphone
    ↓
OBS Studio (Audio Input Capture)
    ↓
obs-audio-to-websocket Plugin (Port 4456)
    ↓
BetaBot Control Panel (WebSocket Client)
    ↓
Audio Buffer (16-bit PCM)
    ↓
WAV Conversion
    ↓
OpenAI Whisper API (Transcription)
    ↓
Wake Phrase Detection & AI Processing
```

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to OBS"

Solutions:
- Verify OBS Studio is running
- Check Tools → WebSocket Server Settings is enabled
- Confirm port 4455 is not blocked by firewall
- Try connecting without password first (leave password field empty)

**Problem**: "Audio WebSocket connection failed"

Solutions:
- Verify obs-audio-to-websocket plugin is installed
- Check Tools → Audio to WebSocket Settings
- Confirm server is running (click "Start Server")
- Verify port 4456 is not blocked

### Audio Not Captured

**Problem**: No audio chunks received

Solutions:
- Check audio source selection in BetaBot Control Panel dropdown
- Verify audio source is active in OBS (green volume bars)
- Test audio in OBS first (Settings → Audio)
- Check browser console for errors

**Problem**: Audio quality is poor

Solutions:
- Increase sample rate in obs-audio-to-websocket settings (48000 Hz recommended)
- Check OBS audio filters (remove excessive compression/noise gates)
- Ensure microphone gain is appropriate (not too low or too high)

### Session Issues

**Problem**: Session doesn't start with OBS audio

Solutions:
- Verify "Connected to OBS" status shows green
- Confirm audio source is selected in dropdown
- Check browser console for error messages
- Try disconnecting and reconnecting to OBS

## Comparison: Browser Mic vs OBS Audio

| Feature | Browser Microphone | OBS Audio |
|---------|-------------------|-----------|
| **Setup Complexity** | Simple (just allow permissions) | Moderate (plugin + config) |
| **Reliability** | Fair (browser limitations) | Excellent (direct audio stream) |
| **Stream Audio Isolation** | ❌ Captures all system audio | ✅ Only captures selected source |
| **Feedback Loops** | ⚠️ Possible during streams | ✅ Not possible |
| **Audio Quality** | Good | Excellent |
| **Latency** | Low | Low |
| **Best For** | Testing, non-streaming use | **Live streaming** |

## Recommended Workflow

### For Testing/Development:
1. Use **Browser Microphone** mode
2. Quick to set up, no OBS needed
3. Good for development and testing features

### For Live Streaming:
1. **Always use OBS Audio** mode
2. Set up once, works reliably
3. No feedback, professional quality
4. Captures audio as your viewers hear it

## Advanced Tips

### Multiple Audio Sources
- obs-audio-to-websocket supports multiple sources
- Configure different ports for different sources
- Switch sources in BetaBot Control Panel dropdown

### Audio Monitoring
- Enable **"Monitor and Output"** in OBS for your microphone
- This lets you hear yourself AND stream to BetaBot
- Settings → Audio → Advanced → Monitoring Device

### Backup Strategy
- Keep both modes configured
- Start with OBS Audio
- Fall back to Browser Mic if OBS has issues
- Switch modes without restarting session

## Security Considerations

### Password Protection
- Always set a WebSocket password in production
- Use strong passwords (16+ characters)
- Don't share passwords in screenshots/streams

### Network Security
- Only expose OBS WebSocket ports if needed
- Use firewall rules to restrict access
- Consider VPN if accessing remotely

### Local vs Remote
- **Local**: Safest, fastest (localhost)
- **Remote**: Requires network security measures

## Performance Notes

- **Audio Buffer**: 5-second chunks sent to Whisper API
- **Sample Rate**: 48000 Hz recommended (matches streaming standard)
- **Latency**: ~5-6 seconds total (5s buffering + 1s transcription)
- **CPU Usage**: Minimal (OBS handles audio processing)
- **Network**: ~48 KB/s per audio stream (negligible)

## Changelog

### v1.0.0 - Initial Release
- OBS WebSocket 5.0 support
- obs-audio-to-websocket integration
- Real-time audio capture from OBS sources
- Automatic WAV conversion for Whisper API
- Dual-mode support (Browser + OBS)

---

## Need Help?

### Resources
- **OBS WebSocket Docs**: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md
- **obs-audio-to-websocket**: https://github.com/bryanveloso/obs-audio-to-websocket
- **OBS Forums**: https://obsproject.com/forum/

### Common Issues
Check browser console (F12) for detailed error messages and debugging information.

---

**Pro Tip**: Set up OBS Audio mode once, save your settings, and enjoy reliable streaming audio capture! 🎙️✨
