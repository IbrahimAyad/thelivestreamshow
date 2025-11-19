import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface EpisodeInfo {
  episode_number?: number
  episode_title: string
  episode_topic: string
  is_active: boolean
}

type LayoutMode = 'default' | 'debate' | 'presentation' | 'gaming'

export function AlphaWednesdayOverlay() {
  const [mode, setMode] = useState<LayoutMode>('default')
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null)

  useEffect(() => {
    loadEpisodeInfo()
    loadOverlayMode()
    subscribeToChanges()
  }, [])

  const loadEpisodeInfo = async () => {
    const { data, error } = await supabase
      .from('episode_info')
      .select('*')
      .eq('is_active', true)
      .single()

    console.log('📺 Alpha Wednesday - Loading episode info:', { data, error })
    if (data) {
      setEpisodeInfo(data)
    }
  }

  const loadOverlayMode = async () => {
    const { data, error } = await supabase
      .from('broadcast_graphics')
      .select('config')
      .eq('type', 'alpha_wednesday')
      .single()

    console.log('🎨 Alpha Wednesday - Loading mode:', { data, error })

    if (data?.config?.mode) {
      console.log('✅ Mode set to:', data.config.mode)
      setMode(data.config.mode)
    } else {
      console.log('⚠️ No mode found, using default')
    }
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('alpha-wednesday-overlay')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_graphics',
        filter: 'type=eq.alpha_wednesday'
      }, (payload: any) => {
        console.log('📡 Alpha Wednesday - Mode update received:', payload)
        if (payload.new?.config?.mode) {
          console.log('✅ Setting mode to:', payload.new.config.mode)
          setMode(payload.new.config.mode)
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_info'
      }, () => {
        console.log('📺 Episode info updated, reloading...')
        loadEpisodeInfo()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const modeNames: Record<LayoutMode, string> = {
    default: 'DEFAULT',
    debate: 'DEBATE MODE',
    presentation: 'PRESENTATION',
    gaming: 'CLEAN SLATE'
  }

  // Log mode changes
  useEffect(() => {
    console.log('🎮 Current mode:', mode, '| Frames visible:', mode !== 'gaming')
  }, [mode])

  return (
    <div className={`alpha-wednesday-overlay layout-${mode}`}>
      {/* Smoke Background Animation */}
      <div className="smoke-container">
        <div className="smoke smoke-1"></div>
        <div className="smoke smoke-2"></div>
        <div className="smoke smoke-3"></div>
        <div className="smoke smoke-4"></div>
      </div>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="episode-badge">
          EP {episodeInfo?.episode_number || 1}
        </div>
        <div className="episode-title">
          {episodeInfo?.episode_title || 'Alpha Wednesday Returns'}
        </div>
        <div className="mode-status">
          <div className="mode-display">{modeNames[mode]}</div>
          <div className="status-indicator"></div>
        </div>
      </div>

      {/* Content Frames - Only visible in non-Clean Slate modes */}
      {mode !== 'gaming' && (
        <div className="content-area">
          <div className="frame discord-frame" id="discordFrame"></div>
          <div className="frame camera-frame" id="cameraFrame"></div>
          <div className="frame media-frame" id="mediaFrame"></div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <div className="show-branding">
          <div className="show-title">ALPHA WEDNESDAY</div>
          <div className="show-subtitle">{episodeInfo?.episode_topic || 'AI, Tech News & Community Discussion'}</div>
        </div>
        <div className="episode-meta">
          <div className="meta-episode">EP {episodeInfo?.episode_number || 1}</div>
          <div className="meta-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          <div className="meta-title">{episodeInfo?.episode_title || 'Alpha Wednesday Returns'}</div>
        </div>
      </div>

      <style>{`
        .alpha-wednesday-overlay {
          position: fixed;
          inset: 0;
          width: 1920px;
          height: 1080px;
          pointer-events: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Smoke Background Animation */
        .smoke-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
        }

        .smoke {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 0, 0, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
          animation: smokeFloat 20s infinite ease-in-out;
          opacity: 0.4;
        }

        .smoke-1 {
          left: -10%;
          top: 20%;
          animation-duration: 25s;
          animation-delay: 0s;
        }

        .smoke-2 {
          right: -10%;
          top: 60%;
          animation-duration: 30s;
          animation-delay: 5s;
        }

        .smoke-3 {
          left: 30%;
          bottom: -10%;
          animation-duration: 28s;
          animation-delay: 10s;
        }

        .smoke-4 {
          right: 40%;
          top: -5%;
          animation-duration: 32s;
          animation-delay: 15s;
        }

        @keyframes smokeFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(50px, -50px) scale(1.1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-30px, 30px) scale(0.9);
            opacity: 0.4;
          }
          75% {
            transform: translate(40px, 40px) scale(1.05);
            opacity: 0.45;
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
            rgba(139, 0, 0, 0.85) 0%,
            rgba(205, 92, 92, 0.7) 40%,
            rgba(139, 0, 0, 0.3) 100%
          );
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 15px 30px 0 30px;
          z-index: 100;
          border-bottom: 3px solid rgba(255, 0, 0, 0.5);
          box-shadow: 0 4px 20px rgba(139, 0, 0, 0.6);
        }

        .episode-badge {
          background: linear-gradient(135deg, #8B0000, #FF0000);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 2px;
          box-shadow: 0 4px 15px rgba(255, 0, 0, 0.5);
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

        .mode-status {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .mode-display {
          background: rgba(0, 0, 0, 0.7);
          color: #FFD700;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 1.5px;
          border: 2px solid rgba(255, 215, 0, 0.4);
        }

        .status-indicator {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00FF00;
          box-shadow: 0 0 15px #00FF00;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Content Area */
        .content-area {
          position: fixed;
          top: 100px;
          left: 10px;
          right: 10px;
          bottom: 130px;
          z-index: 50;
        }

        .frame {
          position: absolute;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Discord Frame - Blue borders */
        .discord-frame {
          border: 2px solid rgba(88, 101, 242, 0.4);
          box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(88, 101, 242, 0.5);
        }

        /* Camera Frame - Red borders */
        .camera-frame {
          border: 2px solid rgba(255, 0, 0, 0.4);
          box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.5);
        }

        /* Media Frame - Gold borders */
        .media-frame {
          border: 2px solid rgba(255, 215, 0, 0.4);
          box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.5);
        }

        /* DEFAULT LAYOUT */
        .layout-default .discord-frame {
          top: 0;
          left: 0;
          width: 35%;
          height: 38%;
        }

        .layout-default .camera-frame {
          top: calc(38% + 10px);
          left: 0;
          width: 35%;
          height: calc(62% - 10px);
        }

        .layout-default .media-frame {
          top: 0;
          left: calc(35% + 15px);
          width: calc(65% - 15px);
          height: 100%;
        }

        /* DEBATE LAYOUT - 3 Column */
        .layout-debate .discord-frame {
          top: 0;
          left: 0;
          width: 20%;
          height: 100%;
          border-color: rgba(88, 101, 242, 0.6);
        }

        .layout-debate .camera-frame {
          top: 0;
          left: calc(20% + 10px);
          width: calc(60% - 20px);
          height: 100%;
          border-color: rgba(255, 0, 0, 0.6);
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 0, 0, 0.6);
        }

        .layout-debate .media-frame {
          top: 0;
          right: 0;
          width: calc(20% - 10px);
          height: 100%;
          border-color: rgba(255, 215, 0, 0.6);
        }

        /* PRESENTATION LAYOUT - Content Focus */
        .layout-presentation .discord-frame {
          opacity: 0;
          pointer-events: none;
        }

        .layout-presentation .camera-frame {
          bottom: 0;
          right: 0;
          width: 15%;
          height: 15%;
          top: auto;
          left: auto;
          border-radius: 12px;
        }

        .layout-presentation .media-frame {
          top: 0;
          left: 0;
          width: 85%;
          height: 85%;
        }

        /* Bottom Bar */
        .bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 130px;
          background: linear-gradient(to top,
            rgba(139, 0, 0, 0.85) 0%,
            rgba(205, 92, 92, 0.7) 40%,
            rgba(139, 0, 0, 0.3) 100%
          );
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          z-index: 90;
          border-top: 3px solid rgba(255, 0, 0, 0.5);
          box-shadow: 0 -4px 20px rgba(139, 0, 0, 0.6);
        }

        .show-branding {
          display: flex;
          flex-direction: column;
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
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: -5px;
        }

        .episode-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          color: rgba(255, 255, 255, 0.9);
        }

        .meta-episode {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .meta-date {
          font-size: 14px;
          opacity: 0.8;
        }

        .meta-title {
          font-size: 16px;
          font-weight: 600;
          opacity: 0.9;
        }
      `}</style>
    </div>
  )
}
