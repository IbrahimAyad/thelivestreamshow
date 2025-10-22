/**
 * Edit Cue Modal
 * Edit hot cue label and color
 */

import { useState, useEffect } from 'react'
import { X, Tag, Palette } from 'lucide-react'
import { PRESET_CUE_LABELS, EXTENDED_CUE_COLORS, type HotCue } from '@/utils/studio/hotCues'

interface EditCueModalProps {
  cue: HotCue | null
  isOpen: boolean
  onClose: () => void
  onSave: (updates: { label?: string; color?: string }) => void
}

export function EditCueModal({ cue, isOpen, onClose, onSave }: EditCueModalProps) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('')
  const [customLabel, setCustomLabel] = useState(false)

  useEffect(() => {
    if (cue) {
      setLabel(cue.label || '')
      setColor(cue.color)
      setCustomLabel(!PRESET_CUE_LABELS.includes(cue.label as any))
    }
  }, [cue])

  if (!isOpen || !cue) return null

  const handleSave = () => {
    onSave({ label, color })
    onClose()
  }

  const handlePresetClick = (presetLabel: string) => {
    setLabel(presetLabel)
    setCustomLabel(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Edit Hot Cue {cue.id + 1}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Label Section */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
            Cue Label
          </label>

          {/* Preset Labels */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_CUE_LABELS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  label === preset && !customLabel
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom Label Input */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Custom Label</label>
            <input
              type="text"
              value={customLabel ? label : ''}
              onChange={(e) => {
                setLabel(e.target.value)
                setCustomLabel(true)
              }}
              onFocus={() => setCustomLabel(true)}
              placeholder="Enter custom label..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              maxLength={20}
            />
          </div>
        </div>

        {/* Color Section */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color
          </label>

          <div className="grid grid-cols-8 gap-2">
            {EXTENDED_CUE_COLORS.map((colorOption) => (
              <button
                key={colorOption}
                onClick={() => setColor(colorOption)}
                className={`aspect-square rounded-lg transition-all ${
                  color === colorOption
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: colorOption }}
                title={colorOption}
              />
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400">Custom:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-8 rounded border border-neutral-700 cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{color}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
          <div className="text-xs text-neutral-400 mb-2 uppercase">Preview</div>
          <div
            className="aspect-square w-20 rounded-lg border-2 flex items-center justify-center font-bold text-lg"
            style={{
              backgroundColor: `${color}20`,
              borderColor: color,
              color: color,
            }}
          >
            <div className="text-center">
              <div>{cue.id + 1}</div>
              {label && <div className="text-xs mt-1 truncate px-1">{label}</div>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
