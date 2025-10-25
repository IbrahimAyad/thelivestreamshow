#!/bin/bash

# 🎬 Pre-Show Health Check Script
# Verifies all services and configuration before going live

set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║  🎬 PRE-SHOW HEALTH CHECK                    ║"
echo "║  The Live Stream Show - Season 4              ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Check function
check() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    printf "%-40s" "$name"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        if [ ! -z "$expected" ]; then
            echo "   Expected: $expected"
        fi
    fi
}

# Warning function
warn() {
    local name="$1"
    local message="$2"
    
    printf "%-40s" "$name"
    echo -e "${YELLOW}⚠️  WARN${NC}"
    ((WARNINGS++))
    echo "   $message"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SERVICE HEALTH CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backend Server
check "Backend Server (port 3001)" \
    "curl -s http://localhost:3001/api/health | grep -q 'healthy'" \
    "HTTP 200 with status:healthy"

# Piper TTS
check "Piper TTS Server (port 8000)" \
    "curl -s http://localhost:8000/health | grep -q 'status'" \
    "HTTP 200 with health response"

# Frontend (if running)
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    check "Frontend Dev Server (port 5173)" \
        "curl -s http://localhost:5173 | grep -q 'html'" \
        "HTTP 200 with HTML response"
else
    warn "Frontend Dev Server" "Not running (run: npm run dev)"
fi

# Docker
check "Docker Desktop" \
    "docker ps > /dev/null 2>&1" \
    "Docker daemon running"

# Piper Container
check "Piper TTS Container" \
    "docker ps | grep -q piper-tts-server" \
    "Container running"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AUDIO CONFIGURATION CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if SwitchAudioSource is installed
if ! command -v SwitchAudioSource &> /dev/null; then
    warn "SwitchAudioSource" "Not installed (run: brew install switchaudio-osx)"
else
    # System Output Device
    CURRENT_OUTPUT=$(SwitchAudioSource -c -t output)
    if [ "$CURRENT_OUTPUT" = "Loopback Audio" ]; then
        check "System Output Device" \
            "[ '$CURRENT_OUTPUT' = 'Loopback Audio' ]" \
            "Loopback Audio"
    else
        printf "%-40s" "System Output Device"
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        echo "   Current: $CURRENT_OUTPUT"
        echo "   Expected: Loopback Audio"
        echo "   Fix: bash scripts/setup-audio-routing.sh"
    fi
    
    # System Input Device
    CURRENT_INPUT=$(SwitchAudioSource -c -t input)
    if echo "$CURRENT_INPUT" | grep -q "Scarlett"; then
        check "System Input Device" \
            "echo '$CURRENT_INPUT' | grep -q 'Scarlett'" \
            "Scarlett Solo 4th Gen"
    else
        printf "%-40s" "System Input Device"
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        echo "   Current: $CURRENT_INPUT"
        echo "   Expected: Scarlett Solo 4th Gen"
        echo "   Fix: bash scripts/setup-audio-routing.sh"
    fi
fi

# Check audio devices exist
check "Loopback Audio Device" \
    "SwitchAudioSource -a -t output | grep -q 'Loopback Audio'" \
    "Device found"

check "BlackHole 2ch Device" \
    "SwitchAudioSource -a -t output | grep -q 'BlackHole 2ch'" \
    "Device found"

check "Scarlett Solo Device" \
    "SwitchAudioSource -a -t input | grep -q 'Scarlett'" \
    "Device found"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BETABOT CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Piper voices
if curl -s http://localhost:8000/voices > /dev/null 2>&1; then
    VOICES=$(curl -s http://localhost:8000/voices)
    
    if echo "$VOICES" | grep -q "danny-low"; then
        check "BetaBot Voice (danny-low)" \
            "echo '$VOICES' | grep -q 'danny-low'" \
            "Voice available"
    else
        warn "BetaBot Voice (danny-low)" "Not found in available voices"
    fi
fi

# Check backend audio endpoint
check "Backend Audio Playback Endpoint" \
    "curl -s http://localhost:3001/api/betabot/play-audio -X POST -H 'Content-Type: application/octet-stream' --data-binary '' | grep -q 'success\|error'" \
    "Endpoint accessible"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CONFIGURATION FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "System Config Exists" \
    "[ -f config/system-config.json ]" \
    "config/system-config.json"

check "Environment File Exists" \
    "[ -f .env.local ]" \
    ".env.local"

# Check critical environment variables
if [ -f .env.local ]; then
    check "Supabase URL Configured" \
        "grep -q 'VITE_SUPABASE_URL' .env.local" \
        "VITE_SUPABASE_URL set"
    
    check "Supabase Key Configured" \
        "grep -q 'VITE_SUPABASE_ANON_KEY' .env.local" \
        "VITE_SUPABASE_ANON_KEY set"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FINAL REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo -e "Passed:   ${GREEN}$PASSED ✅${NC}"
echo -e "Failed:   ${RED}$FAILED ❌${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS ⚠️${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "╔═══════════════════════════════════════════════╗"
    echo "║  ✅ ALL CHECKS PASSED - READY TO GO LIVE! 🚀 ║"
    echo "╚═══════════════════════════════════════════════╝"
    exit 0
else
    echo "╔═══════════════════════════════════════════════╗"
    echo "║  ❌ ISSUES DETECTED - FIX BEFORE GOING LIVE  ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    echo "📝 Quick Fixes:"
    echo "   • Backend not running: cd backend && node server.js"
    echo "   • Piper TTS not running: docker-compose -f docker-compose.piper.yml up -d"
    echo "   • Audio routing wrong: bash scripts/setup-audio-routing.sh"
    echo "   • Frontend not running: npm run dev"
    echo ""
    echo "📖 Full Setup Guide: CURRENT_SETUP.md"
    exit 1
fi
