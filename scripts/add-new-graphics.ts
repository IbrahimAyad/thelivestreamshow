import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addNewGraphics() {
  console.log('🎨 Adding new interactive graphics to database...\n')

  const newGraphics = [
    {
      graphic_type: 'poll',
      is_visible: false,
      html_file: '/stream-poll-screen.html',
      position: 'fullscreen',
      config: {
        name: 'Poll/Vote',
        description: 'Interactive voting screen with countdown timer',
        audioEnabled: true,
        ttsMessage: 'Time to vote! What do you think? Cast your vote now!'
      }
    },
    {
      graphic_type: 'milestone',
      is_visible: false,
      html_file: '/stream-milestone-screen.html',
      position: 'fullscreen',
      config: {
        name: 'Milestone Celebration',
        description: 'Celebration graphic for follower/subscriber milestones',
        audioEnabled: true,
        ttsMessage: 'We just hit a major milestone! One thousand followers! You are all amazing! Thank you so much for your support!'
      }
    },
    {
      graphic_type: 'chat_highlight',
      is_visible: false,
      html_file: '/stream-chat-highlight.html',
      position: 'fullscreen',
      config: {
        name: 'Chat Highlight',
        description: 'Highlights viewer messages with BetaBot voiceover',
        audioEnabled: true,
        ttsMessage: 'Dynamic message based on chat content'
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

  console.log('\n✨ Done! All new graphics have been added.')
  process.exit(0)
}

addNewGraphics()
