# Auto-Director System - Master Implementation Plan

## 🎯 Project Overview

Build an AI-powered auto-director system that intelligently controls:
- **BetaBot moods** (neutral, bored, amused, spicy)
- **BetaBot movements** (home, run left, run right, bounce, hide)
- **Graphics overlays** (Starting Soon, BRB, Tech Issues, Outro, Logo)
- **OBS camera switching** (multiple camera angles)
- **Incoming question indicators**
- **Soundboard effects** (future)

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     OPERATOR DASHBOARD                            │
│  Manual Controls + AI Suggestions + Automation Feed + Override   │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   AUTOMATION ENGINE CORE                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │ Trigger    │→ │ Priority   │→ │ Conflict   │→ │ Action     ││
│  │ Detector   │  │ Queue      │  │ Resolver   │  │ Executor   ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
└────────────┬─────────────────────────────────────────────────────┘
             │
    ┌────────┴──────────────────────────────────────┐
    │         EVENT BUS (Supabase Realtime)          │
    └────────┬──────────────────────────────────────┘
             │
    ┌────────┼────────┬────────┬─────────┬──────────┐
    ▼        ▼        ▼        ▼         ▼          ▼
┌────────┐ ┌────┐ ┌──────┐ ┌───────┐ ┌──────┐ ┌──────────┐
│BetaBot │ │OBS │ │Graph-│ │Incom- │ │Sound-│ │Database  │
│Mood/Mov│ │Cams│ │ics   │ │ing    │ │board │ │(Audit)   │
└────────┘ └────┘ └──────┘ └───────┘ └──────┘ └──────────┘
```

## 📊 Database Schema

### New Tables Required

#### 1. `automation_events` (Audit Trail)
```sql
CREATE TABLE automation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Trigger Info
  trigger_type TEXT NOT NULL, -- 'manual' | 'timer' | 'keyword' | 'ai' | 'event'
  trigger_data JSONB, -- { keyword: "spicy", confidence: 0.85, context: "..." }
  confidence FLOAT, -- 0.0 to 1.0

  -- Action Info
  action_type TEXT NOT NULL, -- 'betabot.mood' | 'obs.camera' | 'graphic.show' | etc
  action_data JSONB, -- { mood: "spicy", camera: "Camera 2" }

  -- Execution Info
  execution_mode TEXT NOT NULL, -- 'auto' | 'suggested' | 'manual' | 'scheduled'
  outcome TEXT, -- 'executed' | 'skipped' | 'overridden' | 'failed'
  error_message TEXT,

  -- Metadata
  operator_action TEXT, -- 'approved' | 'dismissed' | 'modified' | null
  show_segment TEXT, -- Current segment when triggered

  -- Performance
  execution_time_ms INTEGER
);

CREATE INDEX idx_automation_events_created ON automation_events(created_at DESC);
CREATE INDEX idx_automation_events_type ON automation_events(trigger_type, action_type);
CREATE INDEX idx_automation_events_outcome ON automation_events(outcome);
```

#### 2. `automation_config` (System Settings)
```sql
CREATE TABLE automation_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Global Settings
  enabled BOOLEAN DEFAULT false,
  dry_run_mode BOOLEAN DEFAULT false,

  -- Confidence Thresholds
  auto_execute_threshold FLOAT DEFAULT 0.85, -- Execute automatically
  suggest_threshold FLOAT DEFAULT 0.60, -- Show suggestion to operator
  log_threshold FLOAT DEFAULT 0.40, -- Log but don't act

  -- Timing Settings
  debounce_ms INTEGER DEFAULT 2000, -- Wait for quiet before trigger
  cooldown_ms INTEGER DEFAULT 5000, -- Prevent same action repeating

  -- Feature Flags
  enable_keyword_triggers BOOLEAN DEFAULT true,
  enable_ai_triggers BOOLEAN DEFAULT false,
  enable_camera_automation BOOLEAN DEFAULT false,
  enable_mood_automation BOOLEAN DEFAULT true,
  enable_graphic_automation BOOLEAN DEFAULT true,

  -- OBS Settings
  obs_websocket_url TEXT DEFAULT 'ws://localhost:4455',
  obs_websocket_password TEXT
);
```

#### 3. `trigger_rules` (Configurable Triggers)
```sql
CREATE TABLE trigger_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  enabled BOOLEAN DEFAULT true,

  -- Rule Definition
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 3, -- 0 (highest) to 5 (lowest)

  -- Trigger Conditions
  trigger_type TEXT NOT NULL, -- 'keyword' | 'timer' | 'event' | 'context'
  trigger_config JSONB NOT NULL,
  -- Examples:
  -- { "keyword": "spicy", "case_sensitive": false }
  -- { "event": "question.selected" }
  -- { "timer": "00:15:00" }
  -- { "context": { "segment": "interview", "mood": "neutral" } }

  -- Actions to Execute
  actions JSONB NOT NULL,
  -- Example: [
  --   { "type": "betabot.mood", "data": { "mood": "spicy" } },
  --   { "type": "betabot.movement", "data": { "movement": "bounce" } }
  -- ]

  -- Timing Controls
  debounce_ms INTEGER,
  cooldown_ms INTEGER,

  -- Execution Settings
  require_confirmation BOOLEAN DEFAULT false,
  auto_execute_threshold FLOAT
);

