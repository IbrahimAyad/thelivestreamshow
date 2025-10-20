#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ ERROR: VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL migration file
const sql = readFileSync('./supabase/migrations/20250101000012_automation_config.sql', 'utf8');

console.log('\n🤖 Auto-Director Automation Config - Database Setup\n');
console.log('=' .repeat(60));
console.log('\n🚀 Executing migration...\n');

// Try using the exec_sql RPC function
const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('❌ RPC exec_sql not available. Falling back to manual instructions...\n');

  console.log('📋 To set up the database, follow these steps:\n');
  console.log('1. Go to your Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql\n');
  console.log('2. Click "New Query"\n');
  console.log('3. Copy and paste the following SQL:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n4. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)\n');
  console.log('✅ Once complete, your Auto-Director panel will be fully functional!\n');
  console.log('=' .repeat(60));
} else {
  console.log('✅ Migration completed successfully!');
  console.log('🤖 automation_config table created');
  console.log('🚀 Auto-Director panel is now ready to use\n');
  console.log('=' .repeat(60));
}
