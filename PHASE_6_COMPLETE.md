# Phase 6: AI Intent Detection - COMPLETE ✅

## Overview

Phase 6 implements AI-powered context analysis using OpenAI or Anthropic APIs to understand conversation sentiment, topics, and engagement levels. The system analyzes recent transcript segments and suggests context-appropriate automation actions based on the detected mood, subject matter, and audience engagement.

**Status:** ✅ **COMPLETE**
**Completion Date:** January 2025

---

## What Was Built

### 1. AIContextAnalyzer Service (`/src/lib/ai/AIContextAnalyzer.ts`)

Comprehensive AI analysis service that:
- Analyzes conversation context using AI models
- Detects sentiment (very_positive → very_negative)
- Identifies topics from conversation
- Measures engagement levels (very_high → low)
- Suggests context-appropriate actions
- Supports multiple AI providers (OpenAI, Anthropic, Mock)
- Provides confidence scoring for all analyses
- Observer pattern for real-time updates

**Key Features:**
- Multi-provider support (OpenAI GPT-4, Anthropic Claude, Mock for testing)
- Configurable analysis intervals
- Confidence thresholds for action suggestions
- Analysis history tracking (last 100 analyses)
- Real-time callbacks for UI updates
- Automatic integration with AutomationEngine
- JSON-based prompt/response parsing

### 2. AIAnalysisPanel UI Component (`/src/components/AIAnalysisPanel.tsx`)

Comprehensive dashboard panel for AI analysis:
- Manual analysis triggering
- Provider configuration (Mock/OpenAI/Anthropic)
- API key management
- Sentiment visualization with color coding
- Topic identification display
- Engagement level indicators
- Confidence score progress bars
- Suggested actions list
- Analysis reasoning explanations
- Settings panel for configuration

### 3. Integration with AutomationEngine

Extended automation system with AI capabilities:
- AIContextAnalyzer injected into AutomationEngine
- Context-based action triggering
- AI suggestions flow through same decision pipeline
- Confidence-based auto-execution
- Integration with existing safety mechanisms

### 4. Hook Integration

Updated `useAutomationEngine` hook:
- Creates AIContextAnalyzer instance
- Injects AutomationEngine reference
- Provides aiAnalyzer to components
- Manages lifecycle

---

## How It Works

### AI Analysis Flow

```
┌────────────────────┐
│  Transcript        │
│  Segments (last 10)│
└────────┬───────────┘
         │
         │ User clicks "Analyze Now"
         ▼
┌────────────────────────────┐
│  AIContextAnalyzer         │
│  - Collects recent text    │
│  - Builds analysis prompt  │
└────────┬───────────────────┘
         │
         │ API Call
         ▼
┌────────────────────────────┐
│  AI Provider               │
│  - OpenAI GPT-4            │
│  - Anthropic Claude        │
│  - Mock (heuristic-based)  │
└────────┬───────────────────┘
         │
         │ JSON Response
         ▼
┌────────────────────────────┐
│  Analysis Result           │
│  - Sentiment: positive     │
│  - Topic: "gaming"         │
│  - Engagement: high        │
│  - Confidence: 0.85        │
│  - Suggested actions       │
└────────┬───────────────────┘
         │
         │ Update UI + Trigger Actions
         ▼
┌────────────────────────────┐
│  AutomationEngine          │
│  - Process context         │
│  - Match context rules     │
│  - Execute/suggest actions │
└────────────────────────────┘
```

### Analysis Process

1. **Context Collection**: Gather last N transcript segments (configurable, default 10)
2. **Prompt Construction**: Build structured prompt with conversation context
3. **AI Analysis**: Send to OpenAI/Anthropic/Mock provider
4. **Response Parsing**: Extract sentiment, topic, engagement from JSON
5. **Action Suggestion**: AI recommends appropriate production actions
6. **Automation Integration**: Suggested actions flow through decision pipeline
7. **UI Update**: Display results with confidence scores

---

## Testing Guide

### 1. Testing with Mock Provider (No API Key Required)

**Step 1: Use Mock Provider**

The system defaults to `mock` provider which uses heuristic-based analysis:
- No API key required
- Instant results
- Good for testing workflow
- Detects keywords for sentiment/topic

**Step 2: Start Transcription**

1. Open dashboard
2. Navigate to "Live Transcription" panel
3. Click "Start Listening"
4. Speak for 10-15 seconds

**Step 3: Run Analysis**

1. Scroll to "AI Context Analysis" panel
2. Click "Analyze Now"
3. See instant results from mock analyzer

