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
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTTSNotification() {
  console.log('🔍 Checking for TTS Notification sound...\n')

  const { data, error } = await supabase
    .from('soundboard_effects')
    .select('*')
    .eq('effect_name', 'TTS Notification')

  if (error) {
    console.error('❌ Error querying soundboard_effects:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  TTS Notification sound NOT FOUND')
    console.log('\n📝 To create it, run:')
    console.log(`
INSERT INTO soundboard_effects (effect_name, file_path, category, is_playing, volume)
VALUES ('TTS Notification', 'sounds/notification-chime.mp3', 'notifications', false, 0.7);
`)
    console.log('Or upload a chime sound via the Soundboard panel\n')
  } else {
    console.log('✅ TTS Notification sound found:')
    console.log(JSON.stringify(data[0], null, 2))
  }
}

checkTTSNotification()
