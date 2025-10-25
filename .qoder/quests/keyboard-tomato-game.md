# Keyboard & Chat-Interactive Tomato Game - Design Document

## 1. Overview

### Purpose
Transform the existing click-based BRB tomato game into a keyboard and chat-interactive experience where viewers can participate by typing commands in chat (Twitch/YouTube/Discord) or by pressing keyboard keys. This enables audience engagement during breaks while maintaining the fun, arcade-style tomato throwing mechanics.

### Strategic Goals
- **Viewer Engagement**: Convert passive viewers into active participants during BRB segments
- **Multi-Platform Support**: Enable interaction from Discord, with future expansion to Twitch and YouTube
- **Phased Approach**: Start with keyboard simulation for testing, then integrate real chat
- **Preserve Game Mechanics**: Maintain the existing visual quality and game feel while adding new input methods

### Repository Type
Full-Stack Application (React frontend + Node.js backend + Supabase real-time database)

---

## 2. System Architecture

### High-Level Component Structure

```mermaid
graph TB
    subgraph "Chat Platforms"
        Discord[Discord Bot/Webhook]
        Twitch[Twitch EventSub/IRC]
        YouTube[YouTube Live Chat API]
    end
    
    subgraph "Backend Services"
        ChatAggregator[Chat Message Aggregator]
        CommandParser[Command Parser]
        WS[WebSocket Server]
    end
    
    subgraph "Frontend Game"
        KeyboardInput[Keyboard Input Handler]
        ChatInput[Chat Message Receiver]
        GameEngine[Game Engine]
        Renderer[Visual Renderer]
    end
    
    Discord --> ChatAggregator
    Twitch -.future.-> ChatAggregator
    YouTube -.future.-> ChatAggregator
    
    ChatAggregator --> CommandParser
    CommandParser --> WS
    WS --> ChatInput
    
    KeyboardInput --> GameEngine
    ChatInput --> GameEngine
    GameEngine --> Renderer
    
    style Discord fill:#5865F2
    style Twitch fill:#9146FF,stroke-dasharray: 5 5
    style YouTube fill:#FF0000,stroke-dasharray: 5 5
```

### Technology Stack Integration
- **Frontend Game**: Standalone HTML/CSS/JavaScript (existing `brb-tomato-game.html` cloned as `tomato-chat-game.html`)
- **Backend Server**: Express.js (extend existing `backend/server.js`)
- **Real-Time Communication**: WebSocket (existing infrastructure)
- **Chat Integration**: Discord.js initially, with extensible architecture for Twitch/YouTube
- **Database**: Supabase (optional for stats tracking and leaderboards)

---

## 3. Game Mechanics Design

### Game Narrative & Engagement Strategy

**Core Concept:**
The game frames the tomato-throwing experience as "Take Down Bibi" - a playful, audience-driven challenge to "activate the stream" by collectively throwing tomatoes. This creates a clear objective and encourages participation through:

1. **Clear Goal**: Players understand the mission immediately
2. **Progress Feedback**: Health bar visually shows community progress
3. **Urgency**: Call-to-action popup creates immediate engagement
4. **Social Proof**: Username display rewards participation and encourages others
5. **Dynamic Encouragement**: Context-aware messages maintain momentum

**Engagement Flow:**
```mermaid
sequenceDiagram
    participant Viewer
    participant Game
    participant Stream
    
    Game->>Viewer: Show "Take Down Bibi!" title
    Game->>Viewer: Display CTA popup (8 seconds)
    Viewer->>Game: First throw (!throw or T key)
    Game->>Stream: Visual impact + username credit
    Game->>Viewer: Encouragement message
    Note over Viewer: Motivated to throw again
    Viewer->>Game: Subsequent throws
    Game->>Stream: Progressive damage feedback
    Game->>Viewer: Escalating encouragement
    Game->>Stream: ELIMINATED! screen
    Game->>Game: Auto-reset after 1 second
    Game->>Viewer: New round begins
```

### Predetermined Throw Zones

The game will divide the target area into **9 named zones** that correspond to keyboard keys or chat commands:

| Zone Position | Keyboard Key | Chat Command | Target Region |
|---------------|--------------|--------------|---------------|
| Top-Left | `Q` | `!tl` or `!topleft` | Upper-left quadrant |
| Top-Center | `W` | `!tc` or `!top` | Upper-center region |
| Top-Right | `E` | `!tr` or `!topright` | Upper-right quadrant |
| Middle-Left | `A` | `!ml` or `!left` | Center-left region |
| Center | `S` | `!c` or `!center` | Center bullseye |
| Middle-Right | `D` | `!mr` or `!right` | Center-right region |
| Bottom-Left | `Z` | `!bl` or `!bottomleft` | Lower-left quadrant |
| Bottom-Center | `X` | `!bc` or `!bottom` | Lower-center region |
| Bottom-Right | `C` | `!br` or `!bottomright` | Lower-right quadrant |

