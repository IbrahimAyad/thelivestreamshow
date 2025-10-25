# Quick Start Guide - 5 Minutes to Live Production Dashboard

## What You Need

1. **OBS Studio** (running with WebSocket enabled)
2. **Node.js 18+** installed on your computer
3. **YouTube API Key** (optional, for video metadata)

## Setup Steps

### 1. Install Dependencies (First Time Only)

Open terminal in the `local-dashboard` folder and run:

```bash
pnpm install
```

Don't have pnpm? Install it first:
```bash
npm install -g pnpm
```

### 2. Configure YouTube API (Optional)

Edit the `.env` file and add your YouTube API key:

```env
VITE_YOUTUBE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Don't have a YouTube API key?**
- Go to: https://console.cloud.google.com/apis/credentials
- Create a new API key
- Enable "YouTube Data API v3"
- Copy the key to `.env`

**Skip this step?** The dashboard will work but won't fetch video titles/thumbnails automatically.

### 3. Enable OBS WebSocket

In OBS Studio:
1. Go to **Tools → WebSocket Server Settings**
2. Check **"Enable WebSocket server"**
3. Copy the password (you'll need it in step 5)
4. Click **OK**

### 4. Start the Dashboard

In your terminal:

```bash
pnpm run dev
```

Wait for: "Local: http://localhost:5173"

### 5. Open and Connect

1. Open browser: **http://localhost:5173**
2. In the connection panel:
   - Address: `ws://localhost:4455`
   - Password: (paste from OBS WebSocket settings)
3. Click **"Connect to OBS"**

Done! You should see "CONNECTED" in green.

## What's Next?

**Try These Features:**

1. **Switch Scenes**: Click any scene button to change your OBS scene
2. **Mix Audio**: Adjust volume sliders, mute/unmute sources
3. **Add YouTube Videos**: Paste a YouTube URL, see it fetch title and thumbnail
4. **Create Timers**: Add countdown timers for show segments
5. **Plan Your Show**: Go to "Notes & Rundown" tab, add segments

## Common Issues

**"Connection failed"**
- Make sure OBS is running
- Check WebSocket is enabled in OBS
- Verify password is correct

**"Port already in use"**
- Close other instances of the dashboard
- Or change port in `vite.config.ts`

**YouTube videos don't load metadata**
- Add your API key to `.env`
- Restart the dev server

## Team Collaboration

Want multiple people to use it?

1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac: `ifconfig` (look for inet)
2. Share this URL with your team: `http://YOUR_IP:5173`
3. They can view/control from their devices on the same network

## Need Help?

See the full **README.md** for detailed troubleshooting and advanced features.

---

**Ready to go live? Have fun streaming!** 🚀
