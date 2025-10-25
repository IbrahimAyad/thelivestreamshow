import { useEffect } from 'react'
import { useEpisodeInfo } from '../../hooks/useEpisodeInfo'

interface PiNamecardOverlayProps {
  className?: string
  position?: 'top' | 'bottom' | 'custom'
  customPosition?: string
}

export function PiNamecardOverlay({ 
  className = '', 
  position = 'bottom',
  customPosition 
}: PiNamecardOverlayProps) {
  const { episodeData, isVisible, loading, error } = useEpisodeInfo()

  // Don't render if loading, no data, visibility is false, or error
  if (loading || !episodeData || !isVisible || error) {
    return null
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return ''
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'fixed bottom-6 right-6'
      case 'top':
        return 'fixed top-6 right-6'
      case 'custom':
        return customPosition || 'fixed bottom-6 right-6'
      default:
        return 'fixed bottom-6 right-6'
    }
  }

  return (
    <div className={`${getPositionClasses()} z-50`}>
      {/* Episode Info Card */}
      <div className="bg-black/90 backdrop-blur-sm border border-yellow-500/50 rounded-lg p-4 shadow-2xl max-w-sm">
        {/* Episode Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-yellow-500 text-black px-2 py-1 text-xs font-bold uppercase tracking-wider rounded">
            S{episodeData.season_number} EP{episodeData.episode_number}
          </div>
        </div>

        {/* Episode Title */}
        <div className="text-white text-lg font-bold mb-2 leading-tight">
          {episodeData.episode_title}
        </div>

        {/* Episode Date */}
        {episodeData.episode_date && (
          <div className="text-gray-300 text-sm mb-2">
            📅 {formatDate(episodeData.episode_date)}
          </div>
        )}

        {/* Episode Topic */}
        {episodeData.episode_topic && (
          <div className="text-yellow-400 text-sm font-semibold mb-3">
            📍 {episodeData.episode_topic}
          </div>
        )}

        {/* Gold accent line */}
        <div className="w-full h-0.5 bg-gradient-to-r from-yellow-500/70 to-transparent mt-3"></div>
        
        {/* Show branding */}
        <div className="text-gray-400 text-xs mt-2">
          Alpha Wednesdays
        </div>
      </div>
    </div>
  )
}

export default PiNamecardOverlay
