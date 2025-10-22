# Graphics Overlays Fix

## Problem
Only the "Tomato" game overlay was working. All other graphics (Starting Soon, BRB, Tech Issues, etc.) were not displaying when clicked.

## Root Cause
The graphics overlays require database entries in the `broadcast_graphics` table with their HTML file paths. Only the Tomato game had a database entry - all other graphics were missing from the database.

## Solution
Run the setup script to add all graphics to the database:

### Option 1: Run the TypeScript setup script (Recommended)
```bash
npm run setup:graphics
# or
npx tsx scripts/setup-graphics.ts
```

### Option 2: Run the SQL migration manually
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/add_all_broadcast_graphics.sql`
4. Click "Run"

## Verification
After running the setup:
1. Refresh your browser at `http://localhost:5174/`
2. Go to the Graphics Overlays section
3. Click any graphic (Starting Soon, BRB, Poll, etc.)
4. The graphic should now display in fullscreen
5. Click anywhere to close the graphic

## Technical Details

### How Graphics Work
1. **GraphicsGallery.tsx**: Shows the grid of graphics and toggles them on/off
2. **BroadcastGraphicsDisplay.tsx**: Displays active graphics as iframes
3. **Database**: Stores graphic state (visible/hidden) and HTML file paths

### Graphics List
All graphics now have database entries:
- ✅ Starting Soon
- ✅ BRB
- ✅ Tomato Game (was already working)
- ✅ Tech Issues
- ✅ OUTRO
- ✅ Out of Context
- ✅ Poll/Vote
- ✅ Milestone
- ✅ Chat Highlight
- ✅ Award Show
- ✅ Finish Him
- ✅ New Member
- ✅ Rage Meter
- ✅ Versus
- ✅ Logo

### Files Changed
- `supabase/migrations/add_all_broadcast_graphics.sql` - SQL migration to add all graphics
- `scripts/setup-graphics.ts` - TypeScript setup script for easy initialization
- `GRAPHICS_FIX.md` - This documentation

## Next Steps
1. Run the setup script: `npx tsx scripts/setup-graphics.ts`
2. Test each graphic overlay
3. Customize graphics by editing the HTML files in `/public/`

