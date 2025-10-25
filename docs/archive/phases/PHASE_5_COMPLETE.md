# Phase 5: Keyword Detection - COMPLETE ✅

## Overview

Phase 5 implements real-time speech recognition and keyword-based automation triggers using the browser's built-in Web Speech API. Operators and hosts can now speak commands like "camera 2", "show graphic", or "beta bot excited" to trigger automation actions automatically.

**Status:** ✅ **COMPLETE**
**Completion Date:** January 2025

---

## What Was Built

### 1. TranscriptListener Service (`/src/lib/transcription/TranscriptListener.ts`)

Real-time speech recognition service that:
- Captures microphone audio continuously
- Converts speech to text using Web Speech API
- Maintains transcript history with confidence scores
- Detects keywords and triggers automation
- Provides observer pattern for UI updates
- Auto-restarts on connection loss
- Supports Chrome and Edge browsers

**Key Features:**
- Continuous listening with auto-restart
- Separate interim and final results
- Confidence scoring for each transcript segment
- Memory-efficient (keeps last 100 segments)
- Callback-based notifications
- Start/stop controls
- Status monitoring

### 2. Keyword Detection Integration

Extended `AutomationEngine` with keyword processing:
- Added `processTranscript()` method
- Queries keyword trigger rules from database
- Normalizes transcript for matching
- Passes to TriggerDetector for rule evaluation
- Respects confidence thresholds
- Honors rate limits and cooldowns

### 3. TranscriptionPanel UI Component (`/src/components/TranscriptionPanel.tsx`)

Dashboard panel for controlling transcription:
- Start/Stop listening buttons
- Real-time transcript display
- Confidence score indicators
- Interim vs final result visualization
- Browser compatibility detection
- Help text and usage instructions
- Statistics (segment count, keyword detection status)
- Clear transcript button

### 4. Hook Integration

Updated `useAutomationEngine` hook:
- Creates TranscriptListener instance
- Injects AutomationEngine reference
- Provides transcriptListener to components
- Manages lifecycle (mount/unmount)

---

## How It Works

### Speech Recognition Flow

```
┌─────────────────┐
│   Microphone    │
└────────┬────────┘
         │
         │ Audio Stream
         ▼
┌─────────────────────────┐
│ Web Speech API          │
│ (Chrome/Edge built-in)  │
└────────┬────────────────┘
         │
         │ Interim Results (real-time)
         │ Final Results (confirmed)
         ▼
┌─────────────────────────┐
│  TranscriptListener     │
│  - Normalizes text      │
│  - Stores segments      │
│  - Triggers callbacks   │
└────────┬────────────────┘
         │
         │ Normalized Transcript
         ▼
┌─────────────────────────┐
│  AutomationEngine       │
│  - Queries keyword rules│
│  - Checks conditions    │
│  - Creates decisions    │
└────────┬────────────────┘
         │
         │ Automation Decision
         ▼
┌─────────────────────────┐
│  ActionExecutor         │
│  - OBS scene switch     │
│  - Graphic display      │
│  - BetaBot control      │
│  - etc.                 │
└─────────────────────────┘
```

### Keyword Matching Process

1. **Transcript Capture**: User speaks → Web Speech API → Text
2. **Normalization**: Lowercase, trim whitespace
3. **Rule Lookup**: Query enabled keyword rules from database
4. **Pattern Matching**: Check if transcript contains rule keywords
5. **Confidence Check**: Ensure transcript confidence meets threshold
6. **Rate Limiting**: Respect cooldowns and max actions per minute
7. **Action Execution**: Execute if conditions met (auto or suggested)

---

## Testing Guide

### 1. Browser Requirements

**Supported:**
- ✅ Google Chrome (recommended)
- ✅ Microsoft Edge
- ✅ Chromium-based browsers

**Not Supported:**
- ❌ Firefox (Web Speech API not available)
- ❌ Safari (limited/no support)
- ❌ Mobile browsers (inconsistent support)

### 2. Microphone Permission

**First Time Setup:**
1. Click "Start Listening" button
2. Browser will prompt for microphone permission
3. Click "Allow" to grant access
4. Transcription will start automatically

**Troubleshooting:**
- If permission denied, check browser settings
- Chrome: `chrome://settings/content/microphone`
- Edge: `edge://settings/content/microphone`
- Ensure correct microphone is selected

### 3. Testing Keyword Triggers

**Step 1: Create Keyword Rules**

Use SQL to create test rules:

```sql
-- Camera switch keywords
INSERT INTO trigger_rules (
  rule_name,
  description,
  enabled,
  priority,
  trigger_type,
  trigger_conditions,
  action_type,
  action_params,
  require_operator_approval
) VALUES (
  'Camera 2 Keyword',
  'Switch to camera 2 when "camera 2" or "switch to camera 2" is spoken',
  true,
  3, -- Normal priority
  'keyword',
  '{
    "keywords": ["camera 2", "camera two", "switch to camera 2", "switch to camera two"],
    "match_type": "any",
    "case_sensitive": false
  }'::jsonb,
  'obs.scene',
  '{
    "sceneName": "Camera 2",
    "transition": "Fade",
    "transitionDuration": 300
  }'::jsonb,
  false -- Auto-execute if confidence high enough
);

-- BetaBot mood keywords
INSERT INTO trigger_rules (
  rule_name,
  description,
  enabled,
  priority,
  trigger_type,
  trigger_conditions,
  action_type,
  action_params,
  require_operator_approval
) VALUES (
  'BetaBot Excited Keyword',
  'Set BetaBot to excited mood when "beta bot excited" is spoken',
  true,
  3,
  'keyword',
  '{
    "keywords": ["beta bot excited", "betabot excited", "make beta bot excited"],
    "match_type": "any",
    "case_sensitive": false
  }'::jsonb,
  'betabot.mood',
  '{
    "mood": "excited",
    "intensity": 8
  }'::jsonb,
  false
);

-- Graphic display keywords
INSERT INTO trigger_rules (
  rule_name,
  description,
  enabled,
  priority,
  trigger_type,
  trigger_conditions,
  action_type,
  action_params,
  require_operator_approval
) VALUES (
  'Show Lower Third Keyword',
  'Display lower third when "show lower third" is spoken',
  true,
  3,
  'keyword',
  '{
    "keywords": ["show lower third", "display lower third", "lower third on"],
    "match_type": "any",
    "case_sensitive": false
  }'::jsonb,
  'lower_third.show',
  '{
    "lower_third_id": "default",
    "duration": 5000
  }'::jsonb,
  false
);

-- Segment switch keywords
INSERT INTO trigger_rules (
  rule_name,
  description,
  enabled,
  priority,
  trigger_type,
  trigger_conditions,
  action_type,
  action_params,
  require_operator_approval
) VALUES (
  'Switch to Part 2 Keyword',
  'Switch to Part 2 segment when spoken',
  true,
  3,
  'keyword',
  '{
    "keywords": ["part two", "part 2", "switch to part two", "go to part 2"],
    "match_type": "any",
    "case_sensitive": false
  }'::jsonb,
  'segment.switch',
  '{
    "segment_id": "<your-part-2-segment-id>"
  }'::jsonb,
  true -- Require approval for segment switches
);
```

**Step 2: Start Transcription**

1. Open dashboard
2. Navigate to "AI Auto-Director System" section
3. Find "Live Transcription" panel
4. Click "Start Listening"
5. Grant microphone permission if prompted

**Step 3: Speak Keywords**

1. Wait for "Listening" badge to appear
2. Speak clearly into microphone
3. Say one of your configured keywords (e.g., "camera 2")
4. Watch transcript appear in real-time
5. Check automation feed for triggered action

**Step 4: Verify Execution**

Monitor the automation feed panel to see:
- Trigger type: `keyword`
- Trigger data: Contains matched keyword
- Action type: e.g., `obs.scene`
- Outcome: `executed`, `pending`, or `skipped`
- Confidence score from speech recognition

---

## Example Keyword Configurations

### 1. OBS Scene Control

```json
{
  "keywords": [
    "camera 1", "camera one", "cam 1",
    "camera 2", "camera two", "cam 2",
    "wide shot", "wide angle",
    "close up", "closeup",
    "full screen", "fullscreen"
  ],
  "match_type": "any",
  "case_sensitive": false
}
```

