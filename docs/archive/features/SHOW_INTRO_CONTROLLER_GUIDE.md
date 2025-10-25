# Show Intro Controller - Implementation Guide

## ✅ What Was Built

An automated show intro controller that orchestrates a professional 8-10 minute opening sequence using your existing DJ system, tomato game, and graphics overlays.

---

## 🎬 The Sequence

```
0:00 → 3:30  │ Song 1 plays on Deck A with DJ visualizer
             │
3:30 → 4:30  │ 60-second smooth crossfade to Song 2 on Deck B
             │
4:30 → ~5:49 │ Song 2 plays until timestamp 1:19.5
             │
~5:49        │ PAUSE Song 2 at exactly 1:19.5
             │ Show tomato game graphic
             │
[WAITING...] │ ⏳ No timer - game runs until boss defeated
             │ Viewers throw tomatoes at target
             │
[BOSS KO!]   │ 💥 "ELIMINATED!" appears (1 second)
             │ Automatically resume Song 2 from 1:19.5
             │ Smooth transition: Game → Main screen
             │
[CONTINUE]   │ Song 2 plays to natural completion
             │
[END]        │ Intro sequence complete! ✅
```

---

## 📁 Files Created

### 1. **`/src/hooks/useShowIntroSequence.ts`**
Timeline state machine and orchestration logic
- Manages 7 sequence steps
- Monitors deck playback positions
- Listens for boss defeated events
- Auto-progresses through timeline
- Controls graphics visibility

### 2. **`/src/components/ShowIntroController.tsx`**
React UI component for the controller
- Real-time status display
- Progress bar visualization
- Timeline step tracker
- Play/pause/stop controls
- Manual skip buttons (for testing)
- Error handling display

### 3. **Updated: `/public/brb-tomato-game.html`**
Added boss defeated event emission
- Sends `postMessage` when boss is eliminated
- Reduced K.O. animation from 3s to 1s
- Fires event to parent window for detection

---

## 🚀 How to Use

### Step 1: Add to Your Dashboard

Find where you want the intro controller to appear in your dashboard, then add:

```tsx
import { ShowIntroController } from '@/components/ShowIntroController'
import { useDualDeckAudioPlayer } from '@/hooks/studio/useDualDeckAudioPlayer'

function YourDashboard() {
  const dualDeck = useDualDeckAudioPlayer()
  
  return (
    <div>
      {/* Your existing dashboard content */}
      
      <ShowIntroController dualDeck={dualDeck} />
    </div>
  )
}
```

### Step 2: Load Your Songs

Before starting the intro sequence, make sure you have:
1. **Song 1** loaded on **Deck A**
2. **Song 2** loaded on **Deck B**

You can do this via your existing DJ interface or programmatically:

```tsx
// Load tracks
await dualDeck.deckA.loadTrack(song1)
await dualDeck.deckB.loadTrack(song2)
```

### Step 3: Start the Sequence

Click the **"Start Intro Sequence"** button in the controller UI.

The sequence will:
- ✅ Play Song 1 automatically
- ✅ Crossfade to Song 2 at 3:30
- ✅ Pause at 1:19.5 and show game
- ✅ Wait for boss defeat (no timer)
- ✅ Resume and finish automatically

---

## 🎮 Game Integration

### How Boss Defeat Works

The tomato game now sends an event when the boss is eliminated:

```javascript
// In brb-tomato-game.html
function showKO() {
  // K.O. animation displays
  koScreen.style.display = 'flex';
  
  // Send event to parent
  window.parent.postMessage({ type: 'BOSS_DEFEATED' }, '*');
  
  // Reset after 1 second
  setTimeout(() => { ... }, 1000);
}
```

The intro controller listens for this event:

```typescript
// In useShowIntroSequence.ts
window.addEventListener('message', (event) => {
  if (event.data.type === 'BOSS_DEFEATED') {
    // Automatically resume sequence
    handleBossDefeated();
  }
});
```

