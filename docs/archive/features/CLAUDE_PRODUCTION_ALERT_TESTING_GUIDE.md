# Claude Production Alert - Testing Guide

## ✅ Implementation Complete!

The Claude Production Alert system is now fully integrated and ready to use.

## How It Works

1. **Keyword Detection**: When someone says "production" during the stream
2. **Automation Trigger**: The keyword is detected by the AutomationEngine
3. **Graphic Display**: Claude Production Alert overlay appears on broadcast
4. **Auto-Hide**: Alert automatically hides after 10 seconds
5. **Cooldown**: 30-second cooldown prevents spam

## System Architecture

```
Producer AI Transcript Stream
         ↓
betabot_conversation_log (INSERT)
         ↓
TranscriptAutomationBridge (Real-time listener)
         ↓
AutomationEngine.processTranscript()
         ↓
TriggerDetector.detectKeywordTrigger()
         ↓
Match: "production" keyword found
         ↓
ActionExecutor.execute('graphic.show')
         ↓
broadcast_graphics table (is_visible = true)
         ↓
BroadcastGraphicsDisplay (Real-time subscription)
         ↓
Claude Alert Overlay Displayed!
         ↓
Auto-hide after 10 seconds
```

## Testing Instructions

### Test 1: Manual Database Test

**Verify the graphic exists in the database:**

```sql
-- Check if graphic is registered
SELECT * FROM broadcast_graphics 
WHERE graphic_type = 'claude_production_alert';

-- Expected result: 1 row with is_visible = false
```

**Manually trigger the alert:**

```sql
-- Show the alert
UPDATE broadcast_graphics 
SET is_visible = true 
WHERE graphic_type = 'claude_production_alert';

-- Wait 10 seconds, then check it auto-hid
SELECT is_visible FROM broadcast_graphics 
WHERE graphic_type = 'claude_production_alert';
-- Expected: is_visible should still be true (no auto-hide yet, that's in HTML)

-- Hide manually
UPDATE broadcast_graphics 
SET is_visible = false 
WHERE graphic_type = 'claude_production_alert';
```

### Test 2: Trigger Rule Test

**Verify the trigger rule exists:**

```sql
-- Check if rule is registered
SELECT * FROM trigger_rules 
WHERE rule_name = 'Claude Production Alert';

-- Expected result: 1 row with:
--   enabled = true
--   trigger_type = 'keyword'
--   action_type = 'graphic.show'
```

### Test 3: End-to-End Test (Simulated)

**Insert a test transcript with "production" keyword:**

```sql
-- Simulate a user saying "production"
INSERT INTO betabot_conversation_log (
  transcript_text,
  speaker_type,
  confidence,
  created_at
) VALUES (
  'We are having a production issue',
  'user',
  1.0,
  NOW()
);
```

**What should happen:**

1. TranscriptAutomationBridge detects the INSERT
2. Processes transcript: "We are having a production issue"
3. AutomationEngine finds keyword "production"
4. Matches against trigger rule "Claude Production Alert"
5. Executes action: `graphic.show` with `graphic_type: 'claude_production_alert'`
6. Updates `broadcast_graphics` table: `is_visible = true`
7. BroadcastGraphicsDisplay subscribes to the change
8. Loads `/claude-production-alert.html` in an iframe
9. Alert animates in, shows terminal sequence
10. After 10 seconds, alert auto-hides via JavaScript

**Verify the automation event was logged:**

```sql
-- Check automation events
SELECT * FROM automation_events 
WHERE action_type = 'graphic.show'
  AND created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC 
LIMIT 1;

-- Expected: 1 row showing the triggered action
```

### Test 4: Live Stream Test

**Prerequisites:**
1. Dashboard is open at `http://localhost:5173/`
2. Broadcast view is open at `http://localhost:5173/broadcast`
3. Automation is enabled in dashboard
4. AI Automation toggle is ON

**Steps:**
1. Open the dashboard
2. Navigate to "AI Auto-Director System" section
3. Verify automation is enabled (green toggle)
4. Keep the broadcast view open in another window
5. Speak into your microphone: "We're having a production issue"
6. OR insert test data via SQL (see Test 3)

