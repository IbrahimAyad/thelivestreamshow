# Stream Enhancement Dashboard - Complete Feature Map
## Understanding the Full System Architecture

---

## 🎯 System Overview

**Architecture:**
```
┌──────────────────────────────────────────────────────────────┐
│                    CONTROL DASHBOARD (/)                      │
│  Operator controls all features through web interface        │
│                   ↓ Supabase Real-time ↓                     │
│                   BROADCAST VIEW (/broadcast)                 │
│  Transparent overlay added to OBS as Browser Source          │
│              What viewers see on the stream                   │
└──────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. Operator interacts with Dashboard panels
2. Dashboard updates Supabase tables
3. Supabase triggers real-time updates
4. Broadcast View listens and renders overlays
5. OBS captures Broadcast View as transparent layer
6. Final output goes to stream

---

## 📊 Features by Category

### 🎬 SECTION 1: Stream Overlay Controls

These control what viewers see on screen in real-time.

---

#### 1. **Question Banner Control**
**Location:** Top of Stream Overlay Controls section (spans 2 columns)

**What It Does:**
- Displays questions/prompts as an animated banner on broadcast
- Shows question text with topic and timer
- Auto-advances through queue or manual control

**Dashboard Features:**
- Preview current question
- Manually trigger question display
- Set display duration (seconds)
- Navigate through question queue
- Create new questions on the fly

**Broadcast Effect:**
- Animated banner appears on screen (usually top or bottom)
- Shows: Topic | Question Text | Timer
- Animates in/out smoothly
- Auto-dismisses after duration expires

**Database Tables:**
- `show_questions` (question_text, topic, is_visible, position)

**Keyboard Shortcuts:** None (manual click control)

---

#### 2. **Quick Actions**
**Location:** Top right of Stream Overlay Controls

**What It Does:**
- Fast access to common stream operations
- One-click overlay toggling
- Emergency controls

**Dashboard Features:**
- Show/Hide All Overlays button
- Clear All Active Graphics
- Toggle Live Indicator
- Show Timeline
- Other quick toggles

**Broadcast Effect:**
- Instantly shows/hides visual elements
- Displays "LIVE" indicator
- Shows timeline progress bar
- Emergency clear removes everything

**Database Tables:**
- `show_metadata` (is_live, show_timer, etc.)
- Multiple tables for bulk operations

**Keyboard Shortcuts:** ESC (emergency clear all)

---

#### 3. **Graphics Gallery**
**Location:** Middle left of Stream Overlay Controls

**What It Does:**
- Library of pre-designed graphics/overlays
- Sponsor logos, transitions, branding elements
- One-click display of visual assets

**Dashboard Features:**
- Grid view of available graphics
- Preview thumbnails
- Click to show on broadcast
- Upload new graphics
- Organize by category

**Broadcast Effect:**
- Full-screen or positioned graphics appear
- Can overlay or replace background
- Animated transitions in/out
- Multiple graphics can layer

**Database Tables:**
- `broadcast_graphics` (image_url, position, is_visible)

**Keyboard Shortcuts:** None

---

#### 4. **Lower Third Control**
**Location:** Middle of Stream Overlay Controls

**What It Does:**
- Name tags and titles for speakers
- Professional lower-third graphics
- Guest introductions

**Dashboard Features:**
- Set name, title, subtitle
- Choose position (left/right/center/bottom)
- Set colors and style
- Duration control
- Quick templates

**Broadcast Effect:**
- Animated lower third appears (usually bottom left/right)
- Shows: Name, Title, Subtitle
- Professional newscast-style presentation
- Smooth animation in/out

**Database Tables:**
- `lower_thirds` (name, title, subtitle, position, is_visible)

**Keyboard Shortcuts:** None

---

#### 5. **AI Engagement Panel**
**Location:** Bottom right of Stream Overlay Controls

**What It Does:**
- AI-powered audience engagement features
- Sentiment analysis visualization
- Real-time chat summaries
- Engagement metrics display

**Dashboard Features:**
- Enable/disable AI features
- Choose what metrics to display
- Configure sentiment display
- Chat summary triggers

**Broadcast Effect:**
- Live sentiment meter/gauge
- "Chat says:" summary bubbles
- Engagement score displays
- Heat map of topic interest

**Database Tables:**
- `ai_engagement_data` (sentiment, summary, metrics)

**Keyboard Shortcuts:** None

---

### 🎙️ SECTION 2: Discussion Show Production Tools

Production workflow management and AI assistance.

---

#### 6. **Show Prep Panel**
**Location:** Top of Production Tools section (full width)

**What It Does:**
- Pre-show preparation workspace
- Question bank management
- Talking points organization
- Research notes

**Dashboard Features:**
- Create/edit show questions
- Organize by topic/segment
- Drag-and-drop reordering
- Import questions from templates
- Mark questions as used/unused

**Broadcast Effect:**
- **NO DIRECT EFFECT** (prep tool only)
- Questions feed into Question Banner when triggered

**Database Tables:**
- `show_questions` (question_text, topic, position, is_played)

**Keyboard Shortcuts:** None

---

#### 7. **Producer AI Panel** ⭐ NEW
**Location:** Below Show Prep (full width)

**What It Does:**
- Automated question generation from conversation
- Background transcript analysis
- Intelligent segment suggestions
- Real-time production insights

**Dashboard Features:**
- Enable/Disable Producer AI
- Set analysis interval (2-3 min default)
- Minimum transcript length threshold
- Quality filter (high/medium/low)
- Auto-add to question queue toggle
- Manual analyze button
- Stats: Analysis count, questions generated

**Broadcast Effect:**
- **NO DIRECT EFFECT** (background AI worker)
- Auto-generates questions that appear in Show Prep
- Those questions can then be displayed via Question Banner

**Database Tables:**
- `betabot_conversation_log` (reads from)
- `show_questions` (writes to)

**How It Works:**
1. Listens to conversation transcripts
2. Every 2-3 minutes analyzes recent discussion
3. Uses GPT-4o to generate contextual questions
4. Adds high-quality questions to queue automatically
5. Provides topic summaries and transition recommendations

**Keyboard Shortcuts:** None

---

#### 8. **BetaBot Control Panel** ⭐ MAJOR FEATURE
**Location:** Below Producer AI (full width)

**What It Does:**
- AI co-host with conversation awareness
- Voice-activated interaction
- Context-aware responses
- Multi-modal AI (conversation/search/video)
- Integrated audio capture from OBS

**Dashboard Features:**

**Session Control:**
- Start/Stop session
- Session timer
- Session history view
- Reset conversation context

**Audio Sources:**
- Browser Microphone (wake word detection)
- OBS Audio Capture (captures desktop audio)
  - Configure OBS host IP
  - Select audio sources from OBS
  - Test audio connection

**BetaBot Modes:**
- Strategic (planning, data-driven)
- Creative (fast, idea-jumping)
- Hype (energy, slang, emojis)
- Reflective (calm, mentor tone)

**Interaction Methods:**
- Voice (wake word: "Hey Beta Bot")
- Text input
- Visual search (screenshot analysis)

**TTS Output:**
- Browser TTS (built-in)
- F5-TTS (neural voice synthesis)
- Voice selection
- Speed/pitch controls

**Features:**
- Real-time transcription
- Conversation buffer (keeps last 1000 words)
- Intent detection (conversation vs search vs video)
- Chat history with AI source tracking
- API health monitoring
- Direct interactions counter

**Broadcast Effect:**
- **NO DIRECT VISUAL** (audio-only interaction)
- Optional: BetaBot Avatar can be displayed (see below)
- Optional: Questions can trigger Question Banner
- Optional: Search results can trigger Media Browser Overlay

**Database Tables:**
- `betabot_sessions` (session_id, name, timestamp)
- `betabot_conversation_log` (session_id, transcript_text, timestamp)
- `betabot_interactions` (session_id, question, response, ai_source)
- `show_questions` (generated questions)
- `betabot_media_browser` (search triggers)

**How It Works:**

**1. Voice Interaction Flow:**
```
User says "Hey Beta Bot" → Wake word detected →
User asks question → Speech recognition transcribes →
Intent detection analyzes → Routes to:
  → Conversation (GPT-4o responds)
  → Web Search (Perplexity search)
  → Video Search (YouTube API)
