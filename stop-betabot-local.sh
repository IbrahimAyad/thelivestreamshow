#!/bin/bash

# Beta Bot Local Development Stop Script

echo "Stopping Beta Bot services..."

# Stop Docker containers
echo "Stopping F5-TTS server..."
docker-compose -f docker-compose.f5tts.yml down

# Kill any running npm processes (dashboard)
echo "Stopping dashboard..."
pkill -f "vite" || true

echo "All services stopped."
