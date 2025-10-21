# Track Analysis Integration Guide

## Overview

Phase 2 of the AI DJ System adds automatic audio analysis capabilities using Essentia.js to detect BPM (beats per minute), musical key, and energy level for all tracks. This enables intelligent track selection, harmonic mixing, and beatmatching for DJ-style playback.

## Features

### 1. Automatic Analysis on Upload

When you upload a new audio file, the system automatically:
- Analyzes the track in the background (non-blocking)
- Detects BPM using RhythmExtractor2013 algorithm
- Identifies musical key using KeyExtractor (Krumhansl-Schmuckler algorithm)
- Calculates energy level (1-10 scale) based on RMS energy
- Saves results to database for future use

### 2. Batch Analysis

The **Track Analyzer Panel** (in DJ Tools section) allows you to:
- Analyze all pending tracks with one click
- Re-analyze previously completed tracks (optional)
- Process 3 tracks in parallel for faster completion
- View real-time progress with track counts and percentage
- See success/failure statistics after completion

### 3. Visual Indicators

Each track displays analysis results as colored badges:

**BPM Badge** (Purple)
- Shows detected tempo (e.g., "128.5 BPM")
- Useful for beatmatching and tempo-based selection

**Musical Key Badge** (Green)
- Displays detected key (e.g., "C Major", "A Minor")
- Enables harmonic mixing (compatible key selection)

**Energy Level Badge** (Color-coded)
- Blue (E1-E3): Low energy, calm tracks
- Yellow (E4-E7): Medium energy, moderate intensity
- Red (E8-E10): High energy, intense tracks

**Analyzing Spinner**
- Shows when a track is currently being analyzed
- Indicates background processing in progress

### 4. Smart Playlist BPM Filter

The Smart Playlist Builder now includes:
- **BPM Range Slider**: Filter tracks by tempo (60-200 BPM)
- **Dual Sliders**: Set minimum and maximum BPM independently
- **Step Increment**: 5 BPM increments for precise control
- **Integration**: Works alongside existing filters (tags, mood, energy, duration)

## Technical Details

### Essentia.js Integration

**Library**: Essentia.js v0.1.3 (CDN-loaded)
- `essentia-wasm.web.js`: WebAssembly module
- `essentia.js-core.js`: Core JavaScript API

**Algorithms Used**:
1. **RhythmExtractor2013**: Detects BPM with high accuracy
2. **KeyExtractor**: Identifies musical key (24 possible keys)
3. **RMS**: Calculates root mean square energy

**Processing Flow**:
1. Fetch audio file from URL
2. Decode to AudioBuffer using Web Audio API
3. Extract mono channel data
4. Convert to Essentia vector format
5. Apply analysis algorithms
6. Map results to readable formats
7. Save to database

### Database Schema

**New Columns in `music_library`**:
```sql
bpm REAL                           -- Detected tempo (e.g., 120.5)
musical_key TEXT                   -- Key name (e.g., "C Major")
analysis_status TEXT DEFAULT 'pending'  -- Status: pending, analyzing, complete, failed
analysis_date TIMESTAMP WITH TIME ZONE  -- When analysis completed
```

**Indexes** (for performance):
- `idx_music_library_bpm`
- `idx_music_library_musical_key`
- `idx_music_library_analysis_status`

**Check Constraint**:
- Ensures `analysis_status` is one of: pending, analyzing, complete, failed

### Client-Side Architecture

**Non-Blocking Design**:
- Upload completes immediately
- Analysis runs in background
- UI updates automatically when complete
- No page reload required

**Parallel Processing**:
- Batch analyzer processes 3 tracks simultaneously
- Uses `Promise.all()` for concurrent execution
- Reduces total analysis time significantly

**Graceful Degradation**:
- If Essentia.js fails to load, analysis status = 'failed'
- Default fallback values used
- No impact on other system features

## Usage Guide

### Analyzing a Single Track

1. Upload a new audio file using "Upload Files" button
2. File uploads to Supabase Storage
3. Track appears in list with "Analyzing..." spinner
4. After 10-60 seconds (depending on file size):
   - Spinner disappears
   - BPM, key, and energy badges appear
   - Track is ready for intelligent selection

### Batch Analyzing All Tracks

1. Click "DJ Tools" button in header
2. Scroll to "Track Analysis" panel (below Crossfade Controls)
3. Optional: Check "Re-analyze completed tracks" to update all
4. Click "Analyze All Tracks" button
5. Monitor progress:
   - Progress bar shows completion percentage
   - Current track name displayed
   - Success/failure counts update in real-time
6. Wait for completion alert
7. All tracks now have analysis data

### Creating BPM-Filtered Smart Playlists

1. Click "DJ Tools" in header
2. In Smart Playlists section, click "Create"
3. Configure filters:
   - Tags, moods, energy (existing filters)
   - **BPM Range**: Adjust sliders (e.g., 120-140 for house music)
   - Categories, duration (existing filters)
4. Click "Preview Matching Tracks" to see count
5. Name your playlist (e.g., "Upbeat House 120-140")
6. Click "Create Smart Playlist"
7. Load playlist for playback

## Use Cases

### 1. Beatmatching DJ Sets

**Scenario**: Create seamless transitions between tracks

**Steps**:
1. Analyze all tracks to get BPM
2. Create smart playlist: BPM 125-135, Energy 6-10
3. Enable crossfade (5-10 seconds)
4. Play playlist with shuffle for natural flow
5. Tracks will transition smoothly at similar tempos

### 2. Harmonic Mixing

**Scenario**: Mix tracks in compatible musical keys

