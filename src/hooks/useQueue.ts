/**
 * useQueue - Hook for managing video queue
 */

import { useState, useEffect } from 'react';
import { QueueVideo } from '@/types/video';

export interface UseQueueReturn {
  queue: QueueVideo[];
  addToQueue: (video: Omit<QueueVideo, 'id' | 'position' | 'created_at'>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  isLoading: boolean;
}

export function useQueue(): UseQueueReturn {
  const [queue, setQueue] = useState<QueueVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load initial queue
    loadQueue();
  }, []);

  async function loadQueue() {
    setIsLoading(true);
    try {
      // Load from database or API
      setQueue([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function addToQueue(video: Omit<QueueVideo, 'id' | 'position' | 'created_at'>) {
    const newVideo: QueueVideo = {
      ...video,
      id: `queue-${Date.now()}`,
      position: queue.length,
      created_at: new Date().toISOString(),
    };
    setQueue([...queue, newVideo]);
  }

  async function removeFromQueue(id: string) {
    setQueue(queue.filter(v => v.id !== id));
  }

  async function reorderQueue(fromIndex: number, toIndex: number) {
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);
    
    // Update positions
    const updated = newQueue.map((v, i) => ({ ...v, position: i }));
    setQueue(updated);
  }

  async function clearQueue() {
    setQueue([]);
  }

  return {
    queue,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    isLoading,
  };
}

export default useQueue;

