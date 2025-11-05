# Alpha Wednesday Overlay Setup Guide

## 🎉 What's New

The Alpha Wednesday overlay has been completely rebuilt to work **without OBS WebSocket**! It now uses Supabase real-time for instant mode switching directly from your dashboard.

## ✨ Features

- **4 Layout Modes**:
  - **Default**: Discord left (top), Camera left (bottom), Media right
  - **Debate**: Large Discord left, small Camera + Media right (stacked)
  - **Presentation**: Large Media center, small Camera bottom-right
  - **Gaming**: Solo host camera centered

- **Real-time Mode Switching**: Change layouts instantly from dashboard
- **Episode Integration**: Displays episode info from database
- **Beautiful Animations**: Animated purple smoke effects
- **No OBS Dependency**: Works with Supabase only

## 📋 Setup Steps

### Step 1: Run Database Setup

Open your Supabase SQL Editor and run:

```bash
/Users/ibrahim/Desktop/thelivestreamshow/ALPHA_WEDNESDAY_MODE_SETUP.sql
```

This will:
- Create/update the `alpha_wednesday` graphic in `broadcast_graphics` table
- Add mode configuration support
- Create helper function for mode switching

### Step 2: Verify Episode Data

Make sure you have an active episode in `episode_info`:

```sql
SELECT * FROM episode_info WHERE is_active = true;
```

If not, create one:

```sql
INSERT INTO episode_info (
  episode_number, episode_date, episode_title,
  episode_topic, is_active, is_visible
) VALUES (
  1, CURRENT_DATE, 'Alpha Wednesday Returns',
  'AI, Tech News, and Community Discussion', true, true
);
```

### Step 3: Deploy to Cloudflare

The new overlay file is already in place:

```
/public/graphics/alpha-wednesday-universal.html
```

Deploy to Cloudflare Pages:

```bash
npm run build
```

Then push to GitHub - Cloudflare will auto-deploy.

### Step 4: Test the Overlay

1. Go to your dashboard (Graphics section)
2. Find "Alpha Wednesday" overlay (purple with mode buttons)
3. Click **SHOW** to activate it
4. Visit `/broadcast` page to see the overlay
5. Switch between modes (Default, Debate, Presentation, Gaming)
6. Watch the overlay update in real-time!

## 🎮 Using the Overlay

### From Dashboard

1. **Show/Hide Overlay**:
   - Click the **SHOW/HIDE** button in the Alpha Wednesday section

2. **Change Layout Mode**:
   - When active, click any mode button:
     - **DEFAULT** - Standard 3-panel layout
     - **DEBATE** - Large Discord for discussions
     - **PRESENTATION** - Focus on screen share
     - **GAMING** - Solo host view

### From SQL (Advanced)

You can also change modes via SQL:

```sql
-- Change to Debate Mode
SELECT set_alpha_wednesday_mode('debate');

-- Change to Presentation Mode
SELECT set_alpha_wednesday_mode('presentation');

-- Change to Gaming Mode
SELECT set_alpha_wednesday_mode('gaming');

-- Back to Default
SELECT set_alpha_wednesday_mode('default');
```

Or update directly:

```sql
UPDATE broadcast_graphics
SET config = jsonb_set(config, '{mode}', '"debate"')
WHERE graphic_type = 'alpha_wednesday';
```

## 📐 Layout Details

### Default Layout
```
┌─────────────────┬──────────────┐
│                 │              │
│    DISCORD      │    MEDIA     │
│    (58% x 38%)  │  (42% x 100%)│
│                 │              │
├─────────────────┤              │
│                 │              │
│    CAMERA       │              │
│    (58% x 62%)  │              │
│                 │              │
└─────────────────┴──────────────┘
```

### Debate Layout
```
┌──────────────────────┬─────────┐
│                      │ CAMERA  │
│                      │ (30%x48)│
│     DISCORD          ├─────────┤
│     (70% x 100%)     │         │
│                      │  MEDIA  │
│                      │ (30%x52)│
│                      │         │
└──────────────────────┴─────────┘
```

### Presentation Layout
```
┌──────────────────────────────┐
│                              │
│         MEDIA                │
│      (75% x 75%)             │
│        Centered              │
│                              │
│                    ┌────────┐│
│                    │ CAMERA ││
│                    │  25%   ││
└────────────────────┴────────┘┘
```

### Gaming Layout
```
┌──────────────────────────────┐
│                              │
│                              │
│        ┌────────────┐        │
│        │            │        │
│        │   CAMERA   │        │
│        │  (50x50)   │        │
│        │  Centered  │        │
│        │            │        │
│        └────────────┘        │
│                              │
│                              │
└──────────────────────────────┘
```

## 🔧 Troubleshooting

### Overlay Not Showing
1. Check if overlay is marked as `is_visible = true` in database
2. Check browser console for errors
3. Verify Supabase credentials are correct in overlay file

### Mode Not Changing
1. Check browser console for real-time subscription messages
2. Verify `broadcast_graphics` table has realtime enabled:
   ```sql
   SELECT tablename FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime'
   AND tablename = 'broadcast_graphics';
   ```
3. Check that mode is being saved:
   ```sql
   SELECT config FROM broadcast_graphics
   WHERE graphic_type = 'alpha_wednesday';
   ```

### Episode Info Not Showing
1. Verify active episode exists:
   ```sql
   SELECT * FROM episode_info WHERE is_active = true;
   ```
2. Check browser console for fetch errors

## 🎨 Customization

### Change Colors
Edit `/public/graphics/alpha-wednesday-universal.html`:

```javascript
// Line 56-58: Top bar gradient
background: linear-gradient(135deg,
  rgba(138, 43, 226, 0.95),  // Purple - change this
  rgba(75, 0, 130, 0.95)     // Indigo - change this
);

// Line 294-297: Frame borders
border: 3px solid rgba(138, 43, 226, 0.8);  // Change color
```

### Adjust Layout Positions
Edit the CSS classes `.layout-default`, `.layout-debate`, etc. in the overlay HTML file.

### Add New Modes
1. Add new mode to `available_modes` in database
2. Add CSS class `.layout-yourmode` to overlay HTML
3. Add button to dashboard mode switcher

## 📊 Files Changed/Created

### New Files
- `/public/graphics/alpha-wednesday-universal.html` - Main overlay
- `/ALPHA_WEDNESDAY_MODE_SETUP.sql` - Database setup script
- `/ALPHA_WEDNESDAY_SETUP_GUIDE.md` - This guide

### Modified Files
- `/src/components/GraphicsGallery.tsx` - Added Alpha Wednesday controls

## 🚀 Next Steps

1. ✅ Run the SQL setup script
2. ✅ Deploy to Cloudflare Pages
3. ✅ Test each mode during rehearsal
4. ✅ Go live with Alpha Wednesday!

---

**Need help?** Check the browser console for debugging info. All overlay events are logged with `🔥`, `🔵`, and `📺` emojis.
