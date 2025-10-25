# Storage Diagnostic Guide

## Quick Diagnosis (Copy-Paste for Support)

### 1. Open Browser DevTools Console

Look for the startup logs:

```
[SUPABASE] ✓ Client initialized
[SUPABASE] URL: https://vcniezwtltraqramjlux.supabase.co
[SUPABASE] PROJ REF: vcniezwtltraqramjlux
[SUPABASE] MUSIC BUCKET: music
```

**Sanity Check:**
- Does the project ref match your Supabase Studio project? ✓ / ✗
- Is this the project where your music files are stored? ✓ / ✗

---

### 2. Wait for Storage Audit

The app will automatically audit on load (dev mode). Look for:

```
[DEBUG STORAGE] ========== AUDIT START ==========
[DEBUG STORAGE] Found X files in storage
[DEBUG STORAGE] Sample storage keys (first 30):
  - 1760924424753_14._Jimmy_Cooks.mp3
  - 1761162684068_Mansionair___Lose_Yourself...mp3
  ...
[DEBUG STORAGE] ✓ Matches: Y
[DEBUG STORAGE] ❌ Mismatches: Z
```

**Fill out the Sanity Matrix:**

| Expectation | Actual |
|-------------|--------|
| Runtime Supabase REF = vcniezwtltraqramjlux | _______ |
| music bucket contains files (debug list) | _______ files |
| Example real key from Studio | ________________.mp3 |
| track.path for that item in DB | ________________.mp3 |
| Do they match EXACTLY? | ✓ / ✗ |

---

### 3. Manual Testing via Console

Use the global debug tools:

```javascript
// List all files in music bucket
const files = await window.__MUSIC_STORAGE_DEBUG__.listAll()
console.log('All files:', files)

// Test a specific key (copy from Supabase Studio)
const exists = await window.__MUSIC_STORAGE_DEBUG__.testKey('1760924424753_14._Jimmy_Cooks.mp3')
console.log('Key exists:', exists)

// Test signed URL creation
const url = await window.__MUSIC_STORAGE_DEBUG__.testUrl('1760924424753_14._Jimmy_Cooks.mp3')
console.log('Signed URL:', url)

// Re-run full audit
await window.__MUSIC_STORAGE_DEBUG__.audit()
```

---

### 4. Common Issues & Fixes

#### Issue 1: "Available files: (none)"
**Cause:** Wrong bucket name or empty bucket  
**Fix:** 
- Check Supabase Studio → Storage → `music` bucket exists
- Verify files are in `music` bucket (not `music-audio`)
- If files are elsewhere, either migrate them or update bucket name in code

#### Issue 2: Mismatches between DB path and Storage key
**Cause:** Paths stored incorrectly in DB  
**Examples:**
- DB: `14._Jimmy_Cooks.mp3` → Storage: `1760924424753_14._Jimmy_Cooks.mp3`
- DB: `uploads/song.mp3` → Storage: `song.mp3` (or vice versa)
- DB: `Song Name.mp3` → Storage: `Song_Name.mp3`

**Fix:**
- Copy exact key from Supabase Studio (Storage browser)
- Update `music_library.file_path` in DB to match exactly:
  ```sql
  UPDATE music_library 
  SET file_path = '1760924424753_14._Jimmy_Cooks.mp3' 
  WHERE id = 'track-id-here';
  ```

#### Issue 3: Files in subdirectories
**Cause:** Files stored in `uploads/` or other subfolder  
**Example:**
- Storage key: `uploads/1760924424753_song.mp3`
- DB path: `1760924424753_song.mp3` (missing prefix)

**Fix:**
- Include full path in DB: `uploads/1760924424753_song.mp3`
- OR ensure upload code stores files at root (no prefix)

#### Issue 4: Wrong Supabase project
**Cause:** Multiple projects, pointed at wrong one  
**Fix:**
- Verify `.env.local` VITE_SUPABASE_URL matches project in Supabase Studio
- Check browser console startup logs for project ref
- If wrong, update `.env.local` and restart dev server

