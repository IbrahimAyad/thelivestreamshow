#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking Database Policies for ai_coordinator_logs\n')

// Query to check policies via a test query
const { data, error } = await supabase.rpc('check_policies', {
  table_name: 'ai_coordinator_logs'
}).single()

if (error) {
  console.log('⚠️ Cannot query policies directly (expected)\n')
}

// Alternative: Try to check table_privileges
console.log('Checking table privileges...')
const { data: privData, error: privError } = await supabase
  .from('information_schema.table_privileges')
  .select('*')
  .eq('table_name', 'ai_coordinator_logs')

if (privError) {
  console.log('❌ Cannot access privilege info:', privError.message)
} else {
  console.log('✅ Privileges found:', privData)
}

// Most important: Test if INSERT actually works
console.log('\n🧪 Direct INSERT Test...')
const { data: insertData, error: insertError } = await supabase
  .from('ai_coordinator_logs')
  .insert({
    event_type: 'diagnostic_test',
    event_data: {
      timestamp: new Date().toISOString(),
      test: 'checking if anon can insert'
    }
  })
  .select()

if (insertError) {
  console.log('❌ INSERT FAILED')
  console.log('Error:', insertError.message)
  console.log('Code:', insertError.code)
  console.log('Details:', insertError.details)
  console.log('Hint:', insertError.hint)
  console.log('\n🚨 CONCLUSION: The anon INSERT policy is NOT applied to the database')
  process.exit(1)
} else {
  console.log('✅ INSERT SUCCESSFUL!')
  console.log('Inserted row:', insertData)
  console.log('\n🎉 CONCLUSION: The anon INSERT policy IS working!')
  process.exit(0)
}
