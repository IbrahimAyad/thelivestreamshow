import { useEffect, useState } from 'react'
import { useYouTubeAPI, YouTubeVideo } from '../hooks/useYouTubeAPI'

const CHANNEL_ID = 'UC7sHcsiSYmx-aKal2hil_6A'

export function LatestEpisodes() {
  const { getChannelVideos, isLoading, error } = useYouTubeAPI()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])

  useEffect(() => {
    async function fetchVideos() {
      try {
        const results = await getChannelVideos(CHANNEL_ID, 6)
        // Filter out shorts (videos under 60 seconds)
        const fullVideos = results.filter(video => {
          const duration = parseDuration(video.duration)
          return duration >= 60
        })
        setVideos(fullVideos.slice(0, 4))
      } catch (err) {
        console.error('Failed to fetch channel videos:', err)
      }
    }

    fetchVideos()
  }, [getChannelVideos])

  if (isLoading) {
    return (
      <div className="latest-episodes-loading">
        <div className="loading-spinner" />
        <p>Loading latest episodes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="latest-episodes-error">
        <p>Unable to load episodes. Check back soon!</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return null
  }

  return (
    <div className="latest-episodes-grid">
      {videos.map((video, index) => (
        <a
          key={video.id}
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="episode-card reveal"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="episode-thumbnail">
            <img src={video.thumbnail} alt={video.title} loading="lazy" />
            <div className="episode-play-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div className="episode-duration">{formatDuration(video.duration)}</div>
          </div>
          <div className="episode-content">
            <h3 className="episode-title">{video.title}</h3>
            <div className="episode-meta">
              <span className="episode-views">{formatViews(video.viewCount)} views</span>
              <span className="episode-date">{formatDate(video.publishedAt)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

export function LatestShorts() {
  const { getChannelVideos, isLoading, error } = useYouTubeAPI()
  const [shorts, setShorts] = useState<YouTubeVideo[]>([])

  useEffect(() => {
    async function fetchShorts() {
      try {
        const results = await getChannelVideos(CHANNEL_ID, 12)
        // Filter for shorts (videos under 60 seconds)
        const shortVideos = results.filter(video => {
          const duration = parseDuration(video.duration)
          return duration < 60
        })
        setShorts(shortVideos.slice(0, 6))
      } catch (err) {
        console.error('Failed to fetch shorts:', err)
      }
    }

    fetchShorts()
  }, [getChannelVideos])

  if (isLoading || shorts.length === 0) {
    return null
  }

  return (
    <div className="latest-shorts-grid">
      {shorts.map((short, index) => (
        <a
          key={short.id}
          href={`https://www.youtube.com/shorts/${short.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="short-card reveal"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="short-thumbnail">
            <img src={short.thumbnail} alt={short.title} loading="lazy" />
            <div className="short-play-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div className="short-badge">SHORT</div>
          </div>
          <div className="short-content">
            <h4 className="short-title">{truncateTitle(short.title, 50)}</h4>
            <div className="short-views">{formatViews(short.viewCount)} views</div>
          </div>
        </a>
      ))}
    </div>
  )
}

// Helper functions
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

function formatDuration(isoDuration: string): string {
  const totalSeconds = parseDuration(isoDuration)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatViews(viewCount: string): string {
  const count = parseInt(viewCount)
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength) + '...'
}
