# Monitor Tab Feature - Testing Checklist

## Pre-Merge Testing Checklist

Use this checklist to verify all features work correctly after merging the Monitor tab feature into your repository.

### Environment Setup

- [ ] Application builds successfully without errors (`pnpm run build`)
- [ ] No TypeScript compilation errors
- [ ] No console warnings during build process
- [ ] Development server starts without errors (`pnpm run dev`)

### Database Verification

- [ ] `stream_stats` table exists in Supabase
- [ ] `broadcast_state` table exists in Supabase
- [ ] Both tables have RLS policies enabled
- [ ] Can insert test data into both tables manually
- [ ] Can query data from both tables

### Edge Functions Deployment

- [ ] `fetch-twitch-stats` function deployed successfully
- [ ] `fetch-youtube-stats` function deployed successfully
- [ ] Both functions show as "ACTIVE" in Supabase dashboard
- [ ] Can invoke both functions via curl (see API_SETUP.md)
- [ ] Functions return proper JSON responses

### Environment Variables Configuration

- [ ] `TWITCH_CLIENT_ID` set in Supabase secrets
- [ ] `TWITCH_OAUTH_TOKEN` set in Supabase secrets
- [ ] `TWITCH_USERNAME` set in Supabase secrets (or defaults to 'AbeNasty')
- [ ] `YOUTUBE_CHANNEL_ID` set in Supabase secrets
- [ ] `YOUTUBE_API_KEY` verified in Supabase secrets

### Tab Navigation

- [ ] All 5 tabs visible: Video Queue, Analytics, Scheduled, Images, Monitor
- [ ] Can click on each tab without errors
- [ ] Tab transitions are smooth
- [ ] Active tab is highlighted correctly
- [ ] Monitor tab has monitor icon

### Monitor Tab - Components Visibility

#### Picture-in-Picture Broadcast Monitor
- [ ] PiP window visible in top-right corner
- [ ] Shows "Broadcast Monitor" header text
- [ ] Has three control buttons (Minimize, Maximize, Pop-out)
- [ ] Iframe shows broadcast view content
- [ ] Default size is approximately 480x270px

#### Dual-Platform Statistics
- [ ] "Platform Statistics" heading visible
- [ ] Refresh button present
- [ ] Last updated timestamp displays
- [ ] Twitch section visible with purple branding
- [ ] YouTube section visible with red branding
- [ ] Each platform shows 3-4 stat cards
- [ ] Stats display numbers (may be 0 if offline)

#### Quick Preview Panel
- [ ] "Quick Preview" or "Next Up" heading visible
- [ ] Shows message if no items queued
- [ ] If items queued: thumbnail, title, and buttons visible
- [ ] Three action buttons: Play Now, Edit, Skip

#### Stream History Chart
- [ ] "Stream History" heading visible
- [ ] Chart area displays (may be empty initially)
- [ ] Time range toggles present (Last Hour, Last 24h, Last Stream)
- [ ] Platform toggles present (Twitch checkbox, YouTube checkbox)
- [ ] Chart has axes labels

#### Emergency Controls
- [ ] "Emergency Controls" heading visible
- [ ] Large red "Hide All Overlays" button present
- [ ] "Restore" button present
- [ ] Section has red border for emphasis

#### Quick Stats Summary
- [ ] Displays "Videos Queued" count
- [ ] Displays "Images Queued" count
- [ ] Displays "Total Viewers" count

### Monitor Tab - Interactive Features

#### PiP Broadcast Monitor
- [ ] Can drag the window by clicking the header
- [ ] Window moves smoothly when dragged
- [ ] Stays within viewport boundaries
- [ ] Minimize button collapses window to header only
- [ ] Minimize button changes to restore icon when minimized
- [ ] Maximize button toggles between 480x270 and 960x540
- [ ] Pop-out button opens new browser window with broadcast view
- [ ] New window shows `/broadcast/video-player` URL
- [ ] PiP iframe loads broadcast view content

#### Platform Statistics
- [ ] Manual refresh button works when clicked
- [ ] Button shows "Refreshing..." text during refresh
- [ ] Stats update after clicking refresh
- [ ] "Last updated" timestamp updates after refresh
- [ ] Auto-refresh occurs every 30 seconds (check timestamp)
- [ ] Twitch stats show follower count (if credentials configured)
- [ ] YouTube stats show subscriber count (if credentials configured)
- [ ] Error messages display if credentials not configured
- [ ] Live indicator appears when streaming (if live)