**Additional Commands:**
- `T` / `!throw` / `!tomato` → Throw at random zone (for simplicity)
- `R` / `!reset` → (Host only) Reset game

### Zone Coordinate Mapping

Each zone maps to pixel coordinates within the target container (600px × 700px):

```
Zone Calculation Logic:
- Top zones: Y = 25% of height (175px)
- Middle zones: Y = 50% of height (350px)
- Bottom zones: Y = 75% of height (525px)
- Left zones: X = 25% of width (150px)
- Center zones: X = 50% of width (300px)
- Right zones: X = 75% of width (450px)

Add randomness: ±50px variance to prevent exact same hit location
```

### Input Processing Flow

```mermaid
sequenceDiagram
    participant User as Viewer/Host
    participant Input as Input Handler
    participant Queue as Throw Queue
    participant Game as Game Engine
    participant Visual as Visual Display
    
    User->>Input: Press Q or type !tl
    Input->>Input: Parse command
    Input->>Input: Validate zone
    Input->>Queue: Add throw to queue
    
    loop Every 350ms
        Queue->>Game: Dequeue next throw
        Game->>Game: Calculate trajectory
        Game->>Visual: Animate tomato
        Visual->>Game: Check collision
        Game->>Game: Update health/stats
        Game->>Visual: Display effects
    end
```

### Rate Limiting & Queue Management

**Purpose**: Prevent spam and maintain game balance

| Limit Type | Configuration | Rationale |
|------------|---------------|-----------|
| **Per-User Cooldown** | 3 seconds | Prevents single user from spamming |
| **Global Rate** | Max 5 throws/second | Maintains visual clarity |
| **Queue Size** | Max 50 pending throws | Prevents memory overflow |
| **Throw Duration** | 350ms animation | Matches existing timing |

**Queue Behavior:**
- FIFO (First In, First Out) processing
- When queue is full, oldest throws are processed first
- Visual indicator shows queue depth (e.g., "12 throws queued")

---

## 4. Chat Integration Architecture

### Phase 1: Discord Integration (MVP)

**Discord Bot Requirements:**
- Monitor specific voice channel or text channel
- Parse incoming messages for commands
- Send throw events via WebSocket to game
- Ignore bot messages to prevent loops

**Discord Bot Configuration:**

| Parameter | Value | Notes |
|-----------|-------|-------|
| Application ID | `1430779621288317049` | Provided credentials |
| Public Key | `bc270a5db...` | For webhook verification |
| Bot Permissions | `Read Messages`, `Send Messages` | Minimal required |
| Intents | `GUILD_MESSAGES`, `MESSAGE_CONTENT` | Required for message parsing |
| Monitored Channel | Configurable by channel ID | Set via environment variable |

**Message Processing Rules:**
1. Only accept messages from configured channel
2. Ignore messages from bots (including self)
3. Apply per-user cooldown (3 seconds)
4. Log all valid commands for analytics

### Phase 2: Twitch Integration (Future)

**Integration Approach:**
- Twitch EventSub for real-time chat messages
- OAuth flow to authenticate broadcaster
- Parse chat messages for `!throw` commands
- Respect Twitch rate limits (20 requests/minute)

**Required Credentials:**
| Credential | Value | Status |
|------------|-------|--------|
| Client ID | `8skdoft3rdllawwlqur8h45926asbj` | ✅ Provided |
| Client Secret | `ex89rvth77qrowg4jrku2h4n46h8y5` | ✅ Provided |
| OAuth Token | **Pending** | ⏳ Requires redirect URL fix |
| Channel Name | TBD | Set by broadcaster |

### Phase 3: YouTube Integration (Future)

**Integration Approach:**
- YouTube Live Chat API polling (every 5 seconds)
- Parse chat for commands
- Display usernames and avatars

**Required Credentials:**
| Credential | Value | Status |
|------------|-------|--------|
| Channel ID | `UC7sHcsiSYmx-aKal2hil_6A` | ✅ Provided |
| API Key | `AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw` | ✅ Provided |

---

## 5. Backend Service Design

### Chat Aggregator Service

**Responsibilities:**
- Connect to multiple chat platforms simultaneously
- Normalize messages into unified format
- Apply rate limiting per user per platform
- Broadcast commands to game clients via WebSocket

**Unified Message Format:**

```typescript
interface ChatThrowCommand {
  userId: string;           // Platform-specific user ID
  username: string;          // Display name
  platform: 'discord' | 'twitch' | 'youtube';
  zone: ThrowZone;           // Parsed zone from command
  timestamp: number;         // Unix timestamp (ms)
  avatarUrl?: string;        // User avatar (optional)
}

type ThrowZone = 'TL' | 'TC' | 'TR' | 'ML' | 'C' | 'MR' | 'BL' | 'BC' | 'BR' | 'RANDOM';
```

### WebSocket Message Protocol

**Client → Server (Control Messages):**
```typescript
{
  type: 'game_connect',
  gameId: 'tomato-chat-game'
}

{
  type: 'game_reset',
  authorized: boolean  // Only host can reset
}
```

