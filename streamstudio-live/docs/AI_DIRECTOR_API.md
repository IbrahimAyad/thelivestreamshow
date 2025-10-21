# AI Director API Documentation

Comprehensive guide for programmatic control of the Music & Jingles Management System.

## Overview

The AI Director API allows external systems to control audio playback through Supabase Edge Functions. This enables automated audio control while maintaining manual UI control.

## Base URL

```
https://vcniezwtltraqramjlux.supabase.co/functions/v1
```

## Authentication

All requests require a Supabase anonymous key in the Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
  'Content-Type': 'application/json'
}
```

---

## Endpoints

### 1. Play Audio

Trigger audio playback by friendly name or UUID.

**Endpoint:** `POST /play-audio`

**Request Body:**
```json
{
  "audio_type": "jingle" | "music" | "playlist",
  "identifier": "intro" | "uuid",
  "action": "play" | "pause" | "stop",
  "volume": 0.7  // Optional, 0.0-1.0
}
```

**Parameters:**
- `audio_type` (required): Type of audio to control
  - `"jingle"`: Play a jingle sound
  - `"music"`: Play a music track
  - `"playlist"`: Play a playlist
- `identifier` (required): Friendly name (e.g., "intro") or UUID
- `action` (required): Action to perform
  - `"play"`: Start playback
  - `"pause"`: Pause current playback
  - `"stop"`: Stop and reset playback
- `volume` (optional): Set volume (0.0 to 1.0)

**Success Response (200 OK):**
```json
{
  "data": {
    "success": true,
    "message": "Playing jingle: Show Intro",
    "audio_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "now_playing": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Show Intro",
      "artist": "Production Music",
      "duration": 5,
      "friendly_name": "intro"
    },
    "playback_state": {
      "is_playing": true,
      "volume": 0.7,
      "current_track_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  }
}
```

**Error Response (500):**
```json
{
  "error": {
    "code": "PLAY_AUDIO_FAILED",
    "message": "Audio not found: intro"
  }
}
```

**Examples:**

```javascript
// Play intro jingle
await fetch('https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audio_type: 'jingle',
    identifier: 'intro',
    action: 'play'
  })
});

// Play background music with custom volume
await fetch('https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audio_type: 'music',
    identifier: 'jazz-background',
    action: 'play',
    volume: 0.5
  })
});

// Pause current playback
await fetch('https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audio_type: 'music',
    identifier: 'any',
    action: 'pause'
  })
});
```

---

### 2. Get Audio List

Query all available audio tracks, jingles, and playlists.

**Endpoint:** `GET /get-audio-list`

**Request:** No body required (GET request)

**Success Response (200 OK):**
```json
{
  "data": {
    "jingles": [
      {
        "id": "uuid-1",
        "name": "intro",
        "title": "Show Intro",
        "type": "intro",
        "duration": 5,
        "format": "mp3"
      },
      {
        "id": "uuid-2",
        "name": "outro",
        "title": "Show Outro",
        "type": "outro",
        "duration": 7,
        "format": "wav"
      }
    ],
    "music": [
      {
        "id": "uuid-3",
        "name": "jazz-background",
        "title": "Smooth Jazz Background",
        "artist": "Production Music",
        "album": "Background Tracks Vol. 1",
        "duration": 180,
        "format": "mp3"
      }
    ],
    "playlists": [
      {
        "id": "uuid-4",
        "name": "Main Background",
        "description": "Main background music rotation",
        "track_count": 10
      }
    ],
    "total_count": {
      "jingles": 2,
      "music": 1,
      "playlists": 1
    }
  }
}
```

**Example:**

```javascript
const response = await fetch('https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-audio-list', {
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
  }
});

const { data } = await response.json();
console.log('Available jingles:', data.jingles);
console.log('Available music:', data.music);
console.log('Available playlists:', data.playlists);
```

---

## Friendly Names

Friendly names are unique identifiers for AI reference. When uploading audio through the UI, you can set a friendly name that the AI Director can use instead of UUIDs.

**Best Practices:**
- Use lowercase with dashes: `intro`, `outro`, `thinking`, `jazz-background`
- Keep names descriptive but concise
- Avoid special characters (only alphanumeric and dashes)
- Ensure uniqueness across all audio files

**Example Friendly Names:**
- Jingles: `intro`, `outro`, `stinger-1`, `thinking`, `applause`
- Music: `jazz-background`, `upbeat-intro`, `calm-background`, `energetic`
- Playlists: Use the playlist name directly

---

## Integration Examples

### AI Director Command Parser

Parse natural language commands into API calls:

```javascript
class AIDirector {
  constructor(supabaseUrl, supabaseAnonKey) {
    this.apiBase = `${supabaseUrl}/functions/v1`;
    this.headers = {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    };
  }

