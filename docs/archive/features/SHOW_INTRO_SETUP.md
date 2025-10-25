# Show Intro Integration - Manual Setup

Since automated migrations require the service key, please follow these steps to set up the database:

## Step 1: Run SQL in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/vcniezwtltraqramjlux
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the SQL from: `supabase/migrations/*_add_show_intro_state.sql`
5. Click "Run"

The SQL creates:
- `show_intro_state` table for real-time sync
- Triggers for automatic `updated_at` timestamps
- RLS policies for security
- Initial default row

## Step 2: Test the Integration

Once the table is created, the system will work as follows:

### Dashboard (Controller) Side:
1. Load songs in the **Show Intro Controller** (Dashboard tab)
2. Click "Start Intro Sequence"
3. The hook (`useShowIntroSequence`) updates Supabase in real-time

### Broadcast Side:
1. Open `/broadcast` in OBS Browser Source (1920x1080)
2. `ShowIntroOverlay` component subscribes to database changes
3. Graphics appear automatically based on sequence state:
   - **DJ Visualizer** (`/animations/ai-dj-visualizer.html`) during songs
   - **Tomato Game** (`/brb-tomato-game.html`) during game phase

## Step 3: Verify Setup

Run this query in Supabase SQL Editor to verify:

```sql
SELECT * FROM show_intro_state;
```

You should see one row with:
- `current_step`: 'idle'
- `is_running`: false
- `show_dj_visualizer`: false
- `show_tomato_game`: false

## Sequence Flow

```
Dashboard Controller          Supabase DB              Broadcast Overlay
     │                           │                           │
     ├──[Start button]──────────>│                           │
     │                           ├───[UPDATE state]─────────>│
     │                           │                           ├─[Show DJ visualizer]
     │                           │                           │
     ├──[Play Song 1]────────────>│                           │
     │   (Deck A)                │                           │
     │                           │                           │
     ├──[Crossfade to Song 2]───>│                           │
     │                           ├───[UPDATE state]─────────>│
     │                           │                           │
     ├──[Pause at 1:19.5]───────>│                           │
     │                           ├───[UPDATE state]─────────>│
     │                           │                           ├─[Hide DJ, show game]
     │                           │                           │
     │                           │<──[Boss defeated event]───┤
     ├──[Resume Song 2]─────────>│                           │
     │                           ├───[UPDATE state]─────────>│
     │                           │                           ├─[Hide game, show DJ]
     │                           │                           │
     ├──[Song 2 completes]──────>│                           │
     │                           ├───[UPDATE state]─────────>│
     │                           │                           ├─[Hide all, show main]
     │                           │                           │
     └──[Complete]───────────────┘                           └─
```

## Architecture Benefits

✅ **Real-time sync** - Dashboard and broadcast stay in perfect sync via Supabase
✅ **Decoupled** - Audio plays in dashboard, graphics show on broadcast
✅ **Persistent** - State survives page refreshes
✅ **Observable** - Multiple broadcast windows can show same state
✅ **Event-driven** - Game completion triggers resume automatically

## Troubleshooting

If graphics don't appear on `/broadcast`:

1. **Check console** in broadcast window - should see `[ShowIntroOverlay]` logs
2. **Verify database** - Run `SELECT * FROM show_intro_state` in SQL Editor
3. **Check real-time** - Look for Supabase channel subscription confirmations
4. **Inspect HTML files** - Ensure `/animations/ai-dj-visualizer.html` and `/brb-tomato-game.html` exist

## Development Mode Features

When running in dev mode (`import.meta.env.DEV`), the broadcast overlay shows a debug panel in the bottom-left corner with:
- Current step
- Elapsed time
- DJ visualizer status
- Game status

This helps verify the sync is working correctly.