#### Quick Preview Panel
- [ ] "Play Now" button triggers immediate playback
- [ ] Item appears in broadcast view after "Play Now"
- [ ] "Skip" button removes item from queue
- [ ] Queue count decreases after skip
- [ ] Next item moves up in queue after skip
- [ ] "Edit" button shows helpful message
- [ ] Message guides user to correct tab

#### Stream History Chart
- [ ] Time range buttons are clickable
- [ ] Active time range is highlighted
- [ ] Chart data updates when changing time range
- [ ] Twitch checkbox toggles purple line visibility
- [ ] YouTube checkbox toggles red line visibility
- [ ] Both lines can be hidden/shown independently
- [ ] Hovering over chart shows tooltip with values
- [ ] Chart axes scale appropriately to data
- [ ] "No stream data" message shows if no historical data

#### Emergency Controls
- [ ] "Hide All Overlays" button is clickable
- [ ] Button appears pressed when clicked
- [ ] Broadcast view shows "All overlays hidden" message
- [ ] Videos and images stop displaying when hidden
- [ ] "Restore" button becomes enabled after hide
- [ ] "Hide All Overlays" button becomes disabled after hide
- [ ] Yellow warning message appears when hidden
- [ ] "Restore" button re-enables content display
- [ ] Previous content reappears after restore
- [ ] Buttons toggle states correctly

### Existing Features - Video Queue Tab

#### Search Functionality
- [ ] Search bar visible and functional
- [ ] Can type search query
- [ ] "Search" button triggers YouTube API
- [ ] Search results display in grid
- [ ] Each result shows thumbnail, title, channel
- [ ] "Add to Queue" button on each result
- [ ] Schedule button appears on hover (calendar icon)

#### Queue Management
- [ ] Queue tab shows list of queued videos
- [ ] Each queue item shows thumbnail and details
- [ ] Can drag and drop to reorder queue items
- [ ] "Clear All" button removes all videos
- [ ] Can remove individual videos from queue
- [ ] Can edit start/end times for videos
- [ ] Queue count updates in real-time

#### Playback Controls
- [ ] Play/Pause button toggles playback state
- [ ] Skip Forward button advances to next video
- [ ] Volume slider adjusts volume (0-100)
- [ ] Volume percentage displays next to slider
- [ ] Auto-advance checkbox toggles feature
- [ ] Dead Air Filler checkbox toggles feature

#### Analytics Tab
- [ ] Analytics tab displays without errors
- [ ] Shows play history data
- [ ] Can export analytics as CSV/JSON
- [ ] Charts render correctly

#### Scheduled Tab
- [ ] Scheduled videos list displays
- [ ] Each scheduled item shows time and details
- [ ] Can delete scheduled videos
- [ ] Count badge shows number of scheduled items

#### Recommendations Panel
- [ ] Recommendations panel visible in sidebar
- [ ] "Surprise Me" button present
- [ ] Category filters display (All, Funny, Fails, etc.)
- [ ] Can click categories to filter
- [ ] Recommendation cards show videos
- [ ] Can add recommendations to queue

### Existing Features - Images Tab

#### Upload Functionality
- [ ] Drag-and-drop zone visible
- [ ] Can click to browse files
- [ ] Accepts image files (JPG, PNG, GIF, WEBP)
- [ ] Upload progress indicator shows
- [ ] Image appears in queue after upload
- [ ] Thumbnail displays correctly

#### Queue Management
- [ ] Image queue displays uploaded images
- [ ] Each item shows thumbnail and caption
- [ ] Can drag and drop to reorder
- [ ] "Clear All" button removes all images
- [ ] Can remove individual images
- [ ] Can edit captions inline
- [ ] Queue count updates correctly

#### Display Controls (Right Sidebar)
- [ ] Image Display Controls panel visible when on Images tab
- [ ] "Previous" button navigates to previous image
- [ ] "Next" button navigates to next image
- [ ] "Hide" button hides current image
- [ ] "Hide All" button hides all content
- [ ] Transition selector dropdown works
- [ ] Available transitions: Instant, Fade, Slide Left, Slide Right, Zoom In
- [ ] Auto-advance checkbox toggles feature
- [ ] Interval slider adjusts auto-advance timing

