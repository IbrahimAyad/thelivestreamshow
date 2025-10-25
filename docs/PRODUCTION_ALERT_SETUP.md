# Production Alert Setup Guide

Complete setup guide for the Claude Production Alert system with keyword and hotkey triggers.

## 🎯 Overview

The Production Alert system has **two trigger methods**:

1. **Primary: Voice/Keyword Detection** (Recommended)
   - Automatically triggers when you say "production" during the stream
   - Uses AI transcription (Producer AI or Web Speech API)
   - No manual intervention needed

2. **Backup: Hotkey Trigger** (Press "P")
   - Manual fallback if voice detection fails
   - Press the "P" key during the stream
   - Only use when keyword detection doesn't work

## ✅ Setup Steps

### 1. Merge Duplicate Trigger Rules

First, consolidate the two separate production alert rules into one optimized rule:

```bash
npx tsx scripts/merge-production-triggers.ts
```

This will:
- ✅ Delete old "Production Alert Keyword" (P3) rule
- ✅ Delete old "Claude Production Alert" (P5) rule
- ✅ Create new merged "Production Alert (Keyword)" rule with all keywords
- ✅ Avoid duplicate triggers

**Expected Output:**
```
✅ MERGE COMPLETE!

📋 Final Rule Configuration:
   Name: Production Alert (Keyword)
   Priority: P3 (Normal)
   Enabled: Yes ✅
   Auto-execute: Yes ✅
   Cooldown: 30 seconds

   Trigger Keywords (any of these):
   • "production"
   • "production alert"
   • "fix production"
   • "production issue"
   • "production down"
   • "production problem"
```

### 2. Add Hotkey Trigger (Optional Backup)

Add the manual hotkey trigger as a backup:

```bash
npx tsx scripts/add-production-hotkey.ts
```

This creates a manual trigger rule for documentation purposes.

**Expected Output:**
```
✅ Hotkey trigger rule added successfully!

📋 Hotkey Configuration:
   Name: Production Alert (Hotkey Backup)
   Hotkey: Press "P" key
   Priority: P4 (Backup method)
   ⚠️  NOTE: This is a BACKUP method
   Primary method: Voice activation ("production" keyword)
```

### 3. Verify Setup

Check that everything is configured correctly:

```bash
npx tsx scripts/verify-production-trigger.ts
```

This verifies:
- ✅ HTML graphic file exists
- ✅ Graphic is registered in database
- ✅ Trigger rules are enabled
- ✅ Automation config is active
- ✅ No duplicate rules

## 🎤 How to Use

### Primary Method: Voice/Keyword Trigger

1. **Start the dashboard** and enable one of:
   - Producer AI Panel (AI transcription)
   - Transcription Panel (Web Speech API)

2. **Say any trigger keyword** during the stream:
   - "production"
   - "production alert"
   - "fix production"
   - "production issue"
   - "production down"
   - "production problem"

3. **The graphic appears automatically!**
   - Claude AI terminal animation plays
   - Shows "detecting issue → applying fix → systems nominal"
   - Auto-hides after 10 seconds

### Backup Method: Hotkey Trigger

1. **Press "P" key** during the stream
   - Works anywhere in the dashboard (unless typing in input field)
   - No modifier keys needed (just press "P")
   - Subject to 30-second cooldown

2. **The graphic appears immediately**
   - Same animation as voice trigger
   - Logs in automation events with "hotkey" source

## 🔧 Configuration

### Keyword Trigger Settings

Located in `trigger_rules` table:

```json
{
  "rule_name": "Production Alert (Keyword)",
  "trigger_type": "keyword",
  "trigger_conditions": {
    "keywords": [
      "production",
      "production alert",
      "fix production",
      "production issue",
      "production down",
      "production problem"
    ],
    "match_type": "any",
    "case_sensitive": false
  },
  "action_type": "graphic.show",
  "action_params": {
    "graphic_type": "claude_production_alert",
    "duration_seconds": 10
  },
  "enabled": true,
  "priority": 3,
  "require_operator_approval": false,
  "cooldown_seconds": 30
}
```

### Hotkey Trigger Settings

The hotkey is implemented in the dashboard code:

**File:** `src/hooks/useProductionAlertHotkey.ts`

**Default Configuration:**
```typescript
{
  enabled: true,
  key: 'p',
  requireModifier: false,  // No Ctrl/Cmd needed
  cooldownSeconds: 30
}
```

**To customize:**
```tsx
// In App.tsx
useProductionAlertHotkey({
  key: 'p',              // Change to different key
  requireModifier: true, // Require Ctrl/Cmd + P
  cooldownSeconds: 15    // Shorter cooldown
})
```

## 🎨 Graphic Details