→ TTS speaks response
→ Logs interaction
```

**2. Context Awareness:**
```
BetaBot fetches from Supabase:
- Current episode (number, title, topic, date)
- Active segment (name, topic, question)
- Show status (live, rehearsal, prep)

Injects into system prompt:
"We are currently discussing: [segment topic]"
"Episode theme: [episode topic]"

Result:
- BetaBot knows what you're talking about
- Won't search for things you're already discussing
- References current topic in responses
```

**3. Intent Detection:**
```
Priority 1: Explicit commands
  "search for X" → Web Search
  "watch X" → Video Search

Priority 2: Show context
  If query mentions current topic → Conversation
  If query unrelated to current topic → Consider search

Priority 3: Natural language patterns
  "What do you think?" → Conversation
  "Latest news on..." → Web Search
  Greetings → Conversation
```

**Keyboard Shortcuts:** None

---

#### 9. **TTS Queue Panel**
**Location:** Right side below BetaBot

**What It Does:**
- Text-to-Speech queue management
- Pre-generate TTS audio for questions
- Voice preview and selection

**Dashboard Features:**
- Generate TTS for all questions
- Generate for selected questions
- Voice selection per question
- Preview generated audio
- Queue status display

**Broadcast Effect:**
- **NO DIRECT EFFECT** (prep tool)
- Generated audio plays when question is triggered
- Smoother experience (no generation delay during show)

**Database Tables:**
- `show_questions` (tts_audio_url, tts_generated)

**Keyboard Shortcuts:** None

---

#### 10. **Soundboard Panel**
**Location:** Below TTS Queue (spans 2 columns)

**What It Does:**
- Play sound effects and audio cues
- Audience reaction sounds
- Musical stings and transitions

**Dashboard Features:**
- Grid of sound effect buttons
- Upload custom sounds
- Volume controls
- Keyboard shortcut assignment
- Category organization

**Broadcast Effect:**
- Audio plays through stream
- No visual component (unless animated waveform added)
- Can layer with ongoing audio

**Database Tables:**
- `soundboard_effects` (name, audio_url, is_playing)

**Keyboard Shortcuts:**
- F1: Applause
- F2: Laughter
- F3: Cheers
- F4: Gasps
- F5: Agreement
- F6: Thinking

---

#### 11. **Broadcast Settings Panel**
**Location:** Below Soundboard (full width)

**What It Does:**
- Global broadcast configuration
- Appearance settings
- Timing controls
- Visual theme options

**Dashboard Features:**
- Question banner duration
- Popup durations
- Color schemes
- Font sizes
- Animation speeds
- Overlay positions

**Broadcast Effect:**
- Changes how ALL overlays appear
- Affects timing, colors, positions
- Global style adjustments

**Database Tables:**
- `broadcast_settings` (banner_duration, theme, colors)

**Keyboard Shortcuts:** None

---

#### 12. **Popup Queue Manager**
**Location:** Below Broadcast Settings (full width)

**What It Does:**
- Manage overlay popup sequence
- Schedule timed graphics/messages
- Queue system for overlays

**Dashboard Features:**
- Add popups to queue
- Set display order
- Set durations
- Preview popups
- Trigger manually or auto-advance

**Broadcast Effect:**
- Popups appear as overlays on broadcast
- Can be: Questions, announcements, graphics, polls
- Animated entrance/exit
- Queue processes automatically or manually

**Database Tables:**
- `popup_queue` (content, duration, position, is_active)

**Keyboard Shortcuts:** None

---

#### 13. **Segment Control Panel**
**Location:** Below Popup Queue (full width)

**What It Does:**
- Manage show structure/segments
- Track current segment
- Show progress through episode

**Dashboard Features:**
- Create/edit segments (Intro, Part 1, Part 2, etc.)
- Set segment topics
- Activate segments
- View segment timeline
- Track time in segment

**Broadcast Effect:**
- **Segment Title Display** appears on broadcast
- Shows: Current segment name + topic
- Timeline visualization (optional)
- Segment transition animations

**Database Tables:**
- `show_segments` (name, topic, is_active, position)

**Keyboard Shortcuts:**
- Ctrl+1: Activate Intro
- Ctrl+2: Activate Part 1
- Ctrl+3: Activate Part 2
- Ctrl+4: Activate Part 3
- Ctrl+5: Activate Outro

---

#### 14. **Episode Info Panel**
**Location:** Right side below Segment Control

**What It Does:**
- Manage episode metadata
- Episode numbering and titling
- Show information display

**Dashboard Features:**
- Set episode number
- Set episode title
- Set episode topic
- Set episode date
- Mark as season premiere/finale

**Broadcast Effect:**
- **Episode Info Display** on broadcast
- Shows: Episode #, Title, Date
- Can appear as intro card or persistent overlay
- Used in social media clips

**Database Tables:**
- `episode_info` (number, title, topic, date)

**Keyboard Shortcuts:** None

---

#### 15. **Lower Third Control** (Duplicate)
**Location:** Right side next to Episode Info
**Same as #4 above**

---

#### 16. **Show Metadata Control**
**Location:** Below Episode Info (full width)

**What It Does:**
- Global show state management
- Live/rehearsal/prep modes
- Master timer control

**Dashboard Features:**
- Toggle is_live status
- Toggle is_rehearsal mode
- Master show timer
- Total elapsed time display
- Show start/end times

**Broadcast Effect:**
- **LIVE Indicator** appears when is_live = true
- Red "LIVE" badge or dot
- Show timer displays (if enabled)
- Changes behavior of certain features

**Database Tables:**
- `show_metadata` (is_live, is_rehearsal, show_timer, start_time)

**Keyboard Shortcuts:** None

---

#### 17. **Operator Notes Panel**
**Location:** Below Show Metadata (full width)

**What It Does:**
- Producer notes and reminders
- Internal communication tool
- Running log of show events

**Dashboard Features:**
- Create timestamped notes
- Tag notes by importance
- Search/filter notes
- Export notes log
- Share with team

**Broadcast Effect:**
- **NO DIRECT EFFECT** (internal tool)
- Notes never appear on broadcast

**Database Tables:**
- `operator_notes` (note_text, timestamp, importance)

**Keyboard Shortcuts:** None

---

#### 18. **Bookmark Panel**
**Location:** Bottom right

**What It Does:**
- Mark important moments during stream
- Create timestamps for clip editing
- Tag memorable moments

**Dashboard Features:**
- One-click bookmark current moment
- Add description/tags
- View bookmarks list with timestamps
- Export for editing software
- Generate clip links

**Broadcast Effect:**
- **NO DIRECT EFFECT** (production tool)
- Used for post-production and clip creation

**Database Tables:**
- `stream_bookmarks` (timestamp, description, tags)

**Keyboard Shortcuts:** None

---

## 🎥 Broadcast View Components

What actually renders on `/broadcast` (OBS Browser Source)

---

### **1. BetaBotPopup**
**Triggered By:** `show_questions` table with `show_on_overlay = true`

**Appearance:**
- Animated popup card
- Question text + topic
- Timer countdown
- Dismisses automatically

**Position:** Usually bottom-center or side

---

### **2. BetaBotAvatar**
**Triggered By:** `betabot_avatar_state` updates

**Appearance:**
- Animated R2-D2-style avatar
- States: idle, listening, thinking, speaking
- Visual indicator of BetaBot activity

**Position:** Usually bottom corner

---

### **3. MediaBrowserOverlay** ⭐ NEW
**Triggered By:** `betabot_media_browser` table inserts

**Appearance:**
- Full-screen web search results overlay
- Grid of images or video results
- Powered by Perplexity AI or YouTube
- Auto-dismisses after viewing

**Position:** Full screen (semi-transparent)

**How It's Triggered:**
```
BetaBot detects search intent →
Inserts record into betabot_media_browser →
Broadcast View listens for changes →
Overlay appears with results →
Auto-clears after duration
```

---

### **4. LowerThirdOverlay**
**Triggered By:** `lower_thirds` table with `is_visible = true`

**Appearance:**
- Professional name/title card
- Position: left, right, center, bottom
- Animated slide-in

**Position:** As specified in database

---

### **5. EpisodeInfoDisplay**
**Triggered By:** `episode_info` table data

**Appearance:**
- Episode number, title, date
- Can be intro card or persistent overlay

**Position:** Top or center

---

### **6. BroadcastGraphicsDisplay**
**Triggered By:** `broadcast_graphics` table with `is_visible = true`

**Appearance:**
- Full-screen or positioned graphics
- Logos, sponsors, transitions

**Position:** As specified in database

---

### **7. VisualContentDisplay** (Legacy)
**Triggered By:** `visual_content` table

**Appearance:**
- Image galleries or search results
- Being replaced by MediaBrowserOverlay

**Position:** Center

---

### **8. Live Indicator**
**Triggered By:** `show_metadata.is_live = true`

**Appearance:**
- Red "LIVE" badge
- Pulsing animation

**Position:** Top corner

---

### **9. Timeline/Progress Bar**
**Triggered By:** Segment tracking + timer

**Appearance:**
- Horizontal progress bar
- Shows episode progress
- Segment markers

**Position:** Top or bottom

---

### **10. Segment Title Display**
**Triggered By:** `show_segments.is_active = true`

**Appearance:**
- Current segment name + topic
- Transitions when segment changes

**Position:** Bottom or side

---

## 🔄 Data Flow Examples

### Example 1: Asking BetaBot a Question

```
1. DASHBOARD: User clicks mic or types question
2. DASHBOARD: BetaBotControlPanel captures input
3. DASHBOARD: Intent detection analyzes query
4. DASHBOARD: Routes to appropriate handler