**Steps**:
1. Analyze tracks to get keys
2. Reference Camelot Wheel for compatible keys:
   - Same key (e.g., C Major → C Major)
   - Relative minor/major (e.g., C Major → A Minor)
   - Adjacent keys (e.g., C Major → G Major)
3. Manually build playlist with compatible keys
4. Future enhancement: Auto-suggest next track by key compatibility

### 3. Energy Progression

**Scenario**: Build dynamic show flow

**Steps**:
1. Analyze tracks for energy levels
2. Create playlists for show segments:
   - Opening: Energy 3-5, BPM 90-110 (calm intro)
   - Main Show: Energy 5-7, BPM 110-130 (moderate)
   - Peak: Energy 8-10, BPM 130-150 (high intensity)
   - Closing: Energy 2-4, BPM 80-100 (wind down)
3. Switch playlists during live stream

### 4. Genre-Specific Collections

**Common BPM Ranges by Genre**:
- Hip-Hop: 80-115 BPM
- House: 120-130 BPM
- Techno: 125-135 BPM
- Trance: 130-145 BPM
- Drum & Bass: 160-180 BPM

**Create Smart Playlists**:
1. Analyze all tracks
2. Filter by BPM range + mood/tags
3. Example: "Chill House" = 120-128 BPM, Calm/Chill mood

## Troubleshooting

### Analysis Stuck on "Analyzing..."

**Cause**: Browser tab in background or audio file too large

**Solution**:
- Keep browser tab active during analysis
- For large files (>10 MB), analysis may take 1-2 minutes
- Check browser console for errors
- Try re-analyzing from batch panel

### Analysis Status Shows "Failed"

**Possible Causes**:
1. Essentia.js failed to load from CDN
2. Audio file corrupted or unsupported format
3. Network error during file fetch

**Solutions**:
- Check internet connection
- Ensure audio file is valid (MP3, WAV, OGG)
- Try re-uploading the file
- Check browser console for detailed error

### BPM Seems Incorrect

**Cause**: Algorithm detected half-time or double-time

**Examples**:
- Detected 60 BPM → Actual 120 BPM (half-time)
- Detected 180 BPM → Actual 90 BPM (double-time)

**Solution**:
- Mentally adjust (multiply or divide by 2)
- Future enhancement: Manual BPM override

### Musical Key Seems Wrong

**Cause**: Key detection is complex and may fail for:
- Tracks with no clear tonality
- Atonal or experimental music
- Multiple key changes in track

**Solution**:
- Use energy and BPM for selection instead
- Future enhancement: Manual key override

## Performance Considerations

### Analysis Speed

**Factors**:
- File size: Larger files take longer
- File duration: Longer tracks take more time
- Browser performance: Faster CPU = faster analysis

**Typical Times**:
- 3 MB, 3-minute track: 15-30 seconds
- 10 MB, 5-minute track: 45-90 seconds
- 20 MB, 10-minute track: 2-3 minutes

### Batch Processing

**Parallel Limit**: 3 tracks at once
- Balance between speed and browser stability
- Prevents memory overflow on large batches
- Total time = (Total tracks / 3) × Average analysis time

**Example**:
- 30 tracks, 30 seconds average each
- Sequential: 30 × 30s = 15 minutes
- Parallel (3): (30 / 3) × 30s = 5 minutes
- **67% faster** with parallel processing

## Future Enhancements

### Planned Features

1. **Auto-DJ Mode**
   - Automatically select next track by BPM similarity
   - Suggest harmonic key matches
   - Build dynamic playlists on-the-fly

2. **Manual Override**
   - Edit detected BPM/key if incorrect
   - Save custom analysis results

3. **Advanced Filters**
   - Camelot Wheel integration for key selection
   - BPM matching tolerance (±5 BPM)
   - Automatic genre classification

4. **Beatgrid Detection**
   - Analyze beat positions for precise alignment
   - Enable quantized crossfades
   - Support for complex time signatures

5. **Waveform Analysis**
   - Detect intro/outro lengths
   - Find optimal crossfade points
   - Identify breaks and build-ups

## API Reference

### trackAnalyzer.ts

```typescript
/**
 * Analyze audio file to extract BPM, musical key, and energy level
 */
export async function analyzeAudioFile(
  fileUrl: string,
  onProgress?: (progress: number) => void
): Promise<AnalysisResult>

/**
 * Check if Essentia.js is loaded and ready
 */
export function isEssentiaAvailable(): boolean

interface AnalysisResult {
  bpm: number              // Beats per minute (e.g., 128.5)
  musicalKey: string       // Key name (e.g., "C Major")
  energyLevel: number      // 1-10 scale
  analysisStatus: 'complete' | 'failed'
}
```

### Database Fields

```typescript
interface MusicTrack {
  // ... existing fields
  bpm?: number | null
  musical_key?: string | null
  analysis_status?: 'pending' | 'analyzing' | 'complete' | 'failed'
  analysis_date?: string | null
}

interface SmartPlaylistFilter {
  // ... existing filters
  bpmRange?: [number, number]  // [min, max] BPM
}
```

## Credits

**Technology Stack**:
- **Essentia.js**: Open-source audio analysis library by MTG (Music Technology Group)
- **Web Audio API**: Browser-native audio processing
- **React + TypeScript**: UI framework
- **Supabase**: Database and storage

**Algorithms**:
- RhythmExtractor2013: Percival, G., & Tzanetakis, G. (2014)
- KeyExtractor: Krumhansl-Schmuckler key-finding algorithm

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Essentia.js CDN is accessible
3. Ensure Supabase connection is active
4. Review this guide for common solutions

---

**Version**: Phase 2 (October 20, 2025)
**Status**: Production Ready
**Deployment**: https://yzclirh8yi8j.space.minimax.io
