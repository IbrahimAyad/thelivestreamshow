import { useEffect, useRef, useState } from 'react';
import type { YouTubeVideo } from '../hooks/useYouTubeAPI';
import type { RedditVideo } from '../hooks/useRedditAPI';

interface VideoPlayerProps {
  video: YouTubeVideo | RedditVideo | null;
  onEnded?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  queuePosition?: { current: number; total: number };
}

// Type guard to check if video is YouTubeVideo
const isYouTubeVideo = (video: YouTubeVideo | RedditVideo): video is YouTubeVideo => {
  return 'channelTitle' in video;
};

// Type guard to check if video is RedditVideo
const isRedditVideo = (video: YouTubeVideo | RedditVideo): video is RedditVideo => {
  return 'subreddit' in video;
};

export function VideoPlayer({
  video,
  onEnded,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  queuePosition,
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!video) return;

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      if (!playerRef.current) return;

      let videoId = '';

      if (isYouTubeVideo(video)) {
        videoId = video.id;
      } else if (isRedditVideo(video) && video.isYouTube && video.youtubeId) {
        videoId = video.youtubeId;
      }

      if (!videoId) {
        console.warn('⚠️ No YouTube video ID found');
        return;
      }

      new (window as any).YT.Player(playerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === (window as any).YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEnded?.();
            }
          },
        },
      });
    };
  }, [video, onEnded]);

  if (!video) {
    return (
      <div className="video-player-empty">
        <div className="empty-state">
          <p className="empty-icon">🎬</p>
          <p className="empty-text">No video selected</p>
        </div>
        <style>{emptyStyles}</style>
      </div>
    );
  }

  const formatViewCount = (count: string | number | undefined): string => {
    if (!count && count !== 0) return '0';
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="video-player-container">
      {/* Video Embed */}
      <div className="video-embed-wrapper">
        {isYouTubeVideo(video) || (isRedditVideo(video) && video.isYouTube) ? (
          <div ref={playerRef} className="youtube-player"></div>
        ) : (
          <div className="non-youtube-notice">
            <p>🔗 This is a Reddit video</p>
            <a href={isRedditVideo(video) ? video.permalink : ''} target="_blank" rel="noopener noreferrer">
              View on Reddit
            </a>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>

        <div className="video-metadata">
          {isYouTubeVideo(video) && (
            <>
              <span className="channel-name">{video.channelTitle}</span>
              <span className="metadata-separator">•</span>
              <span className="view-count">{formatViewCount(video.viewCount)} views</span>
              <span className="metadata-separator">•</span>
              <span className="publish-date">{formatDate(video.publishedAt)}</span>
            </>
          )}

          {isRedditVideo(video) && (
            <>
              <span className="subreddit-name">r/{video.subreddit}</span>
              <span className="metadata-separator">•</span>
              <span className="reddit-score">⬆️ {formatViewCount(video.score)}</span>
              <span className="metadata-separator">•</span>
              <span className="comment-count">💬 {video.numComments}</span>
            </>
          )}
        </div>

        {/* Queue Position */}
        {queuePosition && (
          <div className="queue-position">
            Video {queuePosition.current} of {queuePosition.total}
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="playback-controls">
        <button
          className="control-btn"
          onClick={onPrevious}
          disabled={!hasPrevious}
          title="Previous video"
        >
          ⏮️ Previous
        </button>

        <div className="play-status">
          {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
        </div>

        <button
          className="control-btn"
          onClick={onNext}
          disabled={!hasNext}
          title="Next video"
        >
          Next ⏭️
        </button>
      </div>

      <style>{playerStyles}</style>
    </div>
  );
}

const emptyStyles = `
  .video-player-empty {
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
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
    margin: 0;
  }
`;

const playerStyles = `
  .video-player-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    overflow: hidden;
  }

  .video-embed-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    background: #000;
  }

  .youtube-player {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .non-youtube-notice {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
  }

  .non-youtube-notice p {
    font-size: 24px;
    margin: 0 0 16px 0;
  }

  .non-youtube-notice a {
    color: #facc15;
    text-decoration: none;
    font-size: 16px;
    padding: 8px 16px;
    border: 1px solid #facc15;
    border-radius: 8px;
    display: inline-block;
    transition: all 0.2s ease;
  }

  .non-youtube-notice a:hover {
    background: rgba(250, 204, 21, 0.2);
    transform: scale(1.05);
  }

  .video-info {
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(250, 204, 21, 0.2);
  }

  .video-title {
    color: white;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 12px 0;
    line-height: 1.4;
  }

  .video-metadata {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }

  .channel-name,
  .subreddit-name {
    color: #facc15;
    font-weight: 500;
  }

  .metadata-separator {
    color: rgba(255, 255, 255, 0.4);
  }

  .queue-position {
    margin-top: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
  }

  .playback-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.03);
  }

  .control-btn {
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

  .control-btn:hover:not(:disabled) {
    background: rgba(250, 204, 21, 0.2);
    border-color: rgba(250, 204, 21, 0.5);
    transform: translateY(-2px);
  }

  .control-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .play-status {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
  }
`;
