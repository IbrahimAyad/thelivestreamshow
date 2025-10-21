# Livestream Control Dashboard - UI Design Specification

## 1. Design Direction & Rationale

**Visual Essence:** Dark-mode functional dashboard optimized for extended monitoring sessions with high-contrast data visualization and immediate access to critical controls.

**Strategic Rationale:**
1. **Dark Theme Standard** - Streaming professionals work in low-light environments during long sessions; dark interfaces reduce eye strain and match industry expectations (OBS Studio, Streamlabs, StreamElements all use dark themes)
2. **Information Density Priority** - Multiple data streams require compact, scannable layouts that fit on one screen without scrolling; every pixel serves a functional purpose
3. **Emergency-First Hierarchy** - Critical controls (Emergency section) use high-contrast red accent for instant recognition during crisis moments

**Key Characteristics:**
- **Color Strategy**: 90% dark neutrals (black backgrounds) with strategic red (#EF4444) for alerts/emergency, yellow (#EAB308) for status indicators, white text for maximum contrast
- **Spacing**: Compact efficiency (12-16px gaps between panels, 16-20px internal padding) to maximize screen real estate
- **Layout**: Grid-based dashboard with fixed panels - no hero sections or generous whitespace
- **Animation**: Minimal (150-200ms) - fast transitions for real-time data updates without distraction

**Reference Examples:**
- Streamlabs OBS Dashboard (dark theme, multi-panel layout)
- Grafana Dashboards (data visualization, real-time updates)
- OBS Studio interface (functional controls, compact design)

---

## 2. Design Tokens

### Color Palette

| Token Name | Value | Usage | WCAG Contrast |
|------------|-------|-------|---------------|
| **Primary Red** | #EF4444 | Emergency controls, alerts, live indicators | 4.5:1 on black |
| **Accent Yellow** | #EAB308 | Status badges, highlights, attention | 8.2:1 on black |
| **Neutral Black** | #000000 | Primary background | Base |
| **Neutral Dark** | #1A1A1A | Panel backgrounds (elevated surface) | - |
| **Neutral Grey** | #6B7280 | Secondary text, borders, dividers | 4.6:1 on black |
| **Neutral White** | #FFFFFF | Primary text, headings | 21:1 on black |
| **Success Green** | #10B981 | Positive metrics, online status | 5.8:1 on black |
| **Twitch Purple** | #9146FF | Twitch branding | 5.1:1 on black |
| **YouTube Red** | #FF0000 | YouTube branding | 5.3:1 on black |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| **Font Family (Primary)** | Inter, -apple-system, system-ui | All text |
| **Font Family (Monospace)** | 'Roboto Mono', monospace | Stats, numbers, time displays |
| **Size XS** | 11px | Timestamps, metadata |
| **Size SM** | 13px | Secondary text, labels |
| **Size Base** | 15px | Body text, stats |
| **Size LG** | 18px | Panel headings |
| **Size XL** | 24px | Section titles |
| **Size 2XL** | 32px | Emergency button text |
| **Weight Regular** | 400 | Body text |
| **Weight Medium** | 500 | Labels, secondary headings |
| **Weight Semibold** | 600 | Panel headings, stats |
| **Weight Bold** | 700 | Emergency controls, critical info |
| **Line Height Tight** | 1.2 | Headings, compact stats |
| **Line Height Normal** | 1.5 | Body text |

### Spacing (4pt-based)

| Token | Value | Usage |
|-------|-------|-------|
| **XS** | 4px | Tight element spacing |
| **SM** | 8px | Icon-text gaps |
| **MD** | 12px | Component internal padding |
| **LG** | 16px | Panel padding, card spacing |
| **XL** | 20px | Section gaps |
| **2XL** | 24px | Major section dividers |
| **3XL** | 32px | Emergency control padding |

### Border & Effects

| Token | Value | Usage |
|-------|-------|-------|
| **Radius SM** | 4px | Small elements, badges |
| **Radius MD** | 8px | Panels, cards, buttons |
| **Radius LG** | 12px | PiP window, major components |
| **Border Subtle** | 1px solid #2A2A2A | Panel dividers |
| **Border Emphasis** | 2px solid #EF4444 | Emergency section border |
| **Shadow Panel** | 0 2px 8px rgba(0,0,0,0.4) | Elevated panels |
| **Shadow Hover** | 0 4px 12px rgba(239,68,68,0.2) | Interactive element hover |

### Animation

| Token | Value | Usage |
|-------|-------|-------|
| **Duration Fast** | 150ms | Hover states, button clicks |
| **Duration Normal** | 200ms | Panel transitions, data updates |
| **Duration Slow** | 300ms | PiP window resize/drag |
| **Easing** | cubic-bezier(0.4, 0, 0.2, 1) | All transitions |

---

## 3. Component Specifications

### 3.1 Panel Container (Base Component)

**Structure:**
- Dark background (#1A1A1A) with subtle border (1px #2A2A2A)
- 8px border-radius
- 16px internal padding
- 2px top accent stripe (color varies by panel type)

**States:**
- Default: Border #2A2A2A
- Loading: Pulsing top accent stripe (200ms)
- Error: Red border (#EF4444)

**Note:** All dashboard panels inherit this base structure

---

### 3.2 Stat Card

**Structure:**
- Nested within panel container
- Horizontal layout: Icon (24×24px) + Label + Value
- 12px gap between elements
- Platform-specific top accent: Twitch Purple (#9146FF) or YouTube Red (#FF0000)

**Typography:**
- Label: 13px medium weight, #6B7280 color
- Value: 24px monospace semibold, #FFFFFF
- Platform name: 15px semibold, platform brand color

**States:**
- Default: Neutral display
- Increasing: Green upward arrow icon (16px), +200ms fade-in
- Decreasing: Yellow downward arrow icon (16px), +200ms fade-in
- Live: Pulsing red dot (8px) next to status text

**Variants:**
- **Compact**: Vertical stack on narrow screens, 11px/18px font sizes
- **Emphasized**: Larger value (32px) for primary metric (viewer count)

**Icons:** Lucide icons - Users (viewers), MessageCircle (chat), UserPlus (followers), Radio (live status)

---

### 3.3 Emergency Button

**Structure:**
- Full-width or 200px minimum width
- 56px height (large touch target for stress situations)
- 32px horizontal padding, 16px vertical padding
- 8px border-radius
- 2px border

**Colors:**
- Background: #EF4444
- Border: #DC2626 (darker red)
- Text: #FFFFFF, 18px bold
- Hover background: #DC2626
- Active background: #B91C1C

**States:**
- Default: Solid red background
- Hover: Darker red + shadow (0 4px 12px rgba(239,68,68,0.3))
- Active: Press down effect (scale 0.98)
- Disabled: 40% opacity, no pointer events

**Animation:** 150ms all state transitions

**Icon:** Lucide EyeOff icon (24px) for "Hide All Overlays"

---

### 3.4 PiP Window

**Structure:**
- Floating overlay with draggable header bar
- Default size: 480×270px (16:9 aspect ratio)
- 12px border-radius
- 4px border (#2A2A2A)
- Resize handles (8×8px) on all corners

**Header Bar:**
- 36px height
- Dark background (#0A0A0A)
- Drag handle icon (left), title (center), controls (right)
- Controls: Minimize, Maximize, Pop-out (16px icons, 32×32px touch targets)

**Content Area:**
- iframe embed with 100% width/height
- Black background (#000000) for loading state

**States:**
- Dragging: Cursor grab, reduced opacity (0.9)
- Minimized: Collapses to 200×36px header-only bar
- Maximized: Expands to 960×540px centered

**Animation:** 300ms ease-out for resize/position changes (transform only)

---

### 3.5 Dropdown Select (Scene Restore)

**Structure:**
- 180px width minimum
- 40px height
- 12px horizontal padding
- 8px border-radius
- 1px border (#2A2A2A)

**Typography:**
- Selected value: 15px regular, #FFFFFF
- Dropdown options: 14px regular, #FFFFFF
- Placeholder: 15px regular, #6B7280

**States:**
- Default: Dark background (#1A1A1A), grey border
- Hover: Border #EF4444
- Focus: 2px red border (#EF4444), remove outline
- Open: Dropdown menu appears below with 4px shadow

**Dropdown Menu:**
- Same width as trigger
- Max height 240px (scrollable if overflow)
- 8px border-radius
- Background #1A1A1A
- 1px border #2A2A2A

**Option Hover:** Background #2A2A2A

**Icon:** Lucide ChevronDown (16px) aligned right

---

### 3.6 Chart Container

**Structure:**
- Full width of panel
- 240px height
- 16px padding
- Dark background (#0A0A0A)
- 8px border-radius

**Chart Specifications:**
- Line thickness: 2px
- Twitch line: #9146FF
- YouTube line: #FF0000
- Grid lines: #2A2A2A, 1px, 20% opacity
- X-axis labels: 11px, #6B7280, monospace
- Y-axis labels: 11px, #6B7280, monospace

**Time Range Toggle:**
- Horizontal pill buttons (3 options)
- 32px height, 12px horizontal padding
- 4px border-radius per pill
- Active: Red background (#EF4444), white text
- Inactive: Transparent background, grey text (#6B7280)

**Platform Toggle:**
- Checkbox-style toggles with platform colors
- 20×20px checkbox, 4px radius
- Checked: Platform brand color fill
- Label: 13px medium, platform color when active

---

## 4. Layout & Responsive Strategy

### Grid System

**Breakpoints:**
- Desktop (1440px+): 4-column layout
- Small Desktop (1024-1439px): 3-column layout with stacking adjustments

**Main Layout Structure (1440px+):**
```
┌─────────────────────────────────────────────┐
│ Monitor Tab Header (existing)              │
├──────────────────┬──────────────────────────┤
│ PiP Broadcast    │ Dual-Platform Stats      │
│ (col-span 2)     │ (col-span 2)            │
│ 480×270px        │ Twitch | YouTube cards   │
├──────────────────┼──────────────────────────┤
│ Quick Preview    │ Stream History Chart     │
│ (col-span 1)     │ (col-span 3)            │
│ 320px width      │ Full remaining width     │
├──────────────────┴──────────────────────────┤
│ Emergency Controls (full width)             │
│ 2 buttons horizontal: Hide Overlays | Scene │
└─────────────────────────────────────────────┘
```

**Column Gap:** 16px  
**Row Gap:** 16px  
**Container Padding:** 20px

### Responsive Adaptations

**1024-1439px:**
- PiP window scales down to 360×203px
- Stats panel remains 2-column but cards stack vertically within each platform
- Quick Preview moves below stats
- Chart maintains full width
- Emergency controls remain horizontal

**Scroll Behavior:**
- Primary goal: Fit all components in viewport (1080px height target)
- Allow vertical scroll only if viewport < 900px height
- PiP window remains position:fixed (floats above scroll content)

---

## 5. Interaction Principles

### Real-Time Updates

**Auto-refresh Behavior:**
- Stats panel updates every 30 seconds
- Chart updates every 60 seconds
- Visual feedback: Subtle pulse animation on updated values (150ms fade yellow → white)
- "Last updated" timestamp displays below stats panel (11px, #6B7280, monospace)

**Manual Refresh:**
- Icon button (Lucide RotateCw, 16px) in stats panel header
- Spin animation on click (360deg rotation, 400ms)
- Disabled state during active refresh (30% opacity)

### Animation Standards

**Primary Animations:**
- Hover states: 150ms (buttons, cards)
- Data updates: 200ms fade-in for new values
- PiP drag/resize: 300ms transform
- Chart line drawing: 400ms on initial load

**Performance Rule:**
- Animate only `transform` and `opacity`
- Use `will-change: transform` on PiP window
- Disable animations when `prefers-reduced-motion: reduce`

### Interaction States

**Global Hover Pattern:**
- Interactive elements: Brighten 10% or add shadow
- Cursor: pointer for all clickable elements
- Focus rings: 2px solid #EF4444, 2px offset

**Loading States:**
- Skeleton loaders with gradient shimmer (#1A1A1A to #2A2A2A)
- Chart: Grey placeholder lines while fetching data
- Stats: "---" placeholder in monospace font

**Error States:**
- Red border (2px #EF4444) on failed panels
- Error icon (Lucide AlertCircle, 20px) with message (13px, #EF4444)
- Retry button (secondary style, 36px height)

### Keyboard Navigation

- Tab order: PiP controls → Stats refresh → Quick actions → Chart toggles → Emergency buttons
- Escape key: Close PiP if maximized, dismiss dropdowns
- Spacebar: Activate focused buttons
- Arrow keys: Navigate dropdown options

---

