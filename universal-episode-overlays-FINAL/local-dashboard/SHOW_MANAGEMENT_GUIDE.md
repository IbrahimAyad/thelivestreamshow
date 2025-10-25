# 🎬 Professional Show Management System - User Guide

## Overview

The Show Management System transforms your dashboard into a **professional multi-show broadcast production platform**. Manage multiple shows, episodes, and live broadcast information all in one place!

---

## 📺 Features

### 1. **Multi-Show Support**
- Create and manage multiple show series
- Each show has its own branding (theme colors, hashtags)
- Organize by category (Technology, Gaming, Interview, etc.)

### 2. **Episode Tracking**
- Season and episode numbering
- Episode titles and descriptions
- Air dates and status tracking
- Quick episode selector for going live

### 3. **Live Broadcast Control** ⭐
- **Single control panel** to update everything
- All changes reflect instantly on Broadcast View
- Update show info, episode, topic, and hashtags in seconds

### 4. **Professional Broadcast View**
- Show branding displayed on screen
- Episode information overlay
- Current topic indicator
- Hashtag display
- All updates in real-time

---

## 🚀 Quick Start Guide

### Step 1: Create Your First Show

1. Go to the **Shows** tab
2. Click **"New Show"** in the Show Management panel
3. Fill in:
   - **Show Name**: e.g., "Tech Talk Live"
   - **Category**: e.g., "Technology"
   - **Description**: Brief show description
   - **Theme Color**: Pick your brand color
   - **Default Hashtag**: e.g., #TechTalkLive
4. Click **"Create Show"**

**Tip:** The slug is auto-generated from the show name!

---

### Step 2: Create Episodes

1. In the **Episode Management** panel, select your show
2. Click **"New Episode"**
3. Fill in:
   - **Season**: Default is 1
   - **Episode #**: Auto-increments from last episode
   - **Episode Title**: e.g., "AI in 2025"
   - **Description**: What the episode is about
   - **Air Date**: When you're broadcasting
   - **Status**: Select "planning", "scheduled", or "live"
4. Click **"Create Episode"**

**Tip:** Episode numbers auto-increment, so you don't have to remember the last number!

---

### Step 3: Go Live! 📡

This is where the magic happens. Use the **Live Broadcast Control** panel to manage your broadcast in real-time.

1. **Select Current Show**: Choose from your dropdown
2. **Select Current Episode**: Pick the episode you're broadcasting
3. **Update Current Topic**: 
   - Type what you're discussing right now
   - Or use quick topic buttons: "Opening Segment", "Q&A Session", etc.
4. **Set Hashtag**: Your show's default hashtag is pre-filled, or customize it
5. **Display Social Media**: Toggle if you want hashtags shown on screen
6. Click **"UPDATE BROADCAST VIEW"** 🎯

**Result:** All this information instantly appears on your Broadcast View!

---

## 📊 Broadcast View Integration

### What Appears on Screen

When you open `/broadcast` in OBS, you'll see:

**Top Bar Overlay:**
- **Show Name** with theme color indicator
- **Episode Info**: "Season X, Episode Y: Title"
- **Current Topic**: "📍 What you're discussing now"
- **Hashtag**: Displayed in the corner

**Example Display:**
```
🔵 Tech Talk Live
    Season 2, Episode 15: AI in 2025
    📍 Q&A Session                                   #TechTalkLive
```

---

## 💡 Typical Workflow

### Before the Show
1. Go to **Shows** tab
2. Create episode for today (if not already done)
3. Set episode status to "scheduled"

### 5 Minutes Before Live
1. Open **Live Broadcast Control**
2. Select the show and episode
3. Set first topic: "Opening Segment"
4. Check hashtag
5. Click **"UPDATE BROADCAST VIEW"**
6. Open `/broadcast` in OBS as a Browser Source

### During the Show
As you move through your show:

1. **Change topics on the fly:**
   - Click "Q&A Session" → UPDATE
   - Type "Sponsor Break" → UPDATE
   - Click "Closing Remarks" → UPDATE

2. **All changes appear instantly on screen!**

### After the Show
1. Set episode status to "recorded" or "archived"
2. Your episode is saved with all metadata

---

## 🎯 Quick Topic Buttons