---

### 5. Verification Steps

Once you've identified the issue:

1. **Get a known-good key from Supabase Studio:**
   - Go to Supabase Studio → Storage → `music` bucket
   - Click on a file
   - Copy the **exact** key (e.g., `1760924424753_14._Jimmy_Cooks.mp3`)

2. **Update one track in DB to use exact key:**
   ```sql
   UPDATE music_library 
   SET file_path = '1760924424753_14._Jimmy_Cooks.mp3'
   WHERE title ILIKE '%Jimmy Cooks%';
   ```

3. **Test playback:**
   - Refresh app
   - Find that track in Studio → Music Library
   - Click to play
   - **Expected:** Music plays, no "Object not found" error

4. **If successful, fix remaining tracks:**
   - Option A: Bulk update script (match by title/artist)
   - Option B: Re-upload tracks (stores correct keys automatically)
   - Option C: Manual updates via SQL

---

### 6. Prevention (For Future Uploads)

Ensure upload code stores the **exact key returned by Supabase:**

```typescript
// ✓ CORRECT
const { data, error } = await supabase.storage
  .from('music')
  .upload(filename, file)

if (data?.path) {
  // Store data.path in DB (this is the actual key)
  await supabase.from('music_library').insert({
    file_path: data.path,  // Use exact path from Supabase
    ...
  })
}

// ✗ WRONG
const filename = `${Date.now()}_${file.name}`
await supabase.storage.from('music').upload(filename, file)
await supabase.from('music_library').insert({
  file_path: filename,  // This might not match actual storage key
  ...
})
```

---

## Debug Checklist (Step by Step)

- [ ] Browser console shows Supabase project ref: `vcniezwtltraqramjlux`
- [ ] Matches the project where music files are in Supabase Studio
- [ ] Storage audit shows files (count > 0)
- [ ] Sample storage keys logged (30 examples)
- [ ] Copy one exact key from console
- [ ] Verify that key exists in Supabase Studio
- [ ] Check if any DB `file_path` matches exactly
- [ ] If no matches, identify the pattern difference:
  - [ ] Missing timestamp prefix?
  - [ ] Missing/extra subfolder?
  - [ ] Spaces vs underscores?
  - [ ] Different file extension?
- [ ] Update one DB record to match exact key
- [ ] Test playback of that track
- [ ] If successful, apply pattern to all tracks
- [ ] Re-run audit to verify all matches

---

## Console Commands Reference

```javascript
// List all files in storage
await window.__MUSIC_STORAGE_DEBUG__.listAll()

// Test specific key
await window.__MUSIC_STORAGE_DEBUG__.testKey('your-file-key.mp3')

// Test signed URL
await window.__MUSIC_STORAGE_DEBUG__.testUrl('your-file-key.mp3')

// Full audit
await window.__MUSIC_STORAGE_DEBUG__.audit()

// Get tracks from DB
const { data } = await supabase.from('music_library').select('id, title, file_path').limit(10)
console.table(data)

// Test direct download
const { data, error } = await supabase.storage.from('music').download('your-file-key.mp3')
console.log('Download test:', { data, error })
```

---

## Support Template

If you need help, copy and fill this template:

```
**Supabase Project Ref:** vcniezwtltraqramjlux (from console)
**Matches expected project:** ✓ / ✗

**Storage audit results:**
- Files in bucket: X
- Sample keys (paste 5-10 examples from console)

**Database sample:**
- DB file_path examples (paste 5 from `music_library` table)

**Mismatch pattern identified:**
- Storage: 1760924424753_14._Jimmy_Cooks.mp3
- DB: __________________ (paste actual DB value)

**Error message (if any):**
```

---

**Last Updated:** 2025-10-23  
**Related Files:** 
- `src/utils/debugStorage.ts` - Debug utilities
- `src/lib/supabase.ts` - Client initialization with logging
- `src/contexts/MusicProvider.tsx` - Auto-runs audit on load
