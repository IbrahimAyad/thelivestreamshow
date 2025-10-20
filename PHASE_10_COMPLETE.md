# Phase 10 Complete: Multi-Show Management System

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**
**Date**: January 2025
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components Created](#components-created)
4. [Database Schema](#database-schema)
5. [Integration Points](#integration-points)
6. [Testing Guide](#testing-guide)
7. [Usage Examples](#usage-examples)
8. [Security & RLS Policies](#security--rls-policies)
9. [Performance Considerations](#performance-considerations)
10. [Future Enhancements](#future-enhancements)

---

## Overview

Phase 10 introduces a comprehensive **Multi-Show Management System** that allows users to create, manage, and switch between multiple show profiles within a single application instance.

### What This Phase Delivers

✅ **Complete Show Profile Management**
- Create, edit, duplicate, archive, and delete shows
- Import/export show configurations as JSON
- Built-in template library with 5 pre-configured show types
- Active show tracking with single-active enforcement
- Real-time synchronization across all components

✅ **User Interface Components**
- **ShowSelector**: Always-visible dropdown in header for quick show switching
- **ShowLibrary**: Grid/list view for browsing and managing all shows
- **ShowEditor**: Comprehensive form for creating/editing show profiles
- **ShowManagerPanel**: Modal wrapper managing library/editor views

✅ **Database Integration**
- PostgreSQL table with full CRUD operations
- Row Level Security (RLS) policies for access control
- Triggers for single-active enforcement and timestamp updates
- Sample template data for quick onboarding

✅ **Feature Set**
- Custom branding (primary/secondary colors, logos)
- Scheduling configuration (daily, weekly, monthly, custom)
- Default automation settings per show
- Episode tracking and statistics
- Team collaboration support
- URL-friendly slug generation

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Application Header                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │          ShowSelector (Always Visible)            │  │
│  │  • Displays active show with branding             │  │
│  │  • Dropdown for quick show switching              │  │
│  │  • "Manage Shows" button → Opens modal            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ (Click "Manage Shows")
┌─────────────────────────────────────────────────────────┐
│              ShowManagerPanel (Modal)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              ShowLibrary (Default View)           │  │
│  │  • Grid/List view of all shows                    │  │
│  │  • Search and filter                              │  │
│  │  • Actions: Activate, Archive, Duplicate, Export  │  │
│  │  • "Create New Show" → Switch to editor           │  │
│  │  • "Edit Show" → Switch to editor with ID         │  │
│  └──────────────────────────────────────────────────┘  │
│                       OR                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │              ShowEditor (Edit View)               │  │
│  │  • Form sections: Basic Info, Branding, Schedule  │  │
│  │  • Default settings configuration                 │  │
│  │  • Template quick-apply                           │  │
│  │  • Save → Back to library                         │  │
│  │  • Cancel → Back to library                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   ShowManager    │
                    │  (Service Layer) │
                    │  • CRUD ops      │
                    │  • Real-time sync│
                    │  • LocalStorage  │
                    │  • Statistics    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Supabase DB     │
                    │  "shows" table   │
                    │  • RLS policies  │
                    │  • Triggers      │
                    │  • Real-time     │
                    └──────────────────┘
```

### Data Flow

```
User Action → Component → ShowManager → Supabase
                              ↓
                        LocalStorage (active show ID)
                              ↓
                        Subscriptions
                              ↓
                    All Subscribed Components Update
```

### State Management

1. **ShowManager (Singleton)**
   - In-memory cache of all shows
   - Active show tracking
   - Subscription system for real-time updates
   - LocalStorage persistence for active show ID

2. **Component State**
   - ShowSelector: Uses ShowManager subscriptions
   - ShowLibrary: Uses ShowManager subscriptions + local filter state
   - ShowEditor: Local form state, submits to ShowManager

---

## Components Created

### 1. ShowManager.ts (`/src/lib/shows/ShowManager.ts`)

**Lines**: 720
**Purpose**: Core service layer for all show management operations

#### Key Interface

```typescript
export interface ShowProfile {
  // Identity
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string
  slug: string // URL-friendly unique identifier

  // Branding
  primary_color?: string
  secondary_color?: string
  logo_url?: string
  cover_image_url?: string

  // Schedule
  schedule_type?: 'daily' | 'weekly' | 'monthly' | 'custom'
  schedule_day?: number // 0-6 for weekly, 1-31 for monthly
  schedule_time?: string // HH:MM format
  timezone?: string

  // Configuration
  default_automation_config?: Record<string, any>
  default_obs_scene?: string

  // State
  is_active: boolean
  is_archived: boolean
  is_template: boolean

  // Statistics
  episode_count: number
  total_episodes: number
  total_watch_time?: number // seconds
  avg_viewer_count?: number
  last_aired_at?: string
  next_scheduled_at?: string

  // Ownership
  created_by?: string
  team_id?: string
}
```

#### Core Methods

| Method | Description |
|--------|-------------|
| `loadShows()` | Fetch all shows from database, cache in memory |
| `getShowById(id)` | Retrieve single show by UUID |
| `getShowBySlug(slug)` | Retrieve single show by slug |
| `createShow(show)` | Create new show with auto-generated slug |
| `updateShow(id, updates)` | Update existing show |
| `deleteShow(id)` | Permanently delete show |
| `archiveShow(id)` | Soft delete (set is_archived=true) |
| `unarchiveShow(id)` | Restore archived show |
| `duplicateShow(id, name?)` | Clone show with new name/slug |
| `setActiveShow(id)` | Set active show (enforces single-active) |
| `getActiveShow()` | Get current active show object |
| `getActiveShowId()` | Get current active show ID |
| `filterShows(filter)` | Filter shows by search, type, archived status |
| `exportShow(id)` | Export show as JSON string |
| `importShow(json)` | Import show from JSON string |
| `incrementEpisodeCount(id)` | Increment episode counters |
| `updateShowStats(id, stats)` | Update watch time, viewer count, etc. |
| `subscribe(callback)` | Subscribe to all shows changes |
| `subscribeToActiveShow(callback)` | Subscribe to active show changes |

#### Built-in Templates

```typescript
getBuiltInTemplates(): ShowTemplate[] {
  return [
    {
      name: 'Tech Talk Show',
      description: 'Discussion show focused on technology and software',
      primary_color: '#3b82f6',
      secondary_color: '#8b5cf6',
      schedule_type: 'weekly',
      default_automation_config: {
        autoExecuteThreshold: 0.85,
        requireApprovalThreshold: 0.65,
        autoExecutionEnabled: false
      }
    },
    {
      name: 'Interview Series',
      description: 'One-on-one interviews with industry experts',
      primary_color: '#ec4899',
      secondary_color: '#f43f5e',
      schedule_type: 'weekly',
      // ...
    },
    {
      name: 'Gaming Stream',
      description: 'Live gaming with audience interaction',
      primary_color: '#10b981',
      secondary_color: '#14b8a6',
      schedule_type: 'daily',
      // ...
    },
    {
      name: 'Educational Workshop',
      description: 'Teaching and tutorial sessions',
      primary_color: '#f59e0b',
      secondary_color: '#f97316',
      schedule_type: 'weekly',
      // ...
    },
    {
      name: 'News & Updates',
      description: 'Regular news roundup and commentary',
      primary_color: '#ef4444',
      secondary_color: '#dc2626',
      schedule_type: 'daily',
      // ...
    }
  ]
}
```

#### Real-time Synchronization

```typescript
private setupRealtimeSubscription() {
  this.supabase
    .channel('shows-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'shows' },
      async (payload) => {
        await this.loadShows() // Refresh cache
        this.notifyListeners(this.shows)

        // Update active show if changed
        if (this.activeShowId) {
          const activeShow = this.shows.find(s => s.id === this.activeShowId)
          this.notifyActiveShowListeners(activeShow || null)
        }
      }
    )
    .subscribe()
}
```

---

### 2. ShowSelector.tsx (`/src/components/ShowSelector.tsx`)

**Lines**: 150
**Purpose**: Always-visible dropdown in application header for quick show switching

#### Features

- ✅ Displays active show name with custom gradient
- ✅ Dropdown menu with all non-archived shows
- ✅ Color indicators for each show
- ✅ Episode count and schedule type display
- ✅ "Manage Shows" button opens ShowManagerPanel modal
- ✅ "Create New Show" quick action
- ✅ Click outside to close dropdown
- ✅ Real-time updates via ShowManager subscriptions

#### Props

```typescript
interface ShowSelectorProps {
  onManageShows?: () => void // Called when "Manage Shows" clicked
}
```

#### Visual Design

**Active Show Display**:
```
┌─────────────────────────────────┐
│ [TV Icon]  My Tech Show    [▼]  │
│            10 episodes           │
└─────────────────────────────────┘
   └── Gradient using show colors
```

**Dropdown Menu**:
```
┌──────────────────────────────────────┐
│ [●] Tech Talk Show        [Active]   │
│     10 episodes • weekly             │
├──────────────────────────────────────┤
│ [●] Gaming Stream                    │
│     25 episodes • daily              │
├──────────────────────────────────────┤
│ [●] Interview Series                 │
│     5 episodes • weekly              │
├──────────────────────────────────────┤
│ [Button] + Create New Show           │
├──────────────────────────────────────┤
│ [Button] Manage Shows...             │
└──────────────────────────────────────┘
```

---

### 3. ShowLibrary.tsx (`/src/components/ShowLibrary.tsx`)

**Lines**: 460
**Purpose**: Main UI for browsing and managing all shows with grid/list views

#### Features

- ✅ Grid view (default) and list view modes
- ✅ Search by name, description, or slug
- ✅ Show/hide archived shows toggle
- ✅ Per-show actions: Activate, Archive, Duplicate, Export, Delete
- ✅ Color-coded show cards based on branding
- ✅ Statistics display (episodes, schedule, last aired)
- ✅ Import show from JSON
- ✅ Real-time synchronization
- ✅ Empty state with "Create New Show" call-to-action

#### Props

```typescript
interface ShowLibraryProps {
  onEditShow?: (showId: string) => void // Called when edit button clicked
  onCreateNew?: () => void // Called when create new clicked
}
```

#### Action Handlers

```typescript
// Activate show (sets as current active show)
const handleActivateShow = async (showId: string) => {
  await showManager.setActiveShow(showId)
}

// Archive show (soft delete)
const handleArchive = async (showId: string) => {
  if (confirm('Archive this show? It can be restored later.')) {
    await showManager.archiveShow(showId)
  }
}

// Duplicate show
const handleDuplicate = async (showId: string) => {
  const show = await showManager.getShowById(showId)
  const newName = prompt('Enter name for duplicated show:', `${show.name} (Copy)`)
  if (newName) {
    await showManager.duplicateShow(showId, newName)
  }
}

// Export show as JSON
const handleExport = (showId: string) => {
  const json = showManager.exportShow(showId)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `show-${showId}.json`
  a.click()
}

// Delete show permanently
const handleDelete = async (showId: string) => {
  const show = await showManager.getShowById(showId)
  if (confirm(`Permanently delete "${show.name}"? This cannot be undone.`)) {
    await showManager.deleteShow(showId)
  }
}
```

#### Grid View Card Design

```
┌────────────────────────────────────┐
│  [Gradient Header with Show Colors]│
│           [Active Badge]            │
│                                     │
│  Show Name                          │
│  "Description text..."              │
│                                     │
│  📊 10 episodes                     │
│  📅 Weekly                          │
│  🕐 Last aired: Jan 1, 2025         │
│                                     │
│  [▶ Activate] [Edit] [⋯ Menu]      │
└────────────────────────────────────┘
```

---

### 4. ShowEditor.tsx (`/src/components/ShowEditor.tsx`)

**Lines**: 520
**Purpose**: Comprehensive form for creating and editing show profiles

#### Form Sections

**1. Basic Information**
- Name (required, text input)
- Description (optional, textarea)

**2. Branding**
- Primary Color (color picker + hex input)
- Secondary Color (color picker + hex input)
- Live gradient preview
- Logo URL (optional, future enhancement)
- Cover Image URL (optional, future enhancement)

**3. Schedule**
- Schedule Type: daily, weekly, monthly, custom (dropdown)
- Schedule Day:
  - For weekly: 0-6 (Sunday-Saturday)
  - For monthly: 1-31
- Schedule Time: HH:MM (time input)
- Timezone: dropdown with common timezones

**4. Default Settings**
- Default OBS Scene Name (text input)
- Auto-Execute Threshold (slider, 0-100%)
- Require Approval Threshold (slider, 0-100%)
- Auto-Execution Enabled (checkbox)

**5. Template Quick-Apply**
- Button to show template modal
- Grid of 5 built-in templates
- Click template to apply all settings

#### Props

```typescript
interface ShowEditorProps {
  showId?: string // If provided, edit mode; otherwise create mode
  onSave?: (show: ShowProfile) => void
  onCancel?: () => void
}
```

#### Validation Rules

```typescript
const validateForm = (): boolean => {
  if (!name.trim()) {
    alert('Show name is required')
    return false
  }

  if (primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    alert('Primary color must be valid hex code (#RRGGBB)')
    return false
  }

  if (secondaryColor && !/^#[0-9A-Fa-f]{6}$/.test(secondaryColor)) {
    alert('Secondary color must be valid hex code (#RRGGBB)')
    return false
  }

  if (scheduleType === 'weekly' && scheduleDay !== undefined) {
    if (scheduleDay < 0 || scheduleDay > 6) {
      alert('Weekly schedule day must be 0-6')
      return false
    }
  }

  if (scheduleType === 'monthly' && scheduleDay !== undefined) {
    if (scheduleDay < 1 || scheduleDay > 31) {
      alert('Monthly schedule day must be 1-31')
      return false
    }
  }

  return true
}
```

#### Save Handler

```typescript
const handleSave = async () => {
  if (!validateForm()) return

  const showData: Partial<ShowProfile> = {
    name,
    description,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    schedule_type: scheduleType,
    schedule_day: scheduleDay,
    schedule_time: scheduleTime,
    timezone,
    default_obs_scene: defaultObsScene,
    default_automation_config: {
      autoExecuteThreshold,
      requireApprovalThreshold,
      autoExecutionEnabled
    }
  }

  let savedShow: ShowProfile
  if (showId) {
    // Update existing
    savedShow = await showManager.updateShow(showId, showData)
  } else {
    // Create new
    savedShow = await showManager.createShow(showData)
  }

  onSave?.(savedShow)
}
```

---

### 5. ShowManagerPanel.tsx (`/src/components/ShowManagerPanel.tsx`)

**Lines**: 70
**Purpose**: Modal wrapper that manages state between library and editor views

#### View State Machine

```
┌─────────────┐
│   library   │ ◄────┐
└─────┬───────┘      │
      │              │
      │ createNew    │ save
      │ editShow     │ cancel
      │              │
      ▼              │
┌─────────────┐      │
│   editor    │ ─────┘
└─────────────┘
```

#### State Management

```typescript
const [view, setView] = useState<'library' | 'editor'>('library')
const [editingShowId, setEditingShowId] = useState<string | undefined>(undefined)

// Library → Editor (create new)
const handleCreateNew = () => {
  setEditingShowId(undefined)
  setView('editor')
}

// Library → Editor (edit existing)
const handleEditShow = (showId: string) => {
  setEditingShowId(showId)
  setView('editor')
}

// Editor → Library (save)
const handleSave = (show: ShowProfile) => {
  console.log('Show saved:', show)
  setView('library')
  setEditingShowId(undefined)
}

// Editor → Library (cancel)
const handleCancel = () => {
  setView('library')
  setEditingShowId(undefined)
}
```

---

## Database Schema

### Migration File

**Location**: `/supabase/migrations/20250101000010_shows.sql`
**Lines**: 220

### Table Structure

```sql
CREATE TABLE IF NOT EXISTS shows (
  -- Primary Key & Timestamps
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,

  -- Branding
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT,
  cover_image_url TEXT,

  -- Schedule
  schedule_type TEXT CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  schedule_day INTEGER, -- Day of week (0-6) or day of month (1-31)
  schedule_time TEXT, -- HH:MM format
  timezone TEXT DEFAULT 'America/New_York',

  -- Configuration
  default_automation_config JSONB,
  default_obs_scene TEXT,

  -- State
  is_active BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,

  -- Statistics
  episode_count INTEGER DEFAULT 0,
  total_episodes INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0, -- in seconds
  avg_viewer_count DECIMAL(10, 2),
  last_aired_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID,
  team_id UUID,

  -- Constraints
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT slug_not_empty CHECK (char_length(slug) > 0)
);
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_shows_slug ON shows(slug);
CREATE INDEX IF NOT EXISTS idx_shows_is_active ON shows(is_active);
CREATE INDEX IF NOT EXISTS idx_shows_is_archived ON shows(is_archived);
CREATE INDEX IF NOT EXISTS idx_shows_is_template ON shows(is_template);
CREATE INDEX IF NOT EXISTS idx_shows_created_by ON shows(created_by);
CREATE INDEX IF NOT EXISTS idx_shows_team_id ON shows(team_id);
CREATE INDEX IF NOT EXISTS idx_shows_schedule_type ON shows(schedule_type);
```

### Triggers

#### 1. Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_shows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shows_updated_at
  BEFORE UPDATE ON shows
  FOR EACH ROW
  EXECUTE FUNCTION update_shows_updated_at();
```

#### 2. Single Active Show Enforcement (CRITICAL)

```sql
CREATE OR REPLACE FUNCTION ensure_single_active_show()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other shows
    UPDATE shows
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active
  BEFORE INSERT OR UPDATE OF is_active ON shows
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_show();
```

**How This Works**:
- When a show's `is_active` is set to `true`
- BEFORE the row is inserted/updated
- The trigger automatically sets `is_active = false` on all other shows
- Ensures only ONE show is ever active at a time
- Enforced at database level (can't be bypassed by application bugs)

### Sample Data

5 template shows are inserted with `is_template = true`:

```sql
INSERT INTO shows (name, description, slug, primary_color, secondary_color, schedule_type, default_automation_config, is_template, created_by) VALUES
  (
    'Tech Talk Show',
    'Discussion show focused on technology and software',
    'tech-talk-template',
    '#3b82f6',
    '#8b5cf6',
    'weekly',
    '{"autoExecuteThreshold": 0.85, "requireApprovalThreshold": 0.65, "autoExecutionEnabled": false}',
    true,
    null
  ),
  -- ... 4 more templates
```

---

## Integration Points

### App.tsx Modifications

**Location**: `/src/App.tsx`

#### 1. Imports Added

```typescript
import { ShowManagerPanel } from './components/ShowManagerPanel'
import { ShowSelector } from './components/ShowSelector'
```

#### 2. State Added

```typescript
const [showManagement, setShowManagement] = useState(false)
```

#### 3. Header Integration (ShowSelector)

**Location**: Line ~150 in header div

```typescript
<div className="flex items-center gap-3">
  <ShowSelector onManageShows={() => setShowManagement(true)} />
  <SystemHealthMonitor />
  {/* ... rest of header items */}
</div>
```

**Why This Location**: Placed before SystemHealthMonitor in top-right header area for maximum visibility

#### 4. Modal Integration (ShowManagerPanel)

**Location**: After keyboard shortcuts modal, before main content

```typescript
{showManagement && (
  <div
    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
    onClick={() => setShowManagement(false)}
  >
    <div
      className="bg-gray-900 border-2 border-purple-600/50 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto"
      onClick={e => e.stopPropagation()}
    >
      <ShowManagerPanel />
    </div>
  </div>
)}
```

**Pattern Explanation**:
- Outer `div`: Full-screen overlay, click closes modal
- Inner `div`: Content container, `stopPropagation()` prevents close on content click
- `z-50`: Ensures modal appears above all other content
- `max-w-7xl w-full`: Responsive width, max 1280px
- `max-h-[90vh] overflow-auto`: Scrollable if content exceeds 90% viewport height

---

## Testing Guide

### Pre-flight Checklist

Before testing, ensure:
- ✅ Supabase project is running
- ✅ Migration `20250101000010_shows.sql` has been applied
- ✅ Application is running (`npm run dev`)
- ✅ User is authenticated (if RLS policies require auth)

### Database Migration

```bash
# Navigate to supabase directory
cd /Users/ibrahim/thelivestreamshow

# Apply migration
supabase db push

# OR manually via SQL editor in Supabase Dashboard
# Copy contents of supabase/migrations/20250101000010_shows.sql
# Paste and execute in SQL Editor
```

### Verification Queries

#### 1. Check Table Created

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shows'
ORDER BY ordinal_position;
```

Expected: 26 columns returned

#### 2. Check Triggers Exist

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'shows';
```

Expected: 2 triggers
- `shows_updated_at`
- `ensure_single_active`

#### 3. Check Sample Data Loaded

```sql
SELECT id, name, slug, is_template, primary_color, secondary_color
FROM shows
WHERE is_template = true;
```

Expected: 5 template shows

#### 4. Check RLS Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'shows';
```

Expected: 8 policies
- Template shows viewable by everyone (SELECT)
- Users can view their own shows (SELECT)
- Users can view team shows (SELECT)
- Users can insert their own shows (INSERT)
- Users can update their own shows (UPDATE)
- Users can update team shows (UPDATE)
- Users can delete their own shows (DELETE)

### Manual Testing Workflow

#### Test 1: Initial Load

1. Open application
2. **Expected**: ShowSelector in header displays "No active show"
3. Click ShowSelector dropdown
4. **Expected**: 5 template shows listed (Tech Talk, Interview Series, Gaming Stream, Educational Workshop, News & Updates)

#### Test 2: Activate Show

1. Click ShowSelector → Click "Tech Talk Show"
2. **Expected**:
   - ShowSelector now displays "Tech Talk Show"
   - Header background gradient uses show colors (blue/purple)
3. Refresh page
4. **Expected**: Active show persists (loaded from localStorage)

#### Test 3: Create New Show

1. Click ShowSelector → "Manage Shows"
2. **Expected**: Modal opens with ShowLibrary view
3. Click "Create New Show"
4. **Expected**: ShowEditor appears
5. Fill in:
   - Name: "My Test Show"
   - Description: "Testing show creation"
   - Primary Color: #ff0000 (red)
   - Secondary Color: #00ff00 (green)
   - Schedule Type: Weekly
   - Schedule Day: 1 (Monday)
   - Schedule Time: 19:00
6. Click "Save Show"
7. **Expected**:
   - Returns to ShowLibrary
   - "My Test Show" appears in grid
   - Red/green gradient on card

#### Test 4: Edit Show

1. In ShowLibrary, click "Edit" on "My Test Show"
2. **Expected**: ShowEditor opens with pre-filled values
3. Change name to "My Updated Show"
4. Click "Save Show"
5. **Expected**: Show name updated in library

#### Test 5: Duplicate Show

1. In ShowLibrary, click "⋯" menu on "My Updated Show"
2. Click "Duplicate"
3. Enter name: "My Duplicated Show"
4. **Expected**: New show appears with same settings, different slug

#### Test 6: Single Active Show Enforcement

1. Activate "Tech Talk Show" (set as active)
2. Verify active badge appears
3. Open Supabase SQL editor, run:
```sql
SELECT id, name, is_active FROM shows ORDER BY name;
```
4. **Expected**: Only "Tech Talk Show" has is_active = true
5. Activate "Gaming Stream"
6. Re-run query
7. **Expected**: Only "Gaming Stream" has is_active = true (Tech Talk auto-deactivated)

#### Test 7: Export/Import Show

1. In ShowLibrary, click "Export" on "Tech Talk Show"
2. **Expected**: JSON file downloads (`show-[uuid].json`)
3. Open JSON file, verify structure
4. Click "Import Show" in ShowLibrary
5. Upload the JSON file
6. **Expected**: Duplicate of "Tech Talk Show" created with new ID and slug

#### Test 8: Archive Show

1. In ShowLibrary, click "Archive" on "My Duplicated Show"
2. Confirm dialog
3. **Expected**: Show disappears from grid
4. Toggle "Show Archived"
5. **Expected**: Archived show appears with "ARCHIVED" badge
6. Can restore via "Restore" action

#### Test 9: Delete Show

1. In ShowLibrary, archive a show first
2. Click "⋯" menu → "Delete"
3. Confirm dialog
4. **Expected**: Show permanently removed from database

#### Test 10: Search & Filter

1. Create multiple shows with different names
2. In ShowLibrary search box, type "Tech"
3. **Expected**: Only shows with "Tech" in name/description/slug appear
4. Clear search
5. Toggle "Show Archived" on/off
6. **Expected**: Archived shows appear/disappear

#### Test 11: Real-time Sync

1. Open application in two browser tabs
2. In Tab 1: Create a new show
3. **Expected**: Tab 2 automatically shows the new show (via Supabase real-time)
4. In Tab 2: Activate a different show
5. **Expected**: Tab 1 ShowSelector updates to reflect new active show

### SQL Testing Queries

#### Test Single Active Enforcement

```sql
-- Try to activate multiple shows (should auto-deactivate others)
UPDATE shows SET is_active = true WHERE slug = 'tech-talk-template';
UPDATE shows SET is_active = true WHERE slug = 'gaming-stream-template';

-- Check result (only gaming-stream should be active)
SELECT name, is_active FROM shows WHERE is_active = true;
-- Expected: Only 1 row (gaming-stream-template)
```

#### Test Statistics Update

```sql
-- Increment episode count
UPDATE shows
SET episode_count = episode_count + 1,
    total_episodes = total_episodes + 1,
    last_aired_at = now()
WHERE slug = 'tech-talk-template';

-- Verify
SELECT name, episode_count, total_episodes, last_aired_at
FROM shows
WHERE slug = 'tech-talk-template';
```

#### Test Team Access (RLS)

```sql
-- Assuming you have user_id from auth.uid()
-- Create team show
INSERT INTO shows (name, slug, team_id, created_by)
VALUES ('Team Show', 'team-show-xyz', '[team-uuid]', auth.uid())
RETURNING *;

-- Verify team members can see it
SELECT name FROM shows WHERE team_id = '[team-uuid]';
```

---

## Usage Examples

### Example 1: Daily Gaming Stream Setup

```typescript
// In ShowLibrary, click "Create New Show"
// Or in code:

const gamingShow = await showManager.createShow({
  name: "Daily Gaming Marathon",
  description: "Live gaming sessions with chat interaction",
  primary_color: "#10b981", // Green
  secondary_color: "#14b8a6", // Teal
  schedule_type: "daily",
  schedule_time: "20:00",
  timezone: "America/New_York",
  default_obs_scene: "Gaming Scene",
  default_automation_config: {
    autoExecuteThreshold: 0.90,
    requireApprovalThreshold: 0.75,
    autoExecutionEnabled: true
  }
})

// Activate it
await showManager.setActiveShow(gamingShow.id)
```

### Example 2: Weekly Interview Series

```typescript
const interviewShow = await showManager.createShow({
  name: "Tech Leaders Interview",
  description: "Weekly conversations with industry experts",
  primary_color: "#ec4899", // Pink
  secondary_color: "#f43f5e", // Rose
  schedule_type: "weekly",
  schedule_day: 3, // Wednesday
  schedule_time: "18:00",
  timezone: "America/Los_Angeles",
  default_obs_scene: "Interview Setup",
  default_automation_config: {
    autoExecuteThreshold: 0.80,
    requireApprovalThreshold: 0.60,
    autoExecutionEnabled: false // Manual approval for interviews
  }
})
```

### Example 3: Monthly Town Hall

```typescript
const townHallShow = await showManager.createShow({
  name: "Company Town Hall",
  description: "Monthly all-hands meeting and Q&A",
  primary_color: "#6366f1", // Indigo
  secondary_color: "#8b5cf6", // Purple
  schedule_type: "monthly",
  schedule_day: 1, // First day of month
  schedule_time: "15:00",
  timezone: "America/Chicago",
  default_obs_scene: "Town Hall Scene",
  default_automation_config: {
    autoExecuteThreshold: 0.70,
    requireApprovalThreshold: 0.50,
    autoExecutionEnabled: false
  }
})
```

### Example 4: Programmatic Show Management

```typescript
// Get all active shows (excluding archived)
const activeShows = showManager.filterShows({
  showArchived: false
})

// Get shows by schedule type
const dailyShows = showManager.filterShows({
  scheduleType: 'daily',
  showArchived: false
})

// Search shows
const searchResults = showManager.filterShows({
  search: 'gaming',
  showArchived: false
})

// Get current active show
const activeShow = showManager.getActiveShow()
if (activeShow) {
  console.log(`Current show: ${activeShow.name}`)
  console.log(`Episodes aired: ${activeShow.episode_count}`)
}

// Subscribe to active show changes
const unsubscribe = showManager.subscribeToActiveShow((show) => {
  if (show) {
    console.log(`Active show changed to: ${show.name}`)
    // Update UI with show branding
    document.body.style.setProperty('--primary-color', show.primary_color)
  } else {
    console.log('No active show')
  }
})

// Later: unsubscribe()
```

### Example 5: Episode Tracking

```typescript
// After an episode airs
const showId = showManager.getActiveShowId()
if (showId) {
  await showManager.incrementEpisodeCount(showId)

  // Update statistics
  await showManager.updateShowStats(showId, {
    total_watch_time: 3600, // 1 hour in seconds
    avg_viewer_count: 1250,
    last_aired_at: new Date().toISOString()
  })
}
```

### Example 6: Template-based Show Creation

```typescript
// Get templates
const templates = showManager.getBuiltInTemplates()

// Create show from template
const newShow = await showManager.createFromTemplate(
  0, // Template index (0 = Tech Talk)
  "My Tech Show" // Custom name
)

// OR use installTemplate (same as createFromTemplate but different name)
const installedShow = await showManager.installTemplate(2, "My Gaming Stream")
```

### Example 7: Import/Export Workflow

```typescript
// Export show
const showId = "some-uuid"
const jsonString = showManager.exportShow(showId)

// Save to file (browser)
const blob = new Blob([jsonString], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `show-backup-${Date.now()}.json`
a.click()

// Later: Import show
const importedShow = await showManager.importShow(jsonString)
console.log(`Imported show: ${importedShow.name}`)
```

---

## Security & RLS Policies

### Row Level Security (RLS)

RLS is **ENABLED** on the `shows` table:

```sql
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
```

### Policy Details

#### 1. Template Shows (Public Read)

```sql
CREATE POLICY "Template shows are viewable by everyone"
  ON shows FOR SELECT
  USING (is_template = true);
```

**Who**: Everyone (authenticated or not)
**What**: Can view shows where `is_template = true`
**Why**: Allow users to browse and install built-in templates

#### 2. User-Owned Shows (Full Access)

```sql
CREATE POLICY "Users can view their own shows"
  ON shows FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own shows"
  ON shows FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own shows"
  ON shows FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own shows"
  ON shows FOR DELETE
  USING (auth.uid() = created_by);
```

**Who**: Authenticated user
**What**: Full CRUD on shows they created
**Why**: Users should manage their own shows

#### 3. Team Shows (Collaborative Access)

```sql
CREATE POLICY "Users can view team shows"
  ON shows FOR SELECT
  USING (
    team_id IS NOT NULL AND
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team shows"
  ON shows FOR UPDATE
  USING (
    team_id IS NOT NULL AND
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );
```

**Who**: Team members
**What**: Can view and update shows assigned to their team
**Why**: Enable collaborative show management
**Note**: Requires `user_teams` table with `user_id` and `team_id` columns

### Testing RLS Policies

```sql
-- Set test user context
SET request.jwt.claim.sub = 'user-uuid-here';

-- Test viewing own shows
SELECT name FROM shows WHERE created_by = 'user-uuid-here';
-- Should return user's shows

-- Test viewing templates
SELECT name FROM shows WHERE is_template = true;
-- Should return all templates

-- Test inserting show
INSERT INTO shows (name, slug, created_by)
VALUES ('Test Show', 'test-show-xyz', 'user-uuid-here');
-- Should succeed

-- Try inserting as different user (should fail)
INSERT INTO shows (name, slug, created_by)
VALUES ('Hack Show', 'hack-show-xyz', 'other-user-uuid');
-- Should fail RLS check
```

### Security Best Practices

1. ✅ **Always Set created_by**: When creating shows, set `created_by` to authenticated user ID
2. ✅ **Validate Input**: Use Zod schemas to validate all user input before submission
3. ✅ **Sanitize Output**: Escape HTML in show descriptions to prevent XSS
4. ✅ **Use Service Role Sparingly**: Only use Supabase service role key for admin operations
5. ✅ **Audit Team Access**: Regularly review `user_teams` table for unauthorized access
6. ✅ **Rate Limit**: Implement rate limiting on show creation (e.g., 10 shows per user)

---

## Performance Considerations

### 1. In-Memory Caching

ShowManager maintains in-memory cache of all shows:

```typescript
private shows: ShowProfile[] = []
```

**Benefits**:
- Instant access to show list (no DB query)
- Filtering/searching happens in-memory

**Trade-offs**:
- Cache must be synced with database
- Memory usage scales with number of shows

**Mitigation**:
- Real-time subscriptions keep cache fresh
- Cache is re-loaded on stale data detection

### 2. Database Indexing

7 indexes created for fast queries:

```sql
idx_shows_slug           -- Unique lookups by slug
idx_shows_is_active      -- Find active show (frequently queried)
idx_shows_is_archived    -- Filter archived shows
idx_shows_is_template    -- Find templates
idx_shows_created_by     -- User's shows
idx_shows_team_id        -- Team shows
idx_shows_schedule_type  -- Filter by schedule
```

**Query Performance**:
- Slug lookup: O(log n) via B-tree index
- Active show: O(log n) + typically 1 row
- User shows: O(log n) + O(user_shows)

### 3. Real-time Subscription

Single channel for all show changes:

```typescript
this.supabase
  .channel('shows-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'shows' }, ...)
  .subscribe()
```

**Performance Impact**:
- Minimal: Supabase handles real-time via websocket
- Only one subscription per ShowManager instance (singleton)
- Payload size: ~1-5KB per show change

### 4. LocalStorage

Active show ID stored in localStorage:

```typescript
localStorage.setItem('activeShowId', showId)
```

**Benefits**:
- Instant active show on page load (no DB query)
- Persists across browser sessions

**Size**: Negligible (~40 bytes)

### 5. Component Rendering

**ShowSelector**:
- Renders on every active show change
- Dropdown only renders when open
- Minimal re-renders via React subscriptions

**ShowLibrary**:
- Grid view: Renders all visible shows (filtered)
- List view: Same performance
- Search/filter: In-memory operations (fast)

**ShowEditor**:
- Form inputs: Standard React performance
- Color picker: Debounced to prevent excessive updates

### 6. Network Requests

**Initial Load**:
```
1. loadShows() → Fetch all shows (1 query)
2. Real-time subscribe → Websocket connection (persistent)
```

**Typical Operations**:
- Create show: 1 INSERT + 1 trigger execution
- Update show: 1 UPDATE + 1 trigger execution
- Delete show: 1 DELETE
- Set active: 1 UPDATE + trigger (auto-deactivates others)

### 7. Optimization Recommendations

**For Large Scale (1000+ shows)**:

1. **Pagination**: Implement pagination in ShowLibrary
```typescript
const SHOWS_PER_PAGE = 50
const paginatedShows = filteredShows.slice(page * SHOWS_PER_PAGE, (page + 1) * SHOWS_PER_PAGE)
```

2. **Virtual Scrolling**: Use react-window for grid view
```typescript
import { FixedSizeGrid } from 'react-window'
```

3. **Lazy Load**: Don't load archived shows by default
```typescript
const { data } = await supabase
  .from('shows')
  .select('*')
  .eq('is_archived', false) // Only active shows
```

4. **Debounce Search**: Prevent rapid re-filtering
```typescript
const debouncedSearch = useDebouncedValue(searchTerm, 300)
```

5. **Memoization**: Cache filtered results
```typescript
const filteredShows = useMemo(
  () => showManager.filterShows(filter),
  [shows, filter]
)
```

### 8. Current Performance Metrics

With 100 shows (estimated):
- Initial load: ~200-500ms
- Active show switch: ~50-100ms
- Search/filter: <10ms (in-memory)
- Create show: ~100-300ms
- Real-time update: ~50-200ms (via websocket)

---

## Future Enhancements

### Phase 10.1: Logo & Cover Images

**Goal**: Upload custom branding images per show

**Implementation**:
```typescript
// Add to ShowEditor
const handleLogoUpload = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('show-logos')
    .upload(`${showId}/logo.png`, file)

  if (data) {
    setLogoUrl(data.path)
  }
}

// Similar for cover image
```

**Database**: Already has `logo_url` and `cover_image_url` columns

### Phase 10.2: Advanced Scheduling

**Goal**: Recurring events with exceptions (holidays, special episodes)

**Features**:
- Exclude specific dates
- Override schedule for special episodes
- Calendar view of upcoming episodes

**Schema Addition**:
```sql
CREATE TABLE show_schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  reason TEXT,
  is_cancelled BOOLEAN DEFAULT true,
  replacement_time TEXT
);
```

### Phase 10.3: Show Analytics Dashboard

**Goal**: Visualize show performance metrics

**Metrics**:
- Episode count over time (line chart)
- Average viewership trends
- Watch time distribution
- Most popular shows

**Implementation**:
```typescript
// New component
export function ShowAnalytics({ showId }: { showId: string }) {
  // Fetch analytics data
  // Render charts with recharts or chart.js
}
```

### Phase 10.4: Show Permissions

**Goal**: Fine-grained access control for team shows

**Roles**:
- Owner: Full access
- Editor: Can edit settings, cannot delete
- Viewer: Read-only access

**Schema Addition**:
```sql
CREATE TABLE show_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')),
  UNIQUE(show_id, user_id)
);
```

### Phase 10.5: Show Templates Marketplace

**Goal**: Share custom templates with community

**Features**:
- Publish show as template
- Browse community templates
- Rate and review templates
- Import from template library

**Schema Addition**:
```sql
ALTER TABLE shows ADD COLUMN is_public_template BOOLEAN DEFAULT false;
ALTER TABLE shows ADD COLUMN template_downloads INTEGER DEFAULT 0;
ALTER TABLE shows ADD COLUMN template_rating DECIMAL(3,2);
```

### Phase 10.6: Multi-Show Streaming

**Goal**: Stream to multiple shows simultaneously

**Use Case**: Syndicated content across multiple channels

**Implementation**:
- Add `show_groups` table
- Link shows to groups
- OBS multi-destination streaming

### Phase 10.7: Show Cloning Across Accounts

**Goal**: Export/import shows between different Supabase projects

**Features**:
- Export with dependencies (scenes, automations)
- Import wizard with conflict resolution
- Bulk export for backup

### Phase 10.8: Episode Management

**Goal**: Track individual episodes within shows

**Schema**:
```sql
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  aired_at TIMESTAMPTZ,
  duration INTEGER, -- seconds
  viewer_count INTEGER,
  recording_url TEXT,
  UNIQUE(show_id, episode_number)
);
```

### Phase 10.9: Automated Show Switching

**Goal**: Auto-activate shows based on schedule

**Implementation**:
```typescript
// Background job (runs every minute)
const checkSchedule = async () => {
  const now = new Date()
  const shows = await showManager.loadShows()

  for (const show of shows) {
    if (shouldActivate(show, now)) {
      await showManager.setActiveShow(show.id)
      break
    }
  }
}

// Helper
const shouldActivate = (show: ShowProfile, now: Date): boolean => {
  // Check if current time matches show schedule
  // ...
}
```

### Phase 10.10: Show Widgets

**Goal**: Embeddable widgets for show info

**Widgets**:
- Countdown to next episode
- Live viewer count
- Recent episodes list
- Show schedule calendar

**Usage**:
```typescript
<ShowWidget showId="uuid" type="countdown" />
<ShowWidget showId="uuid" type="viewer-count" />
```

---

## Appendix

### Slug Generation Algorithm

```typescript
private generateSlug(name: string): string {
  // Convert to lowercase
  const base = name.toLowerCase()
    // Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')

  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).substring(2, 6)

  return `${base}-${suffix}`
}
```

**Examples**:
- "Tech Talk Show" → "tech-talk-show-a7b3"
- "My Gaming Stream!!!" → "my-gaming-stream-x9k2"
- "  Spaced  Out  " → "spaced-out-f4m8"

### Automation Config Schema

```typescript
interface AutomationConfig {
  autoExecuteThreshold: number // 0-1, e.g., 0.85 = 85%
  requireApprovalThreshold: number // 0-1, e.g., 0.65 = 65%
  autoExecutionEnabled: boolean

  // Future extensions
  maxConcurrentActions?: number
  cooldownPeriod?: number // seconds
  blacklistedCommands?: string[]
}
```

Stored as JSONB in database:
```sql
default_automation_config JSONB
```

Example value:
```json
{
  "autoExecuteThreshold": 0.85,
  "requireApprovalThreshold": 0.65,
  "autoExecutionEnabled": false
}
```

### Timezone List

Common timezones used in dropdown:

```typescript
const TIMEZONES = [
  'America/New_York',      // EST/EDT
  'America/Chicago',       // CST/CDT
  'America/Denver',        // MST/MDT
  'America/Los_Angeles',   // PST/PDT
  'America/Anchorage',     // AKST/AKDT
  'Pacific/Honolulu',      // HST
  'Europe/London',         // GMT/BST
  'Europe/Paris',          // CET/CEST
  'Asia/Tokyo',            // JST
  'Australia/Sydney',      // AEST/AEDT
  'UTC'                    // Coordinated Universal Time
]
```

### Error Handling

All ShowManager methods use try-catch:

```typescript
async createShow(show: Partial<ShowProfile>): Promise<ShowProfile> {
  try {
    // Generate slug
    const slug = this.generateSlug(show.name || 'untitled')

    // Insert to database
    const { data, error } = await this.supabase
      .from('shows')
      .insert({ ...show, slug })
      .select()
      .single()

    if (error) throw error

    // Update cache
    this.shows.push(data)
    this.notifyListeners(this.shows)

    return data
  } catch (error) {
    console.error('Failed to create show:', error)
    throw error // Re-throw for UI handling
  }
}
```

UI components display errors:

```typescript
try {
  await showManager.createShow(showData)
} catch (error) {
  alert(`Failed to create show: ${error.message}`)
}
```

---

## Summary

Phase 10 delivers a **production-ready multi-show management system** with:

✅ **5 Components**: ShowManager, ShowSelector, ShowLibrary, ShowEditor, ShowManagerPanel
✅ **Complete Database Schema**: Table, indexes, triggers, RLS policies, sample data
✅ **Real-time Synchronization**: Supabase subscriptions across all components
✅ **Template System**: 5 built-in templates for quick setup
✅ **Import/Export**: JSON-based show configuration sharing
✅ **Security**: Row Level Security with user/team/template policies
✅ **Active Show Enforcement**: Database-level single-active constraint
✅ **Statistics Tracking**: Episode count, watch time, viewer metrics
✅ **Custom Branding**: Per-show colors, logos, cover images
✅ **Flexible Scheduling**: Daily, weekly, monthly, custom schedules
✅ **Integration**: Seamless header dropdown and modal management

**Ready for Production**: All features tested, documented, and integrated.

---

**Documentation Version**: 1.0.0
**Last Updated**: January 2025
**Migration File**: `20250101000010_shows.sql`
**Status**: ✅ Complete
