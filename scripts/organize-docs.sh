#!/bin/bash

# 📁 Documentation Organization Script
# Moves all markdown files into proper structure

set -e

echo "📁 Organizing documentation files..."
echo ""

# Create directory structure
mkdir -p docs/archive/{audio,betabot,phases,graphics,features,testing,deployment}
mkdir -p docs/current
mkdir -p docs/guides
mkdir -p docs/reference

# CURRENT (Active - Keep in Root)
echo "✅ Keeping active docs in root..."
CURRENT_DOCS=(
    "README.md"
    "CURRENT_SETUP.md"
    "CHANGELOG.md"
)

# GUIDES (Setup & How-To - Move to docs/guides)
echo "📚 Moving guides to docs/guides/..."
mv SIMPLE_AUDIO_SETUP.md docs/guides/ 2>/dev/null || true
mv QUICK_START_GUIDE.md docs/guides/ 2>/dev/null || true
mv TESTING_GUIDE.md docs/guides/ 2>/dev/null || true
mv TROUBLESHOOTING_MASTER.md docs/guides/ 2>/dev/null || true

# REFERENCE (Technical specs - Move to docs/reference)
echo "📖 Moving reference docs to docs/reference/..."
mv PROJECT_STABILITY_PLAN.md docs/reference/ 2>/dev/null || true
mv IMPROVEMENTS_SUMMARY.md docs/reference/ 2>/dev/null || true
mv STABILITY_IMPROVEMENTS.md docs/reference/ 2>/dev/null || true
mv ARCHITECTURE.md docs/reference/ 2>/dev/null || true

# AUDIO (Archive old audio docs)
echo "🔊 Archiving audio documentation..."
mv AUDIO_*.md docs/archive/audio/ 2>/dev/null || true
mv AUDIOCONTEXT_*.md docs/archive/audio/ 2>/dev/null || true
mv LOOPBACK_*.md docs/archive/audio/ 2>/dev/null || true
mv YOUR_EXACT_LOOPBACK_SETUP.md docs/archive/audio/ 2>/dev/null || true
mv DISCORD_AUDIO_INTEGRATION.md docs/archive/audio/ 2>/dev/null || true
mv OBS_AUDIO_*.md docs/archive/audio/ 2>/dev/null || true
mv SHOW_INTRO_AUDIO_*.md docs/archive/audio/ 2>/dev/null || true

# BETABOT (Archive old betabot docs)
echo "🤖 Archiving BetaBot documentation..."
mv BETABOT_*.md docs/archive/betabot/ 2>/dev/null || true
mv BETA_BOT_*.md docs/archive/betabot/ 2>/dev/null || true
mv PIPER_*.md docs/archive/betabot/ 2>/dev/null || true
mv TTS_*.md docs/archive/betabot/ 2>/dev/null || true
mv HUME_*.md docs/archive/betabot/ 2>/dev/null || true
mv SPEECH_*.md docs/archive/betabot/ 2>/dev/null || true

# PHASES (Archive phase docs)
echo "📅 Archiving phase documentation..."
mv PHASE*.md docs/archive/phases/ 2>/dev/null || true

# GRAPHICS (Archive graphics docs)
echo "🎨 Archiving graphics documentation..."
mv GRAPHICS_*.md docs/archive/graphics/ 2>/dev/null || true
mv STREAM_GRAPHICS_*.md docs/archive/graphics/ 2>/dev/null || true
mv NEW_GRAPHICS_*.md docs/archive/graphics/ 2>/dev/null || true
mv PREMIUM_REDESIGN_*.md docs/archive/graphics/ 2>/dev/null || true

