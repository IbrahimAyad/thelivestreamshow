import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertDefaultConfig() {
  try {
    console.log('🚀 Inserting default automation_config row...')

    const { data, error } = await supabase
      .from('automation_config')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        automation_enabled: false,
        auto_execute_enabled: false,
        emergency_stop: false,
        confidence_auto_execute: 0.85,
        confidence_suggest: 0.60,
        confidence_log_only: 0.30,
        max_actions_per_minute: 10,
        cooldown_seconds: 5,
        debounce_seconds: 2,
        allowed_action_types: [
          "betabot.mood",
          "betabot.movement",
          "graphic.show",
          "graphic.hide",
          "obs.scene",
          "obs.source.show",
          "obs.source.hide"
        ],
        obs_enabled: false,
        obs_websocket_url: 'ws://localhost:4455',
        ai_provider: 'openai',
        ai_model: 'gpt-4',
        ai_context_window: 10,
        show_suggestions_ui: true,
        require_confirmation_for: ["obs.scene", "segment.switch"],
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Insert error:', error)
      process.exit(1)
    }

    console.log('✅ Default config row created successfully!')
    console.log(data)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

insertDefaultConfig()
