# 🔧 BETABOT NOT RESPONDING - TROUBLESHOOTING GUIDE

## Quick Diagnosis

Your backend **IS** running (port 3001 ✅), but BetaBot needs these things to respond:

---

## ✅ CHECKLIST: Why BetaBot Won't Respond

### 1. **Session Started?**
- [ ] Go to BetaBot Control Panel
- [ ] Click **"Start Session"** button
- [ ] Wait for session to activate

**Why:** BetaBot only listens when a session is active.

---

### 2. **Speech Recognition Enabled?**
- [ ] Click **"Start Listening"** button in BetaBot panel
- [ ] Grant microphone permissions if prompted
- [ ] Check console for "Started Whisper transcription" or "Started browser speech recognition"

**Why:** BetaBot needs to hear you speak.

**Console Check:**
```javascript
// Should see one of these:
"🎤 Started Whisper transcription (using OpenAI API)"
"Started browser speech recognition (fallback mode)"
```

---

### 3. **Using Correct Wake Phrase?**

**Supported wake phrases:**
- ✅ "Hey Beta Bot"
- ✅ "Beta Bot"
- ✅ "Hey BetaBot"
- ✅ "BetaBot"

**Example commands:**
```
"Hey Beta Bot, what's the weather today?"
"Beta Bot, tell me about AI"
"Hey BetaBot, what do you think about that?"
```

**NOT supported:**
- ❌ "Hey Bot"
- ❌ "Beta"
- ❌ Just asking questions without wake phrase

**Why:** Wake phrase detection is case-insensitive but requires "Beta Bot" or "BetaBot" somewhere.

---

### 4. **Microphone Working?**

**Test your mic:**
1. Open browser console
2. Start speech recognition
3. Speak: "Hello this is a test"
4. Check console logs:

**Expected:**
```
💾 Transcript saved to database: "hello this is a test"
```

**If you see "⏭️ Skipping short transcript":**
- Good! Optimizations are working
- Speak longer sentences (5+ characters)

**If you see nothing:**
- Check microphone permissions
- Try different microphone in settings
- Check system microphone volume

---

### 5. **Mode Set to "Co-Host"?**

- [ ] Check mode selector in BetaBot panel
- [ ] Should be set to **"Co-Host Mode"** (not "Question Generator")

**Why:** Wake phrase detection only works in Co-Host mode.

---

### 6. **TTS Provider Working?**

**Test TTS:**
1. Click **"Test TTS"** button in BetaBot panel
2. Should hear: "Hello! I am Beta Bot, your AI co-host..."

**If no sound:**
- Check your audio output device
- Try switching TTS provider (Browser ↔ F5-TTS)
- Check system volume

---

### 7. **API Keys Configured?**

**Check `.env.local` has:**
```bash
# Required for wake phrase responses
VITE_OPENAI_API_KEY=sk-...

# Required for real-time questions (optional)
VITE_PERPLEXITY_API_KEY=pplx-...

# Required for Whisper transcription (optional, can use browser fallback)
VITE_OPENAI_API_KEY=sk-...
```

**Check in browser console:**
```javascript
// Should NOT see these errors:
"❌ OpenAI API key not configured"
"❌ Perplexity API key not configured"
```

---

## 🧪 STEP-BY-STEP TEST PROCEDURE

### Test 1: Verify Backend Connection

**Open browser console**, run:
```javascript
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend:', d))
  .catch(e => console.error('❌ Backend:', e))
```

**Expected:**
```json
{
  "status": "healthy",
  "scarlett": false,
  "obs": false,
  "uptime": 123.45
}
```

---

### Test 2: Verify TTS Service

**Open browser console**, run:
```javascript
fetch('http://localhost:8000/voices')
  .then(r => r.json())
  .then(d => console.log('✅ Piper TTS:', d.count, 'voices'))
  .catch(e => console.error('❌ Piper TTS:', e))
```

**Expected:**
```
✅ Piper TTS: 5 voices
```

---

### Test 3: Test Speech Recognition

1. **Start session** (click "Start Session")
2. **Start listening** (click "Start Listening")
3. **Speak clearly:** "This is a test of speech recognition"
4. **Check console** for:

```
💾 Transcript saved to database: "this is a test of speech recognition"
```

**If you see:**
```
⏭️ Skipping short transcript (<5 chars): "test"
```
- ✅ **Good!** Optimizations working, just speak longer

**If you see nothing:**
- ❌ Microphone not working
- Check permissions, device selection

---

### Test 4: Test Wake Phrase Detection

1. **Ensure session started** ✅
2. **Ensure listening active** ✅
3. **Speak:** "Hey Beta Bot, what time is it?"
4. **Expected console:**

```
Wake phrase detected: {phrase: "beta bot", context: "what time is it?"}
🎙️ Handling wake_phrase question: "what time is it?"
```

**Then BetaBot should:**
- Show "Processing..." indicator
- Generate answer via GPT-4 or Perplexity
- Speak the answer via TTS

---

### Test 5: Test Text Chat (Alternative)

If wake phrase doesn't work, try text chat:

1. Type in text input: **"What is AI?"**
2. Click **Send** or press **Enter**
3. BetaBot should speak and respond

