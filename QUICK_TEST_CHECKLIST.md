# Quick Test Checklist - AI Show Template Features

## Pre-Flight Check
- [ ] Dev server running (`pnpm run dev`)
- [ ] Supabase connected
- [ ] OpenAI API key set (optional, for AI generation)

---

## 1. Template Creation ✨

### Quick Start (No API Key)
- [ ] Click "Create Template" button (purple)
- [ ] Select "Tech Talk" from Quick Start
- [ ] Review template preview (5 segments, 5 questions)
- [ ] Click "Save Template"
- [ ] Alert: "Template saved successfully!"
- [ ] Template appears in Template Selector grid

### AI Generator (Requires API Key)
- [ ] Click "Create Template" → "Generate with AI Producer"
- [ ] Enter:
  - Show Type: `Live Coding Stream`
  - Topic: `Modern web development with React and TypeScript`
  - Duration: `60`
- [ ] Click "Generate Template"
- [ ] Wait 3-5 seconds
- [ ] Review AI-generated segments and questions
- [ ] Click "Save Template"
- [ ] Template appears in selector

---

## 2. Load Template 📋
- [ ] Find template in Template Selector
- [ ] Click "Load" button
- [ ] Alert: "Template loaded! X segments and Y questions ready."
- [ ] Page reloads
- [ ] Segments visible in UI
- [ ] Questions visible in question bank

---

## 3. Configure Episode 📝
- [ ] Open Episode Info Panel
- [ ] Set Episode Number: `1`
- [ ] Set Episode Title: `Test Episode`
- [ ] Set Episode Topic: `Testing the new features`
- [ ] Changes auto-save

---

## 4. Start Show 🎬
- [ ] Open Show Metadata Control
- [ ] Status shows "OFF AIR"
- [ ] Click "Start Show"
- [ ] Click "Confirm Start"
- [ ] Status changes to "🔴 LIVE" (animated)
- [ ] Start time appears
- [ ] Console log: "✅ Session created: [id]"

---

## 5. Run Show ▶️
- [ ] Navigate through 2-3 segments
- [ ] Add 1-2 questions to queue
- [ ] Mark questions as used
- [ ] Add show notes
- [ ] Create a bookmark
- [ ] Timer is running

---

## 6. End Show & Archive 🏁
- [ ] Click "End Show & Archive"
- [ ] Modal opens with episode info
- [ ] Add show notes: `Great test run!`
- [ ] (Optional) Click "Generate YouTube Description"
- [ ] Click "End Show & Archive Session"
- [ ] Alert: "Show archived successfully!"
- [ ] Status returns to "OFF AIR"

---

## 7. View History 📚
- [ ] Open Show History Panel
- [ ] Archived episode appears in list
- [ ] Shows: episode number, title, duration, question count
- [ ] Click "View" button
- [ ] Detail view shows:
  - Episode metadata
  - Show notes
  - Questions used
  - Bookmarks
  - YouTube description (if generated)

---

## 8. Export Session 💾
- [ ] In detail view, click "Export JSON"
- [ ] File downloads: `episode-1-test-episode.json`
- [ ] Open file - contains complete session data
- [ ] JSON is valid and readable

---

## 9. Template Management 🗑️
- [ ] Return to Template Selector
- [ ] Find test template
- [ ] Click trash icon (red)
- [ ] Confirm deletion
- [ ] Alert: "Template deleted successfully!"
- [ ] Template removed from list

---

## 10. Repeat Test 🔁
- [ ] Create another template (different type)
- [ ] Load → Configure → Start → Run → End → Archive
- [ ] Verify multiple sessions in history
- [ ] Export different sessions

---

## Success Metrics ✅

**Core Features Working:**
- ✅ 5 Quick Start templates available
- ✅ AI generation creates custom templates
- ✅ Templates load into show correctly
- ✅ Session created when show starts
- ✅ Session archived when show ends
- ✅ History shows all archived shows
- ✅ Export downloads valid JSON
- ✅ Delete removes templates

**Data Integrity:**
- ✅ Sessions have correct episode info
- ✅ Duration calculated correctly
- ✅ Questions used tracked
- ✅ Bookmarks preserved
- ✅ Show notes saved

**UI/UX:**
- ✅ All buttons responsive
- ✅ Loading states shown
- ✅ Success/error messages clear
- ✅ Confirmations for destructive actions
- ✅ No console errors

---

## Time Estimate
- **Full Test**: 10-15 minutes
- **Quick Validation**: 5 minutes
- **Per Template Type**: 3 minutes

---

## Recommended Testing Order

1. **Quick Start First** (easier, no API key needed)
   - Tech Talk → Load → Start → End → Archive → Export → Delete

2. **AI Generation** (if API key available)
   - Custom topic → Generate → Load → Test

3. **Different Template Types**
   - Interview template
   - Educational template
   - Gaming template
   - News Roundup template

4. **Edge Cases**
   - Very short show (1 minute)
   - Very long show (2+ hours)
   - Show with no notes
   - Show with many bookmarks
   - Multiple shows same day

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Template won't load | Check console, verify RPC function exists |
| AI generation fails | Verify VITE_OPENAI_API_KEY is set |
| Session not creating | Check show_metadata has episode info |
| Export not downloading | Check browser download permissions |
| Delete not working | Verify database CASCADE configured |

---

## Next Actions After Testing

- [ ] Create production templates
- [ ] Configure AI automation preferences
- [ ] Set default episode info
- [ ] Run first real show
- [ ] Review analytics
- [ ] Export and backup important sessions

---

*Last Updated: January 20, 2025*
*Version: 1.0 - Initial Release*
