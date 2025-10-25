# Production Keyword Trigger - Troubleshooting Guide

## ❌ Problem: Said "production" but nothing happened

### Root Cause

The logs show:
```
useProducerAI.ts:894 📊 Producer AI: No recent transcripts found
```

**This means NO AUDIO IS BEING CAPTURED!**

The keyword trigger flow is:
```
You say "production" → ❌ NO MICROPHONE ACTIVE → ❌ NO TRANSCRIPT → ❌ NO TRIGGER
```

## ✅ Solution: Enable Audio Capture First

You must start ONE of these audio capture systems before keyword triggers can work:

### Option 1: Transcription Panel (Easiest)

**Location**: On your dashboard, scroll to "Live Transcription" panel

**Steps**:
1. Click **"Start Listening"** button (green button with microphone icon)
2. **Allow microphone permission** when browser prompts
3. **Wait for "Listening" badge** to appear (green, animated)
4. **Say "production"** - the graphic should trigger!

**Expected Logs**:
```
[TranscriptListener] Started listening
[TranscriptListener] Recognition started
[TranscriptListener] Final: production (85%)
[AutomationEngine] processTranscript() called
[TriggerDetector] Keyword matched: production
[ActionExecutor] execute('graphic.show', {...})
```

### Option 2: Audio Control Center (Advanced)

**Location**: Find "Audio Control Center" panel on dashboard

**Steps**:
1. **Select microphone** from dropdown (Step 1)
   - Choose "BlackHole 2ch" if you want to capture system audio + Discord
   - Choose your regular microphone for just your voice
   
2. **Click "Start BetaBot Session"** button
3. **Say "production"**

**Status Indicators**:
- BetaBot box should show green checkmark + "Listening"
- Microphone box should show your selected device

### Option 3: Producer AI Panel (Automatic - if working)

**Location**: Find "Producer AI" panel

**Note**: Producer AI should automatically capture audio when enabled, but based on your logs it's not receiving any transcripts. Use Option 1 or 2 instead.

## 🔍 How to Verify It's Working

### Step 1: Check Logs

Open browser console (F12) and look for these messages when you say "production":

**Good (Working)**:
```
✅ [TranscriptListener] Final: production (confidence: 0.85)
✅ [AutomationEngine] processTranscript() called
✅ [TriggerDetector] Keyword matched: production
✅ [ActionExecutor] execute('graphic.show', ...)
```

**Bad (Not Working - Current State)**:
```
❌ 📊 Producer AI: No recent transcripts found
❌ 🔇 Silence detected
```

### Step 2: Check Visual Indicators

**When audio capture is WORKING**:
- ✅ Green "Listening" badge with pulsing animation
- ✅ Transcripts appear in real-time as you speak
- ✅ Recent segments list updates

**When audio capture is NOT WORKING** (current state):
- ❌ No listening badge
- ❌ No transcripts appearing
- ❌ "No transcript yet" message

### Step 3: Test with Simple Words

Before saying "production", test with any words:

1. **Start audio capture** (Option 1 or 2 above)
2. **Say "hello testing"** 
3. **Check if text appears** in transcript panel
4. **If text appears** → Audio working! Now say "production"
5. **If no text** → Audio NOT working, check troubleshooting below

## 🐛 Troubleshooting Audio Capture

### Issue: "Start Listening" button does nothing

**Solution 1: Check microphone permission**
- Browser → Settings → Privacy → Microphone
- Make sure your site has permission
- Try refreshing the page

**Solution 2: Check browser compatibility**
- Web Speech API only works in Chrome/Edge
- Safari and Firefox not supported
- Try Chrome if using another browser

**Solution 3: Check console for errors**
```javascript
// Look for these errors:
"Microphone permission denied"
"Recognition not supported"
"Failed to access microphone"
```

### Issue: Transcripts appear but trigger doesn't fire

**Check 1: Is AI Automation enabled?**
```
Show Metadata Control → AI Automation toggle → Should be ON (purple)
```

**Check 2: Is trigger rule enabled?**
```sql
SELECT * FROM trigger_rules 
WHERE rule_name LIKE '%Production%' 
AND enabled = true
```