### No Timer Pressure

- Game runs indefinitely until boss is defeated
- No countdown timer shown
- Natural gameplay experience
- Sequence waits patiently at "game_active" step

---

## ⚙️ Configuration

You can customize the timing by passing a config object:

```tsx
<ShowIntroController 
  dualDeck={dualDeck}
  config={{
    song1Duration: 210,        // 3:30 (default)
    crossfadeDuration: 60,     // 1:00 (default)
    song2PausePoint: 79.5,     // 1:19.5 (default)
    transitionDelay: 1,        // 1 second (default)
  }}
/>
```

---

## 🎛️ Manual Controls

The controller provides several manual override options:

### Playback Controls
- **Start** - Begin the automated sequence
- **Pause** - Pause at current step (also pauses audio)
- **Resume** - Resume from paused state
- **Stop** - Completely stop and reset

### Skip Controls (Testing)
For development/testing, you can skip to specific steps:
- **→ Crossfade** - Jump to crossfade step
- **→ Game** - Jump directly to game
- **→ Resume** - Jump to resume step

---

## 📊 Status Display

The UI shows:

### Progress Bar
- Visual percentage of sequence completion
- Color-coded (purple = playing, yellow = game, green = complete)

### Current Step
- Large status card showing current step
- Icon and description
- Special indicator for "game_active" (waiting state)

### Timeline Visualization
- List of all steps
- Shows past (✓), current (● ACTIVE), and future steps
- Easy to see where you are in the sequence

### Elapsed Time
- Real-time timer
- Shows current time / estimated total (~10:00)

---

## 🎨 Graphics Integration

The controller automatically manages graphics via Supabase:

### Automatic Toggles

**When Game Starts:**
- ✅ Show `brb_tomato_game`
- ❌ Hide `ai_dj_visualizer`

**When Game Ends:**
- ❌ Hide `brb_tomato_game`
- ✅ Show `ai_dj_visualizer`

All changes sync to your broadcast view in real-time.

---

## 🔧 Technical Details

### State Machine

The sequence uses a finite state machine with these states:

```typescript
type IntroStep = 
  | 'idle'              // Not started
  | 'song1_playing'     // Song 1 on Deck A
  | 'crossfading'       // Crossfade A→B
  | 'song2_playing'     // Song 2 to pause point
  | 'game_active'       // Waiting for boss
  | 'resuming'          // Boss defeated, resuming
  | 'song2_finishing'   // Song 2 to end
  | 'complete'          // Finished
```

### Auto-Progression

The sequence monitors deck playback positions every 100ms and automatically advances:

```typescript
// Example: Detect when to pause
if (deckB.playbackPosition >= song2PausePoint) {
  setCurrentStep('game_active');
  deckB.pause();
  showGame();
}
```

### Event-Driven Resume

The game step waits indefinitely until receiving the boss defeated event:

```typescript
// No timer - purely event-driven
if (event.data.type === 'BOSS_DEFEATED') {
  setCurrentStep('resuming');
}
```

---

## 🧪 Testing

### Test the Full Sequence

1. Load two songs on Deck A and B
2. Click "Start Intro Sequence"
3. Let it run automatically
4. When game appears, defeat the boss
5. Watch it automatically resume and finish

### Test Individual Steps

Use the manual skip buttons to jump to specific steps:

```
Start → Skip to Game → Defeat boss → Watch resume
```

### Test Boss Defeat Detection

1. Skip directly to "Game" step
2. Click on game to throw tomatoes
3. Defeat boss (health to 0)
4. Verify "ELIMINATED!" appears (1 second)
5. Confirm sequence auto-resumes

---

## 📝 Example Integration

Here's a complete example of adding it to your main dashboard:

