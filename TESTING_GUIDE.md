# Complete Show Template & AI Features Testing Guide

## Overview
This guide demonstrates testing the complete workflow from AI template generation through show archiving using the newly implemented features.

## Best Template Options for Livestream Platform

Based on your platform's focus on live streaming, here are the recommended template types in order of priority:

### 1. **Tech Talk Template** (RECOMMENDED)
- **Perfect for**: Technical livestream discussions, developer content, tech news
- **Duration**: 60 minutes
- **Segments**: 5 (Intro → Tech News → Deep Dive → Q&A → Outro)
- **Questions**: 5 pre-loaded questions covering background, AI/ML, learning, tools, advice

### 2. **Interview Series Template**
- **Perfect for**: Guest appearances, expert interviews, community spotlights
- **Duration**: 55 minutes
- **Segments**: 5 (Intro → Background → Expertise Deep Dive → Rapid Fire → Outro)
- **Questions**: 5 pre-loaded interview questions

### 3. **Educational Workshop Template**
- **Perfect for**: Tutorial streams, coding sessions, how-to content
- **Duration**: 60 minutes
- **Segments**: 5 (Intro → Concept Overview → Live Demo → Common Mistakes → Outro)
- **Questions**: 5 educational questions

---

## Complete Testing Workflow

### Phase 1: Create a Template

#### Option A: Quick Start (Fastest - No API Key Needed)
1. Navigate to the dashboard
2. Click **"Create Template"** button (purple, in Template Selector)
3. Choose **"Tech Talk"** from Quick Start options
4. Review the generated template:
   ```
   Name: Weekly Tech Talk
   Description: Discussion show focused on technology trends and news
   Duration: 60 minutes
   Segments: 5
   Questions: 5
   ```
5. Click **"Save Template"**
6. ✅ **Verify**: Template appears in Template Selector grid

#### Option B: AI Generator (Custom - Requires OpenAI API Key)
1. Click **"Create Template"** button
2. Select **"Generate with AI Producer"**
3. Fill in the form:
   ```
   Show Type: Live Coding Stream
   Main Topic: Modern web development with React and TypeScript, featuring live coding sessions and viewer Q&A
   Target Duration: 60
   ```
4. Click **"Generate Template"**
5. ⏳ Wait 3-5 seconds for AI generation
6. Review AI-generated template (example output):
   ```json
   {
     "name": "Code & Coffee: Live Dev Stream",
     "description": "Interactive coding sessions exploring modern web development with React, TypeScript, and real-time viewer collaboration",
     "recommendedDuration": 60,
     "segments": [
       {
         "name": "Morning Brew",
         "topic": "What We're Building Today",
         "question": "What problem are we solving?",
         "estimatedMinutes": 5
       },
       {
         "name": "Code Setup",
         "topic": "Project Configuration & Dependencies",
         "question": "What tools are we using?",
         "estimatedMinutes": 10
       },
       {
         "name": "Live Coding",
         "topic": "Core Feature Implementation",
         "question": "How do we implement this?",
         "estimatedMinutes": 30
       },
       {
         "name": "Viewer Q&A",
         "topic": "Community Questions",
         "question": "What questions do you have?",
         "estimatedMinutes": 10
       },
       {
         "name": "Wrap & Deploy",
         "topic": "Testing & Next Steps",
         "question": "What's next week's project?",
         "estimatedMinutes": 5
       }
     ],
     "questions": [
       {
         "text": "What made you start coding?",
         "topic": "Background",
         "category": "opener"
       },
       {
         "text": "What's your favorite feature of TypeScript?",
         "topic": "TypeScript",
         "category": "deep_dive"
       },
       {
         "text": "How do you handle state management in large React apps?",
         "topic": "React Architecture",
         "category": "deep_dive"
       },
       {
         "text": "What development tools can't you live without?",
         "topic": "Developer Tools",
         "category": "deep_dive"
       },
       {
         "text": "What should beginners focus on in 2024?",
         "topic": "Career Advice",
         "category": "closer"
       }
     ]
   }
   ```
