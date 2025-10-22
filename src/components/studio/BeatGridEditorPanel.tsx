/**
 * Beat Grid Editor Panel
 * Professional beat grid editing and tempo mapping
 */

import { Grid3x3, Lock, Unlock, ArrowLeft, ArrowRight, Radio } from 'lucide-react';
import { BeatGrid } from '@/utils/studio/beatGridEditor';

interface BeatGridEditorPanelProps {
  grid: BeatGrid | null;
  isEditing: boolean;
  tapBPM: number | null;
  tapCount: number;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onSetBPM: (bpm: number) => void;
  onNudgeLeft: () => void;
  onNudgeRight: () => void;
  onTapTempo: () => void;
  onResetTapTempo: () => void;
  onToggleLock: () => void;
  onReset: () => void;
  className?: string;
}

export function BeatGridEditorPanel({
  grid,
  isEditing,
  tapBPM,
  tapCount,
  onStartEditing,
  onStopEditing,
  onSetBPM,
  onNudgeLeft,
  onNudgeRight,
  onTapTempo,
  onResetTapTempo,
  onToggleLock,
  onReset,
  className = '',
}: BeatGridEditorPanelProps) {
  if (!grid) return null;

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <Grid3x3 className="w-4 h-4" />
          Beat Grid Editor
        </h3>
        <p className="text-xs text-gray-500">
          Manual beat grid adjustment and tempo mapping
        </p>
      </div>

      {/* Edit Mode Toggle */}
      <div className="mb-4">
        <button
          onClick={isEditing ? onStopEditing : onStartEditing}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
            isEditing
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {isEditing ? 'Stop Editing' : 'Start Editing'}
        </button>
      </div>

      {/* BPM Control */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          BPM
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={Math.round(grid.bpm)}
            onChange={(e) => onSetBPM(parseFloat(e.target.value))}
            disabled={grid.isLocked}
            min="60"
            max="200"
            step="0.1"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-gray-500 font-mono">{grid.bpm.toFixed(2)}</span>
        </div>
      </div>

      {/* Tap Tempo */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center justify-between">
          <span>Tap Tempo</span>
          {tapBPM && (
            <span className="text-cyan-400 font-mono">{tapBPM} BPM</span>
          )}
        </label>
        <div className="flex gap-2">
          <button
            onClick={onTapTempo}
            disabled={grid.isLocked}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              tapCount > 0
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30 animate-pulse'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-center gap-2">
              <Radio className="w-4 h-4" />
              <span>Tap ({tapCount}/4)</span>
            </div>
          </button>
          <button
            onClick={onResetTapTempo}
            disabled={tapCount === 0}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Nudge Controls */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Nudge Beat Grid
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onNudgeLeft}
            disabled={grid.isLocked}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>-10ms</span>
          </button>
          <button
            onClick={onNudgeRight}
            disabled={grid.isLocked}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>+10ms</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lock/Unlock */}
      <div className="mb-4">
        <button
          onClick={onToggleLock}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            grid.isLocked
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {grid.isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Beat Grid Locked</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              <span>Beat Grid Unlocked</span>
            </>
          )}
        </button>
      </div>

      {/* Grid Info */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-gray-500">Total Beats:</div>
            <div className="text-white font-mono">{grid.beats.length}</div>
          </div>
          <div>
            <div className="text-gray-500">Offset:</div>
            <div className="text-white font-mono">{grid.offset.toFixed(3)}s</div>
          </div>
          <div>
            <div className="text-gray-500">BPM:</div>
            <div className="text-cyan-400 font-mono">{grid.bpm.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500">Confidence:</div>
            <div className="text-green-400 font-mono">{Math.round(grid.confidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      {isEditing && (
        <div className="p-3 bg-gray-800 rounded-lg text-xs text-gray-400 space-y-2">
          <div className="font-medium text-gray-300">💡 Editing Tips:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Click waveform to add beat markers</li>
            <li>Right-click markers to remove them</li>
            <li>Use nudge to fine-tune alignment</li>
            <li>Tap tempo for quick BPM detection</li>
            <li>Lock grid when satisfied</li>
          </ul>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full mt-3 py-2 px-4 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg text-sm font-medium border border-red-800"
      >
        Reset to Auto-Detected Grid
      </button>
    </div>
  );
}
