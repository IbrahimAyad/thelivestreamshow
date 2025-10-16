import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface BroadcastGraphic {
  id: string
  graphic_type: string
  is_visible: boolean
  position: string
  config: any
}

export function BroadcastGraphicsDisplay() {
  const [activeGraphics, setActiveGraphics] = useState<BroadcastGraphic[]>([])

  useEffect(() => {
    // Load initial graphics
    const loadGraphics = async () => {
      const { data } = await supabase
        .from('broadcast_graphics')
        .select('*')
        .eq('is_visible', true)
      
      if (data) {
        setActiveGraphics(data as BroadcastGraphic[])
      }
    }

    loadGraphics()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('broadcast_graphics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_graphics',
        },
        async () => {
          // Reload all visible graphics on any change
          const { data } = await supabase
            .from('broadcast_graphics')
            .select('*')
            .eq('is_visible', true)
          
          if (data) {
            setActiveGraphics(data as BroadcastGraphic[])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const renderGraphic = (graphic: BroadcastGraphic) => {
    switch (graphic.graphic_type) {
      case 'live_indicator':
        return (
          <div key={graphic.id} className="live-indicator-graphic">
            <div className="live-dot"></div>
            <span>LIVE</span>
            <style>{`
              .live-indicator-graphic {
                position: fixed;
                top: 30px;
                left: 30px;
                background: rgba(239, 68, 68, 0.95);
                border: 2px solid #EF4444;
                border-radius: 6px;
                padding: 8px 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 150;
                animation: fadeIn 300ms ease-out;
              }

              .live-indicator-graphic .live-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #FFFFFF;
                animation: livePulse 1.5s ease-in-out infinite;
              }

              .live-indicator-graphic span {
                font-size: 24px;
                font-weight: 700;
                color: #FFFFFF;
                letter-spacing: 1px;
              }

              @keyframes livePulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
              }

              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
          </div>
        )

      case 'brb':
        return (
          <div key={graphic.id} className="brb-graphic">
            <div className="brb-content">
              <div className="brb-title">BRB</div>
              <div className="brb-subtitle">We'll be right back!</div>
            </div>
            <style>{`
              .brb-graphic {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(251, 191, 36, 0.95);
                border: 3px solid #FBBF24;
                border-radius: 12px;
                padding: 60px 100px;
                z-index: 200;
                animation: fadeIn 300ms ease-out;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
              }

              .brb-content {
                text-align: center;
              }

              .brb-title {
                font-size: 72px;
                font-weight: 700;
                color: #000000;
                letter-spacing: 4px;
                margin-bottom: 12px;
              }

              .brb-subtitle {
                font-size: 28px;
                font-weight: 500;
                color: #1F2937;
              }
            `}</style>
          </div>
        )

      case 'starting_soon':
        return (
          <div key={graphic.id} className="starting-soon-graphic">
            <div className="starting-soon-content">
              <div className="starting-soon-title">STARTING SOON</div>
            </div>
            <style>{`
              .starting-soon-graphic {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(59, 130, 246, 0.95);
                border: 3px solid #3B82F6;
                border-radius: 12px;
                padding: 60px 100px;
                z-index: 200;
                animation: fadeIn 300ms ease-out;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
              }

              .starting-soon-content {
                text-align: center;
              }

              .starting-soon-title {
                font-size: 64px;
                font-weight: 700;
                color: #FFFFFF;
                letter-spacing: 6px;
              }
            `}</style>
          </div>
        )

      case 'tech_difficulties':
        return (
          <div key={graphic.id} className="tech-difficulties-graphic">
            <div className="tech-difficulties-content">
              <div className="tech-difficulties-title">⚠️ TECHNICAL DIFFICULTIES</div>
              <div className="tech-difficulties-subtitle">Please stand by</div>
            </div>
            <style>{`
              .tech-difficulties-graphic {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(249, 115, 22, 0.95);
                border: 3px solid #F97316;
                border-radius: 12px;
                padding: 60px 100px;
                z-index: 200;
                animation: fadeIn 300ms ease-out;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
              }

              .tech-difficulties-content {
                text-align: center;
              }

              .tech-difficulties-title {
                font-size: 56px;
                font-weight: 700;
                color: #FFFFFF;
                letter-spacing: 2px;
                margin-bottom: 12px;
              }

              .tech-difficulties-subtitle {
                font-size: 28px;
                font-weight: 500;
                color: #FEF3C7;
              }
            `}</style>
          </div>
        )

      case 'logo':
        return (
          <div key={graphic.id} className="logo-graphic">
            {graphic.config?.logo_url ? (
              <img src={graphic.config.logo_url} alt="Logo" className="logo-image" />
            ) : (
              <div className="logo-placeholder">LOGO</div>
            )}
            <style>{`
              .logo-graphic {
                position: fixed;
                top: 30px;
                right: 180px;
                width: 80px;
                height: 80px;
                z-index: 150;
                animation: fadeIn 300ms ease-out;
              }

              .logo-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                padding: 4px;
              }

              .logo-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(15, 15, 15, 0.9);
                border: 2px solid #6B7280;
                border-radius: 8px;
                color: #9CA3AF;
                font-size: 14px;
                font-weight: 600;
              }
            `}</style>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {activeGraphics.map(graphic => renderGraphic(graphic))}
    </>
  )
}