**Server → Client (Throw Events):**
```typescript
{
  type: 'throw_command',
  data: ChatThrowCommand
}

{
  type: 'queue_status',
  queueDepth: number,
  activeThrows: number
}
```

### Backend API Endpoints

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/chat/discord/connect` | POST | Connect Discord bot | `{ channelId, token }` |
| `/api/chat/discord/disconnect` | POST | Disconnect bot | `{}` |
| `/api/chat/status` | GET | Get all platform statuses | N/A |
| `/api/game/tomato/stats` | GET | Retrieve game stats | N/A |
| `/api/game/tomato/reset` | POST | Reset game state | `{ authorized }` |

---

---

## 6. Audio Integration Design

### File Structure

```
public/
├── brb-tomato-game.html          (existing - preserved)
└── tomato-chat-game.html         (new - cloned and modified)
```

### Key Modifications to Game Logic

**Design Principle:** Preserve all existing game mechanics, visuals, and audio while adding new input methods and engagement features.

**1. Input Handling System**

Replace click event listener with hybrid input system:

```
Existing: document.addEventListener('click', handleClick)

New Approach:
- document.addEventListener('keydown', handleKeyboardInput)
- WebSocket.onmessage = handleChatCommand
- Both feed into unified throwTomato(zone) function
```

**2. Zone-Based Throwing**

Transform dynamic click coordinates into predetermined zones:

```
Current Flow:
User clicks (x, y) → throwTomato(x, y) → animate to exact point

New Flow:
User presses 'Q' → parseInput('Q') → mapToZone('TL') 
→ getZoneCoordinates('TL') → throwTomato(x±random, y±random)
```

**3. Visual Feedback Enhancements**

| Feature | Description | Visual Design |
|---------|-------------|---------------|
| **Zone Overlay** | Show 9-zone grid on target (toggle with `H` key) | Semi-transparent grid lines with zone labels |
| **Queue Indicator** | Display pending throw count | Bottom-right corner: "🍅 Queue: 12" |
| **Last Thrower** | Show username of last hit | Top-right: "Hit by @username!" (3 second fade) |
| **Command Help** | Keyboard shortcut reference | Press `?` to toggle overlay |

**4. Audio Feedback**

All original game sounds are preserved using Web Audio API:

| Sound Effect | Trigger Event | Audio Type | Duration | Implementation |
|--------------|---------------|------------|----------|----------------|
| **Throw Sound** | Every tomato throw | Oscillator sweep (800Hz → 200Hz) | 300ms | Existing - preserved |
| **Splat Sound** | Tomato hits target | Sawtooth oscillator (150Hz → 50Hz) with lowpass filter | 150ms | Existing - preserved |
| **Hit Sound** | Impact noise on hit | White noise buffer with lowpass filter | 100ms | Existing - preserved |
| **Critical Hit** | Health < 25% on hit | Square wave (100Hz → 30Hz), louder gain | 300ms | Existing - preserved |
| **Combo Sound** | 2+ consecutive hits | Sine wave, frequency increases with combo count | 200ms | Existing - preserved |
| **KO Sound** | Target health reaches 0 | Layered explosions (sawtooth + triangle) | 800ms | Existing - preserved |
| **Finish Him!** | "Finish Him!" message displays (health 25-49%) | Embedded MP3 file | ~2 seconds | **New addition** |

**Sound Toggle:**
- All original sounds respect the sound toggle button (🔊/🔇)
- Toggle located in top-right corner
- When muted, all Web Audio API sounds are disabled
- Finish Him audio also respects mute state

**Audio Architecture:**
- Original sounds: Generated procedurally via Web Audio API
- New "Finish Him!" sound: Embedded MP3 file via HTML5 Audio element
- Both systems work independently but respect global mute state
- No external dependencies or backend audio routing required

### Audio System Architecture

**Embedded Audio Approach:**

Based on the project's audio routing requirements and OBS browser source compatibility, the game uses **embedded audio files** rather than external soundboard calls.

**Audio Files Required:**

| Audio File | Source | Purpose | Duration | Format |
|------------|--------|---------|----------|--------|
| `finish-him.mp3` | Existing soundboard or `/public/stream-finish-him.html` | Play when "Finish Him!" message appears | ~2 seconds | MP3 (web-compatible) |
| *Future: `victory.mp3`* | TBD | Play on KO/victory | ~3 seconds | MP3 |
| *Future: `countdown.mp3`* | TBD | Play when health < 10% | ~1 second | MP3 |

**Audio Playback Logic:**

```mermaid
sequenceDiagram
    participant Game as Game Engine
    participant Health as Health System
    participant Msg as Message Display
    participant Audio as Audio Controller
    participant Speaker as Browser Audio
    
    Health->>Game: Health drops to 25-49%
    Game->>Msg: Show "Finish Him!" message
    Msg->>Audio: Check audio cooldown
    Audio->>Audio: Cooldown OK? (5+ seconds elapsed)
    Audio->>Speaker: Play finish-him.mp3
    Audio->>Audio: Set cooldown timer
    Speaker->>Game: Audio playing
    Note over Speaker: 2 second audio clip
    Speaker->>Game: Audio complete
