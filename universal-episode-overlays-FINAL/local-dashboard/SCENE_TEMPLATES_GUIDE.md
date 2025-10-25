# Scene Templates Guide

## 🎬 7 Professional Broadcast Layouts

Each scene template is optimized for specific broadcast scenarios. All scenes render in real-time HTML/CSS and update instantly when you switch in the Producer Dashboard.

---

## 1. Full Screen Video 📺

### Visual Layout
```
┌─────────────────────────┐
│                         │
│   YouTube Video         │
│   (100% screen)         │
│                         │
└─────────────────────────┘
```

### Best Use Cases
- Watching YouTube videos with audience
- Playing intro/outro clips
- Showing tutorials or demonstrations
- Full-screen content presentation

### Configuration
- **Cameras Used:** 0
- **Video:** Fills entire 1920x1080 canvas
- **Audio:** YouTube video audio only

### When to Use
- "Let's watch this together"
- "Check out this amazing video"
- Playing pre-produced content
- Educational content sharing

### Producer Dashboard Setup
1. Add YouTube video to queue
2. Click "Play" on video
3. Switch to "Full Screen Video" scene
4. Optionally add lower thirds or LIVE indicator

---

## 2. Picture-in-Picture (PiP) 🖼️

### Visual Layout
```
┌─────────────────────────┐
│  YouTube Video (70%)    │
│                         │
│              ┌────────┐ │
│              │Webcam  │ │
│              │(20%)   │ │
└──────────────┴────────┘─┘
```

### Best Use Cases
- Reaction videos
- Commentary while watching content
- Showing yourself while presenting
- Co-watching with audience

### Configuration
- **Cameras Used:** 1 (Position 1 - Host Camera)
- **Video:** 70% of screen (main area)
- **Camera:** 20% size, positioned in corner
- **Camera Position:** Configurable (bottom-right default)

### Available Camera Positions
- Bottom Right (default)
- Bottom Left
- Top Right
- Top Left

### When to Use
- "Here's my reaction to this clip"
- "Let me comment on this video"
- Tutorial presentations
- Product demonstrations

### Producer Dashboard Setup
1. Configure Camera Position 1 (Host)
2. Add YouTube video to queue
3. Click "Play" on video
4. Switch to "Picture-in-Picture" scene
5. Webcam appears in corner automatically

---

## 3. Split Screen 👥

### Visual Layout
```
┌───────────┬───────────┐
│           │           │
│ Camera 1  │ Camera 2  │
│  (50%)    │  (50%)    │
│           │           │
└───────────┴───────────┘
```

### Best Use Cases
- 1-on-1 interviews
- Podcast conversations
- Debates
- Collaborative discussions

### Configuration
- **Cameras Used:** 2 (Position 1 + Position 2)
- **Layout:** 50/50 side-by-side split
- **Equal sizing** for both cameras

### When to Use
- "Welcome to the podcast"
- "Today's guest is..."
- Dual-host shows
- Partner collaborations

### Producer Dashboard Setup
1. Configure Camera Position 1 (Host)
2. Configure Camera Position 2 (Guest)
3. Ensure both cameras are toggled ON
4. Switch to "Split Screen" scene
5. Both cameras appear side-by-side

### Tips
- Label cameras clearly ("Host", "Guest")
- Test audio levels for both cameras
- Consider mirroring your own camera
- Position both people at similar distances from camera

---

## 4. Panel Grid 👨‍👩‍👧‍👦

### Visual Layout
```
┌──────────┬──────────┐
│ Camera 1 │ Camera 2 │
├──────────┼──────────┤
│ Camera 3 │ Camera 4 │
└──────────┴──────────┘
```

### Best Use Cases
- Panel discussions
- Roundtable talks
- Multi-guest shows
- Team meetings

### Configuration
- **Cameras Used:** 4 (All positions)
- **Layout:** 2x2 grid
- **Equal sizing** for all cameras

### When to Use
- "Welcome to our expert panel"
- "Today's roundtable discussion"
- Group Q&A sessions
- Multi-person streams

### Producer Dashboard Setup
1. Configure all 4 camera positions
2. Label each: "Host", "Guest 1", "Guest 2", "Guest 3"
3. Toggle all cameras ON
4. Switch to "Panel Grid" scene
5. All cameras appear in 2x2 grid

### Tips
- Ensure good lighting for all participants
- Test each camera feed before going live
- Consider using name tags (lower thirds) to identify speakers
- Mute cameras not currently speaking to reduce background noise

---

## 5. Interview Layout 🎤

### Visual Layout
```
┌───────────┬───────────┐
│           │           │
│Interviewer│Interviewee│
│  (50%)    │  (50%)    │
│           │           │
└───────────┴───────────┘
```

### Best Use Cases
- Formal interviews
- Q&A sessions
- Professional conversations
- Expert consultations

### Configuration
- **Cameras Used:** 2 (Position 1 + Position 2)
- **Layout:** 50/50 split (same as Split Screen)
- **With name labels** below each camera

### Difference from Split Screen
- Designed for interviewer/interviewee dynamic
- Optimized for displaying name labels
- Can show lower thirds for guest credentials

### When to Use
- "Today I'm interviewing..."
- Professional interview setups
- Guest expert sessions
- One-on-one conversations

### Producer Dashboard Setup
1. Configure Camera Position 1 (Interviewer)
2. Configure Camera Position 2 (Interviewee)
3. Create lower third with interviewee's name and title
4. Switch to "Interview Layout" scene
5. Show lower third to introduce guest

