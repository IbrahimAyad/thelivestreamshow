import type { YouTubeVideo } from '../hooks/useYouTubeAPI';
import type { RedditVideo } from '../hooks/useRedditAPI';

interface VideoGridProps {
  videos: (YouTubeVideo | RedditVideo)[];
  onSelectVideo: (video: YouTubeVideo | RedditVideo, index: number) => void;
  onPlayAll?: () => void;
  onShuffle?: () => void;
  isLoading?: boolean;
  query?: string;
}

// Type guard to check if video is YouTubeVideo
const isYouTubeVideo = (video: YouTubeVideo | RedditVideo): video is YouTubeVideo => {
  return 'channelTitle' in video;
};

// Type guard to check if video is RedditVideo
const isRedditVideo = (video: YouTubeVideo | RedditVideo): video is RedditVideo => {
  return 'subreddit' in video;
};

export function VideoGrid({
  videos,
  onSelectVideo,
  onPlayAll,
  onShuffle,
  isLoading = false,
  query = '',
}: VideoGridProps) {
  const formatViewCount = (count: string | number | undefined): string => {
    if (!count && count !== 0) return '0';
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (isoDuration: string): string => {
    // Parse ISO 8601 duration (e.g., PT4M13S)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="video-grid-loading">
        <div className="loading-spinner"></div>
        <p>Searching for videos...</p>
        <style>{loadingStyles}</style>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="video-grid-empty">
        <div className="empty-state">
          <p className="empty-icon">🎬</p>
          <p className="empty-text">No videos found</p>
          {query && <p className="empty-query">Try a different search query</p>}
        </div>
        <style>{emptyStyles}</style>
      </div>
    );
  }

  return (
    <div className="video-grid-container">
      {/* Header */}
      <div className="grid-header">
        <div className="header-info">
          <h2 className="grid-title">
            {query ? `🎬 Results for "${query}"` : '🎬 Videos'}
          </h2>
          <span className="video-count">{videos.length} videos</span>
        </div>

        <div className="grid-actions">
          {onPlayAll && (
            <button className="action-btn play-all-btn" onClick={onPlayAll}>
              ▶️ Play All
            </button>
          )}
          {onShuffle && (
            <button className="action-btn shuffle-btn" onClick={onShuffle}>
              🔀 Shuffle
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="video-card"
            onClick={() => onSelectVideo(video, index)}
          >
            {/* Thumbnail */}
            <div className="thumbnail-wrapper">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="thumbnail-image"
                loading="lazy"
              />

              {/* Duration badge (YouTube only) */}
              {isYouTubeVideo(video) && video.duration && (
                <div className="duration-badge">
                  {formatDuration(video.duration)}
                </div>
              )}

              {/* Source badge */}
              <div className="source-badge">
                {isYouTubeVideo(video) ? '▶️ YouTube' : '🔥 Reddit'}
              </div>
            </div>

            {/* Video Info */}
            <div className="video-card-info">
              <h3 className="video-card-title">{video.title}</h3>

              <div className="video-card-metadata">
                {isYouTubeVideo(video) && (
                  <>
                    <span className="channel-name">{video.channelTitle}</span>
                    <span className="view-count">
                      {formatViewCount(video.viewCount)} views
                    </span>
                  </>
                )}

                {isRedditVideo(video) && (
                  <>
                    <span className="subreddit-name">r/{video.subreddit}</span>
                    <span className="reddit-score">
                      ⬆️ {formatViewCount(video.score)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Hover overlay */}
            <div className="hover-overlay">
              <div className="play-icon">▶️</div>
              <p className="play-text">Click to play</p>
            </div>
          </div>
        ))}
      </div>

      <style>{gridStyles}</style>
    </div>
  );
}

const loadingStyles = `
  .video-grid-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(250, 204, 21, 0.2);
    border-top-color: #facc15;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .video-grid-loading p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
    margin: 0;
  }
`;

const emptyStyles = `
  .video-grid-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
  }

  .empty-state {
    text-align: center;
  }

  .empty-icon {
    font-size: 64px;
    margin: 0 0 16px 0;
  }

  .empty-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 20px;
    margin: 0 0 8px 0;
  }

  .empty-query {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    margin: 0;
  }
`;

const gridStyles = `
  .video-grid-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .grid-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 2px solid rgba(250, 204, 21, 0.2);
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .grid-title {
    color: white;
    font-size: 22px;
    font-weight: 600;
    margin: 0;
  }

  .video-count {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
  }

  .grid-actions {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    background: rgba(250, 204, 21, 0.1);
    color: #facc15;
    border: 2px solid rgba(250, 204, 21, 0.3);
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: rgba(250, 204, 21, 0.2);
    border-color: rgba(250, 204, 21, 0.5);
    transform: translateY(-2px);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .video-grid {
    flex: 1;
    overflow-y: auto;
    padding: 30px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    align-content: start;
  }

  .video-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(250, 204, 21, 0.15);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .video-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(250, 204, 21, 0.2);
    border-color: rgba(250, 204, 21, 0.4);
  }

  .thumbnail-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    background: #000;
    overflow: hidden;
  }

  .thumbnail-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .duration-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .source-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(250, 204, 21, 0.9);
    color: #1a1a2e;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
  }

  .video-card-info {
    padding: 12px;
  }

  .video-card-title {
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .video-card-metadata {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }

  .channel-name,
  .subreddit-name {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .view-count,
  .reddit-score {
    color: rgba(255, 255, 255, 0.5);
  }

  .hover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .video-card:hover .hover-overlay {
    opacity: 1;
  }

  .play-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .play-text {
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }

  /* Scrollbar styling */
  .video-grid::-webkit-scrollbar {
    width: 10px;
  }

  .video-grid::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .video-grid::-webkit-scrollbar-thumb {
    background: rgba(250, 204, 21, 0.3);
    border-radius: 5px;
  }

  .video-grid::-webkit-scrollbar-thumb:hover {
    background: rgba(250, 204, 21, 0.5);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 20px;
    }

    .grid-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .grid-actions {
      width: 100%;
    }

    .action-btn {
      flex: 1;
    }
  }
`;