```

**HTML5 Audio Element Structure:**

```
Implementation in tomato-chat-game.html:

<audio id="finishHimAudio" preload="auto">
  <source src="/audio/finish-him.mp3" type="audio/mpeg">
  <source src="/audio/finish-him.wav" type="audio/wav">
  <!-- Fallback for older browsers -->
</audio>

JavaScript Controller:
- const finishHimAudio = document.getElementById('finishHimAudio')
- finishHimAudio.volume = 0.8
- finishHimAudio.play() on trigger
- Cooldown managed via timestamp comparison
- Error handling for audio load failures
```

**Audio Routing Flow:**

```
Browser (OBS Source) → HTML5 Audio API → System Audio Output
                                              ↓
                                        Loopback Audio
                                              ↓
                                        Multi-Output Device
                                              ↓
                          ┌───────────────────┴───────────────────┐
                          ↓                                       ↓
                    Scarlett Solo                           BlackHole 2ch
                    (Headphones)                            (OBS Capture)
                          ↓                                       ↓
                    Host hears audio                      Stream hears audio
```

**Note**: This embedded approach ensures audio plays correctly in OBS browser source without requiring backend server routing, as per project audio architecture lessons.

---

## 7. User Experience Flow

### Streamer Setup Workflow

```mermaid
graph LR
    A[Start] --> B[Clone game file]
    B --> C[Configure Discord bot]
    C --> D[Set environment variables]
    D --> E[Start backend server]
    E --> F[Open tomato-chat-game.html]
    F --> G[Add as OBS browser source]
    G --> H[Test with keyboard]
    H --> I{Works?}
    I -->|Yes| J[Enable chat integration]
    I -->|No| K[Check console logs]
    K --> H
    J --> L[Go live!]
```

### Viewer Interaction Flow

```mermaid
graph TB
    A[Viewer sees game on stream] --> B{Input method?}
    B -->|Discord| C[Type !tl in chat]
    B -->|Twitch future| D[Type !throw in chat]
    B -->|YouTube future| E[Type !center in chat]
    
    C --> F[Command parsed by bot]
    D --> F
    E --> F
    
    F --> G{Valid command?}
    G -->|Yes| H{Cooldown OK?}
    G -->|No| I[Ignore silently]
    
    H -->|Yes| J[Add to queue]
    H -->|No| K[Ignore + notify user]
    
    J --> L[Tomato flies on stream]
    L --> M[Visual feedback shown]
    M --> N{Target hit?}
    
    N -->|Yes| O[Show username credit]
    N -->|No| P[Miss animation]
    
    O --> Q[Update stats]
    P --> Q
```

### Host Testing Workflow

**Keyboard Testing Mode** (before enabling chat):

1. Open `tomato-chat-game.html` in browser
2. Press `H` to show zone overlay
3. Test each key (Q/W/E/A/S/D/Z/X/C) to verify zones
4. Press `T` for random throw
5. Press `R` to reset game
6. Verify health bar, stats, and KO sequence
7. Once validated, connect Discord bot

---

## 8. Discord Bot Implementation Strategy

### Discord Bot Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: Start command
    Connecting --> Connected: Authentication success
    Connecting --> Error: Authentication fail
    Connected --> Monitoring: Join channel
    Monitoring --> Processing: Message received
    Processing --> Monitoring: Command handled
    Processing --> RateLimited: Too many requests
    RateLimited --> Monitoring: Cooldown expires
    Monitoring --> Disconnected: Stop command
    Error --> Disconnected: Retry timeout
```

### Discord Message Parsing Logic

**Command Recognition Patterns:**

| Pattern | Zone Mapping | Example |
|---------|--------------|---------|
| `!tl`, `!topleft` | Top-Left | `!tl` |
| `!tc`, `!top` | Top-Center | `!top` |
| `!tr`, `!topright` | Top-Right | `!tr` |
| `!ml`, `!left` | Middle-Left | `!left` |
| `!c`, `!center` | Center | `!c` |
| `!mr`, `!right` | Middle-Right | `!right` |
| `!bl`, `!bottomleft` | Bottom-Left | `!bl` |
| `!bc`, `!bottom` | Bottom-Center | `!bottom` |
| `!br`, `!bottomright` | Bottom-Right | `!br` |
| `!throw`, `!tomato`, `🍅` | Random | `!throw` |

**Case Sensitivity**: All commands are case-insensitive

**Whitespace Handling**: Trim leading/trailing spaces, ignore extra spaces

### Discord Bot Configuration Table