**Expected Result:**
1. Claude terminal overlay appears on broadcast view
2. Shows animated command sequence
3. "Production issue detected" → "Applying fix" → "Systems nominal"
4. Overlay fades out after 10 seconds
5. Check automation feed for the event

**Troubleshooting:**

If it doesn't work:
1. Check browser console for errors
2. Verify automation is enabled: `SELECT automation_enabled FROM automation_config LIMIT 1`
3. Check if rule is enabled: `SELECT enabled FROM trigger_rules WHERE rule_name = 'Claude Production Alert'`
4. Check automation events for errors: `SELECT * FROM automation_events WHERE outcome = 'failed' ORDER BY created_at DESC LIMIT 5`

### Test 5: Cooldown Test

**Verify cooldown works:**

```sql
-- Trigger twice in quick succession
INSERT INTO betabot_conversation_log (transcript_text, speaker_type, confidence) 
VALUES ('production issue', 'user', 1.0);

-- Wait 1 second
-- (Sleep not available in SQL, just wait manually)

INSERT INTO betabot_conversation_log (transcript_text, speaker_type, confidence) 
VALUES ('another production problem', 'user', 1.0);

-- Check automation events
SELECT 
  created_at,
  outcome,
  error_message 
FROM automation_events 
WHERE action_type = 'graphic.show'
  AND created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;

-- Expected: 
--   First insert: outcome = 'executed'
--   Second insert: outcome = 'skipped', error_message = 'Cooldown: Xs remaining'
```

## Files Created

1. `/public/claude-production-alert.html` - Animated terminal overlay
2. `/scripts/add-claude-alert-graphic.ts` - Database setup script
3. `/scripts/add-production-trigger-rule.ts` - Trigger rule setup script  
4. `/src/lib/automation/TranscriptAutomationBridge.ts` - Transcript listener integration
5. Modified: `/src/hooks/useAutomationEngine.ts` - Integrated bridge

## Configuration

**Graphic Settings:**
- Type: `claude_production_alert`
- HTML: `/claude-production-alert.html`
- Position: `fullscreen`
- Auto-hide: `true` (10 seconds)

**Trigger Rule Settings:**
- Name: `Claude Production Alert`
- Trigger: `keyword` - "production" (case-insensitive)
- Action: `graphic.show`
- Priority: `5` (normal)
- Auto-execute: `true`
- Cooldown: `30 seconds`

## Monitoring

**Watch automation events in real-time:**

```sql
-- Terminal window 1: Watch automation events
SELECT 
  created_at::time,
  trigger_type,
  action_type,
  outcome,
  execution_time_ms
FROM automation_events 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Refresh every few seconds to see new events
```

**Watch graphic state:**

```sql
-- Terminal window 2: Watch graphic visibility
SELECT 
  graphic_type,
  is_visible,
  updated_at::time
FROM broadcast_graphics 
WHERE graphic_type = 'claude_production_alert';
```

## Customization

**Change the keyword:**

```sql
UPDATE trigger_rules 
SET trigger_conditions = jsonb_set(
  trigger_conditions,
  '{keywords}',
  '["technical issue", "production"]'::jsonb
)
WHERE rule_name = 'Claude Production Alert';
```

**Change the cooldown:**

```sql
UPDATE trigger_rules 
SET cooldown_seconds = 60  -- 1 minute cooldown
WHERE rule_name = 'Claude Production Alert';
```

**Disable the alert:**

```sql
UPDATE trigger_rules 
SET enabled = false 
WHERE rule_name = 'Claude Production Alert';
```

## Success Criteria ✅

- [x] HTML overlay created with Claude terminal animation
- [x] Graphic registered in `broadcast_graphics` table
- [x] Trigger rule created in `trigger_rules` table
- [x] TranscriptAutomationBridge listening to transcripts
- [x] AutomationEngine processing keywords
- [x] ActionExecutor showing graphics
- [x] BroadcastGraphicsDisplay rendering overlay
- [x] Auto-hide after 10 seconds
- [x] Cooldown preventing spam

The system is production-ready! 🎉