**Example Mock Results:**
- Saying "amazing, awesome, love it" → `very_positive` sentiment
- Saying "tech, technology, software" → `technology` topic
- Long conversation with multiple speakers → `very_high` engagement

### 2. Testing with OpenAI (Requires API Key)

**Step 1: Configure Provider**

1. Open "AI Context Analysis" panel
2. Click "Settings" button
3. Select "OpenAI (GPT-4)" from dropdown
4. Enter your OpenAI API key
5. Click "Update Provider"

**Step 2: Run Analysis**

1. Ensure transcription has some segments
2. Click "Analyze Now"
3. Wait 2-5 seconds for API response
4. View AI-powered analysis results

**OpenAI Advantages:**
- More accurate sentiment detection
- Better topic extraction
- Context-aware action suggestions
- Nuanced reasoning

### 3. Testing with Anthropic (Requires API Key)

**Step 1: Configure Provider**

1. Open "AI Context Analysis" panel settings
2. Select "Anthropic (Claude)" from dropdown
3. Enter your Anthropic API key
4. Click "Update Provider"

**Step 2: Run Analysis**

1. Click "Analyze Now" with transcript segments available
2. Wait for Claude API response
3. View detailed analysis with reasoning

**Anthropic Advantages:**
- Strong reasoning capabilities
- Detailed explanations
- Good context understanding

---

## Example Analysis Scenarios

### Scenario 1: Positive Gaming Discussion

**Transcript:**
```
"This new game is absolutely amazing!"
"Yeah, the graphics are incredible"
"I love the gameplay mechanics"
```

**Expected Analysis:**
```json
{
  "sentiment": "very_positive",
  "topic": "gaming",
  "engagement": "high",
  "confidence": 0.88,
  "suggestedActions": [
    {
      "actionType": "betabot.mood",
      "actionData": { "mood": "excited", "intensity": 8 },
      "reasoning": "Very positive gaming discussion - show excitement",
      "confidence": 0.85
    },
    {
      "actionType": "obs.scene",
      "actionData": { "sceneName": "Wide Shot" },
      "reasoning": "High engagement - capture all participants",
      "confidence": 0.80
    }
  ]
}
```

### Scenario 2: Q&A Session

**Transcript:**
```
"That's a great question"
"Let me answer that"
"Does anyone else have questions?"
```

**Expected Analysis:**
```json
{
  "sentiment": "neutral",
  "topic": "q&a",
  "engagement": "medium",
  "confidence": 0.75,
  "suggestedActions": [
    {
      "actionType": "lower_third.show",
      "actionData": { "lower_third_id": "qa", "duration": 5000 },
      "reasoning": "Q&A session detected - show Q&A indicator",
      "confidence": 0.90
    }
  ]
}
```

### Scenario 3: Technical Problem Discussion

**Transcript:**
```
"This is really frustrating"
"The bug is still there"
"This doesn't work at all"
```

**Expected Analysis:**
```json
{
  "sentiment": "negative",
  "topic": "technical issues",
  "engagement": "medium",
  "confidence": 0.82,
  "suggestedActions": [
    {
      "actionType": "betabot.mood",
      "actionData": { "mood": "thoughtful", "intensity": 6 },
      "reasoning": "Negative technical discussion - show empathy",
      "confidence": 0.78
    }
  ]
}
```

---

## Creating Context-Based Trigger Rules

While AI analysis can suggest actions directly, you can also create database rules that trigger based on detected context:

### Rule 1: Excitement for Very Positive Sentiment

```sql
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
  'Very Positive → Excited BetaBot',
  'Set BetaBot to excited mood when sentiment is very positive',
  true,
  3,
  'context',
  '{
    "sentiment": "very_positive",
    "confidence_min": 0.75
  }'::jsonb,
  'betabot.mood',
  '{
    "mood": "excited",
    "intensity": 9
  }'::jsonb,
  false
);
```

### Rule 2: Switch Camera for High Engagement

```sql
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
  'High Engagement → Wide Shot',
  'Switch to wide shot when engagement is very high',
  true,
  3,
  'context',
  '{
    "engagement": "very_high",
    "confidence_min": 0.70
  }'::jsonb,
  'obs.scene',
  '{
    "sceneName": "Wide Shot",
    "transition": "Fade",
    "transitionDuration": 500
  }'::jsonb,
  false
);
```

### Rule 3: Q&A Lower Third

