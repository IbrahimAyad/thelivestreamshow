# 📚 Documentation Index

> **Last Updated:** 2025-01-22  
> **Version:** 4.0.0

This is your guide to all project documentation. **Start here** to find what you need.

---

## 🚀 Quick Start (New Users)

**Just want to get started?**
1. Read [`README.md`](../README.md) - Project overview
2. Follow [`CURRENT_SETUP.md`](../CURRENT_SETUP.md) - Complete setup (5 minutes)
3. Run `bash scripts/pre-show-check.sh` - Verify everything works

**That's it!** You're ready to go live.

---

## 📁 Documentation Structure

### 📄 Root Level (Active Documents)
**Use these for day-to-day work:**

- **[`README.md`](../README.md)** - Project overview and introduction
- **[`CURRENT_SETUP.md`](../CURRENT_SETUP.md)** - **THE** setup guide (ONLY ONE TO FOLLOW)
- **[`CHANGELOG.md`](../CHANGELOG.md)** - All changes, updates, and fixes

### 🎮 Features (`docs/features/`)
**Interactive stream features and games:**

#### Tomato Chat Game (`features/tomato-chat-game/`)
**NEW! Fully integrated interactive game** 🍅
- **[`USAGE_GUIDE.md`](features/tomato-chat-game/USAGE_GUIDE.md)** - ⭐ **START HERE** - How to use the game
- **[`INTEGRATION_COMPLETE.md`](features/tomato-chat-game/INTEGRATION_COMPLETE.md)** - Integration summary
- **[`README.md`](features/tomato-chat-game/README.md)** - Project overview
- **[`QUICK_START.md`](features/tomato-chat-game/QUICK_START.md)** - Quick start guide
- **[`IMPLEMENTATION.md`](features/tomato-chat-game/IMPLEMENTATION.md)** - Technical details

**Status:** ✅ Integrated | **Location:** `public/tomato-chat-game.html` | **Toggle:** Studio Control Panel

### 📚 Guides (`docs/guides/`)
**Setup and how-to documentation:**

- **[`SIMPLE_AUDIO_SETUP.md`](guides/SIMPLE_AUDIO_SETUP.md)** - 5-minute Loopback-only audio setup
- **`QUICK_START_GUIDE.md`** - Fast track to getting running
- **`TESTING_GUIDE.md`** - How to test the system
- **`TROUBLESHOOTING_MASTER.md`** - Common problems and solutions

### 📖 Reference (`docs/reference/`)
**Technical specifications and plans:**

- **[`PROJECT_STABILITY_PLAN.md`](reference/PROJECT_STABILITY_PLAN.md)** - Long-term stability strategy
- **[`IMPROVEMENTS_SUMMARY.md`](reference/IMPROVEMENTS_SUMMARY.md)** - Recent improvements overview
- **[`STABILITY_IMPROVEMENTS.md`](reference/STABILITY_IMPROVEMENTS.md)** - Detailed stability fixes
- **[`WE_MADE_IT_STRONGER.md`](reference/WE_MADE_IT_STRONGER.md)** - Summary of stability work
- **`ARCHITECTURE.md`** - System architecture details

### 📦 Archive (`docs/archive/`)
**Old documentation - reference only, DO NOT FOLLOW:**

#### Audio (`archive/audio/`)
- Old audio setup guides
- Loopback configurations (outdated)
- Discord integration attempts
- OBS audio documentation

#### BetaBot (`archive/betabot/`)
- BetaBot implementation history
- TTS system evolution
- Piper TTS setup docs
- Voice configuration attempts

#### Phases (`archive/phases/`)
- Phase 1-10 implementation docs
- Development milestones
- Feature rollout history

#### Graphics (`archive/graphics/`)
- Graphics system implementations
- Stream overlay documentation
- Design iterations

#### Features (`archive/features/`)
- AI automation docs
- Auto-director implementation
- Producer AI documentation
- Game integrations
- Show intro system

#### Testing (`archive/testing/`)
- Old test guides
- Testing checklists

#### Deployment (`archive/deployment/`)
- Supabase setup docs
- Migration instructions
- Deployment guides

#### General (`archive/`)
- Audit reports
- Bug fix documentation
- Integration summaries
- Work completed summaries

### 📝 Sessions (`docs/sessions/`)
**Development session notes:**

- **[`2025-01-22-audio-fix.md`](sessions/2025-01-22-audio-fix.md)** - Audio routing fix and stability framework
- More session notes as they're created...

---

## 🎯 What to Read When

### Before Every Show:
```bash
bash scripts/pre-show-check.sh
```
If all green ✅ → Go live!  
If any red ❌ → Check [`CURRENT_SETUP.md`](../CURRENT_SETUP.md)

### First Time Setup:
1. [`README.md`](../README.md) - Understand the project
2. [`CURRENT_SETUP.md`](../CURRENT_SETUP.md) - Complete setup
3. [`docs/guides/SIMPLE_AUDIO_SETUP.md`](guides/SIMPLE_AUDIO_SETUP.md) - Audio configuration
4. Run `bash scripts/pre-show-check.sh` - Verify

