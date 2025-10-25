#!/usr/bin/env tsx

/**
 * Add trigger rule for 'production' keyword to show Claude Production Alert
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

async function addTriggerRule() {
  console.log('🚀 Adding "production" keyword trigger rule...\n')

  const triggerRule = {
    rule_name: 'Claude Production Alert',
    description: 'Trigger Claude AI production alert when "production" keyword is spoken',
    trigger_type: 'keyword' as const,
    trigger_conditions: {
      keywords: ['production'],
      match_type: 'any',
      case_sensitive: false
    },
    action_type: 'graphic.show' as const,
    action_params: {
      graphic_type: 'claude_production_alert',
      duration_seconds: 10
    },
    enabled: true,
    priority: 5,
    require_operator_approval: false,
    active_days: [0, 1, 2, 3, 4, 5, 6], // All days
    max_executions_per_show: null, // No limit
    cooldown_seconds: 30 // 30 second cooldown between triggers
  }

  const { data, error } = await supabase
    .from('trigger_rules')
    .upsert([triggerRule], {
      onConflict: 'rule_name',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('❌ Error adding trigger rule:', error)
    process.exit(1)
  }

  console.log('✅ Trigger rule added successfully!')
  console.log('\nRule Details:')
  console.log('  Name:', triggerRule.rule_name)
  console.log('  Trigger Type:', triggerRule.trigger_type)
  console.log('  Keywords:', triggerRule.trigger_conditions.keywords.join(', '))
  console.log('  Action:', triggerRule.action_type)
  console.log('  Graphic:', triggerRule.action_params.graphic_type)
  console.log('  Auto-execute:', !triggerRule.require_operator_approval)
  console.log('  Cooldown:', triggerRule.cooldown_seconds, 'seconds')
  console.log('\n✨ The alert will now trigger automatically when "production" is spoken!\n')
}

addTriggerRule()