| Setting | Environment Variable | Default Value | Description |
|---------|---------------------|---------------|-------------|
| Bot Token | `DISCORD_BOT_TOKEN` | Required | Discord bot authentication token |
| Monitored Channel | `DISCORD_CHANNEL_ID` | Required | Channel to listen for commands |
| Command Prefix | `DISCORD_COMMAND_PREFIX` | `!` | Command prefix character |
| Per-User Cooldown | `DISCORD_USER_COOLDOWN_MS` | `3000` | Milliseconds between throws per user |
| Bot Status | `DISCORD_BOT_STATUS` | `"Playing Tomato Toss"` | Bot activity status |

---

## 9. Fallback & Error Handling

### Graceful Degradation Strategy

```mermaid
graph TD
    A[Game Starts] --> B{Chat connected?}
    B -->|Yes| C[Full chat mode]
    B -->|No| D[Keyboard-only mode]
    
    C --> E{WebSocket alive?}
    E -->|Yes| F[Process chat commands]
    E -->|No| G[Attempt reconnect]
    
    G --> H{Reconnect success?}
    H -->|Yes| F
    H -->|No| I[Fallback to keyboard]
    
    D --> J[Show keyboard overlay]
    I --> J
    
    F --> K{Command valid?}
    K -->|Yes| L[Execute throw]
    K -->|No| M[Log error silently]
```

### Error Scenarios & Responses

| Error Condition | Detection Method | Recovery Action | User Feedback |
|----------------|------------------|-----------------|---------------|
| **WebSocket Disconnected** | Connection state monitoring | Auto-reconnect every 5s (max 5 attempts) | "⚠️ Chat offline, keyboard mode active" |
| **Discord Bot Offline** | Health check API fails | Notify backend, continue keyboard mode | Overlay message: "Chat commands unavailable" |
| **Queue Overflow** | Queue length > 50 | Drop oldest throws | Warning sound + "Queue full!" message |
| **Invalid Command** | Regex parsing fails | Ignore message silently | None (prevent chat spam) |
| **Rate Limit Hit** | User cooldown active | Queue for later or drop | Private DM: "Too fast! Wait 3 seconds" |
| **Target Health = 0** | Game state check | Trigger KO sequence, reset after 1s | "ELIMINATED!" screen |

---

## 10. Configuration & Environment Setup

### Environment Variables

**Backend Server (.env):**
```
# Discord Integration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=1430779621288317049
DISCORD_CHANNEL_ID=your_channel_id

# Twitch Integration (Future)
TWITCH_CLIENT_ID=8skdoft3rdllawwlqur8h45926asbj
TWITCH_CLIENT_SECRET=ex89rvth77qrowg4jrku2h4n46h8y5
TWITCH_OAUTH_TOKEN=pending_oauth_flow

# YouTube Integration (Future)
YOUTUBE_CHANNEL_ID=UC7sHcsiSYmx-aKal2hil_6A
YOUTUBE_API_KEY=AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw

# Game Configuration
TOMATO_GAME_COOLDOWN_MS=3000
TOMATO_GAME_MAX_QUEUE=50
TOMATO_GAME_GLOBAL_RATE_LIMIT=5
```

### Frontend Game Configuration

**Game Constants (JavaScript):**
```
Configuration embedded in tomato-chat-game.html:

const GAME_CONFIG = {
  zones: {
    TL: { x: 150, y: 175, variance: 50 },
    TC: { x: 300, y: 175, variance: 50 },
    // ... all 9 zones
  },
  
  queue: {
    maxSize: 50,
    processIntervalMs: 350
  },
  
  cooldown: {
    perUserMs: 3000,
    globalMaxRate: 5  // throws per second
  },
  
  websocket: {
    url: 'ws://localhost:3001',
    reconnectDelayMs: 5000,
    maxReconnectAttempts: 5
  },
  
  visual: {
    showZoneOverlay: false,  // Toggle with 'H' key
    showQueueIndicator: true,
    showLastThrower: true,
    lastThrowerFadeDurationMs: 3000
  }
}
```

---

## 11. Testing Strategy

### Unit Testing Scope

| Component | Test Cases |
|-----------|------------|
| **Command Parser** | Valid commands, invalid formats, case sensitivity, special characters |
| **Zone Mapper** | All 9 zones + random, coordinate accuracy, variance bounds |
| **Cooldown Manager** | Per-user tracking, expiration, concurrent users |
| **Queue System** | FIFO ordering, overflow handling, rate limiting |
| **WebSocket Handler** | Connection, disconnection, reconnection, message parsing |

### Integration Testing

**Test Scenario 1: Discord Bot Integration**
1. Start backend with Discord bot enabled
2. Send `!tl` command in monitored channel
3. Verify WebSocket receives throw command
4. Verify tomato appears at top-left zone
5. Verify username displays on screen

**Test Scenario 2: Rate Limiting**
1. Send 10 commands rapidly from same user
2. Verify only first command processes immediately
3. Verify cooldown message sent to user
4. Wait 3 seconds, send another command
5. Verify second command processes successfully

