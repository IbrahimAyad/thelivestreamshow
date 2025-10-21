import { useState, useEffect, useCallback } from 'react';
import type { MusicTrack } from '../types/database';

export interface QueuedTrack {
  track: MusicTrack;
  addedAt: Date;
  reason?: string;
  score?: number;
}

export function usePlayQueue() {
  const [queue, setQueue] = useState<QueuedTrack[]>([]);
  const [history, setHistory] = useState<MusicTrack[]>([]);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

  // Add track to queue
  const addToQueue = useCallback((track: MusicTrack, reason?: string, score?: number) => {
    const queuedTrack: QueuedTrack = {
      track,
      addedAt: new Date(),
      reason,
      score,
    };

    setQueue(prev => [...prev, queuedTrack]);
  }, []);

  // Add multiple tracks to queue
  const addMultipleToQueue = useCallback((tracks: MusicTrack[], reason?: string) => {
    const queuedTracks: QueuedTrack[] = tracks.map(track => ({
      track,
      addedAt: new Date(),
      reason,
    }));

    setQueue(prev => [...prev, ...queuedTracks]);
  }, []);

  // Remove track from queue by index
  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Get next track in queue
  const getNextTrack = useCallback((): QueuedTrack | null => {
    if (queue.length === 0) return null;
    return queue[0];
  }, [queue]);

  // Move to next track (removes first from queue and adds to history)
  const moveToNext = useCallback((currentTrack?: MusicTrack) => {
    if (currentTrack) {
      setHistory(prev => [currentTrack, ...prev].slice(0, 50)); // Keep last 50 tracks
    }

    setQueue(prev => prev.slice(1));
  }, []);

  // Reorder queue (drag and drop)
  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
  }, []);

  // Move track to front of queue
  const moveToFront = useCallback((index: number) => {
    if (index === 0) return;

    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(index, 1);
      newQueue.unshift(removed);
      return newQueue;
    });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Get queue statistics
  const getQueueStats = useCallback(() => {
    if (queue.length === 0) {
      return {
        totalTracks: 0,
        totalDuration: 0,
        averageScore: 0,
      };
    }

    const totalDuration = queue.reduce((sum, item) => sum + (item.track.duration || 0), 0);
    const tracksWithScores = queue.filter(item => item.score !== undefined);
    const averageScore = tracksWithScores.length > 0
      ? tracksWithScores.reduce((sum, item) => sum + (item.score || 0), 0) / tracksWithScores.length
      : 0;

    return {
      totalTracks: queue.length,
      totalDuration,
      averageScore,
    };
  }, [queue]);

  return {
    // State
    queue,
    history,
    autoAdvanceEnabled,
    nextTrack: getNextTrack(),
    queueStats: getQueueStats(),

    // Actions
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    moveToNext,
    reorderQueue,
    moveToFront,
    clearHistory,
    setAutoAdvanceEnabled,
  };
}
