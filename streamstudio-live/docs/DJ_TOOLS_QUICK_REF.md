# DJ Tools - Quick Reference

## Keyboard Shortcuts

Currently no keyboard shortcuts implemented. Consider adding in future:
- `Ctrl+E`: Toggle DJ Tools panel
- `Ctrl+M`: Open metadata editor for current track
- `Ctrl+Shift+S`: Create smart playlist
- `Ctrl+Shift+C`: Toggle crossfade

## Component Locations

### Header (Always Visible)
- **DJ Tools Button**: Toggle DJ panel on/off
- **Settings Button**: Access audio settings

### Left Column
- Music Library
- Search and filter
- Upload/Download buttons
- Track list with Edit (green) and Clip (blue) icons

### Middle Column
- Playlist Manager
- Music Player Controls
- Audio Visualization

### Right Column (Standard)
- Quick Jingles (Intro, Outro, Stingers, Custom)
- Audio Ducking controls

### Right Column (DJ Tools Enabled)
- **Audio Effects Panel**: Real-time effect processing
- **Smart Playlists Panel**: Saved smart playlists + Create button
- **Crossfade Controls**: Transition settings

## Effect Ranges

| Effect | Range | Units | Default |
|--------|-------|-------|----------|
| Reverb | 0-100 | % | 0 |
| Delay | 0-1 | seconds | 0 |
| Bass Boost | -10 to +10 | dB | 0 |
| Treble Boost | -10 to +10 | dB | 0 |
| Distortion | 0-100 | % | 0 |
| Compression | 0-100 | % | 0 |

## Preset Quick Stats

| Preset | Use Case | Key Effects |
|--------|----------|-------------|
| Studio | Recording/Clean | Reverb: 20%, Comp: 30% |
| Live | Broadcast/Radio | Reverb: 40%, Bass: +3dB |
| Radio | FM/AM Style | Treble: +4dB, Comp: 70% |
| Club | Dance/Electronic | Bass: +6dB, Distortion: 20% |
| Podcast | Voice Optimization | Bass: +2dB, Treble: +3dB, Comp: 80% |

## Smart Playlist Filter Logic

### Tags
- **OR Logic**: Track matches ANY selected tag
- **AND Logic**: Track matches ALL selected tags

### Other Filters
- **Mood**: Matches if track mood is in selected moods (OR)
- **Energy Range**: Matches if track energy_level falls within range (inclusive)
- **Duration Range**: Matches if track duration (seconds) falls within range
- **Categories**: Matches if track category is in selected categories (OR)

All filters combine with AND logic (track must match all active filters).

## Database Query Examples

### Get All High Energy Electronic Tracks
```sql
SELECT * FROM music_library
WHERE energy_level >= 7
AND tags @> '["electronic"]'::jsonb;
```

### Get Tracks for Chill Background Music
```sql
SELECT * FROM music_library
WHERE energy_level BETWEEN 1 AND 4
AND mood IN ('Calm', 'Chill')
AND category = 'music';
```

### Get Short Intro Jingles
```sql
SELECT * FROM music_library
WHERE duration < 10
AND custom_category = 'intro';
```

### Get Tracks with Saved Effects
```sql
SELECT title, effects_settings
FROM music_library
WHERE effects_settings != '{}'::jsonb;
```

## Common Tasks

### Task: Create "Energetic Intros" Smart Playlist
1. Click "DJ Tools" button
2. Scroll to Smart Playlists panel
3. Click "Create"
4. Name: "Energetic Intros"
5. Set Energy Range: 7-10
6. Select Categories: intro
7. Click "Preview Matching Tracks"
8. Click "Create Smart Playlist"

### Task: Apply Studio Effects to Current Track
1. Play the track
2. Enable DJ Tools
3. Scroll to Audio Effects Panel
4. Select "Studio" from presets
5. Fine-tune if needed
6. Click "Save to Track"

### Task: Enable 5-Second Crossfade for Playlist
1. Enable DJ Tools
2. Scroll to Crossfade Controls
3. Check "Enable Crossfade"
4. Drag slider to 5 seconds
5. Optionally enable "Auto EQ Matching"

### Task: Tag a Track for Better Organization
1. Find track in library
2. Hover over track row
3. Click green Edit icon
4. Add tags (e.g., "upbeat", "vocal")
5. Select mood (e.g., "Energetic")
6. Set energy level (e.g., 8)
7. Choose category (e.g., "background")
8. Click "Save Metadata"

## Troubleshooting

### Effects Not Applying
- Ensure a track is currently playing
- Check that audio context is resumed (click play to activate)
- Refresh page if effects chain disconnected

### Smart Playlist Shows 0 Matches
- Check that tracks have metadata assigned
- Verify filter criteria isn't too restrictive
- Use "Preview Matching Tracks" to debug
- Ensure tags are entered correctly (lowercase)

### Crossfade Not Working
- Verify crossfade is enabled in settings
- Check that playlist has multiple tracks
- Ensure current track is playing
- Crossfade only occurs at track transitions

### Metadata Editor Not Saving
- Check network connection to Supabase
- Verify track ID is valid
- Check browser console for errors
- Ensure no duplicate tags

## API Integration

### Update Track Effects via API
```javascript
await supabase
  .from('music_library')
  .update({
    effects_settings: {
      reverb: 0.3,
      delay: 0.2,
      bassBoost: 2,
      trebleBoost: 0,
      distortion: 0,
      compression: 0.5
    }
  })
  .eq('id', trackId);
```

### Create Smart Playlist via API
```javascript
await supabase
  .from('smart_playlists')
  .insert({
    name: 'My Smart Playlist',
    description: 'Custom playlist',
    filter_config: {
      tags: ['electronic', 'upbeat'],
      tagsLogic: 'OR',
      energyRange: [6, 10],
      categories: ['music']
    }
  });
```

### Query Smart Playlist Matches
```javascript
const { data } = await supabase
  .from('music_library')
  .select('*')
  .overlaps('tags', ['electronic', 'upbeat'])
  .gte('energy_level', 6)
  .lte('energy_level', 10)
  .eq('category', 'music');
```

## Browser Compatibility

All DJ features require Web Audio API support:
- Chrome 34+
- Firefox 25+
- Safari 7+
- Edge 12+

Features NOT supported:
- Internet Explorer (any version)
- Opera Mini
- Legacy mobile browsers

## Performance Tips

1. **Effect Processing**: Effects are CPU-intensive. On lower-end devices, use fewer simultaneous effects.
2. **Smart Playlists**: Avoid overly complex filters with large libraries (>1000 tracks).
3. **Crossfade**: Longer crossfade durations require more memory for buffering.
4. **Tags**: Limit to 5-10 tags per track for optimal query performance.

## Links

- **Full Documentation**: `docs/DJ_FEATURES_GUIDE.md`
- **Main README**: `README.md`
- **Integration Guide**: `docs/INTEGRATION_GUIDE.md`
- **Database Migrations**: `database/migrations_dj_features.sql`
