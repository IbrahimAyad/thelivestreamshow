# Frontend Integration Guide

## Overview
This guide covers the frontend integration of the unified overlay system with your existing BetaBot interface.

## Component Architecture

### New Components Created
1. **OverlayEditModal.tsx** - Modal for editing overlay content
2. **OverlayGrid.tsx** - Grid component for overlay selection
3. **unified-overlay.html** - Main overlay template

### Component Dependencies
```typescript
// Required dependencies for new components
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Your existing Supabase client
```

## Integration Steps

### Step 1: Update Existing Graphics Overlays Section

#### Current Interface (from screenshots)
- Left Panel: Graphics Overlays grid with tiles
- Right Panel: BetaBot Director Controls

#### New Integration Approach
Replace the existing graphics overlays section with:

```typescript
// In your main dashboard component
import OverlayGrid from './components/OverlayGrid';

const Dashboard = () => {
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);

  const handleOverlaySelect = (overlayId: string) => {
    setSelectedOverlay(overlayId);
    // Handle overlay activation
    activateOverlay(overlayId);
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        {/* Replace existing graphics overlays grid */}
        <div className="left-panel">
          <OverlayGrid onOverlaySelect={handleOverlaySelect} />
        </div>
        
        {/* Move BetaBot controls to accommodate space */}
        <div className="right-panel">
          <BetaBotDirectorControls />
        </div>
      </div>
    </div>
  );
};
```

### Step 2: Update Layout Structure

#### CSS Layout Adjustments
```css
/* Updated layout to accommodate new interface */
.dashboard-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 20px;
  padding: 20px;
}

.left-panel {
  flex: 1;
  max-width: 600px; /* Limit width to prevent overwhelming interface */
}

.right-panel {
  flex: 1;
  min-width: 400px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-panel,
  .right-panel {
    max-width: none;
  }
}
```

### Step 3: Integrate with Existing Supabase Client

#### Update lib/supabase.ts
```typescript
// Ensure your existing Supabase client is properly configured
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add these for the new overlay system
export const overlayAPI = {
  async getOverlays() {
    const { data, error } = await supabase.functions.invoke('get-overlays');
    if (error) throw error;
    return data;
  },

  async updateOverlay(overlayId: string, content: any, chatMessages: any[]) {
    const { error } = await supabase.functions.invoke('update-overlay', {
      body: { overlayId, content, chatMessages }
    });
    if (error) throw error;
  },

  async createOverlay(name: string, type: string) {
    const { error } = await supabase.functions.invoke('create-overlay-template', {
      body: { name, type, description: '' }
    });
    if (error) throw error;
  }
};
```

### Step 4: Component Integration Examples

#### Integrating with Existing State Management
```typescript
// If using Redux, Context, or other state management
import { useOverlayStore } from '../store/overlayStore';

const GraphicsOverlaysSection = () => {
  const { overlays, updateOverlay, createOverlay } = useOverlayStore();

  const handleSaveOverlay = async (overlayId: string, content: any, chatMessages: any[]) => {
    try {
      await updateOverlay(overlayId, content, chatMessages);
      // Show success notification
      showToast('Overlay updated successfully!');
    } catch (error) {
      showToast('Error updating overlay', 'error');
    }
  };

  return (
    <OverlayGrid onSave={handleSaveOverlay} />
  );
};
```

