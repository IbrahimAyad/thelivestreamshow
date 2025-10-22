#!/usr/bin/env node

/**
 * Supabase Migration Runner
 *
 * Runs SQL migrations in order from supabase/migrations/
 *
 * Usage:
 *   node scripts/run-migrations.mjs
 *
 * Requirements:
 *   - VITE_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_KEY in .env.local (DO NOT use anon key!)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

// Validation
if (!SUPABASE_URL) {
  console.error('❌ Error: VITE_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY not found in .env.local');
  console.error('⚠️  Note: You need the SERVICE KEY, not the anon key!');
  process.exit(1);
}

// Initialize Supabase client with service key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create migrations tracking table if it doesn't exist
async function ensureMigrationsTable() {
  console.log('📋 Ensuring migrations tracking table exists...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  // If exec_sql function doesn't exist, create it first
  if (error && error.message.includes('function exec_sql')) {
    console.log('📝 Creating exec_sql function...');

    // We need to use the SQL API directly for this
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;

    // For now, log instructions
    console.log('⚠️  Please run this SQL in your Supabase SQL Editor:');
    console.log(createFunctionSQL);
    console.log('\nAlso run:');
    console.log(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    return false;
  }

  if (error) {
    console.error('❌ Error creating migrations table:', error);
    return false;
  }

  console.log('✅ Migrations table ready');
  return true;
}

// Get list of executed migrations
async function getExecutedMigrations() {
  const { data, error } = await supabase
    .from('_migrations')
    .select('name')
    .order('executed_at', { ascending: true });

  if (error && !error.message.includes('does not exist')) {
    console.error('❌ Error fetching executed migrations:', error);
    return [];
  }

  return data ? data.map(m => m.name) : [];
}

// Execute a migration
async function executeMigration(filename, sql) {
  console.log(`\n🔄 Running migration: ${filename}`);

  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;

    for (const statement of statements) {
      // Skip comments
      if (statement.startsWith('--')) continue;

      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        console.error(`❌ Error in statement:`, statement.substring(0, 100) + '...');
        console.error('Error details:', error);
        throw error;
      }

      successCount++;
    }

    console.log(`  ✓ Executed ${successCount} statements`);

    // Record migration as executed
    const { error: recordError } = await supabase
      .from('_migrations')
      .insert({ name: filename });

    if (recordError) {
      console.error('❌ Error recording migration:', recordError);
      throw recordError;
    }

    console.log(`✅ Migration ${filename} completed successfully`);
    return true;

  } catch (error) {
    console.error(`❌ Migration ${filename} failed:`, error);
    return false;
  }
}

// Main migration runner
async function runMigrations() {
  console.log('🚀 Starting BetaBot Database Migrations\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📁 Migrations directory: ${MIGRATIONS_DIR}\n`);

  // Ensure migrations table exists
  const tableReady = await ensureMigrationsTable();
  if (!tableReady) {
    console.log('\n⚠️  Please create the migrations table manually first.');
    console.log('Instructions have been printed above.');
    process.exit(1);
  }

  // Get list of migration files
  let migrationFiles;
  try {
    migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
  } catch (error) {
    console.error('❌ Error reading migrations directory:', error);
    process.exit(1);
  }

  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migration files found');
    process.exit(0);
  }

  console.log(`📋 Found ${migrationFiles.length} migration file(s)\n`);

  // Get executed migrations
  const executedMigrations = await getExecutedMigrations();
  console.log(`✅ Already executed: ${executedMigrations.length} migration(s)\n`);

  // Filter out already executed
  const pendingMigrations = migrationFiles.filter(
    f => !executedMigrations.includes(f)
  );

  if (pendingMigrations.length === 0) {
    console.log('✅ All migrations up to date!');
    process.exit(0);
  }

  console.log(`🔄 Pending migrations: ${pendingMigrations.length}\n`);

  // Execute pending migrations
  let successCount = 0;

  for (const filename of pendingMigrations) {
    const filepath = join(MIGRATIONS_DIR, filename);
    const sql = readFileSync(filepath, 'utf-8');

    const success = await executeMigration(filename, sql);

    if (success) {
      successCount++;
    } else {
      console.log('\n❌ Migration failed. Stopping execution.');
      break;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Successfully executed ${successCount}/${pendingMigrations.length} migrations`);
  console.log(`${'='.repeat(60)}\n`);

  if (successCount < pendingMigrations.length) {
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
