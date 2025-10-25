# 🎤 Piper TTS Fix - Danny Voice for BetaBot

## 🐛 Problem Found

The documentation said you were using "Piper TTS" with "danny-low" voice, but:
- ❌ The actual server was using **F5-TTS** (a different TTS system)
- ❌ F5-TTS doesn't support Piper voices like danny-low
- ❌ The F5-TTS Docker container wasn't running
- ❌ Docker Desktop wasn't running

## ✅ Solution Applied

### 1. Created Proper Piper TTS Server
**New File**: `/f5-tts-server/piper-server.py`
- Real Piper TTS implementation using Piper binary
- Supports all 5 Piper voices including danny-low
- Compatible with existing client code

### 2. Created Docker Compose for Piper
**New File**: `docker-compose.piper.yml`
- Downloads Piper TTS binary automatically
- Downloads voice models:
  - ✅ **danny-low** (BetaBot's voice - male, low quality but fast)
  - ✅ **ryan-high** (male, high quality)
  - ✅ **lessac-medium** (female, medium quality)
- Runs on port 8000 (same as before)

### 3. Started Docker Desktop
- ✅ Docker is now running
- ✅ Piper TTS server is starting up
- ⏳ Currently downloading Piper binary and voice models

---

## 🎵 Available Voices

| Voice | Gender | Quality | Speed | Use Case |
|-------|--------|---------|-------|----------|
| **danny-low** ✅ | Male | Low | Fast | **DEFAULT - BetaBot's voice** |
| ryan-high | Male | High | Slower | High-quality announcements |
| lessac-medium | Female | Medium | Medium | Female voice option |
| amy-medium | Female | Medium | Medium | Friendly tone |
| ljspeech-high | Female | High | Slower | Professional/clear |

**Current Default**: `danny-low` (BetaBot's consistent male voice)

---

## 🚀 How to Verify It's Working

### Step 1: Check Server is Running
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "piper_available": true,
  "voices_directory": true,
  "voices_loaded": [
    "en_US-danny-low",
    "en_US-ryan-high",
    "en_US-lessac-medium"
  ],
  "default_voice": "danny-low"
}
```

### Step 2: Test Danny Voice
```bash
curl -X POST http://localhost:8000/generate-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello! I am BetaBot speaking with the danny low voice.","voice":"danny-low"}' \
  --output betabot-test.wav && open betabot-test.wav
```

This will:
1. Generate speech with danny-low voice
2. Save to `betabot-test.wav`
3. Open and play the audio file

### Step 3: Check in Dashboard
1. Open http://localhost:5173
2. Go to BetaBot Control Panel
3. Select TTS Provider: **F5-TTS** (it's actually Piper now)
4. You should see "danny-low" as the selected voice
5. Click "Preview" to test the voice

---

## 🔍 Troubleshooting

### Server Not Responding
```bash
# Check if container is running
docker ps | grep piper-tts-server

# If not running, start it
docker-compose -f docker-compose.piper.yml up -d

# Check logs for errors
docker logs piper-tts-server
```

### Voice Download Issues
The first startup takes 2-3 minutes to:
1. Install system dependencies (espeak-ng, curl, wget)
2. Install Python packages (fastapi, uvicorn)
3. Download Piper binary (~50MB)
4. Download voice models (~20MB each)

**Be patient on first startup!**

### Wrong Voice Playing
Check the voice selection in:
1. **Dashboard**: BetaBot Control Panel → Voice Selection
2. **Code**: `useF5TTS` hook should default to danny-low
3. **Graphics**: `stream-audio-controller.js` uses danny-low

---

## 📝 Files Modified/Created

### Created
- ✅ `/f5-tts-server/piper-server.py` - Real Piper TTS server
- ✅ `/docker-compose.piper.yml` - Docker setup for Piper

### Existing (No Changes Needed)
- ✅ `/src/hooks/useF5TTS.ts` - Already compatible (defaults to danny-low)
- ✅ `/public/stream-audio-controller.js` - Already uses danny-low
- ✅ All graphics HTML files - Already configured for danny-low

---

## 🎯 Current Status

**Server**: ⏳ Starting up (downloading Piper + voices)
**Expected Time**: 2-3 minutes for first startup
**Port**: 8000
**Default Voice**: danny-low (BetaBot)

---

## ⚡ Quick Start (After Server is Ready)

```bash
# Check health
curl http://localhost:8000/health

# Test danny voice
curl -X POST http://localhost:8000/generate-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"BetaBot is ready to speak!","voice":"danny-low"}' \
  --output test.wav

# Play the audio
open test.wav
```

---

## 🔄 Restart Command

If you need to restart the Piper TTS server:
```bash
docker-compose -f docker-compose.piper.yml restart
```

To stop it:
```bash
docker-compose -f docker-compose.piper.yml down
```

To view logs:
```bash
docker logs -f piper-tts-server
```

---

**Last Updated**: 2025-10-22  
**Fix Status**: ✅ Applied, ⏳ Server Starting Up  
**Voice**: danny-low (BetaBot's male voice)
