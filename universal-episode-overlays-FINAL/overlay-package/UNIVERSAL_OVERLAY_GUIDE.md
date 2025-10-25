# Universal Episode System - Overlay Package

## Overview
This package contains 3 universal overlay files that integrate with the existing Universal Episode System backend. All overlays connect to the Supabase database (`episode_info` table) and update dynamically when episode information changes.

## Files Included

### 1. `alpha-wednesday-universal.html`
- **Purpose**: Replaces hardcoded Alpha Wednesday overlay
- **Design**: Gold-themed, professional broadcast style
- **Features**:
  - Real-time OBS WebSocket connection
  - Connects to `episode_info` table for dynamic data
  - Shows: Season, Episode Number, Show Name, Episode Topic
  - Status indicators for Live/IDLE states
  - Stream statistics and viewer count

### 2. `alpha-wednesday-original-universal.html`
- **Purpose**: Alpha Wednesday original clean design with database integration
- **Design**: Clean, minimal broadcast style, original design preserved
- **Features**:
  - OBS WebSocket integration
  - Database-driven episode information
  - Original styling maintained with modern functionality
  - Dynamic text updates from episode_info table

### 3. `TheLiveStreamShow.html`
- **Purpose**: The Live Stream Show overlay with websocket functionality
- **Design**: Gold-themed with corner accents, distinctive style
- **Features**:
  - OBS WebSocket integration
  - Database-driven episode information
  - Unique visual design (corner elements, animations)
  - Dynamic text updates from episode_info table

## Integration Instructions

### Backend Requirements
- **Database**: `episode_info` table (already exists)
- **Supabase**: Connection to existing project
- **Real-time**: PostgreSQL change subscriptions enabled

### Database Schema Used
```sql
episode_info table contains:
- id
- season_number (integer)
- episode_number (integer) 
- episode_title (text)
- episode_topic (text)
- show_name (text)
- is_active (boolean)
- is_visible (boolean)
- created_at, updated_at
```

### OBS Setup
1. **Add as Browser Source** in OBS
2. **URL Parameters** (add to the file URL):
   ```
   ?supabase_url=YOUR_SUPABASE_URL&supabase_anon_key=YOUR_ANON_KEY
   ```
3. **Local Testing**: Files can be opened directly in browser for testing

### Frontend Developer Notes

#### For Alpha Wednesday Universal:
- **URL**: `alpha-wednesday-universal.html`
- **Parameters**: Add via URL query string
- **WebSocket**: Pre-configured for 192.168.1.199:4455
- **Colors**: Gold (#FFD700) theme

#### For Alpha Wednesday Original:
- **URL**: `alpha-wednesday-original-universal.html`
- **Parameters**: Add via URL query string
- **WebSocket**: Pre-configured for 192.168.1.199:4455
- **Colors**: Gold (#FFD700) theme, original styling

#### For The Live Stream Show:
- **URL**: `TheLiveStreamShow.html` 
- **Parameters**: Add via URL query string
- **WebSocket**: Pre-configured for 192.168.1.199:4455
- **Colors**: Gold (#FFD700) theme, distinctive branding

#### Dynamic Updates:
All overlays automatically update when:
1. Episode info changes in database (`episode_info` table)
2. Only visible (`is_visible = true`) and active (`is_active = true`) episodes show
3. Real-time subscriptions update displays instantly

### Environment Setup
- **Supabase URL**: Available in existing project
- **Supabase Anon Key**: Available in existing project
- **WebSocket Server**: OBS WebSocket plugin (port 4455)

### Testing
1. **Database Updates**: Change episode_info table → Overlays update
2. **Stream Status**: Start/stop stream in OBS → Status changes
3. **Real-time**: Multiple overlays update simultaneously from same data source

## Support
- **Backend**: Centralized in Supabase `episode_info` table
- **Real-time**: PostgreSQL change notifications
- **Multiple Shows**: Each overlay can display different shows while using same data source
- **Independent Styles**: Each overlay maintains unique visual design

## Status
- ✅ Backend integration complete
- ✅ Database schema ready  
- ✅ Real-time subscriptions working
- ✅ All three overlays functional
- ✅ Supabase credentials updated
- ✅ OBS WebSocket library loading fixed
- ✅ Enhanced error handling implemented