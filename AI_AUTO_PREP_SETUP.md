# 🤖 AI Auto-Prep Setup Guide

## NEW WORKFLOW (Full Auto)

### Before (Manual):
1. Import script → Parse
2. Generate AI content
3. **Review 86 items manually** ⏰ 15-20 min
4. Click "Queue Approved"
5. Generate TTS for each question ⏰ 5-10 min
6. **Total: 25 minutes**

### After (Auto):
1. Import script → Click "Generate All"
2. **Wait 3 minutes** (AI does everything)
3. Click "Show Script" tab → Script is ready
4. **Total: 3 minutes** ✅

**Time Saved: 88% faster**

---

## 🚀 ONE-TIME SETUP

### Step 1: Run Database Migration

1. Open https://supabase.com/dashboard
2. Navigate to your project
3. Click **SQL Editor**
4. Click **New Query**
5. Copy/paste this SQL:

```sql
-- Add TTS suitability scoring and auto-approval columns
ALTER TABLE episode_ai_content
ADD COLUMN IF NOT EXISTS tts_suitability_score INT CHECK (tts_suitability_score >= 1 AND tts_suitability_score <= 10),
ADD COLUMN IF NOT EXISTS overall_score DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;

-- Create index for sorting by overall_score
CREATE INDEX IF NOT EXISTS idx_episode_ai_content_score ON episode_ai_content(overall_score DESC);
```

6. Click **Run**
7. You should see: "Success. No rows returned"

---

## ✅ HOW TO USE

### Full Auto-Prep Workflow:

1. **Create Episode** (Overview tab)
   - Episode #11
   - Date, Title, Topic

2. **Import Script** (AI Prep tab)
   - Click "Import Script"
   - Paste your full Monday/Friday script
   - Click "Parse & Generate AI Content"

3. **Generate All Segments**
   - Click "Segments" tab
   - Click **"Generate All"** button
   - Wait 2-3 minutes

4. **AI Automatically Does:**
   - ✅ Generates 20 questions per segment
   - ✅ Scores each question for TTS suitability (1-10)
   - ✅ Auto-selects top 10 questions (highest scores)
   - ✅ Auto-approves top 3 news stories
   - ✅ Queues to show_questions table
   - ✅ Queues to morning_news_stories table
   - ✅ **Generates TTS for all 10 questions**
   - ✅ Creates Show Script

5. **View Show Script**
   - Click "Show Script" tab
   - See organized, broadcast-ready script
   - Export to Markdown if needed

6. **Go Live**
   - Keep Show Script tab open
   - Reference during broadcast
   - Play questions from Ultra Chat tab (TTS already generated)

---

## 📋 WHAT AI AUTO-SELECTS

### Top 10 Questions (Auto-Approved)
- Scored by: **40% TTS Suitability + 30% Relevance + 30% Engagement**
- TTS Suitability checks:
  - Natural conversational tone?
  - Good length (50-150 words)?
  - Not too technical/formal?
  - Clear question?

### Top 3 News Stories (Auto-Approved)
- Most relevant stories
- Best Three Layers analysis
- Auto-queued to news ticker

### All Talking Points (Auto-Approved)
- Concise, actionable
- Good for quick reference during show

---

## 🎬 SHOW SCRIPT FORMAT

Clean, easy-to-read during broadcast:

```
SEGMENT 1: TRENDING NEWS
━━━━━━━━━━━━━━━━━━━━━━

📰 NEWS STORY 1: Netflix x Warner Bros
  Layer 1 (Surface): [headline]
  Layer 2 (Reality): [what's actually happening]
  Layer 3 (Narrative): [what someone wants you to believe]

━━━━━━━━━━━━━━━━━━━━━━

SEGMENT 2: REAL ESTATE Q&A
━━━━━━━━━━━━━━━━━━━━━━

❓ QUESTION 1 (TTS Ready ✅)
  "Hey Ibrahim, I'm buying my first duplex..."
  Scores: TTS 9/10 | Relevance 8/10

💡 TALKING POINTS
  • Austin market down 12% from peak
  • If cash flows today, you're good
  • House hacking = forced savings
```

