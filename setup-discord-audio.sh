#!/bin/bash

# 🎮 Discord Audio Configuration Helper
# Opens Discord settings and provides copy-paste commands

echo "┌─────────────────────────────────────────────┐"
echo "│  🎮 Discord Audio Configuration             │"
echo "└─────────────────────────────────────────────┘"
echo ""

# Check if Discord is running
if pgrep -x "Discord" > /dev/null; then
    echo "✅ Discord is running"
else
    echo "⚠️  Discord is not running"
    echo "   Opening Discord..."
    open -a Discord
    sleep 3
fi

echo ""
echo "📋 Follow these steps in Discord:"
echo ""
echo "1. Open Discord User Settings (⚙️ icon or Cmd+,)"
echo "2. Navigate to: Voice & Video"
echo ""
echo "3. Set these devices:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   INPUT DEVICE:  Multi-Output Device"
echo "   OUTPUT DEVICE: Loopback Audio"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "4. Scroll down to 'VOICE PROCESSING'"
echo "   Turn OFF all these settings:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ❌ Echo Cancellation: OFF"
echo "   ❌ Noise Suppression: OFF"
echo "   ❌ Noise Reduction: OFF"
echo "   ❌ Automatic Gain Control: OFF"
echo "   ✅ Voice Activity: ON (keep this ON!)"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "5. Scroll down to 'INPUT SENSITIVITY'"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Toggle OFF: Automatically determine input sensitivity"
echo "   Drag slider to: -40 dB (adjust based on mic)"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try to open Discord settings (this might not work on all systems)
echo "🔧 Attempting to open Discord settings..."
echo ""

# AppleScript to open Discord settings
osascript <<EOF 2>/dev/null
tell application "Discord"
    activate
end tell

delay 1

tell application "System Events"
    keystroke "," using command down
end tell
EOF

if [ $? -eq 0 ]; then
    echo "✅ Discord settings opened (hopefully!)"
else
    echo "⚠️  Could not automatically open settings"
    echo "   Please manually open: Discord → Settings (Cmd+,)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "After configuring Discord, press ENTER to verify..."
read

echo ""
echo "🔍 Verifying Discord can access the devices..."
echo ""
echo "Current available output devices:"
SwitchAudioSource -a -t output | grep -E "(Loopback|Multi-Output)"
echo ""

echo "✅ Discord configuration helper complete!"
echo ""
echo "Next step: Configure Loopback app"
echo "  Run: open -a Loopback"
