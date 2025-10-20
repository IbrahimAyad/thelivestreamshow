# Phase 1 Implementation Guide
## AI Automation Enhancements - Quick Wins

**Timeline:** 1-2 weeks (20-30 hours)
**Status:** In Progress
**Started:** October 2025

---

## 📋 Task Breakdown

### Task 1.1: Enhanced Chain-of-Thought Prompting for Producer AI ⏱️ 8 hours
**Status:** 🟡 In Progress
**Impact:** High (+40% question relevance, +100% reasoning transparency)
**Priority:** P0 - Highest impact/effort ratio

**What We're Doing:**
- Replace simple Producer AI prompt with advanced Chain-of-Thought structure
- Add explicit reasoning framework
- Include quality scoring breakdown
- Add conversation state awareness

**Subtasks:**
- [x] API keys configured
- [ ] Create enhanced system prompt with `<task>`, `<context>`, `<thinking>` tags
- [ ] Update TypeScript interfaces for new response format
- [ ] Modify `analyzeTranscripts()` function in useProducerAI.ts
- [ ] Update ProducerAIPanel.tsx UI to display reasoning chain
- [ ] Test with sample transcript data
- [ ] Document changes

**Files to Modify:**
- `/src/hooks/useProducerAI.ts` (lines 149-177: system prompt)
- `/src/hooks/useProducerAI.ts` (lines 33-42: TranscriptAnalysis interface)
- `/src/components/ProducerAIPanel.tsx` (add reasoning display)

**Testing Checklist:**
- [ ] System generates 2-4 questions with reasoning_chain
- [ ] Each question includes quality_score breakdown
- [ ] UI displays reasoning transparently
- [ ] Confidence scores are well-calibrated
- [ ] Questions are more contextually relevant than before

---

### Task 1.2: Adaptive Analysis Timing for Producer AI ⏱️ 6 hours
**Status:** ⚪ Pending
**Impact:** Medium (+45% timing relevance, +20% cost efficiency)
**Priority:** P1

**What We're Doing:**
- Replace fixed 120-second interval with dynamic calculation
- Detect conversation state (rapid exchange, deep discussion, silence, topic shift)
- Trigger immediate analysis on specific events (questions, topic changes)

**Subtasks:**
- [ ] Create `ConversationState` type definition
- [ ] Implement `detectConversationState()` function
- [ ] Implement `calculateNextAnalysisInterval()` function
- [ ] Add trigger condition detection (question words, speaker changes)
- [ ] Replace fixed interval with adaptive interval in useEffect
- [ ] Add state display to ProducerAIPanel UI
- [ ] Test with various conversation patterns

**Files to Modify:**
- `/src/hooks/useProducerAI.ts` (add adaptive timing logic)
- `/src/components/ProducerAIPanel.tsx` (show current interval/state)

**Testing Checklist:**
- [ ] Analysis triggers faster during rapid exchanges
- [ ] Analysis waits longer during exhausted topics
- [ ] Immediate trigger on host questions
- [ ] Total token usage reduced by ~20%
- [ ] No missed important moments

---

### Task 1.3: Basic Aspect-Based Sentiment Analysis ⏱️ 10 hours
**Status:** ⚪ Pending
**Impact:** High (+30% sentiment accuracy, +85% actionable insights)
**Priority:** P1

**What We're Doing:**
- Extend AI Context Analyzer to detect sentiment toward specific topics
- Track speaker positions (strongly_for → strongly_against)
- Add emotional granularity beyond positive/negative
- Display aspect-based results in UI

**Subtasks:**
- [ ] Create `AspectBasedSentiment` TypeScript interface
- [ ] Update AIContextAnalyzer to generate aspect-based analysis
- [ ] Create enhanced analysis prompt with aspect detection
- [ ] Update `AIAnalysisResult` type to include aspects
- [ ] Modify AIAnalysisPanel.tsx to display topic sentiments
- [ ] Add speaker position indicators
- [ ] Test with multi-topic conversations

**Files to Modify:**
- `/src/lib/ai/AIContextAnalyzer.ts` (core analysis logic)
- `/src/components/AIAnalysisPanel.tsx` (UI for aspects)
- `/src/lib/ai/types.ts` (new type definitions)

**Testing Checklist:**
- [ ] System identifies 2-4 main topics/aspects
- [ ] Sentiment tied to each specific topic
- [ ] Speaker positions tracked accurately
- [ ] UI clearly shows disagreement points
- [ ] Confidence scores remain calibrated

