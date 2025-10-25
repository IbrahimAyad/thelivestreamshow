#!/usr/bin/env npx tsx

/**
 * Merge Production Alert Triggers
 * 
 * Consolidates duplicate production alert triggers into a single optimized rule
 * Deletes old rules and creates one comprehensive trigger
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

async function mergeTriggers() {
  console.log('🔧 Merging Production Alert Triggers...\n')

  // Step 1: Find existing production alert triggers
  console.log('1️⃣  Finding existing production alert triggers...')
  const { data: existingRules, error: fetchError } = await supabase
    .from('trigger_rules')
    .select('*')
    .or('rule_name.eq.Production Alert Keyword,rule_name.eq.Claude Production Alert')

  if (fetchError) {
    console.error('❌ Error fetching rules:', fetchError.message)
    process.exit(1)
  }

  if (existingRules && existingRules.length > 0) {
    console.log(`   Found ${existingRules.length} existing rule(s):`)
    existingRules.forEach(rule => {
      console.log(`   - "${rule.rule_name}" (P${rule.priority}, ${rule.enabled ? 'Enabled' : 'Disabled'})`)
      console.log(`     Keywords: ${rule.trigger_conditions?.keywords?.join(', ') || 'N/A'}`)
    })
    console.log()

    // Step 2: Delete old rules
    console.log('2️⃣  Deleting old rules...')
    const { error: deleteError } = await supabase
      .from('trigger_rules')
      .delete()
      .or('rule_name.eq.Production Alert Keyword,rule_name.eq.Claude Production Alert')

    if (deleteError) {
      console.error('❌ Error deleting old rules:', deleteError.message)
      process.exit(1)
    }
    console.log('   ✅ Old rules deleted\n')
  } else {
    console.log('   No existing rules found\n')
  }

  // Step 3: Create merged optimized rule
  console.log('3️⃣  Creating merged optimized rule...')
  
  const mergedRule = {
    rule_name: 'Production Alert (Keyword)',
    description: 'Trigger Claude AI production alert graphic when production-related keywords are spoken',
    trigger_type: 'keyword' as const,
    trigger_conditions: {
      keywords: [
        'production',
        'production alert', 
        'fix production',
        'production issue',
        'production down',
        'production problem'
      ],
      match_type: 'any',
      case_sensitive: false
    },
    action_type: 'graphic.show' as const,
    action_params: {
      graphic_type: 'claude_production_alert',
      duration_seconds: 10
    },
    enabled: true,
    priority: 3, // P3 Normal priority
    require_operator_approval: false,
    active_days: [0, 1, 2, 3, 4, 5, 6], // All days
    max_executions_per_show: null, // No limit
    cooldown_seconds: 30 // 30 second cooldown between triggers
  }

  const { data: newRule, error: insertError } = await supabase
    .from('trigger_rules')
    .insert([mergedRule])
    .select()

  if (insertError) {
    console.error('❌ Error creating merged rule:', insertError.message)
    process.exit(1)
  }

  console.log('   ✅ Merged rule created successfully!\n')

  // Step 4: Display final configuration
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ MERGE COMPLETE!\n')
  console.log('📋 Final Rule Configuration:')
  console.log('   Name:', mergedRule.rule_name)
  console.log('   Priority:', `P${mergedRule.priority} (Normal)`)
  console.log('   Enabled:', mergedRule.enabled ? 'Yes ✅' : 'No')
  console.log('   Auto-execute:', !mergedRule.require_operator_approval ? 'Yes ✅' : 'No')
  console.log('   Cooldown:', mergedRule.cooldown_seconds, 'seconds')
  console.log('\n   Trigger Keywords (any of these):')
  mergedRule.trigger_conditions.keywords.forEach(keyword => {
    console.log(`   • "${keyword}"`)
  })
  console.log('\n   Action:')
  console.log('   • Show Claude Production Alert graphic')
  console.log('   • Duration: 10 seconds (auto-hide)')
  console.log('\n   Match Configuration:')
  console.log('   • Match Type: ANY (triggers if any keyword found)')
  console.log('   • Case Sensitive: No')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  console.log('🎤 How to trigger:')
  console.log('   Just say any of the keywords above during the stream!')
  console.log('   The graphic will appear automatically.\n')
}

mergeTriggers()
