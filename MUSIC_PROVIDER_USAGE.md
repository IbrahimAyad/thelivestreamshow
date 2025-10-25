# Global Music Provider Usage Guide

## Overview

The `MusicProvider` is a global, persistent music playback engine that provides uninterrupted music playback across route transitions throughout the application.

## Key Features

- ✅ **Persistent Playback**: Music continues when navigating between Dashboard, Studio, and Media tabs
- ✅ **Single Audio Element**: One centralized HTMLAudioElement that persists at the application root
- ✅ **Web Audio API**: Full audio graph with volume control, ducking, and visualization support
- ✅ **Supabase Integration**: Automatic signed URL generation and refresh for Storage files
- ✅ **Queue Management**: Auto-advance through playlists with queue controls
- ✅ **Ducking Support**: Automatic volume reduction for TTS/sound effects
- ✅ **Error Recovery**: Handles expired signed URLs with automatic retry

## Architecture

```
main.tsx
  └── MusicProvider (mounted above router)
        ├── BrowserRouter
        │     ├── Dashboard (uses useMusic())
        │     ├── Studio (uses useMusic())  
        │     └── Media (uses useMusic())
        │
        └── Audio Element (persists across routes)
              └── Web Audio Graph
                    ├── Volume Gain Node
                    ├── Ducking Gain Node
                    └── Analyser Node
```

## Basic Usage

### 1. Import the Hook

```typescript
import { useMusic, musicTrackToTrack } from '@/contexts/MusicProvider'
import type { MusicTrack } from '@/types/database'
```

### 2. Access Music Context

```typescript
function MyComponent() {
  const music = useMusic()
  
  // Play a track
  const handlePlay = async (dbTrack: MusicTrack) => {
    const track = musicTrackToTrack(dbTrack)
    await music.play(track)
  }
  
  // Pause playback
  const handlePause = () => {
    music.pause()
  }
  
  // Resume playback
  const handleResume = async () => {
    await music.resume()
  }
  
  return (
    <div>
      <h3>{music.current?.title || 'No track playing'}</h3>
      <p>{Math.floor(music.currentTime)} / {Math.floor(music.duration)}</p>
      <button onClick={music.isPlaying ? handlePause : handleResume}>
        {music.isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
```

## API Reference

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `current` | `Track \| undefined` | Currently loaded track |
| `queue` | `Track[]` | Playlist queue |
| `isPlaying` | `boolean` | Playback state |
| `currentTime` | `number` | Current position in seconds |
| `duration` | `number` | Track duration in seconds |
| `volume` | `number` | Master volume (0.0-1.0) |
| `duckLevel` | `number` | Current ducking level (0-1) |
| `error` | `string \| null` | Error message if any |
| `hasError` | `boolean` | Error flag |
| `analyser` | `AnalyserNode \| null` | Web Audio analyser for visualization |

### Control Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `play` | `(track?: Track) => Promise<void>` | Play track or resume |
| `pause` | `() => void` | Pause playback |
| `resume` | `() => Promise<void>` | Resume paused track |
| `stop` | `() => void` | Stop and reset |
| `seek` | `(seconds: number) => void` | Seek to position |
| `setQueue` | `(tracks: Track[]) => void` | Load playlist |
| `next` | `() => Promise<void>` | Skip to next |
| `previous` | `() => Promise<void>` | Go to previous |
| `setVolume` | `(level: number) => void` | Set volume (0-1) |
| `setDuck` | `(percentage: number) => void` | Apply ducking (0-1) |

## Advanced Examples

### Load and Play a Playlist

```typescript
const handleLoadPlaylist = async (playlistId: string) => {
  // Fetch playlist from Supabase
  const { data: playlist } = await supabase
    .from('playlists')
    .select('track_ids')
    .eq('id', playlistId)
    .single()
  
  if (!playlist?.track_ids) return
  
  // Fetch tracks
  const { data: tracks } = await supabase
    .from('music_library')
    .select('*')
    .in('id', playlist.track_ids)
  
  if (!tracks) return
  
  // Convert to Track format and load queue
  const convertedTracks = tracks.map(musicTrackToTrack)
  music.setQueue(convertedTracks)
  
  // Start playing first track
  await music.play(convertedTracks[0])
}
```

