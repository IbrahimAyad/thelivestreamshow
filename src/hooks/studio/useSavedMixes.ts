import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SavedMix {
  id: string;
  name: string;
  description: string | null;
  track_ids: string[];
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export function useSavedMixes() {
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMixes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_mixes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMixes(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching saved mixes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMix = async (name: string, description: string, trackIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('saved_mixes')
        .insert({
          name,
          description,
          track_ids: trackIds,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchMixes();
      return { success: true, mix: data };
    } catch (err: any) {
      console.error('Error creating mix:', err);
      return { success: false, error: err.message };
    }
  };

  const updateMix = async (id: string, updates: Partial<SavedMix>) => {
    try {
      const { error } = await supabase
        .from('saved_mixes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchMixes();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating mix:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteMix = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_mixes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMixes();
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting mix:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchMixes();
  }, []);

  return {
    mixes,
    loading,
    error,
    createMix,
    updateMix,
    deleteMix,
    refreshMixes: fetchMixes,
  };
}
