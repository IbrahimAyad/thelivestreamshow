import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import OverlayEditModal from './OverlayEditModal';

interface Overlay {
  id: string;
  name: string;
  type: string;
  description: string;
  content: Record<string, any>;
  chatMessages: ChatMessage[];
}

interface ChatMessage {
  id?: string;
  message_type: string;
  message_text: string;
  display_order: number;
  is_active: boolean;
  animation_type: string;
}

interface OverlayGridProps {
  onOverlaySelect?: (overlayId: string) => void;
}

const OverlayGrid: React.FC<OverlayGridProps> = ({ onOverlaySelect }) => {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOverlay, setEditingOverlay] = useState<Overlay | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchOverlays();
  }, []);

  const fetchOverlays = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-overlays');
      if (error) throw error;
      
      setOverlays(data || []);
    } catch (error) {
      console.error('Error fetching overlays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (overlay: Overlay, event: React.MouseEvent) => {
    // If Ctrl+Click or Cmd+Click, open edit modal
    if (event.ctrlKey || event.metaKey) {
      setEditingOverlay(overlay);
      setIsEditModalOpen(true);
    } else {
      // Regular click - select overlay for use
      if (onOverlaySelect) {
        onOverlaySelect(overlay.id);
      }
    }
  };

  const handleSaveOverlay = async (
    overlayId: string, 
    content: Record<string, any>, 
    chatMessages: ChatMessage[]
  ) => {
    try {
      const { error } = await supabase.functions.invoke('update-overlay', {
        body: {
          overlayId,
          content,
          chatMessages
        }
      });

      if (error) throw error;
      
      // Refresh overlays
      await fetchOverlays();
    } catch (error) {
      console.error('Error updating overlay:', error);
      throw error;
    }
  };

  const createNewOverlay = async () => {
    const name = prompt('Enter overlay name:');
    const type = prompt('Enter overlay type (main_stream, starting_soon, brb, custom):');
    
    if (!name || !type) return;

    try {
      const { error } = await supabase.functions.invoke('create-overlay-template', {
        body: { name, type, description: '' }
      });

      if (error) throw error;
      
      // Refresh overlays
      await fetchOverlays();
    } catch (error) {
      console.error('Error creating overlay:', error);
    }
  };

  const getOverlayIcon = (type: string) => {
    switch (type) {
      case 'main_stream':
        return '🎬';
      case 'starting_soon':
        return '⏰';
      case 'brb':
        return '☕';
      case 'custom':
        return '🎨';
      default:
        return '📱';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading overlays...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Graphics Overlays</h2>
        <button
          onClick={createNewOverlay}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
        >
          + Create New
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {overlays.map((overlay) => (
          <div
            key={overlay.id}
            onClick={(e) => handleOverlayClick(overlay, e)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-yellow-400 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{getOverlayIcon(overlay.type)}</div>
              <div className="text-white font-medium text-sm mb-1">{overlay.name}</div>
              <div className="text-gray-400 text-xs capitalize">{overlay.type.replace('_', ' ')}</div>
              <div className="text-gray-500 text-xs mt-2">
                {overlay.content && Object.keys(overlay.content).length} fields
              </div>
              <div className="text-gray-500 text-xs">
                {overlay.chatMessages?.length || 0} chat messages
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded">
        💡 <strong>Tip:</strong> Click an overlay to select it for use. Press Ctrl+Click (Cmd+Click on Mac) to edit overlay content and chat messages.
      </div>

      <OverlayEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingOverlay(null);
        }}
        overlay={editingOverlay}
        onSave={handleSaveOverlay}
      />
    </div>
  );
};

export default OverlayGrid;