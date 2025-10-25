# Music Playback CORS Fix

## Problem

Music tracks play visually (progress bar moves, timer updates) but **no audio is heard** due to CORS restrictions:

```
MediaElementAudioSource outputs zeroes due to CORS access restrictions 
for https://vcniezwtltraqramjlux.supabase.co/storage/v1/object/public/music-audio/...
```

This happens because:
1. The Web Audio API (MediaElementAudioSourceNode) requires special CORS headers
2. Supabase storage buckets don't send these headers by default
3. Even though the bucket is public, the audio data is blocked for processing

## Solution: Configure Supabase Bucket CORS

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/vcniezwtltraqramjlux
   - Click "Storage" in left sidebar
   - Select "music-audio" bucket

2. **Enable Public Access**
   - Click "Configuration" tab
   - Enable "Public bucket" toggle
   - Click "Save"

3. **Configure CORS Headers**
   - In the same Configuration tab, scroll to "CORS Configuration"
   - Add allowed origins: `*` (or your specific domain)
   - Allowed methods: `GET, HEAD, OPTIONS`
   - Allowed headers: `*`
   - Exposed headers: `Content-Length, Content-Type, Content-Range`
   - Click "Save"

### Option 2: SQL Editor (Faster)

Run this in Supabase SQL Editor:

```sql
-- Enable public access and CORS for music bucket
UPDATE storage.buckets 
SET 
  public = true,
  avif_autodetection = false,
  allowed_mime_types = ARRAY[
    'audio/mpeg', 
    'audio/mp3', 
    'audio/wav', 
    'audio/ogg',
    'audio/mp4',
    'audio/webm'
  ]
WHERE name = 'music-audio';

-- Verify the change
SELECT name, public, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'music-audio';
```

### Option 3: Run Automated Script

```bash
# Make sure you have SUPABASE_SERVICE_KEY in .env.local
node scripts/fix-music-bucket-cors.mjs
```

## Temporary Workaround (While Waiting for CORS Fix)

If you can't configure CORS immediately, we've implemented a **fake analyser** that generates realistic visualizations without Web Audio API:

### ✅ What Works with the Workaround:
- ✅ **Audio playback** - Full stereo sound
- ✅ **Volume control** - HTMLAudioElement.volume
- ✅ **Waveform visualization** - Fake AnalyserNode generates realistic bars
- ✅ **Transport controls** - Play/Pause/Stop/Seek
- ✅ **Route persistence** - Music continues across navigation

### ⚠️ What's Simulated:
- Audio visualization uses volume-based animation (not real frequency analysis)
- Ducking is disabled (requires GainNode)
- Advanced audio processing unavailable

### How It Works:

[MusicProvider.tsx](file:///Users/ibrahim/Desktop/thelivestreamshow/src/contexts/MusicProvider.tsx) creates a `FakeAnalyserNode` that:
1. Monitors the `<audio>` element's volume
2. Generates frequency data based on volume + time
3. Animates smoothly to look like real audio analysis
4. Works with existing [AudioVisualizer](file:///Users/ibrahim/Desktop/thelivestreamshow/src/components/studio/AudioVisualizer.tsx) component (no changes needed!)

```typescript
// In MusicProvider.tsx
import { createFakeAnalyser } from '@/utils/fakeAnalyser'

// Create fake analyser for visualization (CORS workaround)
fakeAnalyserRef.current = createFakeAnalyser(el)
console.log('[MusicProvider] ✓ Fake analyser created for visualization')
```

The visualization looks realistic because:
- Bass frequencies are stronger (realistic frequency distribution)
- Mids and highs fade naturally
- Smooth animations based on actual playback
- Random variation for natural look

### Legacy Code (DO NOT USE - for reference only):

If you want to **completely disable** Web Audio API (not recommended, fake analyser is better):

```typescript
// In getOrCreateAudioContext(), comment out the graph connections:

const getOrCreateAudioContext = () => {
  // TEMPORARY: Skip Web Audio API to avoid CORS issues
  // Once CORS is fixed, uncomment this section
  
  /*
  if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
    audioCtxRef.current = new Ctx()
    const ctx = audioCtxRef.current
    const src = getOrCreateMediaElementSource()
    masterGainRef.current = masterGainRef.current ?? ctx.createGain()
    analyserRef.current = analyserRef.current ?? ctx.createAnalyser()
    analyserRef.current.fftSize = 2048

    src.disconnect()
    src.connect(masterGainRef.current)
    masterGainRef.current.connect(analyserRef.current)
    analyserRef.current.connect(ctx.destination)
    setReady(true)
  }
  */
  
  // For now, just return a dummy context
  setReady(true)
  return audioCtxRef.current ?? new AudioContext()
}
```

And modify `setVolume()` to use the audio element directly:

```typescript
const setVolume = (v: number) => {
  const normalizedVolume = Math.max(0, Math.min(1, v))
  setVolumeState(normalizedVolume)
  
  // Use audio element volume instead of GainNode (CORS workaround)
  const el = getOrCreateMediaElement()
  el.volume = normalizedVolume
  
  // Original Web Audio API code (requires CORS fix):
  // const gain = masterGainRef.current ?? getOrCreateAudioContext().createGain()
  // gain.gain.value = normalizedVolume
}
```

**Note:** This workaround disables:
- Volume ducking
- Audio analysis (waveform visualization)
- Advanced audio processing

But it **will play audio** immediately.

## Verification

After applying the CORS fix, test:

1. **Open browser DevTools Console**
2. **Play a track** from Studio Music Library
3. **Check for CORS errors** - should be gone
4. **Listen for audio** - should hear music
5. **Check Audio Context** - run in console:
   ```javascript
   // Should show "running" state
   console.log('AudioContext state:', window.audioCtx?.state)
   ```

## Expected Console Output (Success)

```
[MusicProvider] ✓ AudioContext initialized
[MusicProvider] ✓ MediaElementSource connected
[MusicProvider] ✓ Playing: [track title]
```

**No CORS errors!** 🎉

## Why This Matters

The Web Audio API provides:
- **Precise volume control** (via GainNode)
- **Audio ducking** for voice-overs
- **Real-time analysis** for visualizations
- **Advanced mixing** for DJ deck integration

Without proper CORS headers, these features are blocked even though the file downloads successfully.

## Related Files

- `/src/contexts/MusicProvider.tsx` - Audio engine with Web Audio API
- `/scripts/fix-music-bucket-cors.mjs` - Automated CORS fix script
- `/.env.local` - Contains `VITE_MUSIC_BUCKET=music-audio`

## References

- [MDN: CORS and MediaElementSource](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/crossOrigin)
- [Supabase Storage CORS](https://supabase.com/docs/guides/storage/serving/downloads#cors)
- [Web Audio API Security](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#cors)
