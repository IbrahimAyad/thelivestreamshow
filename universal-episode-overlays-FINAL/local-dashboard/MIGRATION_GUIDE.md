# Migration Guide - Upgrading to Professional Suite v2.0

## Overview

This guide helps existing users upgrade from the basic Live Stream Production Dashboard to the new Professional Suite with 6 major enhancements.

## What's New

The Professional Suite adds:

1. 🔴 **Recording & Streaming Controls** - Start/stop with health monitoring
2. 🎬 **Scene Source Management** - Control individual sources
3. 🎵 **Audio Presets System** - Save and apply audio configurations
4. 📺 **Lower Thirds & Graphics** - Professional text overlays
5. 👥 **User Roles & Permissions** - Multi-user with Producer/Host/Guest roles
6. 🎨 **Professional Scene Templates** - Pre-built OBS scene collections

## Breaking Changes

### Authentication System

**Previous Version:**
- No authentication
- Everyone had full access

**New Version:**
- Optional authentication (can still use without login)
- Three user roles with different permissions
- Guest users have limited access

**Impact:**
- If you DON'T log in: Works like before but no access to advanced features
- If you log in: Default role is "Guest" - need Producer to upgrade you

### Database Changes

**New Tables Created:**
- `audio_presets` - Audio preset configurations
- `lower_thirds` - Lower third graphics
- `user_profiles` - User accounts and roles

**Impact:**
- Existing data (YouTube queue, rundown, notes) is preserved
- No migration needed for existing data

### UI Layout Changes

**Previous Version:**
- 2 tabs: Production, Notes & Rundown

**New Version:**
- 3 tabs: Production, Advanced (Producers only), Notes & Rundown
- Authentication UI in header
- Team status panel added

**Impact:**
- Existing features moved to Production tab
- New features in Advanced tab
- Layout optimized for wider screens (XL breakpoint)

## Migration Steps

### Step 1: Update the Application

**For Local Development:**

1. **Pull latest code** (if using git)
   ```bash
   git pull origin main
   ```

2. **Install new dependencies**
   ```bash
   cd local-dashboard
   pnpm install
   ```

3. **Update .env file**
   - Add YouTube API key if not present
   - Verify Supabase credentials

4. **Rebuild**
   ```bash
   pnpm run build
   ```

**For Deployed Version:**
- The deployed version at https://ggi5h4n1l6el.space.minimax.io is already updated
- Note: OBS WebSocket won't work on public URL (use local development)

### Step 2: Database Setup

The new tables are automatically created via Supabase. Verify they exist:

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Confirm these tables exist:
   - `audio_presets`
   - `lower_thirds`
   - `user_profiles`

If any are missing, they'll be created on first use.

### Step 3: Enable Supabase Authentication (Optional)

If you want to use user roles:

1. **Go to Supabase Dashboard** → Authentication
2. **Enable Email Provider**:
   - Go to Settings → Authentication → Providers
   - Toggle "Email" provider ON
   - Configure email templates (optional)
3. **Configure Email Settings**:
   - Use Supabase's built-in SMTP (recommended for testing)
   - Or configure custom SMTP for production
4. **Enable Email Confirmations** (optional):
   - Settings → Authentication → Email Auth
   - Toggle "Enable email confirmations"

**Note:** If you don't enable auth, you can still use the dashboard - just without user roles.

### Step 4: Set Up OBS for Lower Thirds (Optional)

If you want to use the Lower Thirds feature:

1. **Open OBS Studio**
2. **Add two text sources** to your main scene:
   - Source 1: Name it exactly `LowerThird_Title`
   - Source 2: Name it exactly `LowerThird_Subtitle`
3. **Style the text sources**:
   - Font: Arial Bold (Title), Arial Regular (Subtitle)
   - Size: 36-48pt (Title), 24-28pt (Subtitle)
   - Color: White with black outline
   - Position: Bottom-left area (70px from left, 930px from top)
4. **Hide by default** (click eye icon)
5. The dashboard will control their visibility and text

