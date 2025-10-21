/**
 * Loop Controls Panel Component
 * Professional loop management with 1/2/4/8 bar loops
 */

import React from 'react';
import { Loop, LoopSize, getLoopProgress } from '@/utils/studio/loopControls';

interface LoopControlsPanelProps {
  loop: Loop | null;
  currentTime: number;
  onCreateLoop: (bars: LoopSize) => void;
  onToggleLoop: () => void;
  onHalveLoop: () => void;
  onDoubleLoop: () => void;
  onMoveLoopForward: () => void;
  onMoveLoopBackward: () => void;
  onClearLoop: () => void;
  beatGridAvailable: boolean;
  className?: string;
}

export function LoopControlsPanel({
  loop,
  currentTime,
  onCreateLoop,
  onToggleLoop,
  onHalveLoop,
  onDoubleLoop,
  onMoveLoopForward,
  onMoveLoopBackward,
  onClearLoop,
  beatGridAvailable,
  className = '',
}: LoopControlsPanelProps) {
  const loopProgress = loop ? getLoopProgress(currentTime, loop) : 0;
  const isLoopActive = loop?.isActive || false;

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">Loop Controls</h3>
        {!beatGridAvailable && (
          <p className="text-xs text-amber-500">
            Beatgrid not detected. Loops may not align to beats.
          </p>
        )}
      </div>

      {/* Loop size buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {([1, 2, 4, 8] as LoopSize[]).map((bars) => (
          <button
            key={bars}
            onClick={() => onCreateLoop(bars)}
            disabled={!beatGridAvailable}
            className={`
              px-3 py-2 rounded font-semibold text-sm transition-all
              ${
                loop?.bars === bars && isLoopActive
                  ? 'bg-cyan-600 text-white border-2 border-cyan-400'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={`Create ${bars} bar loop (Shift+${bars})`}
          >
            {bars} BAR
          </button>
        ))}
      </div>

      {/* Loop control buttons */}
      <div className="space-y-2">
        {/* Primary controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onToggleLoop}
            disabled={!beatGridAvailable}
            className={`
              px-3 py-2 rounded font-semibold text-sm transition-all
              ${
                isLoopActive
                  ? 'bg-cyan-600 text-white border-2 border-cyan-400'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Toggle loop on/off (L)"
          >
            {isLoopActive ? (
              <svg
                className="w-4 h-4 mx-auto"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 mx-auto"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>

          <button
            onClick={onHalveLoop}
            disabled={!loop || loop.bars <= 1}
            className="px-3 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            title="Halve loop size ([)"
          >
            1/2×
          </button>

          <button
            onClick={onDoubleLoop}
            disabled={!loop || loop.bars >= 8}
            className="px-3 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            title="Double loop size (])"
          >
            2×
          </button>
        </div>

        {/* Move controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onMoveLoopBackward}
            disabled={!loop}
            className="px-3 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-1"
            title="Move loop backward (Shift+[)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Move
          </button>

          <button
            onClick={onMoveLoopForward}
            disabled={!loop}
            className="px-3 py-2 rounded bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-1"
            title="Move loop forward (Shift+])"
          >
            Move
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Clear button */}
        {loop && (
          <button
            onClick={onClearLoop}
            className="w-full px-3 py-2 rounded bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50 text-sm font-semibold"
          >
            Clear Loop
          </button>
        )}
      </div>

      {/* Loop info */}
      {loop && (
        <div className="mt-3 p-3 bg-gray-800 rounded space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Loop:</span>
            <span className="text-cyan-400 font-mono">
              {formatTime(loop.startTime)} → {formatTime(loop.endTime)}
            </span>
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            <span>Size:</span>
            <span className="text-cyan-400 font-mono">{loop.bars} bars</span>
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            <span>Status:</span>
            <span className={isLoopActive ? 'text-green-400' : 'text-gray-500'}>
              {isLoopActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Progress bar */}
          {isLoopActive && (
            <div className="mt-2">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-100"
                  style={{ width: `${loopProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts */}
      <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Create loop:</span>
          <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Shift+1/2/4/8</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Toggle:</span>
          <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">L</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Resize:</span>
          <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">[ / ]</kbd>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}
