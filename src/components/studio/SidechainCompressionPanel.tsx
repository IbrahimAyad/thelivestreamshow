/**
 * Sidechain Compression Panel
 * Auto-duck music when mic is active
 */

import { Activity, Zap } from 'lucide-react';
import { SidechainConfig } from '@/utils/studio/sidechainCompression';
import { SIDECHAIN_PRESETS } from '@/utils/studio/sidechainCompression';

interface SidechainCompressionPanelProps {
  config: SidechainConfig;
  isDucking: boolean;
  onToggleEnabled: () => void;
  onThresholdChange: (threshold: number) => void;
  onRatioChange: (ratio: number) => void;
  onAttackChange: (attack: number) => void;
  onReleaseChange: (release: number) => void;
  onApplyPreset: (preset: keyof typeof SIDECHAIN_PRESETS) => void;
  className?: string;
}

export function SidechainCompressionPanel({
  config,
  isDucking,
  onToggleEnabled,
  onThresholdChange,
  onRatioChange,
  onAttackChange,
  onReleaseChange,
  onApplyPreset,
  className = '',
}: SidechainCompressionPanelProps) {
  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Sidechain Compression
        </h3>
        <p className="text-xs text-gray-500">
          Auto-duck music when microphone is active
        </p>
      </div>

      {/* Enable/Disable */}
      <div className="mb-4">
        <button
          onClick={onToggleEnabled}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
            config.enabled
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {config.enabled ? 'Sidechain: ON' : 'Sidechain: OFF'}
        </button>
      </div>

      {/* Ducking Indicator */}
      {config.enabled && (
        <div className={`mb-4 p-3 rounded-lg border transition-all ${
          isDucking
            ? 'bg-red-900/20 border-red-500 shadow-lg shadow-red-500/20'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isDucking ? 'text-red-400 animate-pulse' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${isDucking ? 'text-red-400' : 'text-gray-400'}`}>
              {isDucking ? 'Ducking Active' : 'Ready'}
            </span>
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SIDECHAIN_PRESETS) as Array<keyof typeof SIDECHAIN_PRESETS>).map((preset) => (
            <button
              key={preset}
              onClick={() => onApplyPreset(preset)}
              disabled={!config.enabled}
              className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium capitalize disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center justify-between">
          <span>Threshold</span>
          <span className="text-cyan-400 font-mono">{Math.round(config.threshold * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.threshold * 100}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value) / 100)}
          disabled={!config.enabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Sensitive</span>
          <span>Less Sensitive</span>
        </div>
      </div>

      {/* Duck Amount (Ratio) */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center justify-between">
          <span>Duck Amount</span>
          <span className="text-cyan-400 font-mono">{Math.round(config.ratio * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.ratio * 100}
          onChange={(e) => onRatioChange(parseFloat(e.target.value) / 100)}
          disabled={!config.enabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Heavy Duck</span>
          <span>Light Duck</span>
        </div>
      </div>

      {/* Attack */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center justify-between">
          <span>Attack</span>
          <span className="text-cyan-400 font-mono">{Math.round(config.attack * 1000)}ms</span>
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={config.attack * 100}
          onChange={(e) => onAttackChange(parseFloat(e.target.value) / 100)}
          disabled={!config.enabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Release */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center justify-between">
          <span>Release</span>
          <span className="text-cyan-400 font-mono">{Math.round(config.release * 1000)}ms</span>
        </label>
        <input
          type="range"
          min="100"
          max="5000"
          value={config.release * 1000}
          onChange={(e) => onReleaseChange(parseFloat(e.target.value) / 1000)}
          disabled={!config.enabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Info */}
      <div className="p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
        <div className="font-medium text-gray-300 mb-1">💡 How it works:</div>
        <p>Music volume automatically lowers when you speak into the microphone, then returns to normal when you stop - just like a professional radio DJ!</p>
      </div>
    </div>
  );
}
