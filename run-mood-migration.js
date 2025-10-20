import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('ERROR: VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL migration file
const sqlFile = join(__dirname, 'supabase-migrations', 'create-betabot-mood-table.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('🎬 Running BetaBot Mood System Migration...\n');
console.log('SQL to execute:');
console.log('─'.repeat(60));
console.log(sql);
console.log('─'.repeat(60));
console.log('\n');

// Execute the SQL
const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\n📝 Note: You may need to run this SQL manually in the Supabase SQL Editor:');
  console.log('   1. Go to https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql');
  console.log('   2. Copy the SQL from: supabase-migrations/create-betabot-mood-table.sql');
  console.log('   3. Paste and run it\n');
  process.exit(1);
} else {
  console.log('✅ Migration completed successfully!');
  console.log('🎭 BetaBot Mood System database table created');
  console.log('🚀 You can now use the BetaBot Director Controls panel\n');
}
