#!/usr/bin/env tsx

/**
 * Verify Production Keyword Trigger Setup
 * 
 * Checks if the "production" keyword trigger is correctly configured:
 * 1. Graphic exists in broadcast_graphics table
 * 2. Trigger rule(s) exist in trigger_rules table
 * 3. Automation config is enabled
 * 4. HTML file exists
 */

import { createClient } from '@supabase/supabase-js'
import { existsSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
  console.error('\n💡 Set environment variables or run from the app context')
  console.error('\nFor now, you can manually check in Supabase Dashboard:')
  console.error('   1. Check broadcast_graphics table for graphic_type = \'claude_production_alert\'')
  console.error('   2. Check trigger_rules table for rule_name LIKE \'%Production%\'')
  console.error('   3. Check automation_config table for automation_enabled = true')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySetup() {
  console.log('🔍 Verifying Production Alert Trigger Setup\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let allGood = true

  // ==========================================
  // 1. Check HTML File
  // ==========================================
  console.log('📄 Checking HTML File...')
  const htmlPath = join(process.cwd(), 'public', 'claude-production-alert.html')
  if (existsSync(htmlPath)) {
    console.log('   ✅ HTML file exists:', htmlPath)
  } else {
    console.log('   ❌ HTML file NOT FOUND:', htmlPath)
    allGood = false
  }
  console.log()

  // ==========================================
  // 2. Check Broadcast Graphic
  // ==========================================
  console.log('🎨 Checking Broadcast Graphic...')
  const { data: graphics, error: graphicError } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .eq('graphic_type', 'claude_production_alert')

  if (graphicError) {
    console.log('   ❌ Error fetching graphic:', graphicError.message)
    allGood = false
  } else if (!graphics || graphics.length === 0) {
    console.log('   ❌ Graphic NOT FOUND in database')
    console.log('   → Run: npm run add-claude-alert-graphic')
    allGood = false
  } else {
    const graphic = graphics[0]
    console.log('   ✅ Graphic found in database')
    console.log('      Type:', graphic.graphic_type)
    console.log('      HTML File:', graphic.html_file)
    console.log('      Position:', graphic.position)
    console.log('      Currently Visible:', graphic.is_visible ? 'Yes' : 'No')
    console.log('      Auto-hide:', graphic.config?.auto_hide ? 'Yes' : 'No')
    console.log('      Duration:', graphic.config?.duration_seconds || 'N/A', 'seconds')
  }
  console.log()

  // ==========================================
  // 3. Check Trigger Rules
  // ==========================================
  console.log('⚡ Checking Trigger Rules...')
  const { data: rules, error: ruleError } = await supabase
    .from('trigger_rules')
    .select('*')
    .eq('trigger_type', 'keyword')
    .eq('action_type', 'graphic.show')
    .like('action_params->>graphic_type', 'claude_production_alert')

  if (ruleError) {
    console.log('   ❌ Error fetching rules:', ruleError.message)
    allGood = false
  } else if (!rules || rules.length === 0) {
    console.log('   ❌ No trigger rules found')
    console.log('   → Run: npm run add-production-trigger-rule')
    allGood = false
  } else {
    console.log(`   ✅ Found ${rules.length} trigger rule(s):\n`)
    
    rules.forEach((rule, index) => {
      console.log(`   Rule ${index + 1}: "${rule.rule_name}"`)
      console.log('      Priority:', `P${rule.priority}`, `(${getPriorityLabel(rule.priority)})`)
      console.log('      Enabled:', rule.enabled ? '✅ Yes' : '❌ No')
      console.log('      Keywords:', rule.trigger_conditions?.keywords?.join(', ') || 'N/A')
      console.log('      Match Type:', rule.trigger_conditions?.match_type || 'N/A')
      console.log('      Case Sensitive:', rule.trigger_conditions?.case_sensitive ? 'Yes' : 'No')
      console.log('      Auto-execute:', rule.require_operator_approval ? 'No (requires approval)' : '✅ Yes')
      console.log('      Cooldown:', rule.cooldown_seconds || 0, 'seconds')
      console.log('      Active Days:', rule.active_days?.length === 7 ? 'All days' : rule.active_days)
      console.log()
    })

    // Check for duplicate rules
    if (rules.length > 1) {
      console.log('   ⚠️  WARNING: Multiple rules detected!')
      console.log('   → This may cause duplicate triggers')
      console.log('   → Consider consolidating into a single rule\n')
    }
  }

  // ==========================================
  // 4. Check Automation Config
  // ==========================================
  console.log('⚙️  Checking Automation Config...')
  const { data: config, error: configError } = await supabase
    .from('automation_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (configError) {
    console.log('   ❌ Error fetching config:', configError.message)
    allGood = false
  } else if (!config) {
    console.log('   ❌ Automation config NOT FOUND')
    allGood = false
  } else {
    console.log('   Automation Enabled:', config.automation_enabled ? '✅ Yes' : '❌ No')
    console.log('   Auto-Execute Enabled:', config.auto_execute_enabled ? '✅ Yes' : '❌ No')
    console.log('   Emergency Stop:', config.emergency_stop ? '⚠️  ACTIVE' : '✅ No')
    console.log('   Action Types Allowed:', config.allowed_action_types?.includes('graphic.show') ? '✅ graphic.show' : '❌ graphic.show NOT allowed')
    console.log('   Max Actions/Minute:', config.max_actions_per_minute)
    console.log('   Confidence Auto-Execute:', `>= ${(config.confidence_auto_execute || 0) * 100}%`)
    console.log()

    if (!config.automation_enabled) {
      console.log('   ⚠️  WARNING: Automation is DISABLED')
      console.log('   → Enable it in the Automation Dashboard\n')
      allGood = false
    }

    if (!config.auto_execute_enabled) {
      console.log('   ⚠️  WARNING: Auto-execute is DISABLED')
      console.log('   → Triggers will require operator approval\n')
    }

    if (config.emergency_stop) {
      console.log('   ⚠️  WARNING: Emergency stop is ACTIVE')
      console.log('   → All automation is paused\n')
      allGood = false
    }

    if (!config.allowed_action_types?.includes('graphic.show')) {
      console.log('   ❌ ERROR: graphic.show action not in allowed_action_types')
      console.log('   → Add it to automation_config.allowed_action_types\n')
      allGood = false
    }
  }

  // ==========================================
  // 5. Test Recent Events
  // ==========================================
  console.log('📊 Checking Recent Automation Events...')
  const { data: events, error: eventsError } = await supabase
    .from('automation_events')
    .select('*')
    .eq('action_type', 'graphic.show')
    .order('created_at', { ascending: false })
    .limit(5)

  if (eventsError) {
    console.log('   ⚠️  Could not fetch events:', eventsError.message)
  } else if (!events || events.length === 0) {
    console.log('   ℹ️  No recent automation events')
    console.log('   → This is normal if you haven\'t tested yet\n')
  } else {
    console.log(`   Found ${events.length} recent graphic.show events:\n`)
    events.forEach((event, index) => {
      const time = new Date(event.created_at).toLocaleString()
      const graphicType = event.action_data?.graphic_type || 'unknown'
      console.log(`   ${index + 1}. ${time}`)
      console.log(`      Graphic: ${graphicType}`)
      console.log(`      Trigger: ${event.trigger_type} (${event.trigger_data?.matched_keywords?.join(', ') || 'N/A'})`)
      console.log(`      Outcome: ${event.outcome}`)
      console.log(`      Confidence: ${Math.round((event.confidence || 0) * 100)}%`)
      console.log()
    })
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  if (allGood) {
    console.log('✅ ALL CHECKS PASSED!')
    console.log('\n📝 How to test:')
    console.log('   1. Start the livestream dashboard')
    console.log('   2. Enable Producer AI or Transcription Panel')
    console.log('   3. Say "production" out loud or in the chat')
    console.log('   4. The Claude Production Alert should appear!')
    console.log('\n🔧 Test manually:')
    console.log('   npm run test-claude-alert')
  } else {
    console.log('❌ SETUP INCOMPLETE')
    console.log('\n🔧 Fix issues above, then run:')
    console.log('   npm run verify-production-trigger')
  }
  console.log()
}

function getPriorityLabel(priority: number): string {
  if (priority === 0) return 'Emergency'
  if (priority <= 2) return 'Critical'
  if (priority <= 4) return 'Normal'
  return 'Background'
}

verifySetup()
