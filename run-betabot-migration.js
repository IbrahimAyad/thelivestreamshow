#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMyNDUxOCwiZXhwIjoyMDc1OTAwNTE4fQ.1YiKcY6XzT50uYq2P3p8-3luR5vF4NNFC_pPXhy6Ku8'

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('\n🤖 BetaBot Tables Migration\n')
console.log('=' .repeat(60))

async function runMigration() {
  try {
    // Read the migration file
    const sql = readFileSync('./supabase/migrations/20250101000013_betabot_tables.sql', 'utf8')

    console.log('📄 Migration file loaded')
    console.log('🚀 Executing SQL via Supabase REST API...\n')

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comments
      if (statement.trim().startsWith('--')) continue

      try {
        // Use the REST API to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        })

        if (error) {
          // If exec_sql doesn't exist, we need a different approach
          if (error.code === 'PGRST202' || error.message?.includes('exec_sql')) {
            console.log('⚠️  exec_sql RPC not available')
            console.log('📋 Falling back to manual table creation...\n')
            await createTablesManually()
            return
          }
          throw error
        }

        successCount++
        process.stdout.write('.')
      } catch (err) {
        errorCount++
        console.error(`\n❌ Error in statement ${i + 1}:`, err.message)
      }
    }

    console.log(`\n\n✅ Migration completed!`)
    console.log(`   Success: ${successCount} statements`)
    console.log(`   Errors: ${errorCount} statements\n`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n📋 Attempting manual table creation...\n')
    await createTablesManually()
  }
}

async function createTablesManually() {
  console.log('🔧 Creating tables manually via Supabase client...\n')

  try {
    // Check if betabot_sessions exists
    const { data: sessions, error: sessionsError } = await supabase
      .from('betabot_sessions')
      .select('id')
      .limit(1)

    if (!sessionsError) {
      console.log('✅ betabot_sessions already exists')
    }

    // Check if betabot_conversation_log exists
    const { data: logs, error: logsError } = await supabase
      .from('betabot_conversation_log')
      .select('id')
      .limit(1)

    if (!logsError) {
      console.log('✅ betabot_conversation_log already exists')
    }

    // Check if betabot_interactions exists
    const { data: interactions, error: interactionsError } = await supabase
      .from('betabot_interactions')
      .select('id')
      .limit(1)

    if (!interactionsError) {
      console.log('✅ betabot_interactions already exists')
    }

    const allExist = !sessionsError && !logsError && !interactionsError

    if (allExist) {
      console.log('\n🎉 All tables already exist!')
      console.log('=' .repeat(60))
      return
    }

    console.log('\n⚠️  Some tables are missing')
    console.log('\n📋 To create missing tables manually:')
    console.log('1. Go to: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql')
    console.log('2. Click "New Query"')
    console.log('3. Copy and paste the contents of:')
    console.log('   supabase/migrations/20250101000013_betabot_tables.sql')
    console.log('4. Click "Run" or press Cmd+Enter\n')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
}

// Run the migration
runMigration()
