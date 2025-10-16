import { useState, useEffect, useRef } from 'react'
import { supabase, QuestionBanner, BroadcastGraphic, LowerThird, AIEngagement, ShowQuestion, ShowSegment, SoundEffect } from '../lib/supabase'
import { Radio, Film, Clock, Activity, Zap } from 'lucide-react'
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

    return () => {
      bannerChannel.unsubscribe()
      graphicsChannel.unsubscribe()
      lowerThirdChannel.unsubscribe()
      aiChannel.unsubscribe()
      questionsChannel.unsubscribe()
      segmentsChannel.unsubscribe()
      soundsChannel.unsubscribe()
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

  const loadAllData = async () => {
    await Promise.all([
      loadQuestionBanner(),
      loadGraphics(),
      loadLowerThird(),
      loadAIFeatures(),
      loadPlayingQuestion(),
      loadActiveSegment(),
      loadPlayingSoundEffect(),
      loadAllSegments()
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

  const getGraphic = (type: string) => graphics.find(g => g.graphic_type === type)
  const hasFeature = (type: string) => aiFeatures.some(f => f.feature_type === type)

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Voice Visualizer Component
  const VoiceVisualizer = () => {
    const bars = Array.from({ length: 10 })
    return (
      <div className="flex items-end gap-1 h-12 justify-center">
        {bars.map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg voice-bar"
            style={{
              height: '100%',
              animation: isAudioPlaying ? `voice-pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate` : 'none',
              opacity: isAudioPlaying ? 1 : 0.3,
              boxShadow: isAudioPlaying ? '0 0 8px rgba(0, 240, 255, 0.6)' : 'none'
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
      className="command-center-container overflow-hidden relative" 
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slower" />
      </div>

      {/* ==== TOP SECTION: DUAL VIDEO ZONES (50% height) ==== */}
      <div className="relative z-10 grid grid-cols-2 gap-6 p-6" style={{ height: '540px' }}>
        
        {/* LEFT: Reaction Video Zone */}
        <div className="relative">
          <div className="h-full rounded-2xl overflow-hidden relative border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            {/* Corner Brackets */}
            <div className="corner-bracket corner-tl" />
            <div className="corner-bracket corner-tr" />
            <div className="corner-bracket corner-bl" />
            <div className="corner-bracket corner-br" />
            
            {/* Placeholder Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 to-purple-950/50 flex items-center justify-center">
              <div className="text-center">
                <Film className="w-24 h-24 mx-auto mb-4 text-cyan-400/40" />
                <p className="text-2xl font-bold text-cyan-400/60 tracking-wider">REACTION FEED</p>
                <p className="text-sm text-cyan-400/40 mt-2">Overlay in OBS</p>
              </div>
            </div>
            
            {/* Label */}
            <div className="absolute top-4 left-4 bg-cyan-500/20 border border-cyan-400/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-cyan-300 font-bold text-sm tracking-wider">VIDEO FEED</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Camera/Host Zone */}
        <div className="relative">
          <div className="h-full flex items-center justify-center">
            {/* Hexagonal Camera Frame */}
            <div className="relative">
              <div className="camera-hex-frame">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 to-blue-950/50 flex items-center justify-center">
                  <div className="text-center">
                    <Radio className="w-20 h-20 mx-auto mb-3 text-purple-400/40" />
                    <p className="text-xl font-bold text-purple-400/60 tracking-wider">CAMERA</p>
                    <p className="text-sm text-purple-400/40 mt-1">Overlay in OBS</p>
                  </div>
                </div>
              </div>
              
              {/* Animated Glow Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/50 animate-spin-slow shadow-[0_0_40px_rgba(139,0,255,0.4)]" style={{ animationDuration: '10s' }} />
              
              {/* Host Label */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-400/50 px-6 py-3 rounded-lg backdrop-blur-sm">
                <p className="text-purple-300 font-bold text-lg tracking-wider">HOST CAM</p>
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
                  className={`
                    p-2 rounded-lg text-center transition-all duration-300
                    ${segment.is_active 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-105' 
                      : 'bg-slate-800/50 hover:bg-slate-700/50'
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

        {/* CENTER: Active Question Display + Voice Visualizer */}
        <div className="col-span-8 flex flex-col gap-4">
          
          {/* Question Display */}
          <div className="flex-1 bg-gradient-to-br from-slate-900/80 to-blue-950/80 rounded-2xl border-2 border-blue-500/30 backdrop-blur-sm p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative overflow-hidden">
            {/* Animated Border Glow */}
            <div className="absolute inset-0 border-2 border-cyan-400/0 rounded-2xl animate-border-glow" />
            
            {playingQuestion ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-2">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-cyan-400 font-bold tracking-wider">BETABOT ASKS</p>
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
                <Activity className="w-4 h-4 text-cyan-400" />
                <p className="text-xs text-slate-400 font-bold tracking-wider">BETABOT VOICE</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${isAudioPlaying ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
                {isAudioPlaying ? 'ACTIVE' : 'IDLE'}
              </div>
            </div>
            <VoiceVisualizer />
          </div>
        </div>

        {/* RIGHT EDGE: Timer + Status Panel */}
        <div className="col-span-3 flex flex-col gap-4">
          
          {/* Segment Timer */}
          <div className="bg-gradient-to-br from-purple-900/80 to-slate-950/80 rounded-xl border-2 border-purple-500/30 backdrop-blur-sm p-4 shadow-[0_0_20px_rgba(139,0,255,0.2)]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <p className="text-xs text-purple-400 font-bold tracking-wider">SEGMENT TIMER</p>
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
          <div className="bg-gradient-to-br from-cyan-900/80 to-slate-950/80 rounded-xl border border-cyan-500/30 backdrop-blur-sm p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <p className="text-xs text-cyan-400 font-bold tracking-wider">AI STATUS</p>
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
          <div className="bg-gradient-to-r from-cyan-600/90 to-blue-600/90 px-8 py-4 rounded-r-xl border-l-4 border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.4)] backdrop-blur-sm">
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
          50% { border-color: rgba(6, 182, 212, 0.5); }
        }
        
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
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
            linear-gradient(30deg, #00f0ff 12%, transparent 12.5%, transparent 87%, #00f0ff 87.5%, #00f0ff),
            linear-gradient(150deg, #00f0ff 12%, transparent 12.5%, transparent 87%, #00f0ff 87.5%, #00f0ff),
            linear-gradient(30deg, #00f0ff 12%, transparent 12.5%, transparent 87%, #00f0ff 87.5%, #00f0ff),
            linear-gradient(150deg, #00f0ff 12%, transparent 12.5%, transparent 87%, #00f0ff 87.5%, #00f0ff);
          background-size: 80px 140px;
          background-position: 0 0, 0 0, 40px 70px, 40px 70px;
        }
        
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(0, 240, 255, 0.4);
          border-radius: 50%;
          animation: particle-float 15s ease-in-out infinite;
          box-shadow: 0 0 5px rgba(0, 240, 255, 0.6);
        }
        
        .camera-hex-frame {
          width: 400px;
          height: 400px;
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
          background: linear-gradient(135deg, rgba(139, 0, 255, 0.2), rgba(59, 130, 246, 0.2));
          border: 3px solid rgba(139, 0, 255, 0.5);
          box-shadow: 0 0 30px rgba(139, 0, 255, 0.3);
          position: relative;
        }
        
        .corner-bracket {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 240, 255, 0.6);
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
