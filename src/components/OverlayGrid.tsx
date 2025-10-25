import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import OverlayEditModal from './OverlayEditModal';

// ✅ Updated to match broadcast_graphics table schema with sound integration
interface Overlay {
  id: string;
  graphic_type: string;  // e.g., 'brb', 'starting_soon', 'pi_namecard_overlay'
  is_visible: boolean;
  html_file: string;      // e.g., '/stream-brb-screen.html'
  position: string;       // e.g., 'fullscreen'
  config: {
    name?: string;
    description?: string;
    [key: string]: any;
  };
  display_mode?: string | null;
  z_index?: number | null;
  sound_drop_id?: string | null;
  auto_play_sound?: boolean | null;
  created_at?: string;
  updated_at?: string;
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
      // ✅ Query broadcast_graphics table directly
      const { data, error } = await supabase
        .from('broadcast_graphics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('[OverlayGrid] Loaded overlays:', data?.length || 0);
      setOverlays(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching overlays:', error);
      setOverlays([]); // ✅ Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = async (overlay: Overlay, event: React.MouseEvent) => {
    // If Ctrl+Click or Cmd+Click, open edit modal
    if (event.ctrlKey || event.metaKey) {
      setEditingOverlay(overlay);
      setIsEditModalOpen(true);
      return;
    }

    // Regular click - broadcast overlay (show it live)
    try {
      console.log('[OverlayGrid] Broadcasting overlay:', overlay.graphic_type);
      
      const displayMode = overlay.display_mode || 'exclusive';
      
      // ✅ Step 1: Hide other overlays ONLY if this is exclusive mode
      if (displayMode === 'exclusive') {
        const { error: hideError } = await supabase
          .from('broadcast_graphics')
          .update({ is_visible: false })
          .neq('id', overlay.id);
        
        if (hideError) {
          console.error('Error hiding overlays:', hideError);
        }
      }
      // For overlay and background modes, keep other overlays visible
      
      // ✅ Step 2: Show clicked overlay
      const { error: showError } = await supabase
        .from('broadcast_graphics')
        .update({ is_visible: true })
        .eq('id', overlay.id);
      
      if (showError) {
        console.error('Error showing overlay:', showError);
        throw showError;
      }
      
      console.log(`✅ [OverlayGrid] Overlay now LIVE (${displayMode} mode):`, overlay.config?.name || overlay.graphic_type);
      
      // ✅ Step 3: Refresh grid to show updated state
      await fetchOverlays();
      
      // ✅ Step 4: Notify parent component
      if (onOverlaySelect) {
        onOverlaySelect(overlay.id);
      }
    } catch (error) {
      console.error('Error broadcasting overlay:', error);
      alert(`Failed to broadcast overlay. Error: ${error}`);
    }
  };

  const handleSaveOverlay = async (
    overlayId: string, 
    content: Record<string, any>, 
    chatMessages: ChatMessage[]
  ) => {
    try {
      // ✅ Update broadcast_graphics table config
      const { error } = await supabase
        .from('broadcast_graphics')
        .update({ 
          config: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', overlayId);

      if (error) throw error;
      
      console.log('[OverlayGrid] Updated overlay:', overlayId);
      // Refresh overlays
      await fetchOverlays();
    } catch (error) {
      console.error('Error updating overlay:', error);
      throw error;
    }
  };

  const hideAllOverlays = async () => {
    try {
      console.log('[OverlayGrid] Hiding all overlays');
      
      const { error } = await supabase
        .from('broadcast_graphics')
        .update({ is_visible: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
      
      if (error) throw error;
      
      console.log('✅ [OverlayGrid] All overlays hidden');
      await fetchOverlays();
    } catch (error) {
      console.error('Error hiding all overlays:', error);
    }
  };

  const createNewOverlay = async () => {
    const name = prompt('Enter overlay name (e.g., "Custom Alert"):');
    const graphicType = prompt('Enter graphic type (e.g., custom_alert, no spaces):');
    const htmlFile = prompt('Enter HTML file path (e.g., /custom-alert.html):');
    
    if (!name || !graphicType || !htmlFile) return;

    try {
      // ✅ Insert into broadcast_graphics table
      const { error } = await supabase
        .from('broadcast_graphics')
        .insert({
          graphic_type: graphicType,
          is_visible: false,
          html_file: htmlFile,
          position: 'fullscreen',
          config: {
            name: name,
            description: 'Custom overlay',
            audioEnabled: false
          }
        });

      if (error) throw error;
      
      console.log('[OverlayGrid] Created new overlay:', graphicType);
      // Refresh overlays
      await fetchOverlays();
    } catch (error) {
      console.error('Error creating overlay:', error);
      alert('Failed to create overlay. See console for details.');
    }
  };

  const getOverlayIcon = (type: string) => {
    // Map graphic_type to icons
    const iconMap: Record<string, string> = {
      'starting_soon': '⏰',
      'brb': '☕',
      'brb_tomato_game': '🍅',
      'tech_difficulties': '⚙️',
      'outro': '👋',
      'ai_dj_visualizer': '🎵',
      'poll': '📊',
      'award_show': '🏆',
      'finish_him': '⚔️',
      'new_member': '🎮',
      'rage_meter': '😡',
      'versus': '⚡',
      'milestone': '🎯',
      'chat_highlight': '💬',
      'pi_namecard_overlay': '🎬',
      'unified_overlay': '🌟',
      'out_of_context_background': '🎭',
      // New WebSocket-enabled overlays
      'alpha_wednesday_universal': '🔴',
      'alpha_wednesday_original_universal': '🟣',
      'the_live_stream_show': '📡'
    };
    return iconMap[type] || '📱';
  };

  const getDisplayModeBadge = (mode: string | null | undefined) => {
    const modeMap: Record<string, { label: string; color: string }> = {
      'exclusive': { label: 'FULL', color: 'bg-purple-600' },
      'overlay': { label: 'OVER', color: 'bg-blue-600' },
      'background': { label: 'BASE', color: 'bg-gray-600' },
    };
    
    const modeName = mode || 'exclusive';
    const badge = modeMap[modeName] || { label: 'FULL', color: 'bg-gray-600' };
    
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white ${badge.color}`}>
        {badge.label}
      </span>
    );
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
        <div className="flex gap-2">
          <button
            onClick={hideAllOverlays}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
          >
            🚫 Hide All
          </button>
          <button
            onClick={createNewOverlay}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm transition-colors"
          >
            + Create New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {Array.isArray(overlays) && overlays.length > 0 ? (
          overlays.map((overlay) => (
            <div
              key={overlay.id}
              onClick={(e) => handleOverlayClick(overlay, e)}
              className={`bg-gray-800 hover:bg-gray-700 border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                overlay.is_visible 
                  ? 'border-green-500 bg-green-900/20' 
                  : 'border-gray-600 hover:border-yellow-400'
              }`}
            >
              {/* Sound Indicator Badge - Top Right */}
              {overlay.sound_drop_id && (
                <div className="absolute top-2 right-2 text-lg" title="Sound configured">
                  🔊
                </div>
              )}
              
              <div className="text-center">
                <div className="text-3xl mb-2">{getOverlayIcon(overlay.graphic_type)}</div>
                <div className="text-white font-medium text-sm mb-1">
                  {overlay.config?.name || overlay.graphic_type}
                </div>
                <div className="text-gray-400 text-xs capitalize mb-2">
                  {overlay.graphic_type.replace(/_/g, ' ')}
                </div>
                
                {/* Display Mode and Z-Index Badge */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getDisplayModeBadge(overlay.display_mode)}
                  <span className="text-[10px] text-gray-500" title="Layer order (z-index)">
                    z:{overlay.z_index || 1000}
                  </span>
                </div>
                
                <div className="text-gray-500 text-xs truncate" title={overlay.html_file}>
                  {overlay.html_file}
                </div>
                
                {overlay.is_visible && (
                  <div className="text-green-400 text-xs mt-2 font-semibold flex items-center justify-center gap-1">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center text-gray-400 py-8">
            No overlays found. Create one to get started!
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded border border-gray-700">
        <div className="flex items-start gap-2">
          <span>💡</span>
          <div>
            <strong>Quick Guide:</strong>
            <ul className="mt-1 space-y-1">
              <li>• <strong>Click</strong> an overlay to broadcast it LIVE (shows on stream)</li>
              <li>• <strong>Ctrl+Click</strong> (Cmd+Click on Mac) to edit overlay settings</li>
              <li>• <strong>Green "LIVE" badge</strong> = currently broadcasting</li>
              <li>• <strong>Hide All button</strong> = turn off all overlays at once</li>
            </ul>
          </div>
        </div>
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