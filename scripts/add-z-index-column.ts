#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addZIndexColumn() {
  console.log('⚠️  The z_index column is missing from broadcast_graphics table.')
  console.log('📝 You need to add it manually in Supabase SQL Editor:\n')
  
  const sql = `
-- Add z_index column
ALTER TABLE broadcast_graphics 
ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 1000;

-- Update existing records with sensible defaults based on graphic_type
UPDATE broadcast_graphics
SET z_index = CASE graphic_type
  WHEN 'out_of_context_background' THEN 100
  WHEN 'starting_soon' THEN 500
  WHEN 'brb' THEN 500
  WHEN 'brb_tomato_game' THEN 500
  WHEN 'tech_difficulties' THEN 500
  WHEN 'outro' THEN 500
  WHEN 'tomato_chat_game' THEN 500
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
  WHEN 'chat_highlight' THEN 1200
  WHEN 'versus' THEN 1200
  WHEN 'milestone' THEN 1200
  WHEN 'rage_meter' THEN 1200
  WHEN 'finish_him' THEN 1200
  WHEN 'live_indicator' THEN 1500
  WHEN 'timer_overlay' THEN 1500
  WHEN 'logo' THEN 1600
  WHEN 'betabot_avatar' THEN 1700
  ELSE 1000
END
WHERE z_index IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_broadcast_graphics_z_index ON broadcast_graphics(z_index);
CREATE INDEX IF NOT EXISTS idx_broadcast_graphics_visible_z_index ON broadcast_graphics(is_visible, z_index) WHERE is_visible = true;
`
  
  console.log('Copy and paste this SQL into Supabase SQL Editor:')
  console.log('='.repeat(70))
  console.log(sql)
  console.log('='.repeat(70))
  console.log('\n📍 Go to: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql/new')
  console.log('✅ After running the SQL, refresh your browser!')
}

addZIndexColumn()
