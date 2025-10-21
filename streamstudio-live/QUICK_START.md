# Quick Start Guide

## Immediate Access

The Music & Jingles Management System is already deployed and ready to use:

**Control Panel**: https://dmhkgumaq1jh.space.minimax.io/control

**OBS Broadcast Overlay**: https://dmhkgumaq1jh.space.minimax.io/broadcast

## First Steps

### 1. Upload Your First Music Track

1. Open the Control Panel
2. In the "Music Library" section, drag and drop an MP3/WAV/OGG file onto the upload zone
3. Wait for the upload to complete
4. Your track will appear in the library below

### 2. Create a Playlist

1. In the "Playlists" section, click the **+** button
2. Enter a playlist name (e.g., "Background Music")
3. Click "Create"
4. Click on the playlist to select it

### 3. Play Music

1. Click the play button on any track in the library
2. Use the player controls:
   - **Play/Pause**: Start or pause playback
   - **Stop**: Stop and reset to beginning
   - **Previous/Next**: Navigate between tracks
   - **Shuffle**: Random track order
   - **Loop**: Repeat current track/playlist

### 4. Upload Jingles

1. In the Music Library, set the category filter to "Jingles"
2. Upload your jingle audio files
3. After upload, you can categorize them as:
   - Intro
   - Outro
   - Stinger
   - Custom

### 5. Trigger a Jingle

1. In the "Quick Jingles" section on the right
2. Click any jingle button for instant playback
3. The jingle plays over the background music

### 6. Configure Auto-Ducking

1. In the "Audio Ducking" section:
   - Check "Enable Auto-Ducking"
   - Adjust the ducking level slider (30% recommended)
2. When a jingle plays, background music will automatically reduce in volume
3. Music returns to normal volume when jingle ends

### 7. Set Up OBS Overlay

1. Open OBS Studio
2. Add a new **Browser Source**:
   - URL: `https://dmhkgumaq1jh.space.minimax.io/broadcast`
   - Width: `1920`
   - Height: `1080`
   - FPS: `30`
3. Check "Shutdown source when not visible"
4. Position the overlay in your scene

## Testing the System

### Test Audio Playback

1. Upload a music track
2. Click play
3. Verify audio plays in your browser
4. Check the audio visualizer shows activity

### Test Jingle + Ducking

1. Play background music
2. Enable auto-ducking
3. Trigger a jingle
4. Verify:
   - Background music volume reduces
   - Jingle plays clearly
   - Background music returns to normal after jingle

### Test Real-Time Sync

1. Open control panel in one browser tab
2. Open broadcast overlay in another tab (or OBS)
3. Play music in control panel
4. Verify "Now Playing" appears in broadcast overlay
5. Check that both stay synchronized

## Common Tasks

### Add Track to Playlist

(Feature to be added - currently playlists store track IDs but UI for adding is in development)

### Delete a Track

1. Hover over a track in the library
2. Click the trash icon that appears
3. Confirm deletion

### Adjust Volume

1. Use the volume slider in the player controls
2. Click the speaker icon to mute/unmute
3. Double-click the slider to reset to 100%

### Manual Duck

1. Click "Manual Duck" button in the Audio Ducking section
2. Background music reduces immediately
3. Click "Restore Volume" to return to normal

## Keyboard Shortcuts

- **Space**: Play/Pause
- **Left Arrow**: Previous track
- **Right Arrow**: Next track
- **M**: Mute/Unmute
- **1-9**: Trigger jingles (when implemented)

## Troubleshooting

### No Audio Playing

- Check browser's autoplay policy (click play after user interaction)
- Verify file was uploaded successfully
- Check browser console for errors
- Ensure volume is not at 0 or muted

### Upload Fails

- Check file size (max 50MB)
- Verify file format (MP3, WAV, OGG only)
- Check internet connection
- Try a different file

### OBS Overlay Not Showing

- Verify URL is correct
- Check OBS browser source settings
- Refresh the browser source
- Ensure music is playing in control panel

### Real-Time Sync Issues

- Refresh both control panel and overlay
- Check internet connection
- Verify Supabase is operational
- Check browser console for WebSocket errors

## Next Steps

1. Upload your complete music library
2. Create multiple playlists for different show segments
3. Upload and categorize all your jingles
4. Configure ducking to your preference
5. Set up the OBS overlay in your scenes
6. Test everything before going live

## Support

For detailed documentation, see:
- `README.md` - Full feature list and setup
- `docs/INTEGRATION_GUIDE.md` - Integration with existing dashboard
- `database/migrations.sql` - Database schema

---

**Enjoy your professional broadcast audio system!**
