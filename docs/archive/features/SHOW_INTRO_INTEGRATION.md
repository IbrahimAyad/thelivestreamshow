# Quick Integration Example - Show Intro Controller

## Where to Add It

Add the Show Intro Controller to your `StudioControlPanel.tsx` in the DJ Tools section.

### Option 1: Add as a Collapsible Section in "Tools" Tab

Find the "Tools" tab section (around line 1050) and add:

```tsx
// In the 'tools' tab section
{activeDJTab === 'tools' && (
  <div className="space-y-3">
    {/* ADD THIS - Show Intro Controller */}
    <CollapsibleSection 
      title="Show Intro Automation" 
      defaultOpen={false}
      icon={<Monitor className="w-5 h-5" />}
    >
      <ShowIntroController dualDeck={dualDeck} />
    </CollapsibleSection>

    {/* Existing sections... */}
    <CollapsibleSection title="AI DJ Chat" defaultOpen={true} icon={<Bot className="w-5 h-5" />}>
      <AIChatPanel />
    </CollapsibleSection>
    
    {/* ...rest of tools sections... */}
  </div>
)}
```

### Option 2: Add as Standalone Panel (Recommended for First Stream)

Add it prominently at the top of the page for easy access:

```tsx
// Add after EmergencyControlsPanel (around line 470)
<div className="px-6 pt-6">
  <EmergencyControlsPanel {...} />
</div>

{/* ADD THIS NEW SECTION */}
<div className="px-6 pt-6">
  <ShowIntroController dualDeck={dualDeck} className="max-w-4xl mx-auto" />
</div>

<div className="grid grid-cols-12 gap-6 p-6">
  {/* Rest of your dashboard... */}
</div>
```

---

## Required Imports

Add these imports at the top of `StudioControlPanel.tsx`:

```tsx
import { ShowIntroController } from '@/components/ShowIntroController'
import { Monitor } from 'lucide-react'  // If not already imported
```

---

## Quick Test

1. **Start dev server** (already running ✅)
2. **Open** http://localhost:5173
3. **Navigate** to Studio Control Panel
4. **Find** the Show Intro Controller section
5. **Load** two songs on Deck A and B (via the dual deck interface)
6. **Click** "Start Intro Sequence"
7. **Watch** it run automatically!

---

## Complete Code Example

Here's the exact code to add to `StudioControlPanel.tsx`:

### 1. Add imports (top of file):

```typescript
// Add to existing imports
import { ShowIntroController } from '@/components/ShowIntroController'
import { Monitor } from 'lucide-react'
```

### 2. Add component (choose one location):

**Location A: As standalone panel (easy access)**

```tsx
{/* Around line 470, after EmergencyControlsPanel */}
<div className="px-6 pt-6">
  <ShowIntroController dualDeck={dualDeck} className="max-w-4xl mx-auto" />
</div>
```

**Location B: In Tools tab (organized)**

```tsx
{/* Around line 1050, inside activeDJTab === 'tools' */}
<CollapsibleSection 
  title="Show Intro Automation" 
  defaultOpen={true}  // Open by default for first stream
  icon={<Monitor className="w-5 h-5" />}
>
  <ShowIntroController dualDeck={dualDeck} />
</CollapsibleSection>
```

---

## That's It!

The controller is now integrated and ready to use for your first live stream! 🎉

See [SHOW_INTRO_CONTROLLER_GUIDE.md](./SHOW_INTRO_CONTROLLER_GUIDE.md) for detailed usage instructions.
