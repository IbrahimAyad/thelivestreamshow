# Overlay Sound Integration - Setup Guide

## Overview

This guide walks through the complete setup process for the Overlay Sound Integration feature, which adds:
- 🔊 Sound drop assignment to overlays
- 🎨 Multi-layer display with z-index management
- 🎯 Three display modes: exclusive, overlay, background

## Prerequisites

- ✅ Supabase project access
- ✅ Node.js 18+ installed
- ✅ Environment variables configured (.env.local)
- ✅ Existing broadcast_graphics table

## Setup Process

### Step 1: Run Database Migration

**Option A: Supabase Dashboard (Recommended)**

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql
   ```

2. Create a new query

3. Copy and paste the entire contents of:
   ```
   supabase/migrations/20250124_add_overlay_sound_and_layering.sql
   ```

4. Click "Run" to execute the migration

5. Verify success - you should see:
   ```
   Migration completed successfully! 🎉
   ```

**Option B: Command Line (If service key available)**

```bash
cd /Users/ibrahim/Desktop/thelivestreamshow
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/run-overlay-sound-migration.mjs
```

### Step 2: Apply Default Values

After running the migration, apply default display modes and z-index values:

```bash
cd /Users/ibrahim/Desktop/thelivestreamshow
export $(cat .env.local | grep -v '^#' | xargs)
npx tsx scripts/apply-overlay-defaults.ts
```

Expected output:
```
✅ Successfully configured: XX overlays
📊 Final overlay configuration displayed
```

### Step 3: Verify Migration

Run verification to ensure everything is set up correctly:

```bash
cd /Users/ibrahim/Desktop/thelivestreamshow
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/run-overlay-sound-migration.mjs
```

Should show:
```
✅ Columns already exist!
📊 Current overlay configuration table
```

## What Was Added

### New Database Columns

| Column | Type | Purpose | Default |
|--------|------|---------|---------|
| display_mode | text | Controls visibility behavior | 'exclusive' |
| z_index | integer | Layer rendering order | 1000 |
| sound_drop_id | uuid | Reference to music_library | NULL |
| auto_play_sound | boolean | Play sound on visibility | false |

### Display Modes Explained

**Exclusive Mode** (z-index: 1000-1999)
- Hides all other overlays when active
- Used for: Starting Soon, BRB, Outro, Full-screen scenes
- Example: Starting Soon screen takes over entire display

**Overlay Mode** (z-index: 5000-8999)
- Displays on top of existing content
- Other overlays remain visible underneath
- Used for: Production Alerts, Finish Him, Notifications
- Example: Production Alert appears over BRB screen

**Background Mode** (z-index: 100-999)
- Base layer, can be overlaid by others
- Typically always visible unless exclusive overlay active
- Used for: Episode Info, Lower Thirds, Logos
- Example: Episode info stays visible under overlay alerts

### Z-Index Ranges

```
┌─────────────────────────────┐  9999 (Max)
│   Reserved for Future       │
├─────────────────────────────┤  9000
│   Overlay Mode              │
│   (Alerts, Notifications)   │  8000 - Production Alerts
│                             │  7000 - Finish Him
│                             │  6500 - Generic overlays
├─────────────────────────────┤  5000
│   Reserved Gap              │
├─────────────────────────────┤  2000
│   Exclusive Mode            │
│   (Full-screen scenes)      │  1800 - Tomato Game
│                             │  1500 - BRB, Starting Soon
├─────────────────────────────┤  1000
│   Reserved Gap              │
├─────────────────────────────┤  1000
│   Background Mode           │
│   (Info, Lower thirds)      │  500 - Episode Info
│                             │  300 - Logo
└─────────────────────────────┘  100 (Min)
```

## Default Configuration

After running the setup scripts, overlays will be configured as follows:

### Background Overlays (100-999)
- `logo` → z-index 300
- `pi_namecard_overlay` → z-index 500
- `episode_info` → z-index 500

### Exclusive Overlays (1000-1999)
- `starting_soon` → z-index 1500
- `brb` → z-index 1500
- `outro` → z-index 1500
- `tech_difficulties` → z-index 1500
- `poll` → z-index 1600
- `ai_dj_visualizer` → z-index 1700
- `tomato_chat_game` → z-index 1800
- `brb_tomato_game` → z-index 1800

### Overlay Mode (5000-8999)
- `out_of_context_background` → z-index 6000
- `new_member` → z-index 6500
- `rage_meter` → z-index 6500
- `milestone` → z-index 6500
- `chat_highlight` → z-index 6500
- `versus` → z-index 6500
- `award_show` → z-index 6800
- `finish_him` → z-index 7000
- `production_alert` → z-index 8000
- `claude_production_alert` → z-index 8000

## Verification Checklist

After setup, verify the following:

- [ ] All overlays have `display_mode` set (exclusive/overlay/background)
- [ ] All overlays have `z_index` assigned (100-9999 range)
- [ ] `sound_drop_id` column exists (can be NULL)
- [ ] `auto_play_sound` column exists (defaults to false)
- [ ] Background overlays have z-index 100-999
- [ ] Exclusive overlays have z-index 1000-1999
- [ ] Overlay mode overlays have z-index 5000-8999

## Troubleshooting

### Issue: "Migration columns not found"

**Solution:**
1. Ensure SQL migration was run successfully in Supabase Dashboard
2. Check for errors in SQL Editor
3. Verify you're connected to the correct Supabase project

### Issue: "Overlay not found" warnings

**Solution:**
- This is normal for overlays that haven't been created yet
- Only existing overlays in `broadcast_graphics` table will be updated
- Create missing overlays using `scripts/setup-graphics.ts`

### Issue: Cannot update overlay configuration

**Solution:**
1. Check RLS policies on `broadcast_graphics` table
2. Ensure VITE_SUPABASE_ANON_KEY has write permissions
3. Verify overlay exists in database first

## Next Steps

After successful database setup:

1. **Update TypeScript Types** - Add new columns to `BroadcastGraphic` interface
2. **Update Components** - Modify UI to show sound indicators and display modes
3. **Implement Audio Manager** - Create audio playback system
4. **Test Sound Assignment** - Try assigning sounds to overlays via UI

## Manual Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check all new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'broadcast_graphics'
  AND column_name IN ('display_mode', 'z_index', 'sound_drop_id', 'auto_play_sound');

-- View current configuration
SELECT 
  graphic_type,
  display_mode,
  z_index,
  sound_drop_id IS NOT NULL AS has_sound,
  auto_play_sound
FROM broadcast_graphics
ORDER BY z_index, graphic_type;

-- Count by display mode
SELECT 
  display_mode,
  COUNT(*) as count,
  MIN(z_index) as min_z,
  MAX(z_index) as max_z
FROM broadcast_graphics
GROUP BY display_mode
ORDER BY min_z;
```

