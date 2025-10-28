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
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listSounds() {
  console.log('🔊 Listing all soundboard effects...\n')

  const { data, error } = await supabase
    .from('soundboard_effects')
    .select('effect_name, audio_url, effect_type')
    .order('effect_type', { ascending: true })
    .order('effect_name', { ascending: true })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No sounds found')
    return
  }

  console.log(`Found ${data.length} sound effects:\n`)

  let currentType = ''
  data.forEach(sound => {
    if (sound.effect_type !== currentType) {
      currentType = sound.effect_type
      console.log(`\n📁 ${currentType?.toUpperCase() || 'UNCATEGORIZED'}:`)
    }
    console.log(`  - ${sound.effect_name} (${sound.audio_url})`)
  })

  console.log('\n\n💡 Looking for notification/chime sounds...')
  const notifications = data.filter(s =>
    s.effect_name?.toLowerCase().includes('notif') ||
    s.effect_name?.toLowerCase().includes('chime') ||
    s.effect_name?.toLowerCase().includes('bell') ||
    s.effect_name?.toLowerCase().includes('ding') ||
    s.effect_type?.toLowerCase().includes('notif')
  )

  if (notifications.length > 0) {
    console.log('\n✅ Potential notification sounds found:')
    notifications.forEach(s => {
      console.log(`  - ${s.effect_name}`)
    })
  } else {
    console.log('\n⚠️  No notification sounds found')
  }
}

listSounds()