**Actions:**
- `obs.scene` → Switch to named scene
- `obs.source.show` → Show specific source
- `obs.source.hide` → Hide specific source

### 2. BetaBot Control

```json
{
  "keywords": [
    "beta bot excited", "betabot excited",
    "beta bot calm", "betabot calm",
    "beta bot thinking", "betabot thoughtful",
    "beta bot playful", "betabot playful"
  ],
  "match_type": "any",
  "case_sensitive": false
}
```

**Actions:**
- `betabot.mood` → Change mood/emotion
- `betabot.movement` → Trigger animation
- `betabot.speaking` → Control speech state

### 3. Graphics and Overlays

```json
{
  "keywords": [
    "show graphic", "display graphic",
    "show banner", "display banner",
    "show question", "display question",
    "hide all", "clear all",
    "lower third on", "lower third off"
  ],
  "match_type": "any",
  "case_sensitive": false
}
```

**Actions:**
- `graphic.show` → Display graphic overlay
- `graphic.hide` → Remove graphic overlay
- `question.indicate` → Highlight question banner
- `lower_third.show` → Display lower third

### 4. Soundboard and Effects

```json
{
  "keywords": [
    "play applause", "applause sound",
    "play laughter", "laughter sound",
    "play cheers", "cheers sound",
    "drum roll", "drumroll"
  ],
  "match_type": "any",
  "case_sensitive": false
}
```

**Actions:**
- `soundboard.play` → Trigger sound effect

### 5. Show Segments

```json
{
  "keywords": [
    "intro segment", "start intro",
    "part one", "part 1",
    "part two", "part 2",
    "outro segment", "start outro"
  ],
  "match_type": "any",
  "case_sensitive": false
}
```

**Actions:**
- `segment.switch` → Change active segment

---

## Integration with Other Phases

### Phase 1 (Foundation)
- Uses AutomationConfig for confidence thresholds
- Respects `automation_enabled` flag
- Honors `emergency_stop` state
- Logs events to `automation_events` table

### Phase 2 (Manual Triggers)
- Keyword triggers flow through same decision pipeline
- Same priority queue system
- Same rate limiting and cooldowns

### Phase 3 (Event-Based Triggers)
- Keyword triggers recorded as events
- Can be monitored in real-time feed
- Stored in database for analytics

### Phase 4 (OBS Integration)
- Keywords can switch OBS scenes
- Keywords can show/hide sources
- Keywords can control streaming

### Future Phases
- Phase 6 (AI Intent): Transcripts feed into AI context
- Phase 7 (Auto-Execution): Confidence scoring determines auto-execute
- Phase 8 (Advanced): Multi-keyword combinations, context awareness

---

## Monitoring and Analytics

### View Keyword-Triggered Events

```sql
-- All keyword triggers from last hour
SELECT
  created_at,
  trigger_data->>'matched_keyword' as keyword,
  action_type,
  outcome,
  confidence,
  execution_time_ms
FROM automation_events
WHERE
  trigger_type = 'keyword'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Most Common Keywords

```sql
-- Top 10 most-triggered keywords
SELECT
  trigger_data->>'matched_keyword' as keyword,
  COUNT(*) as trigger_count,
  AVG(confidence) as avg_confidence,
  COUNT(CASE WHEN outcome = 'executed' THEN 1 END) as executed_count
