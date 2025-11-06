# Whiteboard Canvas Sizing Guide

## Current Setup

### Dashboard Canvas Sizes (3 Modes):
- **Normal Mode (Tools Visible)**: 910x680px
- **Compact Mode (Tools Hidden, Small)**: 910x680px
- **Maximized Mode (Tools Hidden, Large)**: 1400x900px

### Broadcast Overlay:
- **Syncs automatically** with dashboard mode via database
- **Location**: `/Users/ibrahim/Desktop/thelivestreamshow/public/graphics/morning-blitz-universal.html`
- **Positioning**: top: 140px, right: 20px

## How It Works

### Three Display Modes:

1. **Normal Mode** (default):
   - Tools panel visible on left
   - Canvas: 910x680px
   - Best for quick edits and selections

2. **Compact Mode** (tools hidden, small canvas):
   - Tools panel hidden with status bar
   - Canvas: 910x680px (same as normal)
   - More drawing space without changing broadcast size
   - Toggle with "Switch to Large Canvas" button

3. **Maximized Mode** (tools hidden, large canvas):
   - Tools panel hidden with status bar
   - Canvas: 1400x900px (54% larger!)
   - Broadcast automatically resizes to match
   - Toggle with "Switch to Small Canvas" button

### Dashboard Drawing:
1. User draws on canvas (size depends on mode)
2. Mouse coordinates are scaled: `(clientX - rect.left) * scaleX`
3. Strokes saved to database with actual canvas coordinates
4. Canvas mode saved to `whiteboard_state.canvas_mode`

### Broadcast Rendering:
1. Subscribes to `whiteboard_state` changes
2. Detects `canvas_mode` updates (normal/compact/maximized)
3. Resizes canvas and overlay to match dashboard
4. Reloads strokes at correct size - perfect coordinate match!

## Solutions for Larger Canvas

### Option 1: Match Sizes Exactly (Recommended)
**Pros**: No coordinate conversion needed, perfect 1:1 match
**Cons**: Takes more screen space in broadcast

**Changes Needed**:
1. Update `morning-blitz-universal.html` lines 1597-1598:
   ```javascript
   whiteboardCanvas.width = 1400;  // was 910
   whiteboardCanvas.height = 900;  // was 680
   ```

2. Update CSS positioning (lines 181-207):
   ```css
   .whiteboard-realtime-overlay {
       top: 140px;
       right: 20px;
       width: 1400px;  /* was 910px */
       height: 900px;  /* was 680px */
   }
   ```

### Option 2: Scale Coordinates Dynamically
**Pros**: Dashboard can be any size, broadcast stays small
**Cons**: Requires coordinate scaling, potential quality loss

**Changes Needed**:
1. Save canvas dimensions with each stroke:
   ```typescript
   stroke_data: {
     ...strokeData,
     canvasWidth: 1400,
     canvasHeight: 900
   }
   ```

2. Scale coordinates in broadcast:
   ```javascript
   const scaleX = 910 / strokeData.canvasWidth;
   const scaleY = 680 / strokeData.canvasHeight;
   const scaledX = point.x * scaleX;
   const scaledY = point.y * scaleY;
   ```

### Option 3: Two Separate Modes
**Pros**: Best of both worlds
**Cons**: More complex

- Normal Mode: 910x680 for both (perfect match)
- Maximized Mode: 1400x900 dashboard, scaled down to 910x680 for broadcast

## Recommended Approach

**Use Option 1** - Match sizes exactly when maximized:

1. Add a `whiteboard_mode` field to database state
2. When user toggles maximize:
   - Update dashboard canvas: 1400x900
   - Send mode to database: `maximized`
   - Broadcast detects mode and resizes canvas
3. Both dashboard and broadcast always match size

## Implementation Steps

1. **Add mode tracking**:
   ```sql
   ALTER TABLE whiteboard_state ADD COLUMN canvas_mode TEXT DEFAULT 'normal';
   ```

2. **Update dashboard**:
   - Save mode to database when toggling
   - Canvas sizes: normal=910x680, maximized=1400x900

3. **Update broadcast**:
   - Subscribe to canvas_mode changes
   - Resize canvas dynamically based on mode
   - Reposition overlay if needed

4. **Test coordinates**:
   - Draw in corner (0,0) - should match
   - Draw in opposite corner (width, height) - should match
   - Draw diagonal line - should be perfect

## Current Code Locations

### Dashboard:
- File: `src/pages/dashboard/Whiteboard.tsx`
- Canvas size logic: Lines 581-596
- Coordinate scaling: Lines 315-317, 375-383

### Broadcast:
- File: `public/graphics/morning-blitz-universal.html`
- Canvas init: Lines 1593-1602
- Drawing logic: Lines 1631-1712
- CSS: Lines 181-207

## Testing Checklist

- [ ] Draw in normal mode (tools visible) - appears correctly in broadcast
- [ ] Click "Hide Tools" - tools collapse, canvas stays 910x680
- [ ] Draw in compact mode - broadcast matches perfectly
- [ ] Click "Switch to Large Canvas" - canvas expands to 1400x900
- [ ] Draw in maximized mode - broadcast resizes and matches
- [ ] Click "Switch to Small Canvas" - canvas shrinks back to 910x680
- [ ] Click "Show Tools" - tools panel reappears
- [ ] Undo/redo works in all 3 modes
- [ ] Shapes (circles, arrows) match exactly in all modes
- [ ] Grid and background visible in all modes
- [ ] Canvas mode persists in database between sessions
