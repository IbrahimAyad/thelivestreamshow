import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addAdditionalGraphics() {
  console.log('🎨 Adding additional stream graphics to database...\n')

  const newGraphics = [
    {
      graphic_type: 'award_show',
      is_visible: false,
      html_file: '/stream-award-show.html',
      position: 'fullscreen',
      config: {
        name: 'Award Show',
        description: 'PATH AWARD SHOW - Celebration ceremony with curtains',
        audioEnabled: false
      }
    },
    {
      graphic_type: 'finish_him',
      is_visible: false,
      html_file: '/stream-finish-him.html',
      position: 'fullscreen',
      config: {
        name: 'Finish Him',
        description: 'FINISH HIM - Ultimate victory screen',
        audioEnabled: false
      }
    },
    {
      graphic_type: 'new_member',
      is_visible: false,
      html_file: '/stream-new-member.html',
      position: 'fullscreen',
      config: {
        name: 'New Member',
        description: 'A New Challenger Approaches! - New subscriber/member announcement',
        audioEnabled: false
      }
    },
    {
      graphic_type: 'rage_meter',
      is_visible: false,
      html_file: '/stream-rage-meter.html',
      position: 'fullscreen',
      config: {
        name: 'Rage Meter',
        description: 'RAGE METER - Tilt detection system',
        audioEnabled: false
      }
    },
    {
      graphic_type: 'versus',
      is_visible: false,
      html_file: '/stream-versus-screen.html',
      position: 'fullscreen',
      config: {
        name: 'Versus',
        description: 'VERSUS - Debate battle screen',
        audioEnabled: false
      }
    }
  ]

  for (const graphic of newGraphics) {
    console.log(`Checking if ${graphic.graphic_type} exists...`)

    // Check if already exists
    const { data: existing } = await supabase
      .from('broadcast_graphics')
      .select('id')
      .eq('graphic_type', graphic.graphic_type)
      .single()

    if (existing) {
      console.log(`  ✅ ${graphic.graphic_type} already exists (ID: ${existing.id})`)
      continue
    }

    // Insert new graphic
    const { data, error } = await supabase
      .from('broadcast_graphics')
      .insert(graphic)
      .select()
      .single()

    if (error) {
      console.error(`  ❌ Failed to insert ${graphic.graphic_type}:`, error.message)
    } else {
      console.log(`  ✅ Added ${graphic.graphic_type} (ID: ${data.id})`)
    }
  }

  console.log('\n✨ Done! All additional graphics have been added.')
  process.exit(0)
}

addAdditionalGraphics()