FROM automation_events
WHERE trigger_type = 'keyword'
GROUP BY trigger_data->>'matched_keyword'
ORDER BY trigger_count DESC
LIMIT 10;
```

### Keyword Success Rate

```sql
-- Success rate by keyword
SELECT
  trigger_data->>'matched_keyword' as keyword,
  COUNT(*) as total,
  COUNT(CASE WHEN outcome = 'executed' THEN 1 END) as executed,
  ROUND(
    COUNT(CASE WHEN outcome = 'executed' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as success_rate_pct
FROM automation_events
WHERE trigger_type = 'keyword'
GROUP BY trigger_data->>'matched_keyword'
ORDER BY success_rate_pct DESC;
```

### Transcription Confidence Analysis

```sql
-- Average confidence by outcome
SELECT
  outcome,
  COUNT(*) as count,
  ROUND(AVG(confidence), 3) as avg_confidence,
  ROUND(MIN(confidence), 3) as min_confidence,
  ROUND(MAX(confidence), 3) as max_confidence
FROM automation_events
WHERE trigger_type = 'keyword'
GROUP BY outcome
ORDER BY avg_confidence DESC;
```

---

## Files Created/Modified

### Created Files

1. **`/src/lib/transcription/TranscriptListener.ts`** (NEW)
   - Real-time speech recognition service
   - 200+ lines of TypeScript
   - Web Speech API integration
   - Observer pattern for callbacks

2. **`/src/components/TranscriptionPanel.tsx`** (NEW)
   - Transcription control UI
   - 240+ lines of React/TypeScript
   - Real-time transcript display
   - Status indicators and help text

### Modified Files

1. **`/src/lib/automation/AutomationEngine.ts`**
   - Added `processTranscript()` method
   - Keyword rule lookup and processing
   - Integration with TriggerDetector

2. **`/src/lib/automation/types.ts`**
   - Added `TranscriptSegment` type
   - Updated `UseAutomationEngineReturn` interface
   - Added `transcriptListener` property

3. **`/src/hooks/useAutomationEngine.ts`**
   - Create TranscriptListener instance
   - Inject AutomationEngine reference
   - Expose transcriptListener to components

4. **`/src/App.tsx`**
   - Import TranscriptionPanel
   - Add to AI Auto-Director System section
   - Layout in 2-column grid

---

## Success Criteria

✅ **All criteria met:**

- [x] TranscriptListener service implemented
- [x] Web Speech API integration working
- [x] Continuous listening with auto-restart
- [x] Transcript segments stored with confidence
- [x] Keyword detection integrated with AutomationEngine
- [x] TranscriptionPanel UI component created
- [x] Start/stop controls functional
- [x] Real-time transcript display
- [x] Browser compatibility detection
- [x] Integration with useAutomationEngine hook
- [x] Proper TypeScript typing throughout
- [x] Memory-efficient segment storage
- [x] Observer pattern for UI updates
- [x] Help text and usage instructions
- [x] Dashboard integration complete
- [x] No compilation errors
- [x] HMR updates successful

---

## Next Steps

### Phase 6: AI Intent Detection
- Integrate OpenAI/Claude for context understanding
- Detect conversation sentiment and topics
- Suggest actions based on discussion flow
- Multi-turn conversation awareness

### Phase 7: Auto-Execution System
- Implement confidence-based auto-execution
- Create suggestion approval UI
- Build operator override controls
- Add safety guardrails

### Phase 8: Advanced Features
- Multi-keyword combinations ("show graphic and switch to camera 2")
- Context-aware triggers (don't switch cameras mid-sentence)
- Speaker identification (different keywords per speaker)
- Custom vocabulary training

### Enhancements for Phase 5
- Add support for custom wake words ("hey director, camera 2")
- Implement transcript export/logging
- Add noise cancellation options
- Support for multiple languages
- Transcript search functionality

---

## Known Limitations

1. **Browser Compatibility**: Only works in Chrome/Edge (Web Speech API limitation)
2. **Microphone Required**: Needs working microphone and permission
3. **Network Connection**: Web Speech API requires internet (uses Google's servers)
4. **Accent Recognition**: May struggle with heavy accents or unclear speech
5. **Background Noise**: Performance degrades in noisy environments
6. **No Offline Support**: Requires active internet connection

---

## Tips for Best Results

1. **Clear Speech**: Speak clearly and at normal pace
2. **Quiet Environment**: Minimize background noise
3. **Good Microphone**: Use quality microphone for better recognition
4. **Simple Keywords**: Use short, distinct keywords
5. **Test Confidence**: Monitor confidence scores and adjust thresholds
6. **Avoid Ambiguity**: Don't use similar-sounding keywords
7. **Practice Commands**: Learn your keywords before going live

---

**Phase 5: Keyword Detection - COMPLETE** ✅

Real-time speech recognition is now fully integrated with the auto-director system. Speak your commands and watch the automation respond!
