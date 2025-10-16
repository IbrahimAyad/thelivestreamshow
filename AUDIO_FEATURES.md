# Real Audio Implementation Guide

## Overview

The Stream Enhancement Dashboard now features **fully functional real-time audio** for both the BetaBot TTS system and the Audience Reaction Soundboard. All audio generation and playback happens automatically with robust fallback mechanisms.

---

## 🎙️ BetaBot TTS (Text-to-Speech) System

### How It Works

1. **Question Generation**: Generate philosophical questions using the "Show Prep" panel
2. **Voice Generation**: Click "Generate Voice" on any question in the TTS Queue
3. **Audio Processing**:
   - **Primary**: Calls Google Cloud TTS API (if API key is configured)
   - **Fallback**: Uses browser's Web Speech API (works without API keys)
4. **Storage**: Generated MP3 files are stored in Supabase Storage bucket `tts-audio`
5. **Playback**: Click "Play Live" to:
   - Display the question on the broadcast overlay
   - Play audio on BOTH control panel (preview at 60% volume) and broadcast view (100% volume)

### Voice Characteristics

- **Voice ID**: `en-US-Neural2-J` (Google Cloud TTS)
- **Pitch**: -2.0 (slightly lower, robotic quality)
- **Speaking Rate**: 0.95 (slightly slower for clarity)
- **Fallback Voice**: Browser's default male voice (rate: 0.9, pitch: 0.7)

### Technical Implementation

**Edge Function**: `generate-tts`
- Located: `/supabase/functions/generate-tts/index.ts`
- Endpoint: `https://vcniezwtltraqramjlux.supabase.co/functions/v1/generate-tts`
- Input: `{ text: string, voiceId?: string }`
- Output: `{ audioContent: string | null, useFallback: boolean }`

**Frontend Components**:
- `TTSQueuePanel.tsx`: Control interface for generating and playing TTS
- `BroadcastOverlayView.tsx`: Displays question and plays audio on stream
- `audioGenerator.ts`: Utility functions for audio playback

### Audio Flow

```
User clicks "Generate Voice"
  ↓
Call TTS Edge Function
  ↓
Google Cloud TTS API (if key exists)
  ↓ (fallback if no key)
Web Speech API marker
  ↓
Store in Supabase or mark for fallback
  ↓
Update database with audio URL
  ↓
User clicks "Play Live"
  ↓
Database update triggers real-time sync
  ↓
Broadcast overlay receives update
  ↓
**AUDIO PLAYS** (MP3 file OR Web Speech API)
  ↓
Visual overlay displays question
  ↓
Auto-reset after 8 seconds
```

---

## 🔊 Audience Reaction Soundboard

### Available Sound Effects

1. **Applause** (Light & Heavy)
   - Generated using Web Audio API
   - 2-second duration, stereo noise with natural envelope
   - Simulates crowd clapping

2. **Laughter**
   - 1.5-second burst pattern
   - Modulated noise to mimic group laughter
   - Natural decay envelope

3. **Cheers**
   - 1.5-second high-frequency celebration sound
   - Rising then falling amplitude
   - Energetic, crowd-like effect

4. **Gasps**
   - 1-second sharp attack, quick decay
   - Low-frequency surprise sound
   - Dramatic reaction effect

5. **Agreement** ("Mmm-hmm")
   - 0.5-second two-tone pattern
   - Simulates vocal affirmation
   - 200 Hz → 250 Hz transition

6. **Thinking** ("Hmm...")
   - 0.8-second rising pitch
   - 150-200 Hz frequency sweep
   - Contemplative sound

### How It Works

1. **Click a Sound Button**: Triggers immediate local playback
2. **Web Audio API**: Generates sound procedurally (no audio files needed)
3. **Real-Time Sync**: Updates database to trigger broadcast overlay
4. **Broadcast Playback**: Same sound plays on OBS overlay
5. **Visual Indicator**: Large text displays effect name on stream
6. **Auto-Reset**: Effect clears after 3 seconds

### Technical Implementation

**Audio Generator**: `src/utils/audioGenerator.ts`

Key functions:
- `playSoundEffect(effectName: string)`: Main playback function
- `AudioGenerator.generateApplause()`: Creates applause buffer
- `AudioGenerator.generateLaughter()`: Creates laughter buffer
- `AudioGenerator.generateCheer()`: Creates cheer buffer
- `AudioGenerator.playBuffer()`: Plays any AudioBuffer

**Caching System**:
- Sound buffers are generated once and cached
- Subsequent plays use cached buffers for instant playback
- Zero latency for repeated effects

### Audio Flow

```
User clicks sound effect button
  ↓
Local audio plays immediately (Web Audio API)
  ↓
Database updated: is_playing = true
  ↓
Real-time sync to broadcast overlay
  ↓
Overlay plays same sound (Web Audio API)
  ↓
Visual indicator shows effect name
  ↓
Auto-reset after 3 seconds
```

---

## 🎚️ Volume Control

### Master Volume
- **Range**: 0-100%
- **Location**: Soundboard panel
- **Applies to**: All soundboard effects
- **Does NOT affect**: TTS audio (always plays at optimal volume)