```sql
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
  'Q&A Topic → Show Lower Third',
  'Display Q&A lower third when Q&A topic detected',
  true,
  3,
  'context',
  '{
    "topic": "q&a",
    "confidence_min": 0.80
  }'::jsonb,
  'lower_third.show',
  '{
    "lower_third_id": "qa_indicator",
    "duration": 8000
  }'::jsonb,
  false
);
```

---

## AI Providers Configuration

### OpenAI Configuration

**Model Options:**
- `gpt-4` (recommended) - Best reasoning and accuracy
- `gpt-4-turbo` - Faster, good quality
- `gpt-3.5-turbo` - Fastest, cheaper, less accurate

**API Key:**
1. Sign up at https://platform.openai.com
2. Create API key in account settings
3. Add to dashboard settings panel

**Cost Estimate:**
- ~500-1000 tokens per analysis
- GPT-4: ~$0.03-$0.06 per analysis
- GPT-4-turbo: ~$0.01-$0.02 per analysis
- GPT-3.5-turbo: ~$0.001-$0.002 per analysis

### Anthropic Configuration

**Model Options:**
- `claude-3-opus-20240229` (recommended) - Best reasoning
- `claude-3-sonnet-20240229` - Balanced performance
- `claude-3-haiku-20240307` - Fastest, most affordable

**API Key:**
1. Sign up at https://console.anthropic.com
2. Create API key
3. Add to dashboard settings panel

**Cost Estimate:**
- ~500-1000 tokens per analysis
- Claude Opus: ~$0.015-$0.075 per analysis
- Claude Sonnet: ~$0.003-$0.015 per analysis
- Claude Haiku: ~$0.0003-$0.0015 per analysis

### Mock Provider (Free)

**How It Works:**
- Keyword-based heuristics
- No API required
- Instant results
- Good for development/testing

**Sentiment Detection:**
- `amazing, awesome, love` → very_positive
- `good, nice, great` → positive
- `bad, terrible, hate` → negative

**Topic Detection:**
- `tech, technology, software` → technology
- `game, gaming, play` → gaming
- `news, politics` → news
- `question, ask` → q&a

---

## Integration with Other Phases

### Phase 1 (Foundation)
- Uses AutomationConfig for confidence thresholds
- Respects `automation_enabled` flag
- Honors `emergency_stop` state
- Logs AI decisions to `automation_events`

### Phase 2 (Manual Triggers)
- AI suggestions flow through same priority queue
- Same safety mechanisms apply
- Same rate limiting and cooldowns

### Phase 3 (Event-Based Triggers)
- AI can trigger on database events
- Context changes can be event-driven

### Phase 4 (OBS Integration)
- AI can suggest scene switches
- AI can control sources based on context

### Phase 5 (Keyword Detection)
- Transcripts from keyword system feed into AI
- AI provides higher-level understanding than keywords
- Both systems complement each other

---

## Monitoring and Analytics

### View AI-Triggered Events

```sql
-- All AI context triggers from last hour
SELECT
  created_at,
  trigger_data->>'sentiment' as sentiment,
  trigger_data->>'topic' as topic,
  trigger_data->>'engagement' as engagement,
  action_type,
  outcome,
  confidence,
  execution_time_ms
FROM automation_events
WHERE
  trigger_type = 'context'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Sentiment Distribution

```sql
-- Count events by detected sentiment
SELECT
  trigger_data->>'sentiment' as sentiment,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM automation_events
WHERE trigger_type = 'context'
GROUP BY trigger_data->>'sentiment'
ORDER BY count DESC;
```

### Topic Analysis

```sql
-- Most common topics
SELECT
  trigger_data->>'topic' as topic,
  COUNT(*) as occurrences,
  AVG((trigger_data->>'engagement_score')::numeric) as avg_engagement
