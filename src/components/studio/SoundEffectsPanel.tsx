import React from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { SoundEffect } from '../utils/soundEffectsEngine';

const EFFECT_DISPLAY_NAMES: Record<SoundEffect, string> = {
  airHorn: 'Air Horn',
  siren: 'Siren',
  rewind: 'Rewind',
  laserZap: 'Laser Zap',
  riser: 'Riser',
  impact: 'Impact',
  vinyl: 'Vinyl Scratch',
  whiteNoise: 'White Noise',
};

const EFFECT_ICONS: Record<SoundEffect, JSX.Element> = {
  airHorn: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L3 7v11l9 4 9-4V7l-9-5zm0 18.09l-7-3.11V8.09l7 3.11v8.89z"/>
      <path d="M17 11c0-2.76-2.24-5-5-5s-5 2.24-5 5h2c0-1.66 1.34-3 3-3s3 1.34 3 3h2z"/>
    </svg>
  ),
  siren: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  rewind: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
    </svg>
  ),
  laserZap: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
  ),
  riser: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
  ),
  impact: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l2.5 7.5H22l-6 5 2.5 7.5L12 17l-6.5 5L8 14.5 2 9.5h7.5z"/>
    </svg>
  ),
  vinyl: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  whiteNoise: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.1-.89-2-2-2H8.3l-.01-.01L3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h2v2zm0 4h-2v-2h2v2z"/>
    </svg>
  ),
};

export function SoundEffectsPanel() {
  const {
    isReady,
    volume,
    keyboardEnabled,
    shortcuts,
    lastPlayedEffect,
    isPlaying,
    playEffect,
    stopEffect,
    setVolume,
    setKeyboardEnabled,
  } = useSoundEffects();

  const handleEffectClick = (effect: SoundEffect) => {
    playEffect(effect);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 00-5.657 5.657" />
          </svg>
          <h3 className="text-lg font-semibold text-white">DJ Sound Effects</h3>
        </div>
        {!isReady && (
          <span className="text-xs text-gray-400">Initializing...</span>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Volume</label>
            <span className="text-xs text-gray-400">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Keyboard Shortcuts Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-sm text-gray-300">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={() => setKeyboardEnabled(!keyboardEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              keyboardEnabled ? 'bg-purple-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                keyboardEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sound Effect Buttons Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Quick Fire</h4>
          {isPlaying && lastPlayedEffect && (
            <span className="text-xs text-purple-400 animate-pulse">
              Playing: {EFFECT_DISPLAY_NAMES[lastPlayedEffect]}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.key}
              onClick={() => handleEffectClick(shortcut.effect)}
              disabled={!isReady}
              className={`relative group p-4 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                lastPlayedEffect === shortcut.effect && isPlaying
                  ? 'bg-purple-500/20 border-purple-400 scale-95'
                  : 'bg-gray-700/30 border-gray-600 hover:border-purple-400 hover:bg-gray-700/50'
              }`}
            >
              {/* Icon */}
              <div className="flex items-center justify-center mb-2 text-purple-400">
                {EFFECT_ICONS[shortcut.effect]}
              </div>

              {/* Label */}
              <div className="text-xs text-gray-300 text-center font-medium truncate">
                {shortcut.label}
              </div>

              {/* Keyboard Shortcut Badge */}
              {keyboardEnabled && (
                <div className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-gray-900/80 rounded text-xs font-mono text-purple-300 border border-purple-500/30">
                  {shortcut.key}
                </div>
              )}

              {/* Playing Indicator */}
              {lastPlayedEffect === shortcut.effect && isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-purple-500/10 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stop Button */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <button
          onClick={stopEffect}
          disabled={!isReady}
          className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          Stop All Effects
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      {keyboardEnabled && (
        <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-gray-400">
              <p className="font-medium text-purple-300 mb-1">Keyboard shortcuts enabled</p>
              <p>Press the number keys (1-8) to trigger sound effects instantly. Shortcuts won't work when typing in text fields.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
