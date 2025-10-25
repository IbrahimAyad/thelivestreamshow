# 🏗️ PROJECT STABILITY PLAN - Stop the Rework Cycle

## 🔴 ROOT CAUSE ANALYSIS

### Why We Kept Re-Solving the Same Problems Today:

1. **❌ Documentation Overload** - 100+ markdown files, impossible to find the current truth
2. **❌ No Single Source of Truth** - Multiple conflicting docs (AUDIO_SETUP.md, LOOPBACK_SETUP.md, etc.)
3. **❌ Code Changes Without Documentation** - Features work, then break, no record of why
4. **❌ No Configuration Management** - Audio routing changes lost between sessions
5. **❌ Missing Integration Tests** - No automated way to verify everything still works
6. **❌ Context Loss** - AI assistants forget previous solutions without proper documentation

---

## ✅ THE SOLUTION: 5-Pillar Stability Framework

### Pillar 1: SINGLE SOURCE OF TRUTH (SSOT)
### Pillar 2: CONFIGURATION AS CODE
### Pillar 3: AUTOMATED TESTING
### Pillar 4: STATE PERSISTENCE
### Pillar 5: CHANGE TRACKING

---

## 📋 PILLAR 1: Single Source of Truth (SSOT)

### Problem:
- 100+ markdown files
- Contradictory information
- Can't find current configuration
- Outdated setup guides

### Solution: Create Living Documentation System

#### 1.1 Create Master Configuration File
**File:** `config/system-config.json`
```json
{
  "version": "4.0.0",
  "lastUpdated": "2025-01-22T20:00:00Z",
  "services": {
    "backend": {
      "port": 3001,
      "status": "required",
      "startCommand": "cd backend && node server.js"
    },
    "piperTTS": {
      "port": 8000,
      "status": "required",
      "startCommand": "docker-compose -f docker-compose.piper.yml up -d",
      "voices": ["danny-low", "lessac-medium", "ryan-high"]
    },
    "frontend": {
      "port": 5173,
      "status": "required",
      "startCommand": "npm run dev"
    }
  },
  "audio": {
    "systemOutput": "Loopback Audio",
    "systemInput": "Scarlett Solo 4th Gen",
    "loopbackSources": ["Scarlett Solo 4th Gen", "System Audio", "Discord"],
    "loopbackMonitors": ["External Headphones", "BlackHole 2ch"],
    "discordInput": "Loopback Audio",
    "discordOutput": "Loopback Audio"
  },
  "features": {
    "betabot": {
      "enabled": true,
      "voice": "danny-low",
      "backend": "piper-tts"
    },
    "automation": {
      "enabled": true,
      "aiCoordinator": true
    }
  }
}
```

#### 1.2 Consolidate Documentation
**Action:** Merge all these into ONE master guide:
- AUDIO_SETUP_*.md → ONE `AUDIO_SETUP_MASTER.md`
- BETABOT_*.md → ONE `BETABOT_MASTER.md`
- PHASE_*.md → Archive to `/docs/archive/phases/`

**Create:**
- `CURRENT_SETUP.md` - The ONLY setup guide (always up to date)
- `TROUBLESHOOTING_MASTER.md` - All solutions in one place
- `ARCHITECTURE.md` - How the system actually works

#### 1.3 Documentation Auto-Update System
**File:** `scripts/update-docs.js`
```javascript
// Reads config/system-config.json
// Auto-generates CURRENT_SETUP.md
// Validates against actual running system
// Flags any discrepancies
```

---

## 🔧 PILLAR 2: Configuration as Code

### Problem:
- Audio routing configured manually every session
- Loopback settings lost
- No way to restore working state

### Solution: Codify ALL Configuration

#### 2.1 Audio Configuration Script
**File:** `scripts/configure-audio.sh`
```bash
#!/bin/bash
# Reads from config/system-config.json
# Sets macOS audio devices programmatically
# Configures Loopback via CLI (if possible) or generates instructions
# Validates configuration matches expected state
# Exits with error if anything doesn't match
```

#### 2.2 Loopback Configuration Export
**File:** `config/loopback-config.json`
```json
{
  "virtualDevice": {
    "name": "Show Audio",
    "sources": [
      {"device": "Scarlett Solo 4th Gen", "type": "hardware", "volume": 1.0},
      {"device": "System Audio", "type": "system", "volume": 1.0},
      {"device": "Discord", "type": "application", "volume": 1.0}
    ],
    "monitors": [
      {"device": "External Headphones", "volume": 0.0},
      {"device": "BlackHole 2ch", "volume": 0.0}
    ]
  }
}
```

