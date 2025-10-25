# 🎬 Episode Overlay - Visual Test Guide

## ✅ Current Status

**Database Verified:**
- ✅ Episode #32: "Test"
- ✅ Date: 2025-10-22
- ✅ is_visible: `TRUE`
- ✅ Component: `PiNamecardOverlay` integrated

---

## 🚀 Step-by-Step Test

### **Step 1: Restart Dev Server**

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
cd /Users/ibrahim/Desktop/thelivestreamshow
npm run dev
```

**Why?** The new [PiNamecardOverlay](file:///Users/ibrahim/Desktop/thelivestreamshow/src/components/broadcast/PiNamecardOverlay.tsx) component needs to be loaded.

---

### **Step 2: Hard Refresh Browser**

**Mac:** `Cmd + Shift + R`  
**Windows/Linux:** `Ctrl + Shift + R`

**Clear cache** to ensure new component loads.

---

### **Step 3: Open Broadcast View**

Navigate to: `http://localhost:5173/broadcast`

---

### **Step 4: Look for the Overlay**

**Location:** **Bottom-right corner**

**What to look for:**

```
┌────────────────┐
│ EP 32          │  ← Gold text (#FCD34D)
│ Oct 22, 2025   │  ← Gray text (#9CA3AF)
│ Test           │  ← White text (#E5E7EB)
└────────────────┘
   ↑ Gold right border (3px)
   ↑ Dark background (semi-transparent)
```

---

## 🔍 Troubleshooting

### ❌ "I don't see anything"

**Check 1: Browser Console**
```
Press F12 → Console tab
Look for errors about:
- useEpisodeInfo
- PiNamecardOverlay
- Supabase connection
```

**Check 2: Component Rendering**
```
Press F12 → Elements tab
Search for: "pi-namecard-overlay"
If not found → Component not rendering
```

**Check 3: Database State**
```bash
# Run verification script
npx tsx scripts/verify-and-update-episode-info.ts

# Should show:
# ✅ is_visible: true
# 🟢 Episode overlay will SHOW on broadcast
```

---

### ❌ "I see the old text box instead"

**Old Episode Display** (if you see this, we need to remove it):
- Text in top status bar
- Shows "currentShow", "currentEpisode"
- Plain text, no styling

**New Episode Overlay** (what you should see):
- Bottom-right corner
- Gold border on right side
- Professional card design
- Dark semi-transparent background

---

## 🧪 Test Visibility Toggle

### **From Director Panel:**

1. Go to `http://localhost:5173` → Director Panel
2. Scroll to "🎬 Episode Info" panel
3. Find the **"👁 On Air"** button (should be green)
4. **Click it**
5. ✅ Should turn gray: **"👁❌ Hidden"**
6. Check `/broadcast` → Overlay disappears
7. **Click "Hidden" button** again
8. ✅ Should turn green: **"👁 On Air"**
9. Check `/broadcast` → Overlay appears

---

## 📊 Database Check

**Verify episode data:**

```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  episode_number,
  episode_title,
  episode_date,
  episode_topic,
  is_active,
  is_visible
FROM episode_info 
WHERE is_active = true;
```

**Expected result:**
```
episode_number: 32
episode_title: "Test"
episode_date: "2025-10-22"
is_active: true
is_visible: true ✅
```

---

## 🎨 Customize Position (Optional)

### **Change to Top-Right:**

Edit [`BroadcastOverlayView.tsx`](file:///Users/ibrahim/Desktop/thelivestreamshow/src/components/BroadcastOverlayView.tsx#L820-L821):

```tsx
// Change from:
<PiNamecardOverlay />

// To:
<PiNamecardOverlay position="top" />
```

### **Custom Position:**

```tsx
<PiNamecardOverlay 
  position="custom" 
  customPosition={{ 
    top: '100px', 
    left: '50px' 
  }} 
/>
```

---

## 📷 Visual Comparison

### **OLD (Remove if you see this):**
```
Status Bar (top)
─────────────────────────────────────
│ Show: Alpha Wednesdays             │
│ Episode: 32 - Who is to Blame?     │
─────────────────────────────────────
```

### **NEW (What you should see):**
```
Broadcast Screen
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                      ┌────────────┐ │
│                      │ EP 32      │ │ ← Bottom-right
│                      │ Oct 22     │ │
│                      │ Test       │ │
│                      └────────────┘ │
└─────────────────────────────────────┘
```

---

## ✅ Expected Behavior Checklist

- [ ] Dev server restarted
- [ ] Browser cache cleared (hard refresh)
- [ ] Navigate to `/broadcast`
- [ ] See overlay in **bottom-right corner**
- [ ] Gold border on right side
- [ ] Dark semi-transparent background
- [ ] Shows `EP 32`
- [ ] Shows `Oct 22, 2025`
- [ ] Shows `Test`
- [ ] Toggle button works in Director Panel
- [ ] Overlay appears/disappears instantly
- [ ] No old text box in status bar

---

## 🔧 Manual Fix (If Needed)

### **If overlay still doesn't show:**

**1. Force visibility in database:**
```sql
UPDATE episode_info 
SET is_visible = TRUE 
WHERE episode_number = 32;
```

**2. Check component file exists:**
```bash
ls -la src/components/broadcast/PiNamecardOverlay.tsx
# Should show the file
```

**3. Check hook file exists:**
```bash
ls -la src/hooks/useEpisodeInfo.ts
# Should show the file
```

**4. Verify import in BroadcastOverlayView:**
```bash
grep "PiNamecardOverlay" src/components/BroadcastOverlayView.tsx
# Should show:
# import { PiNamecardOverlay } from './broadcast/PiNamecardOverlay'
# <PiNamecardOverlay />
```

---

## 📝 Quick Test Commands

```bash
# 1. Verify files exist
ls -la src/components/broadcast/PiNamecardOverlay.tsx
ls -la src/hooks/useEpisodeInfo.ts

# 2. Check database
npx tsx scripts/verify-and-update-episode-info.ts

# 3. Restart dev server
npm run dev

# 4. Open broadcast
# http://localhost:5173/broadcast
```

---

## 🎯 Success Criteria

**You'll know it's working when you see:**

1. ✅ **Gold-bordered card** in bottom-right corner
2. ✅ **"EP 32"** in gold text
3. ✅ **"Oct 22, 2025"** in gray text
4. ✅ **"Test"** in white text
5. ✅ **Smooth fade-in animation** when appearing
6. ✅ **Instant disappear** when toggling off
7. ✅ **No old text box** in top status bar

---

## 🆘 Still Not Working?

**Check browser console for these specific errors:**

```
❌ "Cannot find module './broadcast/PiNamecardOverlay'"
→ File path issue, check file exists

❌ "useEpisodeInfo is not a function"
→ Hook import issue, check hook file exists

❌ "Supabase connection error"
→ Database connection issue, check Supabase credentials

❌ "episodeInfo is null"
→ No episode data, create episode in Director Panel
```

**If you see ANY of these, report the exact error message.**

---

## 🎉 Final Verification

**After restart, you should:**

1. ✅ See professional overlay (not plain text)
2. ✅ Be able to toggle visibility from Director Panel
3. ✅ See real-time updates when you change episode data
4. ✅ Have a gold right border and dark background
5. ✅ See the overlay positioned in bottom-right corner

---

**Status:** ⏳ **Awaiting Visual Confirmation**

**Next:** Restart dev server, hard refresh browser, and report what you see at `/broadcast`
