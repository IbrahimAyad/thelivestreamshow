# Deployment Guide

## Overview
Step-by-step guide to deploy and integrate the unified overlay system with your existing BetaBot application.

## Pre-Deployment Checklist

### Environment Setup
- [ ] Supabase project is accessible
- [ ] Environment variables are configured
- [ ] Database backup is complete
- [ ] Current application is stable

### Files Ready
- [ ] Backend edge functions deployed
- [ ] Frontend components integrated
- [ ] Database tables created
- [ ] Testing completed

## Phase 1: Backend Deployment

### Step 1: Database Setup

#### Create Tables
The database tables have already been created during development:

```sql
-- Tables created:
-- overlays
-- overlay_content  
-- chat_messages
-- overlay_widgets
```

**Verify Tables Exist:**
```sql
-- Run this in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('overlays', 'overlay_content', 'chat_messages', 'overlay_widgets');
```

**Expected Result:** 4 rows showing all tables exist

#### Insert Default Data
```sql
-- Insert main stream overlay
INSERT INTO overlays (name, type, description) VALUES 
('Main Stream', 'main_stream', 'Primary streaming overlay with full features');

-- Insert starting soon overlay
INSERT INTO overlays (name, type, description) VALUES 
('Starting Soon', 'starting_soon', 'Pre-stream countdown overlay');

-- Insert BRB overlay
INSERT INTO overlays (name, type, description) VALUES 
('Be Right Back', 'brb', 'Temporary break overlay');

-- Get the overlay IDs for next step
SELECT id, name FROM overlays;
```

### Step 2: Edge Functions Verification

#### Verify Functions Deployed
Check in Supabase Dashboard → Edge Functions:

**Expected Functions:**
- [ ] get-overlays
- [ ] update-overlay
- [ ] create-overlay-template

**Status Check:**
```bash
# Test each function with curl
curl -X POST "https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-overlays" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Main Stream",
      "type": "main_stream",
      "content": {},
      "chatMessages": []
    }
  ]
}
```

### Step 3: Test Backend APIs

#### Test 1: Create Overlay Template
```bash
curl -X POST "https://vcniezwtltraqramjlux.supabase.co/functions/v1/create-overlay-template" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Overlay",
    "type": "custom",
    "description": "Test deployment overlay"
  }'
```

**Expected:** Success response with new overlay data

#### Test 2: Get Overlays
```bash
curl -X POST "https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-overlays" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Expected:** Array of overlays including newly created one

## Phase 2: Frontend Integration

### Step 1: Add New Components

#### Copy Component Files
```bash
# Copy to your frontend source directory
cp frontend/src/components/OverlayEditModal.tsx [your-app]/src/components/
cp frontend/src/components/OverlayGrid.tsx [your-app]/src/components/
```

#### Update Dependencies
```bash
# Install required dependencies if not already present
npm install @supabase/supabase-js
# Your app likely already has React and TypeScript
```

### Step 2: Update Main Application

#### Integrate OverlayGrid
**Location:** Replace existing graphics overlays section

```typescript
// In your main dashboard component
import OverlayGrid from './components/OverlayGrid';

// Replace existing graphics overlays grid with:
<div className="graphics-section">
  <OverlayGrid onOverlaySelect={handleOverlaySelect} />
