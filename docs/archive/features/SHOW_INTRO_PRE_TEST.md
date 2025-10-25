# Show Intro Controller - Pre-Test Checklist & Setup

## ✅ Good News!

**You DON'T need to update Supabase!** The graphics you need (`brb_tomato_game` and `ai_dj_visualizer`) are already configured in your database.

---

## 🧪 Pre-Test Verification

Before testing the intro controller, let's verify everything is set up correctly.

### Step 1: Verify Graphics in Database

Run this command to check your graphics:

```bash
npx tsx scripts/setup-graphics.ts
```

**Expected output:**
```
✅ Updated: brb_tomato_game
✅ Updated: ai_dj_visualizer
...
✅ Total graphics in database: 16
```

If you see errors, the script will automatically fix them!

---

## 🎯 Quick Test Plan

### Test 1: Verify Graphics Exist (1 minute)

1. **Open your browser**: http://localhost:5173
2. **Find Graphics Overlays** section
3. **Look for these buttons**:
   - ✅ "Tomato" (with Target icon 🎯)
   - ✅ "AI DJ" (with Sparkles icon ✨)

If you see both buttons, you're good! ✅

---

### Test 2: Test Graphics Toggle (2 minutes)

1. **Click "Tomato" button**
   - Should turn ACTIVE (cyan glow)
   - Tomato game should appear in broadcast view
   
2. **Click "Tomato" again**
   - Should turn inactive (gray)
   - Game should disappear

3. **Click "AI DJ" button**
   - Should turn ACTIVE
   - DJ visualizer should appear in broadcast view

4. **Click "AI DJ" again**
   - Should turn inactive
   - Visualizer should disappear

If all toggles work, graphics are ready! ✅

---

### Test 3: Test Boss Defeat Event (3 minutes)

1. **Click "Tomato" to show game**
2. **Click on the game multiple times** to throw tomatoes
3. **Watch health bar decrease** from 100% → 0%
4. **When health reaches 0**:
   - "ELIMINATED!" text should appear (1 second)
   - Game should auto-reset after 1 second

5. **Check browser console** (F12 → Console tab):
   - Should see: `BOSS_DEFEATED event sent` or similar
   - No errors should appear

If you see the K.O. animation and no errors, boss event is working! ✅

---

## 📋 Complete Pre-Test Checklist

Run through this before testing the intro controller:

- [ ] Dev server running (`npm run dev`)
- [ ] Browser open at http://localhost:5173
- [ ] Graphics setup verified (ran `npx tsx scripts/setup-graphics.ts`)
- [ ] "Tomato" button visible in Graphics Overlays
- [ ] "AI DJ" button visible in Graphics Overlays
- [ ] Tomato game toggles on/off correctly
- [ ] AI DJ visualizer toggles on/off correctly
- [ ] Boss defeat shows "ELIMINATED!" for 1 second
- [ ] No errors in browser console

---

## 🚀 Ready to Test Intro Controller!

Once all checkboxes above are ✅, you're ready to:

1. **Add ShowIntroController** to your dashboard
2. **Load two songs** on Deck A and B
3. **Run a test sequence!**

---

## 🔧 If Something's Wrong

### Graphics Don't Appear

**Run this fix:**
```bash
npx tsx scripts/setup-graphics.ts
```

Then refresh your browser.

### Boss Defeat Not Detected

**Check browser console** for errors. The game should send a `postMessage` when boss is defeated.

**Verify the update was applied:**
1. Open: `/public/brb-tomato-game.html`
2. Search for: `window.parent.postMessage`
3. Should see: `window.parent.postMessage({ type: 'BOSS_DEFEATED' }, '*');`

### Graphics Table Doesn't Exist

**Create the table** (this is rare, usually already exists):

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS broadcast_graphics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  graphic_type TEXT UNIQUE NOT NULL,
  is_visible BOOLEAN DEFAULT false,
  position TEXT DEFAULT 'fullscreen',
  html_file TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💡 Pro Tips

### Before Your First Stream

1. **Do a full test run** of the intro sequence (8-10 minutes)
2. **Test boss defeat** at least 3 times
3. **Verify graphics transitions** are smooth
4. **Check OBS browser source** shows everything correctly

### During Testing

1. **Use manual skip buttons** to jump between steps
2. **Test pause/resume** functionality
3. **Watch the progress bar** to track sequence
4. **Monitor browser console** for errors

---

## ✅ Final Verification Script

Want to verify everything automatically? Run this:

```bash
# Verify graphics
npx tsx scripts/setup-graphics.ts

# Check if files exist
ls -la public/brb-tomato-game.html
ls -la public/animations/ai-dj-visualizer.html

# Verify boss defeat event in game
grep -n "BOSS_DEFEATED" public/brb-tomato-game.html
```

**Expected output:**
```
✅ Graphics setup complete
✅ brb-tomato-game.html exists
✅ ai-dj-visualizer.html exists
✅ Line 925: window.parent.postMessage({ type: 'BOSS_DEFEATED' }, '*');
```

---

## 🎉 You're All Set!

No Supabase migration needed! Everything is already configured.

Just verify the graphics work, then you can test the intro controller.

See you at the test run! 🚀