#### Real-time Updates Integration
```typescript
// Add real-time subscriptions for live updates
import { useEffect } from 'react';

const useOverlayRealtime = (overlayId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`overlay-${overlayId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'overlay_content' },
        (payload) => {
          // Handle real-time content updates
          updateOverlayContent(payload.new);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        (payload) => {
          // Handle real-time chat message updates
          updateChatMessages(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [overlayId]);
};
```

### Step 5: Styling and Theming

#### Tailwind CSS Integration
```typescript
// If using Tailwind CSS, ensure these classes are available
const overlayClasses = {
  modal: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
  content: 'bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden',
  header: 'flex justify-between items-center mb-6',
  title: 'text-2xl font-bold text-white',
  close: 'text-gray-400 hover:text-white text-2xl',
  tab: 'px-4 py-2 font-medium border-b-2',
  tabActive: 'text-yellow-400 border-yellow-400',
  tabInactive: 'text-gray-400 hover:text-white',
  button: 'px-4 py-2 rounded hover:opacity-80 transition-opacity',
  buttonPrimary: 'bg-yellow-600 text-white',
  buttonSecondary: 'bg-gray-600 text-white'
};
```

#### Custom CSS Variables
```css
/* Add to your existing CSS */
:root {
  --overlay-bg: #1f2937;
  --overlay-border: #374151;
  --overlay-text: #f9fafb;
  --overlay-accent: #fbbf24;
  --overlay-accent-hover: #f59e0b;
}

/* Overlay-specific styles */
.overlay-modal {
  background: var(--overlay-bg);
  border: 1px solid var(--overlay-border);
  color: var(--overlay-text);
}

.overlay-button-primary {
  background: var(--overlay-accent);
  color: #000;
}

.overlay-button-primary:hover {
  background: var(--overlay-accent-hover);
}
```

### Step 6: Integration with Existing Features

#### BetaBot Controls Positioning
```typescript
// Move BetaBot controls to accommodate new interface
const BetaBotSection = () => {
  return (
    <div className="betabot-section">
      <h3 className="text-lg font-semibold text-white mb-4">
        BetaBot Director Controls
      </h3>
      
      {/* Existing BetaBot controls */}
      <ManualOverrideControl />
      <MoodControls />
      <MovementControls />
      
      {/* New: Overlay management integration */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Recent Overlays
        </h4>
        <RecentOverlaysList />
      </div>
    </div>
  );
};
```

#### Quick Actions Integration
```typescript
// Add overlay actions to existing quick actions
const QuickActions = () => {
  return (
    <div className="quick-actions">
      {/* Existing actions */}
      <button onClick={toggleStreamStatus}>Toggle Stream</button>
      <button onClick={showNotification}>Show Alert</button>
      
      {/* New overlay actions */}
      <button onClick={() => selectOverlay('main_stream')}>
        Main Stream Overlay
      </button>
      <button onClick={() => selectOverlay('starting_soon')}>
        Starting Soon
      </button>
    </div>
  );
};
```

## Error Handling

### Component Error Boundaries
```typescript
// Wrap new components in error boundaries
import { ErrorBoundary } from 'react-error-boundary';

const OverlayErrorFallback = ({error, resetErrorBoundary}) => (
  <div className="bg-red-900 p-4 rounded">
    <h3>Overlay Error</h3>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>Try Again</button>
  </div>
);

const Dashboard = () => {
  return (
    <ErrorBoundary FallbackComponent={OverlayErrorFallback}>
      <OverlayGrid />
    </ErrorBoundary>
  );
};
```

### Loading States
```typescript
// Proper loading state handling
const OverlayGrid = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverlays()
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return <OverlaysList />;
};
```

## Testing

### Component Testing
```typescript
// Example test for OverlayEditModal
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OverlayEditModal from './OverlayEditModal';

test('updates overlay content when save is clicked', async () => {
  const mockOverlay = {
    id: '1',
    name: 'Test Overlay',
    content: { season: 'Season 1' },
    chatMessages: []
  };

  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  render(
    <OverlayEditModal
      isOpen={true}
      overlay={mockOverlay}
      onSave={mockOnSave}
      onClose={mockOnClose}
    />
  );

  // Change content
  const seasonInput = screen.getByLabelText('season');
  fireEvent.change(seasonInput, { target: { value: 'Season 2' } });

  // Save
  const saveButton = screen.getByText('Save Changes');
  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(mockOnSave).toHaveBeenCalledWith(
      '1',
      { season: 'Season 2' },
      []
    );
  });
});
```

## Performance Optimization

### Lazy Loading
```typescript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const OverlayEditModal = lazy(() => import('./OverlayEditModal'));
const CameraControls = lazy(() => import('./CameraControls'));

const GraphicsSection = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OverlayGrid />
      <Suspense fallback={null}>
        <CameraControls />
      </Suspense>
    </Suspense>
  );
};
```

### Memoization
```typescript
// Optimize re-renders with memo
import { memo, useCallback } from 'react';

const OverlayTile = memo(({ overlay, onClick, onEdit }) => {
  const handleClick = useCallback(() => onClick(overlay.id), [overlay.id, onClick]);
  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit(overlay);
  }, [overlay, onEdit]);

  return (
    <div onClick={handleClick} onContextMenu={handleEdit}>
      {overlay.name}
    </div>
  );
});
```

## Accessibility

### Keyboard Navigation
```typescript
// Ensure keyboard accessibility
const OverlayGrid = () => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        setFocusedIndex(prev => Math.min(prev + 1, overlays.length - 1));
        break;
      case 'ArrowLeft':
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        overlays[focusedIndex] && handleOverlaySelect(overlays[focusedIndex].id);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0}>
      {overlays.map((overlay, index) => (
        <button
          key={overlay.id}
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-label={`Select ${overlay.name} overlay`}
        >
          {overlay.name}
        </button>
      ))}
    </div>
  );
};
```

### Screen Reader Support
```typescript
// Proper ARIA labels
const OverlayEditModal = () => {
  return (
    <div
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">Edit Overlay Content</h2>
      <div id="modal-description">
        Modify the content and chat messages for this overlay
      </div>
      
      <div className="chat-messages" role="region" aria-label="Chat messages">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            role="listitem"
            aria-label={`Chat message ${index + 1}: ${message.message_text}`}
          >
            {message.message_text}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Deployment Considerations

### Build Optimization
```json
// Update package.json if needed
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "npm run build && npx bundle-analyzer build/static/js/*.js"
  }
}
```

### Environment Variables
```bash
# Add to your .env files
REACT_APP_SUPABASE_URL=https://vcniezwtltraqramjlux.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ
```

## Next Steps

1. **Test Integration**: Gradually integrate components one by one
2. **User Testing**: Get feedback on the new interface
3. **Performance Monitoring**: Monitor for any performance issues
4. **Accessibility Testing**: Ensure compliance with accessibility standards
5. **Documentation**: Update user documentation for new features
