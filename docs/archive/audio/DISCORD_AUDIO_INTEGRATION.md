# 🎙️ Discord Audio Integration - Connect BetaBot to Panel

## What This Does

Connects your **existing BetaBot AI** to Discord so:
- ✅ **Panel hears BetaBot** - TTS audio → Discord voice channel
- ✅ **BetaBot hears Panel** - Discord audio → Speech recognition

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Audio Routing Flow                         │
└─────────────────────────────────────────────────────────────┘

Your Microphone (Scarlett) → Multi-Output → Discord + OBS
                                              ↓
                                     Panel Hears You


BetaBot TTS → Backend API → BlackHole 2ch → Multi-Output
                                              ↓
                                      ┌───────┴────────┐
                                      │                │
                                Discord Input    OBS Audio
                                      │                │
                                      ↓                ↓
                             Panel Hears AI    Stream Hears AI


Discord Panel Voice → Loopback Audio → Backend API → BetaBot
                                                        ↓
                                              Speech Recognition
                                                        ↓
                                                BetaBot Processes
                                                        ↓
                                             (loops back to top)
```

## Integration Steps

### 1. Import the Discord Audio Hook

In `BetaBotControlPanel.tsx`, add:

```typescript
import { useDiscordAudio } from '../hooks/useDiscordAudio';

export function BetaBotControlPanel() {
  // ... existing code ...

  const discordAudio = useDiscordAudio();

  // ...
}
```

### 2. Send BetaBot TTS to Discord

Modify your TTS handler to send audio to Discord:

```typescript
// When BetaBot speaks (after TTS generation):
const handleBetaBotSpeak = async (text: string) => {
  // Your existing TTS code
  const audioBlob = await tts.speak(text);

  // NEW: Send to Discord panel
  try {
    await discordAudio.sendToDiscord(audioBlob);
    console.log('✅ Panel members heard BetaBot');
  } catch (error) {
    console.error('Failed to send to Discord:', error);
    // Fall back to browser audio only
  }

  // Your existing code continues...
};
```

### 3. Receive Discord Audio for BetaBot

Modify your speech recognition to listen to Discord:

```typescript
// When starting to listen for panel questions:
const listenToDiscordPanel = async () => {
  try {
    const discordStream = await discordAudio.startReceiving();

    // Feed this stream to your speech recognition
    // (instead of or in addition to local microphone)
    speechRecognition.start(discordStream);

    console.log('✅ BetaBot is listening to Discord panel');
  } catch (error) {
    console.error('Failed to receive from Discord:', error);
    // Fall back to local mic
  }
};
```

### 4. Show Discord Status in UI

Add Discord connection indicator:

```typescript
<div className="discord-status">
  <div className={`status-indicator ${discordAudio.state.connected ? 'connected' : 'disconnected'}`}>
    Discord {discordAudio.state.connected ? 'Connected' : 'Offline'}
  </div>
  {discordAudio.state.panelMembersCount > 0 && (
    <span>{discordAudio.state.panelMembersCount} panel members</span>
  )}
</div>
```

## Audio Routing Setup (macOS)

### Required Software

```bash
# 1. Install BlackHole (virtual audio device)
brew install blackhole-2ch

# 2. Install Loopback Audio (commercial - $99, trial available)
# Download from: https://rogueamoeba.com/loopback/
```

### Audio MIDI Setup

1. **Open Audio MIDI Setup** (Applications → Utilities)

2. **Create Multi-Output Device:**
   - Click "+" → Create Multi-Output Device
   - Name it: "Discord Multi-Output"
   - Check:
     - ✅ Scarlett Solo
     - ✅ BlackHole 2ch
   - Set Scarlett Solo as "Master Device"

3. **Create Aggregate Device (for Loopback):**
   - Click "+" → Create Aggregate Device
   - Name it: "Loopback + Scarlett"
   - Check:
     - ✅ Loopback Audio
     - ✅ Scarlett Solo

### Discord Settings

**Voice & Video Settings:**
- **Input Device:** Discord Multi-Output
- **Output Device:** Loopback Audio

**Voice Processing:**
- ❌ Noise Suppression: OFF
- ❌ Echo Cancellation: OFF
- ❌ Automatic Gain Control: OFF
- ✅ Voice Activity: ON

### Loopback Audio Configuration

**Create a Virtual Device:**

1. **Source 1: Discord App**
   - Capture audio from Discord application
   - This captures panel member voices

2. **Monitors:**
   - Add "Scarlett Solo" for headphone monitoring
   - Add "Backend API" for BetaBot capture

3. **Name:** "Discord Panel Capture"

## Testing

### Test 1: Panel Hears BetaBot

```typescript
// In browser console:
const audioTest = await fetch('http://localhost:3001/api/discord/send-audio', {
  method: 'POST',
  body: formData // Your test audio
});

