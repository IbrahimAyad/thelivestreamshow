# 🚀 Episode Prep System - Setup Guide

## ✅ What We Just Built

A complete **AI-powered episode preparation system** that integrates seamlessly with your existing Morning Show Dashboard.

---

## 📋 SETUP STEPS

### **Step 1: Run Database Setup SQL** ⚠️ **REQUIRED**

1. Open https://supabase.com/dashboard
2. Navigate to your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy/paste the contents of `CREATE_EPISODE_PREP_TABLES.sql`
6. Click **Run**

**What this creates:**
- `episode_scripts` - Stores full scripts
- `episode_segments` - Per-segment tracking
- `episode_ai_content` - Generated content repository
- `episode_templates` - Reusable structures
- `episode_prep_progress` - Progress tracking

---

### **Step 2: Verify Installation**

The system is already integrated! Just check that it loads:

1. Start your dev server: `npm run dev`
2. Navigate to Morning Show Dashboard
3. You should see new **"AI Prep"** tab (purple button with sparkles icon ✨)

---

## 🎯 HOW TO USE THE SYSTEM

### **Workflow: Prepare an Episode**

#### **1. Create Episode Info**
- Go to **Overview** tab
- Fill in Episode Number, Date, Title, Topic
- Click "Update Episode Info"

#### **2. Import Script**
- Go to **AI Prep** tab
- Click **"Import Script"** sub-tab
- Paste your full episode script (example: Monday Morning Show script)
- Click **"Parse & Generate AI Content"**
- AI will:
  - Detect segments (Intro, News, Real Estate, etc.)
  - Extract news topics
  - Find clip lines
  - Estimate durations

#### **3. Generate Content for Each Segment**
- Click **"Segments"** sub-tab
- For each segment, click **"Generate AI Content"**
- OR click **"Generate All"** to process all segments at once
- AI will generate:
  - **News stories** (with Three Layers analysis)
  - **Listener questions** (realistic, varied difficulty)
  - **Talking points** (for host reference)
  - **Clip lines** (quotable moments)

#### **4. Review & Approve Content**
- Click **"Review Content"** sub-tab
- Navigate through tabs:
  - 📰 **News Stories** - See Three Layers breakdowns
  - ❓ **Questions** - See listener questions with scores
  - 💬 **Clip Lines** - See quotable moments
  - 💡 **Talking Points** - See host reference points
- For each item:
  - Click **"Approve"** ✅ to keep it
  - Click **"Reject"** ❌ to remove it

#### **5. Queue for Broadcast**
- After approving content, click **"Queue Approved"** button
- This will:
  - **News stories** → Go to `morning_news_stories` table → Show on news ticker
  - **Questions** → Go to `show_questions` table → Show in TTSQueuePanel

#### **6. Generate TTS & Go Live**
- Switch to **"Ultra Chat"** tab (TTSQueuePanel)
- You'll see AI-generated questions (marked with 🤖)
- Click **"Generate Voice"** for each question
- Click **"Play Live"** during show

---

## 🎨 NEW UI COMPONENTS

### **AI Prep Tab** (Main Interface)

```
┌─────────────────────────────────────────────────┐
│  🧠 AI EPISODE PREP                             │
│  Episode #48 · December 15, 2024                │
│  Status: 🟡 Reviewing (67% Complete)            │
│                                                 │
│  Progress Bars:                                 │
│  ├── Segments: 5/7 prepared                     │
│  ├── News Stories: 3/3 approved                 │
│  ├── Questions: 12/20 approved                  │
│  └── Clip Lines: 6/8 approved                   │
│                                                 │
│  Tabs:                                          │
│  [Import Script] [Segments] [Review Content]    │
└─────────────────────────────────────────────────┘
```

### **Script Importer**
- Large textarea for pasting scripts
- Real-time character/paragraph count
- One-click AI parsing
- Progress indicator during parsing

### **Segments List**
- Shows all detected segments
- Color-coded by type (News = Red, Real Estate = Blue, etc.)
- Duration estimates
- "Generate AI Content" button per segment
- Collapsible script preview

### **Content Review**
- Tabbed interface (News / Questions / Clips / Points)
- Approve/Reject buttons for each item
- "Queue Approved" batch action
- Quality scores displayed (Relevance, Engagement)
- **Three Layers display** for news:
  - Layer 1 (Surface): The headline
  - Layer 2 (Reality): What's actually happening
  - Layer 3 (Narrative): What someone wants you to believe

---

## 📊 DATABASE INTEGRATION

### **How AI Content Flows to Existing Systems**

```
AI PREP TAB
    ↓
episode_ai_content (approved items)
    ↓
[User clicks "Queue Approved"]
    ↓
┌─────────────────┬─────────────────┐
│   NEWS STORIES  │    QUESTIONS    │
│        ↓        │        ↓        │
│ morning_news_   │  show_questions │
│   stories       │                 │
│        ↓        │        ↓        │
│ MorningShow     │  TTSQueuePanel  │
│   Overlay       │        ↓        │
│ (News Ticker)   │  BetaBotPopup   │
└─────────────────┴─────────────────┘
```