**Test Scenario 3: Queue Overflow**
1. Simulate 60 rapid commands from different users
2. Verify queue caps at 50
3. Verify warning sound plays
4. Verify oldest throws process first

**Test Scenario 4: Keyboard Fallback**
1. Start game without chat connection
2. Verify keyboard mode activates automatically
3. Press `Q`, verify tomato throws to top-left
4. Verify overlay shows keyboard instructions

### Browser Compatibility Testing

| Browser | Version | Testing Focus |
|---------|---------|---------------|
| Chrome | 120+ | Primary development target |
| Firefox | 115+ | WebSocket stability |
| Safari | 17+ | Audio API compatibility |
| Edge | 120+ | OBS browser source rendering |

**OBS Browser Source Testing:**
- Resolution: 1920×1080
- FPS: 30
- Hardware acceleration: Enabled
- Custom CSS: None required

---

## 12. Deployment Workflow

### Audio File Preparation

**Extract "Finish Him" Audio:**

The "Finish Him!" sound effect needs to be extracted from the existing soundboard and converted to a web-compatible format.

**Option 1: From Soundboard Database**
```sql
-- Query to find the finish him sound effect
SELECT effect_name, audio_file_url 
FROM soundboard_effects 
WHERE effect_name ILIKE '%finish%him%';
```

Download the audio file from Supabase Storage and convert to MP3:
```bash
# If file is in WAV format, convert to MP3
ffmpeg -i finish-him.wav -codec:a libmp3lame -b:a 192k finish-him.mp3

# Copy to public audio directory
mkdir -p public/audio
cp finish-him.mp3 public/audio/
```

**Option 2: From stream-finish-him.html**

If the existing graphic uses audio, extract it:
1. Open `/public/stream-finish-him.html`
2. Check for embedded audio elements or audio generation code
3. If using Web Audio API, record the output
4. If using file reference, locate and copy the file

**Option 3: Generate from TTS**

If no existing file, generate using Piper TTS:
```bash
# Using Piper TTS with dramatic voice
curl -X POST http://localhost:8000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Finish him!", "voice": "en_US-lessac-medium"}' \
  --output public/audio/finish-him.wav

# Convert to MP3
ffmpeg -i public/audio/finish-him.wav -codec:a libmp3lame -b:a 192k public/audio/finish-him.mp3
```

### Pre-Deployment Checklist

**Audio Preparation:**
- [ ] Extract or generate "Finish Him!" audio file
- [ ] Convert audio to MP3 format (web-compatible)
- [ ] Create `/public/audio/` directory if not exists
- [ ] Place `finish-him.mp3` in `/public/audio/`
- [ ] Test audio file plays in browser
- [ ] Verify audio file size is reasonable (< 500KB)

**Game Implementation:**
- [ ] Clone `brb-tomato-game.html` to `tomato-chat-game.html`
- [ ] Add "Take Down Bibi!" title
- [ ] Add call-to-action popup with 8-second timer
- [ ] Add encouragement message system
- [ ] Add keyboard input handlers
- [ ] Add WebSocket client connection
- [ ] Implement zone mapping logic
- [ ] Add visual overlays (zone grid, queue, username)
- [ ] Test all keyboard inputs (Q/W/E/A/S/D/Z/X/C/T/R)

**Backend Integration:**
- [ ] Extend backend server with Discord bot integration
- [ ] Add chat aggregator service
- [ ] Implement rate limiting and queue management
- [ ] Create Discord bot application
- [ ] Configure environment variables
- [ ] Test Discord command parsing
- [ ] Test WebSocket message flow

**Dashboard Integration:**
- [ ] Add `tomato-chat-game` entry to Graphics Gallery component
- [ ] Create database entry in `broadcast_graphics` table
- [ ] Verify real-time toggle functionality
- [ ] Test graphic activation from dashboard

**Final Testing:**
- [ ] Verify OBS browser source compatibility
- [ ] Test call-to-action popup timing
- [ ] Test encouragement messages at all health levels
- [ ] **Test "Finish Him!" audio plays when message appears**
- [ ] **Test audio cooldown system (prevents spam)**
- [ ] **Verify audio volume level (80%)**
- [ ] **Test audio plays in OBS browser source**
- [ ] Document setup instructions

### Go-Live Process

```mermaid
graph LR
    A[Development Complete] --> B[Local Testing]
    B --> C[Discord Bot Setup]
    C --> D[Backend Deployment]
    D --> E[WebSocket Verification]
    E --> F[Game File Upload]
    F --> G[OBS Scene Configuration]
    G --> H[Test Stream Check]
    H --> I{All systems green?}
    I -->|Yes| J[Go Live!]
    I -->|No| K[Debug Issues]
    K --> H
```

### Monitoring & Analytics

**Real-Time Metrics:**
- Total throws processed
- Throws per platform (Discord/Twitch/YouTube)
- Average queue depth
- Peak concurrent users
- Hit accuracy percentage
- Most active users (top 10)
- Commands per minute graph

