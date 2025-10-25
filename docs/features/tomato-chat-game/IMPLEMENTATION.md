# Interactive Tomato Chat Game - Implementation Summary

## ✅ COMPLETED WORK

### Phase 1: Audio Preparation (COMPLETE)
- ✅ Created `/public/audio/` directory
- ✅ Confirmed `mk_finish_him.mp3` audio file is available in project  
- ✅ Audio will be embedded in game HTML for OBS browser source compatibility

### Phase 2: Frontend Game Implementation (PARTIAL - 20% COMPLETE)
- ✅ Created implementation scripts
- ⏸️ **IN PROGRESS**: Full HTML file creation

**Files Created:**
- `/scripts/download-finish-him-audio.mjs` - Audio download utility
- `/scripts/create-tomato-chat-game.mjs` - Game file generator

## 🔄 REMAINING IMPLEMENTATION

### Phase 2: Frontend Game (Remaining 80%)

The complete `tomato-chat-game.html` file needs to be created with these features:

#### HTML Structure Changes:
1. **Title**: "Take Down Bibi - Interactive Tomato Game"
2. **Main Heading**: "TAKE DOWN BIBI!" instead of "BE RIGHT BACK"
3. **Call-to-Action Popup** (shows for 8 seconds on load):
   - "🍅 Throw Tomatoes to Activate the Stream! 🍅"
   - "Press T to throw • Type !throw in chat"
4. **Zone Overlay Grid** (toggle with H key):
   - 3x3 grid showing Q/W/E/A/S/D/Z/X/C zones
5. **Queue Indicator** (bottom-right):
   - Shows pending throw count
   - Color-coded: Green (0-10), Yellow (11-30), Red (31-50)
6. **Last Thrower Display** (top-right):
   - Slides in showing "Hit by @username!"
   - Fades out after 3 seconds
7. **Encouragement Message Container**:
   - Dynamic messages based on health level
8. **Audio Element**:
   ```html
   <audio id="finishHimAudio" preload="auto">
       <source src="/mk_finish_him.mp3" type="audio/mpeg">
   </audio>
   ```

#### JavaScript Functionality:

**1. Zone-Based Throwing System:**
```javascript
const ZONES = {
    TL: { x: 150, y: 175, key: 'Q' },  // Top-Left
    TC: { x: 300, y: 175, key: 'W' },  // Top-Center
    TR: { x: 450, y: 175, key: 'E' },  // Top-Right
    ML: { x: 150, y: 350, key: 'A' },  // Middle-Left
    C:  { x: 300, y: 350, key: 'S' },  // Center
    MR: { x: 450, y: 350, key: 'D' },  // Middle-Right
    BL: { x: 150, y: 525, key: 'Z' },  // Bottom-Left
    BC: { x: 300, y: 525, key: 'X' },  // Bottom-Center
    BR: { x: 450, y: 525, key: 'C' }   // Bottom-Right
};
```

**2. Keyboard Event Handler:**
```javascript
document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    
    // Zone throws
    if (['Q','W','E','A','S','D','Z','X','C'].includes(key)) {
        const zone = getZoneForKey(key);
        throwToZone(zone);
    }
    
    // Random throw
    else if (key === 'T') {
        throwRandom();
    }
    
    // Reset
    else if (key === 'R') {
        resetGame();
    }
    
    // Toggle zone overlay
    else if (key === 'H') {
        toggleZoneOverlay();
    }
});
```

**3. Encouragement System:**
```javascript
function showEncouragement(health) {
    const messages = {
        '75-100': ['Keep going!', 'Nice shot!', 'He\'s still standing!'],
        '50-74': ['You\'re making progress!', 'Don\'t stop now!', 'Almost there!'],
        '25-49': ['Critical damage!', 'He\'s wobbling!', 'Finish Him!'],
        '0-24': ['ONE MORE HIT!', 'SO CLOSE!', 'VICTORY IS NEAR!']
    };
    
    let range = health > 75 ? '75-100' : 
                health > 50 ? '50-74' :
                health > 25 ? '25-49' : '0-24';
    
    const msg = messages[range][Math.floor(Math.random() * messages[range].length)];
    
    // If "Finish Him!" message, play audio
    if (msg === 'Finish Him!' && canPlayFinishHim()) {
        playFinishHimAudio();
    }
    
    displayEncouragementMessage(msg);
}
```

**4. "Finish Him!" Audio System:**
```javascript
let lastFinishHimPlay = 0;
const FINISH_HIM_COOLDOWN = 5000; // 5 seconds

function playFinishHimAudio() {
    if (!soundEnabled) return;
    
    const now = Date.now();
    if (now - lastFinishHimPlay < FINISH_HIM_COOLDOWN) return;
    
    const audio = document.getElementById('finishHimAudio');
    audio.currentTime = 0;
    audio.play().catch(e => console.warn('Audio play failed:', e));
    
    lastFinishHimPlay = now;
}

function canPlayFinishHim() {
    return Date.now() - lastFinishHimPlay >= FINISH_HIM_COOLDOWN;
}
```

**5. Throw Queue System:**
```javascript
const throwQueue = [];
const MAX_QUEUE_SIZE = 50;
const PROCESS_INTERVAL = 350;

function addToQueue(zone, username = 'You') {
    if (throwQueue.length >= MAX_QUEUE_SIZE) {
        console.warn('Queue full');
        return;
    }
    
    throwQueue.push({ zone, username, timestamp: Date.now() });
    updateQueueDisplay();
}

function processQueue() {
    if (throwQueue.length === 0) return;
    
    const { zone, username } = throwQueue.shift();
    executeThrow(zone, username);
    updateQueueDisplay();
}

setInterval(processQueue, PROCESS_INTERVAL);
```

