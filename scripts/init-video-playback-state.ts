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

async function initVideoPlaybackState() {
  console.log('🎬 Initializing video playback state...')

  // Check if entry exists
  const { data: existing } = await supabase
    .from('video_playback_state')
    .select('id')
    .single()

  if (existing) {
    console.log('✅ Video playback state already initialized')
    return
  }

  // Create initial playback state
  const { data, error } = await supabase
    .from('video_playback_state')
    .insert({
      id: '00000000-0000-0000-0000-000000000000',
      current_video_id: null,
      is_playing: false,
      volume: 80,
      auto_advance: true
    })
    .select()

  if (error) {
    console.error('❌ Error initializing video playback state:', error)
    return
  }

  console.log('✅ Video playback state initialized')
  console.log('🎥 You can now use the video player at /broadcast/video-player')
}

initVideoPlaybackState()
