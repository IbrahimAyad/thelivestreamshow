#!/usr/bin/env python3
"""
Piper TTS Server
A FastAPI server that uses Piper TTS for high-quality text-to-speech synthesis.
Piper is a fast, local neural text-to-speech system.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import subprocess
import tempfile
import os
from typing import Optional, List
from pathlib import Path

app = FastAPI(
    title="Piper TTS Server",
    description="Text-to-Speech API using Piper neural TTS",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Piper configuration
SCRIPT_DIR = Path(__file__).parent.resolve()
PIPER_BIN = str(SCRIPT_DIR / "piper" / "piper" / "piper")
VOICES_DIR = str(SCRIPT_DIR / "voices")

# Available Piper voices
AVAILABLE_VOICES = {
    "danny-low": {
        "name": "danny-low",
        "model_file": "en_US-danny-low.onnx",
        "gender": "male",
        "quality": "low",
        "available": True
    },
    "ryan-high": {
        "name": "ryan-high",
        "model_file": "en_US-ryan-high.onnx",
        "gender": "male",
        "quality": "high",
        "available": True
    },
    "lessac-medium": {
        "name": "lessac-medium",
        "model_file": "en_US-lessac-medium.onnx",
        "gender": "female",
        "quality": "medium",
        "available": True
    },
    "amy-medium": {
        "name": "amy-medium",
        "model_file": "en_US-amy-medium.onnx",
        "gender": "female",
        "quality": "medium",
        "available": True
    },
    "ljspeech-high": {
        "name": "ljspeech-high",
        "model_file": "en_US-ljspeech-high.onnx",
        "gender": "female",
        "quality": "high",
        "available": True
    }
}

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "danny-low"
    reference_audio: Optional[str] = None  # Ignored for Piper, kept for compatibility
    reference_text: Optional[str] = None   # Ignored for Piper, kept for compatibility

    class Config:
        schema_extra = {
            "example": {
                "text": "Hello! This is BetaBot speaking with the danny low voice.",
                "voice": "danny-low"
            }
        }

class VoiceInfo(BaseModel):
    name: str
    model_file: str
    gender: str
    quality: str
    available: bool

@app.on_event("startup")
async def startup_event():
    """Check Piper installation on startup"""
    if not os.path.exists(PIPER_BIN):
        print(f"⚠️ WARNING: Piper binary not found at {PIPER_BIN}")
        print("Server will start but speech generation will fail")
    else:
        print(f"✅ Piper binary found at {PIPER_BIN}")
    
    # Check voices directory
    if not os.path.exists(VOICES_DIR):
        print(f"⚠️ WARNING: Voices directory not found at {VOICES_DIR}")
    else:
        voices = list(Path(VOICES_DIR).glob("*.onnx"))
        print(f"✅ Found {len(voices)} voice models in {VOICES_DIR}")
        for voice in voices:
            print(f"   - {voice.name}")

@app.get("/")
async def root():
    return {
        "service": "Piper TTS Server",
        "version": "2.0.0",
        "engine": "Piper Neural TTS",
        "status": "running",
        "default_voice": "danny-low",
        "endpoints": {
            "health": "/health",
            "voices": "/voices",
            "generate": "/generate-speech",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    piper_available = os.path.exists(PIPER_BIN)
    voices_dir_exists = os.path.exists(VOICES_DIR)
    
    # Check how many voices are actually installed
    installed_voices = []
    if voices_dir_exists:
        installed_voices = [v.stem for v in Path(VOICES_DIR).glob("*.onnx")]
    
    return {
        "status": "healthy" if piper_available else "degraded",
        "piper_available": piper_available,
        "voices_directory": voices_dir_exists,
        "voices_loaded": installed_voices,
        "default_voice": "danny-low"
    }

@app.get("/voices", response_model=dict)
async def list_voices():
    """List all available Piper voices"""
    # Check which voices are actually installed
    if os.path.exists(VOICES_DIR):
        installed_models = {v.name for v in Path(VOICES_DIR).glob("*.onnx")}
        
        # Update availability based on installed models
        for voice_name, voice_info in AVAILABLE_VOICES.items():
            voice_info["available"] = voice_info["model_file"] in installed_models
    
    return {
        "voices": list(AVAILABLE_VOICES.values()),
        "count": len(AVAILABLE_VOICES)
    }

@app.post("/generate-speech")
async def generate_speech(request: TTSRequest):
    """Generate speech using Piper TTS"""
    
    # Validate text
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Validate voice
    voice_name = request.voice or "danny-low"
    if voice_name not in AVAILABLE_VOICES:
        raise HTTPException(
            status_code=400,
            detail=f"Voice '{voice_name}' not found. Available voices: {list(AVAILABLE_VOICES.keys())}"
        )
    
    voice_info = AVAILABLE_VOICES[voice_name]
    model_path = os.path.join(VOICES_DIR, voice_info["model_file"])
    
    # Check if voice model exists
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f"Voice model not found: {voice_info['model_file']}. Please download it first."
        )
    
    # Check if Piper binary exists
    if not os.path.exists(PIPER_BIN):
        raise HTTPException(
            status_code=503,
            detail="Piper TTS engine not installed"
        )
    
    try:
        print(f"🎤 Generating speech with voice '{voice_name}': {request.text[:50]}...")
        
        # Create temporary output file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_output:
            output_path = temp_output.name
        
        # Run Piper TTS
        # Piper reads from stdin and writes to stdout
        process = subprocess.Popen(
            [PIPER_BIN, "--model", model_path, "--output_file", output_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=request.text)
        
        if process.returncode != 0:
            print(f"❌ Piper error: {stderr}")
            raise HTTPException(
                status_code=500,
                detail=f"Piper TTS failed: {stderr}"
            )
        
        # Read generated audio file
        with open(output_path, 'rb') as f:
            audio_data = f.read()
        
        # Clean up temp file
        os.unlink(output_path)
        
        print(f"✅ Generated {len(audio_data)} bytes of audio")
        
        # Return audio file
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=speech.wav",
                "Cache-Control": "no-cache"
            }
        )
    
    except subprocess.SubprocessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Piper subprocess error: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Speech generation failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
