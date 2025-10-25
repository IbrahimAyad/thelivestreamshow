# 🎯 YOUR EXACT Loopback Configuration

## Current System Status
✅ **Default Output:** Loopback Audio (Perfect!)
✅ **Available Devices:** Scarlett Solo 4th Gen, BlackHole 2ch, Multi-Output Device

---

## 🎛️ Loopback App Configuration (Open Loopback Now)

### Virtual Device 1: "Show Audio" (Your Main Output)

**This is what's currently set as system default output - configure it like this:**

**Sources Tab:**
```
Add Sources:
  1. ➕ "Backend Node.js" (or "System Audio")
     └─ This captures BetaBot TTS when backend plays via afplay
  
  2. ➕ "Discord" (Application Audio)
     └─ Select Discord app
     └─ This captures Discord panel voices
```

**Monitors Tab:**
```
Add Monitors:
  1. ➕ Scarlett Solo 4th Gen
     └─ Volume: 0 dB (full)
     └─ This sends everything to YOUR HEADPHONES
     
  2. ➕ BlackHole 2ch
     └─ Volume: 0 dB
     └─ This sends everything to OBS/other apps if needed
```

**Channels Tab:**
```
Name: "Show Audio"
Output Channels: 2 (Stereo)
```

**What this does:**
- ✅ BetaBot TTS (from backend) → You hear it + Goes to BlackHole
- ✅ Discord panel voices → You hear them + Available for capture
- ✅ Everything mixed together → Your headphones

---

## 🔧 macOS Audio MIDI Setup

### Open: Applications → Utilities → Audio MIDI Setup

### Configure "Multi-Output Device":

**Click Multi-Output Device in left sidebar, then:**

```
☑ Scarlett Solo 4th Gen
☑ BlackHole 2ch  
☑ Loopback Audio

Master Device: ⭐ Scarlett Solo 4th Gen
Drift Correction: ☑ BlackHole 2ch, ☑ Loopback Audio
```

**What this does:**
- Your Scarlett microphone input → Sent to all 3 outputs simultaneously
- Ensures Discord hears your mic + BetaBot can capture it if needed

---

## 🎮 Discord Settings (Open Discord Now)

### Voice & Video Settings:

**Input Device:**
```
Select: "Multi-Output Device"
```
This allows Discord to hear:
- ✅ Your microphone (Scarlett)
- ✅ BetaBot TTS (routed through Multi-Output)

**Output Device:**
```
Select: "Loopback Audio"
```
This sends Discord panel audio to Loopback, which then:
- ✅ Sends to your headphones (via Scarlett monitor)
- ✅ Available for BetaBot to capture (future feature)

**Input Sensitivity:**
```
Toggle OFF "Automatically determine input sensitivity"
Drag slider to: -40 dB (adjust based on your mic gain)
```

**Advanced Settings - TURN OFF:**
```
❌ Echo Cancellation: OFF
❌ Noise Suppression: OFF
❌ Noise Reduction: OFF
❌ Automatic Gain Control: OFF
✅ Voice Activity: ON
```

**Why OFF?**
- Echo cancellation will cut off BetaBot mid-sentence
- Noise suppression will mute BetaBot's TTS
- AGC will make levels inconsistent
- Voice Activity alone is sufficient for clean audio

---

## 🖥️ macOS System Settings

### System Preferences → Sound

**Output Tab:**
```
Select: "Loopback Audio" (should already be selected ✓)
Output Volume: 75-100%
```

**Input Tab:**
```
Select: "Scarlett Solo 4th Gen"
Input Volume: Adjust based on GAIN knob position
```

---

## 🔄 How Audio Flows

```
═══════════════════════════════════════════════════════════
                    YOUR MICROPHONE
═══════════════════════════════════════════════════════════
Scarlett Solo INPUT 1 (Your mic plugged in)
    ↓
Scarlett Solo (Hardware processing)
    ↓
macOS Input Device: "Scarlett Solo 4th Gen"
    ↓
Discord Input: "Multi-Output Device"
    ↓
Discord Panel HEARS YOU ✅


═══════════════════════════════════════════════════════════
                BETABOT SPEAKS (TTS)
═══════════════════════════════════════════════════════════
Backend server.js runs: afplay "temp_betabot_audio.wav"
    ↓
macOS System Output: "Loopback Audio"
    ↓
Loopback captures "System Audio" source
    ↓
Loopback monitors to:
    ├─ Scarlett Solo → YOUR HEADPHONES (you hear BetaBot) ✅
    └─ BlackHole 2ch → OBS captures for stream ✅
    
Also routed through:
    ↓
Multi-Output Device (because Loopback is monitored there)
    ↓
Discord Input hears "Multi-Output Device"
    ↓
Discord Panel HEARS BETABOT ✅


═══════════════════════════════════════════════════════════
              DISCORD PANEL SPEAKS
═══════════════════════════════════════════════════════════
Discord panel member talks
    ↓
Discord app receives voice
    ↓
Discord Output: "Loopback Audio"
    ↓
Loopback captures "Discord" application audio
    ↓
Loopback monitors to:
    └─ Scarlett Solo → YOUR HEADPHONES (you hear panel) ✅

Future: Backend captures from Loopback for BetaBot AI
    ↓
BetaBot Speech Recognition processes
    ↓
BetaBot responds (loops back to "BETABOT SPEAKS")
```

