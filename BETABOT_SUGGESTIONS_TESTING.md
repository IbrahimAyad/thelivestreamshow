# BetaBot Suggestions Testing Guide

**Date:** October 16, 2025
**Feature:** BetaBot Conversation Helper - Automatic Question Generation
**Status:** ✅ Complete - Ready for Testing
**Commit:** 8eab126

---

## What Was Built

### Complete Conversation Helper Integration

BetaBot now automatically generates insightful questions from stream conversation and presents them for manual review before appearing on the broadcast overlay.

**Key Features:**
1. **Silent Question Generation** - BetaBot listens to conversation and generates questions in the background
2. **Manual Review Queue** - Questions appear in "🤖 BetaBot Suggestions" section for approval
3. **Popup Queue Integration** - Approved questions move to Popup Queue Manager
4. **TTS Playback** - Questions appear as popups with text-to-speech when triggered
5. **Context Display** - Shows what conversation triggered each question

---

## How It Works

### 1. Question Generation Flow

```
Stream Conversation (via Whisper API)
            ↓
    Conversation Buffer (50+ words)
            ↓
    Auto-generate questions (60s interval)
            ↓
    Store in database:
      - source: 'betabot_conversation_helper'
      - show_on_overlay: false
      - position: 9999
            ↓
    🤖 BetaBot Suggestions section (NEW!)
            ↓
    Manual Review & Approval
            ↓
    "Add to Queue" button clicked
            ↓
    Popup Queue Manager (position: 0)
            ↓
    User triggers popup manually
            ↓
    Broadcast Overlay + TTS Playback
```

### 2. Database Schema

Questions stored in `show_questions` table:

```sql
{
  id: uuid,
  topic: 'BetaBot Suggestion',
  question_text: 'What is artificial intelligence?',
  source: 'betabot_conversation_helper',  -- NEW field identifies BetaBot questions
  context_metadata: {                      -- NEW JSONB field
    generated_from: 'last 200 chars of conversation',
    generated_at: '2025-10-16T13:00:00.000Z',
    session_id: 'uuid',
    word_count: 150
  },
  show_on_overlay: false,                 -- Not shown until manually approved
  tts_generated: false,
  position: 9999                           -- Put at end initially
}
```

### 3. User Interface

**New "🤖 BetaBot Suggestions" Section:**

```
┌──────────────────────────────────────────────┐
│ 🤖 BetaBot Suggestions      [3 pending]     │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ What is the difference between AI and   │ │
│ │ machine learning?                        │ │
│ │                                          │ │
│ │ Context: "...we were talking about AI..." │
│ │ Generated 1:23:45 PM • 150 words analyzed │
│ │                                          │ │
│ │              [➕ Add to Queue]  [✕]      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Can you explain neural networks in      │ │
│ │ simple terms?                            │ │
│ │ ...                                      │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Features:**
- Shows up to 10 most recent suggestions
- Real-time updates (Supabase subscription)
- Context snippet showing what triggered the question
- Generation timestamp and word count
- Two actions: Add to Queue or Dismiss

---

## Testing Instructions

### Pre-Test Setup

**1. Verify Environment Variables:**
```bash
# Check .env file has these keys:
VITE_OPENAI_API_KEY=sk-proj-...          # For Whisper API
VITE_GOOGLE_GEMINI_API_KEY=AI...        # For question generation
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

**2. Verify Database:**
- Open Supabase dashboard
- Check `show_questions` table has columns:
  - `source` (text)
  - `context_metadata` (jsonb)

**3. Start Dev Server:**
```bash
cd /Users/ibrahim/thelivestreamshow
pnpm run dev
# Open http://localhost:5173
```

**4. Open Browser Tools:**
- Press F12 to open Developer Tools
- Go to **Console** tab
- Keep visible throughout testing

---

## Test Cases

### Test 1: Start BetaBot Session

**Steps:**
1. Navigate to dashboard at http://localhost:5173
2. Find "Beta Bot AI Co-Host" panel
3. Click **"▶️ Start Session"** button

**Expected Results:**
- ✅ Status changes to "🎙️ Listening"
- ✅ Microphone permission granted
- ✅ Console shows:
  ```
  🎤 startListening() called
  🎤 Whisper available: true
  🎤 OpenAI API Key configured: true
  🎤 Attempting to start Whisper API mode...
  ✅ Microphone access granted
  ▶️ MediaRecorder started recording
  ```
