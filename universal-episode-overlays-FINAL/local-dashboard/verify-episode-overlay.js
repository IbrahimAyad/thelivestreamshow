#!/usr/bin/env node

/**
 * Episode Overlay Verification Script
 * 
 * This script verifies that the Universal Episode System is working correctly
 * and provides step-by-step troubleshooting if issues are found.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyEpisodeSystem() {
  console.log('🔍 EPISODE OVERLAY VERIFICATION')
  console.log('================================\n')

  try {
    // Check episode_info table
    console.log('📋 Checking episode_info table...')
    const { data: episode, error } = await supabase
      .from('episode_info')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('❌ Database error:', error.message)
      return
    }

    if (!episode) {
      console.log('❌ No active episode found in database')
      console.log('💡 Solution: Insert episode data into episode_info table')
      return
    }

    console.log('✅ Episode data found:')
    console.log(`   📺 Title: "${episode.episode_title}"`)
    console.log(`   🔢 Episode: S${episode.season_number} EP${episode.episode_number}`)
    console.log(`   📅 Date: ${episode.episode_date}`)
    console.log(`   👁️  Visible: ${episode.is_visible ? 'YES' : 'NO'}`)
    console.log(`   ⚡ Active: ${episode.is_active ? 'YES' : 'NO'}`)
    console.log()

    // Check visibility status
    if (episode.is_visible) {
      console.log('🟢 Episode overlay SHOULD be visible on broadcast')
      console.log('   📍 Expected location: Bottom-right corner')
      console.log('   🎯 Expected design: Black card with gold borders')
    } else {
      console.log('🔴 Episode overlay is HIDDEN')
      console.log('   💡 Solution: Set is_visible = true in database')
      console.log('   📝 Run: UPDATE episode_info SET is_visible = true WHERE is_active = true;')
    }

    // Check component files
    console.log('\n📁 Checking component files...')
    
    const fs = await import('fs')
    
    const files = [
      'src/components/broadcast/PiNamecardOverlay.tsx',
      'src/hooks/useEpisodeInfo.ts',
      'src/components/BroadcastViewEnhanced.tsx'
    ]
    
    for (const file of files) {
      try {
        const stats = fs.statSync(file)
        console.log(`✅ ${file} - Found (${Math.round(stats.size / 1024)}KB)`)
      } catch {
        console.log(`❌ ${file} - Missing!`)
      }
    }

    console.log('\n🧪 TESTING STEPS:')
    console.log('1. Restart dev server: npm run dev')
    console.log('2. Go to: http://localhost:5173/broadcast')
    console.log('3. Look in bottom-right corner for episode card')
    console.log('4. Test toggle: Director Panel → Episode Info → 👁️ button')

    console.log('\n🎬 EXPECTED RESULT:')
    console.log('You should see a black card with gold accents in the bottom-right corner')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyEpisodeSystem()
