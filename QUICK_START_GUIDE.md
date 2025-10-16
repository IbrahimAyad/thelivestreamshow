# Beta Bot - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Development Server

```bash
cd /Users/ibrahim/thelivestreamshow
pnpm run dev
```

Server will start at: **http://localhost:5173**

### 2. Open Control Dashboard

Navigate to: **http://localhost:5173**

You should see the "Stream Enhancement Dashboard" with all panels.

### 3. Locate Beta Bot Panel

Scroll down to the **"Discussion Show Production Tools"** section.

Find the **"🤖 Beta Bot AI Co-Host"** panel.

---

## 🎯 Test Beta Bot Automation

### Test 1: Start a Session

1. Click **"▶️ Start Session"** button
2. Grant microphone permissions when prompted
3. Watch for:
   - Status indicator changes to "Listening" (yellow pulse)
   - Session timer starts counting
   - "Auto-Generation Active" status appears (green box)
   - Session info shows: Time, Questions (0), Interactions (0), Words (0)

**Expected Result:** ✅ Session started, microphone active

---

### Test 2: Automatic Question Generation

1. **Speak into your microphone** for 30-60 seconds
   - Talk about any topic (e.g., "I've been thinking about how AI is changing the world...")
   - Watch the "Latest Transcript" box - should show your speech being transcribed
2. **Wait for word count** to reach 50+ words
   - Check the "Words" counter in Session Info
   - Status badge should change from "Building Context" (orange) to "Ready" (green)
3. **Wait 60 seconds** for automatic generation
   - Console log will show: "🤖 Auto-generating questions from conversation buffer..."
   - After a few seconds, questions will appear in "Recent Generated Questions" preview

**Expected Result:** ✅ Questions auto-generated and added to list

**Verification:**
- Check "Recent Generated Questions" preview at bottom
- Check console for: "✅ Generated X questions and added to queue"
- Questions counter increments

---

### Test 3: Wake Phrase Detection

1. Say into microphone: **"Hey Beta Bot, what is artificial intelligence?"**
2. Watch for:
   - Status changes to "Speaking" (red pulse)
   - Console shows: "🎙️ Wake phrase "hey beta bot" detected!"
   - Console shows: "🟢 Routing to GPT-4 for general question"
   - Beta Bot speaks response aloud
   - Chat history shows the Q&A
   - Interactions counter increments

**Expected Result:** ✅ Wake phrase detected, GPT-4 responds, TTS speaks

**Alternative Test (Real-time Question):**
Say: **"Hey Beta Bot, what's the weather today?"**
- Should route to Perplexity AI (red indicator)
- Console shows: "🔴 Routing to Perplexity AI for real-time data"

---

### Test 4: Visual Search Command

1. Say into microphone: **"Show me images of quantum computers"**
2. Watch for:
   - Console shows: "🔍 Visual search command detected!"
   - Perplexity API searches for images
   - Open broadcast overlay in new tab: **http://localhost:5173/broadcast**
   - Images should appear on right side of broadcast overlay
   - Carousel auto-advances every few seconds

**Expected Result:** ✅ Visual content displayed on broadcast overlay

---

### Test 5: Text Chat (Alternative to Voice)

1. Type in "💬 Text Chat" input: **"What is machine learning?"**
2. Click **"Send ➤"** or press Enter
3. Watch for:
   - Same flow as wake phrase detection
   - Beta Bot reads your question aloud
   - Beta Bot responds
   - Chat history updated

**Expected Result:** ✅ Text chat works same as wake phrase

---

### Test 6: End Session

1. Click **"⏹ End Session"** button
2. Watch for:
   - Status changes to "Ready" (idle)
   - Console prints session summary:
     ```
     ✅ Session ended successfully:
       - Duration: Xm Xs
       - Questions Generated: X
       - Direct Interactions: X
       - Words Transcribed: X
     ```
   - Session history panel updates with new session

**Expected Result:** ✅ Session ended, metrics saved, state cleared

---

## 🎛️ OBS Integration

### Add Broadcast Overlay to OBS

1. **Open OBS Studio**
2. **Add Browser Source:**
   - Sources → Add → Browser
   - Name: "Beta Bot Overlay"
3. **Configure:**
   - URL: `http://localhost:5173/broadcast`
   - Width: `1920`
   - Height: `1080`
   - FPS: `30`
   - ✅ Control audio via OBS
   - ✅ Shutdown source when not visible
4. **Position:**
   - Should be top layer (above your camera/screen capture)
   - Transparent background allows camera/screen to show through

### What You'll See on Overlay

- **Beta Bot Avatar** - Top-right corner
  - Idle: Subtle floating animation
  - Listening: Yellow pulsing glow + sound waves
  - Speaking: Mouth animates + red glow
  - Eyes follow mouse cursor

- **Visual Content Panel** - Right side (when search triggered)
  - Image carousel
  - Auto-advances
  - Auto-hides after 60 seconds

