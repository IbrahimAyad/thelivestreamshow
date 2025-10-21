/**
 * Create Main Show Layout Preset
 *
 * This script creates a preset based on the standard broadcast layout:
 * - BetaBot avatar (top right)
 * - LIVE badge (top right)
 * - Mail notifications icon
 * - Stream time counter
 * - "WELCOME BACK TO THE STREAM" overlay
 * - Episode info bar (bottom)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  console.error('(Will fallback to VITE_SUPABASE_ANON_KEY if service key not available)')
  process.exit(1)
}

// Use service key to bypass RLS for creating public templates
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMainShowPreset() {
  console.log('🎬 Creating Main Show Layout preset...')

  const preset = {
    name: 'Main Show Layout',
    description: 'Complete broadcast layout with BetaBot avatar, LIVE badges, stream timer, welcome overlay, and episode info bar. This is the standard show configuration.',
    category: 'custom',
    tags: ['main', 'default', 'standard', 'broadcast', 'complete'],

    // Action sequence to recreate the layout
    action_sequence: [
      {
        action_type: 'graphic.show',
        action_data: {
          graphic_type: 'betabot_avatar',
          position: 'top-right',
          content: {
            avatar_url: '/betabot-avatar.png',
            show_mail_icon: true,
            notification_count: 3,
            show_live_badge: true
          }
        },
        delay_ms: 0,
        description: 'Show BetaBot avatar in top right with notifications'
      },
      {
        action_type: 'graphic.show',
        action_data: {
          graphic_type: 'live_indicator',
          position: 'middle-right',
          content: {
            show_live_badge: true,
            show_stream_time: true,
            time_format: 'mm:ss',
            style: 'red-badge'
          }
        },
        delay_ms: 100,
        description: 'Show LIVE indicator and stream timer'
      },
      {
        action_type: 'graphic.show',
        action_data: {
          graphic_type: 'welcome_overlay',
          position: 'center',
          content: {
            header_text: 'WELCOME BACK TO THE STREAM',
            title_text: 'Welcome Back To The Stream',
            header_color: 'yellow',
            show_divider_line: true
          }
        },
        delay_ms: 200,
        description: 'Show welcome back overlay in center'
      },
      {
        action_type: 'lower_third.show',
        action_data: {
          position: 'bottom-left',
          text_line_1: 'Abe',
          text_line_2: 'The Live Stream Show',
          text_line_3: '@abelivestream',
          style: 'dark-panel',
          show_vertical_bar: true,
          vertical_bar_color: 'yellow'
        },
        delay_ms: 300,
        description: 'Show host info in bottom left'
      },
      {
        action_type: 'lower_third.show',
        action_data: {
          position: 'bottom-right',
          text_line_1: 'EP 1',
          text_line_2: 'Oct 13, 2025',
          text_line_3: 'Alpha Wednesday',
          style: 'dark-panel',
          show_vertical_bar: true,
          vertical_bar_color: 'yellow'
        },
        delay_ms: 400,
        description: 'Show episode info in bottom right'
      }
    ],

    // Automation config for this preset
    automation_config: {
      automation_enabled: true,
      auto_execute_enabled: true,
      confidence_auto_execute: 0.85,
      confidence_suggest: 0.70,
      max_actions_per_minute: 10,
      cooldown_seconds: 3
    },

    // Trigger rules for this layout
    trigger_rules: [
      {
        rule_name: 'Show welcome overlay on stream start',
        enabled: true,
        priority: 1,
        trigger_type: 'event',
        trigger_conditions: {
          event_type: 'stream_start'
        },
        action_type: 'graphic.show',
        action_params: {
          graphic_type: 'welcome_overlay',
          duration: 10000
        },
        require_operator_approval: false
      }
    ],

    // Metadata
    is_public: true, // Make it a public template accessible to all users
    is_favorite: true,
    use_count: 0,
    created_by: null
  }

  try {
    const { data, error } = await supabase
      .from('scene_presets')
      .insert(preset)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Main Show Layout preset created successfully!')
    console.log('📋 Preset ID:', data.id)
    console.log('🎨 Name:', data.name)
    console.log('📝 Description:', data.description)
    console.log('🏷️  Tags:', data.tags.join(', '))
    console.log('⚙️  Action sequence steps:', data.action_sequence.length)
    console.log('\n🎬 You can now apply this preset from the Scene Presets & Templates panel!')

    return data
  } catch (error) {
    console.error('❌ Failed to create preset:', error)
    throw error
  }
}

// Run the script
createMainShowPreset()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })
