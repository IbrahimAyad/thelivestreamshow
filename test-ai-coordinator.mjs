#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testing AI Coordinator Logs Table...\n')

// Test 1: Check if table exists by querying it
console.log('Test 1: Checking if ai_coordinator_logs table exists...')
const { data: existingLogs, error: queryError } = await supabase
  .from('ai_coordinator_logs')
  .select('*')
  .limit(5)

if (queryError) {
  console.log('❌ Table does not exist or cannot be accessed')
  console.log('Error:', queryError.message)
  process.exit(1)
} else {
  console.log('✅ Table exists and is accessible')
  console.log(`Found ${existingLogs.length} existing log entries\n`)
}

// Test 2: Try to insert a test log entry
console.log('Test 2: Inserting test log entry...')
const testLog = {
  event_type: 'test_event',
  event_data: {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'AI Coordinator integration test'
  }
}

const { data: insertData, error: insertError } = await supabase
  .from('ai_coordinator_logs')
  .insert(testLog)
  .select()

if (insertError) {
  console.log('❌ Failed to insert test log')
  console.log('Error:', insertError.message)
} else {
  console.log('✅ Successfully inserted test log')
  console.log('Inserted data:', JSON.stringify(insertData, null, 2))
}

// Test 3: Query the test log we just inserted
console.log('\nTest 3: Querying recent logs...')
const { data: recentLogs, error: recentError } = await supabase
  .from('ai_coordinator_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(3)

if (recentError) {
  console.log('❌ Failed to query recent logs')
  console.log('Error:', recentError.message)
} else {
  console.log('✅ Successfully queried recent logs')
  console.log(`Found ${recentLogs.length} recent log entries:`)
  recentLogs.forEach((log, i) => {
    console.log(`\n  ${i + 1}. Event: ${log.event_type}`)
    console.log(`     Created: ${log.created_at}`)
    console.log(`     Data: ${JSON.stringify(log.event_data)}`)
  })
}

if (insertError) {
  console.log('\n❌ TESTS FAILED')
  console.log('⚠️ RLS policy blocking INSERT for anon role')
  console.log('\nTo fix, run this SQL in Supabase Dashboard:')
  console.log('--------------------------------------------')
  console.log('CREATE POLICY "Anon can insert ai_coordinator_logs"')
  console.log('  ON ai_coordinator_logs FOR INSERT TO anon')
  console.log('  WITH CHECK (true);')
  console.log('')
  console.log('GRANT INSERT ON ai_coordinator_logs TO anon;')
  console.log('--------------------------------------------')
  process.exit(1)
} else {
  console.log('\n✅ All tests passed! AI Coordinator Logs table is working correctly.')
}