### Step 5: Create Your First User Account

1. **Open the dashboard**
2. **Click "Sign Up"** (top right)
3. **Enter credentials**:
   - Display name (optional)
   - Email address
   - Password (minimum 6 characters)
4. **Verify email** (check inbox)
5. **Default role is Guest** - see below to upgrade

### Step 6: Upgrade Your First User to Producer

Since the first user will be a Guest, you need to manually upgrade them:

1. **Go to Supabase Dashboard**
2. **Navigate to:** Table Editor → `user_profiles`
3. **Find your user** by email
4. **Edit the row**:
   - Change `role` from `guest` to `producer`
   - Click Save
5. **Log out and log back in** to the dashboard
6. You now have full Producer access!

### Step 7: Import OBS Scene Templates (Optional)

Try one of the professional scene templates:

1. **Choose a template** from `/obs-templates/`:
   - `talk_show_template.json`
   - `reaction_show_template.json`
   - `interview_template.json`
   - `panel_discussion_template.json`

2. **Import into OBS**:
   - OBS → Scene Collection menu → Import
   - Browse to the JSON file
   - Click Open

3. **Customize**:
   - Replace placeholder cameras with your actual devices
   - Adjust positioning and styling
   - See `OBS_TEMPLATE_GUIDE.md` for details

4. **Connect dashboard** to the new scene collection

## Feature-by-Feature Migration

### Audio Presets

**Old Workflow:**
- Manually adjust each audio source every time
- No way to save configurations
- Time-consuming for different show segments

**New Workflow:**
1. Set up your audio mix
2. Click "Save Current" in Audio Presets panel
3. Give it a name (e.g., "Interview Mix")
4. Apply anytime with one click

**Migration:**
- No action needed
- Start creating presets for your common configurations
- 5 pre-built presets available immediately

### Recording & Streaming

**Old Workflow:**
- Start/stop recording in OBS manually
- No visibility of stream health in dashboard

**New Workflow:**
1. Click "Start Recording" or "Go Live" in dashboard
2. Monitor stream health in real-time
3. Get alerts if performance degrades
4. Stop from dashboard

**Migration:**
- No action needed
- Feature available in Production tab (Producers only)
- Still works with OBS controls as before

### Source Management

**Old Workflow:**
- Switch to OBS to show/hide sources
- No visibility of source state in dashboard

**New Workflow:**
1. View all sources in current scene
2. Toggle visibility with eye icon
3. Lock sources to prevent accidental changes
4. Filter by category

**Migration:**
- No action needed
- Feature in Advanced tab (Producers only)
- Your existing sources work immediately

### Lower Thirds

**Old Workflow:**
- Not available (manual text sources in OBS)

**New Workflow:**
1. Create lower thirds in dashboard
2. Click "Show" to display on stream
3. Click "Hide" when done
4. Queue multiple graphics

**Migration:**
- Requires OBS text sources named `LowerThird_Title` and `LowerThird_Subtitle`
- See Step 4 above for setup
- Optional feature

## Backward Compatibility

### What Still Works the Same

✅ **All existing features**:
- Scene switching
- Audio mixer
- YouTube queue
- Timers
- Rundown editor
- Notes panel

✅ **OBS WebSocket connection**:
- Same connection process
- Same WebSocket address and password
- Compatible with OBS 28.0+

✅ **Data persistence**:
- All existing YouTube queue items preserved
- All rundown segments preserved
- All notes preserved

### What Changed

⚠️ **Access Control**:
- Without login: Limited to Production tab basics
- With login (Guest role): Same as without login
- With login (Host/Producer): Additional features unlocked

⚠️ **UI Layout**:
- Production tab now has three columns (was two)
- Advanced tab added for Producers
- Header includes authentication

⚠️ **Required for Advanced Features**:
- User account needed for team collaboration
- Producer role needed for advanced features
- OBS text sources needed for lower thirds

## Troubleshooting Migration Issues

