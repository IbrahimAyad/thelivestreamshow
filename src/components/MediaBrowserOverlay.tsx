import { useEffect, useState } from 'react'

interface MediaBrowserOverlayProps {
  query: string
  type: 'images' | 'videos'
  onClose: () => void
  durationSeconds?: number
}

export function MediaBrowserOverlay({
  query,
  type,
  onClose,
  durationSeconds = 30
}: MediaBrowserOverlayProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds)

  // Build search URL based on type
  const getSearchUrl = () => {
    const encodedQuery = encodeURIComponent(query)

    if (type === 'images') {
      // Google Images search
      return `https://www.google.com/search?q=${encodedQuery}&tbm=isch&source=lnms`
    } else {
      // YouTube search
      return `https://www.youtube.com/results?search_query=${encodedQuery}`
    }
  }

  // Auto-close after duration
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onClose])

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoaded(true)
  }

  return (
    <div className="media-browser-overlay">
      {/* Header Bar */}
      <div className="media-browser-header">
        <div className="search-info">
          <span className="search-type-badge">
            {type === 'images' ? '🖼️ Images' : '🎥 Videos'}
          </span>
          <span className="search-query">{query}</span>
        </div>
        <div className="controls">
          <span className="timer">{timeRemaining}s</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Loading Indicator */}
      {!isLoaded && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading {type}...</p>
        </div>
      )}

      {/* Embedded Browser */}
      <iframe
        src={getSearchUrl()}
        className="media-browser-frame"
        onLoad={handleIframeLoad}
        sandbox="allow-scripts allow-same-origin allow-popups"
        title={`${type} search: ${query}`}
      />

      <style>{`
        .media-browser-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .media-browser-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          background: linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%);
          border-bottom: 2px solid rgba(250, 204, 21, 0.3);
          backdrop-filter: blur(10px);
        }

        .search-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .search-type-badge {
          background: rgba(250, 204, 21, 0.2);
          color: #facc15;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid rgba(250, 204, 21, 0.3);
        }

        .search-query {
          color: white;
          font-size: 18px;
          font-weight: 500;
          max-width: 600px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .timer {
          color: #facc15;
          font-size: 16px;
          font-weight: 600;
          min-width: 40px;
          text-align: right;
        }

        .close-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .close-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          transform: scale(1.05);
        }

        .close-btn:active {
          transform: scale(0.95);
        }

        .loading-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(250, 204, 21, 0.2);
          border-top-color: #facc15;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-indicator p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin: 0;
        }

        .media-browser-frame {
          flex: 1;
          width: 100%;
          border: none;
          background: white;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .media-browser-header {
            padding: 15px 20px;
          }

          .search-query {
            font-size: 14px;
            max-width: 200px;
          }

          .search-type-badge {
            font-size: 12px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  )
}
