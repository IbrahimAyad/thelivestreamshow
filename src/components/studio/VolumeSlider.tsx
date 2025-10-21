import { Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'

interface VolumeSliderProps {
  value: number
  onChange: (value: number) => void
  onToggleMute: () => void
  isMuted: boolean
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function VolumeSlider({
  value,
  onChange,
  onToggleMute,
  isMuted,
  orientation = 'horizontal',
  className = '',
}: VolumeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleDoubleClick = () => {
    onChange(1.0)
  }

  const percentage = Math.round(value * 100)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={onToggleMute}
        className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-error-500" />
        ) : (
          <Volume2 className="w-5 h-5 text-neutral-100" />
        )}
      </button>

      <div
        className="relative flex-1"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => !isDragging && setShowTooltip(false)}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => {
            setIsDragging(false)
            setShowTooltip(false)
          }}
          onDoubleClick={handleDoubleClick}
          className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-100 
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
            [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-125
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-neutral-100 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform
            [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:hover:scale-110
            [&::-moz-range-thumb]:active:scale-125"
          style={{
            background: `linear-gradient(to right, ${isMuted ? '#EF4444' : '#3B82F6'} 0%, ${isMuted ? '#EF4444' : '#3B82F6'} ${percentage}%, #3F3F46 ${percentage}%, #3F3F46 100%)`,
          }}
        />

        {(showTooltip || isDragging) && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-neutral-100 text-xs px-2 py-1 rounded shadow-md">
            {percentage}%
          </div>
        )}
      </div>

      <span className="text-xs font-mono text-neutral-400 w-10 text-right">
        {percentage}%
      </span>
    </div>
  )
}
