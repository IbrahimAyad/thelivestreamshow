import { useEffect, useState, useRef } from 'react'
import { usePerplexitySearch } from '../hooks/usePerplexitySearch'
import { useYouTubeAPI, type YouTubeVideo } from '../hooks/useYouTubeAPI'
import { useRedditAPI, type RedditVideo, VIDEO_SUBREDDITS } from '../hooks/useRedditAPI'
import { VideoPlayer } from './VideoPlayer'
import { VideoGrid } from './VideoGrid'
import { VideoQueue } from './VideoQueue'

interface MediaBrowserOverlayProps {
  query: string
  type: 'images' | 'videos'
  onClose: () => void
  durationSeconds?: number
  onReadAloud?: (text: string) => void
  onSummarize?: (text: string) => void
  metadata?: {
    recency?: 'day' | 'week' | 'month' | 'year';
    domains?: string[];
    model?: 'sonar' | 'sonar-pro';
  };
}

export function MediaBrowserOverlay({
  query,
  type,
  onClose,
  durationSeconds = 60,
  onReadAloud,
  onSummarize,
  metadata
}: MediaBrowserOverlayProps) {
  console.log('🎬 MediaBrowserOverlay mounted with:', { query, type, durationSeconds })
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds)

  // Detect if running in OBS browser source (can't interact with UI)
  const isOBSBrowser = typeof window !== 'undefined' && (
    window.obsstudio !== undefined ||
    window.location !== window.parent.location ||
    window.name === 'OBS Browser Source'
  )

  if (isOBSBrowser) {
    console.log('📺 OBS Browser Mode detected - Filter UI will be hidden')
  }

  // Text mode state (Perplexity)
  const [answer, setAnswer] = useState('')
  const [streamingAnswer, setStreamingAnswer] = useState('') // For progressive display
  const [sources, setSources] = useState<string[]>([])
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [recency, setRecency] = useState<'day' | 'week' | 'month' | 'year' | undefined>(undefined)
  const [useSonarPro, setUseSonarPro] = useState(false)
  const [domainFilter, setDomainFilter] = useState<'all' | 'news' | 'tech' | 'academic'>('all')
  const { search, searchWithFilters, isSearching, error } = usePerplexitySearch()

  // Video mode state
  const [mode, setMode] = useState<'grid' | 'player' | 'queue'>('grid')
  const [videos, setVideos] = useState<(YouTubeVideo | RedditVideo)[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videoQueue, setVideoQueue] = useState<(YouTubeVideo | RedditVideo)[]>([])

  // Video hooks
  const youtube = useYouTubeAPI()
  const reddit = useRedditAPI()

  // Deduplication: track last searched query to prevent duplicate searches
  const lastSearchRef = useRef<{ query: string; timestamp: number } | null>(null)

  // Fetch content on mount (text or video based on type)
  useEffect(() => {
    let isMounted = true

    const fetchContent = async () => {
      // Deduplication: skip if same query was searched within last 5 seconds
      const now = Date.now()
      if (lastSearchRef.current) {
        const timeSinceLastSearch = now - lastSearchRef.current.timestamp
        const isSameQuery = lastSearchRef.current.query === query
        if (isSameQuery && timeSinceLastSearch < 5000) {
          console.log('⏭️ Skipping duplicate search (same query within 5 seconds)')
          return
        }
      }

      // Update last search tracker
      lastSearchRef.current = { query, timestamp: now }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔍 MediaBrowserOverlay: Starting new search')
      console.log('📋 Query:', query)
      console.log('🎯 Type:', type)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      if (type === 'videos') {
        console.log('🎬 Taking VIDEO search path (YouTube + Reddit)')
        // Video mode: search YouTube and Reddit
        console.log('🎬 Searching for videos:', query)

        // YouTube + Reddit search (both enabled with fresh API key)
        const ENABLE_YOUTUBE = true; // Set to false if quota exhausted

        // Search YouTube (disabled until quota resets)
        let youtubeVideos: YouTubeVideo[] = []
        if (ENABLE_YOUTUBE) {
          const queryParams = youtube.processQuery(query)
          console.log('📋 Query params:', queryParams)

          try {
            if (queryParams.type === 'trending') {
              youtubeVideos = await youtube.getTrending()
            } else if (queryParams.channelId) {
              youtubeVideos = await youtube.getChannelVideos(queryParams.channelId)
            } else {
              youtubeVideos = await youtube.searchVideos(queryParams.query || query, {
                type: queryParams.type,
                sortBy: queryParams.sortBy,
              })
            }
          } catch (error) {
            console.error('❌ YouTube API error:', error)
            // Continue with empty results rather than crashing
          }
        } else {
          console.log('⚠️ YouTube search disabled (quota exhausted) - using Reddit only')
        }

        // ALWAYS search Reddit with smart query processing
        let redditVideos: RedditVideo[] = []
        console.log('🔥 Searching Reddit with smart search...')
        try {
          redditVideos = await reddit.searchVideos(query)
        } catch (error) {
          console.error('❌ Reddit API error:', error)
        }

        // Only update state if component is still mounted
        if (isMounted) {
          // Combine results (YouTube first, then Reddit)
          const allVideos = [...youtubeVideos, ...redditVideos]
          setVideos(allVideos)
          setVideoQueue(allVideos)

          console.log(`✅ Found ${allVideos.length} total videos (${youtubeVideos.length} YouTube, ${redditVideos.length} Reddit)`)

          // SMART FALLBACK: If no videos found, try Perplexity instead
          if (allVideos.length === 0) {
            console.log('⚠️ No videos found, initiating smart fallback to Perplexity...')
            console.log('🔄 Converting query to web search:', query)

            // Reset streaming state
            setStreamingAnswer('')

            try {
              const startTime = Date.now()
              const result = await search(query, (chunk) => {
                // Streaming callback
                if (isMounted) {
                  setStreamingAnswer((prev) => prev + chunk)
                }
              })

              const endTime = Date.now()
              const responseTime = endTime - startTime

              if (isMounted) {
                console.log('✅ Fallback search successful, displaying answer instead')
                setAnswer(result.answer)
                setSources(result.sources || [])
                setResponseTime(responseTime)
                setStreamingAnswer('') // Clear streaming state
              }
            } catch (fallbackError) {
              console.error('❌ Fallback to Perplexity also failed:', fallbackError)
              // Keep showing "No videos found" state
            }
          }
        }
      } else {
        // Text mode: fetch Perplexity answer with streaming
        console.log('🤖 Taking PERPLEXITY search path (AI-powered answer)')
        console.log('🔍 Fetching Perplexity answer for:', query)

        const startTime = Date.now()

        // Reset streaming state
        setStreamingAnswer('')

        // Use voice-activated filters if provided
        let result: any
        if (metadata && (metadata.recency || metadata.domains || metadata.model)) {
          console.log('🎤 Using voice-activated filters:', metadata)
          result = await searchWithFilters(query, {
            recency: metadata.recency,
            domains: metadata.domains,
            model: metadata.model || 'sonar',
            onStreamChunk: (chunk) => {
              if (isMounted) {
                setStreamingAnswer((prev) => prev + chunk)
              }
            }
          })
        } else {
          console.log('🔍 Using standard search (no filters)')
          result = await search(query, (chunk) => {
            // Streaming callback - update answer as chunks arrive
            if (isMounted) {
              setStreamingAnswer((prev) => prev + chunk)
            }
          })
        }

        const endTime = Date.now()
        const responseTime = endTime - startTime

        console.log('✅ Got answer:', result)

        if (isMounted) {
          console.log('💾 Setting answer state:', {
            answerLength: result.answer?.length || 0,
            sourcesCount: result.sources?.length || 0,
            answerPreview: result.answer?.substring(0, 100),
            responseTime: `${responseTime}ms`
          })
          setAnswer(result.answer)
          setSources(result.sources || [])
          setResponseTime(responseTime)
          setStreamingAnswer('') // Clear streaming state when complete
        }
      }
    }

    fetchContent()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type])

  // Auto-close when timer reaches zero
  useEffect(() => {
    if (timeRemaining <= 0) {
      console.log('⏰ MediaBrowserOverlay timer expired, closing...')
      onClose()
    }
  }, [timeRemaining, onClose])

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Video control handlers
  const handleSelectVideo = (video: YouTubeVideo | RedditVideo, index: number) => {
    setCurrentVideoIndex(index)
    setMode('player')
  }

  const handleNext = () => {
    if (currentVideoIndex < videoQueue.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1)
    }
  }

  const handleVideoEnded = () => {
    // Auto-play next video in queue
    if (currentVideoIndex < videoQueue.length - 1) {
      handleNext()
    }
  }

  const handleRemoveFromQueue = (index: number) => {
    const newQueue = videoQueue.filter((_, i) => i !== index)
    setVideoQueue(newQueue)
    // Adjust current index if needed
    if (currentVideoIndex >= index && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1)
    }
  }

  const handleClearQueue = () => {
    setVideoQueue([])
    setMode('grid')
  }

  const handleShuffle = () => {
    const shuffled = [...videoQueue].sort(() => Math.random() - 0.5)
    setVideoQueue(shuffled)
    setCurrentVideoIndex(0)
  }

  const handlePlayAll = () => {
    setCurrentVideoIndex(0)
    setMode('player')
  }

  // Domain filter helper
  const getDomains = (filterType: string): string[] | undefined => {
    switch (filterType) {
      case 'news':
        return ['cnn.com', 'bbc.com', 'reuters.com', 'apnews.com', 'npr.org']
      case 'tech':
        return ['techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com', 'engadget.com']
      case 'academic':
        return ['scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'jstor.org']
      default:
        return undefined
    }
  }

  // Format answer text with proper line breaks and bullet points
  const formatAnswer = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Handle bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
          return (
            <li key={index} className="answer-bullet">
              {line.replace(/^[•\-\*]\s*/, '')}
            </li>
          )
        }
        // Handle numbered lists
        else if (/^\d+\./.test(line.trim())) {
          return (
            <li key={index} className="answer-numbered">
              {line.replace(/^\d+\.\s*/, '')}
            </li>
          )
        }
        // Regular paragraph
        else if (line.trim()) {
          return (
            <p key={index} className="answer-paragraph">
              {line}
            </p>
          )
        }
        return null
      })
  }

  const isLoading = type === 'videos' ? (youtube.isLoading || reddit.isLoading) : isSearching
  const hasError = type === 'videos' ? (youtube.error || reddit.error) : error

  // Debug logging for render conditions
  useEffect(() => {
    if (type !== 'videos') {
      console.log('🎯 MediaBrowserOverlay render conditions:', {
        type,
        isSearching,
        hasError,
        answerLength: answer?.length || 0,
        shouldShowAnswer: type !== 'videos' && !isSearching && !hasError && answer
      })
    }
  }, [type, isSearching, hasError, answer])

  return (
    <div className="media-browser-overlay">
      {/* Header Bar */}
      <div className="media-browser-header">
        <div className="search-info">
          <span className="search-type-badge">
            {type === 'videos' ? '🎬 Video Search' : '🔍 Perplexity AI'}
          </span>
          <span className="search-query">{query}</span>
        </div>

        <div className="controls">
          {/* Video mode switcher */}
          {type === 'videos' && videoQueue.length > 0 && (
            <div className="mode-switcher">
              <button
                className={`mode-btn ${mode === 'grid' ? 'active' : ''}`}
                onClick={() => setMode('grid')}
                title="Grid view"
              >
                🎬
              </button>
              <button
                className={`mode-btn ${mode === 'player' ? 'active' : ''}`}
                onClick={() => setMode('player')}
                title="Player view"
              >
                ▶️
              </button>
              <button
                className={`mode-btn ${mode === 'queue' ? 'active' : ''}`}
                onClick={() => setMode('queue')}
                title="Queue view"
              >
                📋
              </button>
            </div>
          )}

          <span className="timer">{timeRemaining}s</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Voice-Activated Filters Badge */}
      {metadata && type !== 'videos' && (
        <div className="voice-filters-badge">
          <div className="badge-content">
            <span className="badge-icon">🎤</span>
            <span className="badge-text">Voice Filters Applied:</span>
            {metadata.recency && <span className="filter-chip">📅 {metadata.recency}</span>}
            {metadata.domains && <span className="filter-chip">🌐 {metadata.domains.length} sources</span>}
            {metadata.model === 'sonar-pro' && <span className="filter-chip">💎 Sonar Pro</span>}
          </div>
        </div>
      )}

      {/* Action Buttons (Text mode only) */}
      {type !== 'videos' && !isSearching && !error && answer && (
        <div className="action-bar">
          <button
            className="action-btn read-btn"
            onClick={() => onReadAloud?.(answer)}
          >
            🔊 Read Aloud
          </button>
          <button
            className="action-btn summarize-btn"
            onClick={() => onSummarize?.(answer)}
          >
            📝 Summarize
          </button>
        </div>
      )}

      {/* Filter Controls (Text mode before search) - Hidden in OBS mode */}
      {type !== 'videos' && !isOBSBrowser && (
        <div className="filter-bar">
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔧 {showFilters ? 'Hide' : 'Show'} Filters
          </button>

          {showFilters && (
            <div className="filter-controls">
              {/* Date Range Filter */}
              <div className="filter-group">
                <label>📅 Time Range:</label>
                <select value={recency || 'all'} onChange={(e) => setRecency(e.target.value === 'all' ? undefined : e.target.value as any)}>
                  <option value="all">All Time</option>
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Domain Filter */}
              <div className="filter-group">
                <label>🌐 Sources:</label>
                <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value as any)}>
                  <option value="all">All Sources</option>
                  <option value="news">News Only</option>
                  <option value="tech">Tech Sites</option>
                  <option value="academic">Academic</option>
                </select>
              </div>

              {/* Sonar Pro Toggle */}
              <div className="filter-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useSonarPro}
                    onChange={(e) => setUseSonarPro(e.target.checked)}
                  />
                  <span>💎 Use Sonar Pro (deeper analysis)</span>
                </label>
              </div>

              {/* Apply Filters Button */}
              <button
                className="apply-filters-btn"
                onClick={async () => {
                  const domains = getDomains(domainFilter)
                  setStreamingAnswer('')
                  setAnswer('')
                  setSources([])

                  const startTime = Date.now()
                  const result = await searchWithFilters(query, {
                    recency,
                    domains,
                    model: useSonarPro ? 'sonar-pro' : 'sonar',
                    onStreamChunk: (chunk) => setStreamingAnswer((prev) => prev + chunk)
                  })
                  const endTime = Date.now()

                  setAnswer(result.answer)
                  setSources(result.sources || [])
                  setResponseTime(endTime - startTime)
                  setStreamingAnswer('')
                }}
                disabled={isSearching}
              >
                🔄 Re-search with Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="content-area">
        {/* Loading State */}
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>{type === 'videos' ? 'Searching for videos...' : 'Searching Perplexity AI...'}</p>
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="error-message">
            <p>❌ {hasError}</p>
          </div>
        )}

        {/* Debug: No content state */}
        {type !== 'videos' && !isLoading && !hasError && !answer && (
          <div className="loading-indicator">
            <p>⏳ Waiting for Perplexity response...</p>
          </div>
        )}

        {/* Video Mode */}
        {type === 'videos' && !isLoading && !hasError && (
          <>
            {/* Grid Mode */}
            {mode === 'grid' && (
              <VideoGrid
                videos={videos}
                onSelectVideo={handleSelectVideo}
                onPlayAll={handlePlayAll}
                onShuffle={handleShuffle}
                query={query}
              />
            )}

            {/* Player Mode */}
            {mode === 'player' && (
              <VideoPlayer
                video={videoQueue[currentVideoIndex] || null}
                onEnded={handleVideoEnded}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hasNext={currentVideoIndex < videoQueue.length - 1}
                hasPrevious={currentVideoIndex > 0}
                queuePosition={{
                  current: currentVideoIndex + 1,
                  total: videoQueue.length,
                }}
              />
            )}

            {/* Queue Mode */}
            {mode === 'queue' && (
              <VideoQueue
                queue={videoQueue}
                currentIndex={currentVideoIndex}
                onSelectVideo={(index) => {
                  setCurrentVideoIndex(index)
                  setMode('player')
                }}
                onRemoveVideo={handleRemoveFromQueue}
                onClearQueue={handleClearQueue}
                onShuffle={handleShuffle}
              />
            )}
          </>
        )}

        {/* Text Mode (Perplexity) - Show streaming answer OR final answer */}
        {type !== 'videos' && !error && (streamingAnswer || answer) && (
          <div className="answer-container">
            {/* Response Time Badge */}
            {responseTime && !isSearching && (
              <div className="response-time-badge">
                ⏱️ Response time: {(responseTime / 1000).toFixed(2)}s
              </div>
            )}

            <div className="answer-content">
              {formatAnswer(streamingAnswer || answer)}
              {streamingAnswer && <span className="streaming-cursor">▋</span>}
            </div>

            {/* Sources (only show when streaming is complete) */}
            {!isSearching && sources.length > 0 && (
              <div className="sources-section">
                <h3 className="sources-title">📚 Sources</h3>
                <ul className="sources-list">
                  {sources.map((source, index) => (
                    <li key={index} className="source-item">
                      <a href={source} target="_blank" rel="noopener noreferrer">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .media-browser-overlay {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 60%;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .media-browser-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          background: linear-gradient(135deg, rgba(250, 204, 21, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%);
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

        .mode-switcher {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
          border: 1px solid rgba(250, 204, 21, 0.2);
        }

        .mode-btn {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn:hover {
          background: rgba(250, 204, 21, 0.1);
          color: #facc15;
        }

        .mode-btn.active {
          background: rgba(250, 204, 21, 0.2);
          color: #facc15;
          box-shadow: 0 2px 8px rgba(250, 204, 21, 0.2);
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

        .action-bar {
          display: flex;
          gap: 15px;
          padding: 15px 30px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(250, 204, 21, 0.15);
        }

        .action-btn {
          flex: 1;
          padding: 12px 20px;
          border: 2px solid rgba(250, 204, 21, 0.3);
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(250, 204, 21, 0.1);
          color: #facc15;
        }

        .action-btn:hover {
          background: rgba(250, 204, 21, 0.2);
          border-color: rgba(250, 204, 21, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(250, 204, 21, 0.2);
        }

        .action-btn:active {
          transform: translateY(0);
        }

        .read-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          color: #3b82f6;
        }

        .summarize-btn:hover {
          background: rgba(168, 85, 247, 0.2);
          border-color: rgba(168, 85, 247, 0.5);
          color: #a855f7;
        }

        .voice-filters-badge {
          padding: 12px 30px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
          border-bottom: 2px solid rgba(16, 185, 129, 0.3);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .badge-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .badge-icon {
          font-size: 18px;
        }

        .badge-text {
          color: #10B981;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-chip {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #10B981;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .filter-bar {
          padding: 12px 30px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(250, 204, 21, 0.1);
        }

        .filter-toggle-btn {
          background: rgba(99, 102, 241, 0.15);
          border: 2px solid rgba(99, 102, 241, 0.3);
          color: #6366F1;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-toggle-btn:hover {
          background: rgba(99, 102, 241, 0.25);
          border-color: rgba(99, 102, 241, 0.5);
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 15px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(250, 204, 21, 0.2);
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }

        .filter-group select {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(250, 204, 21, 0.3);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-group select:hover {
          border-color: rgba(250, 204, 21, 0.5);
          background: rgba(0, 0, 0, 0.6);
        }

        .filter-group select:focus {
          outline: none;
          border-color: #facc15;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #6366F1;
        }

        .apply-filters-btn {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          border: none;
          color: white;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
          margin-left: auto;
        }

        .apply-filters-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .apply-filters-btn:active {
          transform: translateY(0);
        }

        .apply-filters-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(250, 204, 21, 0.2);
          border-top-color: #facc15;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-indicator p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin: 0;
        }

        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #ef4444;
          font-size: 18px;
        }

        .answer-container {
          max-width: 900px;
          margin: 0 auto;
          animation: fadeInUp 0.5s ease-out;
        }

        .response-time-badge {
          display: inline-block;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #10B981;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 15px;
          animation: fadeIn 0.3s ease-out;
        }

        .streaming-cursor {
          display: inline-block;
          color: #facc15;
          font-weight: bold;
          animation: blink 1s infinite;
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .answer-content {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(250, 204, 21, 0.2);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 30px;
          backdrop-filter: blur(20px);
        }

        .answer-paragraph {
          color: rgba(255, 255, 255, 0.95);
          font-size: 18px;
          line-height: 1.7;
          margin: 0 0 16px 0;
        }

        .answer-bullet,
        .answer-numbered {
          color: rgba(255, 255, 255, 0.9);
          font-size: 17px;
          line-height: 1.6;
          margin: 8px 0;
          padding-left: 10px;
        }

        .answer-bullet::before {
          content: '•';
          color: #facc15;
          font-weight: bold;
          display: inline-block;
          width: 1em;
          margin-left: -1em;
        }

        .sources-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(250, 204, 21, 0.15);
          border-radius: 12px;
          padding: 25px;
        }

        .sources-title {
          color: #facc15;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 15px 0;
        }

        .sources-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .source-item {
          margin: 10px 0;
        }

        .source-item a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
          word-break: break-all;
        }

        .source-item a:hover {
          color: #facc15;
          text-decoration: underline;
        }

        /* Scrollbar styling */
        .content-area::-webkit-scrollbar {
          width: 10px;
        }

        .content-area::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .content-area::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 5px;
        }

        .content-area::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .media-browser-overlay {
            width: 100%;
            left: 0;
          }

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

          .content-area {
            padding: 20px;
          }

          .answer-content {
            padding: 20px;
          }

          .answer-paragraph {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}