**6. WebSocket Integration (for future chat):**
```javascript
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connectWebSocket() {
    try {
        ws = new WebSocket('ws://localhost:3001');
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            reconnectAttempts = 0;
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'throw_command') {
                addToQueue(data.zone, data.username);
            }
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    reconnectAttempts++;
                    connectWebSocket();
                }, 5000);
            }
        };
    } catch (e) {
        console.warn('WebSocket not available:', e);
    }
}

// Auto-connect on load (will fail gracefully if backend not running)
connectWebSocket();
```

**7. Auto-Reset After KO:**
```javascript
function showKO() {
    koScreen.style.display = 'flex';
    playKOSound();
    
    // Auto-reset after 1 second
    setTimeout(() => {
        resetGame();
        koScreen.style.display = 'none';
    }, 1000); // Changed from 3000 to 1000
}
```

**8. CTA Popup Timer:**
```javascript
// Show CTA popup for 8 seconds on load
window.addEventListener('load', () => {
    const ctaPopup = document.getElementById('ctaPopup');
    ctaPopup.style.display = 'block';
    
    setTimeout(() => {
        ctaPopup.style.opacity = '0';
        setTimeout(() => {
            ctaPopup.style.display = 'none';
        }, 500);
    }, 8000);
});
```

### Phase 3: Backend Discord Integration

**Files to Create:**
1. `/backend/chat-aggregator.js` - Chat message aggregator
2. Add to `/backend/server.js` - WebSocket throw command broadcasting

**Required Package:**
```bash
cd backend && pnpm add discord.js
```

**Implementation Summary:**
- Discord bot connects to specific channel
- Parses commands: !tl, !tc, !tr, !ml, !c, !mr, !bl, !bc, !br, !throw
- Rate limiting: 3 seconds per user
- Broadcasts to game via WebSocket

### Phase 4: Database Integration

**Migration File:** `/supabase/migrations/20251023_add_tomato_chat_game.sql`

```sql
INSERT INTO public.broadcast_graphics (
  name,
  display_name,
  description,
  category,
  url,
  thumbnail_url,
  audio_enabled,
  auto_hide_seconds,
  created_at,
  updated_at
)
VALUES (
  'tomato_chat_game',
  'Take Down Bibi - Interactive',
  'Interactive tomato-throwing game where viewers help "activate the stream" by throwing tomatoes via chat commands or keyboard',
  'interactive',
  '/tomato-chat-game.html',
  '/thumbnails/tomato-chat-game.png',
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (name) 
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  updated_at = NOW();
```

### Phase 5: Testing Checklist

- [ ] Keyboard inputs (Q/W/E/A/S/D/Z/X/C/T/R/H)
- [ ] CTA popup timing (8 seconds)
- [ ] Encouragement messages at all health levels
- [ ] "Finish Him!" audio playback and cooldown
- [ ] WebSocket connection (when backend running)
- [ ] OBS browser source (1920x1080)
- [ ] Auto-reset after KO (1 second)
- [ ] Graphics toggle from dashboard

## 📁 FILE STRUCTURE

```
public/
├── tomato-chat-game.html       (NEEDS CREATION - main game file)
├── brb-tomato-game.html        (existing - reference)
└── mk_finish_him.mp3           (existing - audio file)

backend/
├── chat-aggregator.js          (TO CREATE - Discord integration)
└── server.js                   (TO MODIFY - add WebSocket broadcast)

supabase/migrations/
└── 20251023_add_tomato_chat_game.sql  (TO CREATE)

scripts/
├── download-finish-him-audio.mjs      (created)
└── create-tomato-chat-game.mjs        (created)
```

## 🚀 QUICK START IMPLEMENTATION STEPS

1. **Create the HTML file** by copying brb-tomato-game.html and adding all features listed above
2. **Test keyboard controls** in browser
3. **Add Discord bot** (Phase 3) - optional for MVP
4. **Run database migration** (Phase 4)
5. **Verify in dashboard** that graphic appears and toggles correctly

## 💡 DESIGN DECISIONS SUMMARY

- **Embedded Audio**: Using HTML5 `<audio>` element instead of external soundboard for OBS compatibility
- **Zone System**: 9 predetermined zones mapped to QWEASDZXC keys for intuitive layout
- **Auto-Reset**: 1 second (vs 3 seconds) for faster gameplay loop
- **Queue System**: FIFO with 50-item limit to prevent overflow
- **Encouragement Frequency**: Every hit at low health, every 2-3 hits at high health
- **"Finish Him!" Trigger**: 25-49% health range with 5-second cooldown

## ⚠️ KNOWN LIMITATIONS

- WebSocket will fail gracefully if backend not running (keyboard mode still works)
- Discord integration requires bot token configuration
- Audio playback requires user interaction to initialize (browser security)
- OBS browser source must have audio output enabled to route to stream

## 📖 NEXT IMMEDIATE ACTION

**Create `/public/tomato-chat-game.html`** with all features by:
1. Copying brb-tomato-game.html as base
2. Adding new HTML elements (CTA, zones, queue, thrower, audio)
3. Adding new CSS styles
4. Modifying JavaScript to add zone system, keyboard controls, queue, encouragement, and audio
5. Testing locally before integrating with backend
