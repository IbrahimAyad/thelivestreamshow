# Minimax: Create BetaBot Mood Table in Supabase

## Task Overview
Create a new database table called `betabot_mood` in our Supabase project to enable the BetaBot theatrical mood system for our livestream show.

## Supabase Project Details
- **Project URL**: https://vcniezwtltraqramjlux.supabase.co
- **Project Reference**: vcniezwtltraqramjlux
- **SQL Editor URL**: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql

## What This Table Does
This table stores the current mood state of our AI co-host "BetaBot" during live shows. The show operator can manually trigger different moods (neutral, bored, amused, spicy) to make BetaBot act like a theatrical character with personality. It also controls an "incoming question" indicator.

## Step-by-Step Instructions

### Step 1: Navigate to Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql
2. Click the "+ New Query" button in the top left

### Step 2: Copy and Execute This SQL
Copy the ENTIRE SQL script below and paste it into the SQL editor:

```sql
-- Create betabot_mood table for controlling BetaBot's theatrical personality
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
COMMENT ON TABLE betabot_mood IS 'Controls BetaBot avatar mood and incoming question indicator for theatrical show direction';
```

### Step 3: Run the SQL
1. After pasting the SQL, click the "RUN" button in the bottom right
2. Or press `Cmd + Enter` (Mac) or `Ctrl + Enter` (Windows)

### Step 4: Verify Success
You should see a success message that says:
- "Success. No rows returned" OR
- A success indicator with the executed statements

### Step 5: Verify Table Creation
1. Go to the Table Editor: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/editor
2. Look for a table called `betabot_mood` in the left sidebar
3. Click on it to verify it has these columns:
   - `id` (uuid, primary key)
   - `mood` (text)
   - `show_incoming` (boolean)
   - `incoming_count` (integer)
   - `updated_at` (timestamptz)
4. Verify there is 1 row with default values:
   - mood: 'neutral'
   - show_incoming: false
   - incoming_count: 0

## What Gets Created

### Table Schema
- **Table Name**: `betabot_mood`
- **Columns**:
  - `id`: UUID (auto-generated primary key)
  - `mood`: TEXT (restricted to: 'neutral', 'bored', 'amused', 'spicy')
  - `show_incoming`: BOOLEAN (shows/hides incoming question indicator)
  - `incoming_count`: INTEGER (number of incoming questions, minimum 0)
  - `updated_at`: TIMESTAMPTZ (timestamp of last update)

### Security Policies
- Authenticated users can SELECT (read) from the table
- Authenticated users can UPDATE the table
- Row Level Security is enabled

### Real-time Features
- Table is added to realtime publication for live updates

### Initial Data
- One default row is inserted with neutral mood and no incoming questions

## Expected Outcome
After successful execution, the BetaBot Director Controls panel in our livestream dashboard will be able to:
1. Switch between 4 different moods (neutral, bored, amused, spicy)
2. Toggle the incoming question indicator on/off
3. Adjust the incoming question count
4. All changes will appear in real-time on the broadcast overlay

## Troubleshooting

### If you see "permission denied" errors:
- Make sure you're logged into the correct Supabase account
- Verify you have owner/admin permissions on project `vcniezwtltraqramjlux`

### If you see "table already exists":
- That's okay! The SQL uses `IF NOT EXISTS` so it won't error
- Just verify the table structure matches the schema above

### If you see "policy already exists":
- That's normal if running the script multiple times
- The script is idempotent (safe to run multiple times)

## Confirmation
After completing this task, please confirm:
1. ✅ Table `betabot_mood` exists in the database
2. ✅ Table has correct columns and data types
3. ✅ One default row exists with mood='neutral'
4. ✅ Realtime is enabled for the table
5. ✅ RLS policies are created

## Files Referenced
- SQL Migration: `/supabase-migrations/create-betabot-mood-table.sql`
- Setup Script: `/setup-betabot-mood-table.js`

---

**Note**: This is a one-time setup. Once the table is created, the BetaBot mood system will be fully functional and the show operator can start using the theatrical controls during livestreams.
