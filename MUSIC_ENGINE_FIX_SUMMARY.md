# Music Engine Fix Summary

## ✅ Issues Fixed

### 1. **Bucket Mismatch** (PRIMARY ISSUE)
**Problem:** Upload logic stored files in `music-audio` bucket, but playback looked in `music` bucket.

**Fix:**
- Updated [`useMusicLibrary.ts`](src/hooks/studio/useMusicLibrary.ts) to upload to `music` bucket
- Ensured database stores the **actual path returned by Supabase** (not reconstructed)
- All operations now use consistent bucket name: `music`

**Files Changed:**
- `src/hooks/studio/useMusicLibrary.ts` - Upload, delete, and public URL operations

---

### 2. **Duplicate Supabase Clients** (GOTURE WARNING)
**Problem:** Multiple `createClient()` calls created duplicate GoTrueClient instances, causing console warnings.

**Fix:**
- Removed duplicate client creation in [`AuthContext.tsx`](src/contexts/AuthContext.tsx)
- Removed duplicate client creation in [`ShowPlanSelector.tsx`](src/components/ShowPlanSelector.tsx)
- All components now import from singleton: `import { supabase } from '@/lib/supabase'`

**Files Changed:**
- `src/contexts/AuthContext.tsx` - Now imports singleton
- `src/components/ShowPlanSelector.tsx` - Now imports singleton

**Remaining Duplicates:**
- Scripts in `/scripts` folder create their own clients (expected for CLI tools)
- AI system classes in `/src/lib/ai` create clients (may need refactoring separately)

---

### 3. **Path Normalization & Validation**
**Problem:** Paths stored in DB didn't match Storage keys due to inconsistent formatting.

**Fix:**
- Created [`storagePath.ts`](src/utils/storagePath.ts) utility with canonical normalization rules
- Added **storage existence check** before requesting signed URLs (prevents 400 errors)
- Enhanced error messages to show exact storage keys searched and available files

**Files Changed:**
- `src/utils/storagePath.ts` - **NEW** - Path normalization utilities
- `src/contexts/MusicProvider.tsx` - Uses normalization and existence checking

**Rules Applied (matches upload logic):**
```typescript
// 1. Remove leading slashes
// 2. Collapse spaces → underscores
// 3. Only allow [a-zA-Z0-9._-]
// 4. Prevent undefined/null paths
```

---

### 4. **AudioContext Ready State**
**Problem:** EQ panel rendered before AudioContext initialized, causing warnings.

**Fix:**
- Added `ready: boolean` flag to MusicProvider context
- EQ panel now waits for `ready === true` before rendering
- Shows "EQ initializing..." placeholder while waiting

**Files Changed:**
- `src/contexts/MusicProvider.tsx` - Added `ready` flag
- `src/components/studio/EQPanel.tsx` - Added ready guard

---

### 5. **Enhanced Error Reporting**
**Problem:** Generic "Object not found" errors didn't explain what was wrong.

**Fix:**
- Detailed logging in `MusicProvider.loadTrack()` shows:
  - Track ID, title, raw path
  - Normalized path
  - Bucket and folder searched
  - Available files when not found
- Error messages now actionable: `Storage key missing: bucket=music, path=song.mp3`

**Files Changed:**
- `src/contexts/MusicProvider.tsx` - Enhanced logging throughout

---

## 🧪 Testing Your Fix

### Test 1: Upload & Play New Track
1. Go to **Studio** tab → Music Library
2. Upload a new audio file (e.g., `test-song.mp3`)
3. **Check console logs:**
   - Should see: `[useMusicLibrary] File uploaded to storage: {timestamp}_test_song.mp3`
4. Click the track in the library
5. **Expected:** Music plays immediately across all tabs (Studio/Dashboard/Media)