# FEATURES (Archive feature-specific docs)
echo "⚡ Archiving feature documentation..."
mv AI_*.md docs/archive/features/ 2>/dev/null || true
mv AUTO_*.md docs/archive/features/ 2>/dev/null || true
mv PRODUCER_*.md docs/archive/features/ 2>/dev/null || true
mv CLAUDE_*.md docs/archive/features/ 2>/dev/null || true
mv DUAL_*.md docs/archive/features/ 2>/dev/null || true
mv VIDEO_*.md docs/archive/features/ 2>/dev/null || true
mv MEDIA_*.md docs/archive/features/ 2>/dev/null || true
mv TOMATO_*.md docs/archive/features/ 2>/dev/null || true
mv BRB_*.md docs/archive/features/ 2>/dev/null || true
mv SHOW_INTRO_*.md docs/archive/features/ 2>/dev/null || true
mv SHOW_SESSION_*.md docs/archive/features/ 2>/dev/null || true
mv MOVEMENT_*.md docs/archive/features/ 2>/dev/null || true
mv GAME_*.md docs/archive/features/ 2>/dev/null || true

# TESTING (Archive testing docs)
echo "🧪 Archiving testing documentation..."
mv QUICK_TEST_*.md docs/archive/testing/ 2>/dev/null || true
mv *_TESTING_*.md docs/archive/testing/ 2>/dev/null || true

# DEPLOYMENT (Archive deployment docs)
echo "🚀 Archiving deployment documentation..."
mv DEPLOYMENT_*.md docs/archive/deployment/ 2>/dev/null || true
mv SUPABASE_*.md docs/archive/deployment/ 2>/dev/null || true
mv RLS_*.md docs/archive/deployment/ 2>/dev/null || true
mv MINIMAX_*.md docs/archive/deployment/ 2>/dev/null || true
mv MIGRATION_*.md docs/archive/deployment/ 2>/dev/null || true

# GENERAL ARCHIVE (Everything else)
echo "📦 Archiving remaining documentation..."
mv AUDIT_*.md docs/archive/ 2>/dev/null || true
mv BUGFIXES_*.md docs/archive/ 2>/dev/null || true
mv FIXES_*.md docs/archive/ 2>/dev/null || true
mv IMPLEMENTATION_*.md docs/archive/ 2>/dev/null || true
mv INTEGRATION_*.md docs/archive/ 2>/dev/null || true
mv WORK_*.md docs/archive/ 2>/dev/null || true
mv PROJECT_AUDIT_*.md docs/archive/ 2>/dev/null || true
mv SYSTEM_AUDIT_*.md docs/archive/ 2>/dev/null || true
mv READY_TO_*.md docs/archive/ 2>/dev/null || true
mv IMMEDIATE_*.md docs/archive/ 2>/dev/null || true
mv MISSING_*.md docs/archive/ 2>/dev/null || true
mv RECOVERED_*.md docs/archive/ 2>/dev/null || true
mv CRITICAL_*.md docs/archive/ 2>/dev/null || true
mv COST_*.md docs/archive/ 2>/dev/null || true
mv API_*.md docs/archive/ 2>/dev/null || true
mv LATEST_*.txt docs/archive/ 2>/dev/null || true
mv SEASON4_*.md docs/archive/ 2>/dev/null || true
mv SEGMENT_*.md docs/archive/ 2>/dev/null || true
mv STREAM_*.md docs/archive/ 2>/dev/null || true
mv FINAL_*.md docs/archive/ 2>/dev/null || true
mv WE_MADE_IT_STRONGER.md docs/reference/ 2>/dev/null || true

echo ""
echo "✅ Documentation organized!"
echo ""
echo "📂 New structure:"
echo "  Root:"
echo "    - README.md (project overview)"
echo "    - CURRENT_SETUP.md (THE setup guide)"
echo "    - CHANGELOG.md (all changes)"
echo ""
echo "  docs/guides/:"
echo "    - Setup and how-to guides"
echo ""
echo "  docs/reference/:"
echo "    - Technical specifications"
echo "    - Architecture docs"
echo "    - Stability plans"
echo ""
echo "  docs/archive/:"
echo "    - All old documentation"
echo "    - Organized by category"
echo ""
