# Navigation Continuity Test Plan

## Test Objective
Verify that music playback continues uninterrupted when navigating between different routes in the application.

## Test Environment
- Browser: Chrome, Safari, Firefox
- Application Routes: Dashboard (/), Studio (/), Media (/)
- MusicProvider: Mounted above BrowserRouter in main.tsx

## Prerequisites
- ✅ MusicProvider mounted in main.tsx
- ✅ Application running in development mode
- ✅ At least one music track in the database
- ✅ Browser console open for debugging

## Test Cases

### Test 1: Basic Navigation Continuity
**Steps:**
1. Navigate to Dashboard tab
2. Load a music track (duration > 30 seconds)
3. Click Play
4. Wait 5 seconds
5. Navigate to Studio tab
6. Wait 5 seconds
7. Navigate to Media tab
8. Wait 5 seconds
9. Return to Dashboard

**Expected Results:**
- ✅ Music plays in Dashboard
- ✅ Music continues when navigating to Studio
- ✅ Music continues when navigating to Media
- ✅ Music continues when returning to Dashboard
- ✅ Playback position is preserved across all tabs
- ✅ No audio glitches or interruptions
- ✅ Console shows `[MusicProvider]` logs confirming persistence

**Pass Criteria:**
- Music plays continuously for entire test duration
- Playback position advances smoothly
- No errors in console

---

### Test 2: State Persistence
**Steps:**
1. Start playback in any tab
2. Note current playback position (e.g., 15 seconds)
3. Pause the track
4. Navigate to different tab
5. Check playback state
6. Resume playback
7. Navigate to another tab

**Expected Results:**
- ✅ Paused state persists across navigation
- ✅ Playback position preserved when paused
- ✅ Resume works from any tab
- ✅ Volume setting preserved
- ✅ Queue state preserved

**Pass Criteria:**
- All state properties maintain their values across routes

---

### Test 3: Queue Navigation Continuity
**Steps:**
1. Load a playlist with 3+ tracks
2. Start playback of first track
3. Navigate to different tab mid-track
4. Wait for track to end (or skip to next)
5. Verify auto-advance to next track
6. Navigate to another tab
7. Verify playback continues

**Expected Results:**
- ✅ First track plays across navigation
- ✅ Auto-advance works to second track
- ✅ Second track plays across navigation
- ✅ Queue position updates correctly
- ✅ No playback interruption during track change

**Pass Criteria:**
- Seamless auto-advance and navigation

---

### Test 4: Control Synchronization
**Steps:**
1. Start playback in Dashboard
2. Navigate to Studio
3. Use Studio music controls to pause
4. Navigate to Media
5. Use Media music controls to resume
6. Navigate back to Dashboard
7. Use Dashboard controls to change volume

**Expected Results:**
- ✅ Controls in all tabs affect the same audio source
- ✅ Pause from Studio stops playback everywhere
- ✅ Resume from Media resumes playback everywhere
- ✅ Volume change from Dashboard applies globally
- ✅ UI state synchronized across all tabs

**Pass Criteria:**
- All controls work from any tab
- State synchronized globally

---

### Test 5: Rapid Navigation
**Steps:**
1. Start playback
2. Rapidly navigate between tabs (Dashboard → Studio → Media → Dashboard)
3. Repeat 5 times within 10 seconds
4. Observe playback stability

**Expected Results:**
- ✅ Music continues playing
- ✅ No audio stuttering or glitches
- ✅ No memory leaks
- ✅ Console shows no errors

**Pass Criteria:**
- Playback remains stable under rapid navigation

---

### Test 6: Long-Duration Playback
**Steps:**
1. Start playback of a long track (5+ minutes)
2. Navigate between tabs every 30 seconds
3. Continue for full track duration
4. Monitor for any issues

**Expected Results:**
- ✅ Continuous playback for entire duration
- ✅ No degradation over time
- ✅ Signed URL doesn't expire (should be valid for 1 hour)
- ✅ Memory usage remains stable

**Pass Criteria:**
- No interruptions or performance degradation

---

### Test 7: Browser Refresh Behavior
**Steps:**
1. Start playback
2. Navigate to different tab
3. Refresh the browser (F5 or Cmd+R)
4. Observe behavior

**Expected Results:**
- ✅ Playback stops (expected - full page reload)
- ✅ Application reloads successfully
- ✅ MusicProvider reinitializes
- ✅ No errors on reload
- ⚠️ Playback state is lost (expected behavior)

**Pass Criteria:**
- Clean reload without errors

---

## Console Log Verification

During testing, verify these console messages appear:

```
[MusicProvider] Audio element created
[MusicProvider] Generating fresh signed URL for: music/track.mp3
[MusicProvider] Track loaded: Song Title
[MusicProvider] Playback started
[MusicProvider] Volume set to: 0.7
```

## Browser Testing Matrix

| Browser | Version | Test 1 | Test 2 | Test 3 | Test 4 | Test 5 | Test 6 | Test 7 |
|---------|---------|--------|--------|--------|--------|--------|--------|--------|
| Chrome  | Latest  | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     |
| Safari  | Latest  | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     |
| Firefox | Latest  | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     | ⏳     |

## Known Limitations

1. **Browser Autoplay Policy**: First play must be triggered by user interaction
2. **Background Tab Throttling**: Some browsers may throttle background tabs
3. **Mobile Browsers**: May have additional restrictions on background audio

## Troubleshooting

### Issue: Music stops when navigating
**Cause**: MusicProvider not mounted above router
**Fix**: Verify main.tsx has correct structure

### Issue: State not synchronized
**Cause**: Multiple MusicProvider instances
**Fix**: Ensure only one provider in main.tsx

### Issue: No audio on iOS Safari
**Cause**: Autoplay restrictions
**Fix**: Ensure user interaction before first play

## Test Execution Checklist

- [ ] All 7 test cases executed
- [ ] All browsers tested
- [ ] Console logs verified
- [ ] No errors observed
- [ ] Performance acceptable
- [ ] State synchronization confirmed
- [ ] Documentation updated with results

## Test Status: ⏳ Pending User Execution

**Note**: These are manual integration tests that require a running application and user interaction. Execute these tests after deployment to verify navigation continuity works as designed.
