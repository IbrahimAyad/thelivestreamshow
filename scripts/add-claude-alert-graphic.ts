#!/usr/bin/env tsx

/**
 * Add Claude Production Alert to broadcast_graphics table
 */

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

async function addClaudeAlert() {
  console.log('🚀 Adding Claude Production Alert to broadcast_graphics...\n')

  const graphic = {
    graphic_type: 'claude_production_alert',
    html_file: '/claude-production-alert.html',
    is_visible: false,
    is_template: false,
    position: 'fullscreen',
    config: {
      description: 'Claude AI production issue detection and fix animation',
      duration_seconds: 10,
      auto_hide: true,
      trigger_keyword: 'production'
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

  console.log('✅ Claude Production Alert added successfully!')
  console.log('\nGraphic Details:')
  console.log('  Type:', graphic.graphic_type)
  console.log('  HTML File:', graphic.html_file)
  console.log('  Position:', graphic.position)
  console.log('  Auto-hide:', graphic.config.auto_hide)
  console.log('  Duration:', graphic.config.duration_seconds, 'seconds')
  console.log('  Trigger Keyword:', graphic.config.trigger_keyword)
  console.log('\n✨ Ready to use! Say "production" during the stream to trigger the alert.\n')
}

addClaudeAlert()
