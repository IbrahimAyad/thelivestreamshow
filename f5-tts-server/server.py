from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import torch
import torchaudio
from f5_tts.api import F5TTS
import io
from typing import Optional
import traceback

app = FastAPI(
    title="F5-TTS Server",
    description="Text-to-Speech API using F5-TTS model",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable for model
model = None

@app.on_event("startup")
async def load_model():
    global model
    try:
        print("Initializing F5-TTS model...")
        print("This may take a few minutes on first run (downloading model)...")
        
        model = F5TTS(
            model_type="F5-TTS",
            ckpt_file=None,  # Will download automatically
            vocab_file=None,
            ode_method="euler",
            use_ema=True,
        )
        
        print("F5-TTS model loaded successfully!")
        print("Server is ready to accept requests.")
    except Exception as e:
        print(f"ERROR: Failed to load F5-TTS model: {str(e)}")
        traceback.print_exc()
        model = None

class TTSRequest(BaseModel):
    text: str
    reference_audio: Optional[str] = None
    reference_text: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "text": "Hello! This is a test of the F5-TTS system.",
                "reference_audio": None,
                "reference_text": None
            }
        }

@app.get("/")
async def root():
    return {
        "service": "F5-TTS Server",
        "version": "1.0.0",
        "status": "running" if model is not None else "model not loaded",
        "endpoints": {
            "health": "/health",
            "generate": "/generate-speech",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "status": "healthy",
        "model": "F5-TTS",
        "ready": True
    }

@app.post("/generate-speech")
async def generate_speech(request: TTSRequest):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="F5-TTS model not loaded. Check server logs."
        )
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )
    
    try:
        print(f"Generating speech for: '{request.text[:100]}...'")
        
        # Generate audio using F5-TTS
        audio, sample_rate = model.infer(
            text=request.text,
            ref_file=request.reference_audio,
            ref_text=request.reference_text,
        )
        
        # Convert tensor to numpy if needed
        if torch.is_tensor(audio):
            audio = audio.cpu()
        
        # Ensure audio is 2D (channels, samples)
        if audio.dim() == 1:
            audio = audio.unsqueeze(0)
        
        # Convert to WAV format in memory
        buffer = io.BytesIO()
        torchaudio.save(
            buffer,
            audio,
            sample_rate,
            format="wav"
        )
        buffer.seek(0)
        
        print(f"Speech generated successfully ({len(buffer.getvalue())} bytes)")
        
        # Return audio file
        return Response(
            content=buffer.getvalue(),
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=speech.wav",
                "Cache-Control": "no-cache"
            }
        )
    
    except Exception as e:
        print(f"ERROR: Speech generation failed: {str(e)}")
        traceback.print_exc()
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
