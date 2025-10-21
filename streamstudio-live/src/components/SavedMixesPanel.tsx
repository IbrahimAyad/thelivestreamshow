import React, { useState } from 'react';
import { useSavedMixes } from '../hooks/useSavedMixes';
import { useMusicLibrary } from '../hooks/useMusicLibrary';

export function SavedMixesPanel() {
  const { mixes, loading, createMix, deleteMix } = useSavedMixes();
  const { tracks } = useMusicLibrary();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mixName, setMixName] = useState('');
  const [mixDescription, setMixDescription] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  const handleCreateMix = async () => {
    if (!mixName.trim() || selectedTrackIds.length === 0) {
      alert('Please enter a mix name and select at least one track');
      return;
    }

    const result = await createMix(mixName, mixDescription, selectedTrackIds);
    
    if (result.success) {
      setMixName('');
      setMixDescription('');
      setSelectedTrackIds([]);
      setShowCreateForm(false);
    } else {
      alert(`Error creating mix: ${result.error}`);
    }
  };

  const handleDeleteMix = async (id: string, name: string) => {
    if (!confirm(`Delete mix "${name}"?`)) return;
    
    const result = await deleteMix(id);
    if (!result.success) {
      alert(`Error deleting mix: ${result.error}`);
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds(prev => 
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-neutral-300">Loading saved mixes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Saved Mixes</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-sm font-medium transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create Mix'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-neutral-700 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Mix Name</label>
            <input
              type="text"
              value={mixName}
              onChange={(e) => setMixName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white"
              placeholder="Enter mix name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
            <textarea
              value={mixDescription}
              onChange={(e) => setMixDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white"
              placeholder="Enter description (optional)"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Select Tracks ({selectedTrackIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto bg-neutral-800 rounded border border-neutral-600 p-2 space-y-1">
              {tracks.length === 0 ? (
                <p className="text-neutral-400 text-sm p-2">No tracks available</p>
              ) : (
                tracks.map(track => (
                  <label
                    key={track.id}
                    className="flex items-center gap-2 p-2 hover:bg-neutral-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTrackIds.includes(track.id)}
                      onChange={() => toggleTrackSelection(track.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-white">
                      {track.title} {track.artist && <span className="text-neutral-400">- {track.artist}</span>}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleCreateMix}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
          >
            Save Mix
          </button>
        </div>
      )}

      <div className="space-y-2">
        {mixes.length === 0 ? (
          <p className="text-neutral-400 text-center py-8">No saved mixes yet. Create your first mix for AI Director!</p>
        ) : (
          mixes.map(mix => (
            <div key={mix.id} className="bg-neutral-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-white font-medium">{mix.name}</h4>
                {mix.description && (
                  <p className="text-sm text-neutral-400 mt-1">{mix.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-neutral-400">
                  <span>{mix.track_ids.length} tracks</span>
                  {mix.duration_seconds && (
                    <span>{Math.floor(mix.duration_seconds / 60)}:{(mix.duration_seconds % 60).toString().padStart(2, '0')}</span>
                  )}
                  <span className="text-neutral-500">ID: {mix.id.substring(0, 8)}...</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteMix(mix.id, mix.name)}
                className="px-3 py-1 text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {mixes.length > 0 && (
        <div className="bg-neutral-700 rounded-lg p-4 mt-4">
          <h4 className="text-white font-medium mb-2">AI Director API Endpoints</h4>
          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-cyan-400">GET</span>
              <span className="text-neutral-300 ml-2">/functions/v1/get-mixes</span>
            </div>
            <div>
              <span className="text-green-400">POST</span>
              <span className="text-neutral-300 ml-2">/functions/v1/trigger-mix</span>
              <span className="text-neutral-500 ml-2">{'{ "mix_id": "uuid" }'}</span>
            </div>
            <div>
              <span className="text-green-400">POST</span>
              <span className="text-neutral-300 ml-2">/functions/v1/trigger-sound</span>
              <span className="text-neutral-500 ml-2">{'{ "friendly_name": "name" }'}</span>
            </div>
            <div>
              <span className="text-cyan-400">GET</span>
              <span className="text-neutral-300 ml-2">/functions/v1/get-dj-status</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
