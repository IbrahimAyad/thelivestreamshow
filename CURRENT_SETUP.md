# 📖 CURRENT SETUP - The Single Source of Truth

> **Last Updated:** 2025-01-22 8:00 PM EST  
> **Version:** 4.0.0  
> **Status:** ✅ STABLE (Season 4 Ready)

**⚠️ THIS IS THE ONLY SETUP GUIDE - All other setup docs are archived!**

---

## 🎯 Quick Start (5 Minutes)

### Prerequisites Check:
```bash
# Run this first!
bash scripts/pre-show-check.sh
```

If all green ✅ → Skip to "Going Live Checklist"  
If any red ❌ → Follow relevant section below

---

## 🚀 Complete Setup from Scratch

### Step 1: Start Required Services (2 min)

#### Terminal 1 - Backend:
```bash
cd /Users/ibrahim/Desktop/thelivestreamshow/backend
node server.js
# Wait for: "🎙️ BetaBot Server Running"
# Wait for: "Scarlett Solo connected"
```

#### Terminal 2 - Piper TTS:
```bash
cd /Users/ibrahim/Desktop/thelivestreamshow
docker-compose -f docker-compose.piper.yml up -d
# Wait for: Container "piper-tts-server" started
```

#### Terminal 3 - Frontend:
```bash
cd /Users/ibrahim/Desktop/thelivestreamshow
npm run dev
# Wait for: "Local: http://localhost:5173"
```

**Verify:**
```bash
curl http://localhost:3001/api/health  # Should return: {"status":"healthy"}
curl http://localhost:8000/health       # Should return: {"status":"healthy"}
```

---

### Step 2: Configure Audio Routing (2 min)

#### 2.1 Set System Audio Devices:
```bash
bash scripts/setup-audio-routing.sh
```

**This sets:**
- System Output → Loopback Audio
- System Input → Scarlett Solo 4th Gen

**Verify:**
```bash
SwitchAudioSource -c -t output  # Should show: Loopback Audio
SwitchAudioSource -c -t input   # Should show: Scarlett Solo 4th Gen
```

#### 2.2 Configure Loopback App:

**Open Loopback:**
```bash
open -a Loopback
```

**SOURCES Tab (what to capture):**
```
[+] Add:
  1. Scarlett Solo 4th Gen  ← Your microphone
  2. System Audio           ← BetaBot + browser audio  
  3. Discord                ← Discord panel voices
```

**MONITORS Tab (where audio goes):**
```
[+] Add:
  1. External Headphones    ← YOU hear everything
     Volume: 0 dB
  2. BlackHole 2ch          ← OBS captures for stream
     Volume: 0 dB
```

**CRITICAL:** The monitor to your headphones is what lets you hear audio!

#### 2.3 Configure Discord:

**Discord → Settings (Cmd+,) → Voice & Video:**
```
INPUT DEVICE:  Loopback Audio  ✅
OUTPUT DEVICE: Loopback Audio  ✅
```

**Voice Processing (scroll down, turn ALL OFF):**
```
❌ Echo Cancellation: OFF
❌ Noise Suppression: OFF
❌ Noise Reduction: OFF
❌ Automatic Gain Control: OFF
✅ Voice Activity: ON
```

---

### Step 3: Test Everything (1 min)

Run automated tests:
```bash
bash scripts/test-audio-routing.sh
```

**Manual Tests:**

1. **Test: You hear yourself**
   - Speak into Scarlett Solo mic
   - ✅ You should hear yourself in headphones

2. **Test: You hear BetaBot**
   - Dashboard → BetaBot Control Panel → "Test TTS"
   - ✅ You should hear BetaBot speak

3. **Test: Discord hears you**
   - Join Discord voice channel
   - Speak into mic
   - ✅ Panel members hear you

4. **Test: Discord hears BetaBot**
   - Click "Test TTS" again
   - ✅ Panel members hear BetaBot

5. **Test: You hear Discord**
   - Ask panel member to speak
   - ✅ You hear them in headphones

**All 5 tests pass? → You're ready! 🚀**

---

## 📊 System Architecture

### Audio Flow Diagram:
```
YOUR MIC
    ↓
Scarlett Solo Hardware
    ↓
Loopback Source #1
    ↓
Combined with:
  ├─ System Audio (BetaBot TTS)
  └─ Discord (Panel voices)
    ↓
Loopback Monitor → Your Headphones (YOU HEAR)
Loopback Monitor → BlackHole 2ch (OBS CAPTURES)
    ↓
Discord Input: "Loopback Audio"
    ↓
DISCORD PANEL HEARS: You + BetaBot ✅
```

