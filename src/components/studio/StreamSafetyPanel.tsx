/**
 * Phase 7C - Stream Safety Panel
 * 
 * Bulk tagging and management of stream-safe music tracks
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '../types/database';

type MusicTrack = Database['public']['Tables']['music_library']['Row'];

export function StreamSafetyPanel() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'stream_safe' | 'unsafe' | 'unknown'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [streamMode, setStreamMode] = useState<boolean>(() => {
    return localStorage.getItem('streamSafeMode') === 'true';
  });

  useEffect(() => {
    loadTracks();
  }, [filter]);

  useEffect(() => {
    localStorage.setItem('streamSafeMode', streamMode.toString());
  }, [streamMode]);

  const loadTracks = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('music_library').select('*');

      if (filter === 'stream_safe') {
        query = query.eq('is_stream_safe', true);
      } else if (filter === 'unsafe') {
        query = query.or('license_type.eq.copyrighted,license_type.eq.personal_use');
      } else if (filter === 'unknown') {
        query = query.is('license_type', null);
      }

      const { data, error } = await query.order('title');

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrack = (id: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTracks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTracks.size === tracks.length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(tracks.map(t => t.id)));
    }
  };

  const handleBulkUpdate = async (
    updates: Partial<Pick<MusicTrack, 'is_stream_safe' | 'license_type'>>
  ) => {
    if (selectedTracks.size === 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('music_library')
        .update(updates)
        .in('id', Array.from(selectedTracks));

      if (error) throw error;

      await loadTracks();
      setSelectedTracks(new Set());
      console.log(`Updated ${selectedTracks.size} tracks`);
    } catch (error) {
      console.error('Failed to bulk update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLicenseBadge = (track: MusicTrack) => {
    if (track.is_stream_safe) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
          <CheckCircle className="w-3 h-3" />
          Stream Safe
        </span>
      );
    }

    switch (track.license_type) {
      case 'royalty_free':
      case 'creative_commons':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
            <CheckCircle className="w-3 h-3" />
            {track.license_type === 'royalty_free' ? 'Royalty Free' : 'CC License'}
          </span>
        );
      case 'personal_use':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
            <AlertTriangle className="w-3 h-3" />
            Personal Use
          </span>
        );
      case 'copyrighted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
            <XCircle className="w-3 h-3" />
            Copyrighted
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded text-xs">
            Unknown
          </span>
        );
    }
  };

  const stats = {
    total: tracks.length,
    safe: tracks.filter(t => t.is_stream_safe || t.license_type === 'royalty_free' || t.license_type === 'creative_commons').length,
    unsafe: tracks.filter(t => t.license_type === 'copyrighted' || t.license_type === 'personal_use').length,
    unknown: tracks.filter(t => !t.license_type).length,
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-medium text-white">Stream-Safe Music System</h3>
        </div>
        <button
          onClick={() => setStreamMode(!streamMode)}
          className={
            streamMode
              ? 'px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors'
              : 'px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-medium transition-colors'
          }
        >
          Stream Mode: {streamMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2 bg-zinc-800 rounded text-center">
          <div className="text-xs text-zinc-400">Total</div>
          <div className="text-lg font-semibold text-white">{stats.total}</div>
        </div>
        <div className="p-2 bg-green-900/20 rounded text-center">
          <div className="text-xs text-green-400">Safe</div>
          <div className="text-lg font-semibold text-green-400">{stats.safe}</div>
        </div>
        <div className="p-2 bg-red-900/20 rounded text-center">
          <div className="text-xs text-red-400">Unsafe</div>
          <div className="text-lg font-semibold text-red-400">{stats.unsafe}</div>
        </div>
        <div className="p-2 bg-zinc-800 rounded text-center">
          <div className="text-xs text-zinc-400">Unknown</div>
          <div className="text-lg font-semibold text-zinc-400">{stats.unknown}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setFilter('all')}
          className={
            filter === 'all'
              ? 'px-3 py-1.5 bg-blue-600 text-white rounded text-xs'
              : 'px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded text-xs hover:bg-zinc-600'
          }
        >
          All
        </button>
        <button
          onClick={() => setFilter('stream_safe')}
          className={
            filter === 'stream_safe'
              ? 'px-3 py-1.5 bg-green-600 text-white rounded text-xs'
              : 'px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded text-xs hover:bg-zinc-600'
          }
        >
          Stream Safe
        </button>
        <button
          onClick={() => setFilter('unsafe')}
          className={
            filter === 'unsafe'
              ? 'px-3 py-1.5 bg-red-600 text-white rounded text-xs'
              : 'px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded text-xs hover:bg-zinc-600'
          }
        >
          Unsafe
        </button>
        <button
          onClick={() => setFilter('unknown')}
          className={
            filter === 'unknown'
              ? 'px-3 py-1.5 bg-zinc-600 text-white rounded text-xs'
              : 'px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded text-xs hover:bg-zinc-600'
          }
        >
          Unknown
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedTracks.size > 0 && (
        <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500 rounded">
          <div className="text-xs text-blue-200 mb-2">
            {selectedTracks.size} track(s) selected
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleBulkUpdate({ is_stream_safe: true, license_type: 'royalty_free' })}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
            >
              Mark Stream Safe
            </button>
            <button
              onClick={() => handleBulkUpdate({ license_type: 'creative_commons' })}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
            >
              CC License
            </button>
            <button
              onClick={() => handleBulkUpdate({ license_type: 'personal_use' })}
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
            >
              Personal Use
            </button>
            <button
              onClick={() => handleBulkUpdate({ is_stream_safe: false, license_type: 'copyrighted' })}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
            >
              Copyrighted
            </button>
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-zinc-400">Loading...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">No tracks found</div>
        ) : (
          <>
            <div className="mb-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {selectedTracks.size === tracks.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={
                    selectedTracks.has(track.id)
                      ? 'p-2 bg-blue-900/30 border border-blue-500 rounded cursor-pointer'
                      : 'p-2 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer'
                  }
                  onClick={() => handleSelectTrack(track.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{track.title}</div>
                      {track.copyright_notes && (
                        <div className="text-xs text-zinc-400 truncate">{track.copyright_notes}</div>
                      )}
                    </div>
                    <div className="ml-2">{getLicenseBadge(track)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
