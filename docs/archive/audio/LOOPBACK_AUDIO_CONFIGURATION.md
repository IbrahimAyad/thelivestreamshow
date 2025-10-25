# 🔊 Complete Loopback Audio Configuration for Discord + BetaBot

## Overview: The Full Audio System

You need **4 audio flows** working simultaneously:

1. **Discord hears BetaBot** (BetaBot TTS → BlackHole → Discord Input)
2. **BetaBot hears Discord** (Discord Output → Loopback → Backend → BetaBot AI)
3. **Discord hears You** (Scarlett Solo Mic → Multi-Output → Discord Input)
4. **You hear Everything** (All audio → Scarlett Solo Headphones)

---

## 🎛️ Loopback Audio Setup (Step-by-Step)

### Virtual Device 1: "BetaBot to Discord"

**Purpose:** Routes BetaBot TTS audio to Discord input

**Configuration:**
```
Sources:
  ├─ BlackHole 2ch (Capture from backend audio output)

Outputs/Monitors:
  ├─ Scarlett Solo 4th Gen (so you hear BetaBot)
  └─ Pass-Thru (allows other devices to capture)

Settings:
  └─ Name: "BetaBot to Discord"
```

### Virtual Device 2: "Discord to BetaBot"

**Purpose:** Captures Discord panel voices for BetaBot to hear

**Configuration:**
```
Sources:
  ├─ Discord (Application Audio)
     └─ Capture only Discord voice output

Outputs/Monitors:
  ├─ Scarlett Solo 4th Gen (so you hear Discord panel)
  └─ Pass-Thru to localhost:3001 (backend captures)

Settings:
  └─ Name: "Discord to BetaBot"
```

---

## 🔧 macOS Audio MIDI Setup

### 1. Multi-Output Device Configuration

**Open:** Applications → Utilities → Audio MIDI Setup

**Create "Show Multi-Output":**
```
☑ Scarlett Solo 4th Gen     [Master Device ⭐]
☑ BlackHole 2ch
☑ BetaBot to Discord (Loopback virtual device)

Drift Correction: ☑ All non-master devices
```

**What this does:**
- Your mic audio → goes to ALL three simultaneously
- BetaBot TTS → goes to BlackHole → Discord hears it
- Everything → goes to Scarlett headphones (you hear all)

### 2. Aggregate Device (Optional, for advanced routing)

**Create "Full Show Aggregate":**
```
☑ Scarlett Solo 4th Gen
☑ BlackHole 2ch
☑ Discord to BetaBot (Loopback)

Drift Correction: ☑ All devices
```

---

## 🎮 Discord Audio Settings

**Input Device:** `Show Multi-Output`
- This allows Discord to hear both YOU and BETABOT

**Output Device:** `Discord to BetaBot` (Loopback virtual device)
- This sends Discord panel voices to Loopback for BetaBot to capture

**Voice Processing Settings:**
```
❌ Noise Suppression: OFF
❌ Echo Cancellation: OFF  
❌ Automatic Gain Control: OFF
✅ Voice Activity: ON (adjust sensitivity to -30 to -40 dB)
```

**Why disable processing?**
- BetaBot's TTS is high-quality, doesn't need suppression
- Echo cancellation can cut off BetaBot's voice mid-sentence
- Voice Activity works better for clean panel audio

---

## 🖥️ System Sound Output

**macOS System Preferences → Sound:**

**Output:** `Show Multi-Output`
- All system audio (including backend BetaBot playback) → Discord + You

**Input:** `Scarlett Solo 4th Gen`
- Your physical microphone

---

## 🎯 Backend Server Audio Routing

The backend needs to:
1. **Play BetaBot TTS** through system default (which is Multi-Output → BlackHole → Discord)
2. **Capture Discord panel audio** from Loopback virtual device

### Update backend to use correct device:

**Current issue:** Backend plays through `afplay` (default output) ✅ CORRECT
**Just need to verify:** System output is set to "Show Multi-Output"

### For capturing Discord (future implementation):

```javascript
// backend/audio-manager.js - Add method to capture from Loopback
async captureFromDiscord() {
    // Use macOS CoreAudio to capture from "Discord to BetaBot" Loopback device
    // This will be piped to speech recognition in frontend
    
    const { spawn } = require('child_process');
    
    // Use sox to capture from Loopback device
    const recorder = spawn('rec', [
        '-d', 'Discord to BetaBot',  // Loopback device name
        '-t', 'wav',                 // Output format
        '-r', '16000',               // 16kHz for speech recognition
        '-c', '1',                   // Mono
        '-'                          // Output to stdout
    ]);
    
    return recorder.stdout; // Stream to frontend
}
```

---

## 🔄 Complete Audio Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUDIO ROUTING MAP                            │
└─────────────────────────────────────────────────────────────────────┘

YOUR MICROPHONE (Scarlett Solo Input 1)
    ↓
Scarlett Solo (Hardware)
    ↓
"Show Multi-Output" (macOS MIDI device)
    ├─→ Scarlett Solo Headphones (YOU HEAR YOUR MIC)
    ├─→ BlackHole 2ch (OBS + potential routing)
    └─→ Discord Input (DISCORD PANEL HEARS YOU)


BETABOT TTS (Backend plays via afplay)
    ↓
System Audio Output = "Show Multi-Output"
    ↓