FROM automation_events
WHERE trigger_type = 'context'
GROUP BY trigger_data->>'topic'
ORDER BY occurrences DESC
LIMIT 10;
```

### AI Action Success Rate

```sql
-- Success rate of AI-suggested actions
SELECT
  action_type,
  COUNT(*) as total_suggestions,
  COUNT(CASE WHEN outcome = 'executed' THEN 1 END) as executed,
  ROUND(
    COUNT(CASE WHEN outcome = 'executed' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as execution_rate_pct,
  AVG(confidence) as avg_confidence
FROM automation_events
WHERE trigger_type = 'context'
GROUP BY action_type
ORDER BY execution_rate_pct DESC;
```

---

## Files Created/Modified

### Created Files

1. **`/src/lib/ai/AIContextAnalyzer.ts`** (NEW)
   - Complete AI analysis service
   - 450+ lines of TypeScript
   - Multi-provider support
   - Comprehensive error handling

2. **`/src/components/AIAnalysisPanel.tsx`** (NEW)
   - AI analysis UI component
   - 380+ lines of React/TypeScript
   - Real-time updates
   - Provider configuration

### Modified Files

1. **`/src/lib/automation/types.ts`**
   - Added `aiAnalyzer` to `UseAutomationEngineReturn`

2. **`/src/hooks/useAutomationEngine.ts`**
   - Import AIContextAnalyzer
   - Create and inject analyzer instance
   - Expose aiAnalyzer to components

3. **`/src/App.tsx`**
   - Import AIAnalysisPanel
   - Add to AI Auto-Director section
   - 2-column span layout

---

## Success Criteria

✅ **All criteria met:**

- [x] AIContextAnalyzer service implemented
- [x] Multi-provider support (OpenAI, Anthropic, Mock)
- [x] Sentiment detection (5 levels)
- [x] Topic identification
- [x] Engagement measurement (4 levels)
- [x] Action suggestion system
- [x] Confidence scoring
- [x] Analysis history tracking
- [x] Observer pattern for real-time updates
- [x] AIAnalysisPanel UI component created
- [x] Provider configuration UI
- [x] API key management
- [x] Real-time analysis display
- [x] Integration with AutomationEngine
- [x] Integration with useAutomationEngine hook
- [x] Dashboard integration complete
- [x] No compilation errors
- [x] HMR updates successful

---

## Next Steps

### Phase 7: Confidence-Based Auto-Execution
- Implement threshold-based auto-execution
- Create suggestion approval UI
- Build operator override controls
- Add execution history

### Phase 8: Advanced Context Rules
- Multi-condition context rules
- Context transitions (sentiment changes)
- Temporal context (duration-based)
- Participant-specific contexts

### Phase 9: Learning & Optimization
- Track operator approvals/rejections
- Adjust confidence thresholds automatically
- Learn action preferences
- Optimize suggestion accuracy

### Enhancements for Phase 6
- Streaming analysis (analyze as transcript arrives)
- Context memory (remember previous analyses)
- Multi-language support
- Custom AI prompts per show type
- A/B testing different AI models
- Cost tracking and budgets
- Analysis quality feedback loop

---

## Advanced Features

### Custom Analysis Prompts

Modify `buildAnalysisPrompt()` in AIContextAnalyzer to customize AI behavior:

```typescript
// Example: Gaming show specific prompt
private buildAnalysisPrompt(context: TranscriptContext): string {
  return `
You are an AI director for a gaming livestream.
Focus on:
- Game excitement level (not general excitement)
- In-game events and moments
- Player skill/performance
- Chat engagement with gameplay

TRANSCRIPT:
${context.recentTranscripts.join('\n')}

Provide analysis optimized for gaming content...
`
}
```

### Batched Analysis

Analyze periodically instead of manually:

```typescript
// In component
useEffect(() => {
  const interval = setInterval(async () => {
    if (aiAnalyzer && transcriptListener) {
      const segments = transcriptListener.getSegments(10)
      const transcripts = segments.filter(s => s.isFinal).map(s => s.transcript)

      if (transcripts.length >= 5) { // Minimum threshold
        await aiAnalyzer.analyze({
          recentTranscripts: transcripts,
          showDuration: 0,
          participantCount: 1
        })
      }
    }
  }, 30000) // Every 30 seconds

  return () => clearInterval(interval)
}, [aiAnalyzer, transcriptListener])
```

---

## Known Limitations

1. **API Costs**: OpenAI/Anthropic APIs have usage costs
2. **Latency**: AI analysis takes 2-5 seconds per request
3. **Accuracy**: Depends on transcript quality and AI model
4. **Context Window**: Limited to last N segments (configurable)
5. **Language**: Currently optimized for English
6. **Rate Limits**: API providers have rate limits

---

## Tips for Best Results

1. **Good Transcripts**: Ensure high-quality transcription first
2. **Sufficient Context**: Wait for 5-10 transcript segments before analyzing
3. **Right Model**: Use GPT-4 or Claude Opus for best accuracy
4. **Confidence Tuning**: Adjust min_confidence based on your needs
5. **Rule Balance**: Use both AI suggestions and manual rules
6. **Cost Management**: Use mock provider for testing, real AI for production
7. **Feedback Loop**: Monitor execution rates and adjust

---

**Phase 6: AI Intent Detection - COMPLETE** ✅

The auto-director system now has AI-powered intelligence to understand conversation context and suggest appropriate production actions automatically!
