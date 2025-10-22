/**
 * useImageDisplayState - Hook for managing image display state
 */

import { useState, useCallback } from 'react';
import { ImageQueueItem } from '@/types/video';

export interface ImageDisplayState {
  currentImage: ImageQueueItem | null;
  isDisplaying: boolean;
  displayStartTime: number | null;
}

export interface UseImageDisplayStateReturn extends ImageDisplayState {
  showImage: (image: ImageQueueItem) => void;
  hideImage: () => void;
  getDisplayDuration: () => number;
  state: ImageDisplayState; // Alias for the state
}

export function useImageDisplayState(): UseImageDisplayStateReturn {
  const [state, setState] = useState<ImageDisplayState>({
    currentImage: null,
    isDisplaying: false,
    displayStartTime: null,
  });

  const showImage = useCallback((image: ImageQueueItem) => {
    setState({
      currentImage: image,
      isDisplaying: true,
      displayStartTime: Date.now(),
    });
  }, []);

  const hideImage = useCallback(() => {
    setState({
      currentImage: null,
      isDisplaying: false,
      displayStartTime: null,
    });
  }, []);

  const getDisplayDuration = useCallback(() => {
    if (!state.displayStartTime) return 0;
    return (Date.now() - state.displayStartTime) / 1000;
  }, [state.displayStartTime]);

  return {
    ...state,
    state,
    showImage,
    hideImage,
    getDisplayDuration,
  };
}

export default useImageDisplayState;

