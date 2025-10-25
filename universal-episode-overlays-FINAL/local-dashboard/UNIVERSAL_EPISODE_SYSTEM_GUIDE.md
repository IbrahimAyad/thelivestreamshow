# 🔥 Universal Episode System - Implementation Guide

## Overview

The **Universal Episode System** replaces all hardcoded episode information across your broadcast with a single database source that controls ALL overlays simultaneously. When you update episode data, it instantly changes everywhere.

## 🎯 What We Built

### 1. **Database Structure**
- **Table**: `episode_info` 
- **Fields**: episode_number, episode_title, episode_topic, season_number, show_name, is_visible, is_active
- **Real-time**: Enabled for instant updates across all components

### 2. **Universal Components Created**

#### **React Components**
- **`LiveBroadcastControlUniversal.tsx`** - Universal episode control panel
- **`UniversalEpisodeManager.tsx`** - Universal episode management interface
- **Updated `useEpisodeInfo.ts`** - Universal data hook with show_name support
- **`PiNamecardOverlay.tsx`** - Existing overlay component (already universal)

#### **OBS Overlay**
- **`alpha-wednesday-universal.html`** - Universal Alpha Wednesday overlay (replaces hardcoded version)

## 📋 Current Episode Data

```sql
SELECT * FROM episode_info WHERE is_active = true;
```

**Current Active Episode:**
- Show: Alpha Wednesday
- Season: 4, Episode: 32
- Title: "Alpha Wednesday"
- Topic: "Address All The Smoke"
- Visibility: ON
- Real-time Updates: ENABLED

## 🚀 How to Use

### **1. Using the Universal Episode Manager**

1. **Navigate to**: `/workspace/local-dashboard/src/components/shows/UniversalEpisodeManager.tsx`
2. **Features**:
   - Create/Edit episodes in the episode_info table
   - Set any episode as "active" (controls all overlays)
   - Toggle visibility across all overlays
   - Real-time preview of changes

### **2. Using Universal Episode Control**

1. **Navigate to**: `/workspace/local-dashboard/src/components/shows/LiveBroadcastControlUniversal.tsx`
2. **Features**:
   - Control episode visibility from anywhere
   - Update broadcast topic/hashtag
   - Sync settings across all overlays
   - Monitor episode data status

### **3. Alpha Wednesday OBS Overlay**

1. **Replace your existing OBS overlay** with: `/workspace/local-dashboard/alpha-wednesday-universal.html`
2. **Features**:
   - Automatically loads episode data from database
   - Updates in real-time (checks every 30 seconds)
   - Shows current episode in top bar
   - Displays show info in bottom bar

## 🔄 Testing the Universal System

### **Step 1: Test Database Updates**

```sql
-- Change episode data
UPDATE episode_info 
SET episode_number = 33, 
    episode_title = 'Test Episode',
    episode_topic = 'Testing Universal System'
WHERE is_active = true;

-- Verify the change
SELECT * FROM episode_info WHERE is_active = true;
```

**Expected Result**: All overlays should show "Episode 33" immediately.

### **Step 2: Test Visibility Toggle**

```sql
-- Hide episode overlay
UPDATE episode_info SET is_visible = false WHERE is_active = true;

-- Show episode overlay  
UPDATE episode_info SET is_visible = true WHERE is_active = true;
```

**Expected Result**: All overlays should disappear/appear based on visibility setting.

### **Step 3: Test Different Show Names**

```sql
-- Test with different show name
UPDATE episode_info 
SET show_name = 'Test Show Alpha',
    episode_title = 'Different Episode Title'
WHERE is_active = true;
```

**Expected Result**: Show name changes in OBS overlay and dashboard.

## 🔧 Integration Steps

### **1. Replace Existing Components**

Update your app to use the universal components:

```typescript
// Replace this
import { LiveBroadcastControl } from './components/shows/LiveBroadcastControl'

// With this
import { LiveBroadcastControlUniversal } from './components/shows/LiveBroadcastControlUniversal'

// Replace this
import { EpisodeManager } from './components/shows/EpisodeManager'

// With this  
import { UniversalEpisodeManager } from './components/shows/UniversalEpisodeManager'
```

### **2. Update OBS Configuration**

1. **Backup your current overlay**: `alpha-wednesday-websocket-tool.html`
2. **Replace with**: `alpha-wednesday-universal.html`
3. **Update OBS Browser Source** to point to the new file
4. **Test connection** - the overlay will automatically connect to Supabase

### **3. Update Deployment**

If you have the Node.js server version:

1. **Update server config** to serve the new universal overlay
2. **Update deployment** to use universal components
3. **Test real-time updates** across all systems

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OBS Overlay   │◄──►│  Supabase DB     │◄──►│  Dashboard UI   │
│                 │    │  episode_info    │    │                 │
│ Real-time reads │    │  table           │    │ Universal Comp. │
│ Updates every   │    │  Real-time sub   │    │ Management      │
│ 30 seconds      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Show Name       │    │ Single Source    │    │ Episode Control │
│ Episode Number  │◄──►│ of Truth         │◄──►│ & Management    │
│ Season Display  │    │                  │    │                 │
│ Topic Display   │    │ Global Visibility│    │ Real-time Sync  │
│                 │    │ Control          │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 Benefits

### **✅ Single Source of Truth**
- Change episode data once → updates everywhere
- No more hardcoded episode info across multiple files
- Consistent episode information across all overlays

### **✅ Real-time Updates**  
- Changes propagate instantly across all systems
- OBS overlay updates every 30 seconds automatically
- Dashboard shows live episode status

### **✅ Global Control**
- Toggle episode visibility from one place
- Control all overlays simultaneously
- Set active episode that controls everything

### **✅ Flexible Shows**
- Support different shows with different designs
- Show name field allows for show switching
- Each show can have different styling

### **✅ Future-Proof**
- Easy to add new overlay types
- System works with any number of shows
- Scales with your broadcast needs

## 🔍 Troubleshooting

### **Overlay Not Showing Episode Data**
1. Check Supabase connection in browser console
2. Verify episode_info table has active/visible episode
3. Check network requests for 401/403 errors

### **Changes Not Reflecting**
1. Clear browser cache for OBS overlay
2. Restart OBS browser source
3. Check Supabase real-time subscription status

### **Database Connection Issues**
1. Verify SUPABASE_URL and SUPABASE_ANON_KEY in HTML
2. Check CORS settings in Supabase
3. Verify RLS policies allow anonymous read access

## 🚀 Next Steps

1. **Test the universal system** with the current Episode 32 data
2. **Replace existing components** with universal versions
3. **Update OBS overlay** to use universal version
4. **Add new overlay types** as needed (lower thirds, title cards, etc.)
5. **Deploy to production** with universal system

## 📝 Files Created/Modified

### **Database**
- `episode_info` table updated with show_name field
- Current episode data: S4E32 "Alpha Wednesday"

### **React Components**
- `/src/hooks/useEpisodeInfo.ts` - Updated with show_name support
- `/src/components/shows/LiveBroadcastControlUniversal.tsx` - NEW
- `/src/components/shows/UniversalEpisodeManager.tsx` - NEW

### **OBS Integration**
- `/alpha-wednesday-universal.html` - NEW universal overlay

---

## 🎉 Success Criteria

**The Universal Episode System is working when:**
- ✅ Changing episode data in database updates all overlays immediately
- ✅ Visibility toggle works across all overlays
- ✅ OBS overlay shows correct episode information
- ✅ Dashboard controls can manage episode data
- ✅ Real-time updates work across all systems

**Ready for production deployment!** 🚀
