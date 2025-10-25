# 📝 How to Update Episode Info - Quick Guide

## ✅ Your Database is Ready!

The [is_visible](file:///Users/ibrahim/Desktop/thelivestreamshow/src/lib/supabase.ts#L61-L61) column exists and is working. Here's how to update episode information:

---

## 🎯 Where to Update Episode Info

### **Director Panel → Episode Info Section**

1. **Open your browser** to `http://localhost:5173`
2. Go to **Director Panel** (main tab)
3. Scroll to **"🎬 Show Start Controls"** section
4. Find **"Episode Info"** panel

---

## 📋 Episode Info Panel Layout

```
┌──────────────────────────────────────────────────┐
│ 🎬 Episode Info   [👁 On Air] [⬆ Hide]         │
├──────────────────────────────────────────────────┤
│  Episode Number: [  32  ]  Date: [2025-10-22]   │
│  Episode Title:  [  Test  ]                      │
│  Episode Topic:  [________________________]      │
│                                                   │
│             [Update Episode Info]                │
│                                                   │
│  Current Episode: #32 · 2025-10-22               │
│  Test                                            │
└──────────────────────────────────────────────────┘
```

---

## ✏️ How to Update

### **Step 1: Edit the Fields**

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Episode Number** | Current episode # | `32` |
| **Episode Date** | Air date | `2025-10-24` |
| **Episode Title** | Episode name | `"Alpha Wednesday"` |
| **Episode Topic** | What's it about | `"AI Discussion"` |

### **Step 2: Click "Update Episode Info"**

- Click the blue **"Update Episode Info"** button
- ✅ You'll see: "Episode info updated successfully!"
- ⚡ Updates broadcast **instantly** (real-time)

### **Step 3: Check the Broadcast**

- Open `http://localhost:5173/broadcast` in another tab
- You'll see the overlay in **bottom-right corner**:

```
┌────────────────┐
│ EP 32          │
│ Oct 24, 2025   │
│ Alpha Wednesday│
└────────────────┘
```

---

## 👁️ Show/Hide on Broadcast

### **"On Air" Button (Green)** = Episode info IS showing on broadcast

- Click to **hide** from broadcast
- Button turns gray: "👁❌ Hidden"
- Overlay disappears from `/broadcast`

### **"Hidden" Button (Gray)** = Episode info NOT showing on broadcast

- Click to **show** on broadcast  
- Button turns green: "👁 On Air"
- Overlay appears on `/broadcast`

---

## 🎬 Current Episode Status

**Your current settings:**
- **Episode #**: 32
- **Title**: "Test"
- **Date**: 2025-10-22
- **Broadcast Status**: 🟢 **VISIBLE** (will show on stream)

---

## 🔄 Real-Time Updates

**Any changes you make update instantly:**

1. Edit Episode #32 → "Alpha Wednesday"
2. Click "Update Episode Info"
3. ✅ Broadcast overlay updates **immediately** (no refresh needed)

**Multi-window sync:**
- Open `/broadcast` in one window
- Update episode in Director Panel
- Watch overlay change in real-time ✨

---

## 📍 Where to Find It

### Visual Guide:

```
Director Panel
  ↓
Scroll down to "🎬 Show Start Controls"
  ↓
Look for "🎬 Episode Info" panel
  ↓
Edit fields & click "Update Episode Info"
```

### URL:
`http://localhost:5173` → Director Panel tab → Scroll to Episode Info

---

## 🧪 Quick Test

**Test the system:**

1. **Change episode number**: `32` → `33`
2. **Change title**: `"Test"` → `"My New Show"`
3. **Click**: "Update Episode Info"
4. **Check**: `/broadcast` → See "EP 33" and "My New Show"
5. **Toggle**: Click "On Air" button → Overlay disappears
6. **Toggle again**: Click "Hidden" button → Overlay appears

---

## 🎨 What Shows on Broadcast

**Bottom-right corner overlay shows:**

| Display | Source Field |
|---------|-------------|
| `EP 32` | Episode Number |
| `Oct 22, 2025` | Episode Date (formatted) |
| `Test` | Episode Title |

**Optional:** Episode Topic (currently hidden but can be shown)

---

## 💡 Pro Tips

### ✅ Best Practices:
- **Update before show starts** - Set episode info in advance
- **Use descriptive titles** - Makes overlays more informative
- **Toggle visibility** - Hide during gameplay, show during segments
- **Check /broadcast** - Always verify how it looks on stream

### 🚫 Common Mistakes:
- Forgetting to click "Update Episode Info" button
- Not checking if overlay is visible (`"On Air"` vs `"Hidden"`)
- Typing in wrong date format (use date picker)

---

## 🔧 Troubleshooting

### "I don't see the Episode Info panel"

**Solution:**
1. Make sure you're on the **Director Panel** tab (not Studio/Media)
2. Scroll down to **"🎬 Show Start Controls"** section
3. Panel should be between **"Show Metadata Control"** and **"Graphics Overlays"**

### "I updated but don't see changes on /broadcast"

**Check:**
1. ✅ Did you click "Update Episode Info"?
2. ✅ Is the button showing "👁 On Air" (green)?
3. ✅ Hard refresh `/broadcast` page (Cmd+Shift+R)
4. ✅ Check browser console for errors

### "Button is gray (Hidden) but I want it visible"

**Solution:**
- Click the **"Hidden"** button once
- It will turn green and say **"On Air"**
- Overlay appears on broadcast immediately

---

## 📊 Database Info

**Your episode data is stored in:**
- **Table**: `episode_info`
- **Current Record**: Episode #32 "Test"
- **Active**: `true`
- **Visible**: `true`

**Fields in database:**
```sql
id: 59c2156d-37c1-4365-942f-0d03681a6db9
episode_number: 32
episode_title: "Test"
episode_date: "2025-10-22"
episode_topic: ""
is_active: true
is_visible: true ✅
```

---

## 🎉 You're All Set!

**Everything is working:**
- ✅ Database has [is_visible](file:///Users/ibrahim/Desktop/thelivestreamshow/src/lib/supabase.ts#L61-L61) column
- ✅ Director Panel has Episode Info section
- ✅ Broadcast shows PiNamecardOverlay
- ✅ Real-time sync is active
- ✅ Toggle button controls visibility

**Just update the fields and click "Update Episode Info"!** 🚀

---

## 📸 Screenshot Locations

**Director Panel:**
```
http://localhost:5173
→ Scroll to "🎬 Show Start Controls"
→ Find "🎬 Episode Info" panel
```

**Broadcast Overlay:**
```
http://localhost:5173/broadcast
→ Look at bottom-right corner
→ Gold-bordered overlay
```

---

**Need more help?** Check:
- [`UNIVERSAL_EPISODE_SYSTEM_COMPLETE.md`](file:///Users/ibrahim/Desktop/thelivestreamshow/UNIVERSAL_EPISODE_SYSTEM_COMPLETE.md) - Full technical docs
- [`EPISODE_INFO_BROADCAST_TOGGLE.md`](file:///Users/ibrahim/Desktop/thelivestreamshow/EPISODE_INFO_BROADCAST_TOGGLE.md) - Visibility toggle guide

**Happy streaming!** 🎬✨
