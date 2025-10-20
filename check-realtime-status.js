#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMyNDUxOCwiZXhwIjoyMDc1OTAwNTE4fQ.1YiKcY6XzT50uYq2P3p8-3luR5vF4NNFC_pPXhy6Ku8'

const supabase = createClient(supabaseUrl, serviceKey)

console.log('\n🔍 Checking Realtime Status for show_metadata Table\n')
console.log('=' .repeat(60))

async function checkRealtimeStatus() {
  console.log('\n📋 To check and enable realtime, execute this SQL:\n')
  console.log('=' .repeat(60))
  console.log(`
-- Check if show_metadata is in realtime publication
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename = 'show_metadata';

-- If the above returns no rows, run this to enable realtime:
ALTER PUBLICATION supabase_realtime ADD TABLE show_metadata;

-- Verify it was added:
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
ORDER BY tablename;
`)
  console.log('=' .repeat(60))
  console.log('\n📋 Instructions:')
  console.log('1. Go to: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql')
  console.log('2. Click "New Query"')
  console.log('3. Copy and paste the SQL above')
  console.log('4. Click "Run"')
  console.log('\nThis will ensure the broadcast overlay receives realtime updates.\n')
}

checkRealtimeStatus()
