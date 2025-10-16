# Stream Enhancement Dashboard

A simplified, focused tool for enhancing live streams with easy-to-control overlays. OBS handles cameras and Discord; this dashboard makes your stream engaging.

## Features

### Question Banner Control
- Scrolling text banner at bottom of screen
- Adjustable animation speed
- Real-time preview
- One-click show/hide

### Graphics Gallery
- LIVE indicator with pulsing animation
- BRB (Be Right Back) overlay
- Starting Soon overlay
- Technical Difficulties overlay
- Logo/branding overlay
- One-click toggle for each graphic

### Lower Thirds
- Quick create: Name + Title fields
- Preset templates with brand colors (Red, Yellow, White)
- Animation style selector (Slide Left, Slide Right, Fade In)
- Recent lower thirds history

### AI Engagement Tools
- Activity Pulse: Subtle animations showing stream activity
- Viewer Count: Simulated viewer count for testing (clearly labeled)
- Engagement Effects: Particle effects and visual enhancements
- Clearly labeled as test/simulation mode for transparency

### Quick Actions
- Emergency "Hide All" button
- Scene Presets:
  - Clean (no overlays)
  - Branded (logo + LIVE indicator)
  - Full Overlay (all elements)

## Brand Colors

- Red: #EF4444
- Black: #000000
- Yellow: #EAB308
- Grey: #6B7280
- White: #FFFFFF

## Setup

### 1. Start the Dashboard

```bash
pnpm install
pnpm run dev
```

### 2. Add to OBS

1. Open OBS Studio
2. Add a new **Browser Source**
3. Set URL to the Broadcast View URL (displayed at the bottom of the dashboard)
4. Set dimensions to **1920x1080**
5. Check "Shutdown source when not visible" for performance
6. Check "Refresh browser when scene becomes active"

### 3. Control Your Stream

All controls are available on the main dashboard page. Changes sync in real-time to the broadcast view.

## Usage Tips

- Use the **Preview Window** at the bottom to see how overlays look before showing them
- The **Emergency Hide All** button instantly clears all overlays if needed
- Lower thirds automatically hide previous ones when you create a new one
- AI Engagement features are clearly labeled as "TEST" mode on the broadcast view

## Technical Details

- Built with React 18.3 + TypeScript
- Real-time sync via Supabase
- Optimized for OBS Browser Source (1920x1080)
- Fast performance with minimal re-renders

## Browser Source Settings for OBS

- URL: `http://localhost:5173/broadcast` (or your deployed URL)
- Width: 1920
- Height: 1080
- FPS: 30
- CSS: (leave blank)
- Shutdown source when not visible: ✓
- Refresh browser when scene becomes active: ✓

## Deployment

The dashboard is ready to deploy to any static hosting service. The broadcast view at `/broadcast` is designed to work as a browser source in OBS.

## Local Development with F5-TTS

For high-quality neural text-to-speech using F5-TTS locally on your Mac:

### Quick Start

1. **Prerequisites**: Docker Desktop, Node.js 18+, Python 3.10+
2. **Run the startup script**:
   ```bash
   ./start-betabot-local.sh
   ```
3. **Access the dashboard**: http://localhost:5173
4. **Select F5-TTS** from the TTS Engine dropdown

### Detailed Setup Guide

See [docs/F5_TTS_LOCAL_SETUP.md](docs/F5_TTS_LOCAL_SETUP.md) for comprehensive instructions including:
- Step-by-step installation
- OBS integration for streaming
- Troubleshooting guide
- Daily workflow automation

### Features

- **Neural TTS Quality**: Premium voice quality using F5-TTS AI model
- **Automatic Fallback**: Falls back to browser TTS if F5-TTS unavailable
- **Docker Integration**: Easy setup with Docker Compose
- **OBS Ready**: Seamless integration with OBS Studio
- **Local Processing**: All TTS processing runs on your Mac (no cloud dependency)

### System Requirements

- macOS 11.0 (Big Sur) or later
- 8GB RAM minimum (16GB recommended)
- 10GB free disk space
- Docker Desktop installed and running

