#!/usr/bin/env tsx
/**
 * Verify all graphics overlays in database
 * Shows what overlays are currently registered
 */

import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyOverlays() {
  console.log('\n📊 Broadcast Graphics Overlays Database Check\n')
  console.log('='.repeat(60))

  try {
    const { data, error } = await supabase
      .from('broadcast_graphics')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('\n❌ Error fetching overlays:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) {
      console.log('\n⚠️  No overlays found in database!')
      console.log('\nRun these scripts to add overlays:')
      console.log('  npx tsx scripts/add-additional-graphics.ts')
      console.log('  npx tsx scripts/add-pi-namecard-graphic.ts')
      process.exit(0)
    }

    console.log(`\n✅ Found ${data.length} overlays:\n`)

    data.forEach((overlay, index) => {
      console.log(`${index + 1}. ${overlay.config?.name || overlay.graphic_type}`)
      console.log(`   Type: ${overlay.graphic_type}`)
      console.log(`   File: ${overlay.html_file}`)
      console.log(`   Position: ${overlay.position}`)
      console.log(`   Visible: ${overlay.is_visible ? '✓ YES' : '✗ NO'}`)
      console.log(`   ID: ${overlay.id}`)
      console.log('')
    })

    console.log('='.repeat(60))
    console.log(`\n✅ Total: ${data.length} overlays registered`)
    console.log('\n📋 To add more overlays:')
    console.log('   npx tsx scripts/add-additional-graphics.ts')
    console.log('   npx tsx scripts/add-pi-namecard-graphic.ts')
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

verifyOverlays()