**This bypasses speech recognition** - good for testing if TTS works.

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Nothing happens when I speak"

**Possible causes:**
1. Session not started → Click "Start Session"
2. Listening not enabled → Click "Start Listening"
3. Microphone muted → Check system volume
4. Wrong microphone selected → Try "Microphone Selector"
5. Not using wake phrase → Say "Hey Beta Bot" first

---

### Issue: "Transcripts appear but BetaBot doesn't respond"

**Possible causes:**
1. Not using wake phrase → Must say "Beta Bot" or "BetaBot"
2. Mode set to "Question Generator" → Switch to "Co-Host Mode"
3. OpenAI API key missing → Add `VITE_OPENAI_API_KEY` to `.env.local`

**Check console for:**
```
Wake phrase detected: {phrase: "beta bot", ...}
```

If you **don't** see this, wake phrase wasn't detected.

---

### Issue: "Wake phrase detected but no response"

**Possible causes:**
1. OpenAI API key invalid → Check key in `.env.local`
2. API rate limit → Check OpenAI dashboard
3. Network error → Check console for errors

**Check console for:**
```
❌ OpenAI API error: ...
❌ Perplexity API error: ...
```

---

### Issue: "BetaBot responds but I can't hear it"

**Possible causes:**
1. Audio output device wrong → Check system settings
2. TTS service down → Try "Test TTS" button
3. Volume muted → Check system volume

**Check console for:**
```
✅ F5-TTS: Audio sent to backend successfully
✅ BetaBot audio playback complete
```

If you see these, audio is playing (might be going to wrong output device).

---

### Issue: "Short transcripts being skipped"

**This is EXPECTED!** The optimizations are working.

```
⏭️ Skipping short transcript (<5 chars): "hi"
⏭️ Skipping short transcript (<5 chars): "you"
```

**Solution:** Speak sentences of 5+ characters.

**Why:** Prevents wasting API calls on noise/filler words.

---

## 📝 COMPLETE WORKFLOW

**To make BetaBot respond to wake phrases:**

1. **Open http://localhost:5173/**
2. **Navigate to "BetaBot" tab**
3. **Verify mode = "Co-Host"**
4. **Click "Start Session"** → Wait for session to start
5. **Click "Start Listening"** → Grant mic permissions if needed
6. **Wait for "Listening..." indicator**
7. **Speak:** "Hey Beta Bot, what is the capital of France?"
8. **Watch console** for:
   ```
   💾 Transcript saved to database: "hey beta bot what is the capital of france"
   Wake phrase detected: {phrase: "beta bot", context: "what is the capital of france"}
   🎙️ Handling wake_phrase question: "what is the capital of france"
   ✅ GPT-4 answer received: ...
   ✅ BetaBot audio playback complete
   ```
9. **BetaBot should speak** the answer

---

## 🔍 CONSOLE DEBUGGING

**Open browser console (Cmd+Option+I)** and look for these logs:

### ✅ Good Signs:
```
[SUPABASE] ✓ Client initialized
✅ Subscribed to Producer AI questions
🎤 Started Whisper transcription
💾 Transcript saved to database: "..."
Wake phrase detected: ...
🎙️ Handling wake_phrase question: "..."
✅ GPT-4 answer received: ...
✅ BetaBot audio playback complete
```

### ❌ Bad Signs:
```
❌ Backend health check failed
❌ OpenAI API key not configured
❌ Failed to save transcript to database
❌ MediaRecorder not supported
❌ Microphone access denied
```

---

## 🚀 QUICK FIX SCRIPT

**Run this to verify everything:**

```bash
# 1. Check backend
curl http://localhost:3001/api/health

# 2. Check Piper TTS
curl http://localhost:8000/voices

# 3. Restart frontend (if needed)
npm run dev
```

**Then in browser:**
1. Go to http://localhost:5173/
2. Open console (Cmd+Option+I)
3. Navigate to BetaBot tab
4. Click "Test TTS"
5. Should hear BetaBot speak

---

## 💡 TIP: Use Text Chat to Test

If wake phrase detection isn't working, **use the text chat input** as a workaround:

1. Type your question in the text box
2. Click "Send"
3. BetaBot will respond

**This tests:**
- ✅ GPT-4/Perplexity integration
- ✅ TTS functionality
- ✅ Backend connectivity

**This skips:**
- ❌ Microphone
- ❌ Speech recognition
- ❌ Wake phrase detection

**Good for isolating the problem!**

---

## 📞 STILL NOT WORKING?

**Share these details:**
1. Browser console errors (copy/paste)
2. What you said (exact phrase)
3. What mode you're in (Co-Host vs Question Generator)
4. Session status (started or not)
5. Listening status (active or not)
6. Any error messages from console

**Most common issue:** Forgetting to say "Beta Bot" or "Hey Beta Bot" before the question.

---

**Last Updated:** October 23, 2025  
**Related Docs:**
- [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md) - Database optimizations
- [CURRENT_SETUP.md](CURRENT_SETUP.md) - Full system setup
- [QUICK_START_OPTIMIZATIONS.md](QUICK_START_OPTIMIZATIONS.md) - Migration guide