**Health Checks:**
- Backend API: `/api/health`
- Discord bot status: Online/Offline
- WebSocket connection count
- Queue overflow events

---

## 13. Future Enhancements

### Potential Feature Additions

| Feature | Priority | Complexity | Description |
|---------|----------|------------|-------------|
| **Leaderboard** | Medium | Medium | Track top throwers across streams, display on overlay |
| **Power-Ups** | Low | High | Special commands like `!mega` for 2x damage |
| **Team Mode** | Low | High | Split viewers into teams, competitive throwing |
| **Streamer Reactions** | Medium | Low | Trigger OBS scene/sound effects on critical hits |
| **Chat Rewards** | High | Medium | Integrate Twitch Channel Points for special throws |
| **Mobile Overlay** | Low | Medium | Responsive design for portrait/landscape mobile viewing |
| **Multi-Target** | Low | High | Multiple targets appear, viewers choose which to hit |
| **Boss Mode** | Medium | High | Target fights back, health regeneration, special attacks |

### Scalability Considerations

**Current Design Limits:**
- Max 50 concurrent throws in queue
- 5 throws processed per second
- Single WebSocket server instance

**Scaling Strategy (if needed):**
1. Implement Redis queue for distributed throw processing
2. Deploy multiple WebSocket servers with load balancing
3. Use Supabase Realtime for cross-instance synchronization
4. Add CDN caching for static game assets
5. Implement regional Discord bot sharding for global audiences

---

## 14. Visual Design Specifications

### Game Title & Call-to-Action Message

**Primary Title:**
- Text: "Take Down Bibi!"
- Position: Top center, below existing "BE RIGHT BACK" title
- Font: Impact, Arial Black, sans-serif
- Size: 4em (slightly smaller than BRB title)
- Color: White with red stroke
- Text shadow: 0 0 30px rgba(255, 99, 71, 1), 5px 5px 0 #000
- Animation: Pulsating scale animation (0.95 to 1.05, 2 second cycle)

**Call-to-Action Popup:**
- Text: "🍅 Throw Tomatoes to Activate the Stream! 🍅"
- Position: Centered overlay, appears for first 8 seconds of game
- Background: Semi-transparent dark box with red border glow
- Style:
  - Background: rgba(0, 0, 0, 0.9)
  - Border: 4px solid #ff6347
  - Box shadow: 0 0 40px rgba(255, 99, 71, 0.8), inset 0 0 30px rgba(255, 99, 71, 0.2)
  - Padding: 40px 60px
  - Border-radius: 20px
  - Font size: 2.5em
  - Color: White
  - Animation: Fade in (500ms), hold (7s), fade out (500ms)

**Secondary Instructions Line:**
- Text: "Press T to throw • Type !throw in chat"
- Position: Below call-to-action popup
- Font size: 1.5em
- Color: #ff6347
- Style: Same semi-transparent box styling

### Zone Overlay Design

**When toggled (press `H`):**
- 9 semi-transparent rectangles overlay the target
- Border: 2px dashed white with 50% opacity
- Background: Radial gradient from transparent center to rgba(255, 255, 255, 0.1)
- Zone labels: White text, 1.5em font, centered in each zone
- Label format: "Q - TL" (key + zone abbreviation)
- Animation: Fade in/out transition (300ms)

### Queue Indicator Design

**Position:** Bottom-right corner, 20px padding
**Style:**
- Background: rgba(0, 0, 0, 0.8)
- Border: 2px solid #ff6347
- Padding: 15px 25px
- Border-radius: 10px
- Font: 1.2em bold, white text
- Icon: 🍅 emoji before count
- Example: "🍅 Queue: 12"

