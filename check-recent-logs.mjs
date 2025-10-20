#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('📊 AI Coordinator Logs - Recent Activity\n')

const { data: logs, error } = await supabase
  .from('ai_coordinator_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.log('❌ Error querying logs:', error.message)
  process.exit(1)
}

console.log(`Found ${logs.length} log entries:\n`)

if (logs.length === 0) {
  console.log('⚠️ No logs yet - AI Coordinator hasn\'t logged any events from the app')
  console.log('This is expected if you haven\'t triggered any AI actions yet.')
  console.log('\nTo generate logs, try:')
  console.log('  1. Use Producer AI to generate questions')
  console.log('  2. Change BetaBot mood from Director Panel')
  console.log('  3. Use Context Analyzer to suggest actions')
} else {
  logs.forEach((log, i) => {
    console.log(`${i + 1}. ${log.event_type}`)
    console.log(`   Created: ${log.created_at}`)
    console.log(`   Data: ${JSON.stringify(log.event_data, null, 2)}`)
    console.log('')
  })
}

// Check for specific event types
const eventTypes = [...new Set(logs.map(l => l.event_type))]
console.log('\n📈 Event Type Summary:')
eventTypes.forEach(type => {
  const count = logs.filter(l => l.event_type === type).length
  console.log(`  ${type}: ${count}`)
})
