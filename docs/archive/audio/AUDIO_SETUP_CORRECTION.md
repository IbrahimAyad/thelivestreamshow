# ⚠️ AUDIO SETUP CORRECTION - IMPORTANT!

## 🔴 The Issue

Multi-Output Device is **OUTPUT ONLY** - it cannot be used as an input device in Discord!

## ✅ CORRECTED Configuration

### In Audio MIDI Setup:

#### 1. Configure Aggregate Device (for Discord INPUT)
```
Open: Applications → Utilities → Audio MIDI Setup
Click: "Aggregate Device" in left sidebar

Check these devices:
  ☑ Scarlett Solo 4th Gen  (your microphone)
  ☑ Loopback Audio         (captures BetaBot audio)

Clock Source: Scarlett Solo 4th Gen
Drift Correction: ☑ Loopback Audio
```

#### 2. Keep Multi-Output Device (for system routing)
```
Click: "Multi-Output Device" in left sidebar

Check these devices:
  ☑ Scarlett Solo 4th Gen [Master ⭐]
  ☑ BlackHole 2ch
  ☑ Loopback Audio

Drift Correction:
  ☑ BlackHole 2ch
  ☑ Loopback Audio
```

---

### CORRECTED Discord Settings:

**Voice & Video Settings:**
```
INPUT DEVICE:  Aggregate Device  ← CORRECTED!
OUTPUT DEVICE: Loopback Audio    ← This was correct
```

**Voice Processing:**
```
❌ Echo Cancellation: OFF
❌ Noise Suppression: OFF  
❌ Noise Reduction: OFF
❌ Automatic Gain Control: OFF
✅ Voice Activity: ON
```

---

## 🔄 Updated Audio Flow

```
YOUR MICROPHONE
    ↓
Scarlett Solo Hardware
    ↓
Aggregate Device (combines Scarlett + Loopback)
    ↓
Discord Input = "Aggregate Device"
    ↓
DISCORD PANEL HEARS YOU ✅


BETABOT TTS (Backend)
    ↓
System Output = "Loopback Audio"
    ↓
Loopback captures System Audio
    ↓
Loopback part of Aggregate Device
    ↓
Discord Input = "Aggregate Device"  
    ↓
DISCORD PANEL HEARS BETABOT ✅
```

---

## 📋 Quick Fix Steps (Do Now!)

1. ✅ Open Audio MIDI Setup (already done)

2. ✅ Configure **Aggregate Device**:
   - Check: Scarlett Solo 4th Gen
   - Check: Loopback Audio
   - Clock Source: Scarlett Solo 4th Gen

3. ✅ Restart Discord (already done)

4. ✅ In Discord Settings:
   - Input: **Aggregate Device**
   - Output: **Loopback Audio**

5. ✅ Test!

---

## Why This Works

**Aggregate Device** = Multiple INPUTS combined into one
- Captures your Scarlett microphone
- Captures Loopback (which has BetaBot + Discord audio)
- Discord hears BOTH you and BetaBot

**Multi-Output Device** = One INPUT sent to multiple OUTPUTS  
- Takes system audio
- Sends to multiple destinations
- Used for system routing, NOT for Discord input

---

## After Fixing

Once configured, you should see in Discord settings:
- Input: Aggregate Device ✅
- Output: Loopback Audio ✅

Then test:
1. Speak into mic → Panel hears you ✅
2. Click "Test TTS" → Panel hears BetaBot ✅
3. Panel speaks → You hear them ✅

All working? You're ready! 🚀
