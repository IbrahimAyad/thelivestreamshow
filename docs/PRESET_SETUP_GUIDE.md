# Scene Preset Setup Guide

## Quick Start

### Method 1: Use Pre-Built Presets (Recommended)

1. **Run the SQL script**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy `/Users/ibrahim/thelivestreamshow/scripts/create-useful-presets.sql`
   - Paste and Run
   - ✅ You now have 6 ready-to-use presets!

2. **Apply a preset**:
   - Open Scene Presets & Templates panel
   - Click "Apply" on any preset
   - Your layout instantly changes

3. **Return to normal**:
   - Click "Apply" on "Reset to Default"
   - Clears everything back to main display

---

### Method 2: Create Custom Presets Manually

1. **Set up your desired layout**:
   - Add graphics from Graphics Gallery
   - Add lower thirds with text/styling
   - Position everything how you want

2. **Save as preset**:
   - Click "Save Current Layout as Main Preset" button
   - Names it automatically based on current state

3. **Apply later**:
   - Open Scene Presets & Templates
   - Click "Apply" on your saved preset

---

## Available Pre-Built Presets

### 1. **Reset to Default** ⭐
- **Category**: Custom
- **Purpose**: Clear everything, return to normal main display
- **Use When**: After using any other preset

### 2. **Interview Setup**
- **Category**: Interview
- **Purpose**: Guest interview layout with dual lower thirds
- **Features**:
  - Guest lower third (bottom-left)
  - Host lower third (bottom-right)
  - Interview automation settings (lower thresholds)

### 3. **Q&A Session**
- **Category**: Q&A
- **Purpose**: High automation for rapid audience questions
- **Features**:
  - Q&A indicator graphic (top-center)
  - "How to submit questions" lower third
  - High automation (0.90 auto-execute threshold)

### 4. **Technical Difficulty** ⭐
- **Category**: Technical
- **Purpose**: Emergency fallback during technical issues
- **Features**:
  - Fullscreen "Technical Difficulties" message
  - **Disables all automation** (emergency stop)
  - Shows "We'll be right back" message

### 5. **Show Intro**
- **Category**: Intro
- **Purpose**: Standard opening sequence
- **Features**:
  - Branded intro graphic
  - Episode info lower third
  - Delayed appearance (2s for intro, then episode info)

### 6. **Show Outro**
- **Category**: Outro
- **Purpose**: Closing sequence with social links
- **Features**:
  - Social media links
  - Thank you message
  - Next show teaser

---

## Customizing Presets

### Edit Preset Text (Example: Interview Guest Name)

**Via SQL:**
```sql
UPDATE scene_presets
SET action_sequence = jsonb_set(
  action_sequence,
  '{0,action_data,text_line_1}',
  '"John Doe"'
)
WHERE name = 'Interview Setup';
```

**Or manually:**
1. Apply the preset
2. Edit the lower third text in the UI
3. Click "Save Current Layout" to update

---

## Preset Workflow Examples

### Example 1: Interview Show
```
1. Click "Show Intro" → Opening sequence plays
2. Click "Reset to Default" → Clear intro, normal display
3. Talk for 5 minutes
4. Click "Interview Setup" → Guest appears
5. Interview for 20 minutes
6. Click "Reset to Default" → Guest lower third clears
7. Click "Q&A Session" → Audience questions
8. Click "Reset to Default" → Back to normal
9. Click "Show Outro" → Closing sequence
```

### Example 2: Emergency Technical Issue
```
1. Something breaks during show
2. Click "Technical Difficulty" → Standby screen + automation OFF
3. Fix the issue
4. Click "Reset to Default" → Resume normal show
```

---

## Creating New Presets via SQL

### Template:
```sql
INSERT INTO scene_presets (
  name,
  description,
  category,
  tags,
  action_sequence,
  automation_config,
  is_public,
  is_favorite,
  created_by
) VALUES (
  'Your Preset Name',
  'Description of what this does',
  'custom', -- or: intro, outro, interview, qa, presentation, technical
  ARRAY['tag1', 'tag2', 'tag3'],

  -- Action sequence (what happens when you apply this)
  '[
    {
      "action_type": "graphic.show",
      "action_data": {
        "graphic_type": "your_graphic",
        "position": "top-center",
        "config": {}
      },
      "delay_ms": 0,
      "description": "What this action does"
    }
  ]'::jsonb,

  -- Automation settings
  '{
    "automation_enabled": true,
    "auto_execute_enabled": true,
    "confidence_auto_execute": 0.85,
    "confidence_suggest": 0.70
  }'::jsonb,

  true,  -- is_public
  false, -- is_favorite
  null   -- created_by
);
```

---

## Action Types Reference

### Graphic Actions
- `graphic.show` - Show a graphic
- `graphic.hide` - Hide a graphic
- `clear_all` - Hide all graphics and lower thirds

### Lower Third Actions
- `lower_third.show` - Show a lower third
- `lower_third.hide` - Hide a lower third

### Segment Actions
- `segment.switch` - Switch active show segment

---

## Positions

**Graphics:**
- `fullscreen` - Full screen overlay
- `top-left`, `top-center`, `top-right`
- `middle-left`, `middle-center`, `middle-right`
- `bottom-left`, `bottom-center`, `bottom-right`

**Lower Thirds:**
- `bottom-left`, `bottom-center`, `bottom-right`

---

## Tips

✅ **DO:**
- Use "Reset to Default" between presets to avoid conflicts
- Test presets before going live
- Use descriptive names and tags
- Set `is_favorite: true` for your most-used presets

❌ **DON'T:**
- Apply multiple presets without resetting (can create messy overlays)
- Use high automation thresholds (>0.95) unless you're certain
- Delete the "Reset to Default" preset

---

## Troubleshooting

**Preset won't apply:**
- Check browser console for errors
- Verify the graphic_type exists in broadcast_graphics table
- Make sure action_sequence JSON is valid

**Duplicate graphics:**
- The system now upserts (update or insert), so duplicates are handled automatically
- If you see multiple, click "Reset to Default" first

**Automation not working:**
- Check automation_config in the preset
- Verify automation is enabled in global settings

---

## Next Steps

1. ✅ Run `/scripts/create-useful-presets.sql` in Supabase
2. ✅ Test each preset to see how they work
3. ✅ Customize text/colors for your show
4. ✅ Create your own custom presets for specific guests/topics

Happy streaming! 🎬