// Panel members in Discord should hear it
```

### Test 2: BetaBot Hears Panel

```typescript
// Start receiving
const stream = await discordAudio.startReceiving();

// Check if audio is coming through
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaStreamSource(stream);
source.connect(analyser);

// Monitor levels (should show activity when panel speaks)
```

## Troubleshooting

### Panel Can't Hear BetaBot

**Check:**
1. Discord Input is set to "Discord Multi-Output"
2. BlackHole is checked in Multi-Output device
3. Backend server is running: `http://localhost:3001/api/health`
4. BetaBot TTS is calling `sendToDiscord()`

**Debug:**
```bash
# Check if audio is reaching BlackHole
system_profiler SPAudioDataType | grep -i blackhole

# Monitor backend logs
cd ~/thelivestreamshow/backend
tail -f server.log
```

### BetaBot Can't Hear Panel

**Check:**
1. Discord Output is set to "Loopback Audio"
2. Loopback is capturing Discord app audio
3. Backend can access Loopback device
4. Speech recognition is using Discord stream

**Debug:**
```bash
# List audio devices
system_profiler SPAudioDataType

# Check Loopback routing
# (Open Loopback app → verify Discord is source)
```

### Audio Feedback/Echo

**Solution:**
1. Ensure different devices for input/output
2. Disable Echo Cancellation in Discord (it interferes)
3. Don't monitor Loopback in OBS (set to "Monitor Off")
4. Keep physical mic separate from virtual routing

## Production Checklist

Before going live:

- [ ] Scarlett Solo connected and detected
- [ ] BlackHole 2ch installed
- [ ] Loopback Audio configured
- [ ] Multi-Output device created
- [ ] Discord audio settings configured
- [ ] Backend server running (`npm start` in /backend)
- [ ] BetaBot integrated with `useDiscordAudio`
- [ ] Test: Panel can hear BetaBot TTS
- [ ] Test: BetaBot can hear panel questions
- [ ] Test: No audio feedback loops
- [ ] OBS capturing correct audio sources

## API Reference

### useDiscordAudio Hook

```typescript
const {
  state,              // Connection status
  sendToDiscord,      // Send TTS to panel
  startReceiving,     // Get panel audio
  stopReceiving,      // Stop listening
  checkConnection     // Verify backend
} = useDiscordAudio();
```

### Backend Endpoints

**Send Audio to Discord:**
```
POST http://localhost:3001/api/discord/send-audio
Body: FormData with 'audio' blob
```

**Receive Audio from Discord:**
```
GET http://localhost:3001/api/discord/receive-audio
Returns: { streamUrl: string }
```

**Health Check:**
```
GET http://localhost:3001/api/health
Returns: { status, scarlett, obs, uptime }
```

## Example Integration

See `/examples/BetaBotWithDiscord.tsx` for complete example of:
- BetaBot conversation with Discord audio
- Automatic routing of TTS to panel
- Speech recognition from panel questions
- Fallback to browser audio if Discord unavailable

---

## ✅ Integration Status

**Backend:** ✅ Running on port 3001 (audio routing only)
**Frontend Hook:** ✅ `useDiscordAudio` created and integrated
**UI Integration:** ✅ Discord panel added to BetaBotControlPanel
**Scarlett Panel:** ✅ ScarlettAudioPanel component integrated

### What's Working:
- Backend server with Discord audio endpoints
- WebSocket connection for real-time audio levels
- Discord connection status indicator in UI
- Scarlett Solo hardware monitoring and LED meter
- UI controls for Discord panel listening

### Next Steps:
1. **Setup macOS Audio Routing** (see below)
2. **Configure Discord Audio Settings** (see Discord Settings section)
3. **Test bidirectional audio flow**

## 🎯 How It Works Now

### In Your Dashboard:

**BetaBot Control Panel** now has a Discord section showing:
- Backend connection status (connected/offline)
- Panel member count
- "Listen to Panel" button (enables Discord audio input)
- Setup guide (expandable)

**Scarlett Audio Panel** shows:
- Scarlett Solo connection status
- Real-time LED meter (matches hardware)
- Gain recommendations
- Audio routing status

### Behind the Scenes:

```
Your BetaBot TTS (browser/F5-TTS)
    ↓
Browser Audio Output → BlackHole 2ch (set at macOS level)
    ↓
Multi-Output Device
    ↓
┌───────────┴────────────┐
│                        │
Discord Input        OBS Audio
│                        │
Panel Hears BetaBot   Stream Hears BetaBot


Discord Panel Speaks
    ↓
Discord Audio Output → Loopback Audio
    ↓
Backend captures → Frontend receives
    ↓
BetaBot Speech Recognition processes
    ↓
BetaBot responds (loops back to top)
```

---

**Status:** ✅ Integration COMPLETE - Ready for macOS audio routing setup
**Next:** Configure BlackHole + Loopback devices and test audio flow
