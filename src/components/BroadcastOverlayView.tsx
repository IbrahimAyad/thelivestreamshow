import { useState, useEffect, useRef } from 'react'
import { supabase, ShowQuestion, ShowSegment } from '../lib/supabase'
import { BetaBotPopup } from './BetaBotPopup'
import { BetaBotAvatar } from './BetaBotAvatar'
import { VisualContentDisplay } from './VisualContentDisplay'
import LowerThirdOverlay from './LowerThirdOverlay'
import EpisodeInfoDisplay from './EpisodeInfoDisplay'
import { BroadcastGraphicsDisplay } from './BroadcastGraphicsDisplay'

export function BroadcastOverlayView() {
  const [activeSegment, setActiveSegment] = useState<ShowSegment | null>(null)
  const [allSegments, setAllSegments] = useState<ShowSegment[]>([])
  const [isLive, setIsLive] = useState(false)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [showStartTime, setShowStartTime] = useState<Date | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [timelineTimeout, setTimelineTimeout] = useState<NodeJS.Timeout | null>(null)
  const [nextSegment, setNextSegment] = useState<ShowSegment | null>(null)
  const [showNextUp, setShowNextUp] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const prevSegmentIdRef = useRef<string | null>(null)
  
  // BetaBot Popup state
  const [popupVisible, setPopupVisible] = useState(false)
  const [popupQuestion, setPopupQuestion] = useState<ShowQuestion | null>(null)
  const [popupDuration, setPopupDuration] = useState(15)
  
  // Beta Bot Avatar state
  const [betaBotState, setBetaBotState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  
  // Visual Content state
  const [visualContent, setVisualContent] = useState<{images?: string[]; searchQuery?: string} | null>(null)

  // Apply broadcast mode styles
  useEffect(() => {
    document.body.classList.add('broadcast-mode')
    document.documentElement.classList.add('broadcast-mode')
    return () => {
      document.body.classList.remove('broadcast-mode')
      document.documentElement.classList.remove('broadcast-mode')
    }
  }, [])

  // Load initial data and subscribe to changes
  useEffect(() => {
    loadAllData()

    const segmentsChannel = supabase.channel('segments_broadcast_premium').on('postgres_changes', {
      event: '*', schema: 'public', table: 'show_segments'
    }, handleSegmentChange).subscribe()

    const metadataChannel = supabase.channel('metadata_broadcast_premium').on('postgres_changes', {
      event: '*', schema: 'public', table: 'show_metadata'
    }, loadShowMetadata).subscribe()

    return () => {
      segmentsChannel.unsubscribe()
      metadataChannel.unsubscribe()
    }
  }, [])

  // Subscribe to popup triggers
  useEffect(() => {
    const overlayChannel = supabase
      .channel('overlay_trigger_premium')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'show_questions',
        filter: 'show_on_overlay=eq.true'
      }, (payload) => {
        const question = payload.new as ShowQuestion
        setPopupQuestion(question)
        setPopupVisible(true)
        // Auto-clear the trigger after showing
        setTimeout(() => {
          supabase
            .from('show_questions')
            .update({ show_on_overlay: false })
            .eq('id', question.id)
        }, 500)
      })
      .subscribe()

    return () => {
      overlayChannel.unsubscribe()
    }
  }, [])

  // Subscribe to Beta Bot visual content
  useEffect(() => {
    const visualChannel = supabase
      .channel('betabot_visual_content_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'betabot_visual_content'
      }, (payload) => {
        const content = payload.new as any
        setVisualContent({
          images: content.content_urls || [],
          searchQuery: content.search_query
        })
      })
      .subscribe()

    return () => {
      visualChannel.unsubscribe()
    }
  }, [])

  // Subscribe to Beta Bot sessions to track state
  useEffect(() => {
    const sessionsChannel = supabase
      .channel('betabot_sessions_channel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'betabot_sessions'
      }, (payload) => {
        const session = payload.new as any
        console.log('🤖 Beta Bot session update:', session)

        // Update avatar state based on current_state field
        if (session.is_active && session.current_state) {
          // Map session state directly to avatar state
          const validStates = ['idle', 'listening', 'thinking', 'speaking']
          if (validStates.includes(session.current_state)) {
            console.log(`🎨 Setting avatar state to: ${session.current_state}`)
            setBetaBotState(session.current_state)
          } else {
            // Fallback to listening if current_state is invalid
            console.warn(`⚠️ Invalid state: ${session.current_state}, defaulting to listening`)
            setBetaBotState('listening')
          }
        } else if (session.is_active) {
          // Session active but no current_state, default to listening
          setBetaBotState('listening')
        } else {
          // Session not active, set to idle
          setBetaBotState('idle')
        }
      })
      .subscribe()

    return () => {
      sessionsChannel.unsubscribe()
    }
  }, [])

  // Track audio playback state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsAudioPlaying(true)
    const handlePause = () => setIsAudioPlaying(false)
    const handleEnded = () => setIsAudioPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Update total show timer
  useEffect(() => {
    if (!showStartTime || !isLive) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - showStartTime.getTime()) / 1000)
      setTotalElapsed(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [showStartTime, isLive])

  // Calculate next segment and show/hide Next Up preview
  useEffect(() => {
    if (!activeSegment || allSegments.length === 0) {
      setNextSegment(null)
      setShowNextUp(false)
      return
    }

    const currentIndex = allSegments.findIndex(s => s.id === activeSegment.id)
    if (currentIndex >= 0 && currentIndex < allSegments.length - 1) {
      setNextSegment(allSegments[currentIndex + 1])
    } else {
      setNextSegment(null)
    }
  }, [activeSegment, allSegments])

  // Show Next Up preview 20 seconds before segment ends
  useEffect(() => {
    if (!activeSegment || !nextSegment) {
      setShowNextUp(false)
      return
    }

    const segmentDuration = activeSegment.timer_seconds || 300
    const checkInterval = setInterval(() => {
      const elapsed = totalElapsed % segmentDuration
      const remaining = segmentDuration - elapsed
      
      if (remaining <= 20 && remaining > 0) {
        setShowNextUp(true)
      } else {
        setShowNextUp(false)
      }
    }, 1000)

    return () => clearInterval(checkInterval)
  }, [activeSegment, nextSegment, totalElapsed])

  const loadAllData = async () => {
    await Promise.all([
      loadAllSegments(),
      loadShowMetadata()
    ])
  }

  const loadAllSegments = async () => {
    const { data } = await supabase
      .from('show_segments')
      .select('*')
      .order('segment_order', { ascending: true })
    
    if (data) {
      setAllSegments(data as ShowSegment[])
      const active = data.find(s => s.is_active)
      if (active) setActiveSegment(active as ShowSegment)
    }
  }

  const loadShowMetadata = async () => {
    const { data } = await supabase
      .from('show_metadata')
      .select('*')
      .limit(1)
      .single()

    if (data) {
      setIsLive(data.is_live)
      if (data.show_start_time) {
        setShowStartTime(new Date(data.show_start_time))
      }
    }
  }

  const handleSegmentChange = async () => {
    await loadAllSegments()
    
    // Get newly active segment
    const { data } = await supabase
      .from('show_segments')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    
    const newActiveSegment = data as ShowSegment | null
    
    // Only show timeline if segment actually changed
    if (newActiveSegment && newActiveSegment.id !== prevSegmentIdRef.current) {
      prevSegmentIdRef.current = newActiveSegment.id
      
      // Clear any existing timeout
      if (timelineTimeout) {
        clearTimeout(timelineTimeout)
      }
      
      // Show timeline
      setShowTimeline(true)
      
      // Hide after 3 seconds
      const timeout = setTimeout(() => {
        setShowTimeline(false)
      }, 3000)
      
      setTimelineTimeout(timeout)
    }
    
    setActiveSegment(newActiveSegment)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // BetaBot Popup handlers
  const handlePopupPlay = async (question: ShowQuestion) => {
    if (question.tts_audio_url && audioRef.current) {
      audioRef.current.src = question.tts_audio_url
      audioRef.current.play().catch(console.error)
    }
  }

  const handlePopupNext = async () => {
    setPopupVisible(false)
    setPopupQuestion(null)
    
    // Find next unplayed question
    const { data } = await supabase
      .from('show_questions')
      .select('*')
      .eq('is_played', false)
      .order('created_at')
      .limit(1)
      .maybeSingle()
    
    if (data) {
      setPopupQuestion(data as ShowQuestion)
      setPopupVisible(true)
    }
  }

  const handlePopupDismiss = () => {
    setPopupVisible(false)
    setPopupQuestion(null)
  }

  return (
    <div 
      className="premium-broadcast-container"
      style={{ 
        width: '1920px', 
        height: '1080px',
        position: 'fixed',
        top: 0,
        left: 0,
        background: '#000000',
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* ULTRA-MINIMAL STATUS BAR - 24px height */}
      <div className="status-bar">
        <div className="status-bar-content">
          {/* Live Indicator */}
          {isLive && (
            <div className="live-indicator">
              <div className="live-dot" />
              <span>LIVE</span>
            </div>
          )}
          
          {/* Total Show Timer */}
          {isLive && showStartTime && (
            <div className="show-timer">
              {formatTime(totalElapsed)}
            </div>
          )}
        </div>
      </div>

      {/* OPEN CANVAS SPACE - 85% of screen for BetaBot content */}
      <div className="open-canvas">
        {/* This space is intentionally left open for OBS integrations, BetaBot videos, etc. */}
      </div>

      {/* QUESTION DISPLAY - Shows segment topic and question */}
      {activeSegment && (activeSegment.segment_topic || activeSegment.segment_question) && !isAudioPlaying && (
        <div className="question-display">
          <div className="question-content">
            {activeSegment.segment_topic && (
              <p className="segment-topic">{activeSegment.segment_topic}</p>
            )}
            {activeSegment.segment_question && (
              <p className="question-text">{activeSegment.segment_question}</p>
            )}
          </div>
        </div>
      )}

      {/* TIMELINE - Auto-shows on segment change, hides after 3s */}
      {showTimeline && allSegments.length > 0 && (
        <div className="timeline-container">
          <div className="timeline-content">
            {allSegments.map((segment, index) => (
              <div 
                key={segment.id}
                className={`timeline-segment ${
                  segment.id === activeSegment?.id ? 'active' : ''
                } ${index < allSegments.findIndex(s => s.id === activeSegment?.id) ? 'completed' : ''}`}
              >
                <div className="segment-marker" />
                <span className="segment-name">{segment.segment_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEXT UP PREVIEW - Shows only 20s before next segment */}
      {showNextUp && nextSegment && (
        <div className="next-up-preview">
          <div className="next-up-label">NEXT UP</div>
          <div className="next-up-title">{nextSegment.segment_name}</div>
        </div>
      )}

      {/* BETA BOT AVATAR - Top-right corner */}
      <div style={{
        position: 'fixed',
        top: '30px',
        right: '30px',
        zIndex: 95
      }}>
        <BetaBotAvatar state={betaBotState} size={120} />
      </div>

      {/* VISUAL CONTENT DISPLAY - Side panel */}
      {visualContent && (
        <VisualContentDisplay
          images={visualContent.images}
          searchQuery={visualContent.searchQuery}
          onHide={() => setVisualContent(null)}
        />
      )}

      {/* BETABOT POPUP - Chat-style question popup */}
      <BetaBotPopup
        question={popupQuestion}
        visible={popupVisible}
        duration={popupDuration}
        onPlay={handlePopupPlay}
        onNext={handlePopupNext}
        onDismiss={handlePopupDismiss}
      />

      {/* LOWER THIRD OVERLAY - Bottom center */}
      <LowerThirdOverlay />

      {/* EPISODE INFO DISPLAY - Top right */}
      <EpisodeInfoDisplay />

      {/* BROADCAST GRAPHICS DISPLAY - Various overlays */}
      <BroadcastGraphicsDisplay />

      <style>{`
        /* Premium Color Palette */
        :root {
          --accent-red: #EF4444;
          --accent-yellow: #FBBF24;
          --accent-gold: #F59E0B;
          --bg-black: #000000;
          --bg-gray-900: #0F0F0F;
          --bg-gray-800: #1A1A1A;
          --bg-gray-700: #2A2A2A;
          --text-white: #FFFFFF;
          --text-gray-300: #D1D5DB;
          --text-gray-500: #6B7280;
          --border-gray: #2A2A2A;
          --border-accent: #FBBF24;
        }

        .premium-broadcast-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          overflow: hidden;
        }

        /* STATUS BAR - Ultra minimal, 24px */
        .status-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 24px;
          background: rgba(0, 0, 0, 0.9);
          border-bottom: 1px solid var(--border-gray);
          z-index: 100;
        }

        .status-bar-content {
          height: 100%;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-red);
          animation: pulse-live 1.5s ease-in-out infinite;
        }

        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        .live-indicator span {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--accent-red);
          text-transform: uppercase;
        }

        .show-timer {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-gray-300);
          letter-spacing: 0.5px;
          font-variant-numeric: tabular-nums;
        }

        /* OPEN CANVAS - Maximum space for content */
        .open-canvas {
          position: fixed;
          top: 24px;
          left: 0;
          right: 0;
          bottom: 0;
          /* Intentionally empty - this is the 85% open space */
        }

        /* QUESTION DISPLAY - Premium typography, generous spacing */
        .question-display {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.85));
          backdrop-filter: blur(10px);
          border-top: 2px solid var(--accent-yellow);
          z-index: 90;
          animation: slideUp 300ms ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .question-content {
          padding: 48px 80px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .segment-topic {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--accent-yellow);
          margin: 0 0 16px 0;
        }

        .question-text {
          font-size: 36px;
          font-weight: 600;
          line-height: 1.8;
          color: var(--text-white);
          margin: 0;
        }

        /* TIMELINE - Auto-show/hide */
        .timeline-container {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 95;
          animation: slideUpFade 300ms ease-out;
        }

        @keyframes slideUpFade {
          from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        .timeline-content {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.8);
          padding: 12px 24px;
          border-radius: 24px;
          border: 1px solid var(--border-accent);
          backdrop-filter: blur(10px);
        }

        .timeline-segment {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .timeline-segment:not(:last-child)::after {
          content: '';
          position: absolute;
          right: -12px;
          width: 12px;
          height: 2px;
          background: var(--border-gray);
        }

        .timeline-segment.active::after {
          background: var(--accent-yellow);
        }

        .timeline-segment.completed::after {
          background: var(--accent-yellow);
        }

        .segment-marker {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--bg-gray-700);
          border: 2px solid var(--border-gray);
        }

        .timeline-segment.active .segment-marker {
          background: var(--accent-yellow);
          border-color: var(--accent-yellow);
          box-shadow: 0 0 10px var(--accent-yellow);
        }

        .timeline-segment.completed .segment-marker {
          background: var(--accent-gold);
          border-color: var(--accent-gold);
        }

        .segment-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .timeline-segment.active .segment-name {
          color: var(--accent-yellow);
        }

        .timeline-segment.completed .segment-name {
          color: var(--text-gray-300);
        }

        /* NEXT UP PREVIEW - Shows 20s before segment transition */
        .next-up-preview {
          position: fixed;
          top: 44px;
          right: 20px;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid var(--accent-gold);
          border-radius: 8px;
          padding: 12px 20px;
          z-index: 85;
          animation: fadeIn 300ms ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .next-up-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--accent-gold);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .next-up-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-white);
        }
      `}</style>
    </div>
  )
}
