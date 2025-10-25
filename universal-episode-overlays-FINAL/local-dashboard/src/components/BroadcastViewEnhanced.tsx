import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useScene } from '../contexts/SceneContext'
import { useLowerThird } from '../contexts/LowerThirdContext'
import { PiNamecardOverlay } from './broadcast/PiNamecardOverlay'
import {
  FullScreenVideoLayout,
  PipLayout,
  SplitScreenLayout,
  PanelGridLayout,
  InterviewLayout,
  ReactionViewLayout,
  IntermissionLayout
} from './broadcast/SceneLayouts'
import {
  LiveIndicator,
  LowerThirdGraphic,
  TimerOverlay,
  SegmentBanner,
  LogoOverlay
} from './broadcast/GraphicsOverlay'

interface BroadcastScene {
  id: string
  scene_name: string
  layout_type: string
  is_active: boolean
  config: any
}

interface BroadcastCamera {
  id: string
  position: string
  camera_device_id: string | null
  is_active: boolean
  is_mirrored: boolean
  label: string | null
}

interface BroadcastGraphic {
  id: string
  graphic_type: string
  is_visible: boolean
  position: string
  config: any
}

interface LowerThird {
  id: string
  title_text: string
  subtitle_text: string
  is_visible: boolean
  template_type: string
  animation_style: string
  background_color: string
  text_color: string
  font_size: string
  duration: number
}

interface Timer {
  id: string
  name: string
  duration: number
  elapsed: number
  is_running: boolean
  type: 'countdown' | 'countup'
}

interface VideoQueue {
  id: string
  video_id: string
  title: string
  status: string
}

interface RundownSegment {
  id: string
  title: string
  description: string | null
  status: string
}

interface BroadcastMetadata {
  current_show_id: string | null
  current_episode_id: string | null
  current_topic: string | null
  current_hashtag: string | null
  display_social_media: boolean
}

interface Show {
  id: string
  name: string
  theme_color: string
  default_hashtag: string | null
}

interface Episode {
  id: string
  season_number: number
  episode_number: number
  title: string
}

