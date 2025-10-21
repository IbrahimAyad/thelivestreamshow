import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QueueVideo } from '@/types/video';

export function useQueue() {
  const [queue, setQueue] = useState<QueueVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from('video_queue')
      .select('*')
      .order('position', { ascending: true });

    if (!error && data) {
      setQueue(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel('video_queue_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_queue' },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addToQueue = async (video: Omit<QueueVideo, 'id' | 'created_at' | 'position'>) => {
    const maxPosition = queue.length > 0 ? Math.max(...queue.map(v => v.position)) : -1;
    
    const { error } = await supabase.from('video_queue').insert({
      ...video,
      position: maxPosition + 1
    });

    if (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  };

  const removeFromQueue = async (id: string) => {
    const { error } = await supabase.from('video_queue').delete().eq('id', id);

    if (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  };

  const updateQueue = async (videos: QueueVideo[]) => {
    const updates = videos.map((video, index) => ({
      id: video.id,
      position: index
    }));

    for (const update of updates) {
      await supabase
        .from('video_queue')
        .update({ position: update.position })
        .eq('id', update.id);
    }

    await fetchQueue();
  };

  const clearQueue = async () => {
    const { error } = await supabase.from('video_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  };

  return {
    queue,
    loading,
    addToQueue,
    removeFromQueue,
    updateQueue,
    clearQueue,
    refetch: fetchQueue
  };
}