**NO BREAKING CHANGES** - All existing features continue to work:
- Manual news fetching (MorningNewsControl)
- Manual question entry (show_questions)
- Voice search (Alakazam/Kadabra/Abra)
- TTS generation (ElevenLabs)

---

## 🤖 AI FEATURES

### **Powered by Perplexity AI**

1. **Script Parser**
   - Detects segment types automatically
   - Extracts news topics
   - Identifies clip lines
   - Estimates durations

2. **News Story Generator**
   - Researches each topic via Perplexity
   - Generates **Three Layers** analysis:
     - Surface story (what the headline says)
     - Reality (what's actually happening)
     - Narrative (what someone wants you to believe)
   - Includes sources/citations

3. **Question Generator**
   - Creates realistic listener questions
   - Varies difficulty (beginner to advanced)
   - Natural, conversational language
   - Scores by relevance and engagement

4. **Talking Points Generator**
   - Concise bullet points for host
   - Easy to reference during live show
   - Business-focused insights

---

## 🔧 CUSTOMIZATION

### **Segment Types Supported**

- `intro` - Opening segment
- `trending_news` - News stories
- `real_estate_qa` - Real estate questions
- `deal_structures` - Deal analysis
- `audience_interaction` - Q&A moments
- `reality_breakdown` - Deep dives
- `closing` - Ending segment
- `custom` - Any other type

### **Content Types Generated**

- `news_story` - Three Layers news analysis
- `listener_question` - Simulated listener questions
- `clip_line` - Quotable moments
- `talking_point` - Host reference points

---

## 📈 PROGRESS TRACKING

The system automatically tracks:

- **Total segments detected**
- **Segments prepared** (AI content generated)
- **AI content generated** (total items)
- **AI content approved** (user-approved items)
- **News stories** (generated vs approved)
- **Questions** (generated vs approved)
- **Clip lines** (generated vs approved)
- **Overall completion %**

Status progression:
1. `not_started` - No script imported yet
2. `script_imported` - Script parsed, segments detected
3. `ai_generating` - AI generating content
4. `reviewing` - User reviewing/approving content
5. `ready_for_broadcast` - All content queued
6. `live` - Show is live
7. `completed` - Show finished
8. `archived` - Episode archived

---

## 🚨 TROUBLESHOOTING

### **Issue: "No Active Episode" message**

**Solution:** Create an episode in the Overview tab first (EpisodeInfoPanel)

### **Issue: Script parsing fails**

**Possible causes:**
- Perplexity API key not configured
- Script format not recognized
- Rate limiting

**Solution:** Check browser console for errors, ensure `VITE_PERPLEXITY_API_KEY` is set

### **Issue: AI content generation hangs**

**Solution:**
- Check Perplexity API quota
- Wait 2-3 seconds between segment generations (rate limiting)
- Use "Generate All" carefully (adds delays automatically)

### **Issue: Queued content doesn't appear in TTSQueuePanel**

**Solution:**
- Ensure content was approved first (green checkmark)
- Click "Queue Approved" button
- Check that episode_info is active
- Reload the Chat tab

---

## 🎯 EXAMPLE WORKFLOW

**Monday Morning Show Prep:**

1. **9:00 AM** - Create Episode #48, set air date to Friday
2. **9:05 AM** - Paste Monday script into AI Prep → Parse
3. **9:10 AM** - AI detects 7 segments
4. **9:15 AM** - Click "Generate All" → AI creates 50+ content items
5. **9:45 AM** - Review content, approve best items (15 questions, 3 news stories)
6. **10:00 AM** - Click "Queue Approved" → Content goes to News/Chat tabs
7. **10:15 AM** - Generate TTS for approved questions
8. **Friday 10:00 AM** - Go live, use prepared content

**Time saved:** ~2 hours of manual prep work

---

## 📁 FILES CREATED

### **Components**
- `src/components/AIPrepTab.tsx` - Main AI Prep interface
- `src/components/episode-prep/ScriptImporter.tsx` - Script import UI
- `src/components/episode-prep/PrepProgress.tsx` - Progress widgets
- `src/components/episode-prep/SegmentsList.tsx` - Segment management
- `src/components/episode-prep/AIContentReview.tsx` - Content approval UI

### **APIs**
- `src/lib/api/scriptParser.ts` - Perplexity script parser
- `src/lib/api/contentGenerator.ts` - AI content generation

### **Database**
- `CREATE_EPISODE_PREP_TABLES.sql` - Database schema

### **Modified Files**
- `src/components/MorningShowDashboard.tsx` - Added AI Prep tab

---

## 🎉 YOU'RE READY!

The Episode Prep System is fully integrated and ready to use.

**Next steps:**
1. ✅ Run the SQL (Step 1 above)
2. ✅ Reload your dashboard
3. ✅ Click the "AI Prep" tab
4. ✅ Import your first script!

**Questions?** Check the console logs - we've added detailed logging at every step (🤖, ✅, ❌ emojis).

---

**Built with:** React + TypeScript + Perplexity AI + Supabase
**Compatible with:** All existing Morning Show features
**Estimated time saved per episode:** 2-3 hours
