# Voice Models Directory

## ⚠️ Missing Files Notice

This directory should contain voice model files (`.onnx` format) for the Piper TTS system, but they are **NOT included in the Git repository** because they exceed GitHub's file size limits.

## Required Files

The following voice model files are needed for the TTS system to work:

- `en_US-danny-low.onnx` (60.18 MB)
- `en_US-lessac-medium.onnx` (60.27 MB)
- `en_US-ryan-high.onnx` (115.19 MB)
- Associated `.json` config files for each model

## How to Get the Voice Models

### Option 1: Download from Piper TTS Repository
```bash
cd f5-tts-server/voices

# Download Danny voice (male, low quality, smaller size)
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/en_US-danny-low.onnx
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/en_US-danny-low.onnx.json

# Download Lessac voice (male, medium quality)
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/en_US-lessac-medium.onnx
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/en_US-lessac-medium.onnx.json

# Download Ryan voice (male, high quality, largest size)
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/en_US-ryan-high.onnx
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/en_US-ryan-high.onnx.json
```

### Option 2: Use Alternative Voices
Browse available voices at: https://github.com/rhasspy/piper/blob/master/VOICES.md

Pick any voice and download both the `.onnx` and `.onnx.json` files to this directory.

### Option 3: Copy from Backup
If you have a backup or another team member has the files, copy them to this directory:
```bash
# Files should be placed here:
f5-tts-server/voices/
├── en_US-danny-low.onnx
├── en_US-danny-low.onnx.json
├── en_US-lessac-medium.onnx
├── en_US-lessac-medium.onnx.json
├── en_US-ryan-high.onnx
└── en_US-ryan-high.onnx.json
```

## Verification

After downloading, verify the files are present:
```bash
ls -lh f5-tts-server/voices/*.onnx
```

You should see the `.onnx` files listed with their file sizes.

## Why Are These Files Missing?

These voice model files are excluded from Git because:
- **File size limits**: GitHub has a 100MB file limit, and `en_US-ryan-high.onnx` is 115MB
- **Not source code**: These are pre-trained binary models, not code we maintain
- **Easy to re-download**: They're publicly available from Piper TTS releases

## .gitignore Entry

These files are ignored via:
```
# F5-TTS Voice Models (too large for GitHub)
f5-tts-server/voices/*.onnx
f5-tts-server/voices/*.json
```

---

**Last Updated:** October 25, 2024
**Project:** The Livestream Show
**TTS System:** Piper TTS v1.2.0