If CONVERSATION:
  5a. BetaBotControlPanel sends to GPT-4o
  6a. GPT-4o responds with context-aware answer
  7a. TTS speaks response
  8a. Logs to betabot_conversation_log

If WEB SEARCH:
  5b. BetaBotControlPanel inserts to betabot_media_browser
  6b. BROADCAST: MediaBrowserOverlay detects new record
  7b. BROADCAST: Overlay appears with search results
  8b. BROADCAST: Auto-clears after viewing
  9b. DASHBOARD: Logs to betabot_interactions

If VIDEO SEARCH:
  5c. Similar to web search but with video results
```

---

### Example 2: Producer AI Generates Questions

```
1. DASHBOARD: BetaBotControlPanel logs conversation to database
2. DASHBOARD: Producer AI timer triggers (every 2-3 minutes)
3. DASHBOARD: ProducerAI fetches recent transcripts
4. DASHBOARD: GPT-4o analyzes conversation
5. DASHBOARD: Generates 2-4 contextual questions
6. DASHBOARD: Inserts high-quality questions to show_questions
7. DASHBOARD: ShowPrepPanel displays new questions
8. OPERATOR: Reviews and triggers questions
9. BROADCAST: Question appears in QuestionBanner
```

---

### Example 3: Displaying a Lower Third

```
1. DASHBOARD: Operator fills out LowerThirdControl
2. DASHBOARD: Sets name="John Doe", title="Expert"
3. DASHBOARD: Clicks "Show Lower Third"
4. DASHBOARD: Updates lower_thirds table (is_visible = true)
5. SUPABASE: Real-time trigger fires
6. BROADCAST: LowerThirdOverlay detects change
7. BROADCAST: Animates lower third onto screen
8. BROADCAST: Displays for duration
9. BROADCAST: Animates out
10. DASHBOARD: Updates lower_thirds (is_visible = false)
```

---

## 🎹 Complete Keyboard Shortcuts Reference

| Key | Action | Target Table |
|-----|--------|--------------|
| **F1** | Play Applause sound | soundboard_effects |
| **F2** | Play Laughter sound | soundboard_effects |
| **F3** | Play Cheers sound | soundboard_effects |
| **F4** | Play Gasps sound | soundboard_effects |
| **F5** | Play Agreement sound | soundboard_effects |
| **F6** | Play Thinking sound | soundboard_effects |
| **Ctrl+1** | Activate Intro segment | show_segments |
| **Ctrl+2** | Activate Part 1 segment | show_segments |
| **Ctrl+3** | Activate Part 2 segment | show_segments |
| **Ctrl+4** | Activate Part 3 segment | show_segments |
| **Ctrl+5** | Activate Outro segment | show_segments |
| **ESC** | Emergency Clear All | All overlay tables |

---

## 📊 Database Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `show_questions` | Questions/prompts for discussion | question_text, topic, is_visible, show_on_overlay |
| `show_segments` | Show structure/segments | name, topic, is_active, position |
| `episode_info` | Episode metadata | number, title, topic, date |
| `show_metadata` | Global show state | is_live, is_rehearsal, show_timer |
| `lower_thirds` | Name/title overlays | name, title, subtitle, is_visible |
| `broadcast_graphics` | Visual assets | image_url, is_visible, position |
| `soundboard_effects` | Audio effects | name, audio_url, is_playing |
| `betabot_sessions` | BetaBot session tracking | session_id, name, timestamp |
| `betabot_conversation_log` | Transcripts for Producer AI | session_id, transcript_text, timestamp |
| `betabot_interactions` | BetaBot Q&A history | question, response, ai_source |
| `betabot_media_browser` | Search overlay triggers | query, type, metadata |
| `popup_queue` | Scheduled overlays | content, duration, is_active |
| `operator_notes` | Internal producer notes | note_text, timestamp |
| `stream_bookmarks` | Clip markers | timestamp, description |
| `broadcast_settings` | Global appearance config | durations, colors, theme |

---

## 🎯 Priority Features (Most Used)

Based on typical workflow:

**1. BetaBotControlPanel** - AI co-host interaction
**2. Show Prep Panel** - Question management
**3. Producer AI Panel** - Auto question generation
**4. Segment Control Panel** - Show structure
**5. Show Metadata Control** - Live status
**6. Question Banner Control** - Display questions
**7. Soundboard Panel** - Audio effects
**8. Lower Third Control** - Speaker identification

---

## 🔧 Technical Notes

### OBS Integration
```
1. Add Browser Source in OBS
2. URL: http://localhost:5173/broadcast
3. Size: 1920x1080
4. FPS: 60 (for smooth animations)
5. Shutdown source when not visible: Unchecked
6. Refresh browser when scene becomes active: Optional
7. CSS: Add transparency if needed
```

### Audio Capture Setup (for BetaBot OBS mode)
```
1. Install OBS WebSocket plugin
2. Enable WebSocket server in OBS → Tools → WebSocket Server Settings
3. Set password (optional)
4. In BetaBot panel, set OBS host (usually 192.168.1.XXX or localhost)
5. Test connection
6. Select audio sources from OBS
7. BetaBot now hears desktop audio for wake word detection
```

### Performance Considerations
- Supabase real-time connections: ~15 active channels
- Database polling for some features
- Video/image loading can be resource-intensive
- TTS generation adds latency (pre-generate recommended)

---

## 📝 Workflow Examples

### Pre-Show Checklist
1. **EpisodeInfoPanel** - Set episode number, title, topic
2. **ShowMetadataControl** - Set is_rehearsal = true
3. **SegmentControlPanel** - Create/review segments
4. **ShowPrepPanel** - Organize questions
5. **TTSQueuePanel** - Generate TTS audio
6. **BetaBotControlPanel** - Start session, test audio
7. **ProducerAIPanel** - Enable Producer AI
8. **BroadcastSettingsPanel** - Verify durations/colors
9. Open `/broadcast` in OBS browser source
10. Test overlays

### During Show
1. **ShowMetadataControl** - Toggle is_live = true
2. **SegmentControlPanel** - Advance segments (Ctrl+1-5)
3. **BetaBotControlPanel** - Interact with AI co-host
4. **QuestionBannerControl** - Trigger questions
5. **LowerThirdControl** - Introduce guests
6. **SoundboardPanel** - Audience reactions (F1-F6)
7. **BookmarkPanel** - Mark clip moments
8. **OperatorNotesPanel** - Log important events

### Post-Show
1. **ShowMetadataControl** - Toggle is_live = false
2. **OperatorNotesPanel** - Export notes
3. **BookmarkPanel** - Export bookmarks for editing
4. **BetaBotControlPanel** - End session, review history
5. **ShowPrepPanel** - Archive used questions
6. Review Producer AI suggestions

---

## 🚀 Future Enhancement Ideas

Based on current architecture, potential additions:

1. **Live Chat Integration** - Display Twitch/YouTube chat
2. **Polls/Voting Overlays** - Real-time audience interaction
3. **Social Media Feed** - Show relevant tweets/posts
4. **Sponsor Ad Breaks** - Scheduled commercial overlays
5. **Multi-camera Control** - Switch between angles
6. **Guest Queue Management** - Video call coordination
7. **Analytics Dashboard** - Real-time viewership stats
8. **Clip Auto-Generator** - AI-selected highlights
9. **Subtitle/Caption System** - Accessibility feature
10. **Interactive Graphics** - Audience-controlled visuals

---

## 🎓 Learning Resources

**For Operators:**
- BETABOT_COMMUNICATION_GUIDE.md - How to talk to BetaBot
- This document (SYSTEM_FEATURE_MAP.md) - System overview

**For Developers:**
- (TODO) TECHNICAL_DOCUMENTATION.md - Code architecture
- (TODO) DATABASE_SCHEMA.md - Table relationships
- (TODO) API_REFERENCE.md - Supabase functions

---

## 📞 Support & Troubleshooting

**Common Issues:**

**BetaBot not responding:**
- Check API keys in .env (VITE_OPENAI_API_KEY)
- Verify microphone permissions
- Test OBS audio connection
- Check console for intent detection logs

**Overlays not appearing on broadcast:**
- Verify `/broadcast` is loaded in OBS
- Check Supabase real-time subscriptions (console logs)
- Refresh browser source in OBS
- Verify database values (is_visible, is_active)

**Producer AI not generating questions:**
- Enable in ProducerAI panel
- Check if conversation log has recent transcripts
- Verify OpenAI API key
- Check analysis interval (2-3 min default)
- Look for console logs: `📊 Producer AI:`

**Audio not working:**
- Browser TTS: Check browser audio settings
- F5-TTS: Verify Docker container running (port 5000)
- OBS Audio: Test WebSocket connection
- Check TTS provider selection

---

**Last Updated:** October 17, 2025
**System Version:** 2.0 (Producer AI + Context-Aware BetaBot)
**Documentation Status:** Complete System Map

---

## 📌 Quick Reference

**Dashboard URL:** `http://localhost:5173/`
**Broadcast URL:** `http://localhost:5173/broadcast`
**OBS Browser Source:** `http://localhost:5173/broadcast` (1920x1080)

**Most Important Panels:**
1. BetaBotControlPanel (AI co-host)
2. ProducerAIPanel (auto question generation)
3. ShowPrepPanel (question management)
4. SegmentControlPanel (show structure)
5. QuestionBannerControl (display questions)

**Emergency Commands:**
- ESC: Clear all overlays
- Refresh OBS browser source: Fixes most display issues
- Reset BetaBot context: Start new session

**Next Steps:**
- Test all features systematically
- Create custom keyboard shortcuts
- Build question bank for topics
- Configure Producer AI intervals
- Design custom graphics/lower thirds
