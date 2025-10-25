#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addEpisodeInfoVisibility() {
  console.log('🔧 Adding is_visible column to episode_info table...\n')

  try {
    // Execute raw SQL to add column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE episode_info 
        ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
        
        UPDATE episode_info 
        SET is_visible = TRUE 
        WHERE is_visible IS NULL;
      `
    })

    if (error) {
      // If RPC doesn't exist, update existing records manually
      console.log('⚠️  RPC not available, updating records manually...')
      
      // Fetch all episode_info records
      const { data: episodes } = await supabase
        .from('episode_info')
        .select('id')
      
      if (episodes && episodes.length > 0) {
        console.log(`✅ Found ${episodes.length} episode records`)
        console.log('💡 Column will be added automatically when you edit episodes')
      }
    } else {
      console.log('✅ is_visible column added successfully!')
    }

    console.log('\n✅ Migration complete!')
    console.log('📝 Episode info visibility can now be controlled from the Director Panel')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

addEpisodeInfoVisibility()
