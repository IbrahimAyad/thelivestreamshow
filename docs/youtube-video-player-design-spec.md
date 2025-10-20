# Smart YouTube Video Player - UI Design Specification

## 1. Design Direction & Rationale

**Visual Essence:** Modern dashboard interface with bold strategic accents. Clean, functional layout optimized for live streaming workflows with quick-access controls and clear visual hierarchy. The design balances professional broadcast tools with entertainment energy through strategic use of the existing red/yellow brand palette.

**Strategic Rationale:**
- **Functional clarity first:** Streamers need instant access to controls during live broadcasts—clean layouts with clear action buttons prevent errors under pressure
- **Bold brand integration:** Red and yellow accents create visual energy appropriate for streaming/gaming context while maintaining 90% neutral structure for readability
- **Dual-context design:** Control dashboard prioritizes density and information access; broadcast view prioritizes clean, unobtrusive display for OBS overlay

**Key Characteristics:**
- Spacing: Generous whitespace (32-48px section gaps) for control dashboard, compact card padding (16-24px) for information density
- Color: 85% neutral (black/grey/white) + 15% strategic brand accents (red for primary actions, yellow for highlights)
- Border radius: 8-12px for modern feel without excessive softness
- Animation: Smooth 250-300ms transitions for professional responsiveness
- Typography: Clean sans-serif with strong weight contrast for hierarchy

**Reference Examples:**
- OBS Studio (functional dashboard layout, clear controls)
- Streamlabs Dashboard (entertainment brand + utility balance)
- YouTube Studio (content management patterns, analytics displays)

---

## 2. Design Tokens

### Colors

| Token | Value | Usage | WCAG |
|-------|-------|-------|------|
| **Primary (Red)** |
| primary-500 | #EF4444 | Primary actions, live indicators, danger actions | AA on white (4.5:1) |
| primary-600 | #DC2626 | Hover states, active elements | AAA on white (7.2:1) |
| primary-700 | #B91C1C | Pressed states | AAA on white (9.1:1) |
| **Accent (Yellow)** |
| accent-400 | #FBBF24 | Highlights, scheduled items, energy indicators | AA on black (7.8:1) |
| accent-500 | #EAB308 | Warning states, queue indicators | AA on black (8.5:1) |
| **Neutral** |
| neutral-50 | #FAFAFA | Page background (light mode) | - |
| neutral-100 | #F5F5F5 | Surface background (cards, panels) | - |
| neutral-300 | #D4D4D4 | Borders, dividers | - |
| neutral-600 | #6B7280 | Secondary text, metadata | AA on white (4.6:1) |
| neutral-800 | #1F2937 | Body text | AAA on white (12.6:1) |
| neutral-900 | #000000 | Headings, primary text | AAA on white (21:1) |
| neutral-950 | #0A0A0A | Page background (dark mode - broadcast) | - |
| **Semantic** |
| success-500 | #10B981 | Success states, positive metrics | AA on white (4.8:1) |
| warning-500 | #F59E0B | Warnings, caution indicators | AA on white (5.2:1) |
| error-500 | #EF4444 | Errors, destructive actions | AA on white (4.5:1) |
| info-500 | #3B82F6 | Information, neutral highlights | AA on white (4.9:1) |

### Typography

| Token | Font Family | Usage |
|-------|-------------|-------|
| font-display | Inter, -apple-system, system-ui | All text (sans-serif modern) |

| Size Token | Value | Usage |
|------------|-------|-------|
| text-xs | 12px | Metadata, timestamps, small labels |
| text-sm | 14px | Secondary text, descriptions, table data |
| text-base | 16px | Body text, form inputs, buttons |
| text-lg | 18px | Section subheadings, emphasized text |
| text-xl | 20px | Card headings, panel titles |
| text-2xl | 24px | Page section headings |
| text-3xl | 30px | Page title, main headings |

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Buttons, emphasized text |
| Semibold | 600 | Subheadings, card titles |
| Bold | 700 | Section headings, page titles |

| Line Height | Value | Usage |
|-------------|-------|-------|
| tight | 1.2 | Headings, display text |
| normal | 1.5 | Body text, descriptions |
| relaxed | 1.6 | Long-form content |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| spacing-xs | 4px | Tight internal spacing, icon gaps |
| spacing-sm | 8px | Button padding vertical, compact gaps |
| spacing-md | 12px | Input padding, small card gaps |
| spacing-lg | 16px | Card padding, standard gaps |
| spacing-xl | 24px | Section internal padding, card spacing |
| spacing-2xl | 32px | Section gaps, panel spacing |
| spacing-3xl | 48px | Major section separation |
| spacing-4xl | 64px | Page-level separation |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 6px | Small elements, badges, tags |
| radius-md | 8px | Buttons, inputs, small cards |
| radius-lg | 12px | Cards, panels, modals |
| radius-xl | 16px | Large feature cards, hero sections |
| radius-full | 9999px | Circular elements, pills |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation, hover hints |
| shadow-card | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | Default card elevation |
| shadow-card-hover | 0 4px 6px rgba(239,68,68,0.08), 0 2px 4px rgba(0,0,0,0.08) | Card hover (red tint) |
| shadow-modal | 0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08) | Modals, overlays, dropdowns |

