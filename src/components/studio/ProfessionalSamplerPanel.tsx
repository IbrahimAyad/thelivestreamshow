/**
 * Professional Sampler Panel
 * 16-pad sampler with keyboard shortcuts and sample management
 */

import React, { useRef, useState, useEffect } from 'react';
import { useProfessionalSampler } from '@/hooks/studio/useProfessionalSampler';
import { SamplePad } from '@/utils/studio/professionalSampler';
import { MiniWaveformCache } from '@/utils/studio/miniWaveformGenerator';

interface ProfessionalSamplerPanelProps {
  className?: string;
}

export function ProfessionalSamplerPanel({ className = '' }: ProfessionalSamplerPanelProps) {
  const sampler = useProfessionalSampler({ enableKeyboardShortcuts: true });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPad, setSelectedPad] = useState<number | null>(null);
  const [waveforms, setWaveforms] = useState<Map<number, string>>(new Map());
  const waveformCacheRef = useRef(new MiniWaveformCache());

  const handlePadClick = (padId: number) => {
    const pad = sampler.pads[padId];
    if (pad.audioBuffer) {
      sampler.playPad(padId);
    } else {
      // No sample loaded, open file picker
      setSelectedPad(padId);
      fileInputRef.current?.click();
    }
  };

  const handlePadRightClick = (e: React.MouseEvent, padId: number) => {
    e.preventDefault();
    const pad = sampler.pads[padId];
    if (pad.audioBuffer) {
      // If playing and loop mode, stop it. Otherwise clear the pad.
      if (pad.mode === 'loop' && sampler.isPadPlaying(padId)) {
        sampler.stopPad(padId);
      } else {
        sampler.clearPad(padId);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || selectedPad === null) return;

    const file = e.target.files[0];
    try {
      await sampler.loadSampleFromFile(selectedPad, file);
      // Generate waveform for the loaded sample
      generateWaveformForPad(selectedPad);
    } catch (error) {
      console.error('Failed to load sample:', error);
      alert('Failed to load sample. Please ensure it is a valid audio file.');
    }

    // Reset file input
    e.target.value = '';
    setSelectedPad(null);
  };

  const generateWaveformForPad = (padId: number) => {
    const pad = sampler.pads[padId];
    if (!pad.audioBuffer) return;

    const waveformDataUrl = waveformCacheRef.current.generate(
      pad.audioBuffer,
      pad.color,
      `pad-${padId}`
    );

    setWaveforms((prev) => {
      const newMap = new Map(prev);
      newMap.set(padId, waveformDataUrl);
      return newMap;
    });
  };

  // Generate waveforms for all loaded pads on mount
  useEffect(() => {
    sampler.pads.forEach((pad) => {
      if (pad.audioBuffer && !waveforms.has(pad.id)) {
        generateWaveformForPad(pad.id);
      }
    });
  }, [sampler.pads]);

  const togglePadMode = (padId: number) => {
    const pad = sampler.pads[padId];
    const newMode = pad.mode === 'one-shot' ? 'loop' : 'one-shot';
    sampler.setPadMode(padId, newMode);
  };

  return (
    <div className={`bg-neutral-900 border border-neutral-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-200">Professional Sampler</h3>
          <button
            onClick={sampler.stopAll}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
          >
            Stop All
          </button>
        </div>
        <p className="text-xs text-gray-500">16-pad sampler with keyboard shortcuts</p>
      </div>

      {/* 16-Pad Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {sampler.pads.map((pad) => {
          const isPlaying = sampler.isPadPlaying(pad.id);
          const hasSample = !!pad.audioBuffer;

          return (
            <div key={pad.id} className="relative">
              <button
                onClick={() => handlePadClick(pad.id)}
                onContextMenu={(e) => handlePadRightClick(e, pad.id)}
                className={`
                  w-full aspect-square rounded-lg font-medium text-sm
                  transition-all duration-150 relative overflow-hidden
                  ${
                    hasSample
                      ? 'border-2 hover:scale-105'
                      : 'border border-dashed border-gray-600 hover:border-gray-500'
                  }
                  ${
                    isPlaying
                      ? 'scale-95 shadow-lg'
                      : ''
                  }
                `}
                style={{
                  backgroundColor: hasSample ? `${pad.color}33` : '#1f2937',
                  borderColor: hasSample ? pad.color : undefined,
                  color: hasSample ? pad.color : '#6b7280',
                }}
                title={hasSample ? `${pad.name} (${pad.keyboardShortcut.toUpperCase()})` : `Load sample (${pad.keyboardShortcut.toUpperCase()})`}
              >
                {/* Playing animation */}
                {isPlaying && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ backgroundColor: `${pad.color}66` }}
                  />
                )}

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
                  <div className="text-lg font-bold mb-1">
                    {pad.keyboardShortcut.toUpperCase()}
                  </div>
                  {hasSample && (
                    <>
                      {/* Mini Waveform Preview */}
                      {waveforms.has(pad.id) && (
                        <div className="w-full h-6 mb-1 flex items-center justify-center">
                          <img
                            src={waveforms.get(pad.id)}
                            alt="Waveform"
                            className="max-w-full h-full object-contain opacity-80"
                          />
                        </div>
                      )}
                      <div className="text-xs truncate max-w-full px-1">
                        {pad.name}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {pad.mode === 'loop' ? '🔁' : '▶️'}
                      </div>
                    </>
                  )}
                  {!hasSample && (
                    <div className="text-xs opacity-60">Empty</div>
                  )}
                </div>

                {/* Mode toggle button (small corner button) */}
                {hasSample && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePadMode(pad.id);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded bg-black/50 hover:bg-black/70 flex items-center justify-center text-xs transition-colors"
                    title={`Toggle mode (current: ${pad.mode})`}
                  >
                    {pad.mode === 'loop' ? '🔁' : '▶️'}
                  </button>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Master Volume */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Master Volume: {Math.round(sampler.masterVolume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={sampler.masterVolume * 100}
          onChange={(e) => sampler.setMasterVolume(Number(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
        />
      </div>

      {/* Instructions */}
      <div className="p-3 bg-gray-800 rounded text-xs text-gray-400 space-y-1">
        <div className="font-semibold text-gray-300 mb-2">Instructions:</div>
        <div className="flex items-center justify-between">
          <span>Load sample:</span>
          <span className="text-gray-300">Click empty pad</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Play sample:</span>
          <span className="text-gray-300">Click pad or press key (Q-W-E-R, A-S-D-F, Z-X-C-V, 1-2-3-4)</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Toggle mode:</span>
          <span className="text-gray-300">Click mode icon (top-right of pad)</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Clear/Stop:</span>
          <span className="text-gray-300">Right-click pad</span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
