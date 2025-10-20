#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMyNDUxOCwiZXhwIjoyMDc1OTAwNTE4fQ.1YiKcY6XzT50uYq2P3p8-3luR5vF4NNFC_pPXhy6Ku8'

const supabase = createClient(supabaseUrl, serviceKey)

console.log('\n🔍 Verifying BetaBot Tables Schema\n')
console.log('=' .repeat(60))

async function verifyTables() {
  // Test betabot_sessions
  console.log('\n📊 Testing betabot_sessions...')
  const { data: sessions, error: sessionsError } = await supabase
    .from('betabot_sessions')
    .select('*')
    .limit(1)

  if (sessionsError) {
    console.log('❌ Error:', sessionsError.message)
  } else {
    console.log('✅ betabot_sessions accessible')
    if (sessions && sessions.length > 0) {
      console.log('   Sample row:', Object.keys(sessions[0]).join(', '))
    } else {
      console.log('   (Empty table - ready for data)')
    }
  }

  // Test betabot_conversation_log
  console.log('\n📊 Testing betabot_conversation_log...')
  const { data: logs, error: logsError } = await supabase
    .from('betabot_conversation_log')
    .select('id, transcript_text, created_at')
    .gte('created_at', new Date(Date.now() - 3 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (logsError) {
    console.log('❌ Error:', logsError.message)
    console.log('   Code:', logsError.code)
    console.log('   Details:', logsError.details)
  } else {
    console.log('✅ betabot_conversation_log accessible')
    console.log(`   Found ${logs?.length || 0} recent logs`)
    if (logs && logs.length > 0) {
      console.log('   Columns:', Object.keys(logs[0]).join(', '))
    } else {
      console.log('   (Empty table - ready for data)')
    }
  }

  // Test betabot_interactions
  console.log('\n📊 Testing betabot_interactions...')
  const { data: interactions, error: interactionsError } = await supabase
    .from('betabot_interactions')
    .select('*')
    .limit(1)

  if (interactionsError) {
    console.log('❌ Error:', interactionsError.message)
  } else {
    console.log('✅ betabot_interactions accessible')
    if (interactions && interactions.length > 0) {
      console.log('   Sample row:', Object.keys(interactions[0]).join(', '))
    } else {
      console.log('   (Empty table - ready for data)')
    }
  }

  // Test insert to betabot_conversation_log (Producer AI use case)
  console.log('\n📝 Testing insert to betabot_conversation_log...')
  const { data: insertTest, error: insertError } = await supabase
    .from('betabot_conversation_log')
    .insert({
      transcript_text: 'Test transcript from verification script',
      speaker_type: 'system'
    })
    .select()

  if (insertError) {
    console.log('❌ Insert failed:', insertError.message)
    console.log('   This means Producer AI will fail to log transcripts')
  } else {
    console.log('✅ Insert successful - Producer AI will work!')
    console.log('   Inserted ID:', insertTest[0]?.id)

    // Clean up test data
    if (insertTest[0]?.id) {
      await supabase
        .from('betabot_conversation_log')
        .delete()
        .eq('id', insertTest[0].id)
      console.log('   (Test data cleaned up)')
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('\n✅ Verification complete!\n')
}

verifyTables()
