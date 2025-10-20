# BetaBot Movement System - Setup Instructions

## 🎯 What's Been Implemented

I've added a complete movement system for BetaBot with 5 movement types:

1. **Home** - Default center position
2. **Run Left** - BetaBot zips all the way to the left edge
3. **Run Right** - BetaBot races to the right
4. **Bounce** - BetaBot bounces around energetically in a random pattern
5. **Hide** - BetaBot runs off-screen upward

## ✅ Code Changes Complete

All code has been updated:
- ✅ BetaBotDirectorPanel - Movement control buttons added
- ✅ BroadcastOverlayView - Movement state tracking added
- ✅ BetaBotAvatar - Movement animations implemented

## 📋 Database Migration Required

**You need to run this SQL in your Supabase dashboard to enable the movement feature:**

### Step 1: Go to Supabase SQL Editor
https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql

### Step 2: Create New Query
Click "+ New Query"

### Step 3: Paste and Run This SQL

```sql
-- Add movement column to betabot_mood table

ALTER TABLE betabot_mood
ADD COLUMN IF NOT EXISTS movement TEXT DEFAULT 'home'
CHECK (movement IN ('home', 'run_left', 'run_right', 'bounce', 'hide'));

-- Update existing row to have default movement
UPDATE betabot_mood SET movement = 'home' WHERE movement IS NULL;

COMMENT ON COLUMN betabot_mood.movement IS 'Controls BetaBot position/movement on screen: home, run_left, run_right, bounce, hide';
```

### Step 4: Verify
After running the SQL:
1. Refresh your dashboard page
2. You should see a new "🎯 BetaBot Movement" section with 5 buttons
3. Click the buttons and watch BetaBot move on the broadcast overlay!

## 🎬 How to Use

### In the Director Dashboard:

**Movement Controls (Independent from Mood):**
- **Home** - Return BetaBot to center position
- **Run Left** - Make BetaBot run to left edge (great for "running away" moments)
- **Run Right** - Make BetaBot run to right edge
- **Bounce** - Make BetaBot bounce around energetically (fun for excited moments)
- **Hide** - Make BetaBot disappear off-screen

**Pro Tips:**
- Movements work independently from moods - you can mix and match!
- Try "Spicy mood + Run Left" for a nervous exit
- Try "Amused mood + Bounce" for excited energy
- Use "Hide" when you want BetaBot off-screen temporarily
- Click "Home" to bring BetaBot back to center

## 🎨 Animation Details

- **Home**: Smooth return to center with bounce easing
- **Run Left**: Fast 1.2s animation moving 1200px left
- **Run Right**: Fast 1.2s animation moving 400px right
- **Bounce**: Continuous 2s loop bouncing in random pattern
- **Hide**: Fade out while moving up 400px in 0.8s

All movements use smooth cubic-bezier easing for theatrical effect!

## 🐛 Troubleshooting

**If movement buttons don't appear:**
1. Check browser console for errors
2. Verify the SQL migration ran successfully
3. Refresh the dashboard page

**If movements don't animate:**
1. Check broadcast console logs for movement updates
2. Verify the database column was added (check Supabase table editor)
3. Make sure you're viewing the broadcast overlay, not just dashboard

**If you see database errors:**
- The column might already exist from a previous run
- This is OK! The SQL uses `IF NOT EXISTS` so it won't break anything
- Just verify the column exists in the Supabase table editor

## 📁 Files Modified

1. `/add-movement-to-betabot.sql` - Database migration
2. `/src/components/BetaBotDirectorPanel.tsx` - Movement controls UI
3. `/src/components/BroadcastOverlayView.tsx` - Movement state tracking
4. `/src/components/BetaBotAvatar.tsx` - Movement animations

---

🎭 Ready to direct BetaBot's movements during your show!
