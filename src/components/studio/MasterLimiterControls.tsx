/**
 * Master Limiter Controls
 * Brick-wall limiter to prevent clipping and ensure clean output
 */

import { Shield, AlertCircle } from 'lucide-react'

interface MasterLimiterControlsProps {
  limiter: DynamicsCompressorNode | null
  onThresholdChange?: (threshold: number) => void
  onRatioChange?: (ratio: number) => void
  disabled?: boolean
}

export function MasterLimiterControls({
  limiter,
  onThresholdChange,
  onRatioChange,
  disabled = false,
}: MasterLimiterControlsProps) {
  // Get current limiter settings
  const threshold = limiter?.threshold.value ?? -1.0
  const ratio = limiter?.ratio.value ?? 20.0
  const attack = limiter?.attack.value ?? 0.003
  const release = limiter?.release.value ?? 0.25

  // Calculate reduction (if limiter node exposes it)
  const reduction = limiter?.reduction ?? 0

  // Handle threshold change
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onThresholdChange?.(value)
  }

  // Handle ratio change
  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onRatioChange?.(value)
  }

  // Check if limiter is actively reducing
  const isActive = reduction < -0.1

  if (disabled) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
        <p className="text-neutral-400 text-sm">Load a track to enable master limiter</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Master Limiter
        </h3>
        <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
          isActive ? 'bg-green-900 text-green-300' : 'bg-neutral-700 text-neutral-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
          {isActive ? 'ACTIVE' : 'IDLE'}
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-3 py-2">
        <AlertCircle className="w-4 h-4" />
        <span>Protects against clipping and ensures consistent output levels</span>
      </div>

      {/* Threshold Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Threshold
          </label>
          <span className="text-sm font-mono font-bold text-neutral-300">
            {threshold.toFixed(1)} dB
          </span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="-20"
            max="0"
            step="0.1"
            value={threshold}
            onChange={handleThresholdChange}
            className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #22C55E 0%, #22C55E ${((threshold + 20) / 20) * 100}%, #404040 ${((threshold + 20) / 20) * 100}%, #404040 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>-20dB</span>
            <span className="text-neutral-400">More Limiting</span>
            <span>0dB</span>
          </div>
        </div>

        <div className="text-xs text-neutral-500">
          💡 Lower values = more aggressive limiting. Recommended: -1 to -3 dB
        </div>
      </div>

      {/* Ratio Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400 uppercase">
            Ratio
          </label>
          <span className="text-sm font-mono font-bold text-neutral-300">
            {ratio.toFixed(1)}:1
          </span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="1"
            max="20"
            step="0.1"
            value={ratio}
            onChange={handleRatioChange}
            className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #22C55E 0%, #22C55E ${((ratio - 1) / 19) * 100}%, #404040 ${((ratio - 1) / 19) * 100}%, #404040 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>1:1</span>
            <span className="text-neutral-400">Harder</span>
            <span>20:1</span>
          </div>
        </div>

        <div className="text-xs text-neutral-500">
          💡 Higher values = harder limiting. Recommended: 12:1 to 20:1 for brick-wall limiting
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="pt-3 border-t border-neutral-700 grid grid-cols-2 gap-3">
        <div className="bg-neutral-900 rounded p-2">
          <div className="text-xs text-neutral-500 mb-1">Attack</div>
          <div className="text-sm font-mono font-bold text-neutral-300">
            {(attack * 1000).toFixed(1)}ms
          </div>
        </div>
        <div className="bg-neutral-900 rounded p-2">
          <div className="text-xs text-neutral-500 mb-1">Release</div>
          <div className="text-sm font-mono font-bold text-neutral-300">
            {(release * 1000).toFixed(0)}ms
          </div>
        </div>
      </div>

      {/* Gain Reduction Meter */}
      {reduction < -0.01 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-400 uppercase">
              Gain Reduction
            </label>
            <span className="text-sm font-mono font-bold text-green-400">
              {Math.abs(reduction).toFixed(1)} dB
            </span>
          </div>
          <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min(Math.abs(reduction) * 5, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Protection Status */}
      <div className="pt-3 border-t border-neutral-700">
        <div className="flex items-center gap-2 text-xs">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-neutral-400">
            Master output protection: <span className="text-green-400 font-semibold">ENABLED</span>
          </span>
        </div>
      </div>
    </div>
  )
}