export function BroadcastViewEnhanced() {
  // Use global scene context
  const { activeScene: contextScene, isTransitioning } = useScene()
  const { isVisible: lowerThirdVisible, currentGraphic: lowerThirdGraphic } = useLowerThird()
  
  // Scene state
  const [activeScene, setActiveScene] = useState<BroadcastScene | null>(null)
  const [cameras, setCameras] = useState<BroadcastCamera[]>([])
  
  // Graphics state
  const [graphics, setGraphics] = useState<BroadcastGraphic[]>([])
  const [lowerThird, setLowerThird] = useState<LowerThird | null>(null)
  
  // Content state
  const [currentVideo, setCurrentVideo] = useState<VideoQueue | null>(null)
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null)
  const [currentSegment, setCurrentSegment] = useState<RundownSegment | null>(null)
  
  // Show/Episode state
  const [broadcastMetadata, setBroadcastMetadata] = useState<BroadcastMetadata | null>(null)
  const [currentShow, setCurrentShow] = useState<Show | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)

  useEffect(() => {
    // Load initial data
    loadAllData()

    // Subscribe to broadcast_scenes
    const scenesChannel = supabase
      .channel('broadcast_scenes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_scenes'
      }, () => {
        loadActiveScene()
      })
      .subscribe()

    // Subscribe to broadcast_cameras
    const camerasChannel = supabase
      .channel('broadcast_cameras_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_cameras'
      }, () => {
        loadCameras()
      })
      .subscribe()

    // Subscribe to broadcast_graphics
    const graphicsChannel = supabase
      .channel('broadcast_graphics_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_graphics'
      }, () => {
        loadGraphics()
      })
      .subscribe()

    // Subscribe to lower_thirds
    const lowerThirdsChannel = supabase
      .channel('lower_thirds_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lower_thirds'
      }, () => {
        loadActiveLowerThird()
      })
      .subscribe()

    // Subscribe to video queue
    const videoChannel = supabase
      .channel('video_queue_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video_queue'
      }, () => {
        loadCurrentVideo()
      })
      .subscribe()

    // Subscribe to timers
    const timersChannel = supabase
      .channel('timers_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'timers'
      }, () => {
        loadActiveTimer()
      })
      .subscribe()

    // Subscribe to rundown
    const rundownChannel = supabase
      .channel('rundown_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rundown_segments'
      }, () => {
        loadCurrentSegment()
      })
      .subscribe()

    // Subscribe to broadcast metadata
    const metadataChannel = supabase
      .channel('broadcast_metadata_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_metadata'
      }, () => {
        loadBroadcastMetadata()
      })
      .subscribe()

    return () => {
      scenesChannel.unsubscribe()
      camerasChannel.unsubscribe()
      graphicsChannel.unsubscribe()
      lowerThirdsChannel.unsubscribe()
      videoChannel.unsubscribe()
      timersChannel.unsubscribe()
      rundownChannel.unsubscribe()
      metadataChannel.unsubscribe()
    }
  }, [])

  const loadAllData = async () => {
    await Promise.all([
      loadActiveScene(),
      loadCameras(),
      loadGraphics(),
      loadActiveLowerThird(),
      loadCurrentVideo(),
      loadActiveTimer(),
      loadCurrentSegment(),
      loadBroadcastMetadata()
    ])
  }

  const loadBroadcastMetadata = async () => {
    const { data } = await supabase
      .from('broadcast_metadata')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    if (data) {
      setBroadcastMetadata(data as BroadcastMetadata)
      
      // Load show if set
      if (data.current_show_id) {
        const { data: showData } = await supabase
          .from('shows')
          .select('*')
          .eq('id', data.current_show_id)
          .maybeSingle()
        
        if (showData) setCurrentShow(showData as Show)
      }
      
      // Load episode if set
      if (data.current_episode_id) {
        const { data: episodeData } = await supabase
          .from('episodes')
          .select('*')
          .eq('id', data.current_episode_id)
          .maybeSingle()
        
        if (episodeData) setCurrentEpisode(episodeData as Episode)
      }
    }
  }

  const loadActiveScene = async () => {
    const { data, error } = await supabase
      .from('broadcast_scenes')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()
    
    if (data && !error) setActiveScene(data as BroadcastScene)
  }

  const loadCameras = async () => {
    const { data } = await supabase
      .from('broadcast_cameras')
      .select('*')
      .order('position')
    
    if (data) setCameras(data as BroadcastCamera[])
  }

  const loadGraphics = async () => {
    const { data } = await supabase
      .from('broadcast_graphics')
      .select('*')
    
    if (data) setGraphics(data as BroadcastGraphic[])
  }

  const loadActiveLowerThird = async () => {
    const { data, error } = await supabase
      .from('lower_thirds')
      .select('*')
      .eq('is_visible', true)
      .maybeSingle()
    
    if (data && !error) {
      setLowerThird(data as LowerThird)
    } else {
      setLowerThird(null)
    }
  }

  const loadCurrentVideo = async () => {
    const { data } = await supabase
      .from('video_queue')
      .select('*')
      .eq('status', 'playing')
      .maybeSingle()
    
    setCurrentVideo(data as VideoQueue | null)
  }

  const loadActiveTimer = async () => {
    const { data } = await supabase
      .from('timers')
      .select('*')
      .eq('is_running', true)
      .maybeSingle()
    
    setActiveTimer(data as Timer | null)
  }

  const loadCurrentSegment = async () => {
    const { data } = await supabase
      .from('rundown_segments')
      .select('*')
      .eq('status', 'in-progress')
      .maybeSingle()
    
    setCurrentSegment(data as RundownSegment | null)
  }

  // Render image-based scene from context
  // Sources are already normalized by SceneTemplates component before being stored in context
  const renderImageScene = () => {
    if (!contextScene?.config?.sources) return null

    const sources = contextScene.config.sources
    // Sort by z_index (lower z_index renders first = back layer)
    const sortedSources = [...sources].sort((a, b) => (a.z_index || 0) - (b.z_index || 0))

    return (
      <div className="absolute inset-0">
        {sortedSources.map((source, index) => {
          const { position, type, url, z_index } = source
          
          // Skip if position is undefined or missing required properties
          if (!position || position.x === undefined || position.y === undefined) {
            console.warn('Source missing position data:', source)
            return null
          }
          
          const style = {
            position: 'absolute' as const,
            left: `${position.x}%`,
            top: `${position.y}%`,
            width: `${position.width || 100}%`,
            height: `${position.height || 100}%`,
            zIndex: z_index || index
          }

          if (type === 'image' && url) {
            return (
              <img
                key={`source-${index}`}
                src={url}
                alt={`Layer ${index}`}
                style={style}
                className="object-cover"
                onError={(e) => {
                  console.error(`Failed to load image: ${url}`)
                  e.currentTarget.style.display = 'none'
                }}
              />
            )
          }

          if (type === 'webcam') {
            // Render webcam placeholder or actual camera feed
            return (
              <div
                key={`source-${index}`}
                style={style}
                className="bg-gray-800 flex items-center justify-center text-gray-400 border-2 border-gray-600 rounded-lg"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">Webcam</div>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>
    )
  }

  // Render the appropriate scene layout
  const renderScene = () => {
    // Prioritize context scene with image sources
    if (contextScene && contextScene.config?.sources) {
      return renderImageScene()
    }

    // Fallback to database scene
    if (!activeScene) return <div className="w-full h-full bg-black" />

    const sceneProps = {
      videoId: currentVideo?.video_id,
      cameras,
      config: activeScene.config
    }

    switch (activeScene.layout_type) {
      case 'fullscreen_video':
        return <FullScreenVideoLayout {...sceneProps} />
      case 'pip':
        return <PipLayout {...sceneProps} />
      case 'split_screen':
        return <SplitScreenLayout {...sceneProps} />
      case 'panel_grid':
        return <PanelGridLayout {...sceneProps} />
      case 'interview':
        return <InterviewLayout {...sceneProps} />
      case 'reaction_view':
        return <ReactionViewLayout {...sceneProps} />
      case 'intermission':
        return <IntermissionLayout {...sceneProps} />
      default:
        return <FullScreenVideoLayout {...sceneProps} />
    }
  }

  // Get graphics by type
  const getGraphic = (type: string) => graphics.find(g => g.graphic_type === type && g.is_visible)

  const liveIndicator = getGraphic('live_indicator')
  const logo = getGraphic('logo')
  const timerOverlay = getGraphic('timer_overlay')
  const segmentBanner = getGraphic('segment_banner')

  return (
    <div className="w-full h-screen bg-black overflow-hidden" style={{ width: '1920px', height: '1080px' }}>
      {/* Scene Layer */}
      <div className="w-full h-full relative">
        {/* Transition overlay */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-black z-50 transition-opacity duration-300 opacity-100" />
        )}
        {renderScene()}
      </div>

      {/* Graphics Overlay Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Universal Episode Info Overlay */}
        <PiNamecardOverlay position="bottom" />

        {/* LIVE Indicator */}
        {liveIndicator && (
          <LiveIndicator
            position={liveIndicator.position}
            config={liveIndicator.config}
          />
        )}

        {/* Logo */}
        {logo && (
          <LogoOverlay
            position={logo.position}
            config={logo.config}
          />
        )}

        {/* Timer Overlay */}
        {timerOverlay && activeTimer && (
          <TimerOverlay
            timer={activeTimer}
            position={timerOverlay.position}
          />
        )}

        {/* Segment Banner */}
        {segmentBanner && currentSegment && (
          <SegmentBanner
            segment={currentSegment}
            config={segmentBanner.config}
          />
        )}

        {/* Lower Third from context */}
        {lowerThirdVisible && lowerThirdGraphic && (
          <div 
            className="absolute bottom-0 left-0 right-0 animate-slide-up"
            style={{ zIndex: 999 }}
          >
            <img 
              src={lowerThirdGraphic.file_url} 
              alt="Lower Third"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Legacy Lower Third */}
        {lowerThird && lowerThird.is_visible && (
          <LowerThirdGraphic
            data={lowerThird}
            onComplete={() => setLowerThird(null)}
          />
        )}
      </div>
    </div>
  )
}
