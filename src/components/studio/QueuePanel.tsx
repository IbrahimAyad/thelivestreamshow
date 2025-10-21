import React from 'react';
import type { QueuedTrack } from '@/hooks/studio/usePlayQueue';

interface QueuePanelProps {
  queue: QueuedTrack[];
  history: any[];
  nextTrack: QueuedTrack | null;
  queueStats: {
    totalTracks: number;
    totalDuration: number;
    averageScore: number;
  };
  autoAdvanceEnabled: boolean;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onMoveToFront: (index: number) => void;
  onToggleAutoAdvance: (enabled: boolean) => void;
}

export function QueuePanel({
  queue,
  history,
  nextTrack,
  queueStats,
  autoAdvanceEnabled,
  onRemoveFromQueue,
  onClearQueue,
  onMoveToFront,
  onToggleAutoAdvance,
}: QueuePanelProps) {
  // Format duration in seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format total queue duration
  const formatTotalDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Play Queue</h3>
        </div>
        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Queue Stats */}
      {queue.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Tracks</div>
            <div className="text-lg font-bold text-white">{queueStats.totalTracks}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Duration</div>
            <div className="text-lg font-bold text-white">{formatTotalDuration(queueStats.totalDuration)}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Avg Score</div>
            <div className="text-lg font-bold text-white">{queueStats.averageScore > 0 ? Math.round(queueStats.averageScore) : '—'}</div>
          </div>
        </div>
      )}

      {/* Auto-Advance Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm text-gray-300">Auto-Advance</span>
        </div>
        <button
          onClick={() => onToggleAutoAdvance(!autoAdvanceEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            autoAdvanceEnabled ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              autoAdvanceEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Next Up */}
      {nextTrack && (
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-400 mb-2">NEXT UP</div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{nextTrack.track.title}</div>
                <div className="text-sm text-gray-400 truncate">{nextTrack.track.artist || 'Unknown Artist'}</div>
                {nextTrack.reason && (
                  <div className="text-xs text-blue-300 mt-1">{nextTrack.reason}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {nextTrack.score !== undefined && (
                  <div className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded">
                    {Math.round(nextTrack.score)}
                  </div>
                )}
                {nextTrack.track.duration && (
                  <div className="text-xs text-gray-400">
                    {formatDuration(nextTrack.track.duration)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      {queue.length > 1 ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-400 mb-2">UPCOMING ({queue.length - 1})</div>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {queue.slice(1).map((item, index) => {
              const actualIndex = index + 1;
              return (
                <div
                  key={actualIndex}
                  className="group bg-gray-700/30 hover:bg-gray-700/50 rounded-lg p-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-xs text-gray-500 font-mono pt-1 w-6 text-center">
                        {actualIndex}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{item.track.title}</div>
                        <div className="text-xs text-gray-400 truncate">{item.track.artist || 'Unknown'}</div>
                        {item.reason && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{item.reason}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.score !== undefined && (
                        <div className="px-2 py-0.5 bg-gray-600/50 text-gray-300 text-xs font-medium rounded">
                          {Math.round(item.score)}
                        </div>
                      )}
                      <button
                        onClick={() => onMoveToFront(actualIndex)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-600/50 rounded transition-all"
                        title="Play next"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onRemoveFromQueue(actualIndex)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded transition-all"
                        title="Remove"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-400">Queue is empty</p>
          <p className="text-xs text-gray-500 mt-1">Auto-DJ will suggest tracks as you play</p>
        </div>
      ) : null}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="text-xs font-medium text-gray-400 mb-3">RECENTLY PLAYED</div>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {history.slice(0, 5).map((track, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span className="truncate">{track.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
