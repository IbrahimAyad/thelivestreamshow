import { useState, useEffect, useRef } from 'react'
import { supabase, ShowQuestion, ShowSegment } from '../lib/supabase'
import { BetaBotPopup } from './BetaBotPopup'
import { BetaBotAvatar } from './BetaBotAvatar'
import { VisualContentDisplay } from './VisualContentDisplay'
import { MediaBrowserOverlay } from './MediaBrowserOverlay'
import LowerThirdOverlay from './LowerThirdOverlay'
import { PiNamecardOverlay } from './broadcast/PiNamecardOverlay'
import { BroadcastGraphicsDisplay } from './BroadcastGraphicsDisplay'
import { ShowIntroOverlay } from './ShowIntroOverlay'
import { useTTS } from '../hooks/useTTS'
import { useF5TTS } from '../hooks/useF5TTS'

export function BroadcastOverlayView() {
  const tts = useTTS()
  const f5TTS = useF5TTS()
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
  const [betaBotMood, setBetaBotMood] = useState<'neutral' | 'bored' | 'amused' | 'spicy'>('neutral')
  const [betaBotMovement, setBetaBotMovement] = useState<'home' | 'run_left' | 'run_right' | 'bounce' | 'hide'>('home')
  const [showIncoming, setShowIncoming] = useState(false)
  const [incomingCount, setIncomingCount] = useState(0)
  
  // Visual Content state (legacy - keeping for backward compatibility)
  const [visualContent, setVisualContent] = useState<{images?: string[]; searchQuery?: string} | null>(null)

  // Media Browser Overlay state (new approach)
  const [mediaBrowser, setMediaBrowser] = useState<{
    query: string;
    type: 'images' | 'videos';
    metadata?: {
      recency?: 'day' | 'week' | 'month' | 'year';
      domains?: string[];
      model?: 'sonar' | 'sonar-pro';
    };
  } | null>(null)

  // Apply broadcast mode styles and load voices
  useEffect(() => {
    document.body.classList.add('broadcast-mode')
    document.documentElement.classList.add('broadcast-mode')

    // Load available voices for display
    if (f5TTS.isConnected) {
      f5TTS.loadVoices()
    }

    return () => {
      document.body.classList.remove('broadcast-mode')
      document.documentElement.classList.remove('broadcast-mode')
    }
  }, [f5TTS.isConnected])

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

  // Subscribe to Beta Bot visual content (legacy)
  useEffect(() => {
    const visualChannel = supabase
      .channel('betabot_visual_content_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'betabot_visual_content'
      }, (payload) => {
        const content = payload.new as any
        console.log('📺 Legacy visual content received:', content)
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

  // Subscribe to Media Browser triggers (new approach)
  useEffect(() => {
    const mediaBrowserChannel = supabase
      .channel('betabot_media_browser_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'betabot_media_browser'
      }, (payload) => {
        const browserRequest = payload.new as any
        console.log('🌐 Media browser request received:', browserRequest)
        console.log('📋 Query:', browserRequest.search_query)
        console.log('🎯 Content Type:', browserRequest.content_type)
        console.log('👁️ Is Visible:', browserRequest.is_visible)

        if (browserRequest.is_visible) {
          const overlayType = browserRequest.content_type
          const metadata = browserRequest.metadata

          console.log('✅ Setting MediaBrowser overlay with type:', overlayType)
          console.log('ℹ️ If type is "images" → Perplexity AI search')
          console.log('ℹ️ If type is "videos" → YouTube/Reddit search')

          if (metadata) {
            console.log('🎤 Voice-activated filters received:', metadata)
          }

          setMediaBrowser({
            query: browserRequest.search_query,
            type: overlayType,
            metadata: metadata || undefined
          })
        }
      })
      .subscribe()

    return () => {
      mediaBrowserChannel.unsubscribe()
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

  // Subscribe to Beta Bot mood changes
  useEffect(() => {
    // Load initial mood state
    const loadMood = async () => {
      console.log('🔄 [BROADCAST] Loading initial mood state...')
      const { data, error } = await supabase
        .from('betabot_mood')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('❌ [BROADCAST] Failed to load mood:', error)
        return
      }

      if (data) {
        console.log('✅ [BROADCAST] Initial mood loaded:', data)
        setBetaBotMood(data.mood || 'neutral')
        setBetaBotMovement(data.movement || 'home')
        setShowIncoming(data.show_incoming || false)
        setIncomingCount(data.incoming_count || 0)
      } else {
        console.warn('⚠️ [BROADCAST] No mood data found')
      }
    }

    loadMood()

    console.log('📡 [BROADCAST] Setting up mood realtime subscription...')
    const moodChannel = supabase
      .channel('betabot_mood_broadcast_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'betabot_mood'
      }, (payload) => {
        const moodData = payload.new as any
        console.log('🎭 [BROADCAST] Beta Bot mood update received:', moodData)
        setBetaBotMood(moodData.mood || 'neutral')
        setBetaBotMovement(moodData.movement || 'home')
        setShowIncoming(moodData.show_incoming || false)
        setIncomingCount(moodData.incoming_count || 0)
      })
      .subscribe((status) => {
        console.log('📡 [BROADCAST] Mood channel status:', status)
      })

    return () => {
      console.log('🔌 [BROADCAST] Unsubscribing from mood channel')
      moodChannel.unsubscribe()
    }
  }, [])

  // Subscribe to StreamStudio audio state for graphics triggers
  useEffect(() => {
    console.log('🎵 [BROADCAST] Setting up audio state subscription for graphics triggers...')

    const audioStateChannel = supabase
      .channel('audio_playback_state_broadcast')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'audio_playback_state'
      }, async (payload) => {
        const audioState = payload.new as any
        console.log('🎧 [BROADCAST] Audio state update:', audioState)

        // When audio starts playing, check if it's an intro/outro sound
        if (audioState.is_playing && audioState.current_track_id) {
          console.log(`🎵 [BROADCAST] Audio now playing - Track ID: ${audioState.current_track_id}`)

          // Fetch track details to determine if it's a sound effect or intro/outro
          const { data: trackData } = await supabase
            .from('music_library')
            .select('title, artist, track_type, tags')
            .eq('id', audioState.current_track_id)
            .maybeSingle()

          if (trackData) {
            console.log('🎼 [BROADCAST] Track info:', trackData)

            // Trigger graphics for intro/outro sounds
            const trackTitle = trackData.title?.toLowerCase() || ''
            const trackType = trackData.track_type?.toLowerCase() || ''
            const trackTags = trackData.tags || []

            if (
              trackType === 'intro' ||
              trackType === 'outro' ||
              trackTitle.includes('intro') ||
              trackTitle.includes('outro') ||
              trackTags.includes('intro') ||
              trackTags.includes('outro')
            ) {
              console.log(`🎬 [BROADCAST] ${trackType.toUpperCase()} sound detected! Triggering graphics...`)
              // Graphics trigger logic will be added here
              // For now, just log that we detected the trigger
            }
          }
        }

        // Handle emergency modes (PANIC, BRB)
        if (audioState.emergency_mode) {
          console.log(`🚨 [BROADCAST] Emergency mode: ${audioState.emergency_mode}`)
          // Emergency mode graphics can be triggered here
        }
      })
      .subscribe((status) => {
        console.log('📡 [BROADCAST] Audio state channel status:', status)
      })

    return () => {
      console.log('🔌 [BROADCAST] Unsubscribing from audio state channel')
      audioStateChannel.unsubscribe()
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

  // Show timeline when stream goes live
  useEffect(() => {
    if (isLive && allSegments.length > 0) {
      // Clear any existing timeout
      if (timelineTimeout) {
        clearTimeout(timelineTimeout)
      }

      // Show timeline
      setShowTimeline(true)

      // Hide after 7 seconds
      const timeout = setTimeout(() => {
        setShowTimeline(false)
      }, 7000)

      setTimelineTimeout(timeout)
    }
  }, [isLive, allSegments.length])

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

      // Hide after 7 seconds
      const timeout = setTimeout(() => {
        setShowTimeline(false)
      }, 7000)
      
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
    try {
      // Check TTS provider setting from localStorage
      const ttsProvider = localStorage.getItem('betabot_tts_provider') as 'browser' | 'f5tts' || 'browser'

      // Try Piper TTS first if enabled and connected
      if (ttsProvider === 'f5tts' && f5TTS.isConnected) {
        console.log('🎤 Using Piper TTS to play BetaBot question')
        await f5TTS.speak(question.question_text)
        console.log('✅ Piper TTS playback started')
        return
      }

      // Fallback to pre-recorded audio if available
      if (question.tts_audio_url && audioRef.current) {
        console.log('🔊 Using pre-recorded TTS audio')
        audioRef.current.src = question.tts_audio_url
        audioRef.current.play().catch(console.error)
        return
      }

      // Last fallback: use browser TTS
      console.log('🗣️ Using browser TTS as fallback')
      tts.speak(question.question_text)

    } catch (error) {
      console.error('❌ Error playing BetaBot question:', error)
      // Try browser TTS as final fallback
      tts.speak(question.question_text)
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
        background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)',
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* ULTRA-MINIMAL STATUS BAR - 24px height */}
      <div className="status-bar">
        <div className="status-bar-content">
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
                <span className="segment-name">{segment.segment_name}</span>
                <div className="segment-marker" />
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
        top: '40px',
        right: '40px',
        zIndex: 95
      }}>
        <BetaBotAvatar
          state={betaBotState}
          size={160}
          streamStatus={isLive ? 'live' : 'off_air'}
          mood={betaBotMood}
          movement={betaBotMovement}
          showIncoming={showIncoming}
          incomingCount={incomingCount}
        />

        {/* LIVE INDICATOR & TIMER - Under BetaBot */}
        {isLive && showStartTime && (
          <div style={{
            marginTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* Live Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #EF4444',
              borderRadius: '20px',
              padding: '6px 16px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#EF4444',
                animation: 'pulse-live 1.5s ease-in-out infinite'
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: '#EF4444',
                textTransform: 'uppercase'
              }}>LIVE</span>
            </div>

            {/* Stream Timer */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(252, 211, 77, 0.3)',
              borderRadius: '12px',
              padding: '8px 20px',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#FCD34D',
                letterSpacing: '1px',
                marginBottom: '2px',
                textTransform: 'uppercase'
              }}>Stream Time</div>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#FFFFFF',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '1px'
              }}>{formatTime(totalElapsed)}</div>
            </div>
          </div>
        )}
      </div>

      {/* VISUAL CONTENT DISPLAY - Side panel (legacy) */}
      {visualContent && (
        <VisualContentDisplay
          images={visualContent.images}
          searchQuery={visualContent.searchQuery}
          onHide={() => setVisualContent(null)}
        />
      )}

      {/* MEDIA BROWSER OVERLAY - Full-screen iframe overlay (new approach) */}
      {mediaBrowser && (
        <MediaBrowserOverlay
          query={mediaBrowser.query}
          type={mediaBrowser.type}
          onClose={() => setMediaBrowser(null)}
          durationSeconds={60}
          metadata={mediaBrowser.metadata}
          onReadAloud={async (text) => {
            console.log('🔊 Reading answer aloud...')
            console.log('🔌 F5TTS Connection Status:', f5TTS.isConnected)
            console.log('🎙️ Selected Voice:', f5TTS.selectedVoice)

            try {
              // Use Piper TTS if connected, fallback to browser TTS
              if (f5TTS.isConnected) {
                console.log('🎤 Using Piper TTS for Read Aloud')
                await f5TTS.speak(text)
              } else {
                console.log('🗣️ Using browser TTS for Read Aloud (Piper not connected)')
                console.log('⚠️ Reason: f5TTS.isConnected =', f5TTS.isConnected)
                tts.speak(text)
              }
            } catch (error) {
              console.error('❌ Failed to read aloud:', error)
              console.log('🔄 Falling back to browser TTS')
              tts.speak(text) // Fallback to browser TTS
            }
          }}
          onSummarize={async (text) => {
            console.log('📝 Creating summary...')
            console.log('🔌 F5TTS Connection Status:', f5TTS.isConnected)
            console.log('🎙️ Selected Voice:', f5TTS.selectedVoice)

            try {
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                  model: 'gpt-4',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a helpful assistant that creates concise summaries. Summarize in 2-3 sentences.'
                    },
                    {
                      role: 'user',
                      content: `Summarize this in 2-3 sentences:\n\n${text}`
                    }
                  ],
                  temperature: 0.3,
                  max_tokens: 150
                })
              })
              const data = await response.json()
              const summary = data.choices[0].message.content
              console.log('✅ Summary created:', summary)

              // Use Piper TTS if connected, fallback to browser TTS
              if (f5TTS.isConnected) {
                console.log('🎤 Using Piper TTS for summary')
                await f5TTS.speak(summary)
              } else {
                console.log('🗣️ Using browser TTS for summary (Piper not connected)')
                console.log('⚠️ Reason: f5TTS.isConnected =', f5TTS.isConnected)
                tts.speak(summary)
              }
            } catch (error) {
              console.error('❌ Failed to create summary:', error)
              console.log('🔄 Falling back to browser TTS')
              tts.speak('Sorry, I could not create a summary.')
            }
          }}
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

      {/* PI NAMECARD OVERLAY - Universal Episode Info Display */}
      <PiNamecardOverlay />

      {/* BROADCAST GRAPHICS DISPLAY - Various overlays */}
      <BroadcastGraphicsDisplay />

      {/* SHOW INTRO OVERLAY - Automated intro sequence (DJ visualizer + game) */}
      <ShowIntroOverlay />

      <style>{`
        /* Premium Color Palette */
        :root {
          --accent-red: #EF4444;
          --accent-yellow: #FCD34D;
          --accent-gold: #F59E0B;
          --bg-black: #000000;
          --bg-gray-900: #0F0F0F;
          --bg-gray-800: #1A1A1A;
          --bg-gray-700: #2A2A2A;
          --text-white: #FFFFFF;
          --text-gray-300: #D1D5DB;
          --text-gray-500: #6B7280;
          --border-gray: #2A2A2A;
          --border-accent: #FCD34D;
        }

        .premium-broadcast-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          overflow: hidden;
          position: relative;
        }

        .premium-broadcast-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%);
          z-index: 1;
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
          border-top: 1px solid var(--accent-yellow);
          box-shadow: 0 -1px 8px rgba(252, 211, 77, 0.3);
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
          padding: 32px 80px;
          max-width: 1600px;
          margin: 0 auto;
          text-align: center;
        }

        .segment-topic {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--accent-yellow);
          margin: 0 0 12px 0;
        }

        .question-text {
          font-size: 38px;
          font-weight: 600;
          line-height: 1.8;
          color: var(--text-white);
          margin: 0;
        }

        /* TIMELINE - Integrated with yellow line */
        .timeline-container {
          position: fixed;
          bottom: 0;
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
          gap: 0;
          position: relative;
        }

        .timeline-segment {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          position: relative;
          padding: 0 20px;
        }

        /* The connecting line between segments */
        .timeline-segment:not(:last-child)::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: -2px;
          width: 40px;
          height: 1px;
          background: rgba(107, 114, 128, 0.5);
          z-index: -1;
        }

        .timeline-segment.active::after {
          background: var(--accent-yellow);
          box-shadow: 0 0 8px var(--accent-yellow);
        }

        .timeline-segment.completed::after {
          background: var(--accent-yellow);
        }

        /* Segment marker dots */
        .segment-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(26, 26, 26, 0.9);
          border: 2px solid rgba(107, 114, 128, 0.6);
          transition: all 300ms ease;
          margin-top: -1px;
        }

        .timeline-segment.active .segment-marker {
          background: var(--accent-yellow);
          border-color: var(--accent-yellow);
          box-shadow: 0 0 16px var(--accent-yellow), 0 0 32px rgba(251, 191, 36, 0.4);
          width: 16px;
          height: 16px;
          margin-top: -2px;
        }

        .timeline-segment.completed .segment-marker {
          background: var(--accent-gold);
          border-color: var(--accent-gold);
        }

        /* Segment names */
        .segment-name {
          font-size: 11px;
          font-weight: 600;
          color: rgba(107, 114, 128, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          white-space: nowrap;
          transition: all 300ms ease;
        }

        .timeline-segment.active .segment-name {
          color: var(--accent-yellow);
          font-size: 12px;
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
        }

        .timeline-segment.completed .segment-name {
          color: rgba(209, 213, 219, 0.5);
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
