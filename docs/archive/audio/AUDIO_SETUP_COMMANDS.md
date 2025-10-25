# 🎯 Quick Audio Setup - Command Reference

## 🚀 Complete Automated Setup (Run This First!)

```bash
bash run-complete-audio-setup.sh
```

This master script runs all steps in sequence with guidance.

---

## 📋 Individual Scripts (Run Separately)

### 1. System Audio Configuration (Fully Automated)
```bash
bash setup-audio-routing.sh
```
**What it does:**
- ✅ Sets system output to "Loopback Audio"
- ✅ Sets system input to "Scarlett Solo 4th Gen"
- ✅ Verifies all required devices exist

### 2. Discord Configuration Helper
```bash
bash setup-discord-audio.sh
```
**What it does:**
- Opens Discord app
- Opens Discord settings (Cmd+,)
- Provides step-by-step instructions
- Shows required device settings

### 3. Test Audio Routing
```bash
bash test-audio-routing.sh
```
**What it does:**
- ✅ Checks backend server (port 3001)
- ✅ Checks Piper TTS (port 8000)
- ✅ Verifies audio devices
- ✅ Plays test audio through system
- 📋 Provides manual test checklist

---

## 🔧 Quick Commands

### Check Current Audio Devices
```bash
SwitchAudioSource -c -t output   # Current output
SwitchAudioSource -c -t input    # Current input
SwitchAudioSource -a -t output   # List all outputs
```

### Set Audio Devices Manually
```bash
SwitchAudioSource -s "Loopback Audio" -t output
SwitchAudioSource -s "Scarlett Solo 4th Gen" -t input
```

### Check Service Status
```bash
# Backend health
curl http://localhost:3001/api/health | python3 -m json.tool

# Piper TTS health
curl http://localhost:8000/health

# Docker containers
docker ps | grep piper
```

### Start Services
```bash
# Backend (Terminal 1)
cd backend && node server.js

# Piper TTS (Terminal 2)
docker-compose -f docker-compose.piper.yml up -d

# Frontend (Terminal 3)
npm run dev
```

---

## 🎮 Manual Steps Required

### Discord Settings (User Settings → Voice & Video)
```
INPUT DEVICE:  Multi-Output Device
OUTPUT DEVICE: Loopback Audio

VOICE PROCESSING:
  ❌ Echo Cancellation: OFF
  ❌ Noise Suppression: OFF
  ❌ Noise Reduction: OFF
  ❌ Automatic Gain Control: OFF
  ✅ Voice Activity: ON
```

### Loopback App Configuration
```
SOURCES:
  [+] System Audio (or Node.js)
  [+] Discord

MONITORS:
  [+] Scarlett Solo 4th Gen (0 dB)
  [+] BlackHole 2ch (0 dB)
```

### Audio MIDI Setup
```
Multi-Output Device:
  ☑ Scarlett Solo 4th Gen [Master]
  ☑ BlackHole 2ch
  ☑ Loopback Audio
```

---

## 🧪 Testing Commands

### Test BetaBot TTS
```bash
# Generate test audio
curl -X POST http://localhost:8000/generate-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing audio routing", "voice": "danny-low"}' \
  --output test.wav

# Play through system (should route to Loopback → Discord + Headphones)
afplay test.wav
```

### Test Backend Audio Endpoint
```bash
# Send audio to backend (same as BetaBot does)
curl -X POST http://localhost:3001/api/betabot/play-audio \
  -H "Content-Type: application/octet-stream" \
  --data-binary @test.wav
```

---

## 🚨 Troubleshooting

### Reset Audio Devices
```bash
# Kill CoreAudio daemon (macOS will restart it)
sudo killall coreaudiod

# Wait 3 seconds, then re-run setup
sleep 3
bash setup-audio-routing.sh
```

### Check Audio Device Info
```bash
# Detailed device information
system_profiler SPAudioDataType

# Check specific device
system_profiler SPAudioDataType | grep -A 10 "Loopback Audio"
```

### Verify Loopback is Default
```bash
defaults read com.apple.systemsound "com.apple.sound.beep.sound"
SwitchAudioSource -c
```

---

## 📚 Documentation Files

- `AUDIO_SETUP_CHECKLIST.md` - Printable checklist
- `YOUR_EXACT_LOOPBACK_SETUP.md` - Detailed configuration
- `AUDIO_ROUTING_VISUAL_DIAGRAM.md` - Visual flowcharts
- `LOOPBACK_AUDIO_CONFIGURATION.md` - Complete reference

---

## 🎬 Pre-Show Quick Check

```bash
# Run all checks in one command
echo "System Output: $(SwitchAudioSource -c -t output)" && \
echo "System Input: $(SwitchAudioSource -c -t input)" && \
curl -s http://localhost:3001/api/health | python3 -m json.tool && \
curl -s http://localhost:8000/health
```

Expected output:
```
System Output: Loopback Audio
System Input: Scarlett Solo 4th Gen
{
  "status": "healthy",
  "scarlett": true,
  ...
}
{
  "status": "healthy",
  "voices": {...}
}
```

All showing healthy? **You're ready! 🚀**
