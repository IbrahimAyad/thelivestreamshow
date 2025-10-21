/**
 * Visualization Presets Selector Panel
 * Allows users to select visual presets for the broadcast overlay
 */

import { useState } from 'react'
import {
  VISUALIZATION_PRESETS,
  savePreset,
  loadPreset,
  type VisualizationPreset,
} from '@/utils/visualizationPresets'

export function VisualizationPresetsPanel() {
  const [selectedPreset, setSelectedPreset] = useState<VisualizationPreset>(loadPreset())

  const handlePresetSelect = (preset: VisualizationPreset) => {
    setSelectedPreset(preset)
    savePreset(preset)
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Broadcast Visuals</h3>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-neutral-400">OBS Overlay</span>
        </div>
      </div>

      <p className="text-sm text-neutral-400 mb-4">
        Choose a visualization style for your broadcast overlay. Changes apply instantly to /broadcast
      </p>

      {/* Preset Grid */}
      <div className="grid grid-cols-1 gap-3">
        {(Object.entries(VISUALIZATION_PRESETS) as [VisualizationPreset, typeof VISUALIZATION_PRESETS[VisualizationPreset]][]).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => handlePresetSelect(key)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedPreset === key
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1">{config.name}</h4>
                  <p className="text-sm text-neutral-400">{config.description}</p>
                  
                  {/* Visual Features */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {config.showSpectrum && (
                      <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs">
                        Spectrum
                      </span>
                    )}
                    {config.showCircular && (
                      <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs">
                        Circular
                      </span>
                    )}
                    {config.showVinyl && (
                      <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs">
                        Vinyl
                      </span>
                    )}
                    {config.showParticles && (
                      <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs">
                        Particles
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Selection Indicator */}
                {selectedPreset === key && (
                  <div className="ml-3">
                    <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-neutral-900 border border-neutral-700 rounded">
        <p className="text-xs text-neutral-400">
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          The broadcast overlay at <code className="text-primary-400">/broadcast</code> syncs automatically with your control panel.
          No audio plays on the overlay - it's designed for OBS capture.
        </p>
      </div>
    </div>
  )
}
