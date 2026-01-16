# Big Time Lucky 13 Game Deployment Guide

## Problem
The game assets (51 files, ~52MB) exceed Cloudflare Pages' 25MB limit when included in the main site deployment.

## Solution Options

### Option 1: Separate Cloudflare Pages Project (RECOMMENDED)
Deploy the game as its own Cloudflare Pages site at `game.thelivestreamshow.com`

**Steps:**
1. Create new GitHub repo: `thelivestreamshow-game`
2. Copy `/public/big-time-lucky-13/*` to the new repo
3. Create Cloudflare Pages project pointing to new repo
4. Set custom domain: `game.thelivestreamshow.com`
5. Update landing page link from `/big-time-lucky-13` to `https://game.thelivestreamshow.com`

**Pros:**
- ✅ No file size limits
- ✅ Independent deployments
- ✅ Better performance (separate CDN)
- ✅ No backend needed

**Cons:**
- ❌ Requires DNS configuration
- ❌ Separate deployment pipeline

### Option 2: Supabase Storage + CDN
Upload all assets to Supabase storage and modify game code to load from CDN URLs.

**Steps:**
1. Go to Supabase Dashboard → Storage
2. Create bucket `game-assets` with public access
3. Add RLS policy: Allow SELECT and INSERT for anon
4. Upload files via dashboard or CLI
5. Update game JavaScript to use Supabase URLs

**Pros:**
- ✅ Uses existing infrastructure
- ✅ Centralized asset management

**Cons:**
- ❌ Requires manual Supabase dashboard access for RLS policies
- ❌ Need to modify game JavaScript build

### Option 3: External CDN (jsDelivr/Cloudinary)
Host assets on a free CDN service.

**Pros:**
- ✅ Quick setup
- ✅ Global CDN

**Cons:**
- ❌ Dependency on third-party service
- ❌ May have bandwidth limits

## Immediate Action Required

To get the game working, I recommend **Option 1** (separate site). Here's what we need to do:

1. **Create new repo** for just the game
2. **Deploy to Cloudflare Pages** as `game.thelivestreamshow.com`
3. **Update landing page** to link to subdomain
4. **Remove game files** from main repo to reduce deployment size

Would you like me to set this up?
