#!/usr/bin/env npx tsx

/**
 * Add Production Alert Hotkey Trigger
 * 
 * Creates a hotkey trigger rule for the "P" key to manually trigger the production alert
 * This is a backup method - primary method should be voice/keyword detection
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addHotkeyTrigger() {
  console.log('⌨️  Adding Production Alert Hotkey Trigger...\n')

  // Note: Hotkey triggers in our system are manual triggers
  // We'll create a reference note in the database for documentation
  // The actual hotkey will be implemented in the frontend component

  const hotkeyRule = {
    rule_name: 'Production Alert (Hotkey Backup)',
    description: 'Manual hotkey trigger for production alert (Press P) - Backup method, prefer voice activation',
    trigger_type: 'manual' as const,
    trigger_conditions: {
      hotkey: 'KeyP',
      description: 'Press "P" key to manually trigger production alert'
    },
    action_type: 'graphic.show' as const,
    action_params: {
      graphic_type: 'claude_production_alert',
      duration_seconds: 10
    },
    enabled: true,
    priority: 4, // P4 - Lower priority than voice (backup method)
    require_operator_approval: false,
    active_days: [0, 1, 2, 3, 4, 5, 6],
    max_executions_per_show: null,
    cooldown_seconds: 30
  }

  const { data, error } = await supabase
    .from('trigger_rules')
    .upsert([hotkeyRule], {
      onConflict: 'rule_name',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('❌ Error adding hotkey rule:', error.message)
    process.exit(1)
  }

  console.log('✅ Hotkey trigger rule added successfully!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Hotkey Configuration:')
  console.log('   Name:', hotkeyRule.rule_name)
  console.log('   Hotkey: Press "P" key')
  console.log('   Priority:', `P${hotkeyRule.priority} (Backup method)`)
  console.log('   Enabled:', hotkeyRule.enabled ? 'Yes ✅' : 'No')
  console.log('   Cooldown:', hotkeyRule.cooldown_seconds, 'seconds')
  console.log('\n   ⚠️  NOTE: This is a BACKUP method')
  console.log('   Primary method: Voice activation ("production" keyword)')
  console.log('   Use hotkey only when voice detection fails')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('⚙️  Next step: Implement hotkey listener in dashboard\n')
}

addHotkeyTrigger()