#### Display History
- [ ] Image history section displays
- [ ] Shows previously displayed images
- [ ] Can export history as CSV

### Broadcast View Integration

#### Video Display
- [ ] Navigate to `/broadcast/video-player` in new tab
- [ ] YouTube video player loads
- [ ] Video plays when queue is active
- [ ] "Now Playing" banner appears during playback
- [ ] Video respects start/end times
- [ ] Auto-advances to next video when enabled

#### Image Display
- [ ] Images display full-screen when activated
- [ ] Caption overlay appears if caption exists
- [ ] Transition effects work (fade, slide, zoom)
- [ ] Images respect auto-advance settings

#### Emergency Hide All
- [ ] When "Hide All" clicked in Monitor tab:
  - [ ] Broadcast view goes black
  - [ ] Shows "All overlays hidden" message
  - [ ] Videos stop playing
  - [ ] Images are hidden
- [ ] When "Restore" clicked:
  - [ ] Content reappears
  - [ ] Playback resumes if was playing
  - [ ] Message disappears

### Real-time Sync Verification

- [ ] Open Control Dashboard in one browser tab
- [ ] Open Broadcast View in another browser tab
- [ ] Click "Hide All" in Control Dashboard
- [ ] Broadcast View updates within 1-2 seconds
- [ ] Click "Restore" in Control Dashboard
- [ ] Broadcast View shows content again
- [ ] Queue changes in one tab reflect in other tabs

### Cross-Browser Testing

#### Chrome/Chromium
- [ ] All features work in Chrome
- [ ] No console errors
- [ ] Dragging works smoothly
- [ ] Charts render correctly

#### Firefox
- [ ] All features work in Firefox
- [ ] No console errors  
- [ ] Dragging works smoothly
- [ ] Charts render correctly

#### Safari (if available)
- [ ] All features work in Safari
- [ ] No console errors
- [ ] Dragging works smoothly
- [ ] Charts render correctly

### Performance Testing

- [ ] Page loads in under 5 seconds on normal connection
- [ ] No lag when switching between tabs
- [ ] Smooth dragging of PiP window
- [ ] Chart rendering is responsive
- [ ] No memory leaks after 30 minutes of use
- [ ] Auto-refresh doesn't cause performance degradation

### Error Handling

#### API Errors
- [ ] Graceful error message if Twitch API fails
- [ ] Graceful error message if YouTube API fails
- [ ] Stats show zeros instead of breaking when API unavailable
- [ ] Clear error messages guide user to fix credentials

#### Network Errors
- [ ] Handles offline gracefully
- [ ] Retry logic works for failed requests
- [ ] User informed of connection issues

#### Edge Cases
- [ ] Works when queue is empty
- [ ] Works when no videos scheduled
- [ ] Works when not live streaming
- [ ] Handles very large viewer counts
- [ ] Handles no historical data

### Documentation Verification

- [ ] README updated with Monitor tab information
- [ ] API_SETUP.md provides clear credential instructions
- [ ] MERGE_GUIDE.md has complete integration steps
- [ ] FEATURE_SUMMARY.md describes user-facing features
- [ ] monitor-tab-setup-guide.md has troubleshooting section

### Security Checks

- [ ] No API keys visible in browser console
- [ ] No API keys in frontend source code
- [ ] Edge functions handle authentication server-side
- [ ] RLS policies prevent unauthorized access
- [ ] CORS headers configured correctly

## Post-Deployment Verification

After deploying to production:

- [ ] Application accessible at production URL
- [ ] All tabs load without 404 errors
- [ ] Static assets load correctly
- [ ] API calls reach Supabase successfully
- [ ] Edge functions are accessible
- [ ] No mixed content warnings (HTTPS)
- [ ] Favicons and meta tags correct

## Rollback Preparation

- [ ] Know the commit hash before merge
- [ ] Have rollback SQL script ready
- [ ] Documented rollback procedure tested
- [ ] Backup of current production database
- [ ] Edge function deletion commands ready

## Sign-Off

**Tested By**: _________________

**Date**: _________________

**Environment**: Production / Staging / Local

**Result**: Pass / Fail

**Notes**:

---

**Critical Issues Found** (if any):

1. 
2. 
3. 

**Non-Critical Issues** (if any):

1. 
2. 
3. 

**Recommendation**: Proceed with Merge / Fix Issues First / Rollback Required