**File:** `/public/claude-production-alert.html`

**Features:**
- Terminal-style animation
- Claude AI logo with pulse effect
- Command sequence:
  1. "detect-issue --source=transcript"
  2. "⚠️ Production issue detected"
  3. "📊 Analyzing context..."
  4. Progress bar animation
  5. "🔧 Applying production fix..."
  6. "✓ Systems optimized"
  7. "✓ Stream quality restored"
  8. "✅ All systems nominal"
- Auto-hides after 10 seconds
- Scanlines effect for retro terminal look

## 📊 System Architecture

### Keyword Trigger Flow

```
User says "production" during stream
         ↓
Producer AI / Web Speech API captures audio
         ↓
Transcript saved to betabot_conversation_log
         ↓
TranscriptAutomationBridge detects INSERT event
         ↓
Calls AutomationEngine.processTranscript()
         ↓
Queries trigger_rules for keyword type
         ↓
TriggerDetector.detectKeywordTrigger() finds match
         ↓
Creates AutomationDecision
         ↓
ActionExecutor.execute('graphic.show', {...})
         ↓
Graphic appears on broadcast overlay
         ↓
Auto-hides after 10 seconds
```

### Hotkey Trigger Flow

```
User presses "P" key
         ↓
useProductionAlertHotkey hook detects keypress
         ↓
Checks: not typing in input, cooldown expired
         ↓
Calls AutomationEngine.manualTrigger()
         ↓
Creates AutomationDecision with manual type
         ↓
ActionExecutor.execute('graphic.show', {...})
         ↓
Graphic appears on broadcast overlay
         ↓
Auto-hides after 10 seconds
```

## 🧪 Testing

### Test Keyword Trigger

1. **Enable transcription**:
   - Open Transcription Panel
   - Click "Start Listening"
   - Or enable Producer AI

2. **Say a keyword**:
   - Say "production" clearly
   - Wait 1-2 seconds for processing

3. **Verify graphic appears**:
   - Check broadcast overlay view
   - Should see Claude terminal animation

### Test Hotkey Trigger

1. **Open dashboard**
2. **Press "P" key**
3. **Verify graphic appears**
4. **Check console logs**:
   ```
   [ProductionAlertHotkey] Triggering production alert via hotkey
   [ProductionAlertHotkey] ✅ Production alert triggered successfully
   ```

### Test with Script

```bash
npx tsx scripts/test-claude-alert.ts
```

This simulates a keyword trigger and shows the graphic.

## 🐛 Troubleshooting

### Keyword Trigger Not Working

**Check 1: Is transcription enabled?**
- Producer AI Panel should show "Listening..."
- Or Transcription Panel should show "Listening"

**Check 2: Is automation enabled?**
```sql
SELECT automation_enabled, emergency_stop 
FROM automation_config 
WHERE id = '00000000-0000-0000-0000-000000000001'
```
Should show: `automation_enabled = true`, `emergency_stop = false`

**Check 3: Is the rule enabled?**
```sql
SELECT * FROM trigger_rules 
WHERE rule_name = 'Production Alert (Keyword)'
```
Should show: `enabled = true`

**Check 4: Check cooldown**
Wait 30 seconds between triggers.

**Check 5: View automation events**
```sql
SELECT * FROM automation_events 
WHERE action_type = 'graphic.show' 
ORDER BY created_at DESC 
LIMIT 5
```

### Hotkey Not Working

**Check 1: Are you typing in an input field?**
The hotkey is disabled when typing in text inputs.

**Check 2: Check console logs**
Open browser console and press "P". Should see:
```
[ProductionAlertHotkey] ⌨️ Hotkey listener active (Key: "P")
```

**Check 3: Check cooldown**
Wait 30 seconds between presses.

**Check 4: Is hook initialized?**
Search for this in console:
```
[ProductionAlertHotkey] Hotkey listener active
```

### Graphic Not Appearing

**Check 1: Is graphic registered?**
```sql
SELECT * FROM broadcast_graphics 
WHERE graphic_type = 'claude_production_alert'
```

**Check 2: Does HTML file exist?**
Check: `/public/claude-production-alert.html`

**Check 3: Check broadcast overlay view**
Open `/broadcast` in browser and manually trigger.

## 📝 Summary

✅ **Primary Activation**: Say "production" or related keywords
⌨️ **Backup Activation**: Press "P" key
🎨 **Graphic**: Claude AI terminal animation
⏱️ **Duration**: 10 seconds (auto-hide)
🔄 **Cooldown**: 30 seconds between triggers
🎯 **Priority**: P3 (Normal) for keyword, P4 (Backup) for hotkey

**Recommendation**: Rely on voice/keyword activation as primary method. Use hotkey only when voice detection fails or for manual testing.
