#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyAndUpdateEpisodeInfo() {
  console.log('🔍 Checking episode_info table schema...\n')

  try {
    // Try to fetch current episode info
    const { data: episodes, error: fetchError } = await supabase
      .from('episode_info')
      .select('*')
      .eq('is_active', true)
      .limit(1)

    if (fetchError) {
      console.error('❌ Error fetching episodes:', fetchError.message)
      process.exit(1)
    }

    console.log('✅ Found episode_info table')
    console.log(`📊 Active episodes: ${episodes?.length || 0}\n`)

    if (episodes && episodes.length > 0) {
      const episode = episodes[0]
      console.log('Current Episode Data:')
      console.log(`  ID: ${episode.id}`)
      console.log(`  Episode #${episode.episode_number}`)
      console.log(`  Title: ${episode.episode_title}`)
      console.log(`  Date: ${episode.episode_date}`)
      console.log(`  is_active: ${episode.is_active}`)
      console.log(`  is_visible: ${episode.is_visible ?? 'NOT SET'}\n`)

      // Check if is_visible column exists
      if (episode.is_visible === undefined || episode.is_visible === null) {
        console.log('⚠️  is_visible column appears to be missing or null')
        console.log('🔧 Updating episode to add is_visible = true...\n')

        // Update the episode to have is_visible = true
        const { error: updateError } = await supabase
          .from('episode_info')
          .update({ is_visible: true })
          .eq('id', episode.id)

        if (updateError) {
          console.error('❌ Update failed:', updateError.message)
          console.log('\n📋 Manual Fix Required:')
          console.log('Run this SQL in Supabase Dashboard:')
          console.log('```sql')
          console.log('ALTER TABLE episode_info')
          console.log('ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;')
          console.log('')
          console.log('UPDATE episode_info')
          console.log('SET is_visible = TRUE')
          console.log('WHERE is_visible IS NULL;')
          console.log('```')
          process.exit(1)
        }

        console.log('✅ Successfully updated episode with is_visible = true')
        console.log('🎉 Database is ready!\n')
      } else {
        console.log(`✅ is_visible column exists and is set to: ${episode.is_visible}`)
        console.log('🎉 Database schema is correct!\n')
      }
    } else {
      console.log('⚠️  No active episodes found')
      console.log('💡 Create an episode in the Director Panel first\n')
    }

    // Final verification
    console.log('📋 Final Verification:')
    const { data: finalCheck } = await supabase
      .from('episode_info')
      .select('id, episode_number, episode_title, is_visible')
      .eq('is_active', true)
      .limit(1)

    if (finalCheck && finalCheck.length > 0) {
      const ep = finalCheck[0]
      console.log(`  Episode #${ep.episode_number}: "${ep.episode_title}"`)
      console.log(`  Broadcast Visible: ${ep.is_visible ? '✅ YES' : '❌ NO'}`)
      console.log(`\n${ep.is_visible ? '🟢' : '🔴'} Episode overlay will ${ep.is_visible ? 'SHOW' : 'NOT SHOW'} on broadcast`)
    }

    console.log('\n✅ Setup complete!')
    console.log('\n📝 Next Steps:')
    console.log('1. Restart your dev server: npm run dev')
    console.log('2. Open Director Panel → Episode Info')
    console.log('3. Click "On Air" button to toggle visibility')
    console.log('4. Check /broadcast to see the overlay')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

verifyAndUpdateEpisodeInfo()
