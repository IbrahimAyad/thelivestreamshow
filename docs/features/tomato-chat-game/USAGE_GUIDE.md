# Tomato Chat Game - Usage Guide

## Overview
The **Tomato Chat Game** ("Take Down Bibi!") is a fully integrated interactive overlay game in your livestream system. Viewers can participate via Discord chat commands (future) while you control it via keyboard during the stream.

## ✅ Integration Complete

The game is now:
- ✅ Registered in `broadcast_graphics` database
- ✅ Available in Studio Control Panel
- ✅ Accessible at `http://localhost:3000/tomato-chat-game.html`
- ✅ Integrated with `BroadcastOverlayView` component
- ✅ Works like all other graphics overlays

## How to Use During Stream

### 1. Enable the Game
**Option A: Via Studio Control Panel**
1. Open Studio Control Panel (`http://localhost:3000/studio`)
2. Find "Graphics" or "Broadcast Graphics" section
3. Toggle "Tomato Chat Game" visibility to ON
4. Game appears fullscreen in OBS

**Option B: Via Database (if no UI yet)**
```sql
UPDATE broadcast_graphics
SET is_visible = true
WHERE graphic_type = 'tomato_chat_game';
```

**Option C: Via Supabase Dashboard**
1. Open Supabase dashboard
2. Go to Table Editor → `broadcast_graphics`
3. Find row with `graphic_type = 'tomato_chat_game'`
4. Toggle `is_visible` to `true`

### 2. Game Controls (Keyboard)

| Key | Action |
|-----|--------|
| **Q/W/E** | Throw to Top Row zones |
| **A/S/D** | Throw to Middle Row zones |
| **Z/X/C** | Throw to Bottom Row zones |
| **T** | Throw tomato at last selected zone |
| **R** | Reset game |
| **H** | Toggle zone overlay (debug) |
| **Space** | Close game (sets is_visible = false) |

### 3. Game Features

#### Automatic Behaviors
- **8-second popup**: After 8 seconds, a "Want to play?" popup appears with Discord info
- **"Finish Him!" audio**: Plays when Bibi's health is low (5-second cooldown)
- **Encouragement messages**: Dynamic messages based on remaining health
  - "Take Him Down!" (80-100 HP)
  - "Almost There!" (50-79 HP)
  - "One More Hit!" (30-49 HP)
  - "FINISH HIM!" (< 30 HP)
- **Auto-reset**: 1 second after KO screen, game resets automatically
- **Natural variance**: ±50px variance in throws for realistic gameplay

#### Health System
- Bibi starts with 100 HP
- Each tomato hit deals random 8-15 damage
- Health bar shows remaining health visually
- KO animation when health reaches 0

### 4. Viewer Participation (Discord - Future)

The game is ready for Discord integration:
- WebSocket client scaffolding in place
- Backend will listen for Discord commands: `!throw Q`, `!throw S`, etc.
- Commands will trigger keyboard events programmatically
- See `docs/features/tomato-chat-game/IMPLEMENTATION.md` for technical details

## Testing

### Quick Test (Manual)
1. Open `http://localhost:3000/tomato-chat-game.html` in browser
2. Try keyboard controls: Q/W/E/A/S/D/Z/X/C
3. Press T to throw at current zone
4. Verify:
   - Tomato throw animation works
   - Health bar decreases
   - "Finish Him!" audio plays at low health
   - KO screen appears at 0 HP
   - Auto-reset after KO

### Test in OBS
1. Add Browser Source to OBS
2. URL: `http://localhost:3000/tomato-chat-game.html`
3. Size: 1920x1080
4. Enable "Shutdown source when not visible"
5. Test keyboard controls while source is active

### Test via Broadcast System
1. Open Broadcast Overlay: `http://localhost:3000/broadcast`
2. Toggle game visibility via Studio Control Panel
3. Game should appear as fullscreen overlay
4. Click anywhere to close (triggers `is_visible = false`)
5. Verify real-time update in database

## File Locations

| File | Location |
|------|----------|
| **Game HTML** | `public/tomato-chat-game.html` |
| **Registration Script** | `scripts/add-tomato-chat-game-graphic.ts` |
| **Verification Script** | `scripts/check-tomato-game.ts` |
| **Documentation** | `docs/features/tomato-chat-game/` |
| **Database Entry** | `broadcast_graphics` table, `graphic_type = 'tomato_chat_game'` |

## Troubleshooting

### Game doesn't appear
1. Check `broadcast_graphics` table: is `is_visible = true`?
2. Verify HTML file exists: `ls public/tomato-chat-game.html`
3. Check browser console for errors
4. Ensure `BroadcastGraphicsDisplay` component is mounted in `BroadcastOverlayView`

### Keyboard controls don't work
1. Make sure game iframe has focus (click inside it)
2. Check browser console for keyboard event errors
3. Verify you're using the right keys: Q/W/E/A/S/D/Z/X/C

### Audio doesn't play
1. Check browser audio permissions
2. Verify `finish-him.mp3` exists in HTML file (embedded)
3. Check console for audio loading errors
4. Note: 5-second cooldown between audio plays

### Game won't close
1. Press Space key while game is focused
2. Or manually set `is_visible = false` in database
3. Or click anywhere on the game overlay

## Next Steps

### Phase 2: Discord Integration (Future)
To enable Discord chat control:
1. Implement backend WebSocket broadcast for keyboard events
2. Add Discord bot commands: `!throw Q`, `!throw A`, etc.
3. Backend translates Discord commands → WebSocket → Game HTML
4. Update game to listen for WebSocket commands
5. See full implementation plan in `IMPLEMENTATION.md`

### Phase 3: Analytics (Future)
- Track total throws per stream
- Track KOs per stream
- Track most popular throw zones
- Leaderboard of top throwers (by Discord username)

## Related Files
- [README.md](./README.md) - Project overview
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Technical implementation details
- [FINAL_REPORT.md](./FINAL_REPORT.md) - Complete implementation report

---

**Status**: ✅ Fully Integrated | **Version**: 1.0 | **Last Updated**: 2025-10-23
