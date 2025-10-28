# The Livestream Show - Windows Setup Guide

## Prerequisites for Windows

### Required Software
1. **Git for Windows**: https://git-scm.com/download/win
2. **Node.js (v18+)**: https://nodejs.org/
3. **pnpm**: Install after Node.js
   ```powershell
   npm install -g pnpm
   ```

### Optional (for full functionality)
- **Python 3.10+**: For F5-TTS server (https://www.python.org/downloads/)
- **OBS Studio**: For streaming (https://obsproject.com/)

## Setup Instructions

### 1. Clone the Repository
```powershell
# Open PowerShell or Git Bash
cd C:\Users\YourUsername\Documents  # or wherever you want
git clone https://github.com/IbrahimAyad/thelivestreamshow
cd thelivestreamshow
```

### 2. Install Dependencies
```powershell
pnpm install
```

### 3. Configure Environment Variables
```powershell
# Copy the example env file
copy .env.example .env.local

# Edit .env.local with your API keys and settings
notepad .env.local
```

**Required Keys:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_OPENAI_API_KEY` - OpenAI API key (for AI features)

**Optional Keys:**
- `VITE_PERPLEXITY_API_KEY` - For Perplexity search
- `VITE_YOUTUBE_API_KEY` - For YouTube search
- `VITE_UNSPLASH_ACCESS_KEY` - For image search
- `VITE_OBS_WEBSOCKET_*` - OBS integration settings

### 4. Start Development Server
```powershell
pnpm dev
```

The app will be available at: http://localhost:5173

## Building for Production

```powershell
# Build the application
pnpm build

# Preview the production build
pnpm preview
```

## Windows-Specific Notes

### Path Differences
- Windows uses backslashes `\` in paths, but the app handles this automatically
- If you see path errors, try using forward slashes `/` instead

### Port Conflicts
If port 5173 is already in use:
```powershell
# Kill the process using the port
netstat -ano | findstr :5173
taskkill /PID <process_id> /F
```

### Firewall Settings
Windows Firewall may block connections:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Node.js if prompted

### Audio Issues (Windows-specific)
The Scarlett audio and Discord audio features are Mac-specific. On Windows:
- Set `VITE_ENABLE_BACKEND=false` in `.env.local`
- This disables backend audio routing features
- Music playback and UI features will still work

## Troubleshooting

### Issue: pnpm command not found
```powershell
npm install -g pnpm
```

### Issue: Module build failed
```powershell
# Clear cache and reinstall
Remove-Item node_modules -Recurse -Force
Remove-Item pnpm-lock.yaml
pnpm install
```

### Issue: Git clone fails
- Make sure you have Git for Windows installed
- Try using Git Bash instead of PowerShell
- Check your internet connection

### Issue: Port already in use
```powershell
# Change the port in package.json or vite.config.ts
# Or kill the process using the port (see above)
```

## Development Tips

### Using Visual Studio Code
1. Install VS Code: https://code.visualstudio.com/
2. Open the project: `code .`
3. Install recommended extensions when prompted

### Useful Commands
```powershell
# Run development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm type-check

# Format code
pnpm format

# Lint code
pnpm lint
```

## Features Available on Windows

✅ **Fully Supported:**
- Web UI and all React components
- Music player controls
- Overlay system
- Database integration (Supabase)
- AI features (BetaBot, OpenAI)
- OBS WebSocket integration

⚠️ **Limited/Mac-only:**
- Scarlett Audio routing (Mac audio device)
- Discord audio capture (Mac-specific)
- F5-TTS server (requires Linux/Mac binaries)

## Next Steps

1. **Test the basic UI**: Navigate to http://localhost:5173
2. **Configure Supabase**: Set up your database and authentication
3. **Add API keys**: Enable AI features and integrations
4. **Explore the app**: Check out the Studio, Broadcast, and AI tabs

## Getting Help

- Check the main README.md for feature documentation
- Review the `/docs` folder for detailed guides
- Check GitHub issues: https://github.com/IbrahimAyad/thelivestreamshow/issues

## Project Structure

```
thelivestreamshow/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── lib/            # Utilities and libraries
│   └── types/          # TypeScript types
├── public/             # Static assets and overlays
├── scripts/            # Database scripts and utilities
└── docs/               # Documentation
```

## Performance Optimization for Windows

If the app runs slowly:

1. **Disable unused features** in `.env.local`:
   ```
   VITE_ENABLE_TTS=false
   VITE_ENABLE_BACKEND=false
   VITE_ENABLE_OBS=false
   ```

2. **Close unnecessary browser tabs**

3. **Use production build** instead of dev mode:
   ```powershell
   pnpm build
   pnpm preview
   ```

4. **Check Windows Task Manager** for high CPU/memory usage

---

**Repository**: https://github.com/IbrahimAyad/thelivestreamshow
**Platform**: Primarily developed on macOS, tested on Windows
