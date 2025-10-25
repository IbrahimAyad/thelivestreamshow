# ✅ AUDIO SETUP CHECKLIST - Season 4 Premiere Tonight!

## 🔴 BEFORE SHOW - Configure These Settings

### 1. Open Loopback App
```
Device Name: "Show Audio" (or whatever you named it)

SOURCES TAB:
  ☐ Add "System Audio" (or "Node.js") 
  ☐ Add "Discord" application

MONITORS TAB:
  ☐ Add "Scarlett Solo 4th Gen" - volume: 0 dB
  ☐ Add "BlackHole 2ch" - volume: 0 dB
```

### 2. macOS System Sound Settings
```
System Preferences → Sound

OUTPUT:
  ☐ Select "Loopback Audio" (should already be selected ✓)
  
INPUT:
  ☐ Select "Scarlett Solo 4th Gen"
```

### 3. Discord Voice Settings
```
User Settings → Voice & Video

INPUT DEVICE:
  ☐ Select "Multi-Output Device"
  
OUTPUT DEVICE:
  ☐ Select "Loopback Audio"
  
VOICE PROCESSING (turn ALL off):
  ☐ Echo Cancellation: OFF ❌
  ☐ Noise Suppression: OFF ❌
  ☐ Noise Reduction: OFF ❌
  ☐ Automatic Gain Control: OFF ❌
  ☐ Voice Activity: ON ✅
```

### 4. Audio MIDI Setup
```
Applications → Utilities → Audio MIDI Setup

Multi-Output Device:
  ☐ Check: Scarlett Solo 4th Gen [Master ⭐]
  ☐ Check: BlackHole 2ch [Drift Correction ✓]
  ☐ Check: Loopback Audio [Drift Correction ✓]
```

### 5. Scarlett Solo Hardware
```
Physical Controls:

  ☐ GAIN knob: Adjusted for green LEDs (not red)
  ☐ 48V button: ON (if using condenser mic)
  ☐ AIR button: ON (optional, adds clarity)
  ☐ MONITOR MIX knob: FULLY RIGHT → ← **CRITICAL**
  ☐ Headphones plugged into HEADPHONES jack
  ☐ Microphone plugged into INPUT 1
```

---

## 🟢 SERVICES TO START

### Backend Server
```
Terminal 1:
  ☐ cd /Users/ibrahim/Desktop/thelivestreamshow/backend
  ☐ node server.js
  ☐ Verify: "🎙️ BetaBot Server Running" appears
  ☐ Verify: "Scarlett Solo detected" appears
```

### Piper TTS Docker
```
Terminal 2:
  ☐ cd /Users/ibrahim/Desktop/thelivestreamshow
  ☐ docker-compose -f docker-compose.piper.yml up -d
  ☐ Verify: "piper-tts-server" container running
```

### Frontend Dashboard
```
Terminal 3:
  ☐ cd /Users/ibrahim/Desktop/thelivestreamshow
  ☐ npm run dev
  ☐ Verify: Opens http://localhost:5173
```

---

## 🧪 AUDIO TESTS (Do in order)

### Test 1: You Hear Yourself
```
  ☐ Speak into microphone
  ☐ Hear yourself in headphones (Scarlett direct monitoring)
  ☐ Audio meter should show green LEDs on Scarlett
```

### Test 2: Discord Panel Hears You
```
  ☐ Join Discord voice channel with panel
  ☐ Speak into microphone
  ☐ Ask: "Can you hear me clearly?"
  ☐ Panel responds: YES ✅
```

### Test 3: You Hear BetaBot
```
  ☐ In dashboard, go to BetaBot Control Panel
  ☐ Click "Test TTS" button
  ☐ Hear BetaBot say: "Hello! I am Beta Bot..."
  ☐ Sound is clear in your headphones ✅
```

### Test 4: Discord Panel Hears BetaBot
```
  ☐ Click "Test TTS" again
  ☐ Ask panel: "Did you hear BetaBot?"
  ☐ Panel responds: YES ✅
```

### Test 5: You Hear Discord Panel
```
  ☐ Ask panel member to speak
  ☐ Hear them clearly in your headphones ✅
```

### Test 6: BetaBot Responds to Panel (Future)
```
  ☐ Panel asks BetaBot a question
  ☐ BetaBot speech recognition captures it
  ☐ BetaBot generates and speaks response
  ☐ Panel hears the response ✅
```

---

## 🚨 TROUBLESHOOTING

### Problem: Can't hear anything in headphones
```
FIX:
  ☐ Scarlett MONITOR MIX knob → Turn fully RIGHT
  ☐ Loopback → Monitors → Check Scarlett volume is 0 dB
  ☐ System volume → Check it's at 50%+
```

### Problem: Discord can't hear you
```
FIX:
  ☐ Discord Input → Must be "Multi-Output Device"
  ☐ Audio MIDI Setup → Multi-Output has Scarlett checked
  ☐ Scarlett GAIN knob → Turn up slightly
```

### Problem: Discord can't hear BetaBot
```
FIX:
  ☐ System Output → Must be "Loopback Audio"
  ☐ Loopback Sources → Check "System Audio" is added
  ☐ Discord Input → Must be "Multi-Output Device"
  ☐ Backend server must be running (port 3001)
```

### Problem: Can't hear Discord panel
```
FIX:
  ☐ Discord Output → Must be "Loopback Audio"
  ☐ Loopback Sources → Check "Discord" app is added
  ☐ Loopback Monitors → Check Scarlett Solo is added
  ☐ Scarlett MONITOR MIX → Fully RIGHT
```

### Problem: Audio sounds distorted
```
FIX:
  ☐ All devices use 48000 Hz sample rate
  ☐ Loopback output sample rate: 48000 Hz
  ☐ Scarlett sample rate: 48000 Hz (check in Audio MIDI)
  ☐ Lower Loopback monitor volumes to -6 dB
```

---

## 📞 QUICK REFERENCE

**System Output:** Loopback Audio ✅ (already set)
**System Input:** Scarlett Solo 4th Gen

**Discord Input:** Multi-Output Device
**Discord Output:** Loopback Audio

**Scarlett MONITOR MIX:** Fully RIGHT (critical!)

**Backend:** http://localhost:3001
**Piper TTS:** http://localhost:8000
**Dashboard:** http://localhost:5173

---

## 🎬 GO LIVE FINAL CHECK

```
☐ All audio tests passed
☐ Backend server running (green checkmark in dashboard)
☐ Piper TTS running (voices loaded)
☐ OBS scene configured
☐ Discord panel members present
☐ Show segments loaded in dashboard
☐ Timer set for Season 4 Premiere (8 PM - 11 PM)
☐ Graphics ready (LIVE, BRB, etc.)
☐ BetaBot ready to co-host

ALL CHECKED? → YOU'RE READY! 🚀🎉
```

---

**Print this checklist and keep it next to your setup!**