### Something Broke:
1. [`CURRENT_SETUP.md`](../CURRENT_SETUP.md) - Troubleshooting section
2. `docs/guides/TROUBLESHOOTING_MASTER.md` - Comprehensive solutions
3. [`CHANGELOG.md`](../CHANGELOG.md) - Check recent changes

### Want to Understand the System:
1. `docs/reference/ARCHITECTURE.md` - System architecture
2. [`docs/reference/PROJECT_STABILITY_PLAN.md`](reference/PROJECT_STABILITY_PLAN.md) - Stability strategy
3. `config/system-config.json` - Current configuration

### Making Changes:
1. Read [`CHANGELOG.md`](../CHANGELOG.md) - See what changed recently
2. Update `config/system-config.json` - Keep config current
3. Update [`CHANGELOG.md`](../CHANGELOG.md) - Document your changes
4. Create session note in `docs/sessions/` - Full context

---

## 🗂️ Configuration Files

**Location:** `config/`

- **`system-config.json`** - Master configuration (single source of truth)
- **`snapshots/`** - Configuration backups
- **`loopback-config.json`** - Loopback audio configuration (if available)

---

## 📜 Scripts

**Location:** `scripts/`

### Essential Scripts:
- **`pre-show-check.sh`** - Health check (run before every show!)
- **`setup-audio-routing.sh`** - Automated audio setup
- **`test-audio-routing.sh`** - Audio flow verification
- **`organize-docs.sh`** - Documentation organization (already run)

### Future Scripts (Coming Soon):
- `snapshot-config.sh` - Save current configuration
- `restore-config.sh` - Restore from snapshot
- `update-docs.sh` - Auto-generate documentation

---

## 🔍 Finding Information

### "How do I set up audio?"
→ [`CURRENT_SETUP.md`](../CURRENT_SETUP.md) Step 2  
→ [`docs/guides/SIMPLE_AUDIO_SETUP.md`](guides/SIMPLE_AUDIO_SETUP.md)

### "What's the current configuration?"
→ `config/system-config.json`  
→ [`CURRENT_SETUP.md`](../CURRENT_SETUP.md)

### "What changed recently?"
→ [`CHANGELOG.md`](../CHANGELOG.md)  
→ `docs/sessions/` (latest session note)

### "Something isn't working"
→ `bash scripts/pre-show-check.sh`  
→ [`CURRENT_SETUP.md`](../CURRENT_SETUP.md) Troubleshooting section  
→ `docs/guides/TROUBLESHOOTING_MASTER.md`

### "How does the system work?"
→ `docs/reference/ARCHITECTURE.md`  
→ [`docs/reference/PROJECT_STABILITY_PLAN.md`](reference/PROJECT_STABILITY_PLAN.md)

### "What was the plan for [old feature]?"
→ `docs/archive/` (find relevant category)  
→ **NOTE:** These are historical only, don't follow them!

---

## ⚠️ Important Notes

### Active vs Archive:
- **Active Docs (Root + guides + reference):** Current, accurate, follow these
- **Archive Docs:** Historical only, may be outdated, DO NOT FOLLOW

### Single Source of Truth:
- **Setup:** [`CURRENT_SETUP.md`](../CURRENT_SETUP.md) only
- **Configuration:** `config/system-config.json` only
- **Changes:** [`CHANGELOG.md`](../CHANGELOG.md) only

### If You're Confused:
1. Ignore everything in `docs/archive/`
2. Read [`CURRENT_SETUP.md`](../CURRENT_SETUP.md)
3. Run `bash scripts/pre-show-check.sh`
4. Check `config/system-config.json`

---

## 📞 Quick Reference

| **Need** | **File** | **Location** |
|----------|----------|--------------|
| Setup guide | `CURRENT_SETUP.md` | Root |
| Audio setup | `SIMPLE_AUDIO_SETUP.md` | docs/guides/ |
| Configuration | `system-config.json` | config/ |
| Recent changes | `CHANGELOG.md` | Root |
| Health check | `pre-show-check.sh` | scripts/ |
| Troubleshooting | `TROUBLESHOOTING_MASTER.md` | docs/guides/ |
| Architecture | `ARCHITECTURE.md` | docs/reference/ |
| Stability plan | `PROJECT_STABILITY_PLAN.md` | docs/reference/ |

---

## 🎯 Documentation Principles

1. **One Source of Truth** - Each topic has ONE authoritative document
2. **Active vs Archive** - Clear separation of current vs historical
3. **Findable** - This index makes everything easy to locate
4. **Maintainable** - Changes tracked in CHANGELOG.md
5. **Versioned** - Configuration and docs version-controlled in git

---

## 🔄 Maintenance

### When Creating New Docs:
- Put in appropriate folder (guides/reference/archive)
- Add to this index
- Link from relevant active docs
- Update [`CHANGELOG.md`](../CHANGELOG.md)

### When Updating Docs:
- Update [`CHANGELOG.md`](../CHANGELOG.md)
- Update version number and date
- If major change, create session note

### When Archiving:
- Move to `docs/archive/[category]/`
- Remove from this index (or mark as archived)
- Update links in active docs

---

**Last Reviewed:** 2025-01-22  
**Next Review:** Before Season 4 Episode 2  
**Maintained By:** AI Assistant + Ibrahim

**Status:** ✅ ORGANIZED