## Files Created/Modified

### Database
- ✅ `supabase/migrations/20250124_add_overlay_sound_and_layering.sql` - Main migration
- ✅ Database view: `broadcast_graphics_with_sound` - Convenience view
- ✅ Function: `get_next_z_index(mode)` - Helper for z-index assignment

### Scripts
- ✅ `scripts/run-overlay-sound-migration.mjs` - Migration runner/verifier
- ✅ `scripts/apply-overlay-defaults.ts` - Default value applicator
- ✅ `docs/OVERLAY_SOUND_SETUP_GUIDE.md` - This guide

### To Be Created (Next Phase)
- `src/types/database.ts` - Updated TypeScript types
- `src/utils/audio/audioLayerManager.ts` - Audio playback system
- `src/components/SoundDropSelector.tsx` - Sound selection UI
- Updated `OverlayEditModal.tsx` - Audio configuration UI
- Updated `OverlayGrid.tsx` - Visual indicators
- Updated `BroadcastGraphicsDisplay.tsx` - Multi-layer rendering

## Success Criteria

✅ Migration complete when:
1. Database migration runs without errors
2. All existing overlays have `display_mode` assigned
3. All existing overlays have `z_index` in valid range
4. Verification script shows complete configuration
5. No TypeScript compilation errors

## Support

If you encounter issues:
1. Check Supabase Dashboard for SQL errors
2. Review migration log output
3. Verify environment variables are loaded
4. Check RLS policies on `broadcast_graphics` table
5. Ensure you're using correct Supabase project

---

**Migration Date:** 2025-01-24
**Version:** 1.0.0
**Status:** Database Setup Phase Complete ✅