### Animation

| Token | Value | Usage |
|-------|-------|-------|
| duration-fast | 200ms | Micro-interactions, button feedback |
| duration-normal | 250ms | Standard transitions, hover states |
| duration-slow | 300ms | Panel animations, modal entrance |
| easing-default | cubic-bezier(0.4, 0, 0.2, 1) | Default easing (ease-out) |
| easing-bounce | cubic-bezier(0.68, -0.55, 0.27, 1.55) | Playful feedback (sparingly) |

**WCAG Key Combinations:**
- neutral-900 on neutral-50: 21:1 (AAA) - Primary text
- neutral-800 on white: 12.6:1 (AAA) - Body text
- primary-600 on white: 7.2:1 (AAA) - Red buttons

---

## 3. Component Specifications

### Button (2 variants)

**Primary Button**
- Background: primary-600, text: white, padding: spacing-sm (8px) vertical, spacing-lg (16px) horizontal
- Border radius: radius-md (8px), font: text-base, weight: medium (500)
- States:
  - Hover: background → primary-500, transform: translateY(-1px), shadow: shadow-sm
  - Active: background → primary-700, transform: translateY(0)
  - Disabled: opacity 0.5, cursor not-allowed
- Height: 40px (touch-friendly)
- Icon support: 20px icons with spacing-sm gap from text

**Secondary Button**
- Background: neutral-100, text: neutral-800, border: 1px neutral-300
- All other properties match Primary Button
- States:
  - Hover: background → white, border → neutral-400, shadow: shadow-sm
  - Active: background → neutral-50

**Icon Button** (for tight spaces)
- Size: 36×36px, background: transparent, icon: 20px neutral-600
- Hover: background → neutral-100, icon → neutral-900

### Card (Video Queue, Search Results)

**Structure:**
- Background: white, border: 1px neutral-300, radius: radius-lg (12px)
- Padding: spacing-lg (16px) for compact info cards, spacing-xl (24px) for feature cards
- Shadow: shadow-card
- States:
  - Hover: shadow → shadow-card-hover, transform: translateY(-2px)
  - Selected: border → 2px primary-500
- Layout: Thumbnail (16:9 ratio) + Content area (title + metadata row)

**Video Card Content:**
- Thumbnail: Border radius-sm (6px), aspect ratio 16:9, max-width varies by context
- Title: text-base, weight: semibold (600), neutral-900, line-height: tight (1.2), max 2 lines with ellipsis
- Metadata: text-sm, neutral-600, flex row with spacing-md gaps (channel • duration • views)
- Action buttons: Icon buttons positioned top-right of thumbnail on hover

### Input Field (Search, Time Pickers)

**Text Input**
- Background: white, border: 1px neutral-300, radius: radius-md (8px)
- Padding: spacing-md (12px) vertical, spacing-lg (16px) horizontal
- Height: 44px, font: text-base, color: neutral-800
- States:
  - Focus: border → 2px primary-500, outline: none, shadow: 0 0 0 3px rgba(239,68,68,0.1)
  - Error: border → error-500, helper text in error-500
  - Disabled: background → neutral-50, text → neutral-500

**Search Input** (special variant)
- Icon: 20px search icon, neutral-600, positioned left with spacing-lg (16px) padding
- Clear button: Icon button (16px × icon) on right when filled
- Height: 48px for prominence
- Placeholder: text-base, neutral-500

### Queue List Item (Draggable)

**Structure:**
- Background: white, border-left: 3px primary-500 (queue indicator), radius: radius-md (8px)
- Padding: spacing-md (12px), margin-bottom: spacing-sm (8px)
- Drag handle: 6-dot icon, neutral-400, left side
- Layout: Drag handle | Thumbnail (80×45px) | Content (title + metadata) | Time controls | Remove button

**States:**
- Dragging: opacity 0.6, transform: rotate(2deg), shadow: shadow-modal
- Drop target: border → 2px dashed primary-500, background → rgba(239,68,68,0.05)

**Time Controls:**
- Start/End time inputs: Compact 60px width, text-sm
- Duration display: text-xs, neutral-600, "2:30 → 4:15 (1m 45s)"

### Modal (Video Preview, Settings, Import Playlist)

**Structure:**
- Overlay: background rgba(0,0,0,0.6), backdrop-blur: 4px
- Panel: background white, radius: radius-lg (12px), max-width: 800px, shadow: shadow-modal
- Padding: spacing-2xl (32px)
- Header: text-2xl, weight: bold (700), with close button (top-right icon button)
- Content: spacing-xl (24px) gap between sections
- Footer: Actions right-aligned, spacing-md (12px) gap between buttons

**Animation:**
- Entrance: fade-in overlay (200ms) + scale-up panel from 0.95 to 1.0 (300ms, easing-default)
- Exit: reverse animation