---

## 🎯 Success Criteria for Phase 1

**Quantitative Metrics:**
- [ ] Question quality rating: Baseline → +25%
- [ ] Sentiment accuracy: 70% → 80%
- [ ] Reasoning transparency: 0% → 100% (visible reasoning chains)
- [ ] Token cost efficiency: Baseline → -10% (adaptive timing)
- [ ] Operator satisfaction: Test with 3+ live streams, collect feedback

**Qualitative Improvements:**
- [ ] Questions are demonstrably more contextually relevant
- [ ] Analysis timing feels "smarter" (not arbitrary)
- [ ] Sentiment insights are actionable (not just "positive/negative")
- [ ] Operator can see WHY AI made suggestions
- [ ] System feels more trustworthy

---

## 🔄 Implementation Process

### Step-by-Step for Each Task

**Before Starting:**
1. Create feature branch: `git checkout -b feature/phase1-ai-enhancements`
2. Read current implementation to understand baseline
3. Review enhancement plan for context

**During Implementation:**
1. Make one focused change at a time
2. Test immediately after each change
3. Commit with descriptive messages
4. Document any deviations from plan

**After Completion:**
1. Run full test suite
2. Test with real transcript data
3. Document improvements observed
4. Update todo list
5. Prepare for next task

---

## 📊 Progress Tracking

| Task | Hours Est. | Hours Actual | Status | Completion % |
|------|-----------|--------------|--------|--------------|
| 1.1 Enhanced Prompting | 8 | TBD | 🟡 In Progress | 10% |
| 1.2 Adaptive Timing | 6 | TBD | ⚪ Pending | 0% |
| 1.3 Aspect Sentiment | 10 | TBD | ⚪ Pending | 0% |
| **Total Phase 1** | **24** | **TBD** | **🟡 In Progress** | **3%** |

---

## 🧪 Testing Strategy

### Test Data Sources
1. **Past Transcripts**: Use betabot_conversation_log table data
2. **Sample Conversations**: Create test cases with different scenarios
3. **Live Testing**: Test during actual streams (rehearsal mode first)

### Scenarios to Test

**For Enhanced Prompting (1.1):**
- [ ] Deep philosophical discussion (tests reasoning depth)
- [ ] Rapid debate (tests question relevance)
- [ ] Repetitive conversation (tests topic exhaustion detection)
- [ ] Multi-topic discussion (tests context tracking)

**For Adaptive Timing (1.2):**
- [ ] Rapid speaker exchanges (should trigger faster)
- [ ] Long monologue (should wait longer)
- [ ] Host asks question (should trigger immediately)
- [ ] Silence/dead air (should pause analysis)

**For Aspect Sentiment (1.3):**
- [ ] Agreement on one topic, disagreement on another
- [ ] Speaker positions shift during conversation
- [ ] Subtle emotional cues (sarcasm, concern, excitement)
- [ ] Multi-participant discussion with varied stances

---

## 🚨 Known Challenges & Solutions

### Challenge 1: Token Costs with Enhanced Prompts
**Problem:** Longer prompts = more tokens = higher cost
**Solution:** Adaptive timing reduces frequency, offsetting cost increase
**Monitoring:** Track cost per analysis, aim for <$0.02

### Challenge 2: Reasoning Chain Verbosity
**Problem:** CoT prompting generates more text, slower responses
**Solution:** Limit reasoning to 2-3 sentences, use structured format
**Monitoring:** Track response time, aim for <5s

### Challenge 3: Aspect Detection Accuracy
**Problem:** AI might misidentify topics or speaker positions
**Solution:** Use Claude 4 (best at nuanced analysis), provide clear examples
**Monitoring:** Manual review of first 20 analyses, adjust prompts as needed

---

## 📝 Code Examples & Templates

### Enhanced System Prompt Template (Task 1.1)

```typescript
const ENHANCED_SYSTEM_PROMPT = `You are Producer AI, an expert broadcast producer analyzing live philosophical discussions.

<task>
Analyze the conversation transcript and generate 2-4 high-quality follow-up questions that will:
1. Deepen intellectual discourse (not surface-level)
2. Challenge assumptions or explore counterpoints
3. Connect to broader themes or real-world examples
4. Engage both panelists and audience
</task>

