import { useFXChain } from '@/hooks/useFXChain'

interface FXChainPanelProps {
  audioContext: AudioContext | null
}

export function FXChainPanel({ audioContext }: FXChainPanelProps) {
  const {
    config,
    currentPreset,
    presets,
    setDelay,
    setReverb,
    setFlanger,
    setPhaser,
    setBitCrusher,
    applyPreset,
  } = useFXChain(audioContext)

  const activeEffectsCount = [
    config.delay.enabled,
    config.reverb.enabled,
    config.flanger.enabled,
    config.phaser.enabled,
    config.bitCrusher.enabled,
  ].filter(Boolean).length

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="text-lg font-semibold">Professional FX Chain</h3>
          {activeEffectsCount > 0 && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded-full">
              {activeEffectsCount} Active
            </span>
          )}
        </div>
      </div>

      {/* Preset Selector */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-400 mb-2">FX Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentPreset === preset.name
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Effects Grid */}
      <div className="space-y-4">
        {/* DELAY */}
        <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-neutral-100">Delay</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.delay.enabled}
                onChange={(e) => setDelay({ enabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 text-blue-500 focus:ring-blue-400"
              />
            </label>
          </div>
          {config.delay.enabled && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Time</span>
                  <span>{(config.delay.time * 1000).toFixed(0)}ms</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={config.delay.time}
                  onChange={(e) => setDelay({ time: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Feedback</span>
                  <span>{Math.round(config.delay.feedback * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.01"
                  value={config.delay.feedback}
                  onChange={(e) => setDelay({ feedback: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Wet Mix</span>
                  <span>{Math.round(config.delay.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.delay.wet}
                  onChange={(e) => setDelay({ wet: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* REVERB */}
        <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-sm font-semibold text-neutral-100">Reverb</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.reverb.enabled}
                onChange={(e) => setReverb({ enabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 text-indigo-500 focus:ring-indigo-400"
              />
            </label>
          </div>
          {config.reverb.enabled && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Room Size</span>
                  <span className="capitalize">{config.reverb.size}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {['small', 'medium', 'large', 'hall'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setReverb({ size: size as any })}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        config.reverb.size === size
                          ? 'bg-indigo-600 text-white'
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Wet Mix</span>
                  <span>{Math.round(config.reverb.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.reverb.wet}
                  onChange={(e) => setReverb({ wet: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* FLANGER */}
        <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="text-sm font-semibold text-neutral-100">Flanger</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.flanger.enabled}
                onChange={(e) => setFlanger({ enabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 text-cyan-500 focus:ring-cyan-400"
              />
            </label>
          </div>
          {config.flanger.enabled && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Rate</span>
                  <span>{config.flanger.rate.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={config.flanger.rate}
                  onChange={(e) => setFlanger({ rate: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Depth</span>
                  <span>{Math.round(config.flanger.depth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.flanger.depth}
                  onChange={(e) => setFlanger({ depth: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Wet Mix</span>
                  <span>{Math.round(config.flanger.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.flanger.wet}
                  onChange={(e) => setFlanger({ wet: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* PHASER */}
        <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-semibold text-neutral-100">Phaser</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.phaser.enabled}
                onChange={(e) => setPhaser({ enabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 text-pink-500 focus:ring-pink-400"
              />
            </label>
          </div>
          {config.phaser.enabled && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Rate</span>
                  <span>{config.phaser.rate.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={config.phaser.rate}
                  onChange={(e) => setPhaser({ rate: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Stages</span>
                  <span>{config.phaser.stages}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={config.phaser.stages}
                  onChange={(e) => setPhaser({ stages: parseInt(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Wet Mix</span>
                  <span>{Math.round(config.phaser.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.phaser.wet}
                  onChange={(e) => setPhaser({ wet: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* BIT CRUSHER */}
        <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span className="text-sm font-semibold text-neutral-100">Bit Crusher</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.bitCrusher.enabled}
                onChange={(e) => setBitCrusher({ enabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 text-orange-500 focus:ring-orange-400"
              />
            </label>
          </div>
          {config.bitCrusher.enabled && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Bit Depth</span>
                  <span>{config.bitCrusher.bits} bits</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={config.bitCrusher.bits}
                  onChange={(e) => setBitCrusher({ bits: parseInt(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Sample Rate</span>
                  <span>{(config.bitCrusher.sampleRate / 1000).toFixed(1)}k Hz</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="44100"
                  step="1000"
                  value={config.bitCrusher.sampleRate}
                  onChange={(e) => setBitCrusher({ sampleRate: parseInt(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Wet Mix</span>
                  <span>{Math.round(config.bitCrusher.wet * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.bitCrusher.wet}
                  onChange={(e) => setBitCrusher({ wet: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Note */}
      <div className="mt-4 p-3 bg-neutral-800 rounded border border-neutral-700">
        <p className="text-xs text-neutral-400">
          <strong className="text-neutral-300">Pro Tip:</strong> Combine multiple effects for unique sounds. Use presets as starting points and customize to taste.
        </p>
      </div>
    </div>
  )
}
