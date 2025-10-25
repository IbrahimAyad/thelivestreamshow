# 📂 Documentation Structure

```
thelivestreamshow/
│
├── 📄 README.md                    ← Project overview
├── 📄 CURRENT_SETUP.md             ← THE setup guide (ONLY ONE TO FOLLOW)
├── 📄 CHANGELOG.md                 ← All changes and updates
│
├── 📁 config/
│   ├── system-config.json          ← Master configuration (single source of truth)
│   └── snapshots/                  ← Configuration backups
│
├── 📁 scripts/
│   ├── pre-show-check.sh           ← Health check (RUN BEFORE EVERY SHOW!)
│   ├── setup-audio-routing.sh      ← Automated audio setup
│   ├── test-audio-routing.sh       ← Audio verification
│   ├── organize-docs.sh            ← Documentation organization
│   └── [more scripts...]
│
└── 📁 docs/
    │
    ├── 📄 INDEX.md                 ← THIS FILE - Navigation guide
    │
    ├── 📁 guides/                  ← Setup and how-to guides
    │   ├── SIMPLE_AUDIO_SETUP.md   ← 5-minute audio setup
    │   ├── QUICK_START_GUIDE.md    ← Fast start guide
    │   ├── TESTING_GUIDE.md        ← Testing instructions
    │   └── TROUBLESHOOTING_MASTER.md ← Problem solutions
    │
    ├── 📁 reference/               ← Technical specifications
    │   ├── PROJECT_STABILITY_PLAN.md ← Stability strategy
    │   ├── IMPROVEMENTS_SUMMARY.md   ← Recent improvements
    │   ├── STABILITY_IMPROVEMENTS.md ← Stability fixes
    │   ├── WE_MADE_IT_STRONGER.md   ← Stability summary
    │   └── ARCHITECTURE.md          ← System architecture
    │
    ├── 📁 sessions/                ← Development session notes
    │   └── 2025-01-22-audio-fix.md ← Today's session
    │
    └── 📁 archive/                 ← OLD DOCS (Reference only, DO NOT FOLLOW)
        │
        ├── 📁 audio/               ← Old audio setup guides
        │   ├── AUDIO_*.md
        │   ├── LOOPBACK_*.md
        │   ├── DISCORD_AUDIO_*.md
        │   └── OBS_AUDIO_*.md
        │
        ├── 📁 betabot/             ← BetaBot implementation history
        │   ├── BETABOT_*.md
        │   ├── PIPER_*.md
        │   └── TTS_*.md
        │
        ├── 📁 phases/              ← Development phases
        │   └── PHASE_*.md
        │
        ├── 📁 graphics/            ← Graphics system docs
        │   ├── GRAPHICS_*.md
        │   └── STREAM_*.md
        │
        ├── 📁 features/            ← Feature implementations
        │   ├── AI_*.md
        │   ├── AUTO_*.md
        │   ├── PRODUCER_*.md
        │   ├── SHOW_INTRO_*.md
        │   ├── TOMATO_*.md
        │   └── [more features...]
        │
        ├── 📁 testing/             ← Old test guides
        │   └── *_TESTING_*.md
        │
        ├── 📁 deployment/          ← Deployment docs
        │   ├── DEPLOYMENT_*.md
        │   └── SUPABASE_*.md
        │
        └── 📄 [misc old docs]
```

---

## 🎯 Quick Navigation

### I want to...

**Set up the system**
→ [`CURRENT_SETUP.md`](../CURRENT_SETUP.md)

**Understand audio routing**
→ [`docs/guides/SIMPLE_AUDIO_SETUP.md`](guides/SIMPLE_AUDIO_SETUP.md)

**Check system health**
→ `bash scripts/pre-show-check.sh`

**See recent changes**
→ [`CHANGELOG.md`](../CHANGELOG.md)

**Fix a problem**
→ `docs/guides/TROUBLESHOOTING_MASTER.md`

**Understand the architecture**
→ `docs/reference/ARCHITECTURE.md`

**Find old documentation**
→ `docs/archive/[category]/`

---

## 📊 Stats

- **Active Docs:** 3 (root) + 4 (guides) + 5 (reference) = **12 files**
- **Archived Docs:** 90+ files (organized by category)
- **Reduction:** From 100+ scattered files to **12 active files**
- **Finding Time:** From "lost in chaos" to **< 10 seconds**

---

## ⚠️ Important Rules

### DO:
- ✅ Follow [`CURRENT_SETUP.md`](../CURRENT_SETUP.md) for setup
- ✅ Check `docs/guides/` for how-to information
- ✅ Use `docs/reference/` for technical details
- ✅ Run `scripts/pre-show-check.sh` before shows

### DON'T:
- ❌ Follow anything in `docs/archive/` (outdated!)
- ❌ Create new docs without updating INDEX.md
- ❌ Let docs accumulate in root (organize them!)
- ❌ Make changes without updating CHANGELOG.md

---

## 🔄 Maintenance

**Monthly:**
- Review `docs/archive/` and delete truly obsolete docs
- Update INDEX.md with any new documentation
- Verify all links still work

**Per Session:**
- Create session note in `docs/sessions/`
- Update [`CHANGELOG.md`](../CHANGELOG.md)
- Update configuration if changed

**Per Release:**
- Update version numbers
- Archive old implementation docs
- Update this structure diagram

---

**Generated:** 2025-01-22  
**Last Updated:** 2025-01-22  
**Status:** ✅ ORGANIZED