**Color Coding:**
- 0-10 throws: Green (#4ade80)
- 11-30 throws: Yellow (#facc15)
- 31-50 throws: Red (#ef4444)

### Last Thrower Display

**Position:** Top-right corner, 100px from top, 100px from right
**Style:**
- Background: Semi-transparent dark gradient
- Border: 2px solid gold (#ffd700)
- Padding: 20px 30px
- Font: 2em bold
- Text shadow: 0 0 10px rgba(255, 215, 0, 0.8)
- Animation: Slide in from right (500ms), hold 3s, fade out (500ms)
- Format: "Hit by @username!"

### Encouragement Messages

**Trigger Conditions & Messages:**

Displayed randomly after hits to maintain viewer engagement:

| Health Range | Message Pool | Display Frequency | Audio Trigger |
|--------------|--------------|-------------------|---------------|
| 75-100% | "Keep going!", "Nice shot!", "He's still standing!" | Every 3rd hit | None |
| 50-74% | "You're making progress!", "Don't stop now!", "Almost there!" | Every 2nd hit | None |
| 25-49% | "Critical damage!", "He's wobbling!", **"Finish Him!"** | Every hit | **"Finish Him!" → Play audio** |
| 0-24% | "ONE MORE HIT!", "SO CLOSE!", "VICTORY IS NEAR!" | Every hit | None |

**Style:**
- Position: Bottom center, above stats panel
- Background: rgba(255, 99, 71, 0.9)
- Border: 3px solid white
- Padding: 15px 30px
- Border-radius: 15px
- Font: 2em bold, white text
- Animation: Bounce in (300ms), hold (2s), fade out (300ms)
- Box shadow: 0 0 30px rgba(255, 99, 71, 0.8)

**"Finish Him!" Audio Integration:**

When the encouragement message displays "Finish Him!" (25-49% health range):

1. **Audio Source**: Embedded MP3/WAV file in game HTML
2. **File Location**: `/public/audio/finish-him.mp3` (extracted/converted from existing soundboard)
3. **Playback Method**: HTML5 Audio API (not relying on external soundboard)
4. **Volume**: 80% of master volume
5. **Trigger Logic**: Play once per "Finish Him!" text appearance
6. **Cooldown**: Minimum 5 seconds between audio plays (prevent spam)

**Implementation Approach:**
```
Rationale: Based on project memory, audio intended for stream overlay 
must be embedded directly in HTML files rather than routed through 
the soundboard panel to ensure consistent playback in OBS browser source.

Method:
1. Extract "Finish Him" audio from soundboard database or existing file
2. Convert to web-compatible format (MP3 or WAV)
3. Embed <audio> element in tomato-chat-game.html
4. Preload audio on page load
5. Trigger playback when encouragement message === "Finish Him!"
6. Use Web Audio API for volume control and timing
```

---

## 15. Security Considerations

### Input Validation

**Command Sanitization:**
- Strip all HTML tags from chat messages
- Limit username display to 20 characters
- Escape special characters in usernames
- Reject commands with SQL injection patterns (though not database-bound)
- Validate zone codes against whitelist

**Rate Limiting Enforcement:**
- Server-side validation (never trust client)
- IP-based rate limiting for WebSocket connections
- Platform-specific user ID tracking
- Exponential backoff for repeat offenders

### Bot Security

**Discord Bot Permissions:**
- Minimal permissions: Read + Send messages only
- No admin/moderator permissions required
- Token stored in environment variables (never hardcoded)
- Public key verification for webhook endpoints

**Access Control:**
- Host-only reset command (validate via Discord role or whitelist)
- No user data persistence beyond session
- No collection of personal information

---

## 13. Database Integration

### Graphics Gallery Entry

**Table:** `broadcast_graphics`

**New Record:**

| Field | Value |
|-------|-------|
| `name` | `tomato_chat_game` |
| `display_name` | `Take Down Bibi - Interactive` |
| `description` | `Interactive tomato-throwing game where viewers help "activate the stream" by throwing tomatoes via chat commands or keyboard` |
| `category` | `interactive` |
| `url` | `/tomato-chat-game.html` |
| `thumbnail_url` | `/thumbnails/tomato-chat-game.png` |
| `audio_enabled` | `true` |
| `auto_hide_seconds` | `null` (manual control) |
| `created_at` | `NOW()` |
| `updated_at` | `NOW()` |

### SQL Migration Script

**Purpose:** Add the new interactive tomato game to the graphics gallery

**Migration File:** `supabase/migrations/YYYYMMDDHHMMSS_add_tomato_chat_game.sql`

```sql
-- Add interactive tomato chat game to broadcast graphics
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
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  url = EXCLUDED.url,
  audio_enabled = EXCLUDED.audio_enabled,
  updated_at = NOW();
```

**Execution:**
```bash
# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Run migration
node scripts/run-migrations.mjs
```

### Graphics Gallery Component Integration

**File:** `src/components/GraphicsGallery.tsx`

**Integration Points:**

1. **Graphic will appear automatically** in the Graphics Gallery once database entry exists
2. **Toggle functionality** uses existing `useBroadcastGraphics` hook
3. **Real-time sync** via Supabase realtime subscription
4. **Category placement:** Under "Interactive" or "Games" section

**Display Behavior:**
- Clicking the graphic in gallery activates it on broadcast overlay
- Game appears at `/broadcast` view as iframe or embedded HTML
- Call-to-action popup shows immediately on activation
- Host can deactivate from dashboard to hide the game

---

## 14. Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Chat Participation Rate** | >15% of viewers | Unique users throwing / total viewers |
| **Average Throws per BRB** | 50-200 | Total throws per game session |
| **Command Success Rate** | >95% | Successful throws / total commands |
| **WebSocket Uptime** | >99% | Connection time / total stream time |
| **Queue Overflow Events** | <5% of sessions | Overflow events / total sessions |
| **User Retention** | >60% return throwers | Repeat users / total unique users |

### Analytics Dashboard

**Operator View (optional Supabase table):**
- Live throw counter
- Platform breakdown (Discord %, Twitch %, YouTube %)
- Top 10 throwers leaderboard
- Accuracy heatmap (which zones hit most)
- Peak activity times graph
- Average game duration

