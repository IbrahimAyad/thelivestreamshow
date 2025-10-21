import React, { useState, useEffect } from 'react';
import { PRESET_MODES, getRecommendedPreset, type PresetMode } from '@/utils/studio/presetModes';
import type { AutoDJSettings } from '../types/database';

interface PresetModeSelectorProps {
  currentSettings: AutoDJSettings | null;
  onApplyPreset: (settings: Partial<AutoDJSettings>) => void;
}

const PRESET_ICONS: Record<string, JSX.Element> = {
  sunrise: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  party: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  moon: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
};

export function PresetModeSelector({ currentSettings, onApplyPreset }: PresetModeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [recommendedPreset, setRecommendedPreset] = useState<PresetMode>(getRecommendedPreset());
  const [showRecommendation, setShowRecommendation] = useState(true);

  // Update recommended preset every hour
  useEffect(() => {
    const interval = setInterval(() => {
      setRecommendedPreset(getRecommendedPreset());
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, []);

  const handlePresetClick = (preset: PresetMode) => {
    setSelectedPreset(preset.id);
    setShowRecommendation(false);
    onApplyPreset(preset.settings);
  };

  const handleApplyRecommended = () => {
    setSelectedPreset(recommendedPreset.id);
    setShowRecommendation(false);
    onApplyPreset(recommendedPreset.settings);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Quick Presets</h3>
        </div>
      </div>

      {/* Recommended Preset */}
      {showRecommendation && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.5 7.5H22l-6 5 2.5 7.5L12 17l-6.5 5L8 14.5 2 9.5h7.5z"/>
                </svg>
                <span className="text-sm font-medium text-green-300">Recommended for now</span>
              </div>
              <h4 className="text-base font-semibold text-white mb-1">{recommendedPreset.name}</h4>
              <p className="text-xs text-gray-400">{recommendedPreset.description}</p>
            </div>
            <button
              onClick={handleApplyRecommended}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-4">
        {PRESET_MODES.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          const isRecommended = recommendedPreset.id === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-white bg-white/10 scale-[1.02]'
                  : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
              }`}
            >
              {/* Recommended Badge */}
              {isRecommended && !showRecommendation && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              )}

              {/* Icon with gradient */}
              <div className={`mb-3 inline-flex p-2 rounded-lg bg-gradient-to-br ${preset.colorClass}`}>
                <div className="text-white">
                  {PRESET_ICONS[preset.icon]}
                </div>
              </div>

              {/* Content */}
              <h4 className="text-sm font-semibold text-white mb-1">{preset.name}</h4>
              <p className="text-xs text-gray-400 line-clamp-2">{preset.description}</p>

              {/* Energy Range Badge */}
              {preset.energyRange && (
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                  <span>E{preset.energyRange[0]}-{preset.energyRange[1]}</span>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-xl pointer-events-none">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-6 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-gray-400">
            <p className="font-medium text-blue-300 mb-1">Quick Setup</p>
            <p>Presets automatically configure Auto-DJ settings for different times and moods. Your tracks will be filtered by energy level to match the selected preset.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
