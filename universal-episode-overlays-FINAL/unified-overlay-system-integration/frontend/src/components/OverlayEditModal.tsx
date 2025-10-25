import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  const [activeTab, setActiveTab] = useState<'content' | 'chat'>('content');

  useEffect(() => {
    if (overlay) {
      setContent(overlay.content || {});
      setChatMessages(overlay.chatMessages || []);
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
      await onSave(overlay.id, content, chatMessages);
      onClose();
    } catch (error) {
      console.error('Error saving overlay:', error);
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
            Edit Overlay: {overlay.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'content'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Content Fields
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'chat'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chat Messages ({chatMessages.length})
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
              ))}
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