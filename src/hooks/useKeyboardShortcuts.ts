import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: {
  onSoundboard?: (index: number) => void;
  onSegment?: (index: number) => void;
  onToggleTimer?: () => void;
  onEmergencyClear?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F1-F6: Soundboard effects
      if (event.key >= 'F1' && event.key <= 'F6' && handlers.onSoundboard) {
        event.preventDefault();
        const index = parseInt(event.key.substring(1)) - 1;
        handlers.onSoundboard(index);
        return;
      }

      // Ctrl+1 to Ctrl+5: Segments
      if (event.ctrlKey && event.key >= '1' && event.key <= '5' && handlers.onSegment) {
        event.preventDefault();
        const index = parseInt(event.key) - 1;
        handlers.onSegment(index);
        return;
      }

      // Spacebar: Toggle timer (only if not typing in input)
      if (
        event.code === 'Space' && 
        handlers.onToggleTimer && 
        !isTyping(event.target as HTMLElement)
      ) {
        event.preventDefault();
        handlers.onToggleTimer();
        return;
      }

      // Escape: Emergency clear all overlays
      if (event.key === 'Escape' && handlers.onEmergencyClear) {
        event.preventDefault();
        handlers.onEmergencyClear();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// Helper to check if user is typing in an input/textarea
function isTyping(target: HTMLElement): boolean {
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' || 
    tagName === 'textarea' || 
    target.isContentEditable
  );
}
