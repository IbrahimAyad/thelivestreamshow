# Database Migration Instructions

## Quick Start - Apply Migration

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project at https://app.supabase.com
   - Navigate to **SQL Editor**

2. **Copy Migration SQL**
   - Open file: `supabase/migrations/20251022_add_active_session_to_metadata.sql`
   - Copy entire contents

3. **Execute Migration**
   - Paste into SQL Editor
   - Click **Run** button
   - Verify success message

4. **Verify Migration**
   Run this query:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'show_metadata' 
     AND column_name = 'active_session_id';
   ```
   Should return 1 row showing the new column.

### Method 2: Supabase CLI

```bash
# Install CLI (if not already installed)
npm install -g supabase

# Login
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push
```

### Method 3: Using Migration Runner Script

**Prerequisites**: Add `SUPABASE_SERVICE_KEY` to `.env.local`

```bash
# Run migration script
node scripts/run-migrations.mjs
```

## Verification Steps

After applying migration, run these checks:

### 1. Check Column Exists
```sql
SELECT * FROM show_metadata LIMIT 1;
```
Verify `active_session_id` column appears.

### 2. Check Foreign Key
```sql
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'show_metadata';
```
Should show `show_metadata_active_session_fkey` constraint.

### 3. Check Index
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'show_metadata';
```
Should include `idx_show_metadata_active_session`.

## Rollback (If Needed)

If migration causes issues:

```sql
-- Remove constraint
ALTER TABLE show_metadata
DROP CONSTRAINT IF EXISTS show_metadata_active_session_fkey;

-- Remove index
DROP INDEX IF EXISTS idx_show_metadata_active_session;

-- Remove column
ALTER TABLE show_metadata
DROP COLUMN IF EXISTS active_session_id;
```

## Next Steps

After migration is applied:

1. Restart development server: `npm run dev`
2. Test the workflow (see SHOW_SESSION_FIX_IMPLEMENTATION.md)
3. Verify no orphaned sessions accumulate over time

---

**Last Updated**: October 22, 2025