Pre-configured topics you can use with one click:
- **Opening Segment**
- **Main Discussion**
- **Q&A Session**
- **Guest Interview**
- **News & Updates**
- **Closing Remarks**
- **Ad Break**

You can also type custom topics!

---

## 🎨 Show Branding Tips

### Theme Colors
- Choose colors that match your brand
- These appear as indicators on Broadcast View
- Helps viewers identify your show instantly

### Hashtags
- Keep them short and memorable
- Use consistent hashtags for discoverability
- Example: #TechTalk, #GamingHour, #InterviewSeries

### Categories
Organize your shows by type:
- Technology
- Gaming
- Interview
- News
- Entertainment
- Education
- Sports

---

## 📝 Episode Management Tips

### Status Options

- **Planning**: Episode is in early stages
- **Scheduled**: Ready to go, air date set
- **Live**: Currently broadcasting
- **Recorded**: Finished, available for replay
- **Archived**: Older episodes for your records

### Season & Episode Numbering

**Best Practices:**
- Start with Season 1, Episode 1
- Increment episodes sequentially
- Start new seasons annually or after major breaks
- System auto-suggests next episode number

**Example Progression:**
- S1E1, S1E2, S1E3... S1E52 (Year 1)
- S2E1, S2E2, S2E3... (Year 2)

---

## 🔄 Real-Time Updates

All changes sync immediately via Supabase:
- Update in Control Panel → Broadcast View updates instantly
- No need to refresh or reload
- Perfect for live productions

---

## 🎬 Advanced Usage

### Multiple Shows

Managing different show types:

**Weekly Tech Show:**
- Name: "Tech Talk Live"
- Category: Technology
- Theme: Blue (#3b82f6)
- Schedule: Every Monday

**Gaming Stream:**
- Name: "Gaming Hour"
- Category: Gaming
- Theme: Red (#ef4444)
- Schedule: Fridays

**Interview Series:**
- Name: "Conversations"
- Category: Interview
- Theme: Green (#10b981)
- Schedule: Monthly

Switch between them instantly using the show selector!

---

## 🚨 Troubleshooting

### Episode not showing?
- Make sure you selected the correct show first
- Episode must belong to the selected show

### Changes not appearing on Broadcast View?
- Click "UPDATE BROADCAST VIEW" button
- Check that `/broadcast` is open and not cached
- Refresh the browser source in OBS if needed

### Can't see Shows tab?
- Make sure you're using the latest version
- The Shows tab is between "Production" and "Advanced"

---

## 📦 Sample Shows Included

The system comes with 3 sample shows:

1. **Tech Talk Live**
   - Theme: Blue (#3b82f6)
   - Hashtag: #TechTalkLive
   - Category: Technology

2. **Gaming Hour**
   - Theme: Red (#ef4444)
   - Hashtag: #GamingHour
   - Category: Gaming

3. **Interview Series**
   - Theme: Green (#10b981)
   - Hashtag: #InterviewSeries
   - Category: Interview

Feel free to edit or delete these and create your own!

---

## 🎯 Pro Tips

1. **Pre-create episodes** for the week ahead
2. **Use consistent naming** for easy searching
3. **Update topics frequently** to keep viewers engaged
4. **Test your setup** before going live
5. **Keep descriptions brief** but informative

---

## 🆘 Need Help?

**Common Questions:**

**Q: Can I have multiple shows running simultaneously?**
A: Only one show/episode can be "live" at a time via the Live Broadcast Control panel.

**Q: How do I delete a show?**
A: Click the trash icon in the Show Management panel. Note: This will not delete associated episodes (they'll remain in the database).

**Q: Can I change episode numbers after creation?**
A: Yes! Click edit on any episode and update the numbers.

**Q: What's the difference between Shows tab and Advanced tab?**
A: **Shows** = manage your content (shows, episodes). **Advanced** = manage production (scenes, cameras, graphics).

---

## 🎉 You're Ready!

You now have a professional broadcast production system with:
- ✅ Multi-show management
- ✅ Episode tracking
- ✅ Live content updates
- ✅ Professional on-screen graphics
- ✅ Real-time broadcast control

**Start creating shows and episodes, and take your broadcasts to the next level!** 🚀

---

*MiniMax Agent - Professional Show Management System*
*Version 2.0*