- **Other Overlays** - As configured in control panel
  - Question banners
  - Lower thirds
  - Graphics (LIVE, BRB, etc.)

---

## 📊 Monitor Activity

### Console Logs to Watch

**Automatic Question Generation:**
```
🤖 Auto question generation: Enabled (every 60s)
⏰ Auto-generating questions based on conversation...
✅ Generated 3 questions and added to queue
```

**Wake Phrase Detection:**
```
🎙️ Wake phrase "hey beta bot" detected! Context: "what is AI?"
🟢 Routing to GPT-4 for general question
✅ Got response in 1234ms: "Artificial Intelligence..."
```

**Visual Search:**
```
🔍 Visual search command detected! Query: "quantum computers"
✅ Visual search results displayed
```

**Session End:**
```
🛑 Ending Beta Bot session...
✅ Session ended successfully:
  - Duration: 3m 42s
  - Questions Generated: 5
  - Direct Interactions: 2
  - Words Transcribed: 312
```

---

## 🔧 Troubleshooting

### Issue: No Transcription

**Check:**
- Microphone permissions granted
- Console shows no errors
- Try different browser (Chrome/Edge best)
- Check `VITE_OPENAI_API_KEY` in `.env` file

**Fix:**
- Whisper API might be down, will auto-fallback to browser speech recognition
- Console will show: "Whisper API failed multiple times, switching to browser fallback"

---

### Issue: No Questions Generated

**Check:**
- Word count reached 50+ words (check Session Info → Words)
- Auto-generation status shows "Ready" (green)
- Console shows auto-generation logs

**Fix:**
- Speak more to build up conversation buffer
- Click "⚡ Generate Now" to manually trigger

---

### Issue: Wake Phrase Not Detected

**Check:**
- Say the wake phrase clearly: "Hey Beta Bot"
- Check transcript box shows your speech
- Console logs transcription

**Fix:**
- Try text chat instead (same functionality)
- Wake phrases are case-insensitive
- Must have at least 3 characters after wake phrase

---

### Issue: TTS Not Speaking

**Check:**
- Browser supports Web Speech API
- Voice selected in dropdown (Browser Voices mode)
- Volume not muted

**Fix:**
- Click "🎵 Test Voice" button
- Try different voice from dropdown
- Check browser audio settings

---

### Issue: Visual Search Not Showing

**Check:**
- Broadcast overlay open in separate tab/OBS
- Console shows search was triggered
- Check `VITE_PERPLEXITY_API_KEY` in `.env`

**Fix:**
- Refresh broadcast overlay page
- Check Supabase real-time connection

---

## 🎮 Keyboard Shortcuts

While using the dashboard:

**Soundboard:**
- F1: Applause
- F2: Laughter
- F3: Cheers
- F4: Gasps
- F5: Agreement
- F6: Thinking

**Segments:**
- Ctrl+1: Intro
- Ctrl+2: Part 1
- Ctrl+3: Part 2
- Ctrl+4: Part 3
- Ctrl+5: Outro

**Emergency:**
- Esc: Clear all overlays (with confirmation)

---

## 📈 Success Metrics

After a successful test session, you should have:

✅ **In Console:**
- Multiple "Auto-generating questions" logs
- At least 1 wake phrase detection
- Session end summary with metrics

✅ **In UI:**
- 3-5 questions in preview list
- 1-2 interactions in chat history
- Session history entry

✅ **In Database:**
- New entry in `betabot_sessions` table
- Multiple entries in `betabot_generated_questions`
- Multiple entries in `betabot_conversation_log`
- At least 1 entry in `betabot_interactions`

✅ **In OBS:**
- Beta Bot avatar visible
- Animations working
- Audio playing from overlay

---

## 🚀 Go Live!

Once testing is complete:

1. **Generate Pre-Show Questions:**
   - Do a 2-3 minute test session talking about show topic
   - Let auto-generation create questions
   - Review questions in show prep panel

2. **Configure OBS:**
   - Add broadcast overlay source
   - Test audio from browser source
   - Position overlays

3. **Start Live Session:**
   - Click "Start Session" in control panel
   - Beta Bot will auto-generate questions throughout stream
   - Use wake phrase for interactive Q&A
   - Use visual search to show relevant images

4. **Monitor During Stream:**
   - Watch auto-generation status
   - Check word count is building
   - Review generated questions
   - End session when done

---

## 📝 Notes

- **API Usage:** Auto-generation runs every 60s, wake phrase is instant
- **Cost:** ~$3-7 per hour of active use (OpenAI + Gemini + Perplexity)
- **Performance:** Local F5-TTS recommended for best voice quality
- **Backup:** Browser TTS always available as fallback

---

**Need Help?**
- Check console for detailed logs
- Review `BETABOT_AUTOMATION_COMPLETE.md` for technical details
- All errors are logged and handled gracefully

**Enjoy your AI co-host!** 🤖🎙️