CREATE INDEX idx_trigger_rules_type ON trigger_rules(trigger_type);
CREATE INDEX idx_trigger_rules_enabled ON trigger_rules(enabled);
```

## 🔧 OBS WebSocket Integration

### Installation
```bash
# OBS WebSocket is built into OBS 28+
# Enable in: Tools → WebSocket Server Settings
# Set password and note the port (default: 4455)

# Already in package.json:
# "obs-websocket-js": "^5.0.3"
```

### Camera Scene Setup in OBS

**Recommended Scene Structure:**
```
Scenes:
├── Main (Composite)
│   ├── Camera 1 (Wide shot)
│   ├── Camera 2 (Close-up)
│   ├── Screen share
│   ├── BetaBot overlay
│   └── Graphics overlay
├── Camera 1 Only
├── Camera 2 Only
├── Split Screen (Cam 1 + Cam 2)
└── Screen Share
```

**Source Naming Convention:**
- `Camera 1` - Wide angle
- `Camera 2` - Close-up / Guest
- `Camera 3` - B-roll (optional)
- `Screen` - Screen capture
- Use consistent naming for automation

### OBS Control Actions

```typescript
// Available OBS actions via WebSocket
const OBS_ACTIONS = {
  // Camera/Scene Control
  'obs.scene.switch': async (sceneName: string) => {
    await obs.call('SetCurrentProgramScene', { sceneName })
  },

  // Source Visibility
  'obs.source.show': async (sourceName: string) => {
    const sceneItemId = await getSceneItemId(sourceName)
    await obs.call('SetSceneItemEnabled', {
      sceneName: 'Main',
      sceneItemId,
      sceneItemEnabled: true
    })
  },

  'obs.source.hide': async (sourceName: string) => {
    const sceneItemId = await getSceneItemId(sourceName)
    await obs.call('SetSceneItemEnabled', {
      sceneName: 'Main',
      sceneItemId,
      sceneItemEnabled: false
    })
  },

  // Transitions
  'obs.transition.trigger': async (transitionName: string, durationMs: number) => {
    await obs.call('SetCurrentSceneTransition', { transitionName })
    await obs.call('SetCurrentSceneTransitionDuration', {
      transitionDuration: durationMs
    })
  }
}
```

## 🎬 Implementation Phases

### **PHASE 1: Foundation** (Days 1-3)

#### Database Setup
- [ ] Create `automation_events` table
- [ ] Create `automation_config` table
- [ ] Create `trigger_rules` table
- [ ] Add initial config row with default settings
- [ ] Test Supabase RLS policies for new tables

#### Core Infrastructure
- [ ] Create `/src/lib/automation/` directory structure
- [ ] Build `AutomationEngine` class (core orchestrator)
- [ ] Build `TriggerDetector` class (detect triggers from events)
- [ ] Build `ActionExecutor` class (execute actions safely)
- [ ] Build `PriorityQueue` class (manage trigger ordering)

#### Basic UI
- [ ] Create `AutomationFeedPanel.tsx` (shows recent automation events)
- [ ] Create `AutomationConfigPanel.tsx` (enable/disable, settings)
- [ ] Add automation feed to dashboard
- [ ] Add emergency stop button to header

**Deliverable:** System that can log automation events and show them in UI

---

### **PHASE 2: Manual Triggers** (Days 4-5)

#### Action Executors
- [ ] Implement `setBetaBotMood()` action
- [ ] Implement `setBetaBotMovement()` action
- [ ] Implement `showGraphic()` action
- [ ] Implement `hideGraphic()` action
- [ ] Implement `setIncomingQuestion()` action

#### Manual Override System
- [ ] Create `manualTrigger()` function (highest priority)
- [ ] Add manual trigger buttons to UI
- [ ] Test manual triggers execute immediately
- [ ] Verify all actions log to `automation_events`

**Deliverable:** Operator can manually trigger all actions via dashboard

---

### **PHASE 3: Event-Based Triggers** (Days 6-8)

#### Question Selection Auto-Trigger
- [ ] Hook into ShowPrepPanel question click event
- [ ] Auto-trigger incoming question indicator (show + 10s + hide)
- [ ] Add cooldown (don't repeat for 30s)
- [ ] Test in show prep workflow

#### Supabase Event Triggers
- [ ] Subscribe to `show_questions` changes
- [ ] Detect when question marked as played
- [ ] Auto-clear incoming indicator when answered
- [ ] Test end-to-end flow

**Deliverable:** Clicking a question automatically shows/hides incoming indicator

---

### **PHASE 4: OBS Integration** (Days 9-11)

#### OBS WebSocket Connection
- [ ] Create `/src/lib/obs/ObsController.ts`
- [ ] Implement connection management (connect, reconnect, disconnect)
- [ ] Add connection status to System Health Monitor
- [ ] Handle connection errors gracefully

#### OBS Camera Actions
- [ ] Implement `switchCamera()` action
- [ ] Implement `transitionToScene()` action
- [ ] Add camera switching UI controls
- [ ] Test scene transitions work smoothly

#### OBS Event Listeners
- [ ] Subscribe to `CurrentProgramSceneChanged` event
- [ ] Log scene changes to automation events
- [ ] Detect patterns (e.g., switched to Screen → hide BetaBot)

**Deliverable:** Can switch OBS cameras from dashboard + automation

---

### **PHASE 5: Keyword Detection** (Days 12-14)

#### Simple Keyword Triggers
- [ ] Create keyword matching engine (case-insensitive, fuzzy)
- [ ] Define default keyword rules in database
  - "spicy" → BetaBot spicy mood
  - "question" → Show incoming indicator
  - "camera 1" → Switch to camera 1
  - "camera 2" → Switch to camera 2
  - "show graphic" → Suggest graphic overlay

#### Confidence & Debouncing
- [ ] Implement debounce (2s quiet period before trigger)
- [ ] Implement cooldown (5s minimum between same triggers)
- [ ] Add confidence scoring (exact match = 0.9, partial = 0.7)

#### UI for Keyword Management
- [ ] Create `TriggerRulesPanel.tsx`
- [ ] List all trigger rules
- [ ] Enable/disable individual rules
- [ ] Add/edit/delete custom rules

**Deliverable:** Saying keywords in conversation triggers actions (with debounce)

---

### **PHASE 6: AI Intent Detection** (Days 15-18)

#### NLP Integration
- [ ] Add intent classification to conversation analysis
- [ ] Detect intents: question, joke, agreement, disagreement, spicy_take
- [ ] Assign confidence scores to intents

#### Context-Aware Triggers
- [ ] Track conversation state (opening, topic, Q&A, debate, closing)
- [ ] Detect topic exhaustion (suggest segment transition)
- [ ] Detect heated discussion (suggest spicy mood)
- [ ] Detect lull in conversation (suggest soundboard effect)

#### Multi-Factor Scoring
- [ ] Combine keyword + intent + sentiment + context
- [ ] Calculate composite confidence score
- [ ] Only suggest if score > threshold

**Deliverable:** AI detects conversation context and suggests appropriate actions

---

### **PHASE 7: Smart Suggestions** (Days 19-21)

#### Suggestion UI
- [ ] Create suggestion notification component
- [ ] Show reasoning ("Detected keyword 'spicy' + heated tone")
- [ ] Show confidence bar (visual indicator)
- [ ] Add action buttons: Execute | Dismiss | Snooze AI for 5min

#### Operator Feedback Loop
- [ ] Log operator responses (approved/dismissed)
- [ ] Analyze approval patterns
- [ ] Adjust confidence thresholds based on feedback
- [ ] Show analytics: "This trigger approved 80% of the time"

**Deliverable:** AI shows smart suggestions with context, operator approves/dismisses

---

### **PHASE 8: Selective Auto-Execution** (Days 22-24)

#### High-Confidence Auto-Execute
- [ ] Auto-execute triggers with 85%+ confidence
- [ ] Show notification: "AI: Switched to Camera 2 (90% confidence)"
- [ ] Allow undo for last 5 actions
- [ ] Log all auto-executions prominently

#### Safety Mechanisms
- [ ] Implement circuit breaker (stop after 5 consecutive failures)
- [ ] Add dry-run mode (log but don't execute)
- [ ] Add undo manager (reverse last N actions)
- [ ] Emergency stop button (pause all automation)

**Deliverable:** High-confidence triggers execute automatically with safety nets

---

### **PHASE 9: Advanced Features** (Days 25-28)

#### Conversation State Machine
- [ ] Define states: opening, topic_intro, deep_dive, debate, Q&A, wrap_up
- [ ] Auto-detect state transitions
- [ ] State-specific trigger rules
- [ ] Visual indicator of current state

#### Rundown Timeline Integration
- [ ] Define show rundown with timestamps
- [ ] Auto-trigger actions at scheduled times
- [ ] Show progress bar
- [ ] Allow operator to adjust timeline on-the-fly

#### Learning & Analytics
- [ ] Track trigger accuracy over time
- [ ] Identify false positives
- [ ] A/B test different confidence thresholds
- [ ] Export automation report after show

**Deliverable:** Fully featured auto-director with learning capabilities

---

## 🚀 Quick Start Guide (For New Context)

### 1. Understand Current System

**Existing Components:**
- `BetaBotDirectorPanel` - Manual mood/movement controls
- `GraphicsGallery` - Manual graphic controls
- `ShowPrepPanel` - Question queue management
- `ProducerAI` - Background question generation
- `SystemHealthMonitor` - Service health tracking
- `useF5TTS` - Text-to-speech integration

**Database Tables:**
- `betabot_mood` - Current BetaBot state
- `broadcast_graphics` - Graphics visibility state
- `show_questions` - Question queue
- `betabot_conversation_log` - Conversation transcripts

### 2. Start with Phase 1

```bash
# Step 1: Create database tables
# Run SQL from "Database Schema" section above in Supabase SQL Editor

