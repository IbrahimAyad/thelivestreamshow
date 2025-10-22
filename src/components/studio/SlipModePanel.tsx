/**
 * Slip Mode Panel
 * Control slip mode for maintaining playback timeline
 */

import { Timer, Play } from 'lucide-react';
import { SlipState } from '@/utils/studio/slipMode';

interface SlipModePanelProps {
  slipState: SlipState;
  slipOffset: number;
  onToggle: () => void;
  className?: string;
}

export function SlipModePanel({
  slipState,
  slipOffset,
  onToggle,
  className = '',
}: SlipModePanelProps) {
  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <Timer className="w-4 h-4" />
          Slip Mode
        </h3>
        <p className="text-xs text-gray-500">
          Play effects while maintaining timeline
        </p>
      </div>

      {/* Toggle */}
      <div className="mb-4">
        <button
          onClick={onToggle}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
            slipState.isActive
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {slipState.isActive ? 'Slip Mode: ON' : 'Slip Mode: OFF'}
        </button>
      </div>

      {/* Slip Status */}
      {slipState.isActive && (
        <div className="space-y-3">
          {/* Virtual Position */}
          <div className="p-3 bg-gray-800 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Virtual Position:</span>
              <span className="text-sm font-mono text-purple-400">
                {formatTime(slipState.virtualPosition)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Slip Offset:</span>
              <span className="text-sm font-mono text-cyan-400">
                {slipOffset > 0 ? '+' : ''}{slipOffset.toFixed(2)}s
              </span>
            </div>
          </div>

          {/* Indicator */}
          <div className="flex items-center gap-2 p-2 bg-purple-900/20 border border-purple-500 rounded-lg">
            <Play className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-xs text-purple-400 font-medium">
              Timeline preserved - press again to return
            </span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400 space-y-2">
        <div className="font-medium text-gray-300">💡 Slip Mode:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Play hot cues without losing your place</li>
          <li>Perform loops while track continues</li>
          <li>Scratch and return to virtual position</li>
          <li>Perfect for live performances</li>
        </ul>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
