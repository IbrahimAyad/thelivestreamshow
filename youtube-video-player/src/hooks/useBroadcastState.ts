import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface BroadcastState {
  id: string;
  hide_all: boolean;
  active_scene: string;
  updated_at: string;
}

export function useBroadcastState() {
  const [state, setState] = useState<BroadcastState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('broadcast_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_state'
        },
        () => {
          fetchState();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchState = async () => {
    try {
      const { data } = await supabase
        .from('broadcast_state')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setState(data);
      } else {
        // Create initial state if none exists
        const { data: newData } = await supabase
          .from('broadcast_state')
          .insert({ hide_all: false, active_scene: 'none' })
          .select()
          .single();
        if (newData) setState(newData);
      }
    } catch (error) {
      console.error('Error fetching broadcast state:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (updates: Partial<BroadcastState>) => {
    if (!state) return;

    const { error } = await supabase
      .from('broadcast_state')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', state.id);

    if (error) {
      console.error('Error updating broadcast state:', error);
    }
  };

  const hideAll = async () => {
    await updateState({ hide_all: true, active_scene: 'none' });
  };

  const restore = async (scene: string = 'video') => {
    await updateState({ hide_all: false, active_scene: scene });
  };

  return { state, loading, updateState, hideAll, restore };
}
