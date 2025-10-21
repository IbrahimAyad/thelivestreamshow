import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageQueueItem } from '@/types/video';

export function useImageQueue() {
  const [images, setImages] = useState<ImageQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('image_queue')
      .select('*')
      .order('position', { ascending: true });

    if (!error && data) {
      setImages(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();

    const channel = supabase
      .channel('image_queue_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'image_queue' },
        () => {
          fetchImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addToQueue = async (file: File, caption?: string) => {
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via Edge Function
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: {
          imageData: base64,
          fileName
        }
      });

      if (error) throw error;

      // Add to queue
      const maxPosition = images.length > 0 ? Math.max(...images.map(img => img.position)) : -1;
      
      const { error: insertError } = await supabase.from('image_queue').insert({
        file_path: data.data.publicUrl,
        filename: file.name,
        caption: caption || null,
        file_size: file.size,
        position: maxPosition + 1
      });

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error adding image to queue:', error);
      throw error;
    }
  };

  const removeFromQueue = async (id: string) => {
    const { error } = await supabase.from('image_queue').delete().eq('id', id);
    if (error) {
      console.error('Error removing image:', error);
      throw error;
    }
  };

  const updateQueue = async (updatedImages: ImageQueueItem[]) => {
    const updates = updatedImages.map((img, index) => ({
      id: img.id,
      position: index
    }));

    for (const update of updates) {
      await supabase
        .from('image_queue')
        .update({ position: update.position })
        .eq('id', update.id);
    }

    await fetchImages();
  };

  const updateCaption = async (id: string, caption: string) => {
    const { error } = await supabase
      .from('image_queue')
      .update({ caption })
      .eq('id', id);

    if (error) {
      console.error('Error updating caption:', error);
      throw error;
    }
  };

  const clearQueue = async () => {
    const { error } = await supabase
      .from('image_queue')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  };

  return {
    images,
    loading,
    addToQueue,
    removeFromQueue,
    updateQueue,
    updateCaption,
    clearQueue,
    refetch: fetchImages
  };
}