#### 2.3 Environment Configuration
**File:** `.env.production` (checked into git with placeholder values)
```env
# Service Ports
BACKEND_PORT=3001
PIPER_TTS_PORT=8000
FRONTEND_PORT=5173

# Audio Configuration
SYSTEM_OUTPUT_DEVICE="Loopback Audio"
SYSTEM_INPUT_DEVICE="Scarlett Solo 4th Gen"

# BetaBot Configuration
BETABOT_VOICE="danny-low"
BETABOT_BACKEND="piper-tts"

# Feature Flags
FEATURE_AUTOMATION=true
FEATURE_AI_COORDINATOR=true
```

---

## 🧪 PILLAR 3: Automated Testing

### Problem:
- No way to verify system still works after changes
- Manual testing takes 15+ minutes
- Things break silently

### Solution: Comprehensive Test Suite

#### 3.1 System Health Test
**File:** `tests/system-health.test.ts`
```typescript
describe('System Health', () => {
  it('backend server should be running', async () => {
    const health = await fetch('http://localhost:3001/api/health');
    expect(health.ok).toBe(true);
  });

  it('piper TTS should be running', async () => {
    const health = await fetch('http://localhost:8000/health');
    expect(health.ok).toBe(true);
  });

  it('all required voices should be loaded', async () => {
    const voices = await fetch('http://localhost:8000/voices').then(r => r.json());
    expect(voices.voices.find(v => v.name === 'danny-low')).toBeDefined();
  });
});
```

#### 3.2 Audio Routing Test
**File:** `tests/audio-routing.test.ts`
```typescript
describe('Audio Routing', () => {
  it('system output should be Loopback Audio', async () => {
    const output = await getSystemOutput();
    expect(output).toBe('Loopback Audio');
  });

  it('betabot TTS should play through backend', async () => {
    const response = await fetch('http://localhost:8000/generate-speech', {
      method: 'POST',
      body: JSON.stringify({ text: 'test', voice: 'danny-low' })
    });
    expect(response.ok).toBe(true);
  });
});
```

#### 3.3 Integration Test
**File:** `tests/integration.test.ts`
```typescript
describe('End-to-End Flow', () => {
  it('BetaBot should speak and notify completion', async () => {
    const ws = new WebSocket('ws://localhost:3001');
    const completionPromise = new Promise(resolve => {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'betabot_audio_complete') {
          resolve(true);
        }
      };
    });

    // Trigger TTS
    await fetch('http://localhost:8000/generate-speech', {
      method: 'POST',
      body: JSON.stringify({ text: 'test', voice: 'danny-low' })
    });

    // Should receive completion notification
    await expect(completionPromise).resolves.toBe(true);
  });
});
```

#### 3.4 Pre-Show Checklist Script
**File:** `scripts/pre-show-check.sh`
```bash
#!/bin/bash
# Runs all tests
# Checks audio configuration
# Verifies Discord can be reached
# Validates Supabase connection
# Exits with report: ✅ Ready or ❌ Issues found
```

---

## 💾 PILLAR 4: State Persistence

### Problem:
- Working configuration lost between sessions
- Can't restore to last known good state
- No rollback mechanism

### Solution: State Snapshots

#### 4.1 Configuration Snapshots
**File:** `scripts/snapshot-config.sh`
```bash
#!/bin/bash
# Captures current system state:
# - Audio device settings
# - Running services
# - Loopback configuration
# - Environment variables
# Saves to: config/snapshots/YYYY-MM-DD-HH-MM.json
```

#### 4.2 Restore Mechanism
**File:** `scripts/restore-config.sh`
```bash
#!/bin/bash
# Lists available snapshots
# Allows selection
# Restores all settings to that snapshot
# Verifies restoration worked
```

#### 4.3 Git-Tracked Configuration
Store in git:
- `config/system-config.json` ✅
- `config/loopback-config.json` ✅
- `.env.production` ✅ (with placeholders)
- `config/current-snapshot.json` ✅ (auto-updated)

**DO NOT store:**
- API keys
- Passwords
- Personal file paths

---

## 📝 PILLAR 5: Change Tracking

### Problem:
- Code changes without documentation
- Lost track of what was changed and why
- Can't see history of solutions

### Solution: Structured Change Log

#### 5.1 CHANGELOG.md Format
**File:** `CHANGELOG.md`
```markdown
# Changelog

## [4.0.0] - 2025-01-22

### Fixed
- Audio playback now routes through backend (#123)
- WebSocket notification for audio completion
- Health check component shows system status

### Changed
- Audio routing simplified to Loopback-only approach
- Removed Multi-Output Device requirement

### Technical Details
**Files Modified:**
- `backend/server.js` - Added /api/betabot/play-audio endpoint
- `src/hooks/useF5TTS.ts` - WebSocket listener for completion

**Configuration Changes:**
- System Output: Loopback Audio (was: varies)
- Discord Input: Loopback Audio (was: Multi-Output Device)

**Migration Required:** Run `bash setup-audio-routing.sh`
```

