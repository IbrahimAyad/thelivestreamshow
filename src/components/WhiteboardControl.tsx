import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit3, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';

export function WhiteboardControl() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadState();
    subscribeToState();
  }, []);

  const loadState = async () => {
    try {
      const { data } = await supabase
        .from('whiteboard_state')
        .select('is_active')
        .single();

      if (data) {
        setIsActive(data.is_active);
      }
    } catch (error) {
      console.error('Error loading whiteboard state:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToState = () => {
    const channel = supabase
      .channel('whiteboard-state-control')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whiteboard_state'
        },
        (payload) => {
          if (payload.new && 'is_active' in payload.new) {
            setIsActive(payload.new.is_active);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleActive = async () => {
    try {
      const newState = !isActive;

      const { data: stateRecord } = await supabase
        .from('whiteboard_state')
        .select('id')
        .single();

      if (stateRecord) {
        await supabase
          .from('whiteboard_state')
          .update({
            is_active: newState,
            updated_at: new Date().toISOString()
          })
          .eq('id', stateRecord.id);

        setIsActive(newState);
      }
    } catch (error) {
      console.error('Error toggling whiteboard:', error);
    }
  };

  const clearCanvas = async () => {
    if (!confirm('Clear all drawings on the whiteboard?')) return;

    try {
      // Hide all strokes
      await supabase
        .from('whiteboard_strokes')
        .update({ is_visible: false })
        .eq('is_visible', true);

      // Update cleared timestamp
      const { data: stateRecord } = await supabase
        .from('whiteboard_state')
        .select('id')
        .single();

      if (stateRecord) {
        await supabase
          .from('whiteboard_state')
          .update({ cleared_at: new Date().toISOString() })
          .eq('id', stateRecord.id);
      }

      alert('Whiteboard cleared!');
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
      alert('Error clearing whiteboard');
    }
  };

  const openWhiteboard = () => {
    // Open whiteboard in new window
    const width = 1920;
    const height = 1000;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      '/whiteboard',
      'Whiteboard',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg shadow-lg border-2 border-purple-500/30 p-6 hover:border-purple-500/50 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-purple-300">Live Whiteboard</h3>
        </div>
        {isActive && (
          <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold animate-pulse">
            LIVE
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Open Whiteboard Button */}
        <button
          onClick={openWhiteboard}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <ExternalLink className="w-4 h-4" />
          Open Drawing Board
        </button>

        {/* Toggle Visibility */}
        <button
          onClick={toggleActive}
          className={`w-full px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {isActive ? (
            <>
              <Eye className="w-4 h-4" />
              Hide from Broadcast
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Show on Broadcast
            </>
          )}
        </button>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Drawings
        </button>
      </div>

      {/* Status Info */}
      <div className="mt-4 pt-4 border-t border-purple-500/30">
        <p className="text-xs text-gray-400">
          {isActive ? (
            <span className="text-green-400">✓ Whiteboard visible in broadcast</span>
          ) : (
            <span className="text-gray-500">○ Whiteboard hidden from broadcast</span>
          )}
        </p>
      </div>
    </div>
  );
}