# Step 2: Create directory structure
mkdir -p src/lib/automation
mkdir -p src/components/automation

# Step 3: Install any missing dependencies (already installed)
pnpm install obs-websocket-js
```

### 3. Build Core Classes

**Priority Order:**
1. `AutomationEngine` - Core orchestrator
2. `ActionExecutor` - Execute actions safely
3. `TriggerDetector` - Detect triggers
4. `AutomationFeedPanel` - Show events in UI

### 4. Test Incrementally

Each phase should be fully tested before moving to next:
- Manual triggers work
- Event triggers work
- OBS control works
- Keyword detection works
- AI suggestions work
- Auto-execution works

## 📝 Trigger Examples

### Keyword Triggers
```json
{
  "name": "Spicy Take Detected",
  "trigger_type": "keyword",
  "trigger_config": {
    "keywords": ["spicy", "controversial", "hot take"],
    "require_context": "heated_discussion"
  },
  "actions": [
    { "type": "betabot.mood", "data": { "mood": "spicy" } },
    { "type": "betabot.movement", "data": { "movement": "bounce" } }
  ],
  "auto_execute_threshold": 0.85
}
```

### Event Triggers
```json
{
  "name": "Question Selected",
  "trigger_type": "event",
  "trigger_config": {
    "event": "show_questions.selected"
  },
  "actions": [
    { "type": "incoming.show", "data": { "duration": 10000 } }
  ],
  "auto_execute_threshold": 1.0
}
```

### Context Triggers
```json
{
  "name": "Transition to Q&A",
  "trigger_type": "context",
  "trigger_config": {
    "conditions": {
      "question_count_last_2min": { "gte": 3 },
      "current_segment": "interview",
      "time_in_segment": { "gte": 900 }
    }
  },
  "actions": [
    { "type": "segment.transition", "data": { "to": "Q&A" } },
    { "type": "obs.camera", "data": { "scene": "Split Screen" } }
  ],
  "auto_execute_threshold": 0.75
}
```

### Timer Triggers
```json
{
  "name": "Show Outro at End",
  "trigger_type": "timer",
  "trigger_config": {
    "time": "00:58:00",
    "relative_to": "stream_start"
  },
  "actions": [
    { "type": "graphic.show", "data": { "graphic": "outro" } },
    { "type": "obs.camera", "data": { "scene": "Camera 1 Only" } },
    { "type": "betabot.mood", "data": { "mood": "neutral" } }
  ],
  "auto_execute_threshold": 1.0
}
```

## 🎯 Success Criteria

**Phase 1-3 (Foundation):**
- ✅ Automation events logged to database
- ✅ UI shows recent automation decisions
- ✅ Manual triggers execute correctly
- ✅ Incoming question auto-trigger works

**Phase 4-6 (OBS + Keywords):**
- ✅ OBS camera switching works
- ✅ Keyword detection triggers actions
- ✅ Debouncing prevents rapid-fire
- ✅ AI detects conversation context

**Phase 7-9 (AI + Learning):**
- ✅ AI suggests actions with reasoning
- ✅ High-confidence triggers auto-execute
- ✅ Operator can approve/dismiss suggestions
- ✅ System learns from operator feedback

## 🔐 Safety Checklist

- [ ] Emergency stop button always works
- [ ] Manual override takes highest priority
- [ ] All auto-executions are logged
- [ ] Undo available for last 5 actions
- [ ] Circuit breaker stops runaway automation
- [ ] Dry-run mode available for testing
- [ ] Confidence thresholds are conservative (85%+)
- [ ] OBS connection failures don't crash system
- [ ] Database errors are handled gracefully

## 📚 Key Files to Create

```
src/
├── lib/
│   ├── automation/
│   │   ├── AutomationEngine.ts
│   │   ├── TriggerDetector.ts
│   │   ├── ActionExecutor.ts
│   │   ├── PriorityQueue.ts
│   │   ├── ConfidenceScorer.ts
│   │   └── types.ts
│   ├── obs/
│   │   ├── ObsController.ts
│   │   ├── ObsActions.ts
│   │   └── types.ts
│   └── triggers/
│       ├── KeywordMatcher.ts
│       ├── ContextAnalyzer.ts
│       └── IntentDetector.ts
├── hooks/
│   ├── useAutomation.ts
│   ├── useObsControl.ts
│   └── useTriggerRules.ts
└── components/
    ├── automation/
    │   ├── AutomationFeedPanel.tsx
    │   ├── AutomationConfigPanel.tsx
    │   ├── TriggerRulesPanel.tsx
    │   ├── SuggestionNotification.tsx
    │   └── EmergencyStop.tsx
    └── obs/
        └── CameraControlPanel.tsx
```

## 🎓 Learning Resources

**OBS WebSocket Protocol:**
- https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md

**Event-Driven Architecture:**
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- MQTT.js: https://github.com/mqttjs/MQTT.js

**NLP/Intent Detection:**
- DeepPavlov: https://deeppavlov.ai/
- OpenAI GPT-4 API: https://platform.openai.com/docs

**State Machines:**
- XState: https://xstate.js.org/docs/

## 📞 Next Steps

**When resuming in new context:**

1. Read this plan document
2. Check current database schema
3. Start with Phase 1 (Foundation)
4. Build incrementally, test each phase
5. Get user feedback before proceeding to next phase

**Current Status:** Research complete, ready to implement Phase 1

---

**Last Updated:** 2025-10-17
**Project:** The Live Stream Show - Auto-Director System
**Repository:** /Users/ibrahim/thelivestreamshow