**Check 3: Check cooldown**
- Trigger has 30-second cooldown
- Wait 30 seconds between tests
- Check automation_events table for recent triggers

**Check 4: Check automation config**
```sql
SELECT automation_enabled, emergency_stop, allowed_action_types
FROM automation_config 
WHERE id = '00000000-0000-0000-0000-000000000001'
```
Should show:
- `automation_enabled = true`
- `emergency_stop = false`
- `allowed_action_types` includes `'graphic.show'`

### Issue: Microphone captures but transcript shows gibberish

**This is normal!** Web Speech API can be inaccurate. Just make sure it captures SOMETHING when you speak.

**Tips for better accuracy**:
- Speak clearly and slowly
- Reduce background noise
- Use a good quality microphone
- Say "production" distinctly

## 📊 System Check Script

Run this to check all systems:

```javascript
// Paste in browser console
console.log('=== Audio Capture System Check ===');

// 1. Check if microphone is available
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone: Available'))
  .catch(err => console.error('❌ Microphone:', err.message));

// 2. Check Web Speech API
const hasSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
console.log(hasSpeechAPI ? '✅ Web Speech API: Supported' : '❌ Web Speech API: NOT supported');

// 3. Check Automation Engine status
// (This assumes useAutomationEngine hook is mounted)
console.log('Check dashboard for AutomationEngine state');
```

## 🎯 Quick Start Checklist

Before testing "production" keyword trigger:

- [ ] **Enable AI Automation** in Show Metadata Control (toggle should be ON/purple)
- [ ] **Click "Start Listening"** in Transcription Panel (or Audio Control Center)
- [ ] **Allow microphone permission** when prompted
- [ ] **Verify "Listening" badge** appears (green, pulsing)
- [ ] **Test with any word** ("hello") to confirm transcript appears
- [ ] **Say "production"** clearly
- [ ] **Wait for graphic** to appear (10 seconds duration)

## 🔄 Complete Flow (When Working Correctly)

```
1. User enables AI Automation toggle
         ↓
2. User clicks "Start Listening" in Transcription Panel
         ↓
3. Browser requests microphone permission
         ↓
4. User allows permission
         ↓
5. TranscriptListener activates Web Speech API
         ↓
6. User says "production"
         ↓
7. Web Speech API captures audio → text: "production"
         ↓
8. TranscriptListener sends to AutomationEngine.processTranscript()
         ↓
9. AutomationEngine queries trigger_rules for keyword='production'
         ↓
10. TriggerDetector.detectKeywordTrigger() finds match
         ↓
11. Creates AutomationDecision with action='graphic.show'
         ↓
12. ActionExecutor.execute() shows claude_production_alert graphic
         ↓
13. Graphic appears on broadcast overlay for 10 seconds
         ↓
14. Auto-hides after duration
```

## 📝 Current State vs Expected State

### Current State (From Your Logs)
```
❌ No audio capture active
❌ Producer AI finding no transcripts
❌ Silence detection running
❌ No keyword triggers firing
```

### Expected State (After Fix)
```
✅ Transcription Panel listening
✅ Producer AI receiving transcripts
✅ Keyword triggers active
✅ "production" triggers graphic immediately
```

## 🚀 Next Steps

1. **Right now**: Scroll to **Transcription Panel** on your dashboard
2. **Click**: **"Start Listening"** button (big green button)
3. **Allow**: Microphone permission
4. **Test**: Say "hello" - verify transcript appears
5. **Trigger**: Say "production" - graphic should show!

If transcripts appear but graphic doesn't trigger, check:
- AI Automation is ON (purple toggle in Show Metadata)
- Auto-Director is enabled
- No emergency stop active
- Trigger rule exists and is enabled

## 💡 Pro Tip

**Keep Transcription Panel visible** while streaming so you can see what's being captured in real-time. This helps debug any trigger issues.

You can also check `automation_events` table to see if triggers are firing:

```sql
SELECT created_at, trigger_type, action_type, outcome, error_message
FROM automation_events
ORDER BY created_at DESC
LIMIT 10
```

---

**TL;DR**: You need to click "Start Listening" in the Transcription Panel first before any keyword triggers will work!
