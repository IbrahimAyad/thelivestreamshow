#!/bin/bash

# Beta Bot Local Development Startup Script
# This script starts both F5-TTS server and the dashboard

set -e  # Exit on error

echo "======================================"
echo "  Beta Bot Local Development Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}Step 1: Starting F5-TTS Server${NC}"
echo "--------------------------------------"

# Start F5-TTS with Docker Compose
echo "Starting Docker container..."
docker-compose -f docker-compose.f5tts.yml up -d

# Wait for F5-TTS to be ready
echo "Waiting for F5-TTS to initialize (this may take 30-60 seconds)..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}F5-TTS server is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${YELLOW}WARNING: F5-TTS may still be initializing${NC}"
    echo "Check logs with: docker-compose -f docker-compose.f5tts.yml logs -f"
fi

echo ""
echo -e "${GREEN}Step 2: Starting Dashboard${NC}"
echo "--------------------------------------"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}WARNING: .env.local not found${NC}"
    echo "Copying from .env.local.example..."
    cp .env.local.example .env.local
    echo -e "${YELLOW}Please edit .env.local with your API keys before continuing${NC}"
    echo "Press Enter to continue or Ctrl+C to exit and configure..."
    read
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the dashboard
echo "Starting development server..."
echo ""

# Start npm dev in background and save PID
npm run dev &
DASHBOARD_PID=$!

echo ""
echo "======================================"
echo -e "${GREEN}  Beta Bot is Running!${NC}"
echo "======================================"
echo ""
echo "Services:"
echo "  F5-TTS Server: http://localhost:8000"
echo "  Dashboard:     http://localhost:5173"
echo "  Broadcast:     http://localhost:5173/broadcast"
echo ""
echo "Logs:"
echo "  F5-TTS: docker-compose -f docker-compose.f5tts.yml logs -f"
echo "  Dashboard: (current terminal)"
echo ""
echo "To stop: Press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $DASHBOARD_PID 2>/dev/null || true
    docker-compose -f docker-compose.f5tts.yml down
    echo "All services stopped."
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for dashboard process
wait $DASHBOARD_PID