7. Click **"Save Template"**
8. ✅ **Verify**: Custom AI template appears in Template Selector

---

### Phase 2: Load Template into Show

1. In Template Selector, find your saved template
2. Click **"Load"** button
3. ⏳ Wait for template cloning process
4. ✅ **Verify Success Alert**:
   ```
   Template loaded! 5 segments and 5 questions ready.
   ```
5. ✅ **Verify**: Page reloads with segments populated in UI
6. ✅ **Verify**: Questions appear in question bank

---

### Phase 3: Configure Episode Info

1. Navigate to **Episode Info Panel**
2. Set episode details:
   ```
   Episode Number: 1
   Episode Title: Building a Real-Time Chat App
   Episode Topic: WebSockets, React, and TypeScript Integration
   ```
3. ✅ **Verify**: Episode info is saved to show_metadata table

---

### Phase 4: Start the Show (Session Tracking Test)

1. Navigate to **Show Metadata Control**
2. Review current status display:
   ```
   Show Status: OFF AIR
   Mode: ✓ PRODUCTION (or ⚠️ REHEARSAL)
   Start Time: Not started
   ```
3. Optional: Toggle **Rehearsal Mode** if testing
4. Optional: Toggle **AI Automation** to enable AI features
5. Click **"Start Show"** button
6. Confirm in dialog: **"Confirm Start"**
7. ✅ **Verify**:
   - Status changes to 🔴 LIVE with animate-pulse
   - Start time appears (e.g., "Jan 20, 2:30 PM")
   - New session created in `show_sessions` table
   - Console logs: `✅ Session created: [session-id]`

---

### Phase 5: Run the Show

1. Use **Segment Navigator** to progress through segments
2. Use **Question Queue** to add questions during show
3. Use **Show Notes** to take notes
4. Create bookmarks using bookmark feature
5. ✅ **Verify**:
   - Current segment highlights properly
   - Questions can be marked as used
   - Notes autosave
   - Show timer runs

---

### Phase 6: End Show & Archive (NEW FEATURE TEST)

1. Click **"End Show & Archive"** button
2. Review End Show Modal:
   ```
   Episode #1: Building a Real-Time Chat App
   Topic: WebSockets, React, and TypeScript Integration
   Duration: [actual duration]
   ```
3. Add show notes (optional):
   ```
   Great episode! We built a complete WebSocket chat system.
   Covered connection handling, message broadcasting, and TypeScript types.
   Next week: Adding authentication and persistence.
   ```
4. Click **"Generate YouTube Description"** (if desired)
5. Review AI-generated description
6. Click **"End Show & Archive Session"**
7. ✅ **Verify Success**:
   - Alert: "Show archived successfully!"
   - Show status returns to OFF AIR
   - Session status updated to 'completed' in database
   - Duration saved
   - Show notes saved
   - Questions used recorded
   - Bookmarks preserved

---

### Phase 7: Review Archived Show (NEW FEATURE TEST)

1. Navigate to **Show History Panel**
2. ✅ **Verify**: Archived episode appears in list:
   ```
   Episode #1 - Building a Real-Time Chat App
   WebSockets, React, and TypeScript Integration
   Jan 20, 2025 • 45m • 5 questions • 3 bookmarks
   ```
3. Click **"View"** button
4. ✅ **Verify Detail View Shows**:
   - Complete episode metadata
   - Show notes (if added)
   - All questions used during show
   - All bookmarks with timestamps
   - YouTube description (if generated)

---

### Phase 8: Export Session Data (NEW FEATURE TEST)

1. In Show History detail view, click **"Export JSON"**
2. ✅ **Verify**:
   - File downloads: `episode-1-building-a-real-time-chat-app.json`
   - File contains complete session data:
     ```json
     {
       "id": "uuid",
       "episode_number": 1,
       "episode_title": "Building a Real-Time Chat App",
       "episode_topic": "WebSockets, React, and TypeScript Integration",
       "episode_date": "2025-01-20",
       "duration_seconds": 2700,
       "status": "completed",
       "analytics": {...},
       "youtube_description": "...",
       "show_notes": "...",
       "questions_used": [...],
       "bookmarks": [...]
     }
     ```

