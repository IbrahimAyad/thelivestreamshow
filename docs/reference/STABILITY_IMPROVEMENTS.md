# 🛠️ Stability Improvements & Enhancements Plan

## Issues Found Today & Solutions

### 1. ❌ Audio Playback Stopped After 1 Second
**Problem:** Browser Audio element couldn't route to custom audio devices (Loopback/BlackHole)
**Solution:** ✅ Implemented backend audio playback via `/api/betabot/play-audio`
**Status:** FIXED - Audio now plays through system output (Loopback)

### 2. ❌ Audio Duration Estimation Inaccurate
**Problem:** Using blob size to estimate duration is unreliable
**Current Code:**
```typescript
const estimatedDuration = (audioBlob.size / 88000) * 5000; // Very rough!
```
**Better Solution:** Get actual duration from WAV file header
**Priority:** MEDIUM

### 3. ❌ No Audio Playback Feedback
**Problem:** Frontend doesn't know when backend finishes playing audio
**Impact:** isSpeaking state may be wrong, UI shows incorrect status
**Solution:** Backend should notify frontend via WebSocket when playback completes
**Priority:** HIGH

### 4. ❌ Complex Audio Routing Confusion
**Problem:** Multi-Output vs Aggregate vs Loopback - too confusing
**Documentation:** Created multiple guides but still complex
**Solution:** Simplify to ONE recommended setup in Loopback
**Priority:** HIGH

### 5. ⚠️ No Error Recovery
**Problem:** If Piper TTS fails, no fallback mechanism
**Solution:** Add fallback to browser TTS or cached audio
**Priority:** MEDIUM

### 6. ❌ Backend Temp Files Not Cleaned Up on Error
**Problem:** If playback fails, temp WAV files accumulate
**Current:** Cleanup only happens on success
**Solution:** Use try/finally to always cleanup
**Priority:** LOW

---

## 🔧 Recommended Fixes (Priority Order)

### HIGH PRIORITY

#### 1. Add WebSocket Notification for Audio Playback Complete
**File:** `backend/server.js`
**Change:**
```javascript
// After afplay completes
await execPromise(`afplay "${tempFile}"`);
console.log('✅ BetaBot audio playback complete');

// NEW: Notify frontend via WebSocket
this.broadcast({
    type: 'audio_playback_complete',
    timestamp: Date.now()
});
```

**File:** `src/hooks/useF5TTS.ts`
**Change:**
```typescript
// Listen for WebSocket message
useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'audio_playback_complete') {
            setIsSpeaking(false);
            onStateChangeRef.current?.('idle');
        }
    };
    return () => ws.close();
}, []);
```

#### 2. Simplify Audio Routing Documentation
**Create:** `SIMPLE_AUDIO_SETUP.md`
**Content:** ONE clear path - all-in-Loopback approach
- Step 1: Configure Loopback sources
- Step 2: Configure Loopback monitors
- Step 3: Set Discord devices
- NO mention of Multi-Output, Aggregate, or hardware monitoring

#### 3. Add Health Check Dashboard
**Create:** Visual indicator in BetaBot Control Panel showing:
- ✅ Backend Server (port 3001)
- ✅ Piper TTS (port 8000)
- ✅ Loopback Audio (system output)
- ✅ Scarlett Solo (connected)
- ✅ Audio routing (working)

**Implementation:**
```typescript
// New component: src/components/AudioHealthCheck.tsx
export function AudioHealthCheck() {
  const [status, setStatus] = useState({
    backend: false,
    piperTTS: false,
    loopback: false,
    scarlett: false
  });

  useEffect(() => {
    // Check all services every 5 seconds
    const check = async () => {
      const backend = await fetch('http://localhost:3001/api/health')
        .then(r => r.ok).catch(() => false);
      
      const piper = await fetch('http://localhost:8000/health')
        .then(r => r.ok).catch(() => false);
      
      // Check audio devices via backend
      const audio = await fetch('http://localhost:3001/api/audio/status')
        .then(r => r.json()).catch(() => ({}));
      
      setStatus({
        backend,
        piperTTS: piper,
        loopback: audio.loopbackActive,
        scarlett: audio.scarlettConnected
      });
    };
    
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="health-check-panel">
      <StatusIndicator label="Backend" status={status.backend} />
      <StatusIndicator label="Piper TTS" status={status.piperTTS} />
      <StatusIndicator label="Audio Output" status={status.loopback} />
      <StatusIndicator label="Microphone" status={status.scarlett} />
    </div>
  );
}
```

---

### MEDIUM PRIORITY

#### 4. Get Actual Audio Duration from WAV Header
**File:** `backend/server.js`
**Add function:**
```javascript
function getWavDuration(filePath) {
    const fs = require('fs');
    const buffer = fs.readFileSync(filePath);
    
    // WAV file structure:
    // Bytes 0-3: "RIFF"
    // Bytes 4-7: File size
    // Bytes 8-11: "WAVE"
    // Bytes 24-27: Sample rate
    // Bytes 28-31: Byte rate
    // Bytes 40-43: Data chunk size
    
    const sampleRate = buffer.readUInt32LE(24);
    const byteRate = buffer.readUInt32LE(28);
    const dataSize = buffer.readUInt32LE(40);
    
    const duration = (dataSize / byteRate) * 1000; // milliseconds
    return duration;
}

// Use in play-audio route:
const duration = getWavDuration(tempFile);
console.log(`🎤 Playing BetaBot TTS (${(duration/1000).toFixed(1)}s)...`);

// Return duration to frontend
res.json({ success: true, duration });
```

