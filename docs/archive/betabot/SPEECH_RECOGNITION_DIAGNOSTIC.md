# Speech Recognition Diagnostic Guide

**Date:** October 16, 2025
**Issue:** "Beta bot wasn't picking up the words when we were trying to talk to it"
**Status:** 🔍 Enhanced debug logging added - ready for testing

---

## What Was Changed

### Enhanced Debug Logging Throughout Speech Recognition Flow

Added comprehensive console logging to identify the exact point of failure:

#### 1. **startListening() Function**
- Shows if function is called
- Displays Whisper availability status
- Confirms OpenAI API key is configured
- Indicates which mode is starting (Whisper vs Browser)

**Expected Console Output:**
```
🎤 startListening() called
🎤 Whisper available: true
🎤 OpenAI API Key configured: true
🎤 Attempting to start Whisper API mode...
```

#### 2. **startListeningWhisper() Function**
- Logs when microphone access is requested
- Confirms when access is granted
- Shows selected MIME type for audio
- Displays MediaRecorder state changes

**Expected Console Output:**
```
🎤 startListeningWhisper() called
🎤 Requesting microphone access...
✅ Microphone access granted
Using MIME type: audio/webm;codecs=opus
🎬 Starting MediaRecorder...
▶️ MediaRecorder started recording
✅ Started Whisper API transcription with MIME type: audio/webm;codecs=opus
```

#### 3. **MediaRecorder Event Handlers**
- `onstart`: When recording begins
- `ondataavailable`: When audio chunks are captured (every 10 seconds)
- `onstop`: When recording pauses to process
- `onerror`: Any MediaRecorder errors

**Expected Console Output (every 10 seconds):**
```
📼 Audio data received: 145628 bytes
⏱️ 10-second interval triggered, stopping to process chunk...
⏹️ MediaRecorder stopped, processing chunk...
```

#### 4. **processAudioChunk() Function**
- Shows when chunk processing starts
- Displays number of audio chunks in buffer
- Shows blob size created
- Indicates when sending to Whisper API

**Expected Console Output:**
```
🔄 processAudioChunk() called
🔄 Audio chunks in buffer: 1
🔄 Created audio blob: 145628 bytes
📡 Sending to Whisper API...
```

#### 5. **transcribeWithWhisper() Function**
- Confirms API key presence and length
- Shows audio blob details (size, type, MIME)
- Logs API call status
- Displays response status code
- Shows transcription result length

**Expected Console Output (Success):**
```
🔊 transcribeWithWhisper() called
🔊 API key present: true Length: 164
🔊 Audio details: { size: 145628, type: 'audio/webm', mimeType: 'audio/webm', extension: 'webm' }
📡 Calling Whisper API: https://api.openai.com/v1/audio/transcriptions
📡 Whisper API response status: 200 OK
✅ Whisper API success, transcribed text length: 42
✅ Whisper transcription received: testing one two three
```

**Expected Console Output (Error):**
```
🔊 transcribeWithWhisper() called
🔊 API key present: true Length: 164
🔊 Audio details: { size: 145628, type: 'audio/webm', mimeType: 'audio/webm', extension: 'webm' }
📡 Calling Whisper API: https://api.openai.com/v1/audio/transcriptions
📡 Whisper API response status: 401 Unauthorized
❌ Whisper API error data: { error: { message: 'Invalid API key', type: 'invalid_request_error' } }
❌ Failed to transcribe audio chunk: Error: Invalid API key
❌ Failure count: 1
```

---

## How to Diagnose the Issue

### Step 1: Start Beta Bot Session

1. Open http://localhost:5173
2. Navigate to **Beta Bot AI Co-Host** panel
3. Open browser Developer Tools (F12)
4. Go to **Console** tab
5. Click **"▶️ Start Session"** button

### Step 2: Check Initial Logs

**If you see NO logs at all:**
- ❌ `startListening()` is not being called
- **Possible causes:**
  - Button click handler not working
  - JavaScript error preventing execution
  - React component not rendering