- ✅ "Latest Transcript" box appears
- ✅ Session ID displays

**If Fails:** Check microphone permissions, API keys, console errors

---

### Test 2: Speech Recognition & Transcription

**Steps:**
1. With session active, speak clearly into microphone:
   > "Testing one two three. BetaBot is now listening to our stream."
2. Wait 10 seconds (for Whisper processing)
3. Speak more:
   > "Today we're discussing artificial intelligence and machine learning."
4. Wait 10 seconds again

**Expected Results:**
- ✅ Console shows every 10 seconds:
  ```
  📼 Audio data received: 145628 bytes
  ⏱️ 10-second interval triggered
  🔄 processAudioChunk() called
  📡 Sending to Whisper API...
  ✅ Whisper transcription received: Testing one two three...
  ```
- ✅ "Latest Transcript" box updates with your words
- ✅ Word count increases in "Conversation Buffer Stats"
- ✅ "Building Context" status shows word count

**If Fails:**
- Microphone muted? Check system settings
- Small audio blobs? Speak louder
- API errors? Check OpenAI billing
- See `SPEECH_RECOGNITION_DIAGNOSTIC.md` for detailed troubleshooting

---

### Test 3: Automatic Question Generation

**Steps:**
1. Continue speaking to build conversation buffer (need 50+ words)
2. Talk about a specific topic, e.g.:
   > "Artificial intelligence is transforming how we work. Machine learning algorithms can now process massive amounts of data. Neural networks are inspired by the human brain."
3. Wait 60 seconds (default auto-generation interval)
4. Watch console for:
   ```
   🤖 Auto-generating questions from conversation buffer...
   ✅ Generated 3 questions from conversation
   ```

**Expected Results:**
- ✅ Console shows question generation triggered
- ✅ Console shows successful database insert
- ✅ "🤖 BetaBot Suggestions" section appears below session controls
- ✅ Section shows "X pending" badge
- ✅ Generated questions display as cards
- ✅ Each card shows:
  - Question text
  - Context snippet (last 80 chars of conversation)
  - Generation timestamp
  - Word count analyzed
  - Two buttons: "➕ Add to Queue" and "✕"

**If Fails:**
- Not enough words? Keep talking until buffer shows 50+
- Gemini API error? Check API key and billing
- Questions not appearing? Check Supabase connection
- Check console for "❌ Failed to generate questions" errors

---

### Test 4: BetaBot Suggestions Display

**Steps:**
1. Look at the "🤖 BetaBot Suggestions" section
2. Verify each suggestion card shows:
   - Clear question text
   - Context snippet with quotes
   - Timestamp (e.g., "Generated 1:30:45 PM")
   - Word count (e.g., "150 words analyzed")
3. Hover over a suggestion card
4. Hover over the "➕ Add to Queue" button
5. Hover over the "✕" dismiss button

