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

async function updateFinishHimZIndex() {
  console.log('🔧 Updating Finish Him overlay z-index to 9999...')

  const { data, error } = await supabase
    .from('broadcast_graphics')
    .update({ z_index: 9999 })
    .eq('graphic_type', 'finish-him')
    .select()

  if (error) {
    console.error('❌ Error updating z-index:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Successfully updated Finish Him z-index to 9999')
    console.log('📺 The overlay will now appear on top of all other graphics')
    console.log('🔄 Refresh your broadcast page to see the change')
  } else {
    console.log('⚠️  No Finish Him overlay found in database')
  }
}

updateFinishHimZIndex()
