# 🍅 BRB Tomato Game - Setup Guide

## ✅ Integration Complete!

The BRB Tomato Game has been added to your Graphics Overlays!

---

## 📋 Setup Steps

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: `supabase/migrations/add_brb_tomato_game.sql`
3. Click **"Run"**
4. Verify you see: `graphic_type: brb_tomato_game`

---

### Step 2: Add Target Image

The game currently has a placeholder image. To add the Netanyahu image (or any target):

**Option A: Save Image Locally**

1. Save your target image to: `/Users/ibrahim/Desktop/thelivestreamshow/public/targets/`
2. Name it: `netanyahu.jpg` (or any name you want)
3. Edit `/Users/ibrahim/Desktop/thelivestreamshow/public/brb-tomato-game.html`
4. Find line ~282:
   ```javascript
   targetImage.src = 'data:image/svg+xml...
   ```
5. Replace with:
   ```javascript
   targetImage.src = '/targets/netanyahu.jpg';
   ```

**Option B: Use Online URL**

1. Upload image to Imgur or image host
2. Edit `brb-tomato-game.html` line ~282:
   ```javascript
   targetImage.src = 'https://i.imgur.com/your-image-url.jpg';
   ```

---

### Step 3: Test It!

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your livestream app** in browser

3. **Find Graphics Overlays section**

4. **Click "BRB Tomato Game"** - should see it turn ACTIVE (cyan/blue highlight)

5. **Check Broadcast Preview** - should see the game fullscreen

6. **Test throwing tomatoes:**
   - Click anywhere on the preview to throw tomatoes
   - Watch the health bar decrease
   - See the target take damage

---

## 🎮 How to Use During Stream

### Activate the Game:
1. Click **"BRB Tomato Game"** in Graphics Overlays
2. Game appears fullscreen on broadcast
3. Viewers see the game (you control it)

### Play the Game:
- **Click anywhere** → Throw tomato
- **Spacebar** → Random throw
- **R key** → Reset game
- **Click preview** → Hide game

### Game Features:
- ✅ Health bar (100% → 0%)
- ✅ Score tracking
- ✅ Accuracy %
- ✅ Progressive damage (image gets darker)
- ✅ Shake effects (gets more intense)
- ✅ Combo system
- ✅ K.O. animation when health reaches 0
- ✅ Auto-reset after K.O.

---

## 🎯 Controls

| Action | Result |
|--------|--------|
| **Click** | Throw tomato at cursor |
| **Spacebar** | Random throw on target |
| **R** | Reset game |
| **Click preview** | Close/hide overlay |

---

## 🔄 Future: Chat Integration

When we add chat integration, viewers will be able to trigger tomatoes by:
- Typing `🍅` emoji in chat
- Typing `!tomato` command
- Using channel points
- Sending bits

**Coming soon!** For now, you control it manually.

---

## 📂 Files Created/Modified

### Created:
- ✅ `/public/brb-tomato-game.html` - The game HTML file
- ✅ `/supabase/migrations/add_brb_tomato_game.sql` - Database migration

### Modified:
- ✅ `/src/components/GraphicsGallery.tsx` - Added to graphics config

---

## 🎨 Customization

### Change Target Image:
Edit `/public/brb-tomato-game.html` line ~282

### Change Colors:
Edit the CSS in the HTML file:
- Health bar colors
- Background gradient
- Button colors

### Adjust Difficulty:
Edit line ~250 in the HTML:
```javascript
const damage = 5 + Math.random() * 5; // Default: 5-10 damage per hit
```

Change to make it easier/harder:
- Easier: `const damage = 2 + Math.random() * 3;` (2-5 damage)
- Harder: `const damage = 10 + Math.random() * 10;` (10-20 damage)

---

## 🐛 Troubleshooting

### "BRB Tomato Game" doesn't appear in Graphics Overlays
**Fix:**
1. Make sure you ran the database migration
2. Refresh the page
3. Check browser console for errors

### Game shows but no image appears
**Fix:**
1. Check the image path in `brb-tomato-game.html`
2. Make sure image file exists in `/public/targets/`
3. Check browser console for 404 errors

### Tomatoes don't throw
**Fix:**
1. Make sure you clicked on the **Broadcast Preview** area
2. The game iframe needs focus to receive clicks
3. Try clicking directly on the game area

### Health bar doesn't decrease
**Fix:**
- Tomatoes need to HIT the target (inside the bordered area)
- Missing the target doesn't cause damage
- Check accuracy % to see hit rate

---

## ✅ Integration Checklist

- [x] Added to GraphicsGallery.tsx config
- [x] HTML file in /public folder
- [x] Database migration file created
- [ ] Run database migration in Supabase
- [ ] Add target image
- [ ] Test in dev environment
- [ ] Test in broadcast preview
- [ ] Test during actual stream

---

## 🚀 Ready!

Your BRB Tomato Game is integrated! Just run the database migration and add your target image to get started!

**Need help?** Check the troubleshooting section or ask for assistance.

---

## 📸 Screenshot Reference

When active, you should see:
```
Graphics Overlays Panel:
  [Starting Soon]        [  ]
  [BRB]                  [  ]
  [BRB Tomato Game]      [ACTIVE]  ← Should have cyan/blue glow
  [Tech Issues]          [  ]
```

Broadcast Preview:
```
┌─────────────────────────────────┐
│  BE RIGHT BACK                  │
│                                 │
│  [Target Image]                 │
│  Health: ████████░░ 80%         │
│                                 │
│  HITS: 5    ACCURACY: 83%       │
└─────────────────────────────────┘
```
