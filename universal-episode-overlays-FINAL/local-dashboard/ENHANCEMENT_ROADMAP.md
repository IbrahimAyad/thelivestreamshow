# Live Stream Production Dashboard - Enhancement Roadmap

## Implementation Status

### ✅ Completed Enhancements

#### 1. Embedded YouTube Player Integration (DONE)

**Status:** Fully implemented and deployed

**Features:**
- Embedded YouTube IFrame Player API
- Full playback controls (play, pause, stop)
- Volume control with mute toggle
- Seek bar for video navigation
- Real-time progress tracking
- Fullscreen support
- Automatic next video on queue end (ready for implementation)
- Synchronized with YouTube queue

**Files:**
- <filepath>/workspace/local-dashboard/src/components/YouTubePlayer.tsx</filepath> - Complete player component
- <filepath>/workspace/local-dashboard/src/App.tsx</filepath> - Integrated into main app

**How to Use:**
1. Add videos to the queue
2. Click "Play" on any video in the queue
3. Video loads in the embedded player
4. Control playback directly in the dashboard
5. No need to open external YouTube tabs

**Benefits:**
- Preview videos before going live
- Cue videos to specific timestamps
- Control volume independently from OBS
- Seamless workflow without leaving the dashboard

---

### 🔄 In Progress / Recommended Next Steps

#### 2. Real Audio Monitoring Solution

**Status:** Research completed, implementation roadmap provided

**Current Limitation:**
OBS WebSocket 5.x does not provide real-time audio level events, unlike version 4.x. This means the dashboard cannot display actual audio levels from OBS.

**Current Workaround:**
- Simulated audio levels based on volume settings
- Clear UI disclaimers
- Recommendation to use OBS Studio's built-in mixer

**Proposed Solution: OBS Plugin + WebSocket Bridge**

Create a lightweight OBS plugin that:
1. Reads real-time audio levels from OBS's internal audio engine
2. Exposes levels via a separate WebSocket server (different from OBS WebSocket)
3. Dashboard connects to this secondary WebSocket for audio data

**Implementation Approach:**

**Option A: OBS Lua Script (Simpler)**
OBS supports Lua scripting which can access audio levels:

```lua
-- obs_audio_monitor.lua
obs = obslua
websocket = require("websocket")

function script_description()
  return "Broadcasts audio levels to WebSocket clients"
end

function audio_callback(sources)
  -- Get audio levels from all sources
  for _, source in ipairs(sources) do
    local name = obs.obs_source_get_name(source)
    local volume = obs.obs_source_get_volume(source)
    local peak = obs.obs_volmeter_get_peak_db(source, 0)
    
    -- Broadcast to WebSocket clients
    broadcast_audio_data(name, volume, peak)
  end
end

function broadcast_audio_data(name, volume, peak)
  -- Send JSON data to connected WebSocket clients
  local data = string.format(
    '{"source":"%s","volume":%.2f,"peak":%.2f}',
    name, volume, peak
  )
  -- Broadcast to all connected clients
  websocket.broadcast(data)
end
```

**Option B: C++ Plugin (More Robust)**
Create a full C++ plugin for OBS:

```cpp
// obs_audio_bridge.cpp
#include <obs-module.h>
#include <websocketpp/server.hpp>

class AudioBridge {
private:
    websocketpp::server<websocketpp::config::asio> ws_server;
    std::thread server_thread;
    
public:
    void init() {
        // Start WebSocket server on port 4456
        ws_server.listen(4456);
        ws_server.start_accept();
        server_thread = std::thread([this]() {
            ws_server.run();
        });
    }
    
    void broadcast_audio_levels() {
        // Get all audio sources
        obs_enum_sources([](void *param, obs_source_t *source) {
            const char *name = obs_source_get_name(source);
            float volume = obs_source_get_volume(source);
            float *peaks = new float[2];
            obs_source_get_audio_levels(source, peaks, 2);
            
            // Create JSON
            json data = {
                {"source", name},
                {"volume", volume},
                {"peak_left", peaks[0]},
                {"peak_right", peaks[1]}
            };
            
            // Broadcast to all WebSocket clients
            auto bridge = static_cast<AudioBridge*>(param);
            bridge->ws_server.broadcast(data.dump());
            
            delete[] peaks;
            return true;
        }, this);
    }
};
```