---

## 🔧 BEHIND THE SCENES

### AI Scoring Process:

1. **Generate 20 questions per segment**
2. **Score each question:**
   - TTS Suitability: 1-10
   - Relevance: 1-10
   - Engagement: 1-10
3. **Calculate overall score:**
   - `overall_score = (TTS × 0.4) + (relevance × 0.3) + (engagement × 0.3)`
4. **Auto-approve top 10 questions** (highest overall_score)
5. **Auto-queue to show_questions**
6. **Auto-generate TTS** (2 sec delay between each)

### Example Scoring:

```
Question: "Hey Ibrahim, should I wait for rates to drop before buying?"
  TTS Score: 9/10 (natural, conversational, good length)
  Relevance: 8/10 (highly relevant to market)
  Engagement: 9/10 (common question, relatable)
  Overall: (9×0.4) + (8×0.3) + (9×0.3) = 8.7
  → Auto-approved ✅
```

```
Question: "Explain the nuances of cost segregation study methodologies"
  TTS Score: 3/10 (too technical, formal language)
  Relevance: 7/10 (relevant but niche)
  Engagement: 4/10 (boring, too complex)
  Overall: (3×0.4) + (7×0.3) + (4×0.3) = 4.5
  → Not auto-approved ❌
```

---

## 📊 DATABASE UPDATES

### New Columns in `episode_ai_content`:

- `tts_suitability_score` (INT 1-10): How good for TTS
- `overall_score` (DECIMAL): Weighted average score
- `auto_approved` (BOOLEAN): Whether AI auto-approved (vs manual)

### Auto-Approval Logic:

```sql
-- Get top 10 questions for auto-approval
SELECT * FROM episode_ai_content
WHERE episode_info_id = 'xxx'
  AND content_type = 'listener_question'
ORDER BY overall_score DESC
LIMIT 10;
```

---

## ⚠️ IMPORTANT NOTES

### If You Don't Like a Question:
- **Just skip it during the live show**
- No big deal - that's why we auto-select 10 (use 5-7 typically)
- Bad questions don't hurt the show if you don't use them

### If You Want Different Questions:
- Future enhancement: "Regenerate Questions" button
- For now: Just don't use the ones you don't like

### TTS Generation Time:
- 10 questions × 2 seconds each = ~20 seconds
- Plus audio generation time ≈ 60-90 seconds total
- All automatic, no user action needed

---

## 🎯 REAL WORKFLOW EXAMPLE

**Monday at 8:00 AM:**
1. Open AI Prep tab
2. Paste Monday script
3. Click "Generate All"
4. Go get coffee ☕

**Monday at 8:03 AM:**
5. Come back, click "Show Script"
6. See organized script with 10 questions (TTS ready)
7. Export as Markdown for backup

**Friday at 10:00 AM:**
8. Go live
9. Keep Show Script open
10. Use questions from Ultra Chat tab (play TTS)
11. Reference news Three Layers during discussion

**Result:** 2 hours of prep work → 3 minutes ⚡

---

## 📈 SUCCESS METRICS

After using this for a few episodes, you should see:

- ✅ Prep time: 25 min → 3 min (88% faster)
- ✅ TTS ready before show (no manual generation)
- ✅ Organized script for easy reference
- ✅ Consistent quality (AI picks best questions)
- ✅ No manual review fatigue (86 items → 0 items to review)

---

## 🆘 TROUBLESHOOTING

### "No questions generated"
- Check Perplexity API key is set
- Check segment type is 'real_estate_qa' or 'deal_structures'
- News segments don't generate questions (only news stories)

### "TTS generation failed"
- Check Supabase Edge Function is deployed
- Check ElevenLabs API quota
- Non-critical: Can manually regenerate in Ultra Chat tab

### "Show Script is empty"
- Make sure you clicked "Generate All" first
- Check console for errors
- Reload the page

---

**Ready?** Import a script and click "Generate All"! ✨