</div>
```

#### Update Layout CSS
```css
/* Add to your main CSS file */
.dashboard-container {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.graphics-section {
  flex: 1;
  max-width: 600px;
}

.betabot-section {
  flex: 1;
  min-width: 400px;
}
```

### Step 3: Update Supabase Client

#### Ensure Proper Configuration
```typescript
// In your lib/supabase.ts or equivalent
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 4: Test Frontend Integration

#### Start Development Server
```bash
npm start
# or
yarn start
```

**Expected Results:**
- [ ] Application starts without errors
- [ ] Graphics Overlays section loads
- [ ] Overlay tiles display correctly
- [ ] Click functionality works
- [ ] Ctrl+Click opens edit modal

#### Test Edit Modal
1. Hold Ctrl+Click on any overlay tile
2. Edit modal should open
3. Test editing content fields
4. Test editing chat messages
5. Test saving changes

**Expected Results:**
- [ ] Modal opens correctly
- [ ] Content loads in form fields
- [ ] Changes can be made
- [ ] Save button works
- [ ] Success/error messages appear

## Phase 3: Overlay Integration

### Step 1: Deploy Unified Overlay

#### Copy Overlay File
```bash
# Copy to your public directory or overlay hosting location
cp unified-overlay.html [your-app]/public/stream-overlay.html
```

#### Configure Overlay
**In unified-overlay.html, update:**

```javascript
// Set your specific overlay ID
const CONFIG = {
  supabaseUrl: 'https://vcniezwtltraqramjlux.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ',
  overlayId: 'your-main-stream-overlay-id' // Replace with actual ID
};
```

### Step 2: Test Overlay Integration

#### Open Overlay in Browser
```bash
# Navigate to your overlay file
# http://localhost:3000/stream-overlay.html (if using React dev server)
# or 
# https://yourdomain.com/stream-overlay.html (in production)
```

**Expected Results:**
- [ ] Overlay displays correctly
- [ ] Text content shows from database
- [ ] Chat messages animate
- [ ] Timer counts up
- [ ] Viewer count changes
- [ ] Camera section appears

### Step 3: OBS Integration

#### Add to OBS
1. Open OBS Studio
2. Add Browser Source
3. Set URL to your overlay file
4. Set dimensions (1920x1080 for full HD)
5. Enable hardware acceleration if available

**Test in OBS:**
- [ ] Overlay appears in preview
- [ ] All elements visible
- [ ] Animations work smoothly
- [ ] No console errors
- [ ] Performance is good

## Phase 4: Production Deployment

### Step 1: Build for Production

#### Frontend Build
```bash
npm run build
# or
yarn build
```

**Verify Build:**
- [ ] Build completes without errors
- [ ] Static files generated
- [ ] No TypeScript errors
- [ ] No linting errors

### Step 2: Deploy Backend Changes

#### Supabase Deployment
Edge functions are already deployed. Verify they're active:

**Check Status:**
- Go to Supabase Dashboard
- Navigate to Edge Functions
- Verify all 3 functions show "ACTIVE" status

### Step 3: Deploy Frontend

#### Deploy to Your Hosting Platform
```bash
# Example for Vercel
vercel --prod

# Example for Netlify
netlify deploy --prod

# Example for custom hosting
# Upload build/ directory to your server
```

### Step 4: Update Environment Variables

#### Set Production Environment
```bash
# Ensure these are set in production
REACT_APP_SUPABASE_URL=https://vcniezwtltraqramjlux.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ
```

## Phase 5: Post-Deployment Testing

### Step 1: Full System Test

#### End-to-End Testing
1. **Frontend Test:**
   - [ ] Load main application
   - [ ] Graphics overlays section works
   - [ ] Click to select overlay
   - [ ] Ctrl+Click to edit overlay
   - [ ] Changes save successfully

2. **Backend Test:**
   - [ ] Data persists correctly
   - [ ] Real-time updates work
   - [ ] API responses are fast
   - [ ] No error logs

3. **Overlay Test:**
   - [ ] Stream overlay loads
   - [ ] Content updates from backend
   - [ ] Chat animations work
   - [ ] Camera integration works

### Step 2: Performance Testing

#### Load Testing
```bash
# Test concurrent overlay access
curl -X POST "https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-overlays" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Check response time (should be < 500ms)
```

**Performance Benchmarks:**
- [ ] API response time < 500ms
- [ ] Page load time < 3 seconds
- [ ] Overlay rendering < 1 second
- [ ] Memory usage stable

### Step 3: Error Handling Test

#### Test Error Scenarios
1. **Network Issues:**
   - [ ] Disconnect network during operation
   - [ ] Reconnect and verify recovery
   - [ ] Error messages display correctly

2. **API Errors:**
   - [ ] Invalid API key
   - [ ] Network timeout
   - [ ] Database connection issues
   - [ ] Graceful error handling

3. **User Input Errors:**
   - [ ] Empty required fields
   - [ ] Invalid data types
   - [ ] XSS attempts
   - [ ] Input validation works

## Rollback Plan

### If Issues Occur

#### Quick Rollback Steps
1. **Frontend Rollback:**
   ```bash
   # Revert to previous build
   git revert [commit-hash]
   npm run build
   # Deploy previous version
   ```

2. **Backend Rollback:**
   ```sql
   -- Disable new functions if needed
   -- Revert database changes if necessary
   ```

3. **Database Rollback:**
   ```sql
   -- Remove new tables if needed
   DROP TABLE IF EXISTS overlay_widgets CASCADE;
   DROP TABLE IF EXISTS chat_messages CASCADE;
   DROP TABLE IF EXISTS overlay_content CASCADE;
   DROP TABLE IF EXISTS overlays CASCADE;
   ```

## Monitoring and Maintenance

### Set Up Monitoring

#### Application Monitoring
- [ ] Error tracking (Sentry, LogRocket, etc.)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database performance monitoring

#### Key Metrics to Monitor
- [ ] API response times
- [ ] Error rates
- [ ] Database query performance
- [ ] User engagement
- [ ] Overlay usage statistics

### Regular Maintenance

#### Weekly Checks
- [ ] Review error logs
- [ ] Check API performance
- [ ] Monitor database usage
- [ ] Verify backup procedures

#### Monthly Updates
- [ ] Update dependencies
- [ ] Security patches
- [ ] Performance optimizations
- [ ] User feedback review

## Success Criteria

### Deployment is Successful When:

#### Functionality
- [ ] All overlays display correctly
- [ ] Editing works smoothly
- [ ] Chat messages animate properly
- [ ] Camera integration functions
- [ ] Real-time updates work

#### Performance
- [ ] Page loads in < 3 seconds
- [ ] API calls respond in < 500ms
- [ ] No memory leaks
- [ ] Smooth animations

#### User Experience
- [ ] Interface is intuitive
- [ ] No confusing error messages
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation)

#### Reliability
- [ ] No critical errors in logs
- [ ] Stable under load
- [ ] Proper error handling
- [ ] Graceful degradation

## Next Steps After Deployment

1. **User Training:**
   - Document new features
   - Create user guides
   - Provide training sessions

2. **Optimization:**
   - Monitor performance metrics
   - Gather user feedback
   - Implement improvements

3. **Future Enhancements:**
   - Additional overlay types
   - Advanced camera controls
   - Real-time chat integration
   - Analytics dashboard

4. **Maintenance:**
   - Regular updates
   - Security monitoring
   - Performance tuning
   - Backup verification
