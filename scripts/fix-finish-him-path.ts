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

async function fixFinishHimPath() {
  console.log('🔧 Fixing Finish Him overlay path...')

  const { data, error } = await supabase
    .from('broadcast_graphics')
    .update({ html_file: '/finish-him-overlay.html' })
    .eq('graphic_type', 'finish-him')
    .select()

  if (error) {
    console.error('❌ Error updating path:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Successfully updated Finish Him path to /finish-him-overlay.html')
    console.log('🔄 Refresh your broadcast page to load the overlay')
  } else {
    console.log('⚠️  No Finish Him overlay found in database')
  }
}

fixFinishHimPath()