**Expected Results:**
- ✅ Section has yellow accent color (#facc15)
- ✅ Cards have dark background with border
- ✅ Hover over card: Border color changes to yellow
- ✅ Hover over "Add to Queue": Green gradient brightens, slight lift effect
- ✅ Hover over "✕": Red background becomes more opaque
- ✅ All text is readable with good contrast
- ✅ Layout is clean and organized

**If Fails:** Check CSS is loading, clear browser cache

---

### Test 5: Dismiss Suggestion

**Steps:**
1. Click the **"✕"** button on one of the suggestions
2. Watch console for:
   ```
   ✅ Dismissed suggestion
   ```
3. Observe the UI

**Expected Results:**
- ✅ Suggestion card disappears from list immediately
- ✅ Pending count decreases by 1
- ✅ Console shows success message
- ✅ No errors in console

**Verify in Database:**
1. Open Supabase dashboard
2. Go to Table Editor → `show_questions`
3. Filter: `source = 'betabot_conversation_helper'`
4. Verify: Dismissed question is no longer in database

**If Fails:** Check Supabase permissions, console for errors

---

### Test 6: Add Suggestion to Popup Queue

**Steps:**
1. Click the **"➕ Add to Queue"** button on one of the suggestions
2. Watch console for:
   ```
   ✅ Question added to Popup Queue Manager
   ```
3. Observe the UI
4. Scroll down to find the **"Popup Queue Manager"** panel
5. Look for your question in the queue

**Expected Results:**
- ✅ Suggestion card disappears from "🤖 BetaBot Suggestions" section
- ✅ Pending count decreases by 1
- ✅ Console shows success message
- ✅ Question appears in Popup Queue Manager panel
- ✅ Question is at the top of the queue (position 0)

**Verify in Database:**
1. Open Supabase dashboard
2. Go to Table Editor → `show_questions`
3. Find the question (search by text)
4. Verify:
   - `source = 'betabot_conversation_helper'`
   - `show_on_overlay = false` (not triggered yet)
   - `position = 0` (top of queue)

**If Fails:**
- Not appearing in queue? Check Popup Queue Manager is loading questions
- Position wrong? Check database update succeeded
- Console errors? Check Supabase connection

---

### Test 7: Trigger Popup from Queue

**Steps:**
1. In the **Popup Queue Manager** panel, find the BetaBot question
2. Click the **"Show"** button next to the question
3. Watch the broadcast overlay area (or open overlay view if separate)
4. Listen for TTS playback

**Expected Results:**
- ✅ Popup appears on broadcast overlay with:
  - Question text displayed prominently
  - Animated entrance (slide-in or fade-in)
  - Topic label: "BetaBot Suggestion"
  - Timer/progress bar showing duration
  - Play/Next/Dismiss buttons
- ✅ TTS voice speaks the question out loud
- ✅ Console shows:
  ```
  🔊 Playing TTS for question: [question text]
  ```
- ✅ Popup auto-dismisses after duration (default 15s)
- ✅ Question removed from Popup Queue Manager after showing

**Verify in Database:**
1. Open Supabase dashboard
2. Find the question in `show_questions`
3. Verify:
   - `show_on_overlay = false` (reset after showing)
   - `overlay_triggered_at` has timestamp

**If Fails:**
- Popup not appearing? Check BroadcastOverlay is subscribed to database changes
- TTS not playing? Check browser Speech Synthesis support
- No audio? Check system volume, browser audio permissions

---

### Test 8: Real-Time Subscription

**Steps:**
1. Keep the dashboard open with BetaBot session running
2. Open a second browser tab
3. Go to Supabase dashboard → Table Editor → `show_questions`
4. Manually insert a new row:
   ```json
   {
     "topic": "BetaBot Suggestion",
     "question_text": "Manual test question from database",
     "source": "betabot_conversation_helper",
     "context_metadata": {
       "generated_from": "test",
       "generated_at": "2025-10-16T13:00:00.000Z",
       "session_id": "test",
       "word_count": 50
     },
     "show_on_overlay": false,
     "tts_generated": false,
     "position": 9999
   }
   ```
5. Click "Insert row"
6. Immediately switch back to the dashboard tab

**Expected Results:**
- ✅ Within 1-2 seconds, the new question appears in "🤖 BetaBot Suggestions"
- ✅ Pending count increases by 1
- ✅ No page refresh required
- ✅ Console shows:
  ```
  (Supabase subscription event received)
  ```

**If Fails:**
- Not appearing? Check Supabase Real-time is enabled on database
- Delayed? Check network connection
- Check browser console for subscription errors

---

### Test 9: Multiple Suggestions Management

**Steps:**
1. Generate multiple questions (speak for 2-3 minutes, wait for auto-generation)
2. Or manually insert 3-5 test questions in database
3. Verify "🤖 BetaBot Suggestions" section displays all
4. Click "Add to Queue" on the first question
5. Click "Dismiss" on the second question
6. Click "Add to Queue" on the third question
7. Check Popup Queue Manager

**Expected Results:**
- ✅ Section displays up to 10 suggestions
- ✅ If more than 10, section scrolls vertically (max-height: 400px)
- ✅ Each action updates the list immediately
- ✅ Pending count updates correctly after each action
- ✅ Questions added to queue appear in Popup Queue Manager
- ✅ Dismissed questions are gone from everywhere
- ✅ Remaining questions stay in "🤖 BetaBot Suggestions"

**If Fails:** Check state management, console for errors

---

### Test 10: Complete End-to-End Flow

**Full workflow test - the ultimate verification!**

**Steps:**
1. **Start session** → Click "▶️ Start Session"
2. **Build conversation** → Speak about a topic for 1-2 minutes
3. **Wait for generation** → Let auto-generate trigger (60s)
4. **Review suggestions** → Check "🤖 BetaBot Suggestions" section
5. **Add to queue** → Click "➕ Add to Queue" on best question
6. **Open Popup Queue** → Scroll to Popup Queue Manager panel
7. **Trigger popup** → Click "Show" on the BetaBot question
8. **Watch overlay** → Popup displays with animation
9. **Listen to TTS** → Question is spoken out loud
10. **Wait for dismiss** → Popup auto-dismisses after duration
11. **End session** → Click "⏹ End Session"

**Expected Results:**
- ✅ Every step works smoothly without errors
- ✅ Question flows through entire pipeline:
  - Conversation → Generation → Suggestions → Queue → Popup → TTS
- ✅ User has full control at each approval step
- ✅ No manual database intervention needed
- ✅ Console logs show clean execution throughout
- ✅ Session summary displays at end with:
  - Total interactions
  - Questions generated
  - Transcript available for export

**🎉 If this works, BetaBot Conversation Helper is fully functional!**

---

## Common Issues & Fixes

### Issue #1: Suggestions Not Appearing

**Symptoms:** Questions generated but not showing in UI

**Possible Causes:**
1. Database query filter wrong
2. Supabase subscription not connected
3. State not updating

**Fix:**
1. Check console for "Failed to load BetaBot suggestions" errors
2. Open Supabase dashboard → `show_questions` table
3. Verify rows exist with `source = 'betabot_conversation_helper'`
4. Check browser console for subscription errors
5. Try clicking "End Session" then "Start Session" to reload component

### Issue #2: "Add to Queue" Not Working

**Symptoms:** Button clicks but nothing happens

**Possible Causes:**
1. Database update failing
2. Supabase permissions issue
3. Network error

**Fix:**
1. Check console for "Error adding question to queue"
2. Verify Supabase RLS policies allow UPDATE on `show_questions`
3. Check network tab in DevTools for failed requests
4. Try manually updating position in Supabase dashboard to test permissions

### Issue #3: Popup Queue Manager Not Showing Question

**Symptoms:** Added to queue but not appearing in manager

**Possible Causes:**
1. Popup Queue Manager not reloading
2. Filter excluding BetaBot questions
3. Position update didn't apply

**Fix:**
1. Refresh the page (Popup Queue Manager loads on mount)
2. Check `show_questions` table in Supabase - verify `position = 0`
3. Check PopupQueuePanel.tsx isn't filtering out `source = 'betabot_conversation_helper'`
4. Try clicking a different question in queue to trigger reload

### Issue #4: Questions Auto-Generating Too Fast/Slow

**Symptoms:** Too many or too few questions

**Fix:**
1. Adjust `autoQuestionGenInterval` state (default 60 seconds):
   - In BetaBotControlPanel.tsx, change line:
     ```typescript
     const [autoQuestionGenInterval, setAutoQuestionGenInterval] = useState(60);
     ```
   - Increase for fewer questions (e.g., 120 for 2 minutes)
   - Decrease for more questions (e.g., 30 for 30 seconds)

2. Adjust minimum word count threshold:
   - In handleGenerateQuestions(), change condition:
     ```typescript
     if (speechRecognition.conversationBuffer.split(/\s+/).length < 50) return;
     ```
   - Increase for more context (e.g., 100 words)
   - Decrease for faster generation (e.g., 30 words)

### Issue #5: Context Snippet Too Long/Short

**Symptoms:** Context showing too much or too little text

**Fix:**
1. In question generation code (line ~550), adjust substring length:
   ```typescript
   generated_from: speechRecognition.conversationBuffer.substring(
     Math.max(0, speechRecognition.conversationBuffer.length - 200) // Change 200
   )
   ```
2. In UI display (line ~1037), adjust substring in render:
   ```typescript
   Context: "{suggestion.context_metadata.generated_from.substring(0, 80)}..."
   ```

---

## Success Indicators

### Visual Indicators
- ✅ "🤖 BetaBot Suggestions" section is visible with yellow theme
- ✅ Pending badge shows correct count
- ✅ Suggestion cards are well-formatted and readable
- ✅ Hover effects work on buttons
- ✅ Actions remove cards from view immediately

### Functional Indicators
- ✅ Questions auto-generate every 60 seconds when buffer has 50+ words
- ✅ Real-time subscription updates UI within 1-2 seconds
- ✅ "Add to Queue" moves question to Popup Queue Manager
- ✅ "Dismiss" removes question from database
- ✅ Popup displays on broadcast overlay when triggered
- ✅ TTS plays the question out loud

### Technical Indicators
- ✅ Console shows no errors during operation
- ✅ Database has correct `source` and `context_metadata` values
- ✅ Supabase subscriptions are active (check console)
- ✅ API calls succeed (200 OK responses)
- ✅ State updates are instant and smooth

---

## Next Steps After Testing

### If Everything Works:
1. ✅ BetaBot Conversation Helper is production-ready!
2. Consider tweaking:
   - Auto-generation interval (60s default)
   - Minimum word count threshold (50 words default)
   - Context snippet length (200 chars stored, 80 displayed)
   - Number of questions generated per batch (currently 3)
   - Max suggestions displayed (currently 10)

### Future Enhancements (Not Yet Implemented):
- [ ] Pre-generate TTS audio for suggestions (faster popup display)
- [ ] Add "Edit Question" button to modify text before adding to queue
- [ ] Add "Add All to Queue" bulk action
- [ ] Add "Dismiss All" bulk action
- [ ] Add question priority/importance scoring
- [ ] Add audience Q&A integration (future feature)
- [ ] Add analytics tracking for question performance

---

## File References

**Modified Files:**
- `/src/components/BetaBotControlPanel.tsx` - Main UI and logic (246 lines changed)

**Related Files:**
- `/src/hooks/useSpeechRecognition.ts` - Speech recognition with Whisper API
- `/src/hooks/useBetaBotAI.ts` - Question generation with Gemini Pro
- `/src/hooks/usePerplexitySearch.ts` - Visual search integration
- `/src/components/PopupQueuePanel.tsx` - Popup queue management
- `/src/components/BetaBotPopup.tsx` - Popup display component
- `/src/components/BroadcastOverlayView.tsx` - Overlay with TTS playback

**Documentation:**
- `SPEECH_RECOGNITION_DIAGNOSTIC.md` - Speech recognition troubleshooting
- `API_KEYS_CONFIGURED.md` - API setup and configuration
- `FIXES_COMPLETE.md` - Recent bug fixes

**Database:**
- Table: `show_questions`
- New fields: `source`, `context_metadata`

---

## Testing Checklist

Use this for systematic testing:

### Pre-Test
- [ ] Dev server running at http://localhost:5173
- [ ] Browser DevTools open (F12 → Console)
- [ ] Microphone connected and working
- [ ] All API keys configured in .env
- [ ] Supabase database accessible

### Session Start
- [ ] Click "Start Session" button
- [ ] Microphone permission granted
- [ ] Status shows "🎙️ Listening"
- [ ] Console shows successful initialization
- [ ] Session ID displayed

### Speech Recognition
- [ ] Speak clearly into microphone
- [ ] Wait 10 seconds for processing
- [ ] Latest transcript updates with words
- [ ] Conversation buffer builds up
- [ ] Word count increases

### Question Generation
- [ ] Build 50+ word conversation buffer
- [ ] Wait 60 seconds for auto-generation
- [ ] Console shows generation triggered
- [ ] "🤖 BetaBot Suggestions" section appears
- [ ] Questions display correctly with context

### Suggestions Management
- [ ] Click "Add to Queue" on a question
- [ ] Question disappears from suggestions
- [ ] Question appears in Popup Queue Manager
- [ ] Click "Dismiss" on another question
- [ ] Question removed from view and database

### Popup Display
- [ ] Trigger popup from Popup Queue Manager
- [ ] Popup appears on broadcast overlay
- [ ] TTS plays question audio
- [ ] Popup auto-dismisses after duration

### Real-Time Updates
- [ ] Manually insert question in database
- [ ] Question appears in UI within 1-2 seconds
- [ ] No page refresh needed

### End Session
- [ ] Click "End Session" button
- [ ] Status changes to "Stopped"
- [ ] Session summary displays
- [ ] Transcript available for export

---

**Status:** ✅ Implementation Complete
**Commit:** 8eab126
**Repository:** https://github.com/IbrahimAyad/thelivestreamshow
**Dev Server:** http://localhost:5173

**Ready to test! 🚀**