"Show Multi-Output" device sends to:
    ├─→ Scarlett Solo Headphones (YOU HEAR BETABOT)
    ├─→ BlackHole 2ch (OBS captures for stream)
    └─→ BetaBot to Discord (Loopback) 
            ↓
        Pass-Thru to Discord Input
            ↓
        DISCORD PANEL HEARS BETABOT ✅


DISCORD PANEL SPEAKS
    ↓
Discord App Audio Output
    ↓
Discord Output Device = "Discord to BetaBot" (Loopback)
    ↓
Loopback Virtual Device captures Discord audio
    ├─→ Monitor to Scarlett Solo (YOU HEAR DISCORD PANEL)
    └─→ Pass-Thru to Backend (localhost:3001)
            ↓
        Backend streams to Frontend
            ↓
        Speech Recognition processes
            ↓
        BetaBot AI generates response
            ↓
        Backend plays TTS (loops back to "BETABOT TTS" above)
```

---

## 🧪 Testing Each Flow

### Test 1: Discord Hears You
```
1. Open Discord voice channel
2. Speak into Scarlett Solo mic
3. ✅ Panel members should hear you clearly
```

### Test 2: Discord Hears BetaBot
```
1. In BetaBot Control Panel, click "Test TTS"
2. BetaBot speaks: "Hello! I am Beta Bot..."
3. ✅ Panel members should hear BetaBot
4. ✅ You should hear BetaBot in your headphones
```

### Test 3: BetaBot Hears Discord
```
1. Have panel member speak in Discord
2. Check backend logs: should show "Discord audio captured"
3. BetaBot speech recognition should transcribe
4. ✅ BetaBot should respond to the question
```

### Test 4: You Hear Everything
```
1. Speak into mic (hear yourself - Scarlett direct monitoring)
2. Trigger BetaBot TTS (hear BetaBot in headphones)
3. Panel member speaks (hear them in headphones)
4. ✅ All audio present, no echo, no feedback
```

---

## 🚨 Troubleshooting

### Problem: Discord panel hears nothing from BetaBot

**Check:**
- [ ] System Output set to "Show Multi-Output" (System Preferences → Sound)
- [ ] Discord Input set to "Show Multi-Output" (Discord → Voice Settings)
- [ ] BlackHole 2ch is checked in Multi-Output device (Audio MIDI Setup)
- [ ] Backend server is running (should see "🎤 Playing BetaBot TTS..." in logs)

**Fix:**
```bash
# Verify Multi-Output device exists
system_profiler SPAudioDataType | grep -i "multi-output"

# Restart CoreAudio if needed
sudo killall coreaudiod
```

### Problem: BetaBot can't hear Discord panel

**Check:**
- [ ] Discord Output set to "Discord to BetaBot" Loopback device
- [ ] Loopback app shows Discord as source with audio levels
- [ ] Backend has route to capture from Loopback (currently not implemented)

**Fix:** Need to implement Loopback capture in backend (see code example above)

### Problem: Echo or feedback loop

**Causes:**
- Discord Echo Cancellation is ON (turn it OFF)
- Monitoring same device twice
- Loopback routing back to itself

**Fix:**
1. Discord Settings → Voice → Echo Cancellation: OFF
2. In Loopback, don't monitor output back to source
3. Use Pass-Thru instead of Monitor for routing to backend

### Problem: You can't hear Discord panel

**Check:**
- [ ] Loopback "Discord to BetaBot" has Monitor set to Scarlett Solo
- [ ] Scarlett Solo MONITOR MIX knob is turned to the right (playback side)
- [ ] Headphones plugged into Scarlett Solo HEADPHONES jack

**Fix:**
- Adjust Scarlett MONITOR MIX knob fully to the right
- Check Loopback monitor volume slider (should be 0 dB)

---

## 📝 Quick Reference Card

**macOS System Sound Output:** `Show Multi-Output`
**macOS System Sound Input:** `Scarlett Solo 4th Gen`

**Discord Input Device:** `Show Multi-Output`
**Discord Output Device:** `Discord to BetaBot` (Loopback)

**Scarlett Solo Connections:**
- INPUT 1: Your microphone (XLR or 1/4")
- HEADPHONES: Your headphones
- MONITOR MIX: Fully RIGHT (to hear everything)

**Backend Server:** Running on `http://localhost:3001`
**Piper TTS Server:** Running on `http://localhost:8000`

---

## 🎬 Going Live Checklist

- [ ] Scarlett Solo connected, green LED on INPUT 1
- [ ] Headphones plugged in, MONITOR MIX fully right
- [ ] System Output: "Show Multi-Output"
- [ ] Discord Input: "Show Multi-Output"
- [ ] Discord Output: "Discord to BetaBot"
- [ ] Discord voice processing: ALL OFF except Voice Activity
- [ ] Backend running: `node server.js` in `/backend`
- [ ] Piper TTS running: `docker-compose -f docker-compose.piper.yml up -d`
- [ ] Frontend running: `npm run dev`
- [ ] Test 1: Discord panel hears you ✅
- [ ] Test 2: Discord panel hears BetaBot ✅
- [ ] Test 3: BetaBot responds to Discord questions ✅
- [ ] Test 4: You hear all audio in headphones ✅

**Ready to go live! 🚀**
