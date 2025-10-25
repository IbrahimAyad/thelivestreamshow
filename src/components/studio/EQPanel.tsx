/**
 * EQ Panel Component
 * Professional 3-band EQ with kill switches and filters
 */

import React from 'react';
import { useEQSystem } from '@/hooks/studio/useEQSystem';
import { useMusic } from '@/contexts/MusicProvider';

interface EQPanelProps {
  audioContext?: AudioContext | null; // Optional prop for backward compatibility
  className?: string;
}

export function EQPanel({ audioContext: propAudioContext, className = '' }: EQPanelProps) {
  const { audioContext: globalAudioContext, ready } = useMusic();
  
  // Use prop audioContext if provided, otherwise use global
  const audioContext = propAudioContext || globalAudioContext;
  
  // Guard: don't render until ready
  if (!ready || !audioContext) {
    return (
      <div className={`bg-neutral-900 border border-neutral-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-neutral-400">EQ initializing...</div>
        </div>
      </div>
    );
  }
  
  const eq = useEQSystem({ audioContext });

  const presets = [
    { id: 'flat' as const, name: 'Flat', icon: '━' },
    { id: 'club' as const, name: 'Club', icon: '♪' },
    { id: 'radio' as const, name: 'Radio', icon: '📻' },
    { id: 'bass-boost' as const, name: 'Bass', icon: '🔊' },
    { id: 'vocal' as const, name: 'Vocal', icon: '🎤' },
  ];

  return (
    <div className={`bg-neutral-900 border border-neutral-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-200">3-Band EQ</h3>
          <button
            onClick={eq.reset}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>
        <p className="text-xs text-gray-500">Professional frequency control with kill switches</p>
      </div>

      {/* EQ Bands */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Low Band */}
        <div>
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-gray-300">LOW</div>
            <div className="text-xs text-gray-500">100 Hz</div>
          </div>
          <div className="relative">
            <input
              type="range"
              min="-100"
              max="12"
              step="0.1"
              value={eq.settings.low.gain}
              onChange={(e) => eq.setLowGain(Number(e.target.value))}
              disabled={eq.settings.low.killed}
              className="w-full h-24 bg-gray-700 rounded appearance-none cursor-pointer"
              style={{
                WebkitAppearance: 'slider-vertical',
              }}
            />
            <div className="text-center mt-2 text-xs font-mono text-gray-400">
              {eq.settings.low.killed ? 'KILLED' : `${eq.settings.low.gain.toFixed(1)} dB`}
            </div>
          </div>
          <button
            onClick={eq.toggleKillLow}
            className={`w-full mt-2 px-3 py-2 rounded font-bold text-sm transition-all ${
              eq.settings.low.killed
                ? 'bg-red-600 text-white border-2 border-red-400'
                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
            }`}
          >
            {eq.settings.low.killed ? 'KILLED' : 'KILL'}
          </button>
        </div>

        {/* Mid Band */}
        <div>
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-gray-300">MID</div>
            <div className="text-xs text-gray-500">1 kHz</div>
          </div>
          <div className="relative">
            <input
              type="range"
              min="-100"
              max="12"
              step="0.1"
              value={eq.settings.mid.gain}
              onChange={(e) => eq.setMidGain(Number(e.target.value))}
              disabled={eq.settings.mid.killed}
              className="w-full h-24 bg-gray-700 rounded appearance-none cursor-pointer"
              style={{
                WebkitAppearance: 'slider-vertical',
              }}
            />
            <div className="text-center mt-2 text-xs font-mono text-gray-400">
              {eq.settings.mid.killed ? 'KILLED' : `${eq.settings.mid.gain.toFixed(1)} dB`}
            </div>
          </div>
          <button
            onClick={eq.toggleKillMid}
            className={`w-full mt-2 px-3 py-2 rounded font-bold text-sm transition-all ${
              eq.settings.mid.killed
                ? 'bg-red-600 text-white border-2 border-red-400'
                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
            }`}
          >
            {eq.settings.mid.killed ? 'KILLED' : 'KILL'}
          </button>
        </div>

        {/* High Band */}
        <div>
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-gray-300">HIGH</div>
            <div className="text-xs text-gray-500">10 kHz</div>
          </div>
          <div className="relative">
            <input
              type="range"
              min="-100"
              max="12"
              step="0.1"
              value={eq.settings.high.gain}
              onChange={(e) => eq.setHighGain(Number(e.target.value))}
              disabled={eq.settings.high.killed}
              className="w-full h-24 bg-gray-700 rounded appearance-none cursor-pointer"
              style={{
                WebkitAppearance: 'slider-vertical',
              }}
            />
            <div className="text-center mt-2 text-xs font-mono text-gray-400">
              {eq.settings.high.killed ? 'KILLED' : `${eq.settings.high.gain.toFixed(1)} dB`}
            </div>
          </div>
          <button
            onClick={eq.toggleKillHigh}
            className={`w-full mt-2 px-3 py-2 rounded font-bold text-sm transition-all ${
              eq.settings.high.killed
                ? 'bg-red-600 text-white border-2 border-red-400'
                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
            }`}
          >
            {eq.settings.high.killed ? 'KILLED' : 'KILL'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="text-sm font-semibold text-gray-300 mb-3">Filters</div>
        <div className="grid grid-cols-2 gap-3">
          {/* Hi-Pass */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Hi-Pass: {eq.filterSettings.hipass.frequency.toFixed(0)} Hz
            </label>
            <input
              type="range"
              min="20"
              max="2000"
              step="10"
              value={eq.filterSettings.hipass.frequency}
              onChange={(e) => eq.setHipass(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>
          {/* Lo-Pass */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Lo-Pass: {eq.filterSettings.lopass.frequency >= 20000 ? 'OFF' : `${eq.filterSettings.lopass.frequency.toFixed(0)} Hz`}
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="100"
              value={eq.filterSettings.lopass.frequency}
              onChange={(e) => eq.setLopass(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Presets */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-2">Presets</div>
        <div className="grid grid-cols-5 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => eq.applyPreset(preset.id)}
              className="px-2 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-medium transition-colors flex flex-col items-center gap-1"
              title={preset.name}
            >
              <span className="text-base">{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400">
        <div className="font-semibold text-gray-300 mb-1">Pro Tip:</div>
        <p>Use kill switches for dramatic transitions. Try killing the low band during buildups!</p>
      </div>
    </div>
  );
}
