#!/bin/bash
set -e

echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y curl wget espeak-ng

echo "🐍 Installing Python dependencies..."
pip install --no-cache-dir fastapi uvicorn pydantic

echo "🎤 Downloading Piper TTS binary..."
ARCH=$(uname -m)
echo "Architecture: $ARCH"

if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  PIPER_URL="https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_aarch64.tar.gz"
else
  PIPER_URL="https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz"
fi

mkdir -p /app/piper
wget -q $PIPER_URL -O /tmp/piper.tar.gz
tar -xzf /tmp/piper.tar.gz -C /app/piper
# Fix permissions - make all files in piper directory executable
chmod -R +x /app/piper
echo "✅ Piper binary installed with execute permissions"

echo "🎵 Downloading danny-low voice model (BetaBot voice)..."
mkdir -p /app/voices
wget -q https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low/en_US-danny-low.onnx -O /app/voices/en_US-danny-low.onnx
wget -q https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low/en_US-danny-low.onnx.json -O /app/voices/en_US-danny-low.onnx.json
echo "✅ danny-low voice downloaded"

echo "🎵 Downloading ryan-high voice model..."
wget -q https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx -O /app/voices/en_US-ryan-high.onnx
wget -q https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx.json -O /app/voices/en_US-ryan-high.onnx.json
echo "✅ ryan-high voice downloaded"

echo "🎵 Downloading lessac-medium voice model..."
wget -q https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx -O /app/voices/en_US-lessac-medium.onnx
wget -q https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json -O /app/voices/en_US-lessac-medium.onnx.json
echo "✅ lessac-medium voice downloaded"

echo "🚀 Starting Piper TTS server..."
python piper-server.py
