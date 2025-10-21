/**
 * Hot Cues Panel Component
 * 8-button pad for hot cue management
 */

import React from 'react';
import { HotCue } from '../utils/hotCues';

interface HotCuesPanelProps {
  cues: HotCue[];
  currentTime: number;
  duration: number;
  onJumpToCue: (cueId: number) => void;
  onSetCue: (cueId: number, time: number) => void;
  onDeleteCue: (cueId: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function HotCuesPanel({
  cues,
  currentTime,
  duration,
  onJumpToCue,
  onSetCue,
  onDeleteCue,
  isLoading = false,
  className = '',
}: HotCuesPanelProps) {
  const getCue = (id: number): HotCue | undefined => cues.find((c) => c.id === id);

  const handleCueClick = (cueId: number) => {
    const cue = getCue(cueId);
    if (cue) {
      onJumpToCue(cueId);
    } else {
      onSetCue(cueId, currentTime);
    }
  };

  const handleCueRightClick = (e: React.MouseEvent, cueId: number) => {
    e.preventDefault();
    const cue = getCue(cueId);
    if (cue) {
      onDeleteCue(cueId);
    }
  };

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">Hot Cues</h3>
        <p className="text-xs text-gray-500">
          Click to jump • Shift+1-8 to set • Right-click to delete
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((id) => {
          const cue = getCue(id);
          const isSet = !!cue;

          return (
            <button
              key={id}
              onClick={() => handleCueClick(id)}
              onContextMenu={(e) => handleCueRightClick(e, id)}
              disabled={isLoading}
              className="relative group"
              title={isSet ? `Jump to ${cue.label} (${formatTime(cue.time)})` : `Set cue ${id + 1}`}
            >
              <div
                className={`
                  aspect-square rounded-lg font-mono font-bold text-sm
                  transition-all duration-150
                  ${isSet ? 'border-2' : 'border border-dashed'}
                  ${
                    isSet
                      ? 'bg-opacity-20 hover:bg-opacity-30'
                      : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                style={{
                  backgroundColor: isSet ? cue.color : undefined,
                  borderColor: isSet ? cue.color : undefined,
                  color: isSet ? cue.color : '#6b7280',
                }}
              >
                <div className="h-full flex flex-col items-center justify-center p-2">
                  <div className="text-lg">{id + 1}</div>
                  {isSet && (
                    <div className="text-xs opacity-80 truncate max-w-full mt-1">
                      {formatTime(cue.time)}
                    </div>
                  )}
                </div>

                {/* Delete indicator on hover */}
                {isSet && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Keyboard shortcuts reminder */}
      <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Jump to cue:</span>
          <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">1-8</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Set cue:</span>
          <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Shift+1-8</kbd>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
