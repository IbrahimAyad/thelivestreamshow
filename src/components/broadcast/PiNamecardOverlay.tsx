import { useEpisodeInfo } from '../../hooks/useEpisodeInfo'

interface PiNamecardOverlayProps {
  position?: 'top' | 'bottom' | 'custom'
  customPosition?: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
}

/**
 * PI Namecard Overlay
 * 
 * Professional episode information display for broadcast
 * Inspired by the PI-abe-namecard.html design
 * 
 * Features:
 * - Real-time episode data updates
 * - Universal visibility control
 * - Customizable positioning
 * - Professional gold accent styling
 * 
 * Usage:
 * ```tsx
 * <PiNamecardOverlay /> // Default bottom-right
 * <PiNamecardOverlay position="top" />
 * <PiNamecardOverlay position="custom" customPosition={{ top: '20px', left: '20px' }} />
 * ```
 */
export function PiNamecardOverlay({ 
  position = 'bottom',
  customPosition 
}: PiNamecardOverlayProps) {
  const { episodeInfo, isVisible } = useEpisodeInfo()

  // Hide if not visible or no episode data
  if (!isVisible || !episodeInfo) return null

  // Format date
  const formattedDate = new Date(episodeInfo.episode_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Determine positioning
  const getPositionStyle = () => {
    if (position === 'custom' && customPosition) {
      return customPosition
    }
    
    if (position === 'top') {
      return {
        top: '30px',
        right: '30px',
      }
    }
    
    // Default: bottom
    return {
      bottom: '30px',
      right: '30px',
    }
  }

  return (
    <div 
      className="pi-namecard-overlay"
      style={{
        position: 'fixed',
        zIndex: 100,
        ...getPositionStyle(),
      }}
    >
      <div className="pi-namecard-content">
        {/* Episode Number Badge */}
        <div className="episode-number">
          EP {episodeInfo.episode_number}
        </div>

        {/* Episode Date */}
        <div className="episode-date">
          {formattedDate}
        </div>

        {/* Episode Title */}
        <div className="episode-title">
          {episodeInfo.episode_title}
        </div>

        {/* Optional: Episode Topic (subtle) */}
        {episodeInfo.episode_topic && (
          <div className="episode-topic">
            {episodeInfo.episode_topic}
          </div>
        )}
      </div>

      <style>{`
        .pi-namecard-overlay {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pi-namecard-content {
          background: rgba(15, 15, 15, 0.92);
          border-right: 3px solid #FCD34D;
          border-radius: 2px;
          padding: 12px 20px;
          backdrop-filter: blur(8px);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 215, 0, 0.1);
          text-align: right;
          min-width: 200px;
          transition: all 0.3s ease;
        }

        .pi-namecard-content:hover {
          background: rgba(20, 20, 20, 0.95);
          border-right-width: 4px;
          box-shadow: 
            0 6px 16px rgba(0, 0, 0, 0.6),
            0 3px 6px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 215, 0, 0.15);
        }

        .episode-number {
          font-size: 13px;
          font-weight: 600;
          color: #FCD34D;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          text-transform: uppercase;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .episode-date {
          font-size: 11px;
          font-weight: 400;
          color: #9CA3AF;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        }

        .episode-title {
          font-size: 14px;
          font-weight: 500;
          color: #E5E7EB;
          line-height: 1.3;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .episode-topic {
          font-size: 10px;
          font-weight: 400;
          color: #6B7280;
          margin-top: 4px;
          font-style: italic;
          max-width: 250px;
          line-height: 1.2;
          opacity: 0.8;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .pi-namecard-content {
            min-width: 160px;
            padding: 10px 16px;
          }

          .episode-number {
            font-size: 12px;
          }

          .episode-date {
            font-size: 10px;
          }

          .episode-title {
            font-size: 13px;
          }

          .episode-topic {
            display: none;
          }
        }

        /* Print-friendly */
        @media print {
          .pi-namecard-overlay {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
