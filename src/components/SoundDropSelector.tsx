/**
 * Sound Drop Selector Component
 * 
 * Allows users to browse and select sound drops from the music library
 * for assignment to broadcast graphics overlays.
 * 
 * Features:
 * - Categorized sound drops (INTRO, OUTRO, STINGER, CUSTOM)
 * - Search/filter functionality
 * - Preview playback
 * - Clean selection UI
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { audioLayerManager } from '../utils/audio/audioLayerManager';
import type { Database } from '../types/database';

type MusicTrack = Database['public']['Tables']['music_library']['Row'];

interface SoundDropSelectorProps {
  selectedSoundDropId: string | null;
  onSelect: (soundDropId: string, soundDrop: MusicTrack) => void;
  onRemove: () => void;
}

export const SoundDropSelector: React.FC<SoundDropSelectorProps> = ({
  selectedSoundDropId,
  onSelect,
  onRemove,
}) => {
  const [soundDrops, setSoundDrops] = useState<MusicTrack[]>([]);
  const [filteredSoundDrops, setFilteredSoundDrops] = useState<MusicTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<MusicTrack | null>(null);

  // Fetch sound drops from database
  useEffect(() => {
    fetchSoundDrops();
  }, []);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSoundDrops(soundDrops);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = soundDrops.filter(drop =>
        drop.title.toLowerCase().includes(query) ||
        (drop.jingle_type && drop.jingle_type.toLowerCase().includes(query))
      );
      setFilteredSoundDrops(filtered);
    }
  }, [searchQuery, soundDrops]);

  // Load selected sound drop details
  useEffect(() => {
    if (selectedSoundDropId) {
      const drop = soundDrops.find(d => d.id === selectedSoundDropId);
      setSelectedDrop(drop || null);
    } else {
      setSelectedDrop(null);
    }
  }, [selectedSoundDropId, soundDrops]);

  const fetchSoundDrops = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('music_library')
        .select('*')
        .eq('category', 'jingle')
        .order('jingle_type', { ascending: true })
        .order('title', { ascending: true });

      if (fetchError) throw fetchError;

      setSoundDrops(data || []);
      setFilteredSoundDrops(data || []);
    } catch (err) {
      console.error('Error fetching sound drops:', err);
      setError('Failed to load sound drops');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (soundDrop: MusicTrack) => {
    if (previewingId === soundDrop.id) {
      // Stop preview
      audioLayerManager.stopAllSounds();
      setPreviewingId(null);
    } else {
      // Start preview
      setPreviewingId(soundDrop.id);
      await audioLayerManager.previewSound(soundDrop.id, 3000);
      
      // Auto-stop preview indicator after 3 seconds
      setTimeout(() => {
        setPreviewingId(null);
      }, 3000);
    }
  };

  const handleSelect = (soundDrop: MusicTrack) => {
    onSelect(soundDrop.id, soundDrop);
    setSearchQuery(''); // Clear search after selection
  };

  // Group sound drops by jingle_type
  const groupedSoundDrops = filteredSoundDrops.reduce((acc, drop) => {
    const type = drop.jingle_type || 'custom';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(drop);
    return acc;
  }, {} as Record<string, MusicTrack[]>);

  const jingleTypes = Object.keys(groupedSoundDrops).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchSoundDrops}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Sound Display */}
      {selectedDrop && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-blue-900">
                Selected: {selectedDrop.title}
              </p>
              <p className="text-sm text-blue-700">
                {selectedDrop.jingle_type && (
                  <span className="uppercase mr-2">{selectedDrop.jingle_type}</span>
                )}
                {selectedDrop.duration && (
                  <span>Duration: {selectedDrop.duration}s</span>
                )}
              </p>
            </div>
            <button
              onClick={onRemove}
              className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sound drops..."
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
      </div>

      {/* Sound Drops List */}
      <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto bg-white">
        {jingleTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sound drops found{searchQuery && ' matching your search'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jingleTypes.map(type => (
              <div key={type} className="p-2">
                {/* Category Header */}
                <div className="sticky top-0 bg-gray-100 px-3 py-2 font-semibold text-sm text-gray-700 uppercase tracking-wide">
                  ▼ {type}
                </div>

                {/* Sound Drops in Category */}
                <div className="space-y-1 mt-2">
                  {groupedSoundDrops[type].map(drop => (
                    <div
                      key={drop.id}
                      className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded transition-colors ${
                        selectedSoundDropId === drop.id ? 'bg-blue-50 border border-blue-300' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {drop.title}
                        </p>
                        {drop.duration && (
                          <p className="text-xs text-gray-500">
                            {drop.duration}s
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {/* Preview Button */}
                        <button
                          onClick={() => handlePreview(drop)}
                          disabled={previewingId !== null && previewingId !== drop.id}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            previewingId === drop.id
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Preview sound (3 seconds)"
                        >
                          {previewingId === drop.id ? '⏸' : '▶'}
                        </button>

                        {/* Select Button */}
                        {selectedSoundDropId === drop.id ? (
                          <span className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
                            Selected ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelect(drop)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="text-sm text-gray-600 text-center">
        {filteredSoundDrops.length} sound drop{filteredSoundDrops.length !== 1 ? 's' : ''} available
        {searchQuery && ` (filtered from ${soundDrops.length} total)`}
      </div>
    </div>
  );
};