**Dashboard Integration:**

```typescript
// In useOBSWebSocket.ts or new hook
const [audioLevels, setAudioLevels] = useState<Map<string, AudioLevel>>(new Map())

useEffect(() => {
  // Connect to audio bridge WebSocket
  const audioBridge = new WebSocket('ws://localhost:4456')
  
  audioBridge.onmessage = (event) => {
    const data = JSON.parse(event.data)
    setAudioLevels(prev => {
      const newLevels = new Map(prev)
      newLevels.set(data.source, {
        volume: data.volume,
        peakLeft: data.peak_left,
        peakRight: data.peak_right
      })
      return newLevels
    })
  }
  
  return () => audioBridge.close()
}, [])
```

**Development Steps:**
1. Choose Lua script (easier) or C++ plugin (more powerful)
2. Set up OBS plugin development environment
3. Implement audio level reading
4. Add WebSocket server (use existing library)
5. Test with OBS Studio
6. Update dashboard to connect to audio bridge
7. Package plugin for distribution

**Timeline Estimate:** 2-4 weeks for experienced OBS plugin developer

**Resources:**
- OBS Plugin Development: https://obsproject.com/docs/plugins.html
- OBS Scripting Guide: https://obsproject.com/docs/scripting.html
- WebSocketPP Library: https://github.com/zaphoyd/websocketpp

---

#### 3. User Authentication & Role-Based Access Control

**Status:** Ready for implementation

**Current State:**
- Public database access (no authentication required)
- All users have full control
- Suitable for trusted team environments only

**Proposed Solution: Supabase Auth with RBAC**

Implement Supabase Authentication with three user roles:

**Roles:**
1. **Producer** - Full control (OBS, audio, all features)
2. **Host** - Limited access (cue cards, notes, timers - read only)
3. **Viewer** - Read-only access (monitor only, no controls)

**Implementation Steps:**

**Step 1: Set Up Supabase Auth**

```typescript
// src/lib/auth.ts
import { supabase } from './supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function signUp(email: string, password: string, role: 'producer' | 'host' | 'viewer') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role
      }
    }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState<string | null>(null)
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setRole(session?.user?.user_metadata?.role ?? null)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setRole(session?.user?.user_metadata?.role ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { user, role }
}
```

**Step 2: Create User Profile Table**

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('producer', 'host', 'viewer')),
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

**Step 3: Update RLS Policies for Role-Based Access**

```sql
-- Video Queue: Everyone can read, only producers can modify
CREATE POLICY "Everyone can read video queue" ON video_queue
  FOR SELECT
  USING (true);

CREATE POLICY "Producers can insert videos" ON video_queue
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'producer'
    )
  );

CREATE POLICY "Producers can update videos" ON video_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'producer'
    )
  );

CREATE POLICY "Producers can delete videos" ON video_queue
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'producer'
    )
  );

-- Notes: Hosts and producers can create, viewers can only read
CREATE POLICY "Everyone can read notes" ON notes
  FOR SELECT
  USING (true);

CREATE POLICY "Hosts and producers can create notes" ON notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('producer', 'host')
    )
  );

-- Similar policies for other tables...
```

**Step 4: Create Login Component**

```typescript
// src/components/Login.tsx
import { useState } from 'react'
import { signIn, signUp } from '../lib/auth'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<'producer' | 'host' | 'viewer'>('host')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSignUp) {
      const { error } = await signUp(email, password, role)
      if (error) alert(error.message)
    } else {
      const { error } = await signIn(email, password)
      if (error) alert(error.message)
    }
  }
  
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-8 w-96">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
          />
          {isSignUp && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
            >
              <option value="producer">Producer (Full Access)</option>
              <option value="host">Host (Cue Cards & Notes)</option>
              <option value="viewer">Viewer (Read Only)</option>
            </select>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-blue-400 text-sm"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}
```

