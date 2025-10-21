import { Bot } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePlaybackSync } from '@/hooks/usePlaybackSync'

export function AIPlaybackIndicator() {
  const { playbackState } = usePlaybackSync()
  const [showIndicator, setShowIndicator] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)

  useEffect(() => {
    if (!playbackState) return

    const currentTime = new Date(playbackState.updated_at).getTime()
    
    // If playback state changed recently (within last 2 seconds)
    // and we weren't the ones who triggered it (no manual UI action)
    // then it's likely an API-triggered action
    const timeSinceUpdate = Date.now() - currentTime
    
    if (timeSinceUpdate < 2000 && currentTime !== lastUpdateTime) {
      setShowIndicator(true)
      setLastUpdateTime(currentTime)
      
      // Hide indicator after 5 seconds
      setTimeout(() => setShowIndicator(false), 5000)
    }
  }, [playbackState, lastUpdateTime])

  if (!showIndicator) return null

  return (
    <div className="fixed top-20 right-6 bg-info-500/20 border border-info-500 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-top z-50">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-info-500 animate-pulse" />
        <div>
          <p className="text-sm font-medium text-neutral-100">AI Director Control</p>
          <p className="text-xs text-neutral-400">Playback triggered by API</p>
        </div>
      </div>
    </div>
  )
}
