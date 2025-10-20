import type { YouTubeVideo } from '../hooks/useYouTubeAPI';
import type { RedditVideo } from '../hooks/useRedditAPI';

interface VideoQueueProps {
  queue: (YouTubeVideo | RedditVideo)[];
  currentIndex: number;
  onSelectVideo: (index: number) => void;
  onRemoveVideo: (index: number) => void;
  onClearQueue: () => void;
  onShuffle: () => void;
}

// Type guard to check if video is YouTubeVideo
const isYouTubeVideo = (video: YouTubeVideo | RedditVideo): video is YouTubeVideo => {
  return 'channelTitle' in video;
};

// Type guard to check if video is RedditVideo
const isRedditVideo = (video: YouTubeVideo | RedditVideo): video is RedditVideo => {
  return 'subreddit' in video;
};

export function VideoQueue({
  queue,
  currentIndex,
  onSelectVideo,
  onRemoveVideo,
  onClearQueue,
  onShuffle,
}: VideoQueueProps) {
  const formatViewCount = (count: string | number | undefined): string => {
    if (!count && count !== 0) return '0';
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (isoDuration: string): string => {
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

  if (queue.length === 0) {
    return (
      <div className="video-queue-empty">
        <div className="empty-state">
          <p className="empty-icon">📋</p>
          <p className="empty-text">Queue is empty</p>
          <p className="empty-hint">Search for videos to add to queue</p>
        </div>
        <style>{emptyStyles}</style>
      </div>
    );
  }

  return (
    <div className="video-queue-container">
      {/* Header */}
      <div className="queue-header">
        <div className="header-info">
          <h2 className="queue-title">🎬 Video Queue</h2>
          <span className="queue-count">{queue.length} videos</span>
        </div>

        <div className="header-actions">
          <button
            className="action-btn shuffle-btn"
            onClick={onShuffle}
            title="Shuffle queue"
          >
            🔀
          </button>
          <button
            className="action-btn clear-btn"
            onClick={onClearQueue}
            title="Clear queue"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="queue-list">
        {queue.map((video, index) => {
          const isPlaying = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const isPlayed = index < currentIndex;

          return (
            <div
              key={`${video.id}-${index}`}
              className={`queue-item ${isPlaying ? 'playing' : ''} ${isPlayed ? 'played' : ''}`}
              onClick={() => onSelectVideo(index)}
            >
              {/* Position indicator */}
              <div className="position-indicator">
                {isPlaying ? (
                  <span className="playing-icon">▶️</span>
                ) : (
                  <span className="position-number">{index + 1}</span>
                )}
              </div>

              {/* Thumbnail */}
              <div className="queue-thumbnail-wrapper">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="queue-thumbnail"
                />

                {/* Duration */}
                {isYouTubeVideo(video) && video.duration && (
                  <div className="queue-duration">
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* Status overlay */}
                {isPlaying && <div className="playing-overlay">NOW PLAYING</div>}
                {isPlayed && <div className="played-overlay">✓</div>}
              </div>

              {/* Video Info */}
              <div className="queue-item-info">
                <h3 className="queue-item-title">{video.title}</h3>

                <div className="queue-item-metadata">
                  {isYouTubeVideo(video) && (
                    <>
                      <span className="channel-name">{video.channelTitle}</span>
                      <span className="metadata-separator">•</span>
                      <span className="view-count">
                        {formatViewCount(video.viewCount)} views
                      </span>
                    </>
                  )}

                  {isRedditVideo(video) && (
                    <>
                      <span className="subreddit-name">r/{video.subreddit}</span>
                      <span className="metadata-separator">•</span>
                      <span className="reddit-score">
                        ⬆️ {formatViewCount(video.score)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveVideo(index);
                }}
                title="Remove from queue"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <style>{queueStyles}</style>
    </div>
  );
}

const emptyStyles = `
  .video-queue-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
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

  .empty-hint {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    margin: 0;
  }
`;

const queueStyles = `
  .video-queue-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    overflow: hidden;
  }

  .queue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 2px solid rgba(250, 204, 21, 0.2);
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .queue-title {
    color: white;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .queue-count {
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    background: rgba(250, 204, 21, 0.1);
    color: #facc15;
    border: 2px solid rgba(250, 204, 21, 0.3);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: rgba(250, 204, 21, 0.2);
    border-color: rgba(250, 204, 21, 0.5);
    transform: scale(1.05);
  }

  .clear-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    color: #ef4444;
  }

  .queue-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .queue-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(250, 204, 21, 0.15);
    border-radius: 10px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .queue-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(250, 204, 21, 0.3);
    transform: translateX(4px);
  }

  .queue-item.playing {
    background: rgba(250, 204, 21, 0.15);
    border-color: rgba(250, 204, 21, 0.5);
    box-shadow: 0 4px 12px rgba(250, 204, 21, 0.2);
  }

  .queue-item.played {
    opacity: 0.6;
  }

  .position-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .playing-icon {
    font-size: 20px;
  }

  .position-number {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 600;
  }

  .queue-item.playing .position-number {
    color: #facc15;
  }

  .queue-thumbnail-wrapper {
    position: relative;
    width: 120px;
    height: 68px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
  }

  .queue-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .queue-duration {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
  }

  .playing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(250, 204, 21, 0.9);
    color: #1a1a2e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .played-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(34, 197, 94, 0.9);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .queue-item-info {
    flex: 1;
    min-width: 0;
  }

  .queue-item-title {
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 6px 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .queue-item.playing .queue-item-title {
    color: #facc15;
  }

  .queue-item-metadata {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  .channel-name,
  .subreddit-name {
    font-weight: 500;
  }

  .metadata-separator {
    color: rgba(255, 255, 255, 0.3);
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.5);
    transform: scale(1.1);
  }

  /* Scrollbar styling */
  .queue-list::-webkit-scrollbar {
    width: 8px;
  }

  .queue-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .queue-list::-webkit-scrollbar-thumb {
    background: rgba(250, 204, 21, 0.3);
    border-radius: 4px;
  }

  .queue-list::-webkit-scrollbar-thumb:hover {
    background: rgba(250, 204, 21, 0.5);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .queue-thumbnail-wrapper {
      width: 100px;
      height: 56px;
    }

    .queue-item-title {
      font-size: 13px;
    }

    .queue-item-metadata {
      font-size: 11px;
    }
  }
`;
