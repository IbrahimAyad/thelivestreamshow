# 🚀 AI Prep - Quick Start Guide

## ⚡ 3-Minute Setup

### **1. Run Database SQL** (One-time only)

```bash
# Open Supabase SQL Editor
# Copy/paste: CREATE_EPISODE_PREP_TABLES.sql
# Click "Run"
```

### **2. Start Using**

1. Open Morning Show Dashboard
2. Click **"AI Prep"** tab (purple button with ✨)
3. Paste script → Click "Parse & Generate"
4. Wait 30 seconds → Review content → Approve items → Queue for broadcast

---

## 📋 Your Monday Script Example

```
MONDAY MORNING SHOW — FULL SCRIPT

TITLE:
"DEALS & REALITY: Understanding Opportunity and Seeing Through the Illusion."

⭐ SEGMENT 1 — TRENDING NEWS
🔥 NEWS STORY 1: CNN x Kalshi
HOST: "Let's start here: CNN just partnered with Kalshi..."

...paste your full script...
```

---

## 🎯 What Happens Next

AI automatically:
- ✅ Detects 7 segments
- ✅ Generates 3 news stories (with Three Layers analysis)
- ✅ Creates 20 listener questions
- ✅ Extracts 8 clip lines
- ✅ Produces 15 talking points

You review in ~10 minutes → Approve best content → Queue to broadcast

---

## 🔄 Integration Flow

```
AI PREP TAB
  ↓ Queue Approved News
morning_news_stories → MorningShowOverlay (news ticker)
  ↓ Queue Approved Questions
show_questions → TTSQueuePanel → BetaBotPopup (during show)
```

---

## 💡 Pro Tips

1. **Generate All at once** - Saves time but may hit rate limits (2-3 min total)
2. **Generate per segment** - More control, slower (30 sec per segment)
3. **Review scores** - Higher engagement score = better content
4. **Use Three Layers** - Layer 2 (Reality) is best for discussion
5. **Queue early** - Generate TTS for questions before show starts

---

## 🎬 Live Example

**Monday at 9 AM:**
- Import Monday script
- AI generates 50+ items in 2 minutes
- Approve 15 questions, 3 news stories (10 minutes)
- Queue for broadcast
- Generate TTS (5 minutes)

**Friday at 10 AM:**
- Go live
- Use prepared content from AI Prep
- Everything ready to go

**Time saved:** 2+ hours per episode

---

## 📞 Need Help?

Check console logs - detailed at every step:
- 🤖 = AI working
- ✅ = Success
- ❌ = Error

All errors show in red boxes with clear messages.

---

**Ready?** Paste your Monday script and click the magic button! ✨