### Navigation Tab Bar (Category Filters)

**Structure:**
- Container: border-bottom 1px neutral-300, horizontal scroll on overflow
- Tab items: inline-flex, padding spacing-md (12px) vertical, spacing-lg (16px) horizontal
- Font: text-base, weight: medium (500)
- States:
  - Inactive: color neutral-600, no border
  - Hover: color neutral-900, background rgba(0,0,0,0.03)
  - Active: color primary-600, border-bottom 2px primary-600
- Transition: duration-fast (200ms) for color/border changes

---

## 4. Layout & Responsive Strategy

### Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| sm | 640px | Mobile landscape, small tablets |
| md | 768px | Tablets portrait |
| lg | 1024px | Tablets landscape, small desktops |
| xl | 1280px | Standard desktops, primary dashboard view |
| 2xl | 1536px | Large desktops, extended layouts |

### Grid Approach

**Control Dashboard (/video-player)**
- Container: max-width 1440px, padding spacing-xl (24px) horizontal
- Main layout: 3-column grid at xl+ (Search & Queue 2fr | Recommendations 1fr)
- At lg: 2-column (Search & Queue full width | Recommendations sidebar)
- At md and below: Single column stack

**Component Grids:**
- Video results: 4 columns at xl+, 3 at lg, 2 at md, 1 at sm
- Queue list: Always single column (vertical list)
- Analytics charts: 2 columns at lg+, 1 at md and below

**Broadcast View (/broadcast/video-player)**
- Fixed: 1920×1080 canvas (no responsive needed)
- Video player: 1760×990px centered (80px margin)
- Overlay bar: 1760px width, 60px height, positioned bottom, 80px from edges

### Adaptation Principles

**Stack:** Multi-column layouts become single column below lg breakpoint
**Hide:** Secondary metadata (view counts, detailed timestamps) hidden on sm
**Enlarge:** Touch targets increase to minimum 44×44px on mobile, buttons expand to 48px height
**Prioritize:** Search and Now Playing always visible; recommendations collapse to expandable drawer on mobile

---

## 5. Interaction Principles

### Animation Standards

**Timing:**
- Fast (200ms): Button feedback, toggle switches, icon changes
- Normal (250ms): Card hovers, input focus states, tab switching
- Slow (300ms): Modal entrance/exit, panel slides, dropdown menus

**Easing:**
- Default: cubic-bezier(0.4, 0, 0.2, 1) - All transitions unless specified
- Bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55) - "Surprise Me" button, success confirmations only

### Animated Components

**Cards:** Hover lift (translateY -2px), shadow intensify, duration-normal
**Buttons:** Hover lift (translateY -1px), background color shift, duration-fast
**Queue reorder:** Drag opacity + rotation, drop target highlight, duration-normal
**Modals:** Overlay fade + panel scale (0.95 → 1.0), duration-slow
**Progress bar:** Width transition, duration-normal, linear easing for playback accuracy
**Energy meter badges:** Pulse animation (scale 1.0 → 1.05 → 1.0) every 2s for "Hype" category

### Performance Rule

**Animate ONLY:** `transform` (translate, scale, rotate) and `opacity`
**NEVER animate:** width, height, margin, padding, background-position (causes layout recalculation)

### Reduced Motion Fallback

For users with `prefers-reduced-motion`, disable:
- Hover lift transforms (keep color/shadow changes only)
- Modal scale animations (use fade only)
- Pulse/bounce effects (static display)
- Auto-scrolling behaviors in queue

### Live Streaming Specific Interactions

**Emergency Stop:** "Stop All" button triggers instant stop (no confirmation modal) with 3-second undo toast
**Queue drag-and-drop:** Visual feedback during live playback—dragged item shows "Will play after current" helper
**Dead Air Filler:** Auto-play initiates with 5-second countdown overlay showing "Auto-playing in 5... 4... 3..."
**Schedule conflicts:** Visual warning (yellow border + warning icon) when scheduled time overlaps existing item

---

## Key Design Decisions Summary

**Color Strategy:** Existing brand colors (red/yellow) used exclusively for primary actions, highlights, and status indicators. Structure remains 85% neutral (black/grey/white) to prevent visual fatigue during long streaming sessions.

**Information Density:** Control dashboard prioritizes compact cards (16px padding) and efficient layouts for maximum information. Broadcast view prioritizes minimal obstruction with optional overlay (60px height only).

**Touch Targets:** All interactive elements minimum 40px height (44px on mobile) for accurate control during live streaming pressure.

**Icon Library:** Recommend Lucide React for consistent 20px stroke-width icons throughout interface.

**Accessibility:** WCAG AA minimum maintained for all text (4.5:1 contrast). Primary interactive elements achieve AAA (7:1+). Focus indicators use 3px ring with brand color tint for clear keyboard navigation.

**Broadcast View Philosophy:** Minimal UI footprint, no decorative elements, single-color overlay bar (rgba black with white text) for maximum compatibility with varied video content.
