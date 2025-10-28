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

async function checkAllZIndex() {
  console.log('📊 Checking z-index of all broadcast graphics...\n')

  const { data, error } = await supabase
    .from('broadcast_graphics')
    .select('graphic_type, html_file, z_index, is_visible')
    .order('z_index', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (data) {
    console.log('All graphics sorted by z-index (highest first):')
    console.table(data)
  }
}

checkAllZIndex()
