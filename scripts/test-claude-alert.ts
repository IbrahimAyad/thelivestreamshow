#!/usr/bin/env tsx

/**
 * End-to-End Test for Claude Production Alert
 * 
 * This script simulates a user saying "production" by inserting a test transcript
 * into the betabot_conversation_log table.
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

async function testClaudeAlert() {
  console.log('🧪 Testing Claude Production Alert...\n')

  // Step 1: Check if automation is enabled
  console.log('1️⃣ Checking automation config...')
  const { data: config } = await supabase
    .from('automation_config')
    .select('automation_enabled, auto_execute_enabled')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (!config) {
    console.error('❌ No automation config found')
    process.exit(1)
  }

  console.log('   Automation enabled:', config.automation_enabled ? '✅' : '❌')
  console.log('   Auto-execute enabled:', config.auto_execute_enabled ? '✅' : '❌')

  if (!config.automation_enabled) {
    console.warn('\n⚠️  WARNING: Automation is disabled!')
    console.warn('   Enable it in the dashboard before testing.')
  }

  // Step 2: Check if trigger rule exists and is enabled
  console.log('\n2️⃣ Checking trigger rule...')
  const { data: rule } = await supabase
    .from('trigger_rules')
    .select('*')
    .eq('rule_name', 'Claude Production Alert')
    .single()

  if (!rule) {
    console.error('❌ Trigger rule not found')
    process.exit(1)
  }

  console.log('   Rule enabled:', rule.enabled ? '✅' : '❌')
  console.log('   Trigger type:', rule.trigger_type)
  console.log('   Action type:', rule.action_type)
  console.log('   Keywords:', JSON.parse(JSON.stringify(rule.trigger_conditions)).keywords)

  if (!rule.enabled) {
    console.warn('\n⚠️  WARNING: Trigger rule is disabled!')
    console.warn('   Enable it before testing.')
  }

  // Step 3: Check if graphic exists
  console.log('\n3️⃣ Checking graphic registration...')
  const { data: graphic } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .eq('graphic_type', 'claude_production_alert')
    .single()

  if (!graphic) {
    console.error('❌ Graphic not found in database')
    process.exit(1)
  }

  console.log('   Graphic type:', graphic.graphic_type)
  console.log('   HTML file:', graphic.html_file)
  console.log('   Currently visible:', graphic.is_visible ? 'Yes' : 'No')

  // Step 4: Insert test transcript
  console.log('\n4️⃣ Inserting test transcript with "production" keyword...')
  const testTranscript = 'We are experiencing a production issue right now'

  const { data: inserted, error: insertError } = await supabase
    .from('betabot_conversation_log')
    .insert([{
      transcript_text: testTranscript,
      speaker_type: 'user'
    }])
    .select()
    .single()

  if (insertError) {
    console.error('❌ Failed to insert transcript:', insertError)
    process.exit(1)
  }

  console.log('   ✅ Test transcript inserted:', testTranscript)
  console.log('   Transcript ID:', inserted?.id)

  // Step 5: Wait and check for automation event
  console.log('\n5️⃣ Waiting for automation to process... (3 seconds)')
  await new Promise(resolve => setTimeout(resolve, 3000))

  const { data: events } = await supabase
    .from('automation_events')
    .select('*')
    .eq('action_type', 'graphic.show')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!events || events.length === 0) {
    console.warn('\n⚠️  No automation event found!')
    console.warn('   Possible reasons:')
    console.warn('   - Automation is disabled')
    console.warn('   - Trigger rule is disabled')
    console.warn('   - TranscriptAutomationBridge is not running')
    console.warn('   - Dashboard/app is not running')
    console.log('\n💡 Make sure the dashboard is running at http://localhost:5173/')
    process.exit(1)
  }

  const event = events[0]
  console.log('   ✅ Automation event created!')
  console.log('   Event ID:', event.id)
  console.log('   Trigger type:', event.trigger_type)
  console.log('   Action type:', event.action_type)
  console.log('   Outcome:', event.outcome)
  console.log('   Execution time:', event.execution_time_ms, 'ms')

  // Step 6: Check if graphic was shown
  console.log('\n6️⃣ Checking if graphic was shown...')
  const { data: updatedGraphic } = await supabase
    .from('broadcast_graphics')
    .select('is_visible, updated_at')
    .eq('graphic_type', 'claude_production_alert')
    .single()

  if (updatedGraphic?.is_visible) {
    console.log('   ✅ Graphic is visible!')
    console.log('   Last updated:', new Date(updatedGraphic.updated_at).toLocaleTimeString())
  } else {
    console.log('   ℹ️  Graphic is not visible (may have already auto-hidden)')
  }

  // Success summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ END-TO-END TEST COMPLETE!')
  console.log('='.repeat(60))
  console.log('\nNext steps:')
  console.log('1. Open broadcast view: http://localhost:5173/broadcast')
  console.log('2. Watch for the Claude terminal overlay to appear')
  console.log('3. It should auto-hide after 10 seconds')
  console.log('4. Check the automation feed in the dashboard')
  console.log('\nTo test live:')
  console.log('- Speak into your microphone: "We have a production issue"')
  console.log('- Or insert another test transcript using this script')
  console.log('')
}

testClaudeAlert()
