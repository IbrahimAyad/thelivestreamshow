import { useState, useEffect, useRef } from 'react'
import { supabase, QuestionBanner, BroadcastGraphic, LowerThird, AIEngagement, ShowQuestion, ShowSegment, SoundEffect, BroadcastSettings } from '../lib/supabase'
import { Radio, Film, Clock, Activity, Zap, Play, Pause, SkipForward, RefreshCw, Grid, Layout, Palette } from 'lucide-react'
import { playSoundEffect } from '../utils/audioGenerator'

export function BroadcastOverlayView() {
  const [questionBanner, setQuestionBanner] = useState<QuestionBanner | null>(null)
  const [graphics, setGraphics] = useState<BroadcastGraphic[]>([])
  const [lowerThird, setLowerThird] = useState<LowerThird | null>(null)
  const [aiFeatures, setAiFeatures] = useState<AIEngagement[]>([])
  const [viewerCount, setViewerCount] = useState(0)
  const [playingQuestion, setPlayingQuestion] = useState<ShowQuestion | null>(null)
  const [activeSegment, setActiveSegment] = useState<ShowSegment | null>(null)
  const [playingSoundEffect, setPlayingSoundEffect] = useState<SoundEffect | null>(null)
  const [allSegments, setAllSegments] = useState<ShowSegment[]>([])
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [segmentTimer, setSegmentTimer] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // ENHANCEMENT 2: Layout Preset Switcher
  const [layoutPreset, setLayoutPreset] = useState('default')
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  
  // ENHANCEMENT 4: Color Theme Switcher
  const [colorTheme, setColorTheme] = useState('cyber-blue')
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  
  // ENHANCEMENT 3: Question Transition State
  const [questionTransition, setQuestionTransition] = useState<'enter' | 'exit' | null>(null)
  const prevQuestionRef = useRef<ShowQuestion | null>(null)
  
  // ENHANCEMENT 6: BetaBot Controls State
  const [isLoading, setIsLoading] = useState(false)

  // Apply broadcast mode styles on mount
  useEffect(() => {
    document.body.classList.add('broadcast-mode')
    document.documentElement.classList.add('broadcast-mode')
    
    return () => {
      document.body.classList.remove('broadcast-mode')
      document.documentElement.classList.remove('broadcast-mode')
    }
  }, [])

  useEffect(() => {
    loadAllData()

    // Subscribe to all tables
    const bannerChannel = supabase.channel('banner_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'question_banners'
    }, loadQuestionBanner).subscribe()

    const graphicsChannel = supabase.channel('graphics_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'broadcast_graphics'
    }, loadGraphics).subscribe()

    const lowerThirdChannel = supabase.channel('lowerthird_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'lower_thirds'
    }, loadLowerThird).subscribe()

    const aiChannel = supabase.channel('ai_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'ai_engagement'
    }, loadAIFeatures).subscribe()

    const questionsChannel = supabase.channel('questions_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'show_questions'
    }, loadPlayingQuestion).subscribe()

    const segmentsChannel = supabase.channel('segments_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'show_segments'
    }, loadActiveSegment).subscribe()

    const soundsChannel = supabase.channel('sounds_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'soundboard_effects'
    }, loadPlayingSoundEffect).subscribe()
    
    // ENHANCEMENT 2 & 4: Subscribe to broadcast_settings
    const settingsChannel = supabase.channel('settings_broadcast').on('postgres_changes', {
      event: '*', schema: 'public', table: 'broadcast_settings'
    }, loadBroadcastSettings).subscribe()

    return () => {
      bannerChannel.unsubscribe()
      graphicsChannel.unsubscribe()
      lowerThirdChannel.unsubscribe()
      aiChannel.unsubscribe()
      questionsChannel.unsubscribe()
      segmentsChannel.unsubscribe()
      soundsChannel.unsubscribe()
      settingsChannel.unsubscribe()
    }
  }, [])

  // Simulate viewer count changes
  useEffect(() => {
    const viewerFeature = aiFeatures.find(f => f.feature_type === 'viewer_count' && f.is_active)
    if (viewerFeature) {
      const baseCount = viewerFeature.config?.base_count || 10
      setViewerCount(baseCount + Math.floor(Math.random() * 15))
      
      const interval = setInterval(() => {
        setViewerCount(prev => {
          const change = Math.random() > 0.5 ? 1 : -1
          return Math.max(baseCount, prev + change)
        })
      }, 5000)

      return () => clearInterval(interval)
    } else {
      setViewerCount(0)
    }
  }, [aiFeatures])

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

  // Segment timer
  useEffect(() => {
    if (activeSegment) {
      setSegmentTimer(0)
      const interval = setInterval(() => {
        setSegmentTimer(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeSegment?.id])
  
  // ENHANCEMENT 3: Question Transition Effect
  useEffect(() => {
    if (prevQuestionRef.current?.id !== playingQuestion?.id) {
      if (prevQuestionRef.current && !playingQuestion) {
        setQuestionTransition('exit')
        setTimeout(() => setQuestionTransition(null), 500)
      } else if (playingQuestion) {
        setQuestionTransition('enter')
        setTimeout(() => setQuestionTransition(null), 500)
      }
      prevQuestionRef.current = playingQuestion
    }
  }, [playingQuestion])
  
  // ENHANCEMENT 6: Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch(e.key) {
        case ' ': // Space - play/pause
          e.preventDefault()
          await handlePlayPause()
          break
        case 'ArrowRight': // Right arrow - next question
          e.preventDefault()
          await handleNextQuestion()
          break
        case 'r': // R - regenerate
        case 'R':
          e.preventDefault()
          await handleRegenerate()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [playingQuestion, isAudioPlaying])

  const loadAllData = async () => {
    await Promise.all([
      loadQuestionBanner(),
      loadGraphics(),
      loadLowerThird(),
      loadAIFeatures(),
      loadPlayingQuestion(),
      loadActiveSegment(),
      loadPlayingSoundEffect(),
      loadAllSegments(),
      loadBroadcastSettings()
    ])
  }

  const loadAllSegments = async () => {
    const { data } = await supabase
      .from('show_segments')
      .select('*')
      .order('created_at')
    
    if (data) setAllSegments(data as ShowSegment[])
    else setAllSegments([])
  }

  const loadQuestionBanner = async () => {
    const { data } = await supabase
      .from('question_banners')
      .select('*')
      .eq('is_visible', true)
      .limit(1)
      .maybeSingle()
    
    setQuestionBanner(data as QuestionBanner | null)
  }

  const loadGraphics = async () => {
    const { data } = await supabase
      .from('broadcast_graphics')
      .select('*')
      .eq('is_visible', true)
    
    if (data) setGraphics(data as BroadcastGraphic[])
    else setGraphics([])
  }

  const loadLowerThird = async () => {
    const { data } = await supabase
      .from('lower_thirds')
      .select('*')
      .eq('is_visible', true)
      .limit(1)
      .maybeSingle()
    
    setLowerThird(data as LowerThird | null)
  }

  const loadAIFeatures = async () => {
    const { data } = await supabase
      .from('ai_engagement')
      .select('*')
      .eq('is_active', true)
    
    if (data) setAiFeatures(data as AIEngagement[])
    else setAiFeatures([])
  }

  const loadPlayingQuestion = async () => {
    const { data } = await supabase
      .from('show_questions')
      .select('*')
      .eq('is_played', true)
      .limit(1)
      .maybeSingle()
    
    const newQuestion = data as ShowQuestion | null;
    
    // If a new question started playing, trigger audio (Amazon Polly TTS)
    if (newQuestion && newQuestion.id !== playingQuestion?.id) {
      if (newQuestion.tts_audio_url && audioRef.current) {
        // Play Amazon Polly generated audio file for BetaBot
        audioRef.current.src = newQuestion.tts_audio_url;
        audioRef.current.volume = 1.0; // Full volume for broadcast
        audioRef.current.play().catch(error => {
          console.error('BetaBot audio playback error:', error);
        });
        setIsAudioPlaying(true);
      }
    }
    
    setPlayingQuestion(newQuestion);
  }

  const loadActiveSegment = async () => {
    const { data } = await supabase
      .from('show_segments')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    
    setActiveSegment(data as ShowSegment | null)
  }

  const loadPlayingSoundEffect = async () => {
    const { data } = await supabase
      .from('soundboard_effects')
      .select('*')
      .eq('is_playing', true)
      .limit(1)
      .maybeSingle()
    
    const newEffect = data as SoundEffect | null;
    
    // If a new sound effect started playing, trigger audio
    if (newEffect && newEffect.id !== playingSoundEffect?.id) {
      const effectName = newEffect.effect_type.replace('_light', '').replace('_heavy', '');
      try {
        playSoundEffect(effectName);
      } catch (error) {
        console.error('Error playing sound effect on broadcast:', error);
      }
    }
    
    setPlayingSoundEffect(newEffect);
  }
  
  // ENHANCEMENT 2 & 4: Load Broadcast Settings
  const loadBroadcastSettings = async () => {
    const { data } = await supabase
      .from('broadcast_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    if (data) {
      const settings = data as BroadcastSettings
      if (settings.setting_value.layout_preset) setLayoutPreset(settings.setting_value.layout_preset)
      if (settings.setting_value.color_theme) setColorTheme(settings.setting_value.color_theme)
    }
  }
  
  // ENHANCEMENT 2: Update Layout Preset
  const updateLayoutPreset = async (preset: string) => {
    setLayoutPreset(preset)
    setShowLayoutMenu(false)
    
    const { data } = await supabase
      .from('broadcast_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    if (data) {
      await supabase
        .from('broadcast_settings')
        .update({ layout_preset: preset })
        .eq('id', data.id)
    } else {
      await supabase
        .from('broadcast_settings')
        .insert({ layout_preset: preset, color_theme: colorTheme })
    }
  }
  
  // ENHANCEMENT 4: Update Color Theme
  const updateColorTheme = async (theme: string) => {
    setColorTheme(theme)
    setShowThemeMenu(false)
    
    const { data } = await supabase
      .from('broadcast_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    if (data) {
      await supabase
        .from('broadcast_settings')
        .update({ color_theme: theme })
        .eq('id', data.id)
    } else {
      await supabase
        .from('broadcast_settings')
        .insert({ layout_preset: layoutPreset, color_theme: theme })
    }
  }
  
  // ENHANCEMENT 5: Handle Segment Click
  const handleSegmentClick = async (segment: ShowSegment) => {
    if (segment.is_active) return // Already active
    
    // Deactivate all segments
    await supabase
      .from('show_segments')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Activate clicked segment
    await supabase
      .from('show_segments')
      .update({ is_active: true })
      .eq('id', segment.id)
  }
  
  // ENHANCEMENT 6: BetaBot Control Functions
  const handlePlayPause = async () => {
    if (!audioRef.current) return
    
    if (isAudioPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(console.error)
    }
  }
  
  const handleNextQuestion = async () => {
    setIsLoading(true)
    
    // Stop current question
    if (playingQuestion) {
      await supabase
        .from('show_questions')
        .update({ is_played: false })
        .eq('id', playingQuestion.id)
    }
    
    // Find next unplayed question
    const { data } = await supabase
      .from('show_questions')
      .select('*')
      .eq('is_played', false)
      .order('created_at')
      .limit(1)
      .maybeSingle()
    
    if (data) {
      await supabase
        .from('show_questions')
        .update({ is_played: true })
        .eq('id', data.id)
    }
    
    setIsLoading(false)
  }
  
  const handleRegenerate = async () => {
    if (!playingQuestion) return
    
    setIsLoading(true)
    
    // Call edge function to regenerate TTS for current question
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-tts', {
        body: { question_id: playingQuestion.id }
      })
      
      if (error) throw error
      
      // Reload question to get new audio URL
      await loadPlayingQuestion()
    } catch (error) {
      console.error('Error regenerating TTS:', error)
    }
    
    setIsLoading(false)
  }

  const getGraphic = (type: string) => graphics.find(g => g.graphic_type === type)
  const hasFeature = (type: string) => aiFeatures.some(f => f.feature_type === type)

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // ENHANCEMENT 2: Get layout styles based on preset
  const getLayoutStyles = () => {
    switch(layoutPreset) {
      case 'theater':
        return {
          reaction: { gridColumn: 'span 2', height: '70%' },
          camera: { position: 'absolute' as const, top: '20px', right: '20px', width: '25%', height: '25%' }
        }
      case 'interview':
        return {
          reaction: { width: '48%' },
          camera: { width: '48%' }
        }
      case 'camera-focus':
        return {
          reaction: { position: 'absolute' as const, bottom: '20px', left: '20px', width: '30%', height: '30%' },
          camera: { width: '65%', margin: '0 auto' }
        }
      default: // 'default' 50/50 split
        return {
          reaction: {},
          camera: {}
        }
    }
  }
  
  const layoutStyles = getLayoutStyles()

  // Voice Visualizer Component
  const VoiceVisualizer = () => {
    const bars = Array.from({ length: 10 })
    return (
      <div className="flex items-end gap-1 h-12 justify-center">
        {bars.map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-accent-primary to-blue-500 rounded-t-lg voice-bar"
            style={{
              height: '100%',
              animation: isAudioPlaying ? `voice-pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate` : 'none',
              opacity: isAudioPlaying ? 1 : 0.3,
              boxShadow: isAudioPlaying ? '0 0 8px var(--accent-primary-glow)' : 'none'
            }}
          />
        ))}
      </div>
    )
  }


  const liveIndicator = getGraphic('live_indicator')
  const logo = getGraphic('logo')
  const brb = getGraphic('brb')
  const startingSoon = getGraphic('starting_soon')
  const techDifficulties = getGraphic('tech_difficulties')

  return (
    <div 
      className={`command-center-container overflow-hidden relative theme-${colorTheme}`}
      style={{ 
        width: '1920px', 
        height: '1080px',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)',
        fontFamily: "'Rajdhani', 'Orbitron', sans-serif"
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Hex Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="hex-pattern" />
        </div>
        
        {/* Particles */}
        <div className="particles-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
        
        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary-orb rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary-orb rounded-full blur-3xl animate-pulse-slower" />
      </div>
      
      {/* ENHANCEMENT 4: Color Theme Switcher UI (top-left) */}
      <div className="absolute top-8 left-8 z-50">
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="bg-slate-900/80 border border-accent-primary/50 px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-slate-800/80 transition-all"
          >
            <Palette className="w-5 h-5 text-accent-primary" />
          </button>
          
          {showThemeMenu && (
            <div className="absolute top-12 left-0 bg-slate-900/95 border border-accent-primary/50 rounded-lg p-2 backdrop-blur-md min-w-[150px]">
              <button
                onClick={() => updateColorTheme('cyber-blue')}
                className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all ${colorTheme === 'cyber-blue' ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-300'}`}
              >
                Cyber Blue
              </button>
              <button
                onClick={() => updateColorTheme('neon-red')}
                className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all ${colorTheme === 'neon-red' ? 'bg-red-600/30 text-red-300' : 'text-slate-300'}`}
              >
                Neon Red
              </button>
              <button
                onClick={() => updateColorTheme('matrix-green')}
                className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all ${colorTheme === 'matrix-green' ? 'bg-green-600/30 text-green-300' : 'text-slate-300'}`}
              >
                Matrix Green
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* ENHANCEMENT 2: Layout Preset Switcher UI (top-right) */}
      <div className="absolute top-8 right-8 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="bg-slate-900/80 border border-accent-primary/50 px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-slate-800/80 transition-all flex items-center gap-2"
          >
            <Layout className="w-5 h-5 text-accent-primary" />
            <span className="text-accent-primary text-sm font-bold uppercase">{layoutPreset}</span>
          </button>
          
          {showLayoutMenu && (
            <div className="absolute top-12 right-0 bg-slate-900/95 border border-accent-primary/50 rounded-lg p-2 backdrop-blur-md min-w-[180px]">
              <button
                onClick={() => updateLayoutPreset('default')}
                className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all ${layoutPreset === 'default' ? 'bg-accent-primary/30 text-accent-primary' : 'text-slate-300'}`}
              >
                <Grid className="w-4 h-4 inline mr-2" />
                Default 50/50
              </button>
              <button
                onClick={() => updateLayoutPreset('theater')}
                className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all ${layoutPreset === 'theater' ? 'bg-accent-primary/30 text-accent-primary' : 'text-slate-300'}`}
              >
                <Film className="w-4 h-4 inline mr-2" />
                Theater Mode
              </button>
              <button
                onClick={() => updateLayoutPreset('interview')}
                className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all ${layoutPreset === 'interview' ? 'bg-accent-primary/30 text-accent-primary' : 'text-slate-300'}`}
              >
                <Radio className="w-4 h-4 inline mr-2" />
                Interview
              </button>
              <button
                onClick={() => updateLayoutPreset('camera-focus')}
                className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition-all ${layoutPreset === 'camera-focus' ? 'bg-accent-primary/30 text-accent-primary' : 'text-slate-300'}`}
              >
                <Radio className="w-4 h-4 inline mr-2" />
                Camera Focus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==== TOP SECTION: DUAL VIDEO ZONES (50% height) ==== */}
      <div 
        className="relative z-10 p-6" 
        style={{ 
          height: '540px',
          display: layoutPreset === 'theater' || layoutPreset === 'camera-focus' ? 'block' : 'grid',
          gridTemplateColumns: layoutPreset === 'interview' ? '1fr 1fr' : '1fr 1fr',
          gap: layoutPreset === 'default' ? '24px' : '12px',
          position: 'relative'
        }}
      >
        
        {/* LEFT: Reaction Video Zone */}
        <div className="relative" style={layoutStyles.reaction}>
          <div className="h-full rounded-2xl overflow-hidden relative border-2 border-accent-primary/30 shadow-accent-glow">
            {/* Corner Brackets */}
            <div className="corner-bracket corner-tl" />
            <div className="corner-bracket corner-tr" />
            <div className="corner-bracket corner-bl" />
            <div className="corner-bracket corner-br" />
            
            {/* Placeholder Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 to-purple-950/50 flex items-center justify-center">
              <div className="text-center">
                <Film className="w-24 h-24 mx-auto mb-4 text-accent-primary/40" />
                <p className="text-2xl font-bold text-accent-primary/60 tracking-wider">REACTION FEED</p>
                <p className="text-sm text-accent-primary/40 mt-2">Overlay in OBS</p>
              </div>
            </div>
            
            {/* Label */}
            <div className="absolute top-4 left-4 bg-accent-primary/20 border border-accent-primary/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-accent-primary font-bold text-sm tracking-wider">VIDEO FEED</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Camera/Host Zone */}
        <div className="relative" style={layoutStyles.camera}>
          <div className="h-full flex items-center justify-center">
            {/* Hexagonal Camera Frame */}
            <div className="relative">
              <div className="camera-hex-frame">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 to-blue-950/50 flex items-center justify-center">
                  <div className="text-center">
                    <Radio className="w-20 h-20 mx-auto mb-3 text-accent-secondary/40" />
                    <p className="text-xl font-bold text-accent-secondary/60 tracking-wider">CAMERA</p>
                    <p className="text-sm text-accent-secondary/40 mt-1">Overlay in OBS</p>
                  </div>
                </div>
              </div>
              
              {/* Animated Glow Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-accent-secondary/50 animate-spin-slow shadow-accent-secondary-glow" style={{ animationDuration: '10s' }} />
              
              {/* Host Label */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-secondary/20 to-blue-600/20 border border-accent-secondary/50 px-6 py-3 rounded-lg backdrop-blur-sm">
                <p className="text-accent-secondary font-bold text-lg tracking-wider">HOST CAM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==== BOTTOM SECTION: MODULAR INFO DASHBOARD (50% height) ==== */}
      <div className="relative z-10 grid grid-cols-12 gap-4 px-6 pb-6" style={{ height: '540px' }}>
        
        {/* LEFT EDGE: Vertical Segment Strip */}
        <div className="col-span-1 flex flex-col gap-3">
          <div className="flex-1 bg-gradient-to-b from-slate-900/80 to-slate-950/80 rounded-xl border border-slate-700/50 backdrop-blur-sm p-3 shadow-lg">
            <p className="text-xs text-slate-400 font-bold mb-3 text-center">SEGMENTS</p>
            <div className="space-y-2">
              {allSegments.map((segment) => (
                <div
                  key={segment.id}
                  onClick={() => handleSegmentClick(segment)}
                  className={`
                    p-2 rounded-lg text-center transition-all duration-300 cursor-pointer segment-item
                    ${segment.is_active 
                      ? 'bg-gradient-to-r from-accent-primary to-blue-600 shadow-accent-glow-strong scale-105 segment-active' 
                      : 'bg-slate-800/50 hover:bg-slate-700/50 hover:scale-102'
                    }
                  `}
                >
                  <p className={`text-xs font-bold ${segment.is_active ? 'text-white' : 'text-slate-400'}`}>
                    {segment.segment_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Active Question Display + Voice Visualizer + BetaBot Controls */}
        <div className="col-span-8 flex flex-col gap-4">
          
          {/* Question Display */}
          <div className={`flex-1 bg-gradient-to-br from-slate-900/80 to-blue-950/80 rounded-2xl border-2 border-blue-500/30 backdrop-blur-sm p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative overflow-hidden ${questionTransition === 'enter' ? 'question-enter' : ''} ${questionTransition === 'exit' ? 'question-exit' : ''}`}>
            {/* Animated Border Glow */}
            <div className="absolute inset-0 border-2 border-accent-primary/0 rounded-2xl animate-border-glow" />
            
            {playingQuestion ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-accent-primary to-blue-500 rounded-full p-2">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-accent-primary font-bold tracking-wider">BETABOT ASKS</p>
                    <p className="text-xs text-slate-400">AI Co-Host Question</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-white leading-relaxed tracking-wide">
                    {playingQuestion.question_text}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xl text-slate-500 font-bold tracking-wider">STANDBY FOR NEXT QUESTION</p>
              </div>
            )}
          </div>

          {/* Voice Visualizer */}
          <div className="bg-gradient-to-r from-slate-900/80 to-slate-950/80 rounded-xl border border-slate-700/50 backdrop-blur-sm p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-primary" />
                <p className="text-xs text-slate-400 font-bold tracking-wider">BETABOT VOICE</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${isAudioPlaying ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
                {isAudioPlaying ? 'ACTIVE' : 'IDLE'}
              </div>
            </div>
            <VoiceVisualizer />
          </div>
          
          {/* ENHANCEMENT 6: BetaBot Controls */}
          <div className="bg-gradient-to-r from-slate-900/80 to-slate-950/80 rounded-xl border border-accent-primary/30 backdrop-blur-sm p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-xs text-accent-primary font-bold tracking-wider">BETABOT CONTROLS</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  disabled={!playingQuestion || isLoading}
                  className="bg-accent-primary/20 border border-accent-primary/50 px-3 py-2 rounded hover:bg-accent-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Space: Play/Pause"
                >
                  {isAudioPlaying ? <Pause className="w-4 h-4 text-accent-primary" /> : <Play className="w-4 h-4 text-accent-primary" />}
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={isLoading}
                  className="bg-accent-primary/20 border border-accent-primary/50 px-3 py-2 rounded hover:bg-accent-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Right Arrow: Next"
                >
                  <SkipForward className="w-4 h-4 text-accent-primary" />
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={!playingQuestion || isLoading}
                  className="bg-accent-primary/20 border border-accent-primary/50 px-3 py-2 rounded hover:bg-accent-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="R: Regenerate"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 text-accent-primary animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-accent-primary" />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">
              Shortcuts: Space (Play/Pause) • Right (Next) • R (Regenerate)
            </div>
          </div>
        </div>

        {/* RIGHT EDGE: Timer + Status Panel */}
        <div className="col-span-3 flex flex-col gap-4">
          
          {/* Segment Timer */}
          <div className="bg-gradient-to-br from-purple-900/80 to-slate-950/80 rounded-xl border-2 border-accent-secondary/30 backdrop-blur-sm p-4 shadow-accent-secondary-glow">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-accent-secondary" />
              <p className="text-xs text-accent-secondary font-bold tracking-wider">SEGMENT TIMER</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-white tracking-wider tabular-nums" style={{ fontFamily: 'monospace' }}>
                {formatTime(segmentTimer)}
              </p>
            </div>
          </div>

          {/* Active Segment Info */}
          {activeSegment && (
            <div className="bg-gradient-to-br from-indigo-900/80 to-slate-950/80 rounded-xl border border-indigo-500/30 backdrop-blur-sm p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <p className="text-xs text-indigo-400 font-bold tracking-wider">NOW PLAYING</p>
              </div>
              <p className="text-xl font-bold text-white">{activeSegment.segment_name}</p>
              <p className="text-xs text-slate-400 mt-1">{allSegments.findIndex(s => s.id === activeSegment.id) + 1} of {allSegments.length}</p>
            </div>
          )}

          {/* BetaBot Status */}
          <div className="bg-gradient-to-br from-cyan-900/80 to-slate-950/80 rounded-xl border border-accent-primary/30 backdrop-blur-sm p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-accent-primary" />
              <p className="text-xs text-accent-primary font-bold tracking-wider">AI STATUS</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAudioPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
              <p className="text-sm text-white font-bold">{isAudioPlaying ? 'Speaking' : 'Ready'}</p>
            </div>
          </div>

          {/* Viewer Count */}
          {viewerCount > 0 && (
            <div className="bg-gradient-to-br from-green-900/80 to-slate-950/80 rounded-xl border border-green-500/30 backdrop-blur-sm p-4 shadow-lg">
              <p className="text-xs text-green-400 font-bold tracking-wider mb-2">LIVE VIEWERS</p>
              <p className="text-3xl font-bold text-white">{viewerCount}</p>
            </div>
          )}
        </div>
      </div>

      {/* ==== OVERLAYS (Full-screen graphics) ==== */}
      
      {/* BRB */}
      {brb && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-yellow-600/95 to-red-700/95 animate-fade-in">
          <div className="text-center">
            <h1 className="text-8xl font-bold text-white mb-4 tracking-wider">BE RIGHT BACK</h1>
            <p className="text-3xl text-white/90">Thanks for waiting!</p>
          </div>
        </div>
      )}

      {/* Starting Soon */}
      {startingSoon && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-700/95 to-purple-700/95 animate-fade-in">
          <div className="text-center">
            <h1 className="text-8xl font-bold text-white mb-4 tracking-wider">STARTING SOON</h1>
            <p className="text-3xl text-white/90">Get ready!</p>
          </div>
        </div>
      )}

      {/* Tech Difficulties */}
      {techDifficulties && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-700/95 to-red-800/95 animate-fade-in">
          <div className="text-center">
            <h1 className="text-8xl font-bold text-white mb-4 tracking-wider">TECHNICAL DIFFICULTIES</h1>
            <p className="text-3xl text-white/90">Please stand by...</p>
          </div>
        </div>
      )}

      {/* Lower Third - Updated Style */}
      {lowerThird && (
        <div className="absolute bottom-32 left-8 z-40 animate-slide-in-left">
          <div className="bg-gradient-to-r from-accent-primary/90 to-blue-600/90 px-8 py-4 rounded-r-xl border-l-4 border-accent-primary shadow-accent-glow backdrop-blur-sm">
            <h3 className="font-bold text-3xl text-white mb-1">{lowerThird.title_text}</h3>
            <p className="text-xl text-cyan-100">{lowerThird.subtitle_text}</p>
          </div>
        </div>
      )}

      {/* LIVE Indicator */}
      {liveIndicator && (
        <div className="absolute top-8 right-8 z-40">
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="font-bold text-2xl text-white tracking-wider">LIVE</span>
          </div>
        </div>
      )}

      {/* Logo */}
      {logo && (
        <div className="absolute top-8 left-8 z-40">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 rounded-xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <span className="font-bold text-3xl text-black tracking-wider">LOGO</span>
          </div>
        </div>
      )}

      {/* Sound Effect Indicator */}
      {playingSoundEffect && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-16 py-12 rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.6)] border-4 border-green-400">
            <p className="text-6xl font-bold text-white text-center">{playingSoundEffect.effect_name}</p>
          </div>
        </div>
      )}

      {/* Question Banner - Bottom Scrolling */}
      {questionBanner && (
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 overflow-hidden border-t-2 border-red-400 shadow-[0_-5px_20px_rgba(239,68,68,0.3)]">
          <div 
            className="whitespace-nowrap text-2xl font-bold text-white"
            style={{
              animation: `scroll-banner ${100 / questionBanner.animation_speed * 20}s linear infinite`
            }}
          >
            {questionBanner.question_text}
          </div>
        </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* Embedded Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Orbitron:wght@600;900&display=swap');
        
        /* ENHANCEMENT 4: CSS Custom Properties for Color Themes */
        .theme-cyber-blue {
          --accent-primary: #00f0ff;
          --accent-secondary: #8b00ff;
          --accent-primary-glow: rgba(0, 240, 255, 0.6);
          --accent-secondary-glow: rgba(139, 0, 255, 0.4);
          --accent-primary-orb: rgba(0, 240, 255, 0.1);
          --accent-secondary-orb: rgba(139, 0, 255, 0.1);
        }
        
        .theme-neon-red {
          --accent-primary: #ff0055;
          --accent-secondary: #ff6b00;
          --accent-primary-glow: rgba(255, 0, 85, 0.6);
          --accent-secondary-glow: rgba(255, 107, 0, 0.4);
          --accent-primary-orb: rgba(255, 0, 85, 0.1);
          --accent-secondary-orb: rgba(255, 107, 0, 0.1);
        }
        
        .theme-matrix-green {
          --accent-primary: #00ff41;
          --accent-secondary: #00c9a7;
          --accent-primary-glow: rgba(0, 255, 65, 0.6);
          --accent-secondary-glow: rgba(0, 201, 167, 0.4);
          --accent-primary-orb: rgba(0, 255, 65, 0.1);
          --accent-secondary-orb: rgba(0, 201, 167, 0.1);
        }
        
        /* Utility classes for themed elements */
        .bg-accent-primary { background-color: var(--accent-primary); }
        .bg-accent-secondary { background-color: var(--accent-secondary); }
        .text-accent-primary { color: var(--accent-primary); }
        .text-accent-secondary { color: var(--accent-secondary); }
        .border-accent-primary { border-color: var(--accent-primary); }
        .border-accent-secondary { border-color: var(--accent-secondary); }
        .bg-accent-primary-orb { background-color: var(--accent-primary-orb); }
        .bg-accent-secondary-orb { background-color: var(--accent-secondary-orb); }
        .shadow-accent-glow { box-shadow: 0 0 30px var(--accent-primary-glow); }
        .shadow-accent-glow-strong { box-shadow: 0 0 20px var(--accent-primary-glow); }
        .shadow-accent-secondary-glow { box-shadow: 0 0 20px var(--accent-secondary-glow); }
        
        @keyframes scroll-banner {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        @keyframes slide-in-left {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes voice-pulse {
          0% { height: 20%; }
          100% { height: 100%; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
        }
        
        @keyframes border-glow {
          0%, 100% { border-color: rgba(6, 182, 212, 0); }
          50% { border-color: var(--accent-primary-glow); }
        }
        
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        /* ENHANCEMENT 1: Active Segment Pulsing Animation */
        @keyframes segment-pulse {
          0%, 100% { 
            box-shadow: 0 0 15px var(--accent-primary-glow);
            transform: scale(1.05);
          }
          50% { 
            box-shadow: 0 0 30px var(--accent-primary-glow);
            transform: scale(1.08);
          }
        }
        
        .segment-active {
          animation: segment-pulse 2s ease-in-out infinite;
        }
        
        /* ENHANCEMENT 3: Question Transition Animations */
        @keyframes question-enter {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes question-exit {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
        }
        
        .question-enter {
          animation: question-enter 0.5s ease-out;
        }
        
        .question-exit {
          animation: question-exit 0.5s ease-out;
        }
        
        /* ENHANCEMENT 5: Segment Hover & Click Effects */
        .segment-item {
          position: relative;
          overflow: hidden;
        }
        
        .segment-item::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: var(--accent-primary-glow);
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s;
        }
        
        .segment-item:active::after {
          width: 200%;
          height: 200%;
        }
        
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
        
        .animate-slide-in-left { animation: slide-in-left 0.5s ease-out; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 12s ease-in-out infinite; }
        .animate-border-glow { animation: border-glow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        
        .hex-pattern {
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(30deg, var(--accent-primary) 12%, transparent 12.5%, transparent 87%, var(--accent-primary) 87.5%, var(--accent-primary)),
            linear-gradient(150deg, var(--accent-primary) 12%, transparent 12.5%, transparent 87%, var(--accent-primary) 87.5%, var(--accent-primary)),
            linear-gradient(30deg, var(--accent-primary) 12%, transparent 12.5%, transparent 87%, var(--accent-primary) 87.5%, var(--accent-primary)),
            linear-gradient(150deg, var(--accent-primary) 12%, transparent 12.5%, transparent 87%, var(--accent-primary) 87.5%, var(--accent-primary));
          background-size: 80px 140px;
          background-position: 0 0, 0 0, 40px 70px, 40px 70px;
        }
        
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: var(--accent-primary-glow);
          border-radius: 50%;
          animation: particle-float 15s ease-in-out infinite;
          box-shadow: 0 0 5px var(--accent-primary-glow);
        }
        
        .camera-hex-frame {
          width: 400px;
          height: 400px;
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
          background: linear-gradient(135deg, rgba(139, 0, 255, 0.2), rgba(59, 130, 246, 0.2));
          border: 3px solid var(--accent-secondary);
          box-shadow: 0 0 30px var(--accent-secondary-glow);
          position: relative;
        }
        
        .corner-bracket {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 3px solid var(--accent-primary-glow);
        }
        
        .corner-tl {
          top: -3px;
          left: -3px;
          border-right: none;
          border-bottom: none;
        }
        
        .corner-tr {
          top: -3px;
          right: -3px;
          border-left: none;
          border-bottom: none;
        }
        
        .corner-bl {
          bottom: -3px;
          left: -3px;
          border-right: none;
          border-top: none;
        }
        
        .corner-br {
          bottom: -3px;
          right: -3px;
          border-left: none;
          border-top: none;
        }
      `}</style>
    </div>
  )
}
