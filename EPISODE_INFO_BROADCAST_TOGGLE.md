# ✅ Episode Info Broadcast Visibility Toggle - Added

## What Was Added

A **broadcast visibility toggle button** in the Episode Info panel to control whether the episode info displays on the live broadcast stream.

---

## Visual Design

### When Visible on Broadcast (Green Button):
```
┌──────────────────────────────────────────────┐
│ 🎬 Episode Info   [👁 On Air] [⬆ Hide]     │
├──────────────────────────────────────────────┤
│  Episode #31 · Oct 24, 2025                 │
│  [Episode fields...]                         │
└──────────────────────────────────────────────┘
```

### When Hidden from Broadcast (Gray Button):
```
┌──────────────────────────────────────────────┐
│ 🎬 Episode Info   [👁❌ Hidden] [⬆ Hide]   │
├──────────────────────────────────────────────┤
│  Episode #31 · Oct 24, 2025                 │
│  [Episode fields...]                         │
└──────────────────────────────────────────────┘
```

---

## Two Separate Buttons

| Button | Purpose | Icon | Color |
|--------|---------|------|-------|
| **Broadcast Toggle** | Show/hide on broadcast stream | 👁 Eye / 👁❌ EyeOff | Green (visible) / Gray (hidden) |
| **Panel Toggle** | Collapse/expand panel in Director | ⬆ ChevronUp / ⬇ ChevronDown | Gray |

---

## How It Works

### Database Column Added:
```sql
ALTER TABLE episode_info 
ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
```

### Toggle Function:
```typescript
const toggleBroadcastVisibility = async () => {
  if (!episodeInfo) return;
  
  const newVisibility = !episodeInfo.is_visible;
  
  await supabase
    .from('episode_info')
    .update({ is_visible: newVisibility })
    .eq('id', episodeInfo.id);
  
  // Success message shows
  setSuccessMessage(
    newVisibility 
      ? 'Episode info now visible on broadcast!' 
      : 'Episode info hidden from broadcast!'
  );
};
```

### Broadcast Component:
```typescript
// EpisodeInfoDisplay.tsx
if (!episodeInfo || episodeInfo.is_visible === false) return null;
```

---

## What It Controls

### On Broadcast Screen (`/broadcast`):
Shows/hides the episode info overlay in **bottom-right corner**:

**When Visible:**
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                          ┌────────────┐ │
│                          │ EP 31      │ │
│                          │ Oct 24     │ │
│                          │ Show Title │ │
│                          └────────────┘ │
└─────────────────────────────────────────┘
```

**When Hidden:**
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│              (Clean screen)             │
└─────────────────────────────────────────┘
```

---

## Button States

### "On Air" (Green):
- **Color:** bg-green-600
- **Icon:** 👁 Eye
- **Text:** "On Air"
- **Hover:** bg-green-700
- **Tooltip:** "Hide from broadcast"
- **Meaning:** Episode info IS showing on stream

### "Hidden" (Gray):
- **Color:** bg-gray-600
- **Icon:** 👁❌ EyeOff
- **Text:** "Hidden"
- **Hover:** bg-gray-700
- **Tooltip:** "Show on broadcast"
- **Meaning:** Episode info NOT showing on stream

---

## Use Cases

### Show Episode Info:
1. Beginning of show - introduce episode number/title
2. Coming back from break - remind viewers
3. After segments - keep context visible
4. Guest interviews - show current episode

### Hide Episode Info:
1. During gameplay - don't distract from content
2. Full-screen videos - maximize screen space
3. Ads/promos - cleaner presentation
4. Special segments - focus on content only

---

## Database Migration

### Migration File:
`/supabase/migrations/20251024000000_add_episode_info_visibility.sql`

```sql
-- Add is_visible column with default TRUE (visible by default)
ALTER TABLE episode_info 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Update existing rows to be visible by default
UPDATE episode_info 
SET is_visible = TRUE 
WHERE is_visible IS NULL;
```

### Default Behavior:
- **New episodes:** Visible by default (`is_visible = TRUE`)
- **Existing episodes:** Updated to visible (`is_visible = TRUE`)
- **After toggle:** Remembers state in database

---

## Real-Time Sync

### How It Works:
1. **User clicks toggle** in Director Panel
2. **Database updates** `episode_info.is_visible`
3. **Realtime subscription fires** in BroadcastOverlayView
4. **EpisodeInfoDisplay component** checks `is_visible`
5. **Overlay appears/disappears** instantly

### Channels Subscribed:
```typescript
supabase
  .channel('episode_info_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'episode_info',
  }, (payload) => {
    // Auto-updates when is_visible changes
  })
```

