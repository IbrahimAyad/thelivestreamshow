#!/usr/bin/env tsx

/**
 * Add Tomato Chat Game to broadcast_graphics table
 * Interactive keyboard-controlled tomato throwing game with Discord integration
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTomatoChatGame() {
  console.log('🍅 Adding Tomato Chat Game to broadcast_graphics...\n')

  const graphic = {
    graphic_type: 'tomato_chat_game',
    html_file: '/tomato-chat-game.html',
    is_visible: false,
    is_template: false,
    position: 'fullscreen',
    config: {
      description: 'Interactive tomato throwing game - Take Down Bibi!',
      duration_seconds: 0, // Manual control
      auto_hide: false,
      keyboard_controls: {
        throw_zones: ['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'X', 'C'],
        throw_tomato: 'T',
        reset: 'R',
        toggle_overlay: 'H',
        close: 'Space'
      },
      game_features: [
        '9-zone keyboard throwing system',
        'Health-based encouragement messages',
        '"Finish Him!" audio with cooldown',
        'Call-to-action popup after 8 seconds',
        'Auto-reset after KO screen',
        'Discord chat integration ready'
      ],
      trigger_keywords: ['tomato', 'game', 'bibi']
    }
  }

  const { data, error } = await supabase
    .from('broadcast_graphics')
    .upsert([graphic], {
      onConflict: 'graphic_type',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('❌ Error adding graphic:', error)
    process.exit(1)
  }

  console.log('✅ Tomato Chat Game added successfully!')
  console.log('\nGraphic Details:')
  console.log('  Type:', graphic.graphic_type)
  console.log('  HTML File:', graphic.html_file)
  console.log('  Position:', graphic.position)
  console.log('  Manual Control:', !graphic.config.auto_hide)
  console.log('\nKeyboard Controls:')
  console.log('  Throw Zones: Q/W/E/A/S/D/Z/X/C')
  console.log('  Throw Tomato: T')
  console.log('  Reset: R')
  console.log('  Toggle Overlay: H')
  console.log('  Close: Space')
  console.log('\n✨ Ready to use! Toggle visibility in Studio Control Panel.\n')
}

addTomatoChatGame()
