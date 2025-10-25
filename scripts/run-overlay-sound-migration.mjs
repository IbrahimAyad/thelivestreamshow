#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_KEY:', SUPABASE_KEY ? '✓' : '✗');
  console.error('\nRun: export $(cat .env.local | grep -v "^#" | xargs)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
  console.log('🚀 Starting Overlay Sound Integration Migration...\n');

  try {
    console.log('📝 Step 1: Adding new columns to broadcast_graphics table...');

    // Add columns using Supabase client directly
    // Since we can't run arbitrary DDL with anon key, we'll use a different approach
    // Check if columns already exist by querying the table
    const { data: testQuery, error: testError } = await supabase
      .from('broadcast_graphics')
      .select('id, display_mode, z_index, sound_drop_id, auto_play_sound')
      .limit(1);

    if (testError && testError.message.includes('column')) {
      console.log('\n⚠️  Columns not yet added. Please run the migration SQL manually:');
      console.log('\n1. Open Supabase Dashboard: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/editor');
      console.log('2. Go to SQL Editor');
      console.log('3. Paste the contents of: supabase/migrations/20250124_add_overlay_sound_and_layering.sql');
      console.log('4. Run the migration');
      console.log('5. Re-run this script to verify\n');
      process.exit(1);
    } else if (testError) {
      throw testError;
    }

    console.log('✅ Columns already exist!\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');

    // Check overlay configuration
    const { data: overlays, error: overlayError } = await supabase
      .from('broadcast_graphics')
      .select('graphic_type, display_mode, z_index, sound_drop_id, auto_play_sound')
      .order('z_index', { ascending: true });

    if (overlayError) {
      throw new Error(`Failed to query overlays: ${overlayError.message}`);
    }

    console.log('🎨 Current overlay configuration:');
    console.log('─'.repeat(80));
    console.log('Graphic Type'.padEnd(30), 'Mode'.padEnd(12), 'Z-Index'.padEnd(10), 'Sound');
    console.log('─'.repeat(80));
    
    overlays.forEach(overlay => {
      const hasSound = overlay.sound_drop_id ? '🔊' : '-';
      console.log(
        overlay.graphic_type.padEnd(30),
        overlay.display_mode.padEnd(12),
        overlay.z_index.toString().padEnd(10),
        hasSound
      );
    });
    console.log('─'.repeat(80));

    // Summary stats
    const modeStats = overlays.reduce((acc, o) => {
      acc[o.display_mode] = (acc[o.display_mode] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Summary:');
    console.log(`   Total overlays: ${overlays.length}`);
    console.log(`   Exclusive mode: ${modeStats.exclusive || 0}`);
    console.log(`   Overlay mode: ${modeStats.overlay || 0}`);
    console.log(`   Background mode: ${modeStats.background || 0}`);
    console.log(`   With sound drops: ${overlays.filter(o => o.sound_drop_id).length}`);
    console.log(`   Z-index range: ${Math.min(...overlays.map(o => o.z_index))} - ${Math.max(...overlays.map(o => o.z_index))}`);

    console.log('\n✨ Migration complete! Next steps:');
    console.log('   1. Update TypeScript types (database.ts)');
    console.log('   2. Update OverlayEditModal component');
    console.log('   3. Update BroadcastGraphicsDisplay component');
    console.log('   4. Test overlay sound assignment');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

runMigration();