**Step 5: Protect Routes and Features**

```typescript
// src/App.tsx
import { useAuth } from './lib/auth'
import { Login } from './components/Login'

function App() {
  const { user, role } = useAuth()
  
  if (!user) {
    return <Login />
  }
  
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Conditional rendering based on role */}
      {role === 'producer' && (
        <ConnectionPanel
          connected={obs.connected}
          connecting={obs.connecting}
          error={obs.error}
          onConnect={handleConnect}
          onDisconnect={obs.disconnect}
        />
      )}
      
      {/* Hosts can see cue cards but not OBS controls */}
      {(role === 'host' || role === 'producer') && (
        <NotesPanel />
      )}
      
      {/* Everyone can see the rundown */}
      <RundownEditor readOnly={role === 'viewer'} />
    </div>
  )
}
```

**Development Timeline:** 1-2 weeks

**Benefits:**
- Secure access control
- Role-based permissions
- Audit trail (who made what changes)
- Multi-tenancy support (different shows/teams)

---

## Priority Recommendations

### High Priority
1. ✅ **Embedded YouTube Player** - COMPLETED
2. 🔒 **User Authentication** - Should be next (1-2 weeks)
3. 📊 **Real Audio Monitoring** - Complex but valuable (2-4 weeks)

### Medium Priority
4. **Audio Preset Quick-Load UI** - Database ready, needs UI (2-3 days)
5. **Scene Item Visibility Controls** - Toggle sources within scenes (1 week)
6. **Keyboard Shortcuts** - Hotkeys for common actions (3-5 days)

### Low Priority
7. **Mobile App Optimization** - Better touch controls for tablets
8. **Export/Import Rundowns** - Save as JSON files
9. **Multi-language Support** - i18n implementation

## Current Deployment

**Latest Version:** v1.2.0 (with YouTube Player)

**URLs:**
- **Online:** https://t6qwdgqfih4e.space.minimax.io
- **Local:** http://localhost:5173 (recommended for OBS control)

**New Features in v1.2.0:**
- ✅ Embedded YouTube IFrame Player
- ✅ Full playback controls in dashboard
- ✅ Volume control and muting
- ✅ Seek bar and progress tracking
- ✅ Fullscreen support
- ✅ Synchronized with queue

## How to Contribute

If you want to implement any of these enhancements:

1. **Fork the project** from <filepath>/workspace/local-dashboard/</filepath>
2. **Choose an enhancement** from the roadmap
3. **Follow the implementation guide** provided above
4. **Test thoroughly** with real OBS setup
5. **Document your changes** in CHANGELOG.md
6. **Submit for review** or deploy to your own environment

## Technical Debt & Known Issues

### Audio Monitoring
- Current: Simulated levels with clear disclaimers
- Future: Real levels via OBS plugin
- Workaround: Use OBS Studio's built-in mixer

### Browser Security
- Issue: HTTPS site cannot connect to ws:// (localhost)
- Solution: Use local development version
- Status: Documented in all guides

### YouTube API Quota
- Limit: 10,000 units/day (free tier)
- Cost: 1 unit per video metadata fetch
- Mitigation: Videos work without metadata if quota exceeded

## Conclusion

The Live Stream Production Dashboard has successfully implemented:
- ✅ OBS WebSocket integration
- ✅ Real YouTube Data API v3
- ✅ Embedded YouTube Player
- ✅ Production tools (timers, rundown, notes)
- ✅ Multi-user collaboration

Recommended next steps:
1. Implement user authentication (highest business value)
2. Develop audio monitoring plugin (highest technical value)
3. Add keyboard shortcuts (quick win for UX)

All implementation guides are provided above with code examples and timelines.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-13
**Author:** MiniMax Agent
