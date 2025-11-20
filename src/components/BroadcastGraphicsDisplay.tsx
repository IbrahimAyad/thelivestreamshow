import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { audioLayerManager } from '../utils/audio/audioLayerManager'
import { AlphaWednesdayOverlay } from './AlphaWednesdayOverlay'
import { MorningShowOverlay } from './MorningShowOverlay'

interface BroadcastGraphic {
  id: string
  graphic_type: string
  is_visible: boolean
  position: string
  config: any
  html_file?: string | null
  display_mode?: string | null
  z_index?: number | null
  sound_drop_id?: string | null
  auto_play_sound?: boolean | null
}

export function BroadcastGraphicsDisplay() {
  const [activeGraphics, setActiveGraphics] = useState<BroadcastGraphic[]>([])
  const previousGraphicsRef = useRef<Set<string>>(new Set())

  // Initialize audio layer manager
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      audioLayerManager.initialize(supabaseUrl, supabaseKey);
    }
  }, []);

  /**
   * Sort graphics by z-index and handle exclusive mode
   */
  const sortGraphicsByLayer = (graphics: BroadcastGraphic[]): BroadcastGraphic[] => {
    if (!graphics || graphics.length === 0) return [];
    
    // Check if any exclusive mode overlay is active
    const exclusiveOverlay = graphics.find(g => g.display_mode === 'exclusive');
    
    if (exclusiveOverlay) {
      // If exclusive overlay exists, return only that one
      return [exclusiveOverlay];
    }
    
    // Otherwise, sort by z-index ascending (lower z-index renders first/bottom)
    return graphics.sort((a, b) => {
      const zIndexA = a.z_index || 1000;
      const zIndexB = b.z_index || 1000;
      return zIndexA - zIndexB;
    });
  };

  /**
   * Check for newly visible graphics and play their sounds
   */
  const checkAndPlaySounds = (graphics: BroadcastGraphic[]) => {
    const currentGraphicIds = new Set(graphics.map(g => g.id));
    
    graphics.forEach(graphic => {
      // Check if this is a newly visible graphic
      const isNew = !previousGraphicsRef.current.has(graphic.id);
      
      if (isNew && graphic.auto_play_sound && graphic.sound_drop_id) {
        // Get audio config from graphic config
        const audioConfig = graphic.config?.audio || {};
        
        // Play sound
        audioLayerManager.playOverlaySound(
          graphic.sound_drop_id,
          {
            volume: audioConfig.volume ?? 0.8,
            enable_ducking: audioConfig.enable_ducking ?? false,
            ducking_level: audioConfig.ducking_level ?? 0.3,
          }
        );
        
        console.log(`🔊 [BroadcastGraphicsDisplay] Playing sound for ${graphic.graphic_type}`);
      }
    });
    
    // Update the previous graphics set
    previousGraphicsRef.current = currentGraphicIds;
  };

  useEffect(() => {
    console.log('🔵 [BroadcastGraphicsDisplay] Component mounted')

    // Load initial graphics
    const loadGraphics = async () => {
      console.log('🔵 [BroadcastGraphicsDisplay] Loading initial graphics...')
      const { data } = await supabase
        .from('broadcast_graphics')
        .select('*')
        .eq('is_visible', true)
        .order('z_index', { ascending: true }) // Sort by z_index for layering

      console.log('🔵 [BroadcastGraphicsDisplay] Loaded graphics:', data)

      if (data) {
        const sortedGraphics = sortGraphicsByLayer(data as BroadcastGraphic[])
        setActiveGraphics(sortedGraphics)
        console.log('✅ [BroadcastGraphicsDisplay] Set active graphics count:', sortedGraphics.length)
        
        // Check for newly visible graphics and play sounds
        checkAndPlaySounds(sortedGraphics)
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
        async (payload) => {
          console.log('🔵 [BroadcastGraphicsDisplay] Real-time change detected:', payload)
          // Reload all visible graphics on any change
          const { data } = await supabase
            .from('broadcast_graphics')
            .select('*')
            .eq('is_visible', true)
            .order('z_index', { ascending: true })

          console.log('🔵 [BroadcastGraphicsDisplay] Reloaded graphics after change:', data)

          if (data) {
            const sortedGraphics = sortGraphicsByLayer(data as BroadcastGraphic[])
            setActiveGraphics(sortedGraphics)
            console.log('✅ [BroadcastGraphicsDisplay] Updated active graphics count:', sortedGraphics.length)
            
            // Check for newly visible graphics and play sounds
            checkAndPlaySounds(sortedGraphics)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const hideGraphic = async (graphicId: string) => {
    await supabase
      .from('broadcast_graphics')
      .update({ is_visible: false })
      .eq('id', graphicId)
  }

  const renderGraphic = (graphic: BroadcastGraphic) => {
    const zIndex = graphic.z_index || 1000;
    const isExclusive = graphic.display_mode === 'exclusive';
    
    // If this graphic has an HTML file, display it as an iframe overlay
    if (graphic.html_file) {
      return (
        <div
          key={graphic.id}
          className="fullscreen-html-overlay"
          onClick={isExclusive ? () => hideGraphic(graphic.id) : undefined}
          style={{ 
            zIndex,
            cursor: isExclusive ? 'pointer' : 'default',
            pointerEvents: graphic.display_mode === 'overlay' ? 'none' : 'auto'
          }}
        >
          <iframe
            src={graphic.html_file}
            className="fullscreen-iframe"
            title={graphic.graphic_type}
          />
          <style>{`
            .fullscreen-html-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              animation: fadeIn 300ms ease-out;
            }

            .fullscreen-iframe {
              width: 100%;
              height: 100%;
              border: none;
              display: block;
            }

            .click-to-close-hint {
              position: fixed;
              bottom: 30px;
              right: 30px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              z-index: 10000;
              animation: fadeIn 300ms ease-out 1s both, pulse 2s ease-in-out infinite 2s;
              pointer-events: none;
            }

            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes pulse {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `}</style>
        </div>
      )
    }

    // Otherwise, render the default graphic types
    switch (graphic.graphic_type) {
      case 'alpha_wednesday':
        return <AlphaWednesdayOverlay key={graphic.id} />

      case 'morning_blitz':
      case 'morning_show':
        return <MorningShowOverlay key={graphic.id} />

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
