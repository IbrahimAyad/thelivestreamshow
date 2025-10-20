#!/usr/bin/env node

/**
 * BetaBot Mood System - Database Setup Script
 *
 * This script creates the betabot_mood table required for the theatrical mood system.
 * Run this once to set up the database, then use the BetaBot Director Controls panel.
 */

console.log('\n🎬 BetaBot Mood System - Database Setup\n');
console.log('=' .repeat(60));
console.log('\nThis will create the betabot_mood table in your Supabase database.\n');

console.log('📋 To set up the database, follow these steps:\n');
console.log('1. Go to your Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql\n');
console.log('2. Click "New Query"\n');
console.log('3. Copy and paste the following SQL:\n');
console.log('─'.repeat(60));

const sql = `-- Create betabot_mood table for controlling BetaBot's theatrical personality
CREATE TABLE IF NOT EXISTS betabot_mood (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood TEXT NOT NULL DEFAULT 'neutral' CHECK (mood IN ('neutral', 'bored', 'amused', 'spicy')),
  show_incoming BOOLEAN DEFAULT false,
  incoming_count INTEGER DEFAULT 0 CHECK (incoming_count >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_betabot_mood_updated
  ON betabot_mood(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE betabot_mood ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read mood
CREATE POLICY "Allow authenticated users to read mood"
  ON betabot_mood FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update mood
CREATE POLICY "Allow authenticated users to update mood"
  ON betabot_mood FOR UPDATE
  TO authenticated
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_mood;

-- Insert default row for initial state
INSERT INTO betabot_mood (mood, show_incoming, incoming_count)
VALUES ('neutral', false, 0)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE betabot_mood IS 'Controls BetaBot avatar mood and incoming question indicator for theatrical show direction';`;

console.log(sql);
console.log('─'.repeat(60));

console.log('\n4. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)\n');
console.log('5. Verify it says "Success. No rows returned."\n');
console.log('✅ Once complete, your BetaBot Director Controls will be fully functional!\n');
console.log('=' .repeat(60));
console.log('\n💡 The table has also been saved to: supabase-migrations/create-betabot-mood-table.sql\n');
