# Stream Graphics & Audio Integration Plan

## 🎯 Overview
Comprehensive plan for new broadcast graphics with integrated audio/BetaBot voiceover support.

---

## 📺 New Graphics to Create

### 1. **Poll/Voting Screen** (`stream-poll-screen.html`)
**Purpose**: Display live polls during stream
**Design**:
- Question at top with animated background
- 4 option bars that fill based on votes
- Real-time percentage updates
- Countdown timer

**Audio**:
- BetaBot TTS: "Time to vote! What do you think?"
- Background: Suspenseful music loop
- Sound effect: "Ding" when poll closes

---

### 2. **Milestone Celebration** (`stream-milestone-screen.html`)
**Purpose**: Celebrate follower/subscriber milestones
**Design**:
- Confetti explosion animation
- Large milestone number (1K, 10K, etc.)
- Thank you message
- Fireworks effects

**Audio**:
- BetaBot TTS: "We just hit [NUMBER] followers! You're amazing!"
- Background: Upbeat celebration music
- Sound effects: Fireworks, cheering

---

### 3. **Chat Highlight** (`stream-chat-highlight.html`)
**Purpose**: Feature specific viewer comments
**Design**:
- Speech bubble with highlighted message
- Username with avatar placeholder
- Spotlight/stage effect
- Animated text appearance

**Audio**:
- BetaBot TTS: Reads the highlighted comment
- Sound effect: Notification ping

---

### 4. **Hype Train** (`stream-hype-train.html`)
**Purpose**: Show excitement meter during hype moments
**Design**:
- Animated train with steam
- Hype level meter (1-5 levels)
- Participant counter
- Energy/lightning effects

**Audio**:
- BetaBot TTS: "All aboard the hype train! Choo choo!"
- Background: Energetic electronic music
- Sound effect: Train whistle

---

### 5. **Winner Announcement** (`stream-winner-announcement.html`)
**Purpose**: Reveal giveaway/contest winners
**Design**:
- Golden trophy animation
- Winner name reveal (fade in with glow)
- Spotlight effect
- Confetti rain

**Audio**:
- BetaBot TTS: "And the winner is... [NAME]! Congratulations!"
- Background: Dramatic fanfare
- Sound effect: Drum roll → cymbal crash

---

### 6. **Sponsor Shoutout** (`stream-sponsor-shoutout.html`)
**Purpose**: Thank sponsors/partners
**Design**:
- Logo display area (center)
- "Thank you to our sponsor" message
- Professional corporate look
- Subtle animations

**Audio**:
- BetaBot TTS: "This stream is brought to you by [SPONSOR NAME]"
- Background: Soft corporate music

---

### 7. **Question Time** (`stream-question-time.html`)
**Purpose**: Indicate Q&A session has started
**Design**:
- Large question mark icon
- "Ask Me Anything" text
- Rotating questions from chat
- Microphone animation

**Audio**:
- BetaBot TTS: "It's question time! Ask me anything!"
- Background: Curious/thoughtful music
- Sound effect: Microphone feedback (subtle)

---

### 8. **Countdown Warning** (`stream-countdown-5min.html`)
**Purpose**: 5-minute warning before stream ends
**Design**:
- Large clock/timer
- "Stream ending soon" message
- Urgency indicators (red borders)
- Final call to action

**Audio**:
- BetaBot TTS: "5 minutes remaining! Make your final comments!"
- Background: Ticking clock sound
- Sound effect: Timer beep

---

### 9. **Leaderboard** (`stream-leaderboard.html`)
**Purpose**: Show top viewers/contributors
**Design**:
- Top 5 list with rankings
- Podium for top 3
- Animated score numbers
- Gold/Silver/Bronze medals

**Audio**:
- BetaBot TTS: "Let's see our top contributors today!"
- Background: Competitive game show music

---

### 10. **Game Loading** (`stream-game-loading.html`)
**Purpose**: Transition between game segments
**Design**:
- Loading bar animation
- Game controller graphics
- "Loading next game..." text
- Pixelated retro style

**Audio**:
- BetaBot TTS: "Loading up the next game. Get ready!"
- Background: 8-bit video game music
- Sound effect: Power-up sound

---

## 🎵 Audio Integration System

### Architecture

