# StreamStudio Live - GitHub Repository Structure

## Repository Overview

**Repository:** https://github.com/IbrahimAyad/thelivestreamshow

```
thelivestreamshow/
├── (your existing dashboard files...)
│
└── streamstudio-live/              ← StreamStudio Live Application
    ├── src/
    │   ├── components/             # React components
    │   │   ├── EmergencyControlsPanel.tsx
    │   │   ├── MicDuckingPanel.tsx
    │   │   ├── StreamSafetyPanel.tsx
    │   │   └── ...
    │   ├── hooks/                  # Custom React hooks
    │   │   ├── useMicInput.ts
    │   │   ├── useDualDeckPlayer.ts
    │   │   └── ...
    │   ├── lib/                    # Utilities
    │   │   ├── supabase.ts
    │   │   ├── emergencyControls.ts
    │   │   ├── micEffects.ts
    │   │   └── ...
    │   ├── pages/                  # Main pages
    │   │   ├── ControlPanel.tsx
    │   │   └── BroadcastOverlay.tsx
    │   └── types/                  # TypeScript types
    │
    ├── supabase/                   # Supabase configuration
    │   ├── functions/              # Edge Functions
    │   │   ├── ai-dj-chat/
    │   │   ├── scheduled-automation/
    │   │   └── ...
    │   └── migrations/             # Database migrations
    │
    ├── docs/                       # Documentation
    │   ├── INTEGRATION_GUIDE.md
    │   ├── REBRANDING_SUMMARY.md
    │   └── PHASE_7_COMPLETE.md
    │
    ├── .env.example                # Environment template
    ├── .gitignore                  # Git ignore rules
    ├── package.json                # Dependencies
    ├── README.md                   # Main documentation
    ├── vite.config.ts              # Vite configuration
    └── tailwind.config.js          # Tailwind CSS config
```

---

## What's Included

### Phase 7: Live Production Safety Features (Latest)

✅ **Emergency Broadcast Controls**
- PANIC button (instant mute)
- Quick Fade Out (2s smooth fade)
- BRB Mode (auto-fade + broadcast flag)
- Emergency Recovery (restore state)

✅ **Live Mic Ducking + Effects**
- Real-time mic input capture
- Auto-ducking when speaking
- Mic effects chain:
  - Auto-Tune/Pitch Correction
  - Reverb (Studio/Hall/Plate)
  - Compressor
  - De-esser
  - Lo-fi Filter
  - Noise Gate

✅ **Stream-Safe Music System**
- Visual badges (🟢 Stream Safe, 🟡 Personal Use, 🔴 Copyrighted)
- Stream Mode filter
- Auto-DJ integration
- Broadcast warnings
- Bulk tagging UI

### All Previous Phases (Complete)

- ✅ Music library management
- ✅ Smart playlists & tagging
- ✅ Auto-DJ intelligence (Camelot wheel, BPM matching)
- ✅ Professional waveforms & beat matching
- ✅ Dual-deck system with crossfader
- ✅ 3-band EQ + professional FX chain
- ✅ Hot cues & loop controls
- ✅ 16-pad sampler
- ✅ Recording system
- ✅ Vinyl mode/scratching
- ✅ Beat-reactive visualizations
- ✅ AI chat control
- ✅ Advanced analytics
- ✅ Mobile PWA support
- ✅ Scheduled automation

---

## Installation

### Clone Repository

```bash
git clone https://github.com/IbrahimAyad/thelivestreamshow.git
cd thelivestreamshow/streamstudio-live
```

### Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Run Development Server

```bash
npm run dev
```

Access at:
- Control Panel: http://localhost:5173/control
- Broadcast Overlay: http://localhost:5173/broadcast

---

## Deployment

### Current Live Deployment

🚀 **URL:** https://lvygnr34gdo1.space.minimax.io

- Control Panel: `/control`
- Broadcast Overlay: `/broadcast`

### Build for Production

```bash
npm run build
```

Output: `dist/` directory

---

## Supabase Configuration

### Required Tables

All tables are already created in your Supabase project:

- `music_library`
- `playlists`
- `audio_playback_state`
- `play_history`
- `auto_dj_settings`
- `saved_mixes`
- `dj_analytics`
- `scheduled_events`
- `ai_chat_history`

### Required Edge Functions

All functions are already deployed:

- `ai-dj-chat`
- `scheduled-automation`
- `trigger-mix`
- `trigger-sound`
- `get-mixes`
- `get-dj-status`
- `play-audio`
- `get-audio-list`

### Required Storage Buckets

- `music-audio` - Audio file storage

---

## Integration with Main Dashboard

See <filepath>docs/INTEGRATION_GUIDE.md</filepath> for detailed instructions on integrating StreamStudio Live into the main dashboard.

---

## Security Notes

🔒 **Important:**

1. **Never commit `.env` file** - Contains sensitive Supabase keys
2. **Use `.env.example`** - Template for required variables
3. **RLS Policies** - All tables have Row Level Security enabled
4. **CORS** - Configure allowed origins in Supabase dashboard

---

## Development

### Tech Stack

- **Frontend:** React 18.3 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Database, Auth, Storage, Edge Functions)
- **Audio:** Web Audio API
- **Real-time:** Supabase Realtime

### Project Structure

- `/src/components/` - Reusable UI components
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions and services
- `/src/pages/` - Main application pages
- `/supabase/functions/` - Serverless edge functions
- `/supabase/migrations/` - Database schema changes

---

## Testing

### Before Going Live

1. ✅ Test emergency controls (PANIC, FADE OUT, BRB MODE)
2. ✅ Test mic ducking with real microphone
3. ✅ Verify stream-safe badges display correctly
4. ✅ Test Auto-DJ in stream mode (only safe tracks)
5. ✅ Test broadcast overlay sync
6. ✅ Verify all audio plays correctly

---

## Support & Documentation

- **Main README:** <filepath>README.md</filepath>
- **Integration Guide:** <filepath>docs/INTEGRATION_GUIDE.md</filepath>
- **Phase 7 Summary:** <filepath>docs/PHASE_7_COMPLETE.md</filepath>
- **Rebranding Notes:** <filepath>docs/REBRANDING_SUMMARY.md</filepath>

---

## License

This project is part of **The Live Stream Show** ecosystem.

---

**Last Updated:** October 21, 2025  
**Version:** 7.0.0 (Phase 7 Complete - Live Production Safety Features)
