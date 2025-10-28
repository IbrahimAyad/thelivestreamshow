# Popup Queue Manager - Quick Start Guide

## ✅ What's Available Now

### 1. **10 Pre-loaded Character Messages**
All these messages are already in your database and ready to use:

- **Alpha:** "Warning: Alpha levels are rising. If you're not ready, please log off and go journal."
- **AZ:** "AZ says this take is worse than your fantasy football team. And that team went 0–12."
- **Sylvester:** "This next comment has been cleared by legal. You're welcome, chat."
- **Rattlesnake:** "That last take was so cold, even Rattlesnake wouldn't touch it. And he eats frozen pizza."
- **Dr. MindEye:** "After careful examination, Dr. MindEye has confirmed… you need therapy."
- **Vic Nasty:** "Brace yourselves, Vic Nasty just walked in. We're about to get demonetized."
- **Gio:** "Gio owns more properties than you have unread emails. Sit down."
- **Emgo Billups:** "JJ Marcharty isn't on the screen, but Emgo is still yelling about him."
- **Ole Duit:** "Ole Duit says buy the dip. Of what? Doesn't matter. Just buy."
- **Abe:** "Abe just lost in Warzone again. That makes 7 in a row. Keep your thoughts and prayers coming."

---

## 🎮 How to Use

### **Option 1: Use Pre-loaded Character Messages**
1. Open **Popup Queue Manager** panel
2. Scroll down to **"Quick Add to Queue (from existing)"** section
3. You'll see all 10 character messages as buttons
4. Click any character button to add it to your queue
5. Click **"Start Queue"** to trigger the first popup on stream

### **Option 2: Create New Character Messages Manually**
1. Open **Popup Queue Manager** panel
2. Click the green **"+ New Message"** button
3. Fill in:
   - **Character Name:** e.g., "Alpha", "AZ", "Vic Nasty"
   - **Message:** The text Danny will read
4. Click **"Add to Queue"**
5. Message is automatically added to database AND queue
6. Click **"Start Queue"** to show it on stream

---

## ⚙️ Settings (Already Configured)

### **Popup Settings Panel:**
- ✅ **Popup Duration:** 15 seconds (default)
- ✅ **Auto-show next:** OFF (manual control)
- ✅ **🤖 Auto-Read with Danny:** OFF (manual "Play" button)
- ✅ **🔔 Notification Sound:** ON (chime before popup)

### **What This Means:**
- When popup appears → Chime plays first
- Then popup shows with character theme
- Click **"Play"** button to hear Danny read it
- Or toggle **Auto-Read ON** to have Danny auto-read

---

## 🎨 Visual Effects

Each character has a unique theme:
- **Alpha:** Red warning theme ⚠️
- **AZ:** Amber sports theme 🏈
- **Vic Nasty:** Dark red demon theme 😈
- **Abe:** Indigo gaming theme 🎮
- And more...

The popup automatically detects the character from the name in the topic field and applies the matching visual theme.

---

## 📺 Testing on Stream

### **Test Flow:**
1. **Main Dashboard** (`http://localhost:5174/`)
   - Open Popup Queue Manager
   - Add character messages to queue
   - Click "Start Queue"

2. **Broadcast Overlay** (`http://localhost:5174/broadcast`)
   - Open in OBS browser source
   - When you click "Start Queue" in main dashboard
   - Popup appears on overlay with character theme
   - Notification chime plays
   - Click "Play" to hear Danny read it

### **Quick Test:**
```
1. Add "Alpha" to queue
2. Click "Start Queue"
3. Watch overlay
4. See red warning popup with Alpha's message
5. Click "Play" to hear Danny's voice
```

---

## 🔊 Audio Setup

### **Danny Voice (F5-TTS):**
- Voice: **danny-low**
- Saved to localStorage (persists)
- Plays when you click "Play" button

### **Notification Sound:**
- Chime plays before popup
- Configured in soundboard as "TTS Notification"
- Can be toggled ON/OFF in settings

---

## 💡 Pro Tips

### **Building Your Queue:**
1. Add multiple character messages before stream
2. Use "Start Queue" to show them one by one
3. Auto-show next feature lets them play automatically
4. Each popup has countdown timer

### **Character Variety:**
- Mix serious (Dr. MindEye) with funny (Abe)
- Use Alpha for warnings/serious moments
- Use Vic Nasty for spicy takes
- Create narrative with character personalities

### **During Stream:**
- Pre-queue 3-5 messages before segment
- Click "Start Queue" when ready
- Let them play with timed intervals
- Add new messages on the fly with "New Message"

---

## 🚀 Future: AI Question Generator Integration

**Coming Soon:**
- AI will auto-generate questions from stream audio
- Questions will appear in "Quick Add" section
- You can still manually add character messages
- Both systems work together seamlessly

**For Now:**
- Use manual "New Message" button
- Or click pre-loaded character messages
- AI features disabled until platform testing complete

---

## 📝 Character Message Format

### **Template:**
```
Character Name: [Character Name]
Message: [What they say to the stream]
```

### **Examples:**
```
Character: Alpha
Message: Warning: Alpha levels are rising. If you're not ready, please log off and go journal.

Character: AZ
Message: AZ says this take is worse than your fantasy football team. And that team went 0–12.
```

### **Best Practices:**
- Keep messages concise (1-2 sentences)
- Give each character a unique voice/personality
- Use them to react to stream moments
- Match character to content (Alpha = warnings, Abe = gaming)

---

## ✅ Summary

**What You Can Do Right Now:**
1. Add 10 pre-loaded character messages to queue
2. Create new character messages manually
3. Test popups on broadcast overlay
4. Hear Danny read messages with F5-TTS
5. Use character themes for visual variety

**Settings Configured:**
- Auto-Read: OFF (manual "Play" button)
- Notification Sound: ON (chime before popup)
- Popup Duration: 15 seconds
- Queue automation: Available

**Ready for Stream:** YES ✅

---

**Created:** $(date)
**Location:** Popup Queue Manager Panel
**Test URL:** http://localhost:5174/broadcast
