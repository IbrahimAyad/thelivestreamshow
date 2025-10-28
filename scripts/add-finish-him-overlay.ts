import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addFinishHimOverlay() {
  console.log('🎮 Adding Finish Him overlay to broadcast graphics...')

  // Check if it already exists
  const { data: existing } = await supabase
    .from('broadcast_graphics')
    .select('id')
    .eq('graphic_type', 'finish-him')
    .single()

  if (existing) {
    console.log('⚠️  Finish Him overlay already exists')
    console.log('Updating existing entry...')

    const { error: updateError } = await supabase
      .from('broadcast_graphics')
      .update({
        html_file: 'finish-him-overlay.html',
        is_visible: false,
        z_index: 100
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error('❌ Error updating:', updateError)
      return
    }

    console.log('✅ Updated Finish Him overlay')
    return
  }

  // Create new entry
  const { data, error } = await supabase
    .from('broadcast_graphics')
    .insert({
      graphic_type: 'finish-him',
      html_file: 'finish-him-overlay.html',
      is_visible: false,
      z_index: 100,
      display_mode: 'overlay'
    })
    .select()

  if (error) {
    console.error('❌ Error adding Finish Him overlay:', error)
    return
  }

  console.log('✅ Successfully added Finish Him overlay!')
  console.log('📺 You can now toggle it from the Graphics Gallery in the dashboard')
  console.log('🎯 It will appear as a transparent overlay on your broadcast')
}

addFinishHimOverlay()