- **Next step:** Check for JavaScript errors in console (red messages)

**If you see logs but microphone request fails:**
```
🎤 startListening() called
🎤 Attempting to start Whisper API mode...
🎤 startListeningWhisper() called
🎤 Requesting microphone access...
❌ Failed to start audio capture: NotAllowedError: Permission denied
```
- ❌ Microphone permission denied
- **Fix:** Grant microphone permission in browser
- **How:** Click 🔒 icon in address bar → Microphone → Allow

**If microphone grants but MediaRecorder never starts:**
```
🎤 Requesting microphone access...
✅ Microphone access granted
Using MIME type: audio/webm
🎬 Starting MediaRecorder...
(no further logs)
```
- ❌ MediaRecorder failed to start
- **Possible causes:**
  - Browser doesn't support MediaRecorder
  - Audio stream has no tracks
- **Fix:** Try different browser (Chrome/Edge recommended)

### Step 3: Check Audio Capture (Wait 10 Seconds)

After starting session, wait 10 seconds and watch for:

**Expected logs every 10 seconds:**
```
📼 Audio data received: 145628 bytes
⏱️ 10-second interval triggered, stopping to process chunk...
⏹️ MediaRecorder stopped, processing chunk...
🔄 processAudioChunk() called
🔄 Audio chunks in buffer: 1
🔄 Created audio blob: 145628 bytes
```

**If you see:**
```
⏱️ 10-second interval triggered, stopping to process chunk...
⏹️ MediaRecorder stopped, processing chunk...
🔄 processAudioChunk() called
⚠️ No audio chunks to process
```
- ❌ MediaRecorder not capturing audio data
- **Possible causes:**
  - `ondataavailable` event not firing
  - Audio blob size is 0 (silent input)
  - Microphone muted in system settings
- **Fix:**
  - Check system microphone is not muted
  - Try speaking louder
  - Check microphone input level in system settings

**If you see:**
```
📼 Audio data received: 0 bytes
⚠️ Audio data received but size is 0
```
- ❌ MediaRecorder capturing but getting silent audio
- **Fix:** Check microphone input level, make sure it's the correct device

### Step 4: Check Whisper API Call

When audio chunk is captured, watch for:

**Expected (Success):**
```
📡 Sending to Whisper API...
🔊 transcribeWithWhisper() called
🔊 API key present: true Length: 164
📡 Calling Whisper API: https://api.openai.com/v1/audio/transcriptions
📡 Whisper API response status: 200 OK
✅ Whisper API success, transcribed text length: 42
✅ Whisper transcription received: testing one two three
```

**If you see 401 Unauthorized:**
```
📡 Whisper API response status: 401 Unauthorized
❌ Whisper API error: Invalid API key
```
- ❌ OpenAI API key is invalid
- **Fix:**
  - Go to https://platform.openai.com/api-keys
  - Create new API key
  - Replace in `.env` file: `VITE_OPENAI_API_KEY=sk-proj-...`
  - Restart dev server: `pnpm run dev`

**If you see 429 Rate Limit:**
```
📡 Whisper API response status: 429 Too Many Requests
```
- ❌ Too many API calls (quota exceeded)
- **Fix:** Wait a few minutes, or upgrade OpenAI plan

**If you see 402 Payment Required:**
```
📡 Whisper API response status: 402 Payment Required
❌ Whisper API error: You exceeded your current quota
```
- ❌ No billing set up or credits exhausted
- **Fix:**
  - Go to https://platform.openai.com/account/billing
  - Add payment method
  - Add credits to account

**If you see 400 Bad Request:**
```
📡 Whisper API response status: 400 Bad Request
❌ Whisper API error: Invalid file format
```
- ❌ Audio format not supported by Whisper
- **Possible causes:**
  - MIME type incompatible
  - Audio blob corrupted
- **Fix:** Browser will auto-fallback to Web Speech API after 3 failures

### Step 5: Check Auto-Fallback to Browser Mode

If Whisper fails 3 times:

```
❌ Failed to transcribe audio chunk: Error: ...
❌ Failure count: 3
⚠️ Whisper API failed multiple times, switching to browser fallback
🎤 Starting browser fallback mode...
```

Browser mode uses Web Speech API (no OpenAI needed)

**Expected:**
```
Started browser speech recognition (fallback mode)
Transcript: testing one two three
```

---

## Common Issues & Solutions

### Issue #1: No Console Logs at All
**Symptoms:** Clicking "Start Session" does nothing in console
**Diagnosis:** JavaScript error preventing execution
**Solution:**
1. Check console for red error messages
2. Look for "Uncaught" or "TypeError" errors
3. Share the error with developer

### Issue #2: Microphone Permission Denied
**Symptoms:**
```
❌ Failed to start audio capture: NotAllowedError: Permission denied
```
**Solution:**
1. Click 🔒 icon in address bar
2. Find "Microphone" setting
3. Change to "Allow"
4. Refresh page
5. Try again

### Issue #3: Whisper API Key Invalid
**Symptoms:**
```
📡 Whisper API response status: 401 Unauthorized
```
**Solution:**
1. Open `.env` file
2. Check `VITE_OPENAI_API_KEY` value
3. Ensure it starts with `sk-proj-` (project key) or `sk-` (legacy key)
4. Verify key length is ~160+ characters
5. If invalid, create new key at https://platform.openai.com/api-keys
6. Replace in `.env`
7. Restart server: `pnpm run dev`

### Issue #4: No Billing on OpenAI Account
**Symptoms:**
```
📡 Whisper API response status: 402 Payment Required
❌ You exceeded your current quota
```
**Solution:**
1. Go to https://platform.openai.com/account/billing
2. Add payment method
3. Add $5-10 credits to account
4. Wait a few minutes for it to activate
5. Try again

### Issue #5: Silent Audio Being Captured
**Symptoms:**
```
📼 Audio data received: 145628 bytes
✅ Whisper API success, transcribed text length: 0
✅ Whisper transcription received:
(empty string)
```
**Diagnosis:** Microphone working but audio is silent
**Solution:**
1. Check system microphone isn't muted
2. Check correct microphone is selected in system settings
3. Test microphone in another app
4. Increase microphone input volume
5. Speak closer to microphone

### Issue #6: MediaRecorder Not Supported
**Symptoms:**
```
❌ Failed to start audio capture: MediaRecorder is not supported
```
**Solution:**
1. Use Chrome, Edge, or Firefox (Safari has limited support)
2. Update browser to latest version
3. System will auto-fallback to Web Speech API

---

## Testing Checklist

Use this checklist to systematically test:

### Pre-Test Verification
- [ ] Dev server running at http://localhost:5173
- [ ] Browser Developer Tools open (F12)
- [ ] Console tab visible
- [ ] Microphone connected and working
- [ ] Microphone not muted in system settings

### Test #1: Start Session
- [ ] Click "▶️ Start Session"
- [ ] See: `🎤 startListening() called` in console
- [ ] See: `🎤 Whisper available: true`
- [ ] See: `🎤 OpenAI API Key configured: true`
- [ ] See: `🎤 Attempting to start Whisper API mode...`

**If FAIL:** Check for JavaScript errors, share with developer

### Test #2: Microphone Access
- [ ] See: `🎤 Requesting microphone access...`
- [ ] Browser shows microphone permission popup
- [ ] Click "Allow"
- [ ] See: `✅ Microphone access granted`
- [ ] See: `Using MIME type: audio/webm` (or similar)
- [ ] See: `▶️ MediaRecorder started recording`

**If FAIL:** Grant microphone permission, try different browser

### Test #3: Audio Capture (Wait 10 Seconds)
- [ ] Wait 10 seconds without speaking
- [ ] See: `📼 Audio data received: [number] bytes`
- [ ] See: `⏱️ 10-second interval triggered`
- [ ] See: `🔄 processAudioChunk() called`
- [ ] See: `🔄 Created audio blob: [number] bytes`

