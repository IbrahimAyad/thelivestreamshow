/**
 * Apply Default Values for Overlay Sound Integration
 * 
 * This script sets default display_mode and z_index values for existing overlays.
 * Run this AFTER manually executing the SQL migration.
 * 
 * Run with: npx tsx scripts/apply-overlay-defaults.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Overlay configuration mapping
const OVERLAY_CONFIG = [
  // Background overlays (100-999)
  { type: 'logo', displayMode: 'background', zIndex: 300 },
  { type: 'pi_namecard_overlay', displayMode: 'background', zIndex: 500 },
  { type: 'episode_info', displayMode: 'background', zIndex: 500 },
  
  // Exclusive overlays (1000-1999)
  { type: 'starting_soon', displayMode: 'exclusive', zIndex: 1500 },
  { type: 'brb', displayMode: 'exclusive', zIndex: 1500 },
  { type: 'outro', displayMode: 'exclusive', zIndex: 1500 },
  { type: 'tech_difficulties', displayMode: 'exclusive', zIndex: 1500 },
  { type: 'tomato_chat_game', displayMode: 'exclusive', zIndex: 1800 },
  { type: 'brb_tomato_game', displayMode: 'exclusive', zIndex: 1800 },
  { type: 'poll', displayMode: 'exclusive', zIndex: 1600 },
  { type: 'ai_dj_visualizer', displayMode: 'exclusive', zIndex: 1700 },
  
  // Overlay mode (5000-8999)
  { type: 'new_member', displayMode: 'overlay', zIndex: 6500 },
  { type: 'rage_meter', displayMode: 'overlay', zIndex: 6500 },
  { type: 'milestone', displayMode: 'overlay', zIndex: 6500 },
  { type: 'chat_highlight', displayMode: 'overlay', zIndex: 6500 },
  { type: 'versus', displayMode: 'overlay', zIndex: 6500 },
  { type: 'finish_him', displayMode: 'overlay', zIndex: 7000 },
  { type: 'award_show', displayMode: 'overlay', zIndex: 6800 },
  { type: 'out_of_context_background', displayMode: 'overlay', zIndex: 6000 },
  
  // Production alerts
  { type: 'production_alert', displayMode: 'overlay', zIndex: 8000 },
  { type: 'claude_production_alert', displayMode: 'overlay', zIndex: 8000 },
]

async function applyDefaults() {
  console.log('🎨 Applying default values for overlay sound integration...\n')

  // First, check if columns exist
  console.log('🔍 Checking if migration columns exist...')
  const { data: testQuery, error: testError } = await supabase
    .from('broadcast_graphics')
    .select('id, display_mode, z_index, sound_drop_id, auto_play_sound')
    .limit(1)

  if (testError) {
    console.error('\n❌ Migration columns not found!')
    console.error('   Error:', testError.message)
    console.error('\n📝 Please run the SQL migration first:')
    console.error('   1. Open Supabase Dashboard SQL Editor')
    console.error('   2. Run: supabase/migrations/20250124_add_overlay_sound_and_layering.sql')
    console.error('   3. Then re-run this script\n')
    process.exit(1)
  }

  console.log('✅ Migration columns detected!\n')

  // Apply configuration to each overlay
  let successCount = 0
  let notFoundCount = 0

  for (const config of OVERLAY_CONFIG) {
    try {
      // Check if overlay exists
      const { data: existing } = await supabase
        .from('broadcast_graphics')
        .select('id, graphic_type, display_mode, z_index')
        .eq('graphic_type', config.type)
        .single()

      if (!existing) {
        console.log(`⚠️  Overlay not found: ${config.type}`)
        notFoundCount++
        continue
      }

      // Update overlay with new configuration
      const { error: updateError } = await supabase
        .from('broadcast_graphics')
        .update({
          display_mode: config.displayMode,
          z_index: config.zIndex,
          auto_play_sound: false,
          updated_at: new Date().toISOString()
        })
        .eq('graphic_type', config.type)

      if (updateError) {
        console.error(`❌ Failed to update ${config.type}:`, updateError.message)
      } else {
        console.log(`✅ ${config.type.padEnd(30)} → ${config.displayMode.padEnd(12)} (z: ${config.zIndex})`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error processing ${config.type}:`, err)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log(`✅ Successfully configured: ${successCount} overlays`)
  if (notFoundCount > 0) {
    console.log(`⚠️  Not found: ${notFoundCount} overlays (they may not be created yet)`)
  }
  console.log('='.repeat(70) + '\n')

  // Display final configuration
  console.log('📊 Final overlay configuration:\n')
  const { data: allGraphics, error: fetchError } = await supabase
    .from('broadcast_graphics')
    .select('graphic_type, display_mode, z_index, sound_drop_id, auto_play_sound')
    .order('z_index', { ascending: true })

  if (fetchError) {
    console.error('❌ Failed to fetch overlays:', fetchError.message)
  } else if (allGraphics) {
    console.log('─'.repeat(85))
    console.log('Graphic Type'.padEnd(30), 'Display Mode'.padEnd(15), 'Z-Index'.padEnd(10), 'Sound'.padEnd(10), 'Auto-Play')
    console.log('─'.repeat(85))
    
    allGraphics.forEach(overlay => {
      const hasSound = overlay.sound_drop_id ? '🔊' : '-'
      const autoPlay = overlay.auto_play_sound ? '✓' : '-'
      console.log(
        overlay.graphic_type.padEnd(30),
        (overlay.display_mode || 'exclusive').padEnd(15),
        (overlay.z_index || 1000).toString().padEnd(10),
        hasSound.padEnd(10),
        autoPlay
      )
    })
    console.log('─'.repeat(85))

    // Summary stats
    const modeStats = allGraphics.reduce((acc: any, o: any) => {
      const mode = o.display_mode || 'exclusive'
      acc[mode] = (acc[mode] || 0) + 1
      return acc
    }, {})

    console.log('\n📈 Summary:')
    console.log(`   Total overlays: ${allGraphics.length}`)
    console.log(`   Exclusive mode: ${modeStats.exclusive || 0}`)
    console.log(`   Overlay mode: ${modeStats.overlay || 0}`)
    console.log(`   Background mode: ${modeStats.background || 0}`)
    console.log(`   With sound drops: ${allGraphics.filter((o: any) => o.sound_drop_id).length}`)
    console.log(`   Z-index range: ${Math.min(...allGraphics.map((o: any) => o.z_index || 1000))} - ${Math.max(...allGraphics.map((o: any) => o.z_index || 1000))}`)
  }
}

applyDefaults()
  .then(() => {
    console.log('\n✨ Configuration complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. ✅ Update TypeScript types (database.ts)')
    console.log('   2. ✅ Update OverlayEditModal to show audio configuration')
    console.log('   3. ✅ Update BroadcastGraphicsDisplay for multi-layer rendering')
    console.log('   4. ✅ Test overlay sound assignment\n')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Configuration failed:', err)
    process.exit(1)
  })
