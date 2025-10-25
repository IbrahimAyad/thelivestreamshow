# 📋 Unified Overlay System - Deployment Checklist

Use this checklist to track your deployment progress. Check off each item as you complete it.

---

## ✅ Pre-Deployment Preparation

### Verify Integration Files
- [ ] Run validation script: `bash validate-overlay-integration.sh`
- [ ] Confirm all checks pass
- [ ] Review `QUICK_DEPLOY.md` for deployment overview
- [ ] Open `UNIFIED_OVERLAY_INTEGRATION_GUIDE.md` for detailed steps

### Environment Setup
- [ ] Supabase project is accessible
- [ ] Can log into Supabase Dashboard
- [ ] `.env.local` contains `VITE_SUPABASE_URL`
- [ ] `.env.local` contains `VITE_SUPABASE_ANON_KEY`
- [ ] Development server is stopped (if running)

### Backup Current System
- [ ] Create git commit of current state: `git add . && git commit -m "Pre-overlay-integration backup"`
- [ ] Optional: Create git branch: `git checkout -b unified-overlay-live`
- [ ] Document current dashboard layout (screenshot)

---

## 🗄️ Phase 1: Database Deployment (5 min)

### Execute Migration
- [ ] Open Supabase Dashboard: https://supabase.com/dashboard/project/vcniezwtltraqramjlux
- [ ] Navigate to: SQL Editor → New Query
- [ ] Open file: `unified-overlay-system-integration/backend/sql-scripts/01_unified_overlay_migration.sql`
- [ ] Copy entire file contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" (or Cmd+Enter / Ctrl+Enter)
- [ ] Wait for "Success" confirmation

### Verify Database Tables
- [ ] Go to Supabase Table Editor
- [ ] Confirm `overlays` table exists
- [ ] Confirm `overlay_content` table exists
- [ ] Confirm `chat_messages` table exists
- [ ] Confirm `overlay_widgets` table exists

### Verify Seed Data
- [ ] Open `overlays` table
- [ ] Confirm 3 rows: Main Stream, Starting Soon, Be Right Back
- [ ] Open `overlay_content` table
- [ ] Confirm ~12 rows (content fields)
- [ ] Open `chat_messages` table
- [ ] Confirm 60+ rows (chat messages)

