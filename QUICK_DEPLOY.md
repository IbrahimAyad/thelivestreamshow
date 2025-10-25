# 🚀 Unified Overlay System - Quick Deploy

## 3-Step Deployment (30 minutes)

### ✅ STEP 1: Database (5 min)
1. Open https://supabase.com/dashboard/project/vcniezwtltraqramjlux
2. Go to SQL Editor → New Query
3. Copy/paste: `unified-overlay-system-integration/backend/sql-scripts/01_unified_overlay_migration.sql`
4. Run (Cmd+Enter)
5. **Save the Main Stream overlay UUID from the overlays table**

### ✅ STEP 2: Edge Functions (10 min)

**Option A - CLI (Recommended):**
```bash
supabase functions deploy get-overlays --project-ref vcniezwtltraqramjlux
supabase functions deploy update-overlay --project-ref vcniezwtltraqramjlux
supabase functions deploy create-overlay-template --project-ref vcniezwtltraqramjlux
```

**Option B - Manual:**
- Dashboard → Edge Functions → Create
- Copy code from `unified-overlay-system-integration/backend/edge-functions/*/index.ts`

**Test:**
```bash
curl -X POST "https://vcniezwtltraqramjlux.supabase.co/functions/v1/get-overlays" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ"
```

### ✅ STEP 3: Configure Overlay (3 min)
1. Open `public/unified-overlay.html`
2. Find line ~644: `overlayId: null`
3. Replace with: `overlayId: 'YOUR-MAIN-STREAM-UUID-FROM-STEP-1'`
4. Save

---

## 🧪 Test (5 min)

```bash
# Start dev server
npm run dev

# Open dashboard
open http://localhost:5173

# Open overlay in browser
open http://localhost:5173/unified-overlay.html
```

**Verify:**
- ✅ Dashboard shows 3 overlay tiles
- ✅ Ctrl+Click opens edit modal
- ✅ Overlay displays episode info
- ✅ Chat messages rotate

---

## 🎬 OBS Setup (5 min)

1. OBS → Sources → + → Browser
2. **URL:** `http://localhost:5173/unified-overlay.html`
3. **Width:** 1920, **Height:** 1080
4. ✅ Shutdown when not visible
5. ✅ Refresh on scene active
6. Click OK

---

## 📋 Verification Checklist

Run automated validation:
```bash
bash validate-overlay-integration.sh
```

Manual checks:
- [ ] 3 overlays in database
- [ ] 3 edge functions deployed and active
- [ ] OverlayGrid shows in dashboard
- [ ] Edit modal works (Ctrl+Click)
- [ ] Changes save to database
- [ ] OBS displays overlay correctly

---

## 🆘 Troubleshooting

**Empty grid?**
→ Check database migration executed successfully

**API errors?**
→ Verify edge functions deployed with `SUPABASE_SERVICE_ROLE_KEY`

**Overlay blank in OBS?**
→ Check `overlayId` configured in `public/unified-overlay.html`

**Changes not saving?**
→ Check browser console for errors, verify edge functions active

---

## 📖 Full Documentation

- **Complete Guide:** `UNIFIED_OVERLAY_INTEGRATION_GUIDE.md`
- **Integration Summary:** `INTEGRATION_COMPLETE_SUMMARY.md`

---

## ✨ Success!

When complete, you'll have:
- Professional overlay management interface
- Click-to-edit functionality
- Real-time content updates
- OBS-ready broadcast overlay
- 60+ pre-configured chat messages

**Total time invested:** ~30 minutes  
**Value delivered:** Production-ready overlay system! 🎉