---

## ✅ Testing Steps (Do This Now)

### Test 1: You Hear Everything
```
1. Put on headphones (plugged into Scarlett Solo HEADPHONES jack)
2. Speak into mic → You should hear yourself (Scarlett direct monitoring)
3. Play system sound (any video/music) → You should hear it
4. ✅ Confirmed: Loopback → Scarlett monitoring works
```

### Test 2: Discord Hears You
```
1. Join Discord voice channel
2. Speak into Scarlett mic
3. Ask panel member: "Can you hear me?"
4. ✅ Confirmed: Scarlett → Multi-Output → Discord works
```

### Test 3: Discord Hears BetaBot
```
1. In dashboard, go to BetaBot Control Panel
2. Click "Test TTS" button
3. BetaBot should speak
4. Ask panel member: "Did you hear BetaBot?"
5. ✅ Confirmed: Backend → Loopback → Multi-Output → Discord works
```

### Test 4: You Hear Discord Panel
```
1. Ask panel member to speak
2. You should hear them clearly in your headphones
3. ✅ Confirmed: Discord Output → Loopback → Scarlett monitoring works
```

---

## 🚨 If Something Doesn't Work

### Problem: Discord panel can't hear BetaBot

**Diagnosis:**
```bash
# Run this while BetaBot is speaking:
system_profiler SPAudioDataType | grep "Default Output"
# Should show: "Loopback Audio"
```

**Fix:**
1. Open Loopback app
2. Verify "System Audio" or "Node.js" is added as source
3. Check that Discord Input is set to "Multi-Output Device"
4. Restart Discord app

### Problem: You can't hear Discord panel

**Fix:**
1. Open Loopback app
2. Verify "Discord" application is added as source
3. Check Monitors tab → Scarlett Solo 4th Gen is added
4. Check monitor volume slider (should be 0 dB or higher)
5. Scarlett MONITOR MIX knob → Turn fully to RIGHT

### Problem: You can't hear BetaBot

**Fix:**
1. Check Scarlett MONITOR MIX knob → Fully RIGHT
2. Loopback → Monitors → Scarlett Solo volume should be 0 dB
3. System volume should be 50%+ (System Preferences → Sound)

### Problem: Audio sounds weird/distorted

**Fix:**
1. All devices should use 48000 Hz sample rate
2. Check Loopback → Output → Sample Rate: 48000 Hz
3. Check Discord → Voice → Audio Subsystem: Standard (not Legacy)

---

## 📱 Quick Reference

**When opening Loopback app, you should see:**
- Sources: System Audio (or Node.js) + Discord
- Monitors: Scarlett Solo 4th Gen + BlackHole 2ch
- Both monitor volumes: 0 dB

**Discord Voice Settings:**
- Input: Multi-Output Device
- Output: Loopback Audio
- All processing: OFF (except Voice Activity)

**macOS Sound Settings:**
- Output: Loopback Audio
- Input: Scarlett Solo 4th Gen

**Scarlett Solo Hardware:**
- GAIN: Adjusted so green LEDs light up (not red)
- 48V: ON (if using condenser mic)
- AIR: ON (optional, adds presence)
- MONITOR MIX: Fully RIGHT (to hear playback)

---

## 🎬 Pre-Show Checklist

- [ ] Loopback app open with proper configuration
- [ ] System Output: Loopback Audio ✅ (already set)
- [ ] Discord Input: Multi-Output Device
- [ ] Discord Output: Loopback Audio
- [ ] All Discord voice processing OFF
- [ ] Backend server running (port 3001)
- [ ] Piper TTS Docker running (port 8000)
- [ ] Scarlett MONITOR MIX knob fully RIGHT
- [ ] Headphones plugged into Scarlett HEADPHONES jack
- [ ] Test: Discord hears you ✅
- [ ] Test: Discord hears BetaBot ✅  
- [ ] Test: You hear Discord panel ✅
- [ ] Test: You hear BetaBot ✅

**System is READY! 🚀**
