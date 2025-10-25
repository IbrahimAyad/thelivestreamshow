/**
 * Quick Check: Verify if migration columns exist
 * This script checks if the overlay sound integration columns are present
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('   Run: export $(cat .env.local | grep -v "^#" | xargs)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMigration() {
  console.log('🔍 Checking overlay sound integration migration status...\n')

  try {
    // Try to query the new columns
    const { data, error } = await supabase
      .from('broadcast_graphics')
      .select('id, display_mode, z_index, sound_drop_id, auto_play_sound')
      .limit(1)

    if (error) {
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('❌ Migration NOT applied yet\n')
        console.log('📝 NEXT STEPS:\n')
        console.log('1. Open Supabase Dashboard SQL Editor:')
        console.log('   https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql\n')
        console.log('2. Copy the entire contents of:')
        console.log('   supabase/migrations/20250124_add_overlay_sound_and_layering.sql\n')
        console.log('3. Paste into SQL Editor and click "Run"\n')
        console.log('4. After successful execution, run this script again to verify\n')
        console.log('5. Then run: npx tsx scripts/apply-overlay-defaults.ts\n')
        process.exit(1)
      } else {
        throw error
      }
    }

    console.log('✅ Migration columns detected!\n')
    console.log('📊 Testing column access...\n')

    // Query all overlays with new columns
    const { data: overlays, error: queryError } = await supabase
      .from('broadcast_graphics')
      .select('graphic_type, display_mode, z_index, sound_drop_id, auto_play_sound')
      .order('z_index', { ascending: true })

    if (queryError) throw queryError

    console.log('─'.repeat(90))
    console.log('Graphic Type'.padEnd(30), 'Display Mode'.padEnd(15), 'Z-Index'.padEnd(10), 'Sound'.padEnd(10), 'Auto-Play')
    console.log('─'.repeat(90))
    
    overlays?.forEach(overlay => {
      const hasSound = overlay.sound_drop_id ? '🔊' : '-'
      const autoPlay = overlay.auto_play_sound ? '✓' : '-'
      const displayMode = overlay.display_mode || 'exclusive'
      const zIndex = overlay.z_index || 1000
      
      console.log(
        overlay.graphic_type.padEnd(30),
        displayMode.padEnd(15),
        zIndex.toString().padEnd(10),
        hasSound.padEnd(10),
        autoPlay
      )
    })
    console.log('─'.repeat(90))

    // Summary stats
    const modeStats = overlays?.reduce((acc: any, o: any) => {
      const mode = o.display_mode || 'exclusive'
      acc[mode] = (acc[mode] || 0) + 1
      return acc
    }, {}) || {}

    console.log('\n📈 Migration Status Summary:')
    console.log(`   ✅ Columns exist and are accessible`)
    console.log(`   📊 Total overlays: ${overlays?.length || 0}`)
    console.log(`   🎨 Display modes configured:`)
    console.log(`      - Exclusive: ${modeStats.exclusive || 0}`)
    console.log(`      - Overlay: ${modeStats.overlay || 0}`)
    console.log(`      - Background: ${modeStats.background || 0}`)
    console.log(`   🔊 With sound drops: ${overlays?.filter((o: any) => o.sound_drop_id).length || 0}`)
    
    const hasDefaults = overlays?.some((o: any) => 
      o.display_mode !== null && o.z_index !== 1000
    )
    
    if (!hasDefaults) {
      console.log('\n⚠️  Default values not applied yet')
      console.log('   Run: npx tsx scripts/apply-overlay-defaults.ts')
    } else {
      console.log('\n✅ Default values appear to be applied')
      console.log('   🎉 Migration complete! System ready for use.')
    }

    console.log('\n📚 Next steps:')
    console.log('   1. Test overlay sound assignment via UI')
    console.log('   2. Configure display modes for overlays')
    console.log('   3. Test multi-layer rendering')
    console.log('   4. Verify audio playback\n')

  } catch (err: any) {
    console.error('❌ Error checking migration:', err.message)
    console.error('\nThis could indicate:')
    console.error('  - Database connection issues')
    console.error('  - RLS policy restrictions')
    console.error('  - Migration not yet applied\n')
    process.exit(1)
  }
}

checkMigration()
