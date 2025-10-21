import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TransitionEffect } from '@/types/video';

interface ImageDisplayState {
  currentImageId: string | null;
  currentImageUrl: string | null;
  currentCaption: string | null;
  isDisplayed: boolean;
  transition: TransitionEffect;
  autoAdvance: boolean;
  autoAdvanceInterval: number; // in seconds
}

const STORAGE_KEY = 'image_display_state';

export function useImageDisplayState() {
  const [state, setState] = useState<ImageDisplayState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback to default
      }
    }
    return {
      currentImageId: null,
      currentImageUrl: null,
      currentCaption: null,
      isDisplayed: false,
      transition: 'instant' as TransitionEffect,
      autoAdvance: false,
      autoAdvanceInterval: 10
    };
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Subscribe to state changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateState = (updates: Partial<ImageDisplayState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const showImage = (imageId: string, imageUrl: string, caption: string | null) => {
    updateState({
      currentImageId: imageId,
      currentImageUrl: imageUrl,
      currentCaption: caption,
      isDisplayed: true
    });

    // Record display event
    supabase.from('image_display_history').insert({
      image_id: imageId,
      filename: caption || 'Unknown',
      displayed_at: new Date().toISOString()
    });
  };

  const hideImage = async () => {
    // Update duration if we have a current image
    if (state.currentImageId) {
      const { data } = await supabase
        .from('image_display_history')
        .select('*')
        .eq('image_id', state.currentImageId)
        .order('displayed_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const durationSeconds = Math.floor(
          (new Date().getTime() - new Date(data.displayed_at).getTime()) / 1000
        );

        await supabase
          .from('image_display_history')
          .update({ duration_seconds: durationSeconds })
          .eq('id', data.id);
      }
    }

    updateState({
      currentImageId: null,
      currentImageUrl: null,
      currentCaption: null,
      isDisplayed: false
    });
  };

  const hideAll = () => {
    hideImage();
    // Also hide video if needed (you might want to add video state management)
  };

  return {
    state,
    updateState,
    showImage,
    hideImage,
    hideAll
  };
}
