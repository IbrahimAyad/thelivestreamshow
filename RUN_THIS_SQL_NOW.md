# 🚨 CRITICAL: Run This SQL Migration NOW

## Status: z_index Column Still Missing ❌

The overlay files have been updated, but the **z_index column still doesn't exist** in your database.

---

## ✅ STEP 1: Open Supabase SQL Editor

Go to this URL:
```
https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql/new
```

---

## ✅ STEP 2: Copy and Paste This SQL

```sql
-- Add z_index column to broadcast_graphics
ALTER TABLE broadcast_graphics 
ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 1000;

-- Set z_index values for all 26 existing graphics
UPDATE broadcast_graphics
SET z_index = CASE graphic_type
  WHEN 'out_of_context_background' THEN 100
  WHEN 'starting_soon' THEN 500
  WHEN 'brb' THEN 500
  WHEN 'brb_tomato_game' THEN 500
  WHEN 'tech_difficulties' THEN 500
  WHEN 'outro' THEN 500
  WHEN 'tomato_chat_game' THEN 500
  WHEN 'finish_him' THEN 500
  WHEN 'ai_dj_visualizer' THEN 600
  WHEN 'production_alert' THEN 700
  WHEN 'alpha_wednesday_universal' THEN 800
  WHEN 'alpha_wednesday_original_universal' THEN 800
  WHEN 'the_live_stream_show' THEN 800
  WHEN 'pi_namecard_overlay' THEN 900
  WHEN 'segment_banner' THEN 1000
  WHEN 'poll' THEN 1100
  WHEN 'award_show' THEN 1100
  WHEN 'new_member' THEN 1100
  WHEN 'out_of_context_moe' THEN 1100
  WHEN 'chat_highlight' THEN 1200
  WHEN 'versus' THEN 1200
  WHEN 'milestone' THEN 1200
  WHEN 'rage_meter' THEN 1200
  WHEN 'live_indicator' THEN 1500
  WHEN 'timer_overlay' THEN 1500
  WHEN 'logo' THEN 1600
  WHEN 'betabot_avatar' THEN 1700
  ELSE 1000
END;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_broadcast_graphics_z_index 
ON broadcast_graphics(z_index);

CREATE INDEX IF NOT EXISTS idx_broadcast_graphics_visible_z_index 
ON broadcast_graphics(is_visible, z_index) 
WHERE is_visible = true;
```

---

## ✅ STEP 3: Click "RUN" Button

You should see: `Success. No rows returned` (this is normal)

---

## ✅ STEP 4: Refresh Your Browser

Go to `http://localhost:5173` and refresh.

---

## What This Fixes:

- ❌ Stops all 400 errors: `column broadcast_graphics.z_index does not exist`
- ✅ Enables graphics to load in `/broadcast` view
- ✅ Enables proper overlay layering (backgrounds behind, indicators on top)
- ✅ Makes all 26 graphics work correctly

---

## Why This Is Needed:

Minimax updated the HTML files, but the **database migration must be run manually** in Supabase.
The code is trying to query `z_index` column which doesn't exist yet.

---

**AFTER RUNNING THE SQL, YOUR OVERLAY SYSTEM WILL BE FULLY OPERATIONAL!** 🎉
