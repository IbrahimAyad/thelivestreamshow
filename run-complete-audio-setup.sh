#!/bin/bash

# 🚀 Master Audio Setup Script
# Complete automated setup for Season 4 Premiere

set -e

clear

echo "╔═══════════════════════════════════════════════╗"
echo "║  🎙️  SEASON 4 PREMIERE - AUDIO SETUP         ║"
echo "║  Automated Configuration Script               ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "This script will:"
echo "  1. ✅ Set system audio devices (automated)"
echo "  2. 📋 Guide Discord configuration (manual)"
echo "  3. 📋 Guide Loopback configuration (manual)"
echo "  4. 🧪 Test audio routing (automated)"
echo ""
echo "Press ENTER to begin..."
read

# Step 1: System Audio Setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1/4: System Audio Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash setup-audio-routing.sh
echo ""
echo "✅ Step 1 complete!"
echo ""
echo "Press ENTER to continue to Discord setup..."
read

# Step 2: Discord Setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2/4: Discord Audio Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash setup-discord-audio.sh
echo ""
echo "✅ Step 2 complete!"
echo ""
echo "Press ENTER to continue to Loopback setup..."
read

# Step 3: Loopback Setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3/4: Loopback App Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opening Loopback app..."
open -a Loopback 2>/dev/null || echo "⚠️  Loopback app not found - please install from https://rogueamoeba.com/loopback/"
echo ""
echo "📋 Configure Loopback as follows:"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│ SOURCES TAB                                 │"
echo "├─────────────────────────────────────────────┤"
echo "│ Click [+] and add:                          │"
echo "│   1. System Audio (or Node.js)              │"
echo "│      └─ Captures BetaBot TTS                │"
echo "│   2. Discord (Application Audio)            │"
echo "│      └─ Captures Discord panel voices       │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│ MONITORS TAB                                │"
echo "├─────────────────────────────────────────────┤"
echo "│ Click [+] and add:                          │"
echo "│   1. Scarlett Solo 4th Gen                  │"
echo "│      └─ Volume: 0 dB                        │"
echo "│      └─ Sends to your headphones            │"
echo "│   2. BlackHole 2ch                          │"
echo "│      └─ Volume: 0 dB                        │"
echo "│      └─ Sends to OBS/stream                 │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "After configuring Loopback, press ENTER..."
read
echo ""
echo "✅ Step 3 complete!"
echo ""
echo "Press ENTER to run audio tests..."
read

# Step 4: Test Audio
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4/4: Audio Routing Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash test-audio-routing.sh

# Final Summary
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  🎉 SETUP COMPLETE!                           ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "✅ System Audio: Configured"
echo "✅ Discord: Configured"
echo "✅ Loopback: Configured"
echo "✅ Tests: Completed"
echo ""
echo "📋 Final Checklist:"
echo ""
echo "  ☐ Scarlett Solo MONITOR MIX knob: Fully RIGHT"
echo "  ☐ Backend running: node server.js"
echo "  ☐ Piper TTS running: docker-compose up"
echo "  ☐ Frontend running: npm run dev"
echo "  ☐ Join Discord voice channel with panel"
echo "  ☐ Test: Panel hears you"
echo "  ☐ Test: Panel hears BetaBot"
echo "  ☐ Test: You hear panel"
echo ""
echo "Ready for Season 4 Premiere! 🚀"
echo ""
echo "Open dashboard: http://localhost:5173"