**If FAIL:** Check microphone isn't muted, try different microphone

### Test #4: Whisper API Call
- [ ] See: `📡 Sending to Whisper API...`
- [ ] See: `🔊 API key present: true`
- [ ] See: `📡 Calling Whisper API: https://...`
- [ ] See: `📡 Whisper API response status: 200 OK`
- [ ] See: `✅ Whisper API success`

**If FAIL:** Check API key validity, check billing, check quota

### Test #5: Transcription Display
- [ ] Speak clearly: "Testing one two three"
- [ ] Wait 10 seconds
- [ ] See transcription in "Latest Transcript" box
- [ ] See word count increase
- [ ] Transcription is accurate

**If FAIL:** Check microphone volume, speak louder, check for ambient noise

### Test #6: Wake Phrase Detection
- [ ] Say: "Hey Beta Bot, what is artificial intelligence?"
- [ ] See: `🎙️ Wake phrase detected: "hey beta bot"`
- [ ] See: `🟢 Routing to GPT-4`
- [ ] Beta Bot responds with answer
- [ ] Response plays via TTS
- [ ] Chat history updates
- [ ] Interactions counter increases

**If FAIL:** Check GPT-4 API access, check billing

---

## What to Report

If issue persists after following this guide, report:

### 1. Complete Console Log Output
Copy/paste from clicking "Start Session" through the first 20 seconds

### 2. Browser Information
- Browser name and version (e.g., Chrome 119.0.6045.159)
- Operating system (Windows/Mac/Linux)

### 3. Microphone Setup
- Microphone type (built-in, USB, headset, etc.)
- Is it working in other apps?
- System audio settings screenshot

### 4. API Key Information (DO NOT SHARE ACTUAL KEY)
- Key format: `sk-proj-...` or `sk-...`
- Key length (should be ~160+ characters)
- When was it created?
- Does OpenAI account have billing set up?

### 5. Specific Behavior
- What happens when you click "Start Session"?
- Do you see the microphone permission popup?
- What does the status indicator show?
- What does "Latest Transcript" box show?
- Any error messages in red?

---

## Success Indicators

When everything is working correctly, you should see this flow every 10 seconds:

```
(First time only - session start)
🎤 startListening() called
🎤 Whisper available: true
🎤 OpenAI API Key configured: true
🎤 Attempting to start Whisper API mode...
🎤 startListeningWhisper() called
🎤 Requesting microphone access...
✅ Microphone access granted
Using MIME type: audio/webm;codecs=opus
🎬 Starting MediaRecorder...
▶️ MediaRecorder started recording
✅ Started Whisper API transcription with MIME type: audio/webm;codecs=opus

(Every 10 seconds while speaking)
📼 Audio data received: 145628 bytes
⏱️ 10-second interval triggered, stopping to process chunk...
⏹️ MediaRecorder stopped, processing chunk...
🔄 processAudioChunk() called
🔄 Audio chunks in buffer: 1
🔄 Created audio blob: 145628 bytes
📡 Sending to Whisper API...
🔊 transcribeWithWhisper() called
🔊 API key present: true Length: 164
🔊 Audio details: { size: 145628, type: 'audio/webm', ... }
📡 Calling Whisper API: https://api.openai.com/v1/audio/transcriptions
📡 Whisper API response status: 200 OK
✅ Whisper API success, transcribed text length: 42
✅ Whisper transcription received: your spoken words here
```

---

## Next Steps After Testing

1. **Open browser console** (F12 → Console tab)
2. **Click "Start Session"**
3. **Watch console logs** appear
4. **Wait 10 seconds** and speak
5. **Share console output** with developer

The enhanced logging will pinpoint exactly where the issue occurs!

---

**File:** `SPEECH_RECOGNITION_DIAGNOSTIC.md`
**Repository:** https://github.com/IbrahimAyad/thelivestreamshow
**Commit:** 6248580
**Dev Server:** http://localhost:5173