---

### Phase 9: Template Management (NEW FEATURE TEST)

#### Delete Template
1. Navigate to Template Selector
2. Find a test template
3. Click **trash icon** button (red)
4. Confirm deletion dialog
5. ✅ **Verify**:
   - Template removed from list
   - Associated segments deleted (CASCADE)
   - Associated questions deleted (CASCADE)

#### Create New Template
1. Click **"Create Template"** button again
2. Test different quick templates or AI generation
3. ✅ **Verify**: Multiple templates can coexist

---

## Expected AI Behaviors

### When AI Automation is ENABLED:
1. **Producer AI**: Suggests segment transitions based on timing
2. **Auto-Director**: Recommends camera angles/scenes
3. **AI Context Analyzer**: Provides real-time insights on discussion

### When AI Automation is DISABLED:
- All features run in manual mode
- Producer suggestions still available on-demand

---

## Database Verification Queries

If you want to verify data in Supabase:

```sql
-- View all templates
SELECT id, name, description, is_template
FROM shows
WHERE is_template = true;

-- View all sessions
SELECT id, episode_number, episode_title, status, duration_seconds, created_at
FROM show_sessions
ORDER BY created_at DESC;

-- View session with full details
SELECT *
FROM show_sessions
WHERE id = '[session-id]';

-- View segments for a show
SELECT show_id, name, topic, position
FROM show_segments
WHERE show_id = '[show-id]'
ORDER BY position;

-- View questions for a show
SELECT show_id, question_text, topic, position
FROM show_questions
WHERE show_id = '[show-id]'
ORDER BY position;
```

---

## Known Behaviors

1. **Template Loading**: Triggers full page reload after successful clone
2. **Session Creation**: Creates new record immediately on "Start Show"
3. **Session ID**: Passed to EndShowModal for archiving
4. **Export Format**: Pretty-printed JSON with 2-space indentation
5. **Delete Confirmation**: Required for template deletion
6. **AI Generation**: Requires valid VITE_OPENAI_API_KEY in environment

---

## Troubleshooting

### Template Not Loading
- Check console for RPC errors
- Verify `clone_template_to_show` function exists in Supabase
- Check database permissions

### Session Not Creating
- Verify `show_sessions` table exists
- Check show_metadata has episode info populated
- Review console logs for session creation errors

### Export Not Downloading
- Check browser download settings
- Verify session data is complete
- Look for JSON serialization errors

### AI Generation Failing
- Verify VITE_OPENAI_API_KEY is set
- Check OpenAI API quota/billing
- Review network tab for API errors

---

## Success Criteria

✅ **All features working if**:
1. Templates can be created via Quick Start or AI
2. Templates can be loaded into active show
3. Templates can be deleted
4. Shows can be started (creates session)
5. Shows can be ended (archives session)
6. Archived shows appear in history
7. Sessions can be exported as JSON
8. All data persists correctly in database

---

## Recommended Test Flow (5 Minutes)

**Quick validation of all features:**

1. **Create** → Click "Create Template" → Choose "Tech Talk" → Save (30s)
2. **Load** → Click "Load" on Tech Talk template → Wait for reload (15s)
3. **Configure** → Set Episode #1 info in Episode Info Panel (30s)
4. **Start** → Click "Start Show" → Confirm (10s)
5. **Run** → Navigate through 1-2 segments (60s)
6. **End** → Click "End Show & Archive" → Add notes → End (30s)
7. **Review** → Open Show History → View episode (30s)
8. **Export** → Click "Export JSON" → Verify download (15s)
9. **Delete** → Delete test template (15s)

**Total: ~4 minutes for complete workflow test**

---

## Next Steps

After validating this workflow works correctly:

1. Create your production templates (Tech Talk, Interview, Educational)
2. Configure default episode info
3. Set up AI automation preferences
4. Run a real show end-to-end
5. Review analytics and session data
6. Export important sessions for backup

---

*Generated: January 20, 2025*
*All features implemented and ready for testing*