```tsx
// src/pages/Dashboard.tsx
import { ShowIntroController } from '@/components/ShowIntroController'
import { useDualDeckAudioPlayer } from '@/hooks/studio/useDualDeckAudioPlayer'

export function Dashboard() {
  const dualDeck = useDualDeckAudioPlayer()
  
  return (
    <div className="p-6 space-y-6">
      {/* Show Intro Controller */}
      <ShowIntroController dualDeck={dualDeck} />
      
      {/* Your other dashboard components */}
      <GraphicsGallery />
      <QuestionBanner />
      <LowerThirds />
    </div>
  )
}
```

---

## ⚠️ Important Notes

### Pre-requirements

Before starting the sequence, ensure:
1. ✅ Dual-deck system is initialized
2. ✅ Song 1 is loaded on Deck A
3. ✅ Song 2 is loaded on Deck B
4. ✅ Both songs are ready to play
5. ✅ Graphics system is connected to Supabase

### Audio Context

The dual-deck system requires user interaction to start audio:
- First click/interaction resumes AudioContext
- After that, automation works automatically

### OBS Browser Source

If using in OBS:
- Add the broadcast view as a browser source
- Graphics will update automatically
- No additional OBS control needed

---

## 🎯 Next Steps

### Optional Enhancements

You can extend this system with:

1. **Pre-show Countdown**
   - Add countdown timer before Song 1 starts
   - Show "Starting in 5... 4... 3..."

2. **Multiple Game Options**
   - Support different games at the pause point
   - Choose game type via UI

3. **Custom Transitions**
   - Add fade in/out animations
   - Customize crossfade curves

4. **Save Presets**
   - Save favorite intro configurations
   - Quick-load saved sequences

5. **Recording Integration**
   - Auto-start OBS recording with sequence
   - Auto-stop recording when complete

---

## 🐛 Troubleshooting

### Sequence Won't Start
- **Check:** Are both decks loaded with songs?
- **Fix:** Load tracks before clicking start

### Game Doesn't Show
- **Check:** Is `brb_tomato_game` in your database?
- **Fix:** Run graphics setup migration

### Boss Defeat Not Detected
- **Check:** Is the game iframe on the same origin?
- **Fix:** Ensure both dashboard and game are on `localhost:5173`

### Crossfade Not Smooth
- **Check:** Crossfader curve setting
- **Fix:** Use 'smooth' curve for equal-power crossfade

---

## 📚 API Reference

### useShowIntroSequence Hook

```typescript
const intro = useShowIntroSequence(dualDeck, config?)

// State
intro.state.currentStep      // Current step in sequence
intro.state.elapsedTime      // Seconds elapsed
intro.state.isRunning        // Is sequence active?
intro.state.isPaused         // Is sequence paused?
intro.state.error            // Error message if any

// Controls
intro.start()                // Start sequence
intro.pause()                // Pause sequence
intro.resume()               // Resume from pause
intro.stop()                 // Stop and reset
intro.skipToStep(step)       // Jump to specific step

// Config
intro.config.song1Duration          // Song 1 length
intro.config.crossfadeDuration      // Crossfade time
intro.config.song2PausePoint        // When to pause Song 2
intro.config.transitionDelay        // ELIMINATED delay
```

---

## ✅ Summary

You now have a fully automated show intro controller that:

✅ **Uses your existing systems** - DJ decks, graphics, game  
✅ **Event-driven gameplay** - No timer pressure on game  
✅ **Smooth transitions** - Professional crossfades and graphics  
✅ **Real-time monitoring** - Live progress and status display  
✅ **Manual overrides** - Full control when needed  
✅ **Easy integration** - Drop into any dashboard page  

**Ready for your first live stream!** 🎉

---

## 🎬 Quick Start Checklist

- [ ] Load Song 1 on Deck A
- [ ] Load Song 2 on Deck B
- [ ] Add `<ShowIntroController>` to dashboard
- [ ] Click "Start Intro Sequence"
- [ ] Enjoy automated intro! 🎵🎮🎉
