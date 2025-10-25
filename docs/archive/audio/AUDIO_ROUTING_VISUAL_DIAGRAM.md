# 🎯 Visual Audio Routing Diagram - Your Exact Setup

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  COMPLETE AUDIO ROUTING SYSTEM                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛


┌─────────────────────────────────────────────────────────────────────┐
│                        PHYSICAL HARDWARE                             │
└─────────────────────────────────────────────────────────────────────┘

    🎤 YOUR MICROPHONE                   🎧 YOUR HEADPHONES
           │                                      ▲
           │ (XLR/1/4")                          │
           ↓                                      │
    ┌──────────────────────┐                     │
    │  Scarlett Solo 4th   │                     │
    │       Gen            │─────────────────────┘
    │  ┌────┐  ┌────┐     │   (Headphones Jack)
    │  │IN 1│  │MONI│     │
    │  │GAIN│  │ MIX│     │   ← Turn MONITOR MIX fully RIGHT
    │  └────┘  └────┘     │
    └──────────────────────┘
           │ (USB)
           ↓
    ┌─────────────────┐
    │   Your Mac      │
    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    macOS VIRTUAL AUDIO DEVICES                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ "Multi-Output Device" (Audio MIDI Setup)                             │
│                                                                       │
│  Outputs to:                                                         │
│   ☑ Scarlett Solo 4th Gen [MASTER DEVICE ⭐]                        │
│   ☑ BlackHole 2ch                                                   │
│   ☑ Loopback Audio                                                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ "Loopback Audio" (Rogue Amoeba Loopback App) - DEFAULT OUTPUT       │
│                                                                       │
│  Sources:                                                            │
│   ├─ System Audio (captures BetaBot TTS from backend)               │
│   └─ Discord (captures Discord panel voices)                        │
│                                                                       │
│  Monitors (where audio goes):                                       │
│   ├─ Scarlett Solo 4th Gen  (0 dB) → Your headphones               │
│   └─ BlackHole 2ch          (0 dB) → OBS/Stream                    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ "BlackHole 2ch" (Virtual Audio Cable)                               │
│  Purpose: Routes audio to OBS for streaming                         │
└──────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      FLOW 1: YOU → DISCORD PANEL                     │
└─────────────────────────────────────────────────────────────────────┘

    🎤 You speak into mic
           ↓
    Scarlett Solo INPUT 1
           ↓
    macOS Input: "Scarlett Solo 4th Gen"
           ↓
    Multi-Output Device
           ↓
    Discord Input: "Multi-Output Device"
           ↓
    🗣️ DISCORD PANEL HEARS YOU ✅


┌─────────────────────────────────────────────────────────────────────┐
│              FLOW 2: BETABOT → YOU + DISCORD PANEL                   │
└─────────────────────────────────────────────────────────────────────┘

    🤖 BetaBot generates response
           ↓
    Backend (localhost:3001)
      POST /api/betabot/play-audio
           ↓
    Saves to: temp_betabot_audio.wav
           ↓
    Runs: afplay "temp_betabot_audio.wav"
           ↓
    macOS System Output: "Loopback Audio" 
           ↓
    ┌──────────────────────────────────┐
    │   Loopback App                   │
    │   Source: "System Audio"         │
    │          captures afplay         │
    └──────────────────────────────────┘
           ↓
    ┌─────────────┴─────────────┐
    │                           │
    ↓                           ↓
Loopback Monitor:        Loopback Monitor:
Scarlett Solo            BlackHole 2ch
    ↓                           ↓
🎧 YOU HEAR BETABOT ✅      OBS captures ✅
    
    
    Also routes through:
           ↓
    Multi-Output Device (because Loopback monitors to it)
           ↓
    Discord Input: "Multi-Output Device"
           ↓
    🗣️ DISCORD PANEL HEARS BETABOT ✅


┌─────────────────────────────────────────────────────────────────────┐
│                  FLOW 3: DISCORD PANEL → YOU                         │
└─────────────────────────────────────────────────────────────────────┘

    🗣️ Discord panel member speaks
           ↓
    Discord app receives voice
           ↓
    Discord Output: "Loopback Audio"
           ↓
    ┌──────────────────────────────────┐
    │   Loopback App                   │
    │   Source: "Discord" app          │
    │          captures Discord audio  │
    └──────────────────────────────────┘
           ↓
    Loopback Monitor: Scarlett Solo
           ↓
    🎧 YOU HEAR DISCORD PANEL ✅


┌─────────────────────────────────────────────────────────────────────┐
│         FLOW 4: DISCORD PANEL → BETABOT (Future Feature)            │
└─────────────────────────────────────────────────────────────────────┘

    🗣️ Discord panel asks question
           ↓
    Discord Output: "Loopback Audio"
           ↓
    Loopback captures Discord audio
           ↓
    [TODO] Backend captures from Loopback
           ↓
    Stream to Frontend (WebSocket)
           ↓
    Speech Recognition processes
           ↓
    BetaBot AI generates response
           ↓
    (loops back to FLOW 2 - BetaBot speaks)


┌─────────────────────────────────────────────────────────────────────┐
│                       SETTINGS SUMMARY                               │
└─────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════╗
║  macOS SYSTEM PREFERENCES → SOUND                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  Output: Loopback Audio            ← ALREADY SET ✅               ║
║  Input:  Scarlett Solo 4th Gen                                    ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║  DISCORD → VOICE & VIDEO SETTINGS                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  Input Device:  Multi-Output Device  ← SET THIS                   ║
║  Output Device: Loopback Audio       ← SET THIS                   ║
║                                                                    ║
║  Echo Cancellation:     ❌ OFF                                    ║
║  Noise Suppression:     ❌ OFF                                    ║
║  Noise Reduction:       ❌ OFF                                    ║
║  Automatic Gain:        ❌ OFF                                    ║
║  Voice Activity:        ✅ ON                                     ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║  LOOPBACK APP → "Show Audio" or your virtual device name          ║
╠═══════════════════════════════════════════════════════════════════╣
║  SOURCES TAB:                                                     ║
║    ➕ System Audio (or Node.js)  ← Captures BetaBot TTS          ║
║    ➕ Discord                     ← Captures panel voices         ║
║                                                                    ║
║  MONITORS TAB:                                                    ║
║    ➕ Scarlett Solo 4th Gen  (0 dB)  ← To your headphones        ║
║    ➕ BlackHole 2ch          (0 dB)  ← To OBS                    ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║  AUDIO MIDI SETUP → Multi-Output Device                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  ☑ Scarlett Solo 4th Gen    [MASTER DEVICE ⭐]                   ║
║  ☑ BlackHole 2ch            [Drift Correction ✓]                 ║
║  ☑ Loopback Audio           [Drift Correction ✓]                 ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║  SCARLETT SOLO HARDWARE                                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  GAIN:        Adjust until green LEDs (avoid red clipping)        ║
║  48V:         ON (if condenser mic)                               ║
║  AIR:         ON (optional - adds presence)                       ║
║  MONITOR MIX: Fully RIGHT → ←  ← IMPORTANT!                      ║
║                (Fully right = hear all playback)                  ║
╚═══════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────┐
│                        QUICK TEST                                    │
└─────────────────────────────────────────────────────────────────────┘

Test 1: Speak into mic
  ✅ You hear yourself (Scarlett direct monitoring)
  ✅ Discord panel hears you

Test 2: Click "Test TTS" in BetaBot Control Panel
  ✅ You hear BetaBot in your headphones
  ✅ Discord panel hears BetaBot

Test 3: Ask Discord panel member to speak
  ✅ You hear them in your headphones

All 3 tests pass? → READY TO GO LIVE! 🚀
```
