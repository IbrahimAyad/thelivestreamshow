# Quick Start: Global Music Provider

## What Was Built

A persistent music playback engine that **continues playing when you navigate between tabs**. No more interrupted music!

## ✅ Implementation Status

**COMPLETE** - Ready to use in any component

## 🚀 How to Use (3 Steps)

### 1. Import the Hook

```typescript
import { useMusic } from '@/contexts/MusicProvider'
```

### 2. Use in Your Component

```typescript
function MyMusicPlayer() {
  const music = useMusic()
  
  return (
    <div>
      <h3>{music.current?.title || 'No track'}</h3>
      <p>{Math.floor(music.currentTime)}s / {Math.floor(music.duration)}s</p>
      
      <button onClick={() => music.isPlaying ? music.pause() : music.resume()}>
        {music.isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
```

### 3. Load a Track from Database

```typescript
import { musicTrackToTrack } from '@/contexts/MusicProvider'

// Get track from database
const dbTrack = await supabase
  .from('music_library')
  .select('*')
  .eq('id', trackId)
  .single()

// Convert and play
const track = musicTrackToTrack(dbTrack.data)
await music.play(track)
```

## 📦 What's Included

| Component | Location | Purpose |
|-----------|----------|---------|
| **MusicProvider** | `src/contexts/MusicProvider.tsx` | Core engine |
| **useMusic()** | Same file | React hook to access music |
| **MusicPlayerControls** | `src/components/studio/` | Ready-to-use player UI |
| **Playlist Helpers** | `src/utils/playlistHelpers.ts` | Load playlists from DB |

## 🎵 Common Tasks

### Play a Single Track
```tsx
const music = useMusic()
await music.play(musicTrackToTrack(dbTrack))
```

### Load a Playlist
```tsx
import { loadPlaylistTracks } from '@/utils/playlistHelpers'

const tracks = await loadPlaylistTracks('playlist-id')
music.setQueue(tracks)
await music.play(tracks[0])
```

### Control Volume
```tsx
music.setVolume(0.5) // 50% volume
```

### Duck for TTS
```tsx
music.setDuck(0.7)  // Reduce to 30%
// ... play TTS ...
music.setDuck(0)    // Restore to 100%
```

### Skip Tracks
```tsx
await music.next()      // Next track in queue
await music.previous()  // Previous track
```

## 🔍 Available Properties

Access via `const music = useMusic()`:

- `music.current` - Current track object
- `music.queue` - Array of queued tracks
- `music.isPlaying` - Boolean playback state
- `music.currentTime` - Current position (seconds)
- `music.duration` - Track length (seconds)
- `music.volume` - Master volume (0-1)
- `music.error` - Error message if any
- `music.analyser` - Web Audio analyser for visualizers

## 🧪 Test It Works

1. Start the app
2. Go to any tab (Dashboard/Studio/Media)
3. Play a track using the music controls
4. Navigate to a different tab
5. ✅ **Music should keep playing!**

## 📚 Full Documentation

- **Usage Guide**: `MUSIC_PROVIDER_USAGE.md` (comprehensive examples)
- **Implementation**: `IMPLEMENTATION_SUMMARY.md` (architecture details)
- **Design Spec**: Original design document provided

## ⚡ Example: Complete Music Player

```tsx
import { useMusic, musicTrackToTrack } from '@/contexts/MusicProvider'
import { loadPlaylistTracks } from '@/utils/playlistHelpers'

function QuickMusicPlayer() {
  const music = useMusic()
  
  const loadMyPlaylist = async () => {
    const tracks = await loadPlaylistTracks('my-playlist-id')
    music.setQueue(tracks)
    await music.play(tracks[0])
  }
  
  return (
    <div className="p-4 bg-gray-900 rounded">
      {/* Now Playing */}
      <div className="mb-4">
        <h3 className="font-bold">{music.current?.title || 'No track'}</h3>
        <p className="text-sm text-gray-400">{music.current?.artist}</p>
      </div>
      
      {/* Transport Controls */}
      <div className="flex gap-2 mb-4">
        <button onClick={music.previous}>⏮️</button>
        <button onClick={music.isPlaying ? music.pause : music.resume}>
          {music.isPlaying ? '⏸️' : '▶️'}
        </button>
        <button onClick={music.next}>⏭️</button>
        <button onClick={music.stop}>⏹️</button>
      </div>
      
      {/* Progress */}
      <input 
        type="range"
        min={0}
        max={music.duration || 100}
        value={music.currentTime}
        onChange={(e) => music.seek(Number(e.target.value))}
        className="w-full"
      />
      
      {/* Load Playlist */}
      <button 
        onClick={loadMyPlaylist}
        className="mt-4 px-4 py-2 bg-blue-600 rounded"
      >
        Load My Playlist
      </button>
    </div>
  )
}
```

## 🆘 Troubleshooting

**Music stops when I navigate:**
- Check that MusicProvider is mounted in `main.tsx` above BrowserRouter ✅ (Already done)

**No sound:**
- Check browser console for `[MusicProvider]` logs
- Ensure user has interacted with page (browser autoplay policy)
- Check music.volume is > 0

**Track won't load:**
- Verify track exists in `music_library` table
- Check `file_path` is valid in Supabase Storage
- Look for error in `music.error`

## 🎯 Next Steps

1. Try the example player above
2. Test navigation continuity
3. Load your own playlists
4. Add visualization using `music.analyser`
5. Integrate ducking with your TTS system

---

**Status**: ✅ Fully Implemented  
**Ready to Use**: Yes  
**Breaking Changes**: None (existing dual deck unaffected)