```
┌──────────────────────────────────────┐
│       Stream Graphic HTML             │
│  ┌────────────────────────────────┐  │
│  │  Audio Controller Manager       │  │
│  │  • Background Music             │  │
│  │  • BetaBot TTS Voiceover       │  │
│  │  • Sound Effects                │  │
│  └────────────────────────────────┘  │
│           ▲            ▲              │
│           │            │              │
│    ┌──────┴─────┐  ┌──┴────────┐    │
│    │  Music     │  │  TTS API   │    │
│    │  Files     │  │  (OpenAI)  │    │
│    └────────────┘  └────────────┘    │
└──────────────────────────────────────┘
```

### Implementation

#### 1. **Base Audio Template** (Add to each HTML file)

```html
<script>
class StreamAudioController {
  constructor(config) {
    this.bgMusic = null
    this.ttsAudio = null
    this.sfxAudio = null
    this.config = config
  }

  async init() {
    // Play background music
    if (this.config.backgroundMusic) {
      await this.playBackgroundMusic(this.config.backgroundMusic)
    }

    // Play BetaBot TTS voiceover
    if (this.config.ttsMessage) {
      await this.playTTS(this.config.ttsMessage)
    }

    // Play sound effects
    if (this.config.soundEffects) {
      this.config.soundEffects.forEach((sfx, index) => {
        setTimeout(() => this.playSoundEffect(sfx), index * 1000)
      })
    }
  }

  async playBackgroundMusic(url) {
    this.bgMusic = new Audio(url)
    this.bgMusic.loop = true
    this.bgMusic.volume = 0.3
    try {
      await this.bgMusic.play()
    } catch (err) {
      console.error('Failed to play background music:', err)
    }
  }

  async playTTS(message) {
    // Generate TTS via OpenAI API
    const ttsUrl = await this.generateTTS(message)
    this.ttsAudio = new Audio(ttsUrl)
    this.ttsAudio.volume = 0.8
    try {
      await this.ttsAudio.play()
    } catch (err) {
      console.error('Failed to play TTS:', err)
    }
  }

  async generateTTS(text) {
    // Call OpenAI TTS API
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'nova', // BetaBot voice
          speed: 1.0
        })
      })
      const data = await response.json()
      return data.audioUrl
    } catch (err) {
      console.error('TTS generation failed:', err)
      return null
    }
  }

  async playSoundEffect(url) {
    this.sfxAudio = new Audio(url)
    this.sfxAudio.volume = 0.5
    try {
      await this.sfxAudio.play()
    } catch (err) {
      console.error('Failed to play sound effect:', err)
    }
  }

  stop() {
    if (this.bgMusic) this.bgMusic.pause()
    if (this.ttsAudio) this.ttsAudio.pause()
    if (this.sfxAudio) this.sfxAudio.pause()
  }
}

// Auto-initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const audioConfig = {
    backgroundMusic: '/audio/bg-[theme].mp3',
    ttsMessage: 'Your custom message here',
    soundEffects: [
      '/audio/sfx-intro.mp3',
      '/audio/sfx-outro.mp3'
    ]
  }

  const audioController = new StreamAudioController(audioConfig)
  audioController.init()

  // Stop audio when page closes
  window.addEventListener('beforeunload', () => {
    audioController.stop()
  })
})
</script>
```

#### 2. **Audio File Structure**

```
public/
├── audio/
│   ├── background/
│   │   ├── bg-energetic.mp3
│   │   ├── bg-chill.mp3
│   │   ├── bg-dramatic.mp3
│   │   ├── bg-corporate.mp3
│   │   └── bg-8bit.mp3
│   ├── soundfx/
│   │   ├── sfx-cheer.mp3
│   │   ├── sfx-drumroll.mp3
│   │   ├── sfx-notification.mp3
│   │   ├── sfx-fireworks.mp3
│   │   ├── sfx-train-whistle.mp3
│   │   └── sfx-powerup.mp3
│   └── tts-cache/
│       └── (cached TTS files)
```

#### 3. **Dashboard Integration**

Update `GraphicsGallery.tsx` to include audio controls:

```typescript
const GRAPHIC_CONFIGS = [
  {
    type: 'poll',
    label: 'Poll',
    icon: BarChart3,
    color: 'purple',
    htmlFile: '/stream-poll-screen.html',
    audio: {
      bgMusic: '/audio/background/bg-energetic.mp3',
      ttsMessage: 'Time to vote! What do you think?',
      soundEffects: ['/audio/soundfx/sfx-notification.mp3']
    }
  },
  {
    type: 'milestone',
    label: 'Milestone',
    icon: Trophy,
    color: 'gold',
    htmlFile: '/stream-milestone-screen.html',
    audio: {
      bgMusic: '/audio/background/bg-celebration.mp3',
      ttsMessage: 'We just hit a major milestone! Thank you all!',
      soundEffects: [
        '/audio/soundfx/sfx-fireworks.mp3',
        '/audio/soundfx/sfx-cheer.mp3'
      ]
    }
  }
  // ... more configs
]
```

#### 4. **TTS API Endpoint**

Create `/api/tts` route (if not exists):

```typescript
// pages/api/tts.ts
import OpenAI from 'openai'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, voice = 'nova', speed = 1.0 } = req.body

  // Generate cache key
  const cacheKey = createHash('md5').update(`${text}-${voice}-${speed}`).digest('hex')
  const cachePath = path.join(process.cwd(), 'public', 'audio', 'tts-cache', `${cacheKey}.mp3`)

  // Check cache
  try {
    await fs.access(cachePath)
    return res.status(200).json({ audioUrl: `/audio/tts-cache/${cacheKey}.mp3` })
  } catch {
    // Cache miss, generate new TTS
  }

  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: speed
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    await fs.writeFile(cachePath, buffer)

    res.status(200).json({ audioUrl: `/audio/tts-cache/${cacheKey}.mp3` })
  } catch (error) {
    console.error('TTS generation error:', error)
    res.status(500).json({ error: 'TTS generation failed' })
  }
}
```

---

## 🎬 Implementation Priority

### Phase 1 (High Priority - Week 1)
1. ✅ Poll/Voting Screen
2. ✅ Milestone Celebration
3. ✅ Chat Highlight
4. ✅ Audio controller base implementation
5. ✅ TTS API endpoint

### Phase 2 (Medium Priority - Week 2)
6. ✅ Hype Train
7. ✅ Winner Announcement
8. ✅ Question Time
9. ✅ Background music library

### Phase 3 (Nice to Have - Week 3)
10. ✅ Sponsor Shoutout
11. ✅ Countdown Warning
12. ✅ Leaderboard
13. ✅ Game Loading

---

## 🎨 Design Consistency

All graphics should follow these standards:

**Colors**:
- Primary: Gold (#FFD700) - Highlights, titles
- Secondary: Red (#FF0000) - Accents, borders
- Background: Dark gradients (#1a1a1a → #2d2d2d)
- Text: White (#FFFFFF) or Light Gray (#CCCCCC)

**Animations**:
- Smooth transitions (ease-in-out)
- Pulsing effects for emphasis
- Particle effects for celebrations
- Glitch effects for technical/gaming vibes

**Typography**:
- Font: 'Arial Black', 'Helvetica', sans-serif
- Bold weights for impact
- Large sizes for readability on stream
- Text shadows for depth

**Audio Timing**:
- TTS starts 0.5s after graphic appears
- Background music fades in over 1s
- Sound effects triggered at key animation points
- All audio stops when graphic closes

---

## 📊 Database Updates Needed

Add audio configuration to `broadcast_graphics` table:

```sql
ALTER TABLE broadcast_graphics ADD COLUMN audio_config JSONB;

-- Example value:
{
  "bgMusic": "/audio/background/bg-energetic.mp3",
  "bgVolume": 0.3,
  "ttsMessage": "Custom BetaBot message",
  "ttsVoice": "nova",
  "ttsSpeed": 1.0,
  "soundEffects": [
    {
      "url": "/audio/soundfx/sfx-notification.mp3",
      "delay": 0,
      "volume": 0.5
    }
  ]
}
```

---

## 🚀 Next Steps

1. Create audio directory structure
2. Implement base audio controller
3. Build TTS API endpoint
4. Create first 3 new graphics (Poll, Milestone, Chat Highlight)
5. Update GraphicsGallery with audio controls
6. Test audio integration
7. Add remaining graphics
8. Document usage in operator manual

---

**Status**: Ready to implement
**Estimated Time**: 2-3 weeks
**Dependencies**: OpenAI API, Audio file library
