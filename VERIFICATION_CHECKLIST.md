# Music Engine Fix - Verification Checklist

Use this checklist to verify all fixes are working correctly.

## ✅ Pre-Flight Checks

- [ ] **Environment Variables Set**
  - Copy `.env.example` to `.env.local` if not already done
  - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
  - Set `VITE_ENABLE_MUSIC_PROVIDER=true`
  - (Optional) Set `VITE_ENABLE_TTS=false`, `VITE_ENABLE_BETABOT=false`, `VITE_ENABLE_OBS=false` to reduce console noise

- [ ] **Restart Development Server**
  - Stop current dev server (Ctrl+C)
  - Run `npm run dev` (or `yarn dev`)
  - Open browser to `http://localhost:5173`

---

## 🧪 Test 1: Bucket Migration (If Needed)

**Skip this if you have no existing tracks or all tracks are already in `music` bucket.**

- [ ] Set `SUPABASE_SERVICE_KEY` environment variable
  ```bash
  export SUPABASE_SERVICE_KEY="your-service-role-key"
  ```

- [ ] Run migration script
  ```bash
  npx tsx scripts/migrate-music-bucket.ts
  ```

- [ ] Verify migration output shows:
  - Files processed count
  - Database records updated
  - No errors

- [ ] **Manually verify in Supabase Studio:**
  - Go to Storage → `music` bucket
  - Confirm files are present
  - Note a sample file path (e.g., `1760924424753_song.mp3`)

---

## 🧪 Test 2: Upload New Track

- [ ] Open app → Go to **Studio** tab
- [ ] Click **Music Library** or equivalent upload button
- [ ] Upload a test audio file (MP3/WAV)
- [ ] **Open browser DevTools Console**
- [ ] Verify console log shows:
  ```
  [useMusicLibrary] File uploaded to storage: {timestamp}_{filename}.mp3
  ```

- [ ] **In Supabase Studio**, verify:
  - File appears in `music` bucket (NOT `music-audio`)
  - File path in DB matches Storage key exactly

---

## 🧪 Test 3: Playback from Library

- [ ] In Studio → Music Library, click a track to play
- [ ] **Expected Results:**
  - ✅ Music starts playing immediately
  - ✅ Transport controls show track info
  - ✅ No "Object not found" errors in console

- [ ] **Check Console Logs:**
  ```
  [MusicProvider] ========== LOADING TRACK ==========
  [MusicProvider] Track ID: ...
  [MusicProvider] Track title: ...
  [MusicProvider] Raw path: ...
  [MusicProvider] Path normalized: ... -> ...
  [MusicProvider] File exists, generating signed URL for: ...
  [MusicProvider] Signed URL created successfully
  [MusicProvider] Track loaded successfully
  [MusicProvider] Playback started
  ```

- [ ] No errors in console

---

## 🧪 Test 4: Cross-Route Playback Persistence

- [ ] Start playing a track in Studio tab
- [ ] Navigate to **Dashboard** tab
- [ ] **Expected:**
  - ✅ Music continues playing (no interruption)
  - ✅ Transport controls show current track
  - ✅ Play/Pause/Stop buttons work

- [ ] Navigate to **Media** tab
- [ ] **Expected:**
  - ✅ Music still playing
  - ✅ Controls functional

- [ ] Return to **Studio** tab
- [ ] **Expected:**
  - ✅ Music still playing
  - ✅ Same track position maintained

---

## 🧪 Test 5: Transport Controls

With music playing, test all controls:

- [ ] **Pause Button**
  - ✅ Music pauses
  - ✅ Button changes to "Play"

- [ ] **Resume (Play) Button**
  - ✅ Music resumes from same position
  - ✅ Button changes to "Pause"

- [ ] **Stop Button**
  - ✅ Music stops
  - ✅ Playhead resets to 0:00

- [ ] **Seek Slider**
  - ✅ Dragging slider updates position
  - ✅ Music continues from new position

- [ ] **Volume Slider**
  - ✅ Volume changes smoothly
  - ✅ Persists across tracks

---

## 🧪 Test 6: Queue & Auto-Advance

- [ ] Select multiple tracks (or set a playlist queue)
- [ ] Play first track
- [ ] **When track ends, verify:**
  - ✅ Automatically advances to next track
  - ✅ No manual intervention needed
  - ✅ Console shows: `[MusicProvider] Advanced to next track: 2 / 5`

- [ ] **At end of queue, verify:**
  - ✅ Music stops
  - ✅ Console shows: `[MusicProvider] End of queue reached`

---

## 🧪 Test 7: Error Handling (Bad Path)

**Test with known-bad path to verify error messages are clear.**

Method 1 - DevTools Console:
```javascript
const music = window.__MUSIC_CONTEXT__ // or access via React DevTools
await music.play({ id: 'test', path: 'does_not_exist.mp3', title: 'Test' })
```

- [ ] **Expected Console Output:**
  ```
  [MusicProvider] ========== LOADING TRACK ==========
  [MusicProvider] File not found in storage
  [MusicProvider] Looking for: does_not_exist.mp3
  [MusicProvider] In folder: (root)
  [MusicProvider] Available files: {actual files list}
  [MusicProvider] ========== LOAD FAILED ==========
  Error: Storage key missing: bucket=music, path=does_not_exist.mp3
  ```