#### 5.2 Decision Log
**File:** `docs/DECISIONS.md`
```markdown
# Architecture Decision Records

## ADR-001: Backend Audio Playback (2025-01-22)

**Context:** Browser Audio element cannot route to virtual devices

**Decision:** Play audio through backend using afplay

**Consequences:**
- ✅ Reliable audio routing
- ✅ Backend controls playback timing
- ❌ Slight increase in latency (~50ms)

**Alternatives Considered:**
1. Browser AudioContext - Rejected (same routing issue)
2. Hardware monitoring - Rejected (requires specific cables)
```

#### 5.3 Session Notes
**File:** `docs/sessions/2025-01-22-audio-fix.md`
```markdown
# Session: Audio Routing Fix (2025-01-22)

## Problems Encountered:
1. Audio stopped after 1 second
2. Confusion about Multi-Output vs Aggregate vs Loopback
3. Headphones connected to wrong device

## Solutions Implemented:
1. Backend audio playback via /api/betabot/play-audio
2. WebSocket notification system
3. Simplified documentation to Loopback-only

## Testing Results:
- ✅ Audio plays completely
- ✅ State tracking accurate
- ⚠️ Still need to configure Loopback monitors manually

## TODO:
- [ ] Add Loopback configuration automation
- [ ] Create pre-show checklist script
```

---

## 🚀 IMPLEMENTATION TIMELINE

### Phase 1: Emergency Stabilization (Tonight - 2 hours)
1. ✅ Create `config/system-config.json` with current state
2. ✅ Write `CURRENT_SETUP.md` (consolidate all audio docs)
3. ✅ Create `scripts/pre-show-check.sh`
4. ✅ Document today's changes in CHANGELOG.md

### Phase 2: Configuration as Code (This Week - 4 hours)
1. Implement `scripts/configure-audio.sh`
2. Export Loopback config to JSON
3. Create snapshot/restore scripts
4. Add .env.production with all settings

### Phase 3: Automated Testing (Next Week - 6 hours)
1. Write system health tests
2. Write audio routing tests
3. Write integration tests
4. Set up CI/CD pipeline

### Phase 4: Documentation Cleanup (Next Week - 3 hours)
1. Archive old docs to /docs/archive/
2. Keep only 5 master docs
3. Set up auto-documentation generation
4. Create decision log template

---

## 📊 SUCCESS METRICS

After implementing this plan:

### Stability Metrics:
- ✅ Zero rework sessions (vs today's 4+ hours of rework)
- ✅ Setup time: < 5 minutes (vs 30+ minutes today)
- ✅ Test coverage: 80%+ (vs 0% currently)
- ✅ Configuration restore: < 1 minute (vs manual)

### Documentation Metrics:
- ✅ Active docs: 5 files (vs 100+)
- ✅ Single source of truth: YES (vs scattered)
- ✅ Auto-generated: YES (vs manual)
- ✅ Version controlled: YES (vs some)

### Developer Experience:
- ✅ "What's the current setup?" → One file to check
- ✅ "How do I restore working state?" → One command
- ✅ "Did I break anything?" → Run tests
- ✅ "What changed?" → Check CHANGELOG.md

---

## 🎯 IMMEDIATE NEXT STEPS (Do Tonight!)

### Step 1: Create System Config (15 min)
```bash
mkdir -p config/snapshots
# Create system-config.json with current state
```

### Step 2: Consolidate Audio Docs (30 min)
```bash
# Merge all AUDIO_*.md into CURRENT_SETUP.md
# Archive old docs
```

### Step 3: Create Pre-Show Check (30 min)
```bash
# Write pre-show-check.sh
# Verify it catches issues
```

### Step 4: Document Today's Work (15 min)
```bash
# Update CHANGELOG.md
# Create session note
```

**Total Time: 90 minutes = Stable system for Season 4!**

---

## 🔐 CRITICAL SUCCESS FACTORS

1. **ONE configuration file** - Never edit code without updating config/system-config.json
2. **ONE setup guide** - CURRENT_SETUP.md is the only guide, always current
3. **Test before commit** - Run `npm test` before every git commit
4. **Document decisions** - Every architectural choice goes in DECISIONS.md
5. **Snapshot before changes** - Run `snapshot-config.sh` before modifying anything

---

## 📞 EMERGENCY RECOVERY

If something breaks:

```bash
# 1. Check what changed
git diff

# 2. Restore last known good config
bash scripts/restore-config.sh

# 3. Run health check
bash scripts/pre-show-check.sh

# 4. If still broken, check CHANGELOG.md for recent changes
```

---

**Status:** Ready to implement
**Priority:** CRITICAL
**Impact:** Eliminates 90% of rework
**Time to Value:** 90 minutes

Let's make this project bulletproof! 🛡️
