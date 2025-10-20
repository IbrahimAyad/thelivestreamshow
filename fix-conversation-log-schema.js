#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMyNDUxOCwiZXhwIjoyMDc1OTAwNTE4fQ.1YiKcY6XzT50uYq2P3p8-3luR5vF4NNFC_pPXhy6Ku8'

const supabase = createClient(supabaseUrl, serviceKey)

console.log('\n🔧 Fixing betabot_conversation_log Schema\n')
console.log('=' .repeat(60))

async function fixSchema() {
  // Check current schema by querying table
  console.log('📊 Checking current schema...')
  const { data: sample, error } = await supabase
    .from('betabot_conversation_log')
    .select('*')
    .limit(1)

  if (error && error.message.includes('does not exist')) {
    console.log('❌ Table does not exist yet')
    console.log('\n📋 Please run the migration via Supabase SQL Editor:')
    console.log('   supabase/migrations/20250101000013_betabot_tables.sql\n')
    return
  }

  if (sample && sample.length > 0) {
    console.log('✅ Current columns:', Object.keys(sample[0]).join(', '))
  } else {
    console.log('✅ Table exists (empty)')
  }

  console.log('\n📋 To add missing created_at column, execute this SQL in Supabase SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql\n')
  console.log('=' .repeat(60))
  console.log(`
-- Add created_at column to betabot_conversation_log
ALTER TABLE betabot_conversation_log
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_betabot_conversation_log_created
  ON betabot_conversation_log(created_at DESC);

-- Enable realtime if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_conversation_log;
`)
  console.log('=' .repeat(60))
  console.log('\nCopy the SQL above and run it in Supabase SQL Editor.')
  console.log('This will fix the Producer AI 400 errors.\n')
}

fixSchema()
