import { useEffect, useState } from 'react';

interface VisualContentDisplayProps {
  images?: string[];
  videos?: Array<{ url: string; title: string }>;
  searchQuery?: string;
  onHide?: () => void;
  autoHideDuration?: number;
}

export function VisualContentDisplay({
  images,
  videos,
  searchQuery,
  onHide,
  autoHideDuration = 60000 // 60 seconds default
}: VisualContentDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const hasContent = (images && images.length > 0) || (videos && videos.length > 0);
  const contentItems = images || videos?.map(v => v.url) || [];

  // Auto-hide timer
  useEffect(() => {
    if (!hasContent) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onHide?.();
      }, 300); // Wait for fade-out animation
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [hasContent, autoHideDuration, onHide]);

  // Auto-scroll carousel
  useEffect(() => {
    if (!hasContent || contentItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % contentItems.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [hasContent, contentItems.length]);

  if (!hasContent) return null;

  return (
    <div className={`visual-content-display ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="content-header">
        <div className="search-query-label">Search Results</div>
        {searchQuery && <div className="search-query">{searchQuery}</div>}
        <button className="close-btn" onClick={() => {
          setIsVisible(false);
          setTimeout(() => onHide?.(), 300);
        }}>
          ×
        </button>
      </div>

      <div className="content-carousel">
        {images && images.map((url, index) => (
          <div
            key={index}
            className={`carousel-item ${index === currentIndex ? 'active' : ''}`}
            style={{ display: index === currentIndex ? 'block' : 'none' }}
          >
            <img src={url} alt={`Search result ${index + 1}`} />
          </div>
        ))}

        {videos && videos.map((video, index) => (
          <div
            key={index}
            className={`carousel-item ${index === currentIndex ? 'active' : ''}`}
            style={{ display: index === currentIndex ? 'block' : 'none' }}
          >
            <div className="video-thumbnail">
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                {video.title}
              </a>
            </div>
          </div>
        ))}
      </div>

      {contentItems.length > 1 && (
        <div className="carousel-indicators">
          {contentItems.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      <style>{`
        .visual-content-display {
          position: fixed;
          right: 20px;
          top: 150px;
          width: 300px;
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          transition: opacity 0.3s ease, transform 0.3s ease;
          z-index: 80;
        }

        .visual-content-display.visible {
          opacity: 1;
          transform: translateX(0);
          animation: slideInRight 0.3s ease-out;
        }

        .visual-content-display.hidden {
          opacity: 0;
          transform: translateX(100%);
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .content-header {
          padding: 12px 16px;
          background: rgba(31, 41, 55, 0.8);
          border-bottom: 1px solid rgba(75, 85, 99, 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .search-query-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #facc15;
          text-transform: uppercase;
        }

        .search-query {
          font-size: 12px;
          color: #d1d5db;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .close-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #ef4444;
        }

        .content-carousel {
          padding: 16px;
          min-height: 200px;
        }

        .carousel-item {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .carousel-item img {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .video-thumbnail {
          width: 100%;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 8px;
          border: 1px solid rgba(75, 85, 99, 0.3);
        }

        .video-thumbnail a {
          color: #60a5fa;
          text-decoration: none;
          padding: 12px;
          text-align: center;
          font-size: 14px;
        }

        .video-thumbnail a:hover {
          color: #93c5fd;
          text-decoration: underline;
        }

        .carousel-indicators {
          display: flex;
          gap: 6px;
          justify-content: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(156, 163, 175, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator.active {
          background: #facc15;
          box-shadow: 0 0 8px rgba(250, 204, 21, 0.6);
          transform: scale(1.2);
        }

        .indicator:hover {
          background: rgba(250, 204, 21, 0.6);
        }
      `}</style>
    </div>
  );
}
