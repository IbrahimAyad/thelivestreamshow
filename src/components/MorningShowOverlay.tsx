import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp } from 'lucide-react'

interface EpisodeInfo {
  episode_number?: number
  episode_title: string
  episode_topic: string
  is_active: boolean
}

interface NewsStory {
  id: string
  headline: string
  category: string
  source: string
  is_visible: boolean
}

export function MorningShowOverlay() {
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null)
  const [newsStories, setNewsStories] = useState<NewsStory[]>([])
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)

  useEffect(() => {
    loadEpisodeInfo()
    loadNewsStories()
    subscribeToChanges()
  }, [])

  // Rotate news stories every 8 seconds
  useEffect(() => {
    if (newsStories.length === 0) return

    const interval = setInterval(() => {
      setCurrentNewsIndex(prev => (prev + 1) % newsStories.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [newsStories.length])

  const loadEpisodeInfo = async () => {
    const { data } = await supabase
      .from('episode_info')
      .select('*')
      .eq('is_active', true)
      .single()

    if (data) setEpisodeInfo(data)
  }

  const loadNewsStories = async () => {
    const { data } = await supabase
      .from('morning_news_stories')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (data) setNewsStories(data)
  }

  const subscribeToChanges = () => {
    // Episode Info Subscription
    const episodeChannel = supabase
      .channel('morning-show-info')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_info'
      }, () => loadEpisodeInfo())
      .subscribe()

    // News Stories Subscription
    const newsChannel = supabase
      .channel('morning-show-news')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'morning_news_stories'
      }, () => loadNewsStories())
      .subscribe()

    return () => {
      episodeChannel.unsubscribe()
      newsChannel.unsubscribe()
    }
  }

  const currentStory = newsStories[currentNewsIndex]

  return (
    <div className="morning-show-overlay">
      {/* Animated Background Particles */}
      <div className="particles-container">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      {/* Top Bar - Minimalist */}
      <div className="top-bar">
        <div className="episode-badge">
          EP {episodeInfo?.episode_number || 1}
        </div>
        <div className="episode-title">
          {episodeInfo?.episode_title || 'Good Morning!'}
        </div>
      </div>

      {/* Bottom Bar - News Ticker & Branding */}
      <div className="bottom-bar">
        <div className="bottom-content">
          {/* Left: Show Branding */}
          <div className="show-branding">
            <div className="show-title">THE MORNING SHOW</div>
            <div className="show-subtitle">{episodeInfo?.episode_topic || 'Starting Your Day Right'}</div>
          </div>

          {/* Right: News Ticker */}
          {currentStory && (
            <div className="news-ticker">
              <div className="news-label">
                <TrendingUp className="w-5 h-5 text-white" />
                <span>LATEST NEWS</span>
              </div>
              <div className="news-content">
                <span className="news-category">{currentStory.category}</span>
                <span className="news-headline">{currentStory.headline}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .morning-show-overlay {
          position: fixed;
          inset: 0;
          width: 1920px;
          height: 1080px;
          pointer-events: none;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Animated Background Particles */
        .particles-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
        }

        .particle {
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(40px);
          animation: particleFloat 15s infinite ease-in-out;
          opacity: 0.5;
        }

        .particle-1 { left: 10%; top: 15%; animation-duration: 18s; }
        .particle-2 { right: 15%; top: 50%; animation-duration: 22s; animation-delay: 4s; }
        .particle-3 { left: 40%; bottom: 20%; animation-duration: 20s; animation-delay: 8s; }
        .particle-4 { right: 35%; top: 10%; animation-duration: 25s; animation-delay: 12s; }

        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          25% { transform: translate(30px, -30px) scale(1.1); opacity: 0.6; }
          50% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.5; }
          75% { transform: translate(25px, 25px) scale(1.05); opacity: 0.55; }
        }

        /* Top Bar */
        .top-bar {
          position: fixed;
          top: 40px;
          left: 40px;
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 100;
        }

        .episode-badge {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 1px;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
        }

        .episode-title {
          color: white;
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
          background: rgba(0, 0, 0, 0.4);
          padding: 8px 20px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }

        /* Bottom Bar */
        .bottom-bar {
          position: fixed;
          bottom: 40px;
          left: 40px;
          right: 40px;
          height: 100px;
          z-index: 90;
          display: flex;
          align-items: flex-end;
        }

        .bottom-content {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(90deg, 
            rgba(8, 145, 178, 0.9) 0%, 
            rgba(6, 182, 212, 0.8) 40%, 
            rgba(15, 23, 42, 0.9) 100%
          );
          border-radius: 16px;
          padding: 0 30px;
          height: 90px;
          border: 2px solid rgba(6, 182, 212, 0.4);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }

        .show-branding {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .show-title {
          font-size: 36px;
          font-weight: 900;
          color: white;
          letter-spacing: 2px;
          line-height: 1;
          margin-bottom: 4px;
        }

        .show-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* News Ticker */
        .news-ticker {
          flex: 1;
          margin-left: 60px;
          display: flex;
          align-items: center;
          gap: 20px;
          height: 100%;
          overflow: hidden;
        }

        .news-label {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 8px;
          color: #22d3ee;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .news-content {
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideIn 0.5s ease-out;
        }

        .news-category {
          background: #ec4899;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .news-headline {
          color: white;
          font-size: 20px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 800px;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
