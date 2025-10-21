# Image Upload & Queue System - Design Specification

## 1. Design Direction & Rationale

**Visual Essence:** Functional Modern Minimalism optimized for live streaming workflows. Clean, efficient interface prioritizing speed and clarity over decorative elements.

**Strategic Rationale:**
1. **Workflow Efficiency:** Dashboard tools require information density and quick access patterns. Sidebar-free layouts with horizontal navigation maximize content area for image previews and queue management.
2. **Brand Consistency:** Inherits existing YouTube Video Player aesthetic—red accent system, dark interface optimized for OBS environments, familiar tab navigation patterns.
3. **Live Context:** Designed for real-time decision-making during streams. Large touch targets (56px minimum), instant visual feedback, emergency controls prominently placed.

**Key Characteristics:**
- Spacing: Compact-to-standard (12-24px gaps, 16-24px card padding) for information density
- Color: 85% neutral (black/grey) + 15% red accent (#EF4444) for primary actions
- Typography: Sans-serif system fonts for legibility at dashboard scale
- Animation: Fast (200-250ms) for immediate feedback, subtle hover states

**Reference Examples:**
- OBS Studio (functional dashboard design)
- Streamlabs Dashboard (live control patterns)
- YouTube Studio (content management efficiency)

---

## 2. Design Tokens

### Colors

| Token | Value | Usage | WCAG |
|-------|-------|-------|------|
| **Primary Red** | #EF4444 | CTA buttons, active states, "Show Now" | AA with white text (4.52:1) |
| **Black** | #000000 | Page background, OBS broadcast bg | N/A (background) |
| **Grey Dark** | #6B7280 | Secondary text, inactive elements | AA with white (5.74:1) |
| **Grey Medium** | #9CA3AF | Borders, dividers, disabled states | — |
| **Grey Light** | #E5E7EB | Card backgrounds (light mode fallback) | — |
| **Yellow Accent** | #EAB308 | Warning states, "Now Showing" indicator | AA with black (11.2:1) |
| **White** | #FFFFFF | Primary text on dark, card text | AAA with black (21:1) |
| **Background Surface** | #1A1A1A | Card/panel backgrounds (contrasts black) | — |
| **Success Green** | #10B981 | Upload success states | — |
| **Error Red** | #DC2626 | Delete, error states | — |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| **Font Family** | System: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif | All text |
| **Size XXL** | 32px | Section titles (rare) |
| **Size XL** | 24px | Tab labels, panel headers |
| **Size LG** | 18px | Card titles, primary labels |
| **Size Base** | 16px | Body text, buttons, inputs |
| **Size SM** | 14px | Metadata, timestamps, helper text |
| **Size XS** | 12px | Micro labels, badge text |
| **Weight Bold** | 700 | Headers, active tab |
| **Weight Semibold** | 600 | Button text, card titles |
| **Weight Regular** | 400 | Body text, metadata |
| **Line Height Tight** | 1.25 | Headlines, buttons |
| **Line Height Normal** | 1.5 | Body text, captions |

### Spacing (4pt-based)

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px | Icon spacing, tight gaps |
| **sm** | 8px | Card internal gaps |
| **md** | 12px | Grid gaps, element spacing |
| **lg** | 16px | Card padding, section gaps |
| **xl** | 24px | Panel padding, major sections |
| **xxl** | 32px | Page margins (rare in dashboard) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| **sm** | 4px | Buttons, badges, tags |
| **md** | 8px | Cards, inputs, thumbnails |
| **lg** | 12px | Panels, modals |
| **full** | 9999px | Pills, circular icons |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| **sm** | 0 1px 2px rgba(0,0,0,0.3) | Subtle card elevation |
| **card** | 0 2px 8px rgba(0,0,0,0.4) | Image cards, panels |
| **card-hover** | 0 4px 16px rgba(239,68,68,0.2) | Hover state (red tint) |
| **modal** | 0 8px 32px rgba(0,0,0,0.6) | Preview modals, overlays |

### Animation

| Token | Value | Usage |
|-------|-------|-------|
| **Fast** | 200ms | Hover states, button feedback |
| **Normal** | 250ms | Transitions, slide effects |
| **Slow** | 300ms | Modal open/close |
| **Easing** | ease-out | Default for all animations |

---

## 3. Component Specifications

### 3.1 Tab Navigation (Updated)

**Structure:** Horizontal tab bar matching existing "Video Queue", "Analytics", "Scheduled" pattern. Add "Images" as fourth tab.

**Tokens:**
- Height: 56px
- Padding: lg (16px) horizontal per tab
- Font: size-lg (18px), weight-semibold (600)
- Active: primary-red bottom border (3px), white text
- Inactive: grey-dark text
- Background: black

**States:**
- Hover: grey-medium underline (2px), fast (200ms)
- Active: red underline, bold weight
- Focus: red outline (2px)

**Note:** Maintain existing tab structure. "Images" tab positioned after "Scheduled".

---

### 3.2 Image Upload Zone

**Structure:** Large dropzone area at top of Images tab. Dashed border when empty, solid when dragging files over.

**Tokens:**
- Height: 200px (empty state), auto (with content)
- Padding: xl (24px)
- Background: background-surface (#1A1A1A)
- Border: 2px dashed grey-medium
- Radius: md (8px)
- Icon: Upload icon, 48px, grey-dark
- Text: "Drag images here or click to browse" (size-base, grey-dark)

**States:**
- Default: Dashed grey border
- Drag Over: Solid red border, red icon/text, fast (200ms)
- Uploading: Progress bars per file, success-green checkmarks
- Error: error-red border, error message text

**Note:** Support multi-file selection. Show file count when multiple files dragged.

---

### 3.3 Image Queue Card

**Structure:** Grid card displaying thumbnail, metadata, and action buttons.

**Tokens:**
- Card size: 240px × 280px
- Padding: lg (16px)
- Background: background-surface
- Radius: md (8px)
- Shadow: card
- Thumbnail: 208px × 160px (16:10 aspect, object-fit: cover)
- Thumbnail radius: sm (4px)

**Card Content:**
- Position badge: Top-left overlay, yellow-accent bg, black text, size-xs (12px), 20px circle
- Filename: size-sm (14px), white, weight-regular, 1 line truncate
- Caption: size-xs (12px), grey-dark, 2 lines max, line-height 1.4
- Metadata: size-xs (12px), grey-dark (file size, upload date)

**States:**
- Default: card shadow
- Hover: card-hover shadow, lift transform(-2px), fast (200ms), show action buttons
- Dragging: 50% opacity, dashed outline
- Selected: red border (2px)

**Action Buttons (visible on hover):**
- "Show Now": Primary red button, 100% width, height 40px, size-sm (14px)
- Icon buttons row: Edit (pencil icon), Delete (trash icon), 32px × 32px each, grey background, white icons

---

### 3.4 Display Controls Panel

**Structure:** Sticky panel on right side of screen (or top on smaller views), showing currently displayed image and navigation controls.

**Tokens:**
- Width: 320px (desktop), 100% (mobile)
- Padding: lg (16px)
- Background: background-surface
- Radius: md (8px)
- Shadow: card

**Sections:**

**Now Showing:**
- Preview: 288px wide, auto height (maintain aspect ratio)
- Yellow indicator: "LIVE" badge, size-xs (12px), yellow-accent background
- Filename: size-base (16px), white, weight-semibold
- "Hide Image" button: Full width, grey background, white text, height 44px

**Navigation Controls:**
- Button group: Previous/Next buttons, 48px × 48px each, grey background, white icons
- Auto-advance toggle: Switch component + timer dropdown
- Timer options: 5s, 10s, 15s, 30s, 60s
- Layout: Horizontal row, md (12px) gap

**Transition Effects:**
- Dropdown: Full width, height 44px
- Options: Instant, Fade, Slide Left, Slide Right, Zoom In
- Selected: Red accent indicator

**Emergency Controls:**
- "Hide All" button: Full width, error-red background, white text, height 48px, weight-bold

**States:**
- Buttons hover: Lighten background 10%, fast (200ms)
- Active states: Red accent for selected options

---

### 3.5 Image History Table

**Structure:** Data table below queue grid, showing previously displayed images.

**Tokens:**
- Row height: 64px
- Padding: sm (8px) per cell
- Background: Alternating rows (black, background-surface)
- Border: 1px grey-medium between rows
- Font: size-sm (14px), white/grey-dark

**Columns:**
- Thumbnail: 80px × 60px, radius sm (4px)
- Filename: Left-aligned, white, truncate
- Display Time: Grey-dark, "HH:MM:SS" format
- Duration Shown: Grey-dark, seconds format
- Date: Grey-dark, "MMM DD, YYYY" format

**Header:**
- Background: background-surface
- Text: size-sm (14px), weight-semibold, grey-medium
- Sort icons: 16px, grey-dark

**States:**
- Row hover: background-surface, fast (200ms)
- Selected: Red left border (3px)

---

### 3.6 Toolbar Actions

**Structure:** Horizontal toolbar above image grid with bulk actions and filters.

**Tokens:**
- Height: 48px
- Padding: md (12px) horizontal
- Background: black
- Gap: md (12px) between elements

**Elements:**
- Total count: "48 images" (size-sm, grey-dark)
- Search input: 240px width, height 40px, grey background, white text
- Filter dropdown: Height 40px, grey background
- "Clear All" button: Height 40px, error-red background, white text
- "Shuffle" button: Height 40px, grey background, white text
- Export button: Height 40px, grey background, white text

**States:**
- Button hover: Lighten 10%, fast (200ms)
- Input focus: Red outline (2px)

---

## 4. Layout & Responsive Strategy

### Breakpoints

| Breakpoint | Width | Layout Adjustments |
|------------|-------|-------------------|
| **sm** | 640px | Stack controls vertically |
| **md** | 768px | 2-column grid |
| **lg** | 1024px | 3-column grid |
| **xl** | 1280px | 4-column grid + sticky sidebar |
| **2xl** | 1536px | 5-column grid (max) |

### Grid Approach

**Images Tab Layout:**
- Main area: Image grid (left/center, 70% width)
- Sidebar: Display controls panel (right, 30% width, sticky)
- Grid columns: Auto-fit, minimum 240px per card
- Grid gap: md (12px)

**Responsive Adaptations:**
- Desktop (≥1280px): Grid + sticky sidebar
- Tablet (768-1279px): Grid, controls panel below
- Mobile (<768px): Single column, stacked controls at top

### OBS Broadcast View (1920×1080)

**Image Display:**
- Container: Full viewport (1920×1080)
- Image: Centered, max-width 90%, max-height 90%, maintain aspect ratio
- Caption overlay: Bottom 120px, black gradient background (rgba(0,0,0,0.7)), centered text
- Caption text: size-xl (24px), white, weight-semibold, max 2 lines

**Layout Modes:**
- Video mode: YouTube player (existing)
- Image mode: Centered image + optional caption
- Transition container: Absolute positioning for animation effects

---

## 5. Interaction Principles

### Animation Standards

| Action | Duration | Easing |
|--------|----------|--------|
| Button hover/focus | 200ms | ease-out |
| Card hover effects | 200ms | ease-out |
| Tab switching | 250ms | ease-out |
| Modal open/close | 300ms | ease-out |
| Image transitions (broadcast) | 250-500ms | ease-out (varies by effect) |
| Drag-and-drop reorder | 200ms | ease-out |

### Default Easing

All animations use `ease-out` for immediate response feeling appropriate for dashboard tools.

### Animated Components

1. **Buttons:** Background color, transform (lift -2px on hover)
2. **Cards:** Shadow elevation, transform (lift -2px on hover)
3. **Tabs:** Border color, text color
4. **Modals:** Opacity + scale (0.95 → 1.0)
5. **Upload Zone:** Border color, background on drag-over
6. **Broadcast Transitions:** Fade (opacity 0→1), Slide (translateX -100%→0), Zoom (scale 0.8→1.0)

### Performance Rule

**Animate ONLY `transform` and `opacity`** for GPU acceleration. Avoid animating width, height, margin, padding, or color properties where possible (exception: simple color transitions under 250ms are acceptable for buttons).

### Reduced Motion

Respect `prefers-reduced-motion` media query:
- Disable all transform animations
- Replace with instant state changes or subtle opacity fades (100ms max)
- Maintain functionality without motion

### Interaction Feedback

- All clickable elements: Cursor pointer
- Drag handles: Cursor grab/grabbing
- Loading states: Spinner + disabled cursor
- Success actions: Green checkmark (1s display)
- Error actions: Red shake animation (300ms) + error message