### Service Dependencies:
```
Frontend (5173)
    ↓
Backend (3001) ← BetaBot Audio Playback
    ↓
Piper TTS (8000) ← Voice Synthesis
    ↓
System Audio → Loopback Audio
    ↓
Discord + Your Headphones
```

---

## 🎬 Going Live Checklist

**Run before every show:**
```bash
bash scripts/pre-show-check.sh
```

**Manual Checklist:**
- [ ] Backend running (port 3001)
- [ ] Piper TTS running (port 8000)
- [ ] Frontend running (port 5173)
- [ ] System output = Loopback Audio
- [ ] Loopback sources configured
- [ ] Loopback monitors configured
- [ ] Discord settings correct
- [ ] All 5 audio tests pass
- [ ] Scarlett Solo connected
- [ ] Headphones plugged in
- [ ] Discord voice channel joined

**All checked? → GO LIVE! 🎉**

---

## 🚨 Troubleshooting

### "Backend won't start"
```bash
# Check if port is already in use
lsof -i :3001
# Kill existing process
pkill -f "node server.js"
# Restart
cd backend && node server.js
```

### "Piper TTS won't start"
```bash
# Check Docker is running
docker ps
# If not, start Docker Desktop
open -a Docker
# Wait 30 seconds, then:
docker-compose -f docker-compose.piper.yml up -d
```

### "Can't hear anything"
1. Check Loopback MONITORS has your headphones device
2. Check monitor volume is 0 dB (not muted)
3. Check macOS volume is not muted
4. Check headphones physically plugged in

### "Discord can't hear me"
1. Discord INPUT must be "Loopback Audio"
2. Loopback SOURCES must have "Scarlett Solo 4th Gen"
3. Speak - you should see green bars in Loopback

### "Discord can't hear BetaBot"
1. System Output must be "Loopback Audio"
2. Loopback SOURCES must have "System Audio"
3. Backend must be running (port 3001)
4. Test TTS - you should see green bars in Loopback

### "I can't hear Discord panel"
1. Discord OUTPUT must be "Loopback Audio"
2. Loopback SOURCES must have "Discord" application
3. Loopback MONITORS must have your headphones
4. Panel speaks - you should see green bars

---

## 📁 Configuration Reference

**Master Config:** `config/system-config.json`
**Latest Snapshot:** `config/snapshots/2025-01-22-working.json`

### Current Audio Configuration:
```json
{
  "systemOutput": "Loopback Audio",
  "systemInput": "Scarlett Solo 4th Gen",
  "discordInput": "Loopback Audio",
  "discordOutput": "Loopback Audio"
}
```

### Service Endpoints:
```
Backend Health:    http://localhost:3001/api/health
Piper TTS Health:  http://localhost:8000/health
Frontend:          http://localhost:5173
WebSocket:         ws://localhost:3001
```

---

## 🔄 Restore from Snapshot

If something breaks:
```bash
# Restore last known good configuration
bash scripts/restore-config.sh

# Re-run setup
bash scripts/setup-audio-routing.sh

# Verify
bash scripts/pre-show-check.sh
```

---

## 📚 Additional Documentation

**For detailed information, see:**
- `PROJECT_STABILITY_PLAN.md` - Long-term stability strategy
- `TROUBLESHOOTING_MASTER.md` - Comprehensive troubleshooting
- `ARCHITECTURE.md` - Technical architecture details
- `CHANGELOG.md` - Recent changes and fixes

**Archived Documentation:**
- `docs/archive/` - Old setup guides (reference only)
- `docs/sessions/` - Development session notes

---

## ⚡ Emergency Recovery

**If everything is broken:**
```bash
# 1. Stop all services
pkill -f "node server.js"
docker-compose -f docker-compose.piper.yml down
# Kill frontend dev server (Ctrl+C in terminal)

# 2. Restore configuration
bash scripts/restore-config.sh

# 3. Restart services (wait 10 seconds between each)
cd backend && node server.js &
sleep 10
docker-compose -f docker-compose.piper.yml up -d
sleep 10
npm run dev

# 4. Verify
bash scripts/pre-show-check.sh
```

---

**Last Verified:** 2025-01-22 8:00 PM EST  
**Next Review:** Before Season 4 Episode 2  
**Maintained By:** AI Assistant + Ibrahim

**Status:** ✅ PRODUCTION READY