#### 5. Add TTS Fallback Mechanism
**File:** `src/hooks/useF5TTS.ts`
**Enhancement:**
```typescript
const speak = useCallback(async (text: string, onStateChange?) => {
  try {
    // Try Piper TTS first
    await speakWithPiper(text);
  } catch (piperError) {
    console.warn('Piper TTS failed, falling back to browser TTS');
    
    // Fallback to Web Speech API
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = speechSynthesis.getVoices()
      .find(v => v.name.includes('Daniel')) || null;
    
    setIsSpeaking(true);
    onStateChange?.('speaking');
    
    utterance.onend = () => {
      setIsSpeaking(false);
      onStateChange?.('idle');
    };
    
    speechSynthesis.speak(utterance);
  }
}, []);
```

#### 6. Add Audio Device Auto-Discovery
**Create:** `backend/audio-discovery.js`
**Purpose:** Automatically detect and configure optimal audio routing
```javascript
class AudioDiscovery {
  async findOptimalSetup() {
    const devices = await this.getAllAudioDevices();
    
    // Look for Loopback
    const loopback = devices.output.find(d => d.includes('Loopback'));
    
    // Look for Scarlett
    const scarlett = devices.input.find(d => d.includes('Scarlett'));
    
    // Look for BlackHole
    const blackhole = devices.output.find(d => d.includes('BlackHole'));
    
    return {
      recommended: {
        systemOutput: loopback || 'Default',
        systemInput: scarlett || 'Default',
        discordInput: loopback || scarlett,
        discordOutput: loopback || 'Default'
      },
      warnings: this.generateWarnings(loopback, scarlett, blackhole)
    };
  }
}
```

---

### LOW PRIORITY

#### 7. Cleanup Temp Files with try/finally
**File:** `backend/server.js`
```javascript
this.app.post('/api/betabot/play-audio', async (req, res) => {
    const tempFile = path.join(__dirname, `temp_betabot_${Date.now()}.wav`);
    
    try {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        await new Promise((resolve) => req.on('end', resolve));
        
        const audioBuffer = Buffer.concat(chunks);
        await fs.promises.writeFile(tempFile, audioBuffer);
        
        await execPromise(`afplay "${tempFile}"`);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error playing BetaBot audio:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        // ALWAYS cleanup, even on error
        try {
            await fs.promises.unlink(tempFile);
        } catch (cleanupError) {
            console.warn('Failed to cleanup temp file:', tempFile);
        }
    }
});
```

#### 8. Add Audio Test Endpoint
**File:** `backend/server.js`
```javascript
this.app.post('/api/audio/test', async (req, res) => {
    try {
        // Generate 1 second test tone (440 Hz beep)
        const testFile = path.join(__dirname, 'test-tone.wav');
        await execPromise(`sox -n "${testFile}" synth 1 sine 440`);
        await execPromise(`afplay "${testFile}"`);
        await fs.promises.unlink(testFile);
        
        res.json({ 
            success: true, 
            message: 'Test tone played successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

#### 9. Add Startup Health Check Script
**Create:** `check-prerequisites.sh`
```bash
#!/bin/bash

echo "🔍 Checking prerequisites..."

# Check Docker
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker not running"
    exit 1
fi

# Check Piper TTS
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Piper TTS not running (port 8000)"
    exit 1
fi

# Check Backend
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend not running (port 3001)"
    exit 1
fi

# Check audio devices
OUTPUT=$(SwitchAudioSource -c -t output)
if [ "$OUTPUT" != "Loopback Audio" ]; then
    echo "⚠️  System output is '$OUTPUT' (expected: Loopback Audio)"
fi

echo "✅ All prerequisites OK!"
```

---

## 📊 Implementation Timeline

### Today (Before Show):
1. ✅ Fix WebSocket audio completion notification (30 min)
2. ✅ Add health check dashboard (1 hour)
3. ✅ Create simplified audio setup guide (30 min)

### This Week:
1. Get actual audio duration (1 hour)
2. Add TTS fallback (1 hour)
3. Cleanup temp files properly (30 min)

### Next Week:
1. Audio device auto-discovery (2 hours)
2. Audio test endpoint (30 min)
3. Startup health check script (30 min)

---

## 🎯 Success Metrics

After implementing these fixes:
- ✅ Audio playback state is always accurate
- ✅ No orphaned temp files
- ✅ Clear visual indication of system health
- ✅ Automatic recovery from TTS failures
- ✅ Simplified setup process (< 5 minutes)
- ✅ Zero manual configuration needed

---

## 📝 Documentation Updates Needed

1. **SIMPLE_AUDIO_SETUP.md** - One clear path, no alternatives
2. **TROUBLESHOOTING.md** - Common issues with solutions
3. **HEALTH_CHECK_GUIDE.md** - Understanding status indicators
4. **QUICK_START.md** - Get running in 5 minutes

---

Ready to implement! Which should we tackle first?
