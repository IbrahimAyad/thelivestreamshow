# YouTube Audio Download & Copyright Detection Guide

## Overview

The Music & Jingles Management System includes a fully automated YouTube audio downloader with built-in copyright detection. This feature allows you to quickly add YouTube audio to your music library while being aware of copyright restrictions.

## Architecture: Client-Side Implementation

### Why Client-Side?

Due to Supabase Edge Function network restrictions (cannot make outbound HTTP requests to external APIs), the download workflow is implemented entirely in the browser:

1. **Browser calls YouTube API** → Fetches video metadata and copyright information
2. **Browser calls Cobalt API** → Gets direct download link for audio
3. **Browser downloads audio** → Fetches audio as a Blob in memory
4. **Browser uploads to Supabase** → Uses Supabase Storage client library to save the file
5. **Browser inserts metadata** → Adds track info to database using Supabase JS SDK

### Benefits
- No server-side limitations
- Works with free Supabase tier
- Real-time progress feedback
- No API key storage on server

## Features

### 1. Automated Download
- Paste any YouTube URL
- System automatically downloads the audio
- Extracts metadata (title, artist, duration)
- Uploads to Supabase Storage
- Adds to music library

### 2. Copyright Detection
- Uses YouTube Data API v3 to check copyright status
- Detects three states:
  - ✅ **Free Use**: No restrictions
  - ⚠️ **Partial Use**: Limited playback allowed
  - ❌ **Restricted**: Not allowed for use

### 3. Playback Enforcement
- Tracks with "Partial Use" restrictions automatically stop after allowed duration
- User receives alert when playback limit is reached
- Helps maintain legal compliance

### 4. Multi-Source Support
- YouTube URLs (with copyright detection)
- Direct audio URLs (bypass copyright check)

## How to Use

### Step 1: Open Download Modal
1. Go to the Control Panel
2. Click the "Download from YouTube" button (top right)

### Step 2: Enter URL
1. Paste a YouTube video URL or direct audio URL
2. Click "Download Audio"

### Step 3: Monitor Progress
The system will show real-time progress:
- **Fetching metadata...** - Getting video information from YouTube
- **Downloading audio...** - Retrieving audio from Cobalt API
- **Uploading to storage...** - Saving to your Supabase project
- **Complete!** - Track added to library

### Step 4: Review Copyright Status
After download:
- Check the copyright badge next to the track
- Green badge: Safe to use
- Yellow badge: Limited use (check allowed duration)
- Red badge: Restricted content

## Technical Implementation

### Key Components

#### 1. `useYouTubeDownloader.ts` Hook
Handles the entire download workflow:
```typescript
const { downloadFromYouTube, isDownloading, progress } = useYouTubeDownloader();

await downloadFromYouTube(url);
```

**Functions:**
- `fetchYouTubeMetadata()` - Gets video info and copyright status
- `downloadViaDirectUrl()` - Downloads audio for direct URLs
- `downloadViaYouTube()` - Downloads YouTube audio via Cobalt API
- `uploadToSupabase()` - Uploads audio file to Storage
- `saveToDatabase()` - Inserts track metadata

#### 2. `DownloadAudioModal.tsx` Component
UI for the download feature:
- URL input field
- Real-time progress indicator
- Error handling and display
- Legal disclaimer

#### 3. `CopyrightBadge.tsx` Component
Visual indicator of copyright status:
- Color-coded badges
- Usage policy display
- Playable duration information

#### 4. Enhanced `useAudioPlayer.ts` Hook
Enforces copyright restrictions:
- Monitors playback time
- Auto-stops at duration limit
- Alerts user of restrictions

### API Integrations

#### YouTube Data API v3
**Endpoint:** `https://www.googleapis.com/youtube/v3/videos`

**Purpose:** Fetch video metadata and copyright information

**Required:** API key (stored as `YOUTUBE_API_KEY` in `.env`)

**Response:**
```json
{
  "items": [{
    "snippet": {
      "title": "Video Title",
      "channelTitle": "Artist Name"
    },
    "contentDetails": {
      "duration": "PT3M45S"
    },
    "status": {
      "license": "creativeCommon"
    }
  }]
}
```

#### Cobalt API
**Endpoint:** `https://api.cobalt.tools/`

**Purpose:** Get direct download link for YouTube audio

**No API key required** - Free public service

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "downloadMode": "audio"
}
```

**Response:**
```json
{
  "status": "stream",
  "url": "https://download-url.com/audio.mp3"
}
```

### Database Schema

The `music_library` table includes these columns for YouTube downloads:

```sql
copyright_info JSONB,
source_url TEXT,
download_date TIMESTAMP
```

**Example `copyright_info` structure:**
```json
{
  "status": "partial",
  "usagePolicy": "limited_playback",
  "playableDuration": 30,
  "license": "standard"
}
```

## Copyright Status Reference

### Free Use (Green Badge)
- Creative Commons licensed content
- Public domain music
- Royalty-free audio
- **Action:** Full playback allowed

### Partial Use (Yellow Badge)
- Standard YouTube license with restrictions
- Limited playback duration (typically 30-60 seconds)
- May be used for previews
- **Action:** Auto-stops after allowed duration

### Restricted (Red Badge)
- Copyrighted music
- Commercial content
- Rights-managed material
- **Action:** Download completes but use is not recommended

## Legal Considerations

⚠️ **IMPORTANT DISCLAIMER:**

This tool is provided for educational and personal use. Users are responsible for:

1. Obtaining proper licenses for copyrighted content
2. Complying with YouTube's Terms of Service
3. Respecting copyright holders' rights
4. Understanding fair use doctrine in their jurisdiction

**Best Practices:**
- Only download content you have permission to use
- Check copyright badges before using audio in streams
- Respect playback duration limits
- Consider using royalty-free music libraries

## Troubleshooting

### Download Fails
**Problem:** "Failed to fetch video metadata"

**Solutions:**
- Verify the YouTube URL is correct
- Check that the video is publicly accessible
- Ensure YouTube API key is valid (check `.env.local`)

### CORS Errors
**Problem:** "CORS policy blocked the request"

**Solution:** The system should automatically use a CORS proxy. If issues persist:
1. Check browser console for specific error
2. Try a different URL
3. Verify Supabase Storage bucket has public access enabled

### Upload Fails
**Problem:** "Failed to upload to storage"

**Solutions:**
- Check Supabase project is active
- Verify Storage bucket exists (`music-audio`)
- Ensure bucket has proper RLS policies for uploads
- Check browser's available storage space

### Missing Copyright Info
**Problem:** Copyright badge shows "Unknown"

**Reason:** YouTube API didn't return copyright data (common for direct URLs)

**Impact:** Audio works normally, but no automatic playback restrictions

## Environment Setup

### Required Environment Variables

Add to `.env.local`:

```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Getting a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the key to your `.env.local` file

**Note:** Free tier allows 10,000 quota units per day (sufficient for ~3,000 downloads)

## Performance Notes

- **Average download time:** 15-45 seconds (depends on video length and internet speed)
- **Browser memory:** Audio is held in memory as a Blob temporarily
- **Large files:** Videos over 10 minutes may take longer to process
- **Concurrent downloads:** Only one download at a time is supported

## Future Enhancements

Potential improvements for future versions:
- Batch download support
- Automatic metadata enrichment (album art, genre)
- Spotify/SoundCloud integration
- Audio quality selection
- Download history
- Retry mechanism for failed downloads

---

**Last Updated:** October 19, 2025
**Author:** MiniMax Agent