### Test 2: Verify Known Files
1. Open Supabase Studio → Storage → `music` bucket
2. Copy an exact file path (e.g., `1760924424753_song.mp3`)
3. In browser DevTools console, test the path:
```javascript
const { data, error } = await supabase.storage.from('music').list('', { limit: 1000 })
console.log('Files in music bucket:', data?.map(f => f.name))
```
4. Find a file that exists and try playing it

### Test 3: Bad Path Handling
1. Manually set a track path to invalid value (e.g., via DB update)
2. Try to play the track
3. **Expected:** Clear error message in console showing:
   - File searched: `{filename}`
   - Folder searched: `{folder}`
   - Available files: `{list}`

### Test 4: No Duplicate Client Warning
1. Open browser DevTools console
2. Clear console
3. Navigate: Dashboard → Studio → Media → Dashboard
4. **Expected:** No `Multiple GoTrueClient instances` warning

### Test 5: EQ Panel Ready State
1. Go to Studio tab
2. Open EQ panel
3. **Expected:** 
   - Shows "EQ initializing..." briefly (if not ready)
   - Renders controls when ready
   - No "No audioContext provided" warnings in console

---

## 📋 Environment Setup

Ensure these flags are set in your `.env.local`:

```bash
# Enable music provider
VITE_ENABLE_MUSIC_PROVIDER=true

# Disable optional backends during music work (reduces console noise)
VITE_ENABLE_TTS=false
VITE_ENABLE_BETABOT=false
VITE_ENABLE_OBS=false
VITE_ENABLE_BACKEND=false
```

Copy from [`.env.example`](.env.example) if needed.

---

## 🔍 Diagnostic Commands

### Check Storage Files
```javascript
// In browser DevTools console
const { data } = await supabase.storage.from('music').list('', { limit: 1000 })
console.log('Music files:', data?.map(f => f.name))
```

### Test Path Normalization
```javascript
import { normalizeMusicPath, isValidStoragePath } from '@/utils/storagePath'

normalizeMusicPath('  /my song.mp3  ')  // → "my_song.mp3"
isValidStoragePath('valid_file.mp3')    // → true
isValidStoragePath('/invalid/path')      // → false
```

### Verify Signed URL
```javascript
const { data, error } = await supabase.storage
  .from('music')
  .createSignedUrl('1760924424753_song.mp3', 3600)

console.log('Signed URL:', data?.signedUrl)
console.log('Error:', error)
```

---

## 🎯 What Changed in Each File

| File | Changes | Purpose |
|------|---------|---------|
| `useMusicLibrary.ts` | Changed bucket from `music-audio` → `music`<br>Store actual path from Supabase | Fix bucket mismatch |
| `AuthContext.tsx` | Import singleton `supabase` client | Remove duplicate GoTrue |
| `ShowPlanSelector.tsx` | Import singleton `supabase` client | Remove duplicate GoTrue |
| `storagePath.ts` | **NEW** - Path normalization utilities | Consistent path formatting |
| `MusicProvider.tsx` | Add existence check before signed URLs<br>Enhanced error logging<br>Add `ready` flag | Prevent 400 errors, improve UX |
| `EQPanel.tsx` | Guard render with `ready` flag | Prevent audioContext warnings |
| `.env.example` | Already had feature flags (no change) | Optional backend control |

---

## 🚨 Known Limitations

1. **AI System Clients:** Multiple AI classes in `src/lib/ai/` still create their own Supabase clients. This is a separate refactor.

2. **Migration Required:** If you have existing tracks in `music-audio` bucket, you'll need to either:
   - Migrate files: `music-audio` → `music` bucket
   - OR update all DB paths to use new bucket

3. **Testing Scripts:** Scripts in `/scripts` folder intentionally create their own clients (CLI tools).

---

## 📞 Support

If issues persist:

1. **Clear browser cache** and reload
2. **Check Network tab** in DevTools for 400 errors
3. **Verify Supabase Storage permissions** (bucket policies)
4. **Share console logs** with full context from MusicProvider

---

**Fixed on:** 2025-10-23  
**Summary:** Unified bucket naming, removed duplicate clients, added path validation, enhanced error reporting