- [ ] **UI shows error state** (exact behavior depends on your UI implementation)

---

## 🧪 Test 8: No Duplicate Supabase Client Warnings

- [ ] **Clear browser console** (Ctrl+L or Cmd+K)
- [ ] **Refresh page** (hard reload: Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Navigate: Dashboard → Studio → Media → Dashboard
- [ ] **Check console for:**
  - ❌ NO warning: `Multiple GoTrueClient instances detected`
  - ✅ Should only see normal logs

---

## 🧪 Test 9: EQ Panel (AudioContext Ready State)

- [ ] Go to **Studio** tab
- [ ] Open **EQ Panel** (or equivalent audio settings)
- [ ] **Expected:**
  - ✅ May briefly show "EQ initializing..." (if very quick)
  - ✅ Renders EQ controls when ready
  - ✅ No console warnings: `No audioContext provided`

- [ ] Adjust EQ bands (bass/mid/high)
- [ ] **Expected:**
  - ✅ Changes apply immediately to audio
  - ✅ No errors in console

---

## 🧪 Test 10: DualDeck Integration (If Applicable)

**Only if your app uses DualDeck feature.**

- [ ] Open DualDeck panel
- [ ] Load tracks into Deck A and Deck B
- [ ] **Check console:**
  ```
  [MusicProvider] Deck A registered and connected to master chain
  [MusicProvider] Deck outputs ready – A: true B: false
  [MusicProvider] Deck B registered and connected to master chain
  [MusicProvider] Deck outputs ready – A: true B: true
  ```

- [ ] Play from both decks
- [ ] **Expected:**
  - ✅ Both decks audible through master output
  - ✅ Crossfader works correctly

---

## 🔍 Diagnostic Commands

If any test fails, run these in **browser DevTools console**:

### Check Storage Files
```javascript
const { data } = await supabase.storage.from('music').list('', { limit: 1000 })
console.log('Music files:', data?.map(f => f.name))
```

### Test Path Normalization
```javascript
// In browser console, you can test via a component that imports the util
// Or add window.__STORAGE_PATH_UTILS__ = { normalizeMusicPath, ... } to MusicProvider for debugging
```

### Verify Database Tracks
```javascript
const { data: tracks } = await supabase.from('music_library').select('id, title, file_path').limit(10)
console.table(tracks)
```

### Test Signed URL Creation
```javascript
const testPath = '1760924424753_song.mp3' // Use actual file from your storage
const { data, error } = await supabase.storage
  .from('music')
  .createSignedUrl(testPath, 3600)

if (error) {
  console.error('❌ Signed URL failed:', error.message)
} else {
  console.log('✅ Signed URL:', data.signedUrl)
}
```

---

## 🐛 Troubleshooting

### Issue: "Object not found" errors persist

**Possible Causes:**
1. Files still in wrong bucket (`music-audio` instead of `music`)
2. Database paths don't match Storage keys
3. Supabase Storage permissions issue

**Solutions:**
1. Run migration script: `npx tsx scripts/migrate-music-bucket.ts`
2. Manually verify paths in DB match Storage
3. Check Supabase Storage bucket policies (should allow authenticated reads)

---

### Issue: "Multiple GoTrueClient instances" warning

**Possible Causes:**
1. Some file still importing `createClient` directly
2. Browser extension interfering

**Solutions:**
1. Search codebase: `grep -r "createClient" src/` (exclude scripts)
2. Ensure all imports use: `import { supabase } from '@/lib/supabase'`
3. Try in incognito mode to rule out extensions

---

### Issue: Music stops when changing routes

**Possible Causes:**
1. Multiple `<MusicProvider>` instances mounted
2. Audio element being unmounted

**Solutions:**
1. Verify single `<MusicProvider>` at app root (in `main.tsx` or `App.tsx`)
2. Check React DevTools component tree for duplicates

---

### Issue: EQ controls not working

**Possible Causes:**
1. AudioContext not initialized
2. Audio graph not connected

**Solutions:**
1. Check console for `[MusicProvider] Web Audio API graph initialized and ready`
2. Ensure `ready === true` before rendering EQ
3. Verify no browser autoplay policy blocking AudioContext

---

## 📊 Success Criteria

**All tests should pass with these results:**

✅ No "Object not found" errors  
✅ No "Multiple GoTrueClient" warnings  
✅ Music plays across all routes without interruption  
✅ Transport controls (Play/Pause/Stop/Seek/Volume) work everywhere  
✅ Queue auto-advances correctly  
✅ EQ panel renders without audioContext warnings  
✅ Error messages are clear and actionable  
✅ New uploads go to `music` bucket and play immediately  

---

## 📝 Notes

- If you have **existing tracks** in the old `music-audio` bucket, you MUST run the migration script
- After migration, verify a few tracks manually before deleting old files
- The migration script has cleanup code commented out for safety - only enable after verification
- Scripts in `/scripts` folder intentionally create their own Supabase clients (this is OK)
- AI system files in `/src/lib/ai` may still create clients - this is a separate refactor

---

**Last Updated:** 2025-10-23  
**Related Docs:** [MUSIC_ENGINE_FIX_SUMMARY.md](MUSIC_ENGINE_FIX_SUMMARY.md)
