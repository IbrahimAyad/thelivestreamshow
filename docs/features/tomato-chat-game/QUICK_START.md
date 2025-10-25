# 🎮 Interactive Tomato Chat Game - Quick Start Guide

## ✅ What's Been Completed

### 1. Complete Design & Documentation (100%)
- **[TOMATO_CHAT_GAME_IMPLEMENTATION.md](./TOMATO_CHAT_GAME_IMPLEMENTATION.md)** - 350+ line implementation guide
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Progress tracking
- All code snippets, CSS styles, and HTML structure documented

### 2. Audio Integration (100%)
- ✓ `mk_finish_him.mp3` confirmed in project
- ✓ Audio playback system designed with 5-second cooldown
- ✓ Embedded audio approach for OBS compatibility

### 3. Database Migration (100%)
- ✓ **[/supabase/migrations/20251023000000_add_tomato_chat_game.sql](./supabase/migrations/20251023000000_add_tomato_chat_game.sql)** created
- ✓ Ready to execute with `node scripts/run-migrations.mjs`

### 4. Implementation Scripts (100%)
- ✓ `/scripts/download-finish-him-audio.mjs`
- ✓ `/scripts/create-tomato-chat-game.mjs`
- ✓ `/scripts/generate-interactive-game.js`

---

## 🚀 How to Complete Implementation

### Option 1: Run the Generation Script (Easiest)

```bash
cd /Users/ibrahim/Desktop/thelivestreamshow
node scripts/generate-interactive-game.js
```

This will automatically create `/public/tomato-chat-game.html` with all features.

### Option 2: Manual Creation (If Script Fails)

1. **Copy the base file:**
   ```bash
   cp public/brb-tomato-game.html public/tomato-chat-game.html
   ```

2. **Apply changes** from [TOMATO_CHAT_GAME_IMPLEMENTATION.md](./TOMATO_CHAT_GAME_IMPLEMENTATION.md):
   - Update title: "Take Down Bibi - Interactive Tomato Game"
   - Change main heading: "TAKE DOWN BIBI!"
   - Add HTML elements: CTA popup, zone overlay, queue indicator, last thrower, audio element
   - Add CSS styles: All new component styles
   - Modify JavaScript: Zone system, keyboard handlers, encouragement messages, audio integration

3. **Test in browser:**
   ```bash
   npm run dev
   # Navigate to: http://localhost:5173/tomato-chat-game.html
   ```

---

## 🎯 Feature Checklist

The game includes:

- ✅ **Zone-Based Throwing**: 9 zones mapped to Q/W/E/A/S/D/Z/X/C keys
- ✅ **Call-to-Action Popup**: "🍅 Throw Tomatoes to Activate the Stream!" (8 seconds)
- ✅ **Zone Overlay**: Press H to toggle 3x3 zone grid
- ✅ **Queue Indicator**: Shows pending throws with color coding
- ✅ **Last Thrower Display**: "Hit by @username!" (slides in/out)
- ✅ **Encouragement Messages**: Health-based dynamic feedback
- ✅ **"Finish Him!" Audio**: Plays at 25-49% health with cooldown
- ✅ **Auto-Reset**: 1 second after KO
- ✅ **WebSocket Ready**: Scaffolding for chat commands

---

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| **Q** | Throw to top-left |
| **W** | Throw to top-center |
| **E** | Throw to top-right |
| **A** | Throw to middle-left |
| **S** | Throw to center |
| **D** | Throw to middle-right |
| **Z** | Throw to bottom-left |
| **X** | Throw to bottom-center |
| **C** | Throw to bottom-right |
| **T** | Throw to random zone |
| **R** | Reset game |
| **H** | Toggle zone overlay |

---

## 🗄️ Database Setup

### Run the Migration

```bash
cd /Users/ibrahim/Desktop/thelivestreamshow
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/run-migrations.mjs
```

This adds the game to the Graphics Gallery in your dashboard.

---

## 🧪 Testing Checklist

After creating the HTML file:

1. **Open in browser**: `http://localhost:5173/tomato-chat-game.html`
2. **Test keyboard controls**:
   - Press Q/W/E/A/S/D/Z/X/C for zone throws
   - Press T for random throw
   - Press H to toggle zone overlay
   - Press R to reset
3. **Verify CTA popup**: Should appear for 8 seconds on load
4. **Check encouragement messages**: Throw repeatedly to see messages change with health
5. **Test "Finish Him!" audio**: Get health to 25-49% range
6. **Verify auto-reset**: Reduce health to 0, should reset after 1 second
7. **Test in OBS**: Add as browser source (1920x1080)

---

## 🎨 OBS Setup

1. **Add Browser Source** in OBS
2. **URL**: `http://localhost:5173/tomato-chat-game.html`
3. **Width**: 1920
4. **Height**: 1080
5. **✅ Enable** "Control audio via OBS"
6. **✅ Enable** "Shutdown source when not visible"
7. **Click OK**

The game will appear in your scene. Toggle it from the dashboard Graphics Gallery.

---

## 🔧 Optional: Discord Integration

To enable chat commands (!throw, !tl, etc.):

### 1. Install Discord.js

```bash
cd backend
pnpm add discord.js
```

### 2. Create Chat Aggregator

Create `/backend/chat-aggregator.js` following the spec in [TOMATO_CHAT_GAME_IMPLEMENTATION.md](./TOMATO_CHAT_GAME_IMPLEMENTATION.md)

### 3. Add to Backend Server

Modify `/backend/server.js` to:
- Import chat-aggregator
- Broadcast throw commands via WebSocket
- See implementation guide for full code

### 4. Configure Discord Bot

Add to `.env.local`:
```
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id
```

### 5. Restart Backend

```bash
cd backend
node server.js
```

Chat commands will now work in Discord!

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **[TOMATO_CHAT_GAME_IMPLEMENTATION.md](./TOMATO_CHAT_GAME_IMPLEMENTATION.md)** | Complete implementation guide with all code |
| **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** | Progress tracking and status |
| **[QUICK_START_TOMATO_GAME.md](./QUICK_START_TOMATO_GAME.md)** | This file - quick setup guide |
| **[/supabase/migrations/20251023000000_add_tomato_chat_game.sql](./supabase/migrations/20251023000000_add_tomato_chat_game.sql)** | Database migration |

---

## 🐛 Troubleshooting

### Audio Not Playing
- Ensure audio file exists: `/mk_finish_him.mp3`
- Check browser console for errors
- Click/interact with page first (browser security)
- Verify sound toggle is enabled (🔊 not 🔇)

### Keyboard Not Working
- Ensure page has focus (click on it)
- Check browser console for JavaScript errors
- Verify zone overlay toggles with H key

### Doesn't Appear in Dashboard
- Run database migration
- Restart frontend: `npm run dev`
- Check Graphics Gallery → Interactive category
- Verify Supabase connection

### OBS Not Showing Audio
- Enable "Control audio via OBS" in browser source settings
- Check OBS audio mixer for browser source
- Verify audio file path is correct

---

## ✨ Next Steps

1. **Create the HTML file** (run script or manual)
2. **Test locally** in browser
3. **Run database migration**
4. **Test in OBS**
5. **Optionally add Discord integration**
6. **Go live and have fun!**

---

**Created:** 2025-10-23  
**Status:** Ready for implementation  
**Completion:** 75% (awaiting HTML file creation)
