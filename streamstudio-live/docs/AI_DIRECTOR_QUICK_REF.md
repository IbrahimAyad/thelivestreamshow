# AI Director Quick Reference

Fast reference guide for controlling audio programmatically.

## API Endpoints

### Base URL
```
https://vcniezwtltraqramjlux.supabase.co/functions/v1
```

### Authentication Header
```javascript
headers: {
  'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
  'Content-Type': 'application/json'
}
```

---

## Common Commands

### Play Intro Jingle
```bash
curl -X POST https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio \
  -H 'Authorization: Bearer YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"audio_type":"jingle","identifier":"intro","action":"play"}'
```

### Play Outro Jingle
```bash
curl -X POST https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio \
  -H 'Authorization: Bearer YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"audio_type":"jingle","identifier":"outro","action":"play"}'
```

### Start Background Music
```bash
curl -X POST https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio \
  -H 'Authorization: Bearer YOUR_KEY' \
  -H 'Content-Type': application/json' \
  -d '{"audio_type":"music","identifier":"jazz-background","action":"play","volume":0.4}'
```

### Stop Music
```bash
curl -X POST https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio \
  -H 'Authorization: Bearer YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"audio_type":"music","identifier":"any","action":"stop"}'
```

### List Available Audio
```bash
curl https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-audio-list \
  -H 'Authorization: Bearer YOUR_KEY'
```

---

## JavaScript Examples

### Simple Helper Function
```javascript
async function playAudio(type, name, action, volume = null) {
  const body = { audio_type: type, identifier: name, action };
  if (volume) body.volume = volume;
  
  const response = await fetch(
    'https://vcniezwtltraqramjlux.supabase.co/functions/v1/play-audio',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  
  return await response.json();
}

// Usage
await playAudio('jingle', 'intro', 'play');
await playAudio('music', 'jazz-background', 'play', 0.5);
await playAudio('music', 'any', 'stop');
```

### Natural Language Parser
```javascript
async function executeCommand(command) {
  const cmd = command.toLowerCase();
  
  if (cmd.includes('play intro')) {
    return await playAudio('jingle', 'intro', 'play');
  }
  if (cmd.includes('play outro')) {
    return await playAudio('jingle', 'outro', 'play');
  }
  if (cmd.includes('start music')) {
    return await playAudio('music', 'jazz-background', 'play', 0.4);
  }
  if (cmd.includes('stop music')) {
    return await playAudio('music', 'any', 'stop');
  }
  
  throw new Error('Unknown command');
}

// Usage
await executeCommand('play intro');
await executeCommand('start music');
```

---

## Python Examples

```python
import requests

BASE_URL = "https://vcniezwtltraqramjlux.supabase.co/functions/v1"
AUTH_KEY = "YOUR_SUPABASE_ANON_KEY"

def play_audio(audio_type, identifier, action, volume=None):
    headers = {
        'Authorization': f'Bearer {AUTH_KEY}',
        'Content-Type': 'application/json'
    }
    
    body = {
        'audio_type': audio_type,
        'identifier': identifier,
        'action': action
    }
    
    if volume:
        body['volume'] = volume
    
    response = requests.post(
        f"{BASE_URL}/play-audio",
        headers=headers,
        json=body
    )
    
    return response.json()

# Usage
play_audio('jingle', 'intro', 'play')
play_audio('music', 'jazz-background', 'play', 0.5)
play_audio('music', 'any', 'stop')
```

---

## Response Formats

### Success
```json
{
  "data": {
    "success": true,
    "message": "Playing jingle: Show Intro",
    "audio_id": "uuid",
    "now_playing": {
      "id": "uuid",
      "title": "Show Intro",
      "friendly_name": "intro",
      "duration": 5
    }
  }
}
```

### Error
```json
{
  "error": {
    "code": "PLAY_AUDIO_FAILED",
    "message": "Audio not found: intro"
  }
}
```

---

## Friendly Names Setup

When uploading audio through the UI:

1. Click "Upload Audio Files"
2. Select your file(s)
3. Enter a **Friendly Name** (e.g., `intro`, `outro`, `jazz-background`)
4. Upload

The friendly name becomes the API identifier.

**Naming Rules:**
- Lowercase with dashes
- Alphanumeric only
- Must be unique
- Examples: `intro`, `outro`, `thinking`, `jazz-background`

---

## Troubleshooting

**"Audio not found"**
- Check friendly name spelling
- List available audio: `GET /get-audio-list`
- Use UUID instead of friendly name

**"Invalid action"**
- Use only: `play`, `pause`, `stop`

**No response**
- Verify Supabase URL
- Check authentication header
- Ensure edge functions are deployed

---

For complete documentation, see <filepath>docs/AI_DIRECTOR_API.md</filepath>