### Volume Levels

- **TTS on Control Panel**: 60% (preview volume)
- **TTS on Broadcast**: 100% (full volume for stream)
- **Soundboard on Control**: 70% base (affected by master volume)
- **Soundboard on Broadcast**: 70% base (affected by master volume)

---

## 🔧 Configuration & Setup

### Optional: Google Cloud TTS API Key

For higher-quality robotic voice:

1. Get API key from Google Cloud Console
2. Enable Cloud Text-to-Speech API
3. Add to Supabase Edge Function secrets:
   ```bash
   supabase secrets set GOOGLE_CLOUD_TTS_API_KEY=your_key_here
   ```

**Without API Key**: System automatically uses Web Speech API (browser built-in, free)

### Supabase Storage Bucket

- **Bucket Name**: `tts-audio`
- **Public Access**: Enabled
- **File Format**: MP3
- **Purpose**: Store generated TTS audio files
- **Auto-created**: Yes (already configured)

---

## 📊 Database Schema

### `show_questions` Table

```sql
CREATE TABLE show_questions (
  id UUID PRIMARY KEY,
  question_text TEXT NOT NULL,
  tts_generated BOOLEAN DEFAULT false,
  tts_audio_url TEXT,  -- Stores URL or 'web-speech-api' marker
  is_played BOOLEAN DEFAULT false,
  position INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### `soundboard_effects` Table

```sql
CREATE TABLE soundboard_effects (
  id UUID PRIMARY KEY,
  effect_name TEXT NOT NULL,
  effect_type TEXT NOT NULL,
  volume INTEGER DEFAULT 100,
  is_playing BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

---

## 🎭 Usage Scenarios

### Scenario 1: Scripted Show with Pre-Generated Questions

1. Before the show:
   - Generate all questions using "AI Question Generator"
   - Click "Generate Voice" on each question
   - Test playback with "Play Live" preview

2. During the show:
   - Click "Play Live" when ready for BetaBot to ask
   - Audio plays automatically on broadcast
   - Question displays prominently on overlay
   - Move to next segment after 8 seconds

### Scenario 2: Live Audience Engagement

1. Monitor chat/comments
2. Use soundboard to react:
   - Applause for good points
   - Laughter for humor
   - Gasps for surprises
   - Agreement for consensus

3. Effects play immediately:
   - Local preview on control panel
   - Broadcast plays on OBS overlay
   - Visual indicator on stream

### Scenario 3: Hybrid Production

- Pre-generate TTS for structured segments
- Use soundboard for spontaneous reactions
- Combine with lower thirds and graphics
- All audio synchronized in real-time

---

## 🔍 Troubleshooting

### TTS Not Playing

**Issue**: No audio when clicking "Play Live"

**Solutions**:
1. Check browser permissions (allow audio autoplay)
2. Verify `tts_audio_url` is not null in database
3. If using Web Speech API, ensure browser supports it (all modern browsers do)
4. Check console for playback errors
5. Fallback will automatically engage if file fails

### Soundboard Silent

**Issue**: Sound effects not playing

**Solutions**:
1. Check master volume slider (not set to 0)
2. Verify Web Audio API is enabled (it is in all modern browsers)
3. Check browser console for errors
4. Try different sound effect to isolate issue

### Audio Delay on Broadcast

**Issue**: Audio plays late on OBS overlay

**Solutions**:
1. This is normal (~100-500ms due to real-time sync)
2. Ensure stable internet connection
3. Check Supabase real-time subscription is active
4. Verify broadcast view is loaded and connected

### Google TTS API Errors

**Issue**: TTS generation fails with API error

**Solutions**:
1. Verify API key is correct and active
2. Check API quota limits (Google Cloud Console)
3. System will automatically fallback to Web Speech API
4. No user intervention needed - fallback is seamless

---

## 🚀 Performance Notes

### Web Audio API Advantages

- **Zero Latency**: Sounds play instantly (no network requests)
- **No Storage**: Generated procedurally, no files to store
- **Consistent**: Works offline and in all browsers
- **Lightweight**: Minimal memory footprint
- **Cached**: First generation cached, subsequent plays instant

### TTS System Benefits

- **Professional Quality**: Google Cloud TTS when API key provided
- **Automatic Fallback**: Web Speech API as backup
- **Storage Optimized**: Files cached in Supabase Storage
- **Dual Playback**: Preview on control + live on broadcast
- **Voice Consistency**: Same voice settings every time

---

## 📝 Summary

✅ **BetaBot TTS**: Fully functional with Google Cloud TTS + Web Speech API fallback  
✅ **Soundboard**: Real audio effects using Web Audio API  
✅ **Dual Playback**: Control panel preview + broadcast overlay playback  
✅ **Real-Time Sync**: Supabase real-time triggers audio on all connected clients  
✅ **Zero Configuration**: Works out-of-the-box without API keys  
✅ **Professional Grade**: Production-ready for live streaming  

**No more simulations** - this is real, functional audio for professional live stream production! 🎉