### Issue: "Cannot access Advanced tab"

**Cause:** You're not logged in or don't have Producer role

**Solution:**
1. Create an account (Sign Up)
2. Upgrade to Producer role in Supabase dashboard
3. Log out and log back in

### Issue: "Lower Thirds not showing"

**Cause:** Text sources don't exist in OBS

**Solution:**
1. Create `LowerThird_Title` and `LowerThird_Subtitle` text sources in OBS
2. Add them to your scene
3. Ensure they're not locked in OBS
4. Reconnect dashboard to OBS

### Issue: "Audio Presets not applying"

**Cause:** Source names in preset don't match OBS sources

**Solution:**
1. Check your OBS source names
2. Create new presets with current sources
3. Delete old presets with mismatched names

### Issue: "Team Status not showing"

**Cause:** Not logged in

**Solution:**
1. Create an account
2. Log in
3. Team Status panel appears in Production tab

### Issue: "Cannot create account"

**Cause:** Email authentication not enabled in Supabase

**Solution:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Try creating account again

### Issue: "All users are Guests"

**Cause:** Default role is Guest, manual upgrade needed

**Solution:**
1. Go to Supabase Dashboard → Table Editor → `user_profiles`
2. Edit each user's `role` field to `producer` or `host`
3. Users must log out and log back in

## Rollback Instructions

If you need to revert to the previous version:

### For Local Development

1. **Checkout previous version** (if using git):
   ```bash
   git checkout <previous-commit-hash>
   ```

2. **Reinstall dependencies**:
   ```bash
   pnpm install
   ```

3. **Rebuild**:
   ```bash
   pnpm run build
   ```

### For Deployed Version

- Previous deployment URL is no longer active
- Contact support for previous version files

### Database Rollback

**Warning:** Deleting tables will lose all presets and lower thirds

To remove new tables:

1. Go to Supabase Dashboard → Table Editor
2. Delete these tables (if you want to remove them):
   - `audio_presets`
   - `lower_thirds`
   - `user_profiles`

**Note:** Existing data (YouTube queue, rundown, notes) is unaffected

## Getting Help

If you encounter issues during migration:

1. **Check documentation**:
   - README.md
   - FEATURE_GUIDE.md
   - OBS_TEMPLATE_GUIDE.md

2. **Review browser console** (F12):
   - Look for error messages
   - Check network tab for failed requests

3. **Verify OBS setup**:
   - WebSocket enabled
   - Correct port and password
   - Sources named correctly

4. **Check Supabase**:
   - Tables exist
   - Authentication enabled
   - User profiles created

## Post-Migration Checklist

- [ ] Application updated (local or using deployed version)
- [ ] New database tables verified
- [ ] Supabase Authentication enabled (if using user roles)
- [ ] First user account created
- [ ] First user upgraded to Producer role
- [ ] OBS text sources created for lower thirds (if using)
- [ ] At least one OBS scene template imported (optional)
- [ ] Audio preset created for common configuration
- [ ] Team members invited and roles assigned
- [ ] Features tested with OBS connection
- [ ] Documentation reviewed (FEATURE_GUIDE.md)

## What's Next

After successful migration:

1. **Explore new features** - Try each feature with test data
2. **Create audio presets** - Save your common configurations
3. **Set up lower thirds** - Create graphics for guests and topics
4. **Invite team members** - Add Hosts and Guests
5. **Import scene template** - Try a professional layout
6. **Test before going live** - Verify everything works

## Version Compatibility

- **OBS Studio:** 28.0 or higher (OBS WebSocket 5.x)
- **Supabase:** Any version (using current API)
- **Node.js:** 18.0 or higher
- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Support

For migration assistance:

- Review FEATURE_GUIDE.md for feature usage
- Check OBS_TEMPLATE_GUIDE.md for scene setup
- Consult README.md for general troubleshooting

---

**Migration Guide Version:** 2.0
**Last Updated:** October 2025
**Created by:** MiniMax Agent
