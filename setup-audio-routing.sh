#!/bin/bash

# 🎙️ Automated Audio Routing Setup for Season 4 Premiere
# This script configures macOS audio devices programmatically

set -e  # Exit on error

echo "┌─────────────────────────────────────────────┐"
echo "│  🎙️  Audio Routing Setup                   │"
echo "│  Configuring for Discord + BetaBot          │"
echo "└─────────────────────────────────────────────┘"
echo ""

# Check if SwitchAudioSource is installed
if ! command -v SwitchAudioSource &> /dev/null; then
    echo "❌ SwitchAudioSource not found. Installing..."
    brew install switchaudio-osx
fi

echo "📋 Current Audio Devices:"
SwitchAudioSource -a -t output
echo ""

# 1. Set System Output to Loopback Audio
echo "🔧 Setting system output to 'Loopback Audio'..."
if SwitchAudioSource -s "Loopback Audio" -t output; then
    echo "✅ System output set to Loopback Audio"
else
    echo "⚠️  Could not set Loopback Audio (might already be set or device not found)"
fi

# 2. Set System Input to Scarlett Solo
echo "🔧 Setting system input to 'Scarlett Solo 4th Gen'..."
if SwitchAudioSource -s "Scarlett Solo 4th Gen" -t input; then
    echo "✅ System input set to Scarlett Solo 4th Gen"
else
    echo "⚠️  Could not set Scarlett Solo (might already be set or device not found)"
fi

# 3. Verify settings
echo ""
echo "📊 Current Audio Configuration:"
echo "  Output: $(SwitchAudioSource -c -t output)"
echo "  Input:  $(SwitchAudioSource -c -t input)"
echo ""

# 4. Check required devices
echo "🔍 Verifying required audio devices..."

DEVICES=$(SwitchAudioSource -a -t output)

if echo "$DEVICES" | grep -q "Loopback Audio"; then
    echo "  ✅ Loopback Audio: Found"
else
    echo "  ❌ Loopback Audio: NOT FOUND - Install Loopback app!"
fi

if echo "$DEVICES" | grep -q "BlackHole 2ch"; then
    echo "  ✅ BlackHole 2ch: Found"
else
    echo "  ❌ BlackHole 2ch: NOT FOUND - Run: brew install blackhole-2ch"
fi

if echo "$DEVICES" | grep -q "Scarlett Solo"; then
    echo "  ✅ Scarlett Solo: Found"
else
    echo "  ❌ Scarlett Solo: NOT FOUND - Check USB connection"
fi

if echo "$DEVICES" | grep -q "Multi-Output"; then
    echo "  ✅ Multi-Output Device: Found"
else
    echo "  ⚠️  Multi-Output Device: NOT FOUND - Create in Audio MIDI Setup"
fi

echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  ✅ Automated Setup Complete                │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "📝 Manual Steps Required (cannot be automated):"
echo ""
echo "1. Configure Loopback App:"
echo "   - Open Loopback app"
echo "   - Sources: Add 'System Audio' and 'Discord'"
echo "   - Monitors: Add 'Scarlett Solo 4th Gen' and 'BlackHole 2ch'"
echo ""
echo "2. Configure Discord:"
echo "   - Input Device: Multi-Output Device"
echo "   - Output Device: Loopback Audio"
echo "   - Voice Processing: ALL OFF (except Voice Activity)"
echo ""
echo "3. Configure Audio MIDI Setup:"
echo "   - Open: Applications → Utilities → Audio MIDI Setup"
echo "   - Multi-Output Device:"
echo "     ☑ Scarlett Solo 4th Gen [Master]"
echo "     ☑ BlackHole 2ch"
echo "     ☑ Loopback Audio"
echo ""
echo "4. Scarlett Solo Hardware:"
echo "   - MONITOR MIX knob: Turn fully RIGHT"
echo ""
echo "See AUDIO_SETUP_CHECKLIST.md for complete details."
echo ""
echo "🚀 Ready to test! Run the test script:"
echo "   ./test-audio-routing.sh"