<context>
Show: "Abe I Stream"
Format: Philosophical/cultural discussion livestream
Audience: Intellectually curious viewers seeking depth
Host Style: Socratic questioning, values nuance over quick takes
</context>

<thinking>
Use this reasoning framework:

Step 1: TOPIC IDENTIFICATION
- What is the core topic being discussed?
- What are the 2-3 main arguments or viewpoints?
- What assumptions are being made?

Step 2: CONVERSATION MOMENTUM
- Is the discussion deepening or becoming repetitive?
- Are there unexplored angles or counterarguments?
- Has the topic been exhausted? (check for circular reasoning)

Step 3: QUESTION GENERATION
For each potential question, evaluate:
- Intellectual depth: Does it move beyond obvious responses?
- Engagement potential: Will it spark interesting discussion?
- Relevance: Does it naturally follow from the conversation?
- Practical applicability: Can it connect to real-world examples?

Assign confidence based on:
- High (0.8-1.0): Question builds on established context, addresses gap in discussion
- Medium (0.6-0.79): Question is relevant but somewhat tangential
- Low (0.4-0.59): Question might disrupt flow or be too basic
</thinking>

<output_format>
{
  "reasoning_chain": {
    "topic_identification": "Brief summary of core topic",
    "conversation_state": "deepening | plateau | exhausted",
    "unexplored_angles": ["angle 1", "angle 2"],
    "momentum_assessment": "Explanation of current conversation momentum"
  },
  "topic_summary": "One-sentence summary",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "questions": [
    {
      "question_text": "The actual question",
      "confidence": 0.85,
      "reasoning": "Why this question is valuable (specific to current conversation)",
      "context_summary": "What in the transcript led to this question",
      "expected_direction": "What type of discussion this might spark",
      "quality_score": {
        "depth": 0.9,
        "engagement": 0.8,
        "relevance": 0.85,
        "practicality": 0.7
      }
    }
  ],
  "segment_recommendation": {
    "should_transition": false,
    "reason": "Specific reason based on conversation analysis",
    "confidence": 0.75
  }
}
</output_format>

<quality_criteria>
EXCELLENT questions (0.8+):
- Build on specific points made in transcript
- Introduce productive tension or counterpoint
- Have clear relevance to broader themes
- Likely to generate 3+ minutes of quality discussion

GOOD questions (0.6-0.79):
- Relevant to general topic
- May deepen one aspect of discussion
- Somewhat predictable but valuable

WEAK questions (below 0.6):
- Generic or could apply to any similar discussion
- Simple yes/no or factual questions
- Disrupt conversation flow
- Too obvious or surface-level
</quality_criteria>

Generate 2-4 questions maximum. Prioritize quality over quantity.`;
```

### Adaptive Timing Logic Template (Task 1.2)

```typescript
interface ConversationState {
  type: 'rapid_exchange' | 'deep_discussion' | 'silence' | 'topic_shift' | 'normal'
  wordsPerMinute: number
  speakerChanges: number
  questionDetected: boolean
  topicStability: number // minutes on current topic
}

function detectConversationState(
  recentTranscripts: Array<{ transcript: string; timestamp: Date; speaker: string }>
): ConversationState {
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000

  const recentWords = recentTranscripts
    .filter(t => t.timestamp.getTime() > oneMinuteAgo)
    .map(t => t.transcript.split(' ').length)
    .reduce((sum, count) => sum + count, 0)

  const wordsPerMinute = recentWords

  const speakerChanges = recentTranscripts
    .slice(-10)
    .reduce((changes, t, i, arr) => {
      if (i === 0) return 0
      return changes + (t.speaker !== arr[i - 1].speaker ? 1 : 0)
    }, 0)

  const questionDetected = recentTranscripts
    .slice(-3)
    .some(t => t.transcript.includes('?'))

  // Determine state
  if (wordsPerMinute > 150 || speakerChanges > 7) {
    return { type: 'rapid_exchange', wordsPerMinute, speakerChanges, questionDetected, topicStability: 0 }
  }

  if (questionDetected) {
    return { type: 'topic_shift', wordsPerMinute, speakerChanges, questionDetected, topicStability: 0 }
  }

  if (wordsPerMinute < 30) {
    return { type: 'silence', wordsPerMinute, speakerChanges, questionDetected, topicStability: 0 }
  }

  return { type: 'normal', wordsPerMinute, speakerChanges, questionDetected, topicStability: 0 }
}

function calculateNextInterval(state: ConversationState): number {
  const BASE_INTERVAL = 120 // seconds

  switch (state.type) {
    case 'rapid_exchange':
      return BASE_INTERVAL * 0.5 // 60s - analyze sooner
    case 'topic_shift':
      return BASE_INTERVAL * 0.25 // 30s - immediate analysis
    case 'silence':
      return BASE_INTERVAL * 2 // 240s - wait longer
    case 'deep_discussion':
      return BASE_INTERVAL * 1.5 // 180s - less frequent
    default:
      return BASE_INTERVAL
  }
}
```