### Get Overlay ID
- [ ] In `overlays` table, find "Main Stream" row
- [ ] Copy the UUID value from `id` column
- [ ] Save this UUID somewhere (you'll need it in Phase 4)
- [ ] Example format: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## ⚡ Phase 2: Edge Functions Deployment (10 min)

### Option A: Deploy via CLI (Recommended)

#### Prerequisites
- [ ] Supabase CLI installed: `brew install supabase/tap/supabase`
- [ ] Logged into Supabase: `supabase login`

#### Deploy Functions
```bash
cd /Users/ibrahim/Desktop/thelivestreamshow

supabase functions deploy get-overlays --project-ref vcniezwtltraqramjlux
supabase functions deploy update-overlay --project-ref vcniezwtltraqramjlux
supabase functions deploy create-overlay-template --project-ref vcniezwtltraqramjlux
```

- [ ] Deploy `get-overlays` function
- [ ] Deploy `update-overlay` function
- [ ] Deploy `create-overlay-template` function
- [ ] Confirm all 3 deployments successful

### Option B: Deploy via Dashboard (Alternative)

#### For each function:
- [ ] Go to Supabase Dashboard → Edge Functions
- [ ] Click "Create a new function"
- [ ] **Function 1: get-overlays**
  - [ ] Name: `get-overlays`
  - [ ] Copy code from: `unified-overlay-system-integration/backend/edge-functions/get-overlays/index.ts`
  - [ ] Deploy
- [ ] **Function 2: update-overlay**
  - [ ] Name: `update-overlay`
  - [ ] Copy code from: `unified-overlay-system-integration/backend/edge-functions/update-overlay/index.ts`
  - [ ] Deploy
- [ ] **Function 3: create-overlay-template**
  - [ ] Name: `create-overlay-template`
  - [ ] Copy code from: `unified-overlay-system-integration/backend/edge-functions/create-overlay-template/index.ts`
  - [ ] Deploy

### Verify Edge Functions

#### Check Dashboard Status
- [ ] Open Supabase Dashboard → Edge Functions
- [ ] Verify `get-overlays` shows "ACTIVE" status
- [ ] Verify `update-overlay` shows "ACTIVE" status
- [ ] Verify `create-overlay-template` shows "ACTIVE" status

#### Test API Call
```bash
curl -X POST "https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-overlays" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ" \
  -H "Content-Type: application/json"
```

- [ ] Run test curl command
- [ ] Verify response is JSON array with 3 overlay objects
- [ ] Confirm each overlay has `content` and `chatMessages` fields
- [ ] No error messages in response

---

## 🖥️ Phase 3: Frontend Testing (10 min)

### Start Development Server
- [ ] Run: `npm run dev`
- [ ] Wait for "Local: http://localhost:5173" message
- [ ] Confirm no compilation errors

### Test Dashboard Integration
- [ ] Open browser: http://localhost:5173
- [ ] Navigate to "Show Start" section
- [ ] Confirm OverlayGrid component displays
- [ ] Verify 3 overlay tiles visible:
  - [ ] Main Stream (🎬)
  - [ ] Starting Soon (⏰)
  - [ ] Be Right Back (☕)

### Test Overlay Selection
- [ ] Click any overlay tile
- [ ] Open browser console (F12 → Console tab)
- [ ] Verify console shows: "Overlay selected: [uuid]"
- [ ] UUID should match one from database

### Test Edit Modal
- [ ] Hold Ctrl (Cmd on Mac) and click "Main Stream" tile
- [ ] Verify OverlayEditModal opens
- [ ] Check "Content Fields" tab displays:
  - [ ] season field
  - [ ] episode field
  - [ ] show_name field
  - [ ] episode_title field
  - [ ] social_handle field
- [ ] Switch to "Chat Messages" tab
- [ ] Verify 50+ chat messages display
- [ ] Each message shows type, animation, active checkbox, and text

### Test Content Editing
- [ ] Edit `episode_title` field to: "Integration Test"
- [ ] Click "Save Changes" button
- [ ] Wait for modal to close (loading indicator should appear briefly)
- [ ] Ctrl+Click "Main Stream" tile again
- [ ] Verify `episode_title` shows "Integration Test"
- [ ] Close modal

### Test Chat Message Editing
- [ ] Ctrl+Click "Main Stream" tile
- [ ] Switch to "Chat Messages" tab
- [ ] Edit first message text to: "Testing integration!"
- [ ] Click "Save Changes"
- [ ] Reopen modal
- [ ] Verify first message shows "Testing integration!"

### Test Persistence
- [ ] Refresh browser page (F5 or Cmd+R)
- [ ] Ctrl+Click "Main Stream" tile
- [ ] Verify `episode_title` still shows "Integration Test"
- [ ] Verify first chat message still shows "Testing integration!"

### Browser Console Check
- [ ] Open browser console (F12)
- [ ] Verify no errors (red messages)
- [ ] Only warnings or info messages acceptable
- [ ] API calls to Supabase should show as successful

---

## 🎨 Phase 4: Overlay Template Configuration (3 min)

### Configure Overlay ID
- [ ] Open file: `public/unified-overlay.html` in text editor
- [ ] Find line ~644 with `CONFIG` object
- [ ] Locate: `overlayId: null`
- [ ] Replace with UUID from Phase 1: `overlayId: 'your-uuid-here'`
- [ ] Save file

### Test Overlay in Browser
- [ ] Ensure development server is running
- [ ] Open browser: http://localhost:5173/unified-overlay.html
- [ ] Verify overlay displays with:
  - [ ] Timer counting up (top-left)
  - [ ] Viewer count showing 0 (top-left)
  - [ ] Episode info (bottom-center)
  - [ ] Social handle (bottom-right)
  - [ ] Chat messages rotating (top-right, wait 8 seconds)

### Test Keyboard Controls
- [ ] Press `C` key
- [ ] Verify camera section toggles visibility
- [ ] Press `R` key
- [ ] Verify overlay reloads data
- [ ] Press `M` key (if implemented)
- [ ] Verify message rotation toggles

### Verify Content Updates
- [ ] In overlay browser tab, verify:
  - [ ] `episode_title` shows "Integration Test" (from Phase 3)
  - [ ] First chat message shows "Testing integration!" (wait for rotation)
- [ ] If not showing, press `R` to reload

---

## 📺 Phase 5: OBS Integration (5 min)

### Add Browser Source
- [ ] Open OBS Studio
- [ ] Select scene for overlay (or create new test scene)
- [ ] Click "+" under Sources
- [ ] Select "Browser"
- [ ] Name: "Unified Overlay"

### Configure Browser Source
- [ ] Set URL: `http://localhost:5173/unified-overlay.html`
- [ ] Set Width: `1920`
- [ ] Set Height: `1080`
- [ ] Set FPS: `60` (or match your stream framerate)
- [ ] Check: ✅ "Shutdown source when not visible"
- [ ] Check: ✅ "Refresh browser when scene becomes active"
- [ ] Uncheck: "Control audio via OBS" (overlay has no audio)
- [ ] Click OK

### Position and Scale
- [ ] Verify overlay fills entire canvas (1920x1080)
- [ ] If needed: Right-click source → Transform → Fit to Screen
- [ ] Move source to top layer (drag to top of source list)

### Test in OBS
- [ ] Switch to scene with overlay
- [ ] Verify in OBS preview:
  - [ ] Timer is counting up
  - [ ] Episode information displays
  - [ ] Social handle visible
  - [ ] Chat messages appear
- [ ] Wait 8 seconds
- [ ] Verify chat messages rotate
- [ ] Animations should be smooth

### Performance Check
- [ ] Open OBS Stats: View → Stats
- [ ] Note CPU usage before overlay
- [ ] Enable overlay source
- [ ] Note CPU usage with overlay
- [ ] CPU increase should be < 5%
- [ ] Frame drops should remain at 0

---

## 🧪 Phase 6: End-to-End Testing (10 min)

### Complete Workflow Test
- [ ] **Step 1:** Open dashboard in browser
- [ ] **Step 2:** Ctrl+Click "Main Stream" overlay
- [ ] **Step 3:** Change `episode_title` to "Final Test"
- [ ] **Step 4:** Change `season` to "Season 5"
- [ ] **Step 5:** Click "Save Changes"
- [ ] **Step 6:** Wait for modal to close
- [ ] **Step 7:** Switch to OBS Studio
- [ ] **Step 8:** Right-click overlay source → Refresh
- [ ] **Step 9:** Verify episode title shows "Final Test"
- [ ] **Step 10:** Verify season shows "Season 5"

### Restore Original Values
- [ ] Change `episode_title` back to "Purposeful Illusion"
- [ ] Change `season` back to "Season 4"
- [ ] Change first chat message back to original text
- [ ] Save changes
- [ ] Refresh OBS overlay
- [ ] Verify original values restored

### Browser Compatibility (Optional)
- [ ] Test dashboard in Chrome
- [ ] Test dashboard in Firefox
- [ ] Test dashboard in Safari
- [ ] Test overlay in Chrome
- [ ] Test overlay in Firefox

---

## ✅ Final Validation

### System Health Check
- [ ] No errors in browser console
- [ ] No errors in OBS logs
- [ ] No errors in Supabase function logs
- [ ] API response times < 1 second
- [ ] OBS performance impact < 5% CPU
- [ ] All animations smooth (no stuttering)

### Functional Requirements
- [ ] Overlay tiles display in dashboard
- [ ] Click selects overlay (logs to console)
- [ ] Ctrl+Click opens edit modal
- [ ] Content fields can be edited
- [ ] Chat messages can be edited
- [ ] Changes save to database
- [ ] Changes persist after refresh
- [ ] OBS displays overlay correctly
- [ ] Overlay updates reflect in OBS (with refresh)

### User Experience
- [ ] Interface is intuitive
- [ ] Loading states display during operations
- [ ] Error messages are clear (if any)
- [ ] Animations play smoothly
- [ ] Tooltips provide helpful guidance

---

## 🎉 Post-Deployment

### Documentation
- [ ] Take screenshots of OverlayGrid for team
- [ ] Document any custom configurations made
- [ ] Update team wiki/documentation
- [ ] Create quick reference guide for team members

### Team Training
- [ ] Demonstrate click-to-select workflow
- [ ] Show Ctrl+Click-to-edit functionality
- [ ] Explain content fields vs chat messages
- [ ] Demonstrate OBS integration

### Production Deployment (If Applicable)
- [ ] Deploy frontend to production environment
- [ ] Update overlay HTML with production URL
- [ ] Update OBS with production URL
- [ ] Test in production environment

### Monitoring
- [ ] Set up error tracking (optional)
- [ ] Monitor API performance
- [ ] Track user adoption
- [ ] Gather team feedback

---

## 🆘 Troubleshooting Reference

### Issue: Empty OverlayGrid
**Solution:** Verify database migration executed, check edge functions deployed

### Issue: API Errors
**Solution:** Check Supabase function logs, verify service role key set

### Issue: Changes Not Saving
**Solution:** Check browser console, verify update-overlay function active

### Issue: Overlay Blank in OBS
**Solution:** Verify overlayId configured, check URL in browser first

### Issue: Console Errors
**Solution:** Review error message, check component imports, verify API responses

**For detailed troubleshooting, see `UNIFIED_OVERLAY_INTEGRATION_GUIDE.md`**

---

## 📊 Deployment Summary

**Completion Time:** ________ (start) to ________ (end)  
**Total Duration:** ________ minutes  
**Deployment Status:** ⬜ In Progress  ⬜ Complete  ⬜ Issues  

**Notes:**
```
[Add any notes, issues encountered, or customizations made]




```

---

**🎊 Congratulations!**

When all items are checked, your Unified Overlay System is fully deployed and ready for production use!

**Next Steps:**
- Create custom overlay templates
- Customize chat messages for your audience
- Explore advanced features
- Plan future enhancements

**Happy Streaming! 🎬**