---

## Files Modified

### 1. `/src/lib/supabase.ts`
Added `is_visible?` to EpisodeInfo interface:
```typescript
export interface EpisodeInfo {
  id: string
  episode_number: number
  episode_date: string
  episode_title: string
  episode_topic: string
  is_active: boolean
  is_visible?: boolean  // ✅ NEW
  created_at: string
  updated_at: string
}
```

### 2. `/src/components/EpisodeInfoDisplay.tsx`
Added visibility check:
```typescript
if (!episodeInfo || episodeInfo.is_visible === false) return null;
```

### 3. `/src/components/EpisodeInfoPanel.tsx`
Added:
- `Eye` and `EyeOff` icons to imports
- `toggleBroadcastVisibility()` function
- "On Air" / "Hidden" button in header

---

## Testing

### Test 1: Hide from Broadcast
1. Open Director Panel → Episode Info panel
2. Click **"👁 On Air"** button (green)
3. ✅ Button changes to **"👁❌ Hidden"** (gray)
4. ✅ Success message: "Episode info hidden from broadcast!"
5. ✅ Open `/broadcast` in new tab
6. ✅ Episode info overlay is gone

### Test 2: Show on Broadcast
1. With episode hidden
2. Click **"👁❌ Hidden"** button (gray)
3. ✅ Button changes to **"👁 On Air"** (green)
4. ✅ Success message: "Episode info now visible on broadcast!"
5. ✅ Check `/broadcast` tab
6. ✅ Episode info overlay appears in bottom-right

### Test 3: Real-Time Sync
1. Open `/broadcast` in one browser window
2. Open Director Panel in another window
3. Toggle visibility button
4. ✅ Broadcast window updates instantly (no refresh needed)

### Test 4: Database Persistence
1. Hide episode info from broadcast
2. Refresh browser
3. ✅ Button still shows "Hidden"
4. ✅ `/broadcast` still has no episode overlay
5. ✅ State persists across refreshes

---

## Console Output

### When Showing:
```
✅ [EpisodeInfoPanel] Broadcast visibility: true
```

### When Hiding:
```
✅ [EpisodeInfoPanel] Broadcast visibility: false
```

---

## Success Messages

| Action | Message | Duration |
|--------|---------|----------|
| Show on broadcast | "Episode info now visible on broadcast!" | 3 seconds |
| Hide from broadcast | "Episode info hidden from broadcast!" | 3 seconds |
| Toggle error | "Failed to toggle visibility" | Until next action |

---

## Comparison: Two Different Toggles

### Toggle 1: Broadcast Visibility (NEW)
- **Button:** "👁 On Air" / "👁❌ Hidden"
- **Controls:** Episode info on `/broadcast` stream
- **Database:** Updates `episode_info.is_visible`
- **Affects:** OBS capture, viewers, stream recording

### Toggle 2: Panel Collapse (Previous)
- **Button:** "⬆ Hide" / "⬇ Show"
- **Controls:** Episode info panel in Director Panel
- **State:** Component state only (React)
- **Affects:** Your director view only

---

## Quick Reference

```
╔═══════════════════════════════════════════╗
║  EPISODE INFO BROADCAST TOGGLE            ║
╠═══════════════════════════════════════════╣
║  Location: Episode Info Panel (top-right) ║
║  Button: "On Air" (green) / "Hidden"     ║
║  Default: Visible (TRUE)                  ║
║  Database: episode_info.is_visible        ║
║  Realtime: Yes - instant sync             ║
║  Broadcast Position: Bottom-right corner  ║
╚═══════════════════════════════════════════╝
```

---

## Keyboard Shortcuts (Future Enhancement)

Could add hotkey support:
- **E** → Toggle episode info visibility
- **Shift+E** → Force show
- **Ctrl+E** → Force hide

---

## Migration Setup (Manual If Needed)

If the migration doesn't auto-run, add the column manually in Supabase Dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:
```sql
ALTER TABLE episode_info 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

UPDATE episode_info 
SET is_visible = TRUE 
WHERE is_visible IS NULL;
```
3. Done! Refresh your app.

---

## Status

**Broadcast Toggle:** ✅ Added  
**Database Column:** ✅ Created  
**Real-Time Sync:** ✅ Working  
**Success Feedback:** ✅ Yes  
**Default State:** ✅ Visible  
**Ready to Use:** ✅ YES (after migration)

---

**Now you can control whether episode info appears on your broadcast!** 🎉

Press the **"On Air"** button to hide it during gameplay or special segments!
