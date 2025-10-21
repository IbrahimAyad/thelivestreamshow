import { Waves } from 'lucide-react'

interface CrossfadeIndicatorProps {
  isCrossfading: boolean
  timeRemaining: number
  duration: number
}

export function CrossfadeIndicator({
  isCrossfading,
  timeRemaining,
  duration,
}: CrossfadeIndicatorProps) {
  if (!isCrossfading) return null

  const progress = ((duration - timeRemaining) / duration) * 100

  return (
    <div className="fixed top-20 right-4 bg-neutral-900 border-2 border-primary-500 rounded-lg shadow-xl p-4 z-40 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Waves className="w-5 h-5 text-primary-500 animate-pulse" />
        <span className="text-sm font-semibold text-primary-400">Crossfading</span>
      </div>
      
      <div className="relative h-2 bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-xs text-neutral-400 mt-2 text-center">
        {timeRemaining.toFixed(1)}s remaining
      </div>
    </div>
  )
}
