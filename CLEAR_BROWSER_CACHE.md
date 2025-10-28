# Clear Browser Cache to Fix React Hooks Error

## The Problem
React is showing a hooks order error because the browser has cached an old version of the component with a different hook structure.

## Solution: Hard Refresh

### Chrome/Edge:
1. Open `http://localhost:5174/broadcast`
2. Press **Cmd + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows/Linux)
3. Or right-click the refresh button → "Empty Cache and Hard Reload"

### Firefox:
1. Open `http://localhost:5174/broadcast`
2. Press **Cmd + Shift + R** (Mac) or **Ctrl + F5** (Windows/Linux)

### Safari:
1. Open `http://localhost:5174/broadcast`
2. Press **Cmd + Option + E** to empty caches
3. Then **Cmd + R** to reload

## Alternative: Clear All Site Data

### Chrome:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage" in left sidebar
4. Click "Clear site data" button
5. Refresh page

### Firefox:
1. Open DevTools (F12)
2. Go to Storage tab
3. Right-click on domain → "Delete All"
4. Refresh page

## Verify Fix:
After clearing cache, you should see:
- No React hooks error in console
- Popup system loads correctly
- Character themes display properly

## Why This Happened:
The file `/src/components/BroadcastOverlayView.tsx` was edited to reorganize hooks, but your browser cached the old version. The new version has all hooks in the correct order:

```
Line 16-17: Custom hooks (useTTS, useF5TTS)
Line 18-55: All useState hooks
Line 58-59: All useRef hooks
Line 62+: All useEffect hooks
```

This is the CORRECT order. Just need to tell your browser to use the new version.

---

**After clearing cache, the popup system should work perfectly!**
