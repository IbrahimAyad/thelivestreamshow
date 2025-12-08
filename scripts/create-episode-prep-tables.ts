#!/usr/bin/env npx tsx

/**
 * Create Episode Prep System Tables
 * Run this script to set up the database schema for AI-powered episode preparation
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQL() {
  console.log('📊 Creating Episode Prep System tables...\n')

  const sqlPath = path.join(process.cwd(), 'CREATE_EPISODE_PREP_TABLES.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  // Split SQL into individual statements (handle postgres-specific syntax)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip comment-only statements
    if (statement.trim().startsWith('--')) {
      continue
    }

    // Extract statement type for logging
    const firstLine = statement.split('\n')[0]
    const match = firstLine.match(/^(CREATE|ALTER|SELECT|INSERT|DROP|COMMENT)/i)
    const statementType = match ? match[1].toUpperCase() : 'EXEC'

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // Some statements might fail if tables already exist - that's OK
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist')
        ) {
          console.log(`⚠️  ${statementType} - Already exists (skipping)`)
        } else {
          console.error(`❌ ${statementType} failed:`, error.message)
          errorCount++
        }
      } else {
        console.log(`✅ ${statementType}`)
        successCount++
      }
    } catch (err: any) {
      console.error(`❌ Error executing statement ${i + 1}:`, err.message)
      errorCount++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Completed: ${successCount} statements`)
  if (errorCount > 0) {
    console.log(`⚠️  Errors: ${errorCount} statements`)
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // Verify tables were created
  console.log('🔍 Verifying tables...\n')

  const tables = [
    'episode_scripts',
    'episode_segments',
    'episode_ai_content',
    'episode_templates',
    'episode_prep_progress'
  ]

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ ${table} - ${error.message}`)
    } else {
      console.log(`✅ ${table} - Ready`)
    }
  }

  console.log('\n🚀 Episode Prep System database setup complete!')
}

runSQL().catch(console.error)