### Tips
- Use lower thirds to display guest credentials
- Keep interviewer camera labeled consistently
- Consider slightly different camera angles for visual variety
- Test audio balance between both cameras

---

## 6. Reaction View 😮

### Visual Layout
```
┌─────────────────────────┐
│  YouTube Video (top 70%)│
│                         │
├─────────────────────────┤
│ Host Webcam (bottom 30%)│
└─────────────────────────┘
```

### Best Use Cases
- Video reactions
- Watch-along streams
- Commentary channels
- React content

### Configuration
- **Cameras Used:** 1 (Position 1 - Host)
- **Video:** Top 70% of screen
- **Camera:** Bottom 30% strip
- **Widescreen camera view**

### When to Use
- "Let's react to this new trailer"
- "My first time watching..."
- Music video reactions
- Game trailer reactions

### Producer Dashboard Setup
1. Configure Camera Position 1 (Host)
2. Add YouTube video to queue
3. Click "Play" on video
4. Switch to "Reaction View" scene
5. Video plays on top, you appear below

### Tips
- Face camera while reacting (not just watching video)
- Use facial expressions prominently
- Consider pausing video to add commentary
- Use lower thirds to show video title or timestamps

---

## 7. Intermission ☕

### Visual Layout
```
┌─────────────────────────┐
│                         │
│    [Logo/Branding]      │
│                         │
│  "Be Right Back"        │
│                         │
└─────────────────────────┘
```

### Best Use Cases
- Break time
- Technical difficulties
- Pre-show countdown
- Post-show "Thanks for watching"

### Configuration
- **Cameras Used:** 0
- **No video playback**
- **Branding-focused**
- **Customizable message**

### Default Display
- Gradient purple/blue background
- Large emoji icon (📺)
- "Be Right Back" message
- Animated dots (loading indicator)

### Customization Options
Configuration in database:
```json
{
  "show_logo": true,
  "message": "Be Right Back"
}
```

### When to Use
- Before going live
- During breaks
- Technical difficulties
- Transitioning between segments

### Producer Dashboard Setup
1. Switch to "Intermission" scene before breaks
2. Optionally customize message
3. Toggle LIVE indicator OFF
4. Switch back to active scene when ready

### Tips
- Use before your stream starts
- Switch to intermission during tech issues
- Add countdown timer overlay for timed breaks
- Consider adding background music in OBS

---

## 🔄 Scene Switching Best Practices

### Smooth Transitions

**Plan your scene flow:**
1. Pre-show: Intermission
2. Opening: Full Screen Video (intro)
3. Main content: Picture-in-Picture or Split Screen
4. Mid-show: Reaction View (for video segments)
5. Panel discussion: Panel Grid
6. Closing: Full Screen Video (outro)
7. Post-show: Intermission ("Thanks for watching")

### Timing Considerations

**Don't switch scenes too frequently:**
- Give audience time to adjust to each scene (minimum 30 seconds)
- Switch during natural breaks in conversation
- Use lower thirds and graphics instead of scene changes when possible

### Audio Continuity

**When switching scenes:**
- Audio continues uninterrupted
- YouTube videos keep playing across scene changes
- Camera audio stays active

### Testing Scenes

**Before going live:**
1. Test each scene you plan to use
2. Verify all cameras appear correctly
3. Check that graphics overlay properly
4. Ensure audio levels are balanced

---

## 💡 Creative Scene Usage

### Hybrid Layouts

**Combine scenes with graphics:**
- Full Screen Video + Lower Third = Video with guest info
- Picture-in-Picture + LIVE Indicator = Live reaction
- Panel Grid + Segment Banner = Labeled panel discussion

### Dynamic Storytelling

**Use scenes to enhance narrative:**
- Start with Intermission (build anticipation)
- Switch to Full Screen Video (intro)
- Move to Picture-in-Picture (your commentary)
- Switch to Interview Layout (introduce guest)
- Use Split Screen (conversation)
- Return to Full Screen Video (outro)

### Engagement Techniques

**Scene changes grab attention:**
- Switch scenes to reset viewer focus
- Use Reaction View for surprising moments
- Panel Grid for group reactions
- Intermission to build suspense

---

## 🎨 Customization

All scenes can be customized by modifying the database:

### Example: Custom PiP Camera Size

```sql
UPDATE broadcast_scenes 
SET config = '{"video_size": 80, "camera_size": 15, "camera_position": "top_left"}'
WHERE layout_type = 'pip';
```

### Example: Custom Intermission Message

```sql
UPDATE broadcast_scenes 
SET config = '{"show_logo": true, "message": "Stream Starts in 5 Minutes"}'
WHERE layout_type = 'intermission';
```

---

## ✅ Quick Reference

| Scene | Cameras | Video | Best For |
|-------|---------|-------|----------|
| Full Screen Video | 0 | ✅ | Watching content |
| Picture-in-Picture | 1 | ✅ | Reactions, commentary |
| Split Screen | 2 | ❌ | Interviews, podcasts |
| Panel Grid | 4 | ❌ | Panel discussions |
| Interview Layout | 2 | ❌ | Formal interviews |
| Reaction View | 1 | ✅ | React content |
| Intermission | 0 | ❌ | Breaks, pre/post-show |

---

**Created by:** MiniMax Agent  
**Last Updated:** 2025-10-13  
**For:** Browser-Based Broadcast Production System
