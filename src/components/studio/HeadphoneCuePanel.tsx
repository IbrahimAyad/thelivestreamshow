/**
 * Headphone Cue Panel
 * Professional DJ pre-listening controls
 */

import { Headphones, Volume2, SplitSquareVertical } from 'lucide-react';
import { HeadphoneCueConfig } from '@/utils/studio/headphoneCue';

interface HeadphoneCuePanelProps {
  config: HeadphoneCueConfig;
  onToggleEnabled: () => void;
  onMixLevelChange: (level: number) => void;
  onToggleSplitCue: () => void;
  onVolumeChange: (volume: number) => void;
  isReady: boolean;
  className?: string;
}

export function HeadphoneCuePanel({
  config,
  onToggleEnabled,
  onMixLevelChange,
  onToggleSplitCue,
  onVolumeChange,
  isReady,
  className = '',
}: HeadphoneCuePanelProps) {
  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <Headphones className="w-4 h-4" />
          Headphone Cue
        </h3>
        <p className="text-xs text-gray-500">
          Pre-listen tracks before playing them live
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-4">
        <button
          onClick={onToggleEnabled}
          disabled={!isReady}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
            config.enabled
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {config.enabled ? 'Headphone Cue: ON' : 'Headphone Cue: OFF'}
        </button>
      </div>

      {/* Cue Mode Toggle */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Cue Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onToggleSplitCue()}
            disabled={!config.enabled}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              config.splitCue
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split</span>
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">L=Cue R=Master</div>
          </button>
          <button
            onClick={() => onToggleSplitCue()}
            disabled={!config.enabled}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              !config.splitCue
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Mix</span>
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">Blend Both</div>
          </button>
        </div>
      </div>

      {/* Cue/Master Mix (only in Mix mode) */}
      {!config.splitCue && config.enabled && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Cue/Master Mix
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={config.mixLevel * 100}
              onChange={(e) => onMixLevelChange(parseFloat(e.target.value) / 100)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span className={config.mixLevel < 0.5 ? 'text-cyan-400 font-medium' : ''}>
                Full Cue
              </span>
              <span className="text-gray-400 font-mono">
                {Math.round(config.mixLevel * 100)}%
              </span>
              <span className={config.mixLevel >= 0.5 ? 'text-cyan-400 font-medium' : ''}>
                Full Master
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Headphone Volume */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center justify-between">
          <span>Headphone Volume</span>
          <span className="text-cyan-400 font-mono">{Math.round(config.volume * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.volume * 100}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
          disabled={!config.enabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Info/Tips */}
      <div className="p-3 bg-gray-800 rounded-lg text-xs text-gray-400 space-y-2">
        <div className="font-medium text-gray-300">💡 Pro Tips:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            <strong>Split Mode:</strong> Left ear = Cue track, Right ear = Master output
          </li>
          <li>
            <strong>Mix Mode:</strong> Blend cue and master in both ears
          </li>
          <li>Preview next track while current track plays live</li>
          <li>Perfect for beatmatching and song selection</li>
        </ul>
      </div>

      {!isReady && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-800 rounded text-xs text-yellow-400">
          ⚠️ Audio context not ready. Load a track to enable headphone cue.
        </div>
      )}
    </div>
  );
}
