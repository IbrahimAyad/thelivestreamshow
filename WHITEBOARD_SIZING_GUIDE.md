# Whiteboard Canvas Sizing Guide

## Current Setup

### Dashboard Canvas Sizes:
- **Normal Mode (Tools Visible)**: 910x680px
- **Maximized Mode (Tools Hidden)**: 1400x900px

### Broadcast Overlay:
- **Current Size**: 910x680px (positioned at top: 140px, right: 20px)
- **Location**: `/Users/ibrahim/Desktop/thelivestreamshow/public/graphics/morning-blitz-universal.html`
- **Lines to Update**: 1597-1598

## How It Works

### Dashboard Drawing:
1. User draws on canvas (910x680 or 1400x900)
2. Mouse coordinates are scaled: `(clientX - rect.left) * scaleX`
3. Strokes saved to database with actual canvas coordinates
4. Points are in absolute pixel positions (not percentages)

### Broadcast Rendering:
1. Receives stroke data from database
2. Draws points at exact pixel coordinates
3. **PROBLEM**: If dashboard canvas is 1400x900 but broadcast is 910x680, coordinates don't match!

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

- [ ] Draw in normal mode - appears correctly in broadcast
- [ ] Toggle to maximized mode
- [ ] Draw in maximized mode - coordinates match
- [ ] Toggle back to normal - still works
- [ ] Undo/redo in both modes
- [ ] Shapes (circles, arrows) match exactly
- [ ] Grid and background visible in both modes