### Ducking for TTS

```typescript
const handleTTSStart = () => {
  // Duck music to 30% when TTS starts
  music.setDuck(0.7) // 70% reduction = 30% volume
}

const handleTTSEnd = () => {
  // Restore full volume when TTS ends
  music.setDuck(0)
}
```

### Audio Visualization

```typescript
function Visualizer() {
  const music = useMusic()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!music.analyser || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dataArray = new Uint8Array(music.analyser.frequencyBinCount)
    
    const draw = () => {
      requestAnimationFrame(draw)
      
      music.analyser!.getByteFrequencyData(dataArray)
      
      // Draw frequency bars
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = canvas.width / dataArray.length
      
      dataArray.forEach((value, i) => {
        const barHeight = (value / 255) * canvas.height
        ctx.fillStyle = `hsl(${(i / dataArray.length) * 360}, 70%, 50%)`
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight)
      })
    }
    
    draw()
  }, [music.analyser])
  
  return <canvas ref={canvasRef} width={800} height={200} />
}
```

### Error Handling

```typescript
function MusicControls() {
  const music = useMusic()
  
  return (
    <div>
      {music.hasError && (
        <div className="alert alert-error">
          {music.error}
          <button onClick={() => music.play(music.current)}>
            Retry
          </button>
        </div>
      )}
      
      {/* ... controls ... */}
    </div>
  )
}
```

## Navigation Continuity

The MusicProvider is mounted **above** the router in `main.tsx`, ensuring it never unmounts during route transitions:

```typescript
// main.tsx
<MusicProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/broadcast" element={<BroadcastOverlayView />} />
    </Routes>
  </BrowserRouter>
</MusicProvider>
```

This means:
- ✅ Music plays continuously when navigating from Dashboard → Studio
- ✅ Music plays continuously when navigating from Studio → Media
- ✅ Music state (position, volume, queue) is preserved across all tabs

## Coexistence with Dual Deck System

The global MusicProvider is **separate** from the DJ Dual Deck system:

| Use Case | System | Location |
|----------|--------|----------|
| Background music/playlists | MusicProvider | Global context |
| Professional DJ mixing | Dual Deck | Studio-specific |
| Show intro sequences | Dual Deck | Show intro controller |

Both systems can play simultaneously without interference.

## Type Conversion

The `MusicTrack` from the database needs conversion to the `Track` type used by the provider:

```typescript
import { musicTrackToTrack } from '@/contexts/MusicProvider'
import type { MusicTrack } from '@/types/database'

// Database track
const dbTrack: MusicTrack = {
  id: '123',
  file_path: 'music/song.mp3',
  title: 'My Song',
  artist: 'Artist Name',
  duration: 180,
  // ... other fields
}

// Convert for playback
const track = musicTrackToTrack(dbTrack)
await music.play(track)
```

## Testing Navigation Continuity

1. Load a track in the Dashboard tab
2. Click play
3. Navigate to the Studio tab
4. ✅ Music should continue playing
5. Navigate to the Media tab  
6. ✅ Music should still be playing
7. Seek, pause, resume
8. ✅ All controls should work across tabs

## Debugging

The MusicProvider logs detailed information to the console:

```
[MusicProvider] Audio element created
[MusicProvider] Web Audio API graph initialized
[MusicProvider] Generating fresh signed URL for: music/track.mp3
[MusicProvider] Track loaded: My Song
[MusicProvider] Playback started
[MusicProvider] Advanced to next track: 2 / 5
[MusicProvider] Duck set to: 0.7
[MusicProvider] Cleanup complete
```

Enable console filtering with `[MusicProvider]` to see all music-related logs.

## Next Steps

1. ✅ **Core Infrastructure**: MusicProvider created and mounted
2. ✅ **Basic Controls**: MusicPlayerControls updated to use global context
3. ⏳ **Component Integration**: Update remaining components (Dashboard, Media)
4. ⏳ **Playlist Integration**: Add helpers to load playlists from Supabase
5. ⏳ **Testing**: Comprehensive navigation and playback testing

## Example: Complete Music Player Component

See `src/components/studio/MusicPlayerControls.tsx` for a complete implementation using the global music context.
