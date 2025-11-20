import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface EpisodeInfo {
  episode_number?: number
  episode_title: string
  episode_topic: string
  is_active: boolean
}

export function MorningShowOverlay() {
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null)

  useEffect(() => {
    loadEpisodeInfo()
    subscribeToChanges()
  }, [])

  const loadEpisodeInfo = async () => {
    const { data, error } = await supabase
      .from('episode_info')
      .select('*')
      .eq('is_active', true)
      .single()

    console.log('☀️ Morning Show - Loading episode info:', { data, error })
    if (data) {
      setEpisodeInfo(data)
    }
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('morning-show-overlay')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_info'
      }, () => {
        console.log('☀️ Episode info updated, reloading...')
        loadEpisodeInfo()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  return (
    <div className="morning-show-overlay">
      {/* Animated Background Particles */}
      <div className="particles-container">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="episode-badge">
          EP {episodeInfo?.episode_number || 1}
        </div>
        <div className="episode-title">
          {episodeInfo?.episode_title || 'Good Morning!'}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <div className="show-branding">
          <div className="show-title">THE MORNING SHOW</div>
          <div className="show-subtitle">{episodeInfo?.episode_topic || 'Starting Your Day Right'}</div>
        </div>
      </div>

      <style>{`
        .morning-show-overlay {
          position: fixed;
          inset: 0;
          width: 1920px;
          height: 1080px;
          pointer-events: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
          background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(40px);
          animation: particleFloat 15s infinite ease-in-out;
          opacity: 0.5;
        }

        .particle-1 {
          left: 10%;
          top: 15%;
          animation-duration: 18s;
          animation-delay: 0s;
        }

        .particle-2 {
          right: 15%;
          top: 50%;
          animation-duration: 22s;
          animation-delay: 4s;
        }

        .particle-3 {
          left: 40%;
          bottom: 20%;
          animation-duration: 20s;
          animation-delay: 8s;
        }

        .particle-4 {
          right: 35%;
          top: 10%;
          animation-duration: 25s;
          animation-delay: 12s;
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.5;
          }
          75% {
            transform: translate(25px, 25px) scale(1.05);
            opacity: 0.55;
          }
        }

        /* Top Bar */
        .top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to bottom,
            rgba(6, 182, 212, 0.95) 0%,
            rgba(8, 145, 178, 0.8) 40%,
            rgba(6, 182, 212, 0.3) 100%
          );
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 15px 30px 0 30px;
          z-index: 100;
          border-bottom: 3px solid rgba(6, 182, 212, 0.6);
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
        }

        .episode-badge {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 2px;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.5);
        }

        .episode-title {
          flex: 1;
          text-align: center;
          color: white;
          font-size: 32px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 3px;
          text-shadow: 0 3px 10px rgba(0, 0, 0, 0.8);
          padding: 8px 20px;
        }

        /* Bottom Bar */
        .bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 130px;
          background: linear-gradient(to top,
            rgba(6, 182, 212, 0.95) 0%,
            rgba(8, 145, 178, 0.8) 40%,
            rgba(6, 182, 212, 0.3) 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 40px;
          z-index: 90;
          border-top: 3px solid rgba(6, 182, 212, 0.6);
          box-shadow: 0 -4px 20px rgba(6, 182, 212, 0.4);
        }

        .show-branding {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .show-title {
          font-size: 60px;
          font-weight: 900;
          color: white;
          letter-spacing: 8px;
          text-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
          line-height: 1;
        }

        .show-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: -5px;
        }
      `}</style>
    </div>
  )
}
