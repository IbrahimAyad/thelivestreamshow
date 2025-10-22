/**
 * Quantize Controls
 * Snap hot cues and loops to musical beats for tight performances
 */

import { useState } from 'react'
import { Grid, Power } from 'lucide-react'
import type { QuantizeSettings } from '@/utils/studio/quantize'

interface QuantizeControlsProps {
  enabled: boolean
  snapToGrid: QuantizeSettings['snapToGrid']
  onToggle: () => void
  onGridChange: (grid: QuantizeSettings['snapToGrid']) => void
  disabled?: boolean
}

const GRID_OPTIONS: Array<{ value: QuantizeSettings['snapToGrid'], label: string }> = [
  { value: '1/32', label: '1/32' },
  { value: '1/16', label: '1/16' },
  { value: '1/8', label: '1/8' },
  { value: '1/4', label: '1/4' },
  { value: '1/2', label: '1/2' },
  { value: '1', label: '1 Bar' },
  { value: '2', label: '2 Bars' },
  { value: '4', label: '4 Bars' },
]

export function QuantizeControls({
  enabled,
  snapToGrid,
  onToggle,
  onGridChange,
  disabled = false,
}: QuantizeControlsProps) {
  if (disabled) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
        <p className="text-neutral-400 text-sm">Load a track to enable quantize</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-2">
          <Grid className="w-4 h-4" />
          Quantize
        </h3>
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
            enabled
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
              : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
          }`}
        >
          <Power className="w-4 h-4" />
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Grid Size Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-400 uppercase">
          Snap To Grid
        </label>
        <div className="grid grid-cols-4 gap-2">
          {GRID_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onGridChange(option.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                snapToGrid === option.value
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Info */}
      <div className={`rounded-lg p-3 text-xs border ${
        enabled
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-neutral-900 border-neutral-700 text-neutral-500'
      }`}>
        {enabled ? (
          <div>
            <div className="font-semibold mb-1">✅ Quantize Active</div>
            <div className="text-xs opacity-80">
              Hot cues and loops will snap to <span className="font-bold">{snapToGrid}</span> note grid
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold mb-1">Quantize Disabled</div>
            <div className="text-xs opacity-80">
              Cues and loops will be placed at exact positions
            </div>
          </div>
        )}
      </div>

      {/* Visual Beat Grid Indicator */}
      {enabled && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Beat Grid Preview
          </label>
          <div className="flex items-center gap-1 h-8 bg-neutral-900 rounded overflow-hidden">
            {Array.from({ length: 16 }).map((_, i) => {
              // Highlight based on grid resolution
              const isHighlighted = (() => {
                switch (snapToGrid) {
                  case '1/32': return i % 1 === 0
                  case '1/16': return i % 2 === 0
                  case '1/8': return i % 4 === 0
                  case '1/4': return i % 8 === 0
                  case '1/2': return i % 16 === 0
                  default: return false
                }
              })()

              const isDownbeat = i === 0

              return (
                <div
                  key={i}
                  className={`flex-1 h-full transition-all ${
                    isDownbeat
                      ? 'bg-primary-500'
                      : isHighlighted
                      ? 'bg-green-500'
                      : 'bg-neutral-700'
                  }`}
                  style={{
                    opacity: isHighlighted ? 1 : 0.3,
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-neutral-600">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
        </div>
      )}

      {/* Pro Tips */}
      {!enabled && (
        <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-700 rounded p-2">
          <span className="font-semibold">💡 Pro Tip:</span> Enable quantize for tight, beat-aligned hot cues and loops. Perfect for live performances!
        </div>
      )}

      {enabled && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded p-2">
          <span className="font-semibold">🎯 Active:</span> All cue points and loops will snap to the {snapToGrid} grid for perfect timing.
        </div>
      )}
    </div>
  )
}
