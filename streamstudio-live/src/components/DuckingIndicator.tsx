import { AlertTriangle, Activity } from 'lucide-react'

interface DuckingIndicatorProps {
  isDucking: boolean
  duckingLevel: number
}

export function DuckingIndicator({ isDucking, duckingLevel }: DuckingIndicatorProps) {
  if (!isDucking) return null

  const percentage = Math.round(duckingLevel * 100)

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-10 bg-warning-500/20 border-l-4 border-warning-500 flex items-center px-4 gap-3 animate-in slide-in-from-top">
      <Activity className="w-5 h-5 text-warning-500 animate-pulse" />
      <span className="text-base font-medium text-neutral-100">
        Audio Ducking Active • Music reduced to {percentage}%
      </span>
    </div>
  )
}