### Aspect-Based Sentiment Template (Task 1.3)

```typescript
interface AspectBasedSentiment {
  overallSentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'

  aspects: Array<{
    topic: string
    sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
    confidence: number
    keyPhrases: string[]
    speakerPositions: Array<{
      speaker: string
      stance: 'strongly_for' | 'for' | 'neutral' | 'against' | 'strongly_against'
      confidence: number
    }>
  }>

  emotions: Array<{
    emotion: 'joy' | 'surprise' | 'anger' | 'frustration' | 'curiosity' | 'concern' | 'excitement'
    intensity: number // 0-1
    timestamp: Date
    trigger: string
  }>

  dynamics: {
    agreement_level: number // 0-1
    tension: number // 0-1
    momentum: 'building' | 'steady' | 'declining'
  }
}

const ASPECT_ANALYSIS_PROMPT = `<task>
Perform aspect-based sentiment analysis on this conversation.
</task>

<analysis_framework>
1. Identify 2-4 main topics/aspects being discussed
2. For each aspect, determine:
   - Overall sentiment (very_positive to very_negative)
   - Each speaker's position (strongly_for to strongly_against)
   - Key phrases that reveal sentiment
3. Detect specific emotions beyond positive/negative
4. Assess conversation dynamics (agreement, tension, momentum)
</analysis_framework>

<transcript>
{TRANSCRIPT_HERE}
</transcript>

<output_format>
{
  "overallSentiment": "positive",
  "aspects": [
    {
      "topic": "AI impact on creative industries",
      "sentiment": "mixed",
      "confidence": 0.82,
      "keyPhrases": ["threatening traditional art", "democratizing creativity"],
      "speakerPositions": [
        { "speaker": "Host", "stance": "neutral", "confidence": 0.75 },
        { "speaker": "Guest", "stance": "against", "confidence": 0.88 }
      ]
    }
  ],
  "emotions": [
    {
      "emotion": "concern",
      "intensity": 0.7,
      "timestamp": "2024-01-01T12:00:00Z",
      "trigger": "Discussion of job displacement"
    }
  ],
  "dynamics": {
    "agreement_level": 0.45,
    "tension": 0.65,
    "momentum": "building"
  }
}
</output_format>`;
```

---

## 🔍 Monitoring & Measurement

### Metrics to Track

**Before Phase 1:**
- Average question quality (manual rating 1-5)
- Question relevance to conversation (%)
- Analysis timing (fixed 120s)
- Sentiment accuracy (% correct on test set)
- Token cost per analysis
- Operator trust score (survey 1-5)

**After Phase 1:**
- All above metrics measured again
- Calculate improvement percentages
- Document subjective improvements (operator feedback)

### Measurement Process

1. **Baseline Measurement (Before):**
   - Run 3 test streams with current system
   - Rate 20 questions (quality, relevance)
   - Calculate average metrics

2. **Post-Implementation Measurement:**
   - Run 3 test streams with enhanced system
   - Rate 20 questions with same criteria
   - Compare metrics

3. **Reporting:**
   - Document in PHASE1_RESULTS.md
   - Include code examples
   - Share learnings for Phase 2

---

## 📞 Next Steps After Phase 1

Once all tasks complete and success criteria met:

1. **Document Results**
   - Create PHASE1_RESULTS.md
   - Include metrics, screenshots, feedback
   - Note any unexpected findings

2. **Plan Phase 2**
   - Review Phase 2 scope (Multi-Model Voting)
   - Estimate timeline based on Phase 1 learnings
   - Prepare environment (install Anthropic SDK)

3. **Celebrate Wins!**
   - Share improvements with team
   - Use enhanced system in production
   - Gather real-world feedback

---

**Last Updated:** October 2025
**Next Update:** After completing Task 1.1
