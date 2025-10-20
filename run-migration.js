import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('📊 Reading migration file...')
    const sql = readFileSync('./supabase/migrations/20250101000012_automation_config.sql', 'utf-8')

    console.log('🚀 Executing migration via RPC...')

    // We need to execute this as raw SQL
    // Since we can't execute DDL directly via REST API, let's create the table via individual operations

    // First, check if table exists
    const { data: existing, error: checkError } = await supabase
      .from('automation_config')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ automation_config table already exists!')

      // Check if default row exists
      const { data: defaultRow, error: defaultError } = await supabase
        .from('automation_config')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

      if (defaultError) {
        console.log('⚠️  Default config row missing, this needs to be added via SQL Editor in Supabase Dashboard')
      } else {
        console.log('✅ Default config row exists:', defaultRow)
      }

      return
    }

    console.log('❌ Table does not exist. Need to create it via Supabase Dashboard SQL Editor.')
    console.log('\n📋 Instructions:')
    console.log('1. Go to: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql')
    console.log('2. Click "New Query"')
    console.log('3. Copy and paste the contents of:')
    console.log('   supabase/migrations/20250101000012_automation_config.sql')
    console.log('4. Click "Run" or press Cmd+Enter')
    console.log('\nThe SQL file is here: ./supabase/migrations/20250101000012_automation_config.sql')

  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

runMigration()
