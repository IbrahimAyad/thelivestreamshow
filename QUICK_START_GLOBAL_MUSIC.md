# Quick Start: Using the Global Music Engine

## For Regular Playback (Simple)

### 1. Get the Music Provider
```typescript
import { useMusic } from '@/contexts/MusicProvider'

const music = useMusic()
```

### 2. Play a Track (User Gesture Required)
```typescript
// In a click handler:
const handlePlayTrack = async (track: Track) => {
  await music.play(track)
}

// Or set queue and play:
const handlePlayQueue = async (tracks: Track[]) => {
  music.setQueue(tracks)
  await music.play(tracks[0])
}
```

### 3. Control Playback
```typescript
// Pause
music.pause()

// Resume
await music.resume()

// Stop
music.stop()

// Seek to 30 seconds
music.seek(30)

// Set volume (0.0 - 1.0)
music.setVolume(0.7)

// Duck for TTS (0.0 - 1.0)
music.setDuck(0.3)  // 30% duck
music.setDuck(0)    // restore
```

### 4. Check State
```typescript
if (music.ready && music.audioContext) {
  // Safe to use audio features
}

if (music.isPlaying) {
  // Music is currently playing
}

if (music.hasError) {
  console.error('Music error:', music.error)
}
```

## For Deck Integration (Advanced)

### 1. Register Your Deck Nodes
```typescript
import { useMusic } from '@/contexts/MusicProvider'

const { registerDeckNode, audioContext, ready } = useMusic()

// After creating your deck audio element:
const deckAElement = new Audio()
const deckASource = audioContext!.createMediaElementSource(deckAElement)

// Register with provider:
registerDeckNode('A', deckASource)
```

### 2. Full Deck Setup Example
```typescript
useEffect(() => {
  if (!ready || !audioContext) return

  // Create deck A audio
  const deckA = new Audio()
  const sourceA = audioContext.createMediaElementSource(deckA)
  
  // Register (auto-connects to master chain)
  registerDeckNode('A', sourceA)
  
  // Same for deck B
  const deckB = new Audio()
  const sourceB = audioContext.createMediaElementSource(deckB)
  registerDeckNode('B', sourceB)
  
  // Check console for:
  // "Deck outputs ready – A: true B: true"
}, [ready, audioContext, registerDeckNode])
```

## Using Components

### Transport Controls (Automatic)
```typescript
// Just render - auto-connects to global state:
<MusicPlayerControls />
```

### EQ Panel (Automatic)
```typescript
// Auto-uses global context, waits until ready:
<EQPanel />

// Or pass explicit context:
<EQPanel audioContext={customContext} />
```

## Track Path Format

**CRITICAL**: Paths must match Supabase Storage structure:

```typescript
// ✅ Correct
const track: Track = {
  id: '123',
  path: 'music/NOVEMBER_KID_X_ESTL.mp3',  // NO leading slash!
  title: 'November Kid X ESTL'
}

// ❌ Wrong
const track: Track = {
  path: '/music/song.mp3',      // Leading slash
  path: 'song.mp3',             // Missing folder
  path: 'music/undefined.mp3',  // Invalid filename
}
```

## Error Handling

```typescript
try {
  await music.play(track)
} catch (err) {
  // Error message will be:
  // "Object not found: bucket=music, path=<actual-path> - <reason>"
  console.error('Failed to play:', err)
  
  // Check music.error for user-friendly message
  if (music.hasError) {
    alert(music.error)
  }
}
```

## Environment Flags

To disable optional services, add to `.env.local`:

```bash
# Disable noisy integrations
VITE_ENABLE_TTS=false
VITE_ENABLE_BETABOT=false
VITE_ENABLE_OBS=false
VITE_ENABLE_BACKEND=false
```

Then in components:
```typescript
if (import.meta.env.VITE_ENABLE_TTS !== 'true') {
  return null  // Don't try to connect
}
```

## Common Patterns

### Loading a Playlist
```typescript
const loadPlaylist = async (playlistId: string) => {
  const tracks = await fetchPlaylistTracks(playlistId)
  music.setQueue(tracks)
  await music.play(tracks[0])
}
```

### Auto-Advance Queue
```typescript
// Provider handles this automatically via onEnded event
// Just set the queue:
music.setQueue([track1, track2, track3])
await music.play(track1)
// Tracks 2 and 3 will auto-play when previous ends
```

### Manual Duck During TTS
```typescript
const playTTS = async (audioUrl: string) => {
  // Duck background music
  music.setDuck(0.7)  // 70% duck
  
  // Play TTS
  const tts = new Audio(audioUrl)
  await tts.play()
  
  // Restore on end
  tts.onended = () => music.setDuck(0)
}
```

### Cross-Route Playback
```typescript
// Page A:
await music.play(track)

// Navigate to Page B:
navigate('/other-page')

// Music keeps playing!
// Controls on Page B work immediately:
music.pause()
music.resume()
```

## Debugging

### Check Provider Status
```typescript
const music = useMusic()

console.log('Ready:', music.ready)
console.log('Context:', music.audioContext)
console.log('Current:', music.current)
console.log('Playing:', music.isPlaying)
console.log('Error:', music.error)
```

### Watch Console Logs
```
[MusicProvider] Web Audio API graph initialized and ready
[MusicProvider] Deck outputs ready – A: false B: false
[MusicProvider] Loading track from path: music/song.mp3
[MusicProvider] Track loaded: Song Name
[MusicProvider] Playback started
```

### Common Issues

**"No track selected"**
- Make sure you called `music.play(track)` with a valid track
- Check `music.current` - should not be undefined

**"Object not found"**  
- Check track.path format (no leading slash!)
- Verify file exists in Supabase Storage bucket
- Console shows full path and track object

**"EQ initializing..."**
- Provider not ready yet - wait for `ready === true`
- Check MusicProvider is mounted in main.tsx

**Decks not connecting**
- Call `registerDeckNode()` after creating source nodes
- Wait for `ready === true` before registration
- Check console for "Deck outputs ready" message