  async parseAndExecute(command) {
    const lowerCommand = command.toLowerCase();
    
    // Play intro jingle
    if (lowerCommand.includes('play intro')) {
      return this.playAudio('jingle', 'intro', 'play');
    }
    
    // Play outro jingle
    if (lowerCommand.includes('play outro')) {
      return this.playAudio('jingle', 'outro', 'play');
    }
    
    // Play thinking sound
    if (lowerCommand.includes('play thinking') || lowerCommand.includes('sound thinking')) {
      return this.playAudio('jingle', 'thinking', 'play');
    }
    
    // Start background music
    if (lowerCommand.includes('start background') || lowerCommand.includes('play background')) {
      return this.playAudio('music', 'jazz-background', 'play', 0.4);
    }
    
    // Stop music
    if (lowerCommand.includes('stop music') || lowerCommand.includes('stop background')) {
      return this.playAudio('music', 'any', 'stop');
    }
    
    throw new Error(`Unknown command: ${command}`);
  }

  async playAudio(audioType, identifier, action, volume = null) {
    const body = {
      audio_type: audioType,
      identifier,
      action
    };
    
    if (volume !== null) {
      body.volume = volume;
    }
    
    const response = await fetch(`${this.apiBase}/play-audio`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    
    return await response.json();
  }

  async getAvailableAudio() {
    const response = await fetch(`${this.apiBase}/get-audio-list`, {
      headers: this.headers
    });
    
    return await response.json();
  }
}

// Usage
const director = new AIDirector(
  'https://vcniezwtltraqramjlux.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
);

// Parse commands
await director.parseAndExecute('play intro');
await director.parseAndExecute('start background music');
await director.parseAndExecute('play sound thinking');
await director.parseAndExecute('stop music');
```

### Python Integration

```python
import requests
import json

class AIDirector:
    def __init__(self, supabase_url, supabase_anon_key):
        self.api_base = f"{supabase_url}/functions/v1"
        self.headers = {
            'Authorization': f'Bearer {supabase_anon_key}',
            'Content-Type': 'application/json'
        }
    
    def play_audio(self, audio_type, identifier, action, volume=None):
        body = {
            'audio_type': audio_type,
            'identifier': identifier,
            'action': action
        }
        
        if volume is not None:
            body['volume'] = volume
        
        response = requests.post(
            f"{self.api_base}/play-audio",
            headers=self.headers,
            json=body
        )
        
        return response.json()
    
    def get_audio_list(self):
        response = requests.get(
            f"{self.api_base}/get-audio-list",
            headers=self.headers
        )
        
        return response.json()

# Usage
director = AIDirector(
    'https://vcniezwtltraqramjlux.supabase.co',
    'YOUR_SUPABASE_ANON_KEY'
)

# Play intro jingle
result = director.play_audio('jingle', 'intro', 'play')
print(f"Playing: {result['data']['message']}")

# Get available audio
audio_list = director.get_audio_list()
print(f"Available jingles: {len(audio_list['data']['jingles'])}")
```

---

## Real-Time Synchronization

All API-triggered actions update the `audio_playback_state` table in real-time, which automatically syncs to:

1. **Control Panel UI** - Shows AI-triggered playback with indicator
2. **Broadcast Overlay** - Updates "Now Playing" display
3. **Manual Controls** - Reflects current state

No additional configuration needed - synchronization is automatic.

---

## Error Handling

**Common Errors:**

1. **Audio not found**
   ```json
   {
     "error": {
       "code": "PLAY_AUDIO_FAILED",
       "message": "Audio not found: intro"
     }
   }
   ```
   **Solution:** Check friendly name spelling or use UUID. Call `/get-audio-list` to see available audio.

2. **Invalid action**
   ```json
   {
     "error": {
       "code": "PLAY_AUDIO_FAILED",
       "message": "Invalid action: resume"
     }
   }
   ```
   **Solution:** Use only `play`, `pause`, or `stop` actions.

3. **Missing parameters**
   ```json
   {
     "error": {
       "code": "PLAY_AUDIO_FAILED",
       "message": "Missing required parameters: audio_type, identifier, action"
     }
   }
   ```
   **Solution:** Ensure all required fields are present in request body.

---

## Testing

Test API endpoints using curl:

```bash
# Get audio list
curl -X GET \
  https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-audio-list \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY'

# Play intro jingle
curl -X POST \
  https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "audio_type": "jingle",
    "identifier": "intro",
    "action": "play"
  }'
```

---

## Rate Limiting

Supabase Edge Functions have the following limits:
- **Invocations**: 500,000 per month (free tier)
- **Execution time**: 50 seconds per invocation
- **Concurrent requests**: Limited by Supabase plan

For high-frequency automation, consider implementing client-side caching and debouncing.

---

## Security Notes

1. **Use Anonymous Key:** The examples use the Supabase anonymous key, which is safe for client-side use with proper RLS policies.

2. **RLS Policies:** Database row-level security ensures only authorized operations are allowed.

3. **Rate Limiting:** Implement client-side rate limiting for AI-driven automation to prevent abuse.

4. **Validation:** All inputs are validated server-side before execution.

---

## Support

For API issues:
- Check edge function logs in Supabase Dashboard
- Verify authentication headers
- Ensure friendly names exist in database
- Test with `/get-audio-list` first

**Supabase Project URL:** https://vcniezwtltraqramjlux.supabase.co

**Edge Function URLs:**
- Play Audio: https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio
- Get Audio List: https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-audio-list
