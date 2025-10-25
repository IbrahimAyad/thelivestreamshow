#!/bin/bash

# 🧪 Audio Routing Test Script
# Tests all audio flows for Discord + BetaBot setup

set -e

echo "┌─────────────────────────────────────────────┐"
echo "│  🧪 Testing Audio Routing                   │"
echo "└─────────────────────────────────────────────┘"
echo ""

# Check if backend is running
echo "🔍 Test 1: Backend Server Check"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "  ✅ Backend server is running on port 3001"
    BACKEND_STATUS=$(curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || echo "{}")
    echo "$BACKEND_STATUS" | grep -q "healthy" && echo "  ✅ Backend is healthy"
else
    echo "  ❌ Backend server NOT running!"
    echo "     Start it: cd backend && node server.js"
    exit 1
fi

# Check if Piper TTS is running
echo ""
echo "🔍 Test 2: Piper TTS Server Check"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "  ✅ Piper TTS server is running on port 8000"
else
    echo "  ❌ Piper TTS server NOT running!"
    echo "     Start it: docker-compose -f docker-compose.piper.yml up -d"
    exit 1
fi

# Verify audio device configuration
echo ""
echo "🔍 Test 3: System Audio Configuration"
CURRENT_OUTPUT=$(SwitchAudioSource -c -t output)
CURRENT_INPUT=$(SwitchAudioSource -c -t input)

echo "  Current Output: $CURRENT_OUTPUT"
echo "  Current Input:  $CURRENT_INPUT"

if [ "$CURRENT_OUTPUT" = "Loopback Audio" ]; then
    echo "  ✅ System output correctly set to Loopback Audio"
else
    echo "  ⚠️  System output is NOT Loopback Audio"
    echo "     Expected: Loopback Audio"
    echo "     Actual:   $CURRENT_OUTPUT"
fi

if echo "$CURRENT_INPUT" | grep -q "Scarlett"; then
    echo "  ✅ System input is Scarlett Solo"
else
    echo "  ⚠️  System input is NOT Scarlett Solo"
    echo "     Expected: Scarlett Solo 4th Gen"
    echo "     Actual:   $CURRENT_INPUT"
fi

# Test BetaBot TTS playback
echo ""
echo "🔍 Test 4: BetaBot TTS Audio Test"
echo "  Generating test audio with Piper TTS..."

# Generate test audio
TEST_AUDIO_RESPONSE=$(curl -s -X POST http://localhost:8000/generate-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Audio routing test. If you hear this, the system is working correctly.",
    "voice": "danny-low"
  }' \
  --output /tmp/betabot_test.wav \
  --write-out '%{http_code}')

if [ "$TEST_AUDIO_RESPONSE" = "200" ]; then
    echo "  ✅ Test audio generated successfully"
    
    # Get file size
    FILE_SIZE=$(stat -f%z /tmp/betabot_test.wav 2>/dev/null || stat -c%s /tmp/betabot_test.wav 2>/dev/null)
    echo "  📊 Audio file size: $FILE_SIZE bytes"
    
    if [ "$FILE_SIZE" -gt 1000 ]; then
        echo "  ✅ Audio file size looks good"
        
        echo ""
        echo "  🔊 Playing test audio through system output..."
        echo "     Listen in your headphones - you should hear BetaBot say:"
        echo "     'Audio routing test. If you hear this, the system is working correctly.'"
        echo ""
        echo "  Press ENTER when ready to play..."
        read
        
        afplay /tmp/betabot_test.wav
        
        echo ""
        echo "  ❓ Did you hear the audio in your headphones? (y/n)"
        read -r HEARD_AUDIO
        
        if [ "$HEARD_AUDIO" = "y" ] || [ "$HEARD_AUDIO" = "Y" ]; then
            echo "  ✅ Test 4 PASSED: You can hear BetaBot"
        else
            echo "  ❌ Test 4 FAILED: Check Scarlett MONITOR MIX knob (turn fully RIGHT)"
        fi
        
        # Clean up
        rm /tmp/betabot_test.wav
    else
        echo "  ❌ Audio file is too small - might be empty"
    fi
else
    echo "  ❌ Failed to generate test audio (HTTP $TEST_AUDIO_RESPONSE)"
fi

# Verify all required devices exist
echo ""
echo "🔍 Test 5: Required Audio Devices"
ALL_DEVICES=$(SwitchAudioSource -a -t output)

check_device() {
    local device_name="$1"
    if echo "$ALL_DEVICES" | grep -q "$device_name"; then
        echo "  ✅ $device_name"
        return 0
    else
        echo "  ❌ $device_name - NOT FOUND"
        return 1
    fi
}

check_device "Loopback Audio"
check_device "BlackHole 2ch"
check_device "Scarlett Solo"
check_device "Multi-Output"

echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  📊 Test Summary                            │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "✅ Automated tests completed!"
echo ""
echo "🧪 Manual Tests Required:"
echo ""
echo "Test A: Discord Panel Hears You"
echo "  1. Join Discord voice channel"
echo "  2. Speak into Scarlett mic"
echo "  3. Ask panel: 'Can you hear me?'"
echo "  ☐ Panel says YES"
echo ""
echo "Test B: Discord Panel Hears BetaBot"
echo "  1. In dashboard: BetaBot Control Panel"
echo "  2. Click 'Test TTS' button"
echo "  3. Ask panel: 'Did you hear BetaBot?'"
echo "  ☐ Panel says YES"
echo ""
echo "Test C: You Hear Discord Panel"
echo "  1. Ask panel member to speak"
echo "  2. Listen in your headphones"
echo "  ☐ You hear them clearly"
echo ""
echo "All tests pass? You're ready for the show! 🚀"
