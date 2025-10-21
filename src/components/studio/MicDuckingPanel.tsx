/**
 * Phase 7B - Mic Ducking Panel
 * 
 * Live microphone input with auto-ducking and real-time effects
 */

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Wand2 } from 'lucide-react';
import { useMicInput } from '../hooks/useMicInput';
import { defaultMicEffectsSettings, type MicEffectsSettings } from '../utils/micEffects';

interface MicDuckingPanelProps {
  audioContext: AudioContext | null;
  onDuckingChange?: (isDucking: boolean, duckAmount: number) => void;
}

export function MicDuckingPanel({ audioContext, onDuckingChange }: MicDuckingPanelProps) {
  const {
    isActive,
    micLevel,
    isDucking,
    error,
    duckingSettings,
    startMic,
    stopMic,
    updateDuckingSettings,
    updateEffectsSettings,
  } = useMicInput(audioContext, (ducking, level) => {
    if (ducking) {
      onDuckingChange?.(true, duckingSettings.duckAmount);
    } else {
      onDuckingChange?.(false, 0);
    }
  });

  const [showEffects, setShowEffects] = useState(false);
  const [effectsSettings, setEffectsSettings] = useState<MicEffectsSettings>(() => {
    const saved = localStorage.getItem('micEffectsSettings');
    return saved ? JSON.parse(saved) : defaultMicEffectsSettings;
  });

  const handleToggleMic = () => {
    if (isActive) {
      stopMic();
    } else {
      startMic();
    }
  };

  const handleEffectChange = (key: keyof MicEffectsSettings, value: any) => {
    const newSettings = { ...effectsSettings, [key]: value };
    setEffectsSettings(newSettings);
    updateEffectsSettings({ [key]: value });
    localStorage.setItem('micEffectsSettings', JSON.stringify(newSettings));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isActive ? <Mic className="w-5 h-5 text-blue-500" /> : <MicOff className="w-5 h-5 text-zinc-500" />}
          <h3 className="text-sm font-medium text-white">Live Mic + Auto-Ducking</h3>
          {isDucking && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500 text-black rounded-full font-semibold">
              DUCKING
            </span>
          )}
        </div>
        <button
          onClick={handleToggleMic}
          className={
            isActive
              ? 'px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors'
              : 'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors'
          }
        >
          {isActive ? 'Stop' : 'Start'} Mic
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-500 rounded text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Mic Level Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-400">Mic Level</span>
          <span className="text-xs text-white font-mono">{Math.round(micLevel)}%</span>
        </div>
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={
              isDucking
                ? 'h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-100'
                : micLevel > duckingSettings.threshold
                ? 'h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-100'
                : 'h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-100'
            }
            style={{ width: `${micLevel}%` }}
          />
        </div>
      </div>

      {/* Ducking Settings */}
      <div className="space-y-3 mb-3">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400">Auto-Ducking</label>
          <button
            onClick={() => updateDuckingSettings({ enabled: !duckingSettings.enabled })}
            className={
              duckingSettings.enabled
                ? 'px-2 py-1 bg-blue-600 text-white rounded text-xs'
                : 'px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs'
            }
          >
            {duckingSettings.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {duckingSettings.enabled && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-400">Threshold</label>
                <span className="text-xs text-white">{duckingSettings.threshold}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={duckingSettings.threshold}
                onChange={(e) => updateDuckingSettings({ threshold: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-400">Duck Amount</label>
                <span className="text-xs text-white">{duckingSettings.duckAmount}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={duckingSettings.duckAmount}
                onChange={(e) => updateDuckingSettings({ duckAmount: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>

      {/* Effects Section */}
      <button
        onClick={() => setShowEffects(!showEffects)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors mb-2"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white">Mic Effects</span>
        </div>
        <span className="text-xs text-zinc-400">{showEffects ? 'Hide' : 'Show'}</span>
      </button>

      {showEffects && (
        <div className="space-y-3 p-3 bg-zinc-800/50 rounded">
          {/* Compression */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-300">Compression</label>
            <button
              onClick={() => handleEffectChange('compression', !effectsSettings.compression)}
              className={
                effectsSettings.compression
                  ? 'px-2 py-1 bg-purple-600 text-white rounded text-xs'
                  : 'px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs'
              }
            >
              {effectsSettings.compression ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Reverb */}
          <div>
            <label className="text-xs text-zinc-300 mb-1 block">Reverb</label>
            <select
              value={effectsSettings.reverb}
              onChange={(e) => handleEffectChange('reverb', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-700 text-white text-xs rounded"
            >
              <option value="none">None</option>
              <option value="studio">Studio</option>
              <option value="hall">Hall</option>
              <option value="plate">Plate</option>
            </select>
          </div>

          {effectsSettings.reverb !== 'none' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-300">Reverb Mix</label>
                <span className="text-xs text-white">{effectsSettings.reverbMix}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={effectsSettings.reverbMix}
                onChange={(e) => handleEffectChange('reverbMix', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* De-esser */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-300">De-esser</label>
            <button
              onClick={() => handleEffectChange('deEsser', !effectsSettings.deEsser)}
              className={
                effectsSettings.deEsser
                  ? 'px-2 py-1 bg-purple-600 text-white rounded text-xs'
                  : 'px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs'
              }
            >
              {effectsSettings.deEsser ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Lo-fi Filter */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-300">Lo-fi / Radio</label>
            <button
              onClick={() => handleEffectChange('loFiFilter', !effectsSettings.loFiFilter)}
              className={
                effectsSettings.loFiFilter
                  ? 'px-2 py-1 bg-purple-600 text-white rounded text-xs'
                  : 'px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs'
              }
            >
              {effectsSettings.loFiFilter ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Noise Gate */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-300">Noise Gate</label>
            <button
              onClick={() => handleEffectChange('noiseGate', !effectsSettings.noiseGate)}
              className={
                effectsSettings.noiseGate
                  ? 'px-2 py-1 bg-purple-600 text-white rounded text-xs'
                  : 'px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs'
              }
            >
              {effectsSettings.noiseGate ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
