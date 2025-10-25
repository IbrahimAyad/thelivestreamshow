import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SoundDropSelector } from './SoundDropSelector';
import type { Database } from '../types/database';

type MusicTrack = Database['public']['Tables']['music_library']['Row'];

// ✅ Updated to match broadcast_graphics table schema with sound integration
interface Overlay {
  id: string;
  graphic_type: string;
  is_visible: boolean;
  html_file: string;
  position: string;
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

interface OverlayEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  overlay: Overlay | null;
  onSave: (overlayId: string, content: Record<string, any>, chatMessages: ChatMessage[]) => Promise<void>;
}

const OverlayEditModal: React.FC<OverlayEditModalProps> = ({
  isOpen,
  onClose,
  overlay,
  onSave
}) => {
  const [content, setContent] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'chat' | 'audio' | 'display'>('content');
  
  // Audio configuration state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedSoundDropId, setSelectedSoundDropId] = useState<string | null>(null);
  const [autoPlaySound, setAutoPlaySound] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [enableDucking, setEnableDucking] = useState(false);
  const [duckingLevel, setDuckingLevel] = useState(0.3);
  
  // Display configuration state
  const [displayMode, setDisplayMode] = useState<'exclusive' | 'overlay' | 'background'>('exclusive');
  const [zIndex, setZIndex] = useState(1000);

  useEffect(() => {
    if (overlay) {
      setContent(overlay.config || {});
      // Chat messages not used in broadcast_graphics
      setChatMessages([]);
      
      // Load audio configuration
      setAudioEnabled(!!overlay.sound_drop_id);
      setSelectedSoundDropId(overlay.sound_drop_id || null);
      setAutoPlaySound(overlay.auto_play_sound ?? true);
      
      // Load audio settings from config if available
      const audioConfig = overlay.config?.audio as any;
      if (audioConfig) {
        setAudioVolume(audioConfig.volume ?? 0.8);
        setEnableDucking(audioConfig.enable_ducking ?? false);
        setDuckingLevel(audioConfig.ducking_level ?? 0.3);
      }
      
      // Load display configuration
      setDisplayMode((overlay.display_mode as any) || 'exclusive');
      setZIndex(overlay.z_index || 1000);
    }
  }, [overlay]);

  const handleContentChange = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChatMessageChange = (index: number, field: string, value: any) => {
    setChatMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, [field]: value } : msg
    ));
  };

  const addChatMessage = () => {
    setChatMessages(prev => [...prev, {
      message_type: 'chat',
      message_text: '',
      display_order: prev.length,
      is_active: true,
      animation_type: 'slideInRight'
    }]);
  };

  const removeChatMessage = (index: number) => {
    setChatMessages(prev => prev.filter((_, i) => i !== index)
      .map((msg, i) => ({ ...msg, display_order: i })));
  };

  const handleSave = async () => {
    if (!overlay) return;
    
    setIsLoading(true);
    try {
      // Prepare audio configuration in config.audio
      const updatedConfig = {
        ...content,
        audio: {
          enabled: audioEnabled,
          volume: audioVolume,
          enable_ducking: enableDucking,
          ducking_level: duckingLevel,
        },
      };
      
      // Update overlay in database with all fields
      const { error } = await supabase
        .from('broadcast_graphics')
        .update({
          config: updatedConfig,
          sound_drop_id: audioEnabled ? selectedSoundDropId : null,
          auto_play_sound: audioEnabled ? autoPlaySound : false,
          display_mode: displayMode,
          z_index: zIndex,
          updated_at: new Date().toISOString(),
        })
        .eq('id', overlay.id);
      
      if (error) throw error;
      
      await onSave(overlay.id, updatedConfig, chatMessages);
      onClose();
    } catch (error) {
      console.error('Error saving overlay:', error);
      alert('Failed to save overlay configuration');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !overlay) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Edit Overlay: {overlay.config?.name || overlay.graphic_type}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'content'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Content Fields
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'chat'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chat Messages ({chatMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'audio'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔊 Audio {audioEnabled && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'display'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎨 Display Settings
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {activeTab === 'content' && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(content).map(([field, value]) => (
                <div key={field} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleContentChange(field, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
              
              {/* Add new field */}
              <div className="col-span-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    const fieldName = prompt('Enter field name:');
                    if (fieldName) {
                      handleContentChange(fieldName, '');
                    }
                  }}
                  className="text-yellow-400 hover:text-yellow-300 text-sm"
                >
                  + Add New Field
                </button>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Chat Messages</h3>
                <button
                  onClick={addChatMessage}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Add Message
                </button>
              </div>

              {chatMessages.map((message, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Message #{index + 1}</span>
                    <button
                      onClick={() => removeChatMessage(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select
                        value={message.message_type}
                        onChange={(e) => handleChatMessageChange(index, 'message_type', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      >
                        <option value="chat">Chat</option>
                        <option value="follower">Follower</option>
                        <option value="subscriber">Subscriber</option>
                        <option value="donation">Donation</option>
                        <option value="host">Host</option>
                        <option value="raid">Raid</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Animation</label>
                      <select
                        value={message.animation_type}
                        onChange={(e) => handleChatMessageChange(index, 'animation_type', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      >
                        <option value="slideInRight">Slide In Right</option>
                        <option value="slideInLeft">Slide In Left</option>
                        <option value="fadeIn">Fade In</option>
                        <option value="bounce">Bounce</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={message.is_active}
                        onChange={(e) => handleChatMessageChange(index, 'is_active', e.target.checked)}
                        className="mr-2"
                      />
                      <label className="text-xs text-gray-400">Active</label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Message Text</label>
                    <input
                      type="text"
                      value={message.message_text}
                      onChange={(e) => handleChatMessageChange(index, 'message_text', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="Enter chat message..."
                    />
                  </div>
                </div>
              ))} </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-white">🔊 Sound Configuration</h3>
                  <p className="text-sm text-gray-400 mt-1">Assign a sound drop to play when this overlay appears</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={audioEnabled}
                      onChange={(e) => setAudioEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-8 rounded-full transition-colors ${
                      audioEnabled ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                      audioEnabled ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                  <span className="ml-3 text-white font-medium">
                    {audioEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {audioEnabled && (
                <div className="space-y-4">
                  {/* Sound Drop Selector */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-3">Select Sound Drop</h4>
                    <SoundDropSelector
                      selectedSoundDropId={selectedSoundDropId}
                      onSelect={(soundDropId) => setSelectedSoundDropId(soundDropId)}
                      onRemove={() => setSelectedSoundDropId(null)}
                    />
                  </div>

                  {/* Auto-Play Toggle */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-white font-medium">Auto-Play on Visibility</span>
                        <p className="text-sm text-gray-400 mt-1">Sound will play automatically when overlay becomes visible</p>
                      </div>
                      <div className="relative ml-4">
                        <input
                          type="checkbox"
                          checked={autoPlaySound}
                          onChange={(e) => setAutoPlaySound(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-14 h-8 rounded-full transition-colors ${
                          autoPlaySound ? 'bg-green-600' : 'bg-gray-600'
                        }`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                          autoPlaySound ? 'transform translate-x-6' : ''
                        }`}></div>
                      </div>
                    </label>
                  </div>

                  {/* Volume Slider */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <label className="block text-white font-medium mb-3">
                      Volume: {Math.round(audioVolume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audioVolume}
                      onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Audio Ducking */}
                  <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-white font-medium">Enable Audio Ducking</span>
                        <p className="text-sm text-gray-400 mt-1">Reduces background music volume when this sound plays</p>
                      </div>
                      <div className="relative ml-4">
                        <input
                          type="checkbox"
                          checked={enableDucking}
                          onChange={(e) => setEnableDucking(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-14 h-8 rounded-full transition-colors ${
                          enableDucking ? 'bg-blue-600' : 'bg-gray-600'
                        }`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                          enableDucking ? 'transform translate-x-6' : ''
                        }`}></div>
                      </div>
                    </label>

                    {enableDucking && (
                      <div className="mt-4 pl-4 border-l-2 border-blue-600">
                        <label className="block text-white font-medium mb-3">
                          Ducking Level: {Math.round((1 - duckingLevel) * 100)}% of original volume
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.8"
                          step="0.05"
                          value={duckingLevel}
                          onChange={(e) => setDuckingLevel(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>No ducking (100%)</span>
                          <span>Heavy ducking (20%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!audioEnabled && (
                <div className="bg-gray-800 border-2 border-dashed border-gray-600 p-8 rounded-lg text-center">
                  <p className="text-gray-400 text-lg">Enable sound to configure audio settings</p>
                  <p className="text-gray-500 text-sm mt-2">Toggle the switch above to assign a sound drop to this overlay</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Display Mode Selection */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">🎨 Display Mode</h3>
                <p className="text-sm text-gray-400 mb-4">Controls how this overlay interacts with other overlays</p>
                
                <div className="space-y-3">
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    displayMode === 'exclusive'
                      ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      value="exclusive"
                      checked={displayMode === 'exclusive'}
                      onChange={(e) => {
                        setDisplayMode(e.target.value as any);
                        if (e.target.value === 'exclusive') setZIndex(1500);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-white">Exclusive Mode</div>
                      <div className="text-sm text-gray-400 mt-1">
                        Full-screen overlay that hides all other overlays when active.
                        Best for: Starting Soon, BRB screens, full-screen scenes.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    displayMode === 'overlay'
                      ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      value="overlay"
                      checked={displayMode === 'overlay'}
                      onChange={(e) => {
                        setDisplayMode(e.target.value as any);
                        if (e.target.value === 'overlay') setZIndex(7000);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-white">Overlay Mode</div>
                      <div className="text-sm text-gray-400 mt-1">
                        Transparent layer that displays over existing content.
                        Best for: Alerts, notifications, pop-ups, temporary messages.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    displayMode === 'background'
                      ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      value="background"
                      checked={displayMode === 'background'}
                      onChange={(e) => {
                        setDisplayMode(e.target.value as any);
                        if (e.target.value === 'background') setZIndex(500);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-white">Background Mode</div>
                      <div className="text-sm text-gray-400 mt-1">
                        Base layer that can be overlaid by other content.
                        Best for: Episode info, lower thirds, persistent elements.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Z-Index Configuration */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">Layer Order (Z-Index)</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Higher values appear on top. Range: 100-9999
                </p>
                
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="100"
                    max="9999"
                    value={zIndex}
                    onChange={(e) => setZIndex(parseInt(e.target.value) || 1000)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-300">
                      <strong>Recommended ranges:</strong>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                      <div>Background: 100-999</div>
                      <div>Exclusive: 1000-1999</div>
                      <div>Overlay: 5000-8999</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">Preview</h3>
                <div className="bg-gray-900 p-6 rounded border-2 border-gray-700 text-center">
                  <div className="inline-block">
                    <div className="text-yellow-400 text-5xl mb-2">
                      {displayMode === 'exclusive' && '🖼️'}
                      {displayMode === 'overlay' && '🎯'}
                      {displayMode === 'background' && '📄'}
                    </div>
                    <div className="text-white font-medium">{displayMode.toUpperCase()} MODE</div>
                    <div className="text-gray-400 text-sm mt-1">Layer: {zIndex}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverlayEditModal;