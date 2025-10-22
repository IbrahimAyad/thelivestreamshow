/**
 * Setup Script: Initialize all broadcast graphics in the database
 * 
 * This script will:
 * 1. Create entries for all graphics overlays
 * 2. Set their HTML file paths
 * 3. Verify they're working
 * 
 * Run with: npx tsx scripts/setup-graphics.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const GRAPHICS = [
  { type: 'starting_soon', htmlFile: '/stream-starting-soon.html', position: 'fullscreen' },
  { type: 'brb', htmlFile: '/stream-brb-screen.html', position: 'fullscreen' },
  { type: 'brb_tomato_game', htmlFile: '/brb-tomato-game.html', position: 'fullscreen' },
  { type: 'tech_difficulties', htmlFile: '/stream-technical-issues.html', position: 'fullscreen' },
  { type: 'outro', htmlFile: '/stream-outro-screen.html', position: 'fullscreen' },
  { type: 'ai_dj_visualizer', htmlFile: '/animations/ai-dj-visualizer.html', position: 'fullscreen' },
  { type: 'out_of_context_background', htmlFile: '/graphics/out-of-context-full.html', position: 'fullscreen' },
  { type: 'poll', htmlFile: '/stream-poll-screen.html', position: 'fullscreen' },
  { type: 'milestone', htmlFile: '/stream-milestone-screen.html', position: 'fullscreen' },
  { type: 'chat_highlight', htmlFile: '/stream-chat-highlight.html', position: 'fullscreen' },
  { type: 'award_show', htmlFile: '/stream-award-show.html', position: 'fullscreen' },
  { type: 'finish_him', htmlFile: '/stream-finish-him.html', position: 'fullscreen' },
  { type: 'new_member', htmlFile: '/stream-new-member.html', position: 'fullscreen' },
  { type: 'rage_meter', htmlFile: '/stream-rage-meter.html', position: 'fullscreen' },
  { type: 'versus', htmlFile: '/stream-versus-screen.html', position: 'fullscreen' },
  { type: 'logo', htmlFile: null, position: 'top_right' },
]

async function setupGraphics() {
  console.log('🎨 Setting up broadcast graphics...\n')

  for (const graphic of GRAPHICS) {
    try {
      // Check if graphic already exists
      const { data: existing } = await supabase
        .from('broadcast_graphics')
        .select('id, graphic_type')
        .eq('graphic_type', graphic.type)
        .single()

      if (existing) {
        // Update existing graphic
        const { error } = await supabase
          .from('broadcast_graphics')
          .update({
            html_file: graphic.htmlFile,
            position: graphic.position,
            updated_at: new Date().toISOString()
          })
          .eq('graphic_type', graphic.type)

        if (error) {
          console.error(`❌ Failed to update ${graphic.type}:`, error.message)
        } else {
          console.log(`✅ Updated: ${graphic.type}`)
        }
      } else {
        // Insert new graphic
        const { error } = await supabase
          .from('broadcast_graphics')
          .insert({
            graphic_type: graphic.type,
            is_visible: false,
            position: graphic.position,
            html_file: graphic.htmlFile,
            config: {}
          })

        if (error) {
          console.error(`❌ Failed to insert ${graphic.type}:`, error.message)
        } else {
          console.log(`✅ Created: ${graphic.type}`)
        }
      }
    } catch (err) {
      console.error(`❌ Error processing ${graphic.type}:`, err)
    }
  }

  // Verify all graphics
  console.log('\n📊 Verifying graphics in database...\n')
  const { data: allGraphics, error } = await supabase
    .from('broadcast_graphics')
    .select('graphic_type, is_visible, html_file, position')
    .order('graphic_type')

  if (error) {
    console.error('❌ Failed to fetch graphics:', error.message)
  } else {
    console.table(allGraphics)
    console.log(`\n✅ Total graphics in database: ${allGraphics?.length || 0}`)
  }
}

setupGraphics()
  .then(() => {
    console.log('\n✨ Graphics setup complete!')
    console.log('   You can now use all graphics overlays from the dashboard.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Setup failed:', err)
    process.exit(1)
  })

