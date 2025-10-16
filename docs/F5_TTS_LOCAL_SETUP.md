# F5-TTS Local Setup Guide for Mac

Complete guide to running Beta Bot with F5-TTS locally on macOS for OBS streaming.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Installing F5-TTS](#part-1-installing-f5-tts)
3. [Part 2: Running Dashboard Locally](#part-2-running-dashboard-locally)
4. [Part 3: OBS Integration](#part-3-obs-integration)
5. [Part 4: Daily Workflow](#part-4-daily-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Homebrew** (macOS package manager)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Python 3.10 or higher**
   ```bash
   brew install python@3.10
   python3 --version  # Verify installation
   ```

3. **Node.js 18 or higher**
   ```bash
   brew install node
   node --version  # Verify installation
   ```

4. **Git**
   ```bash
   brew install git
   git --version  # Verify installation
   ```

5. **Docker Desktop** (recommended method)
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop

### Hardware Requirements

- At least 8GB RAM (16GB recommended)
- 10GB free disk space
- macOS 11.0 (Big Sur) or later

---

## Part 1: Installing F5-TTS

You have two options for installing F5-TTS: Docker (recommended) or Python/pip.

### Option A: Docker Method (Recommended)

This is the easiest method and avoids dependency conflicts.

#### Step 1: Create F5-TTS Docker Setup

1. Create a directory for F5-TTS:
   ```bash
   mkdir -p ~/betabot-local/f5-tts
   cd ~/betabot-local/f5-tts
   ```

2. Create a `docker-compose.yml` file:
   ```bash
   cat > docker-compose.yml << 'DOCKER_EOF'
   version: '3.8'

   services:
     f5-tts:
       image: python:3.10-slim
       container_name: f5-tts-server
       ports:
         - "8000:8000"
       volumes:
         - ./models:/app/models
         - ./f5-tts:/app/f5-tts
       working_dir: /app/f5-tts
       command: >
         bash -c "
         uv pip install --no-cache-dir torch torchaudio numpy scipy soundfile fastapi uvicorn pydantic &&
         uv pip install --no-cache-dir git+https://github.com/SWivid/F5-TTS.git &&
         python server.py
         "
       environment:
         - PYTHONUNBUFFERED=1
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 60s
   DOCKER_EOF
   ```

3. Create the F5-TTS server script:
   ```bash
   mkdir -p f5-tts
   cat > f5-tts/server.py << 'SERVER_EOF'
   from fastapi import FastAPI, HTTPException
   from fastapi.middleware.cors import CORSMiddleware
   from fastapi.responses import Response
   from pydantic import BaseModel
   import torch
   import torchaudio
   from f5_tts.api import F5TTS
   import io
   import base64
   from typing import Optional

   app = FastAPI()

   # Enable CORS for local development
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   # Initialize F5-TTS model
   print("Loading F5-TTS model...")
   tts = F5TTS(
       model_type="F5-TTS",
       ckpt_file=None,  # Will download automatically
       vocab_file=None,
       ode_method="euler",
       use_ema=True,
   )
   print("F5-TTS model loaded successfully!")

   class TTSRequest(BaseModel):
       text: str
       reference_audio: Optional[str] = None
       reference_text: Optional[str] = None

   @app.get("/health")
   async def health_check():
       return {"status": "healthy", "model": "F5-TTS"}

   @app.post("/generate-speech")
   async def generate_speech(request: TTSRequest):
       try:
           print(f"Generating speech for: {request.text[:50]}...")
           
           # Generate audio
           audio, sample_rate = tts.infer(
               text=request.text,
               ref_file=request.reference_audio,
               ref_text=request.reference_text,
           )
           
           # Convert to WAV format
           buffer = io.BytesIO()
           torchaudio.save(buffer, audio.unsqueeze(0), sample_rate, format="wav")
           buffer.seek(0)
           
           # Return audio file
           return Response(
               content=buffer.getvalue(),
               media_type="audio/wav",
               headers={"Content-Disposition": "attachment; filename=speech.wav"}
           )
       
       except Exception as e:
           print(f"Error generating speech: {str(e)}")
           raise HTTPException(status_code=500, detail=str(e))

   if __name__ == "__main__":
       import uvicorn
       uvicorn.run(app, host="0.0.0.0", port=8000)
   SERVER_EOF
   ```

4. Start the F5-TTS server:
   ```bash
   docker-compose up -d
   ```

5. Check logs to ensure it's running:
   ```bash
   docker-compose logs -f
   ```
   
   You should see: "F5-TTS model loaded successfully!"

6. Test the server:
   ```bash
   curl http://localhost:8000/health
   ```
   
   Expected response: `{"status":"healthy","model":"F5-TTS"}`

### Option B: Python/pip Method (Advanced Users)

For users who prefer not to use Docker:

1. Create a virtual environment:
   ```bash
   mkdir -p ~/betabot-local/f5-tts
   cd ~/betabot-local/f5-tts
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   uv pip install torch torchaudio numpy scipy soundfile fastapi uvicorn pydantic
   uv pip install git+https://github.com/SWivid/F5-TTS.git
   ```

3. Create the server script (same as Docker version above)

4. Run the server:
   ```bash
   python server.py
   ```

---

## Part 2: Running Dashboard Locally

### Step 1: Clone the Repository

```bash
cd ~/betabot-local
git clone <your-repository-url> stream-overlay-dashboard
cd stream-overlay-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
# or
pnpm install
```

### Step 3: Configure Environment Variables

1. Copy the local environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your API keys:
   ```bash
   nano .env.local
   ```

3. Required configuration:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI API Keys
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_PERPLEXITY_API_KEY=your_perplexity_key

   # F5-TTS Configuration (ENABLED for local)
   VITE_F5_TTS_ENABLED=true
   VITE_F5_TTS_API_URL=http://localhost:8000
   ```

### Step 4: Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

The dashboard will be available at: `http://localhost:5173`

### Step 5: Verify F5-TTS Connection

1. Open the dashboard in your browser
2. Look for the "TTS Engine" dropdown
3. Select "F5-TTS (Local Server)"
4. You should see "Connected to F5-TTS Server" in green

---

## Part 3: OBS Integration

### Step 1: Add Dashboard Browser Source

1. Open OBS Studio
2. Click the "+" button in Sources panel
3. Select "Browser"
4. Configure:
   - Name: "Beta Bot Dashboard"
   - URL: `http://localhost:5173`
   - Width: 1920
   - Height: 1080
   - Check "Refresh browser when scene becomes active"

### Step 2: Add Broadcast Overlay

1. Add another Browser source
2. Configure:
   - Name: "Beta Bot Broadcast"
   - URL: `http://localhost:5173/broadcast`
   - Width: 1920
   - Height: 1080
   - Check "Shutdown source when not visible"

### Step 3: Configure Audio Routing

#### Option A: Using Virtual Audio Cable (Recommended)

1. Install BlackHole (free virtual audio driver):
   ```bash
   brew install blackhole-2ch
   ```

2. Configure Audio MIDI Setup:
   - Open "Audio MIDI Setup" (Applications > Utilities)
   - Click "+" and select "Create Multi-Output Device"
   - Check both "BlackHole 2ch" and your speakers
   - Name it "OBS + Speakers"

3. Set system audio output to "OBS + Speakers"

4. In OBS:
   - Go to Settings > Audio
   - Set "Desktop Audio" to "BlackHole 2ch"

#### Option B: Using Desktop Audio Capture

1. In OBS:
   - Go to Settings > Audio
   - Enable "Desktop Audio"
   - Select your default audio output device

2. Note: This will capture ALL desktop audio

### Step 4: Test the Full Pipeline

1. Start a Beta Bot session from the dashboard
2. Type a test question: "What is artificial intelligence?"
3. Verify:
   - Question appears in chat history
   - F5-TTS generates audio (check console logs)
   - Audio plays through your speakers
   - OBS captures the audio
   - Overlay updates on broadcast view

---

## Part 4: Daily Workflow

### Startup Procedure

1. **Start F5-TTS Server** (if using Docker):
   ```bash
   cd ~/betabot-local/f5-tts
   docker-compose up -d
   ```

2. **Start Dashboard**:
   ```bash
   cd ~/betabot-local/stream-overlay-dashboard
   npm run dev
   ```

3. **Open OBS**:
   - Launch OBS Studio
   - Browser sources will auto-load

4. **Verify Connection**:
   - Check dashboard shows "Connected to F5-TTS Server"
   - Test TTS with "Test Voice" button

### Automated Startup Script

Create a startup script for convenience:

```bash
cat > ~/betabot-local/start-betabot.sh << 'SCRIPT_EOF'
#!/bin/bash

echo "Starting Beta Bot Local Environment..."

# Start F5-TTS
echo "1. Starting F5-TTS server..."
cd ~/betabot-local/f5-tts
docker-compose up -d

# Wait for F5-TTS to be ready
echo "2. Waiting for F5-TTS to initialize..."
sleep 10

# Check F5-TTS health
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   F5-TTS is running!"
else
    echo "   WARNING: F5-TTS may not be running properly"
fi

# Start Dashboard
echo "3. Starting dashboard..."
cd ~/betabot-local/stream-overlay-dashboard
npm run dev &

echo ""
echo "Beta Bot is starting!"
echo "Dashboard will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
SCRIPT_EOF

chmod +x ~/betabot-local/start-betabot.sh
```

Run with:
```bash
~/betabot-local/start-betabot.sh
```

### Shutdown Procedure

1. **Stop Dashboard**:
   - Press `Ctrl+C` in the terminal running the dev server

2. **Stop F5-TTS**:
   ```bash
   cd ~/betabot-local/f5-tts
   docker-compose down
   ```

3. **Close OBS**:
   - Save your scene collection
   - Close OBS Studio

---

## Troubleshooting

### F5-TTS Server Issues

**Problem**: Server won't start

```bash
# Check Docker status
docker ps

# Check logs
cd ~/betabot-local/f5-tts
docker-compose logs

# Restart container
docker-compose restart

# Rebuild if needed
docker-compose down
docker-compose up --build -d
```

**Problem**: "Connection refused" error

- Verify F5-TTS is running: `curl http://localhost:8000/health`
- Check firewall settings
- Ensure port 8000 is not used by another application:
  ```bash
  lsof -i :8000
  ```

**Problem**: Model download fails

- Check internet connection
- Increase Docker memory limit in Docker Desktop preferences
- Manually download model and mount volume

### Dashboard Issues

**Problem**: Dashboard shows "Disconnected"

- Verify F5-TTS is running
- Check console for CORS errors
- Verify `VITE_F5_TTS_API_URL` in `.env.local` is correct

**Problem**: Audio not generating

- Check browser console for errors
- Test F5-TTS directly:
  ```bash
  curl -X POST http://localhost:8000/generate-speech \
    -H "Content-Type: application/json" \
    -d '{"text":"Hello world"}' \
    --output test.wav
  ```
- Play test.wav to verify F5-TTS is working

**Problem**: Port 5173 already in use

```bash
# Find process using port 5173
lsof -i :5173

# Kill the process (replace PID)
kill -9 <PID>
```

### OBS Audio Issues

**Problem**: No audio captured

- Check OBS audio mixer levels
- Verify Desktop Audio device is selected
- Test with system sounds (play music)
- Check macOS audio permissions for OBS

**Problem**: Audio delay/sync issues

- In OBS: Right-click audio source > Advanced Audio Properties
- Adjust "Sync Offset" (try -500ms to +500ms)

### Performance Issues

**Problem**: High CPU/Memory usage

- Close unnecessary browser tabs
- Reduce OBS canvas resolution
- Lower F5-TTS quality settings (modify server.py)
- Allocate more RAM to Docker Desktop

**Problem**: Slow audio generation

- First generation is always slower (model loading)
- Subsequent generations should be faster
- Consider using shorter text segments
- Check system resources (Activity Monitor)

### Common Error Messages

**"CORS policy error"**
- Solution: Ensure F5-TTS server has CORS middleware enabled
- Verify browser isn't blocking localhost connections

**"Module not found"**
- Solution: Reinstall dependencies
  ```bash
  rm -rf node_modules
  npm install
  ```

**"Supabase connection failed"**
- Solution: Check `.env.local` has correct Supabase credentials
- Verify internet connection
- Check Supabase dashboard for service status

---

## Additional Resources

### Useful Commands

```bash
# Check all running processes
ps aux | grep -E "(node|python|docker)"

# Monitor F5-TTS logs in real-time
cd ~/betabot-local/f5-tts
docker-compose logs -f

# Check system resources
top -o cpu

# Test network connectivity
curl http://localhost:8000/health
curl http://localhost:5173
```

### File Locations

- F5-TTS: `~/betabot-local/f5-tts/`
- Dashboard: `~/betabot-local/stream-overlay-dashboard/`
- Logs: Check terminal output
- Models: `~/betabot-local/f5-tts/models/`

### Getting Help

If you encounter issues not covered here:

1. Check the browser console (F12) for errors
2. Check F5-TTS server logs
3. Verify all services are running
4. Review environment variables
5. Test each component independently

---

## Summary

You now have a fully functional local Beta Bot setup with F5-TTS for high-quality text-to-speech. The system will:

1. Run F5-TTS locally for premium voice quality
2. Fall back to browser TTS if F5-TTS is unavailable
3. Integrate seamlessly with OBS for streaming
4. Save all your preferences and settings

Happy streaming!
