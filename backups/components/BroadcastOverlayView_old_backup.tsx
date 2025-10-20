import { useState, useEffect, useRef } from 'react'
import { supabase, QuestionBanner, BroadcastGraphic, LowerThird, AIEngagement, ShowQuestion, ShowSegment, SoundEffect, BroadcastSettings } from '../lib/supabase'
import { Clock, Activity, Zap, Play, Pause, SkipForward, RefreshCw, Palette, Volume2 } from 'lucide-react'
import { playSoundEffect } from '../utils/audioGenerator'
import { BetaBotPopup } from './BetaBotPopup'
import { SegmentTitleDisplay } from './SegmentTitleDisplay'
import LowerThirdOverlay from './LowerThirdOverlay'
import EpisodeInfoDisplay from './EpisodeInfoDisplay'
import LiveIndicator from './LiveIndicator'
import { NextUpPreview } from './NextUpPreview'
import { TotalShowTimer } from './TotalShowTimer'
import { HelpOverlay } from './HelpOverlay'
import { EmergencyControls } from './EmergencyControls'
import { ShowTimeline } from './ShowTimeline'

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
  
  // Audio permission handling for OBS/Stream autoplay
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false)
  const [showAudioPrompt, setShowAudioPrompt] = useState(false)
  
  // Layout preset for broadcast layout switching
  const [layoutPreset, setLayoutPreset] = useState<'default' | 'theater' | 'interview' | 'camera-focus'>('default')
  
  // ENHANCEMENT 4: Color Theme Switcher
  const [colorTheme, setColorTheme] = useState('cyber-blue')
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  
  // ENHANCEMENT 3: Question Transition State
  const [questionTransition, setQuestionTransition] = useState<'enter' | 'exit' | null>(null)
  const prevQuestionRef = useRef<ShowQuestion | null>(null)
  
  // ENHANCEMENT 6: BetaBot Controls State
  const [isLoading, setIsLoading] = useState(false)
  
  // NEW: Popup state for BetaBot questions
  const [popupVisible, setPopupVisible] = useState(false)
  const [popupQuestion, setPopupQuestion] = useState<ShowQuestion | null>(null)
  const [popupDuration, setPopupDuration] = useState(15)
  const [autoShowNext, setAutoShowNext] = useState(false)
  
  // Visual feedback for keyboard shortcuts
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null)
  
  // Emergency overlays state
  const [blackScreenActive, setBlackScreenActive] = useState(false)
  const [techDifficultiesActive, setTechDifficultiesActive] = useState(false)
  const [lowerThirdVisible, setLowerThirdVisible] = useState(false)
  const [nextUpHighlight, setNextUpHighlight] = useState(false)

  // Apply broadcast mode styles on mount
  useEffect(() => {
    document.body.classList.add('broadcast-mode')
    document.documentElement.classList.add('broadcast-mode')
    
    return () => {
      document.body.classList.remove('broadcast-mode')
      document.documentElement.classList.remove('broadcast-mode')
    }
  }, [])
  
  // Check audio permission on mount
  useEffect(() => {
    const wasGranted = localStorage.getItem('betabot_audio_enabled') === 'true'
    setAudioPermissionGranted(wasGranted)
    
    // Show prompt after 2 seconds if permission not granted
    if (!wasGranted) {
      const timer = setTimeout(() => {
        setShowAudioPrompt(true)
      }, 2000)
      return () => clearTimeout(timer)
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

  // NEW: Load popup settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('popup_settings')
      if (saved) {
        const settings = JSON.parse(saved)
        setPopupDuration(settings.duration || 15)
        setAutoShowNext(settings.auto_show_next || false)
      }
    }

    loadSettings()

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      const settings = event.detail
      setPopupDuration(settings.duration || 15)
      setAutoShowNext(settings.auto_show_next || false)
    }

    window.addEventListener('popup-settings-changed', handleSettingsChange as EventListener)
    // Also check for changes via storage events (cross-tab)
    window.addEventListener('storage', loadSettings)

    return () => {
      window.removeEventListener('popup-settings-changed', handleSettingsChange as EventListener)
      window.removeEventListener('storage', loadSettings)
    }
  }, [])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false)
      }
    }

    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showThemeMenu])

  // NEW: Watch for show_on_overlay trigger
  useEffect(() => {
    const overlayChannel = supabase
      .channel('overlay_trigger')
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
  
  // ENHANCEMENT 6: Keyboard Shortcuts & Close Dropdowns on Escape & Visual Feedback
  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      // Close dropdowns on Escape
      if (e.key === 'Escape') {
        setShowThemeMenu(false)
        showShortcutFeedback('ESC')
        return
      }
      
      switch(e.key.toLowerCase()) {
        case ' ': // Space - play/pause
          e.preventDefault()
          await handlePlayPause()
          showShortcutFeedback('SPACE')
          break
        case 'arrowright': // Right arrow - next question
          e.preventDefault()
          await handleNextQuestion()
          showShortcutFeedback('→')
          break
        case 'r': // R - regenerate
          e.preventDefault()
          await handleRegenerate()
          showShortcutFeedback('R')
          break
        case 'b': // B - Black screen toggle
          e.preventDefault()
          setBlackScreenActive(!blackScreenActive)
          showShortcutFeedback('B')
          break
        case 't': // T - Technical difficulties toggle
          e.preventDefault()
          setTechDifficultiesActive(!techDifficultiesActive)
          showShortcutFeedback('T')
          break
        case 'l': // L - Toggle lower third
          e.preventDefault()
          setLowerThirdVisible(!lowerThirdVisible)
          showShortcutFeedback('L')
          break
        case 'q': // Q - Show next question popup
          e.preventDefault()
          await handleShowNextQuestion()
          showShortcutFeedback('Q')
          break
        case 'n': // N - Highlight Next Up
          e.preventDefault()
          setNextUpHighlight(true)
          showShortcutFeedback('N')
          setTimeout(() => setNextUpHighlight(false), 2000)
          break
        case 's': // S - Next segment
          e.preventDefault()
          await handleNextSegment()
          showShortcutFeedback('S')
          break
        case 'm': // M - Mute/Unmute audio
          e.preventDefault()
          if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted
            showShortcutFeedback('M')
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [playingQuestion, isAudioPlaying, blackScreenActive, techDifficultiesActive, lowerThirdVisible, activeSegment, allSegments])
  
  // Show visual feedback for keyboard shortcuts
  const showShortcutFeedback = (key: string) => {
    setShortcutFeedback(key)
    setTimeout(() => setShortcutFeedback(null), 1000)
  }
  
  // Handle next segment navigation
  const handleNextSegment = async () => {
    if (!activeSegment) return
    
    const currentIndex = allSegments.findIndex(s => s.id === activeSegment.id)
    if (currentIndex < allSegments.length - 1) {
      const nextSegment = allSegments[currentIndex + 1]
      await handleSegmentClick(nextSegment)
    }
  }
  
  // Handle show next question popup
  const handleShowNextQuestion = async () => {
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
      .order('segment_order', { ascending: true })
    
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
      .order('graphic_type', { ascending: true })
    
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
    
    // If a new question started playing, trigger audio (Microsoft Edge TTS)
    if (newQuestion && newQuestion.id !== playingQuestion?.id) {
      if (newQuestion.tts_audio_url && audioRef.current) {
        // Load audio source
        audioRef.current.src = newQuestion.tts_audio_url;
        audioRef.current.volume = 1.0; // Full volume for broadcast
        
        // Only auto-play if permission has been granted
        if (audioPermissionGranted) {
          audioRef.current.play().catch(error => {
            console.error('BetaBot audio playback error:', error);
          });
          setIsAudioPlaying(true);
        } else {
          // Show prompt if permission not granted
          setShowAudioPrompt(true);
        }
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
    // Load layout preset setting
    const { data: layoutData } = await supabase
      .from('broadcast_settings')
      .select('*')
      .eq('setting_type', 'layout_preset')
      .eq('is_active', true)
      .maybeSingle()
    
    if (layoutData) {
      const layoutSetting = layoutData as BroadcastSettings
      if (layoutSetting.setting_value.mode) {
        setLayoutPreset(layoutSetting.setting_value.mode as 'default' | 'theater' | 'interview' | 'camera-focus')
      }
    }
    
    // Load color theme setting
    const { data: themeData } = await supabase
      .from('broadcast_settings')
      .select('*')
      .eq('setting_type', 'color_theme')
      .eq('is_active', true)
      .maybeSingle()
    
    if (themeData) {
      const themeSetting = themeData as BroadcastSettings
      if (themeSetting.setting_value.theme) {
        setColorTheme(themeSetting.setting_value.theme)
      }
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
      const settings = data as BroadcastSettings
      await supabase
        .from('broadcast_settings')
        .update({ 
          setting_value: { 
            ...settings.setting_value,
            color_theme: theme 
          } 
        })
        .eq('id', data.id)
    } else {
      await supabase
        .from('broadcast_settings')
        .insert({ 
          setting_value: { 
            color_theme: theme 
          } 
        })
    }
  }
  
  // ENHANCEMENT 5: Handle Segment Click (ensures only ONE active)
  const handleSegmentClick = async (segment: ShowSegment) => {
    if (segment.is_active) return // Already active
    
    try {
      // First, deactivate ALL segments
      const { error: deactivateError } = await supabase
        .from('show_segments')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (deactivateError) {
        console.error('Error deactivating segments:', deactivateError)
        return
      }
      
      // Then activate ONLY the clicked segment
      const { error: activateError } = await supabase
        .from('show_segments')
        .update({ is_active: true })
        .eq('id', segment.id)
      
      if (activateError) {
        console.error('Error activating segment:', activateError)
      }
    } catch (error) {
      console.error('Segment click error:', error)
    }
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

  // NEW: Popup control handlers
  const handlePopupPlay = async (question: ShowQuestion) => {
    if (question.tts_audio_url && audioRef.current) {
      audioRef.current.src = question.tts_audio_url
      audioRef.current.play().catch(console.error)
    }
  }

  const handlePopupNext = () => {
    setPopupVisible(false)
    setPopupQuestion(null)
  }

  const handlePopupDismiss = () => {
    setPopupVisible(false)
    setPopupQuestion(null)
  }
  
  // Enable audio permission for OBS/Stream autoplay
  const enableAudio = async () => {
    try {
      // Play a silent audio to unlock audio playback in browser
      const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=')
      await silentAudio.play()
      
      // Store permission in localStorage
      localStorage.setItem('betabot_audio_enabled', 'true')
      setAudioPermissionGranted(true)
      setShowAudioPrompt(false)
      
      // Retroactive playback: If there's already a question loaded with audio, play it
      if (audioRef.current && audioRef.current.src && playingQuestion) {
        audioRef.current.volume = 1.0
        await audioRef.current.play().catch(error => {
          console.error('Error playing after permission grant:', error)
        })
        setIsAudioPlaying(true)
      } else if (audioRef.current && audioRef.current.src) {
        // Just unlock the audio element even if no question is playing
        audioRef.current.volume = 1.0
        await audioRef.current.play().catch(() => {})
      }
    } catch (error) {
      console.error('Error enabling audio:', error)
      // Even on error, grant permission for next attempts
      localStorage.setItem('betabot_audio_enabled', 'true')
      setAudioPermissionGranted(true)
      setShowAudioPrompt(false)
    }
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
      
      {/* ENHANCEMENT 4: Color Theme Switcher UI (bottom-right corner to avoid overlap) */}
      <div className="absolute bottom-8 right-8 z-50" ref={themeMenuRef}>
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="bg-slate-900/90 border border-accent-primary/50 px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-slate-800/90 transition-all shadow-lg"
            title="Change Color Theme (Esc to close)"
          >
            <Palette className="w-5 h-5 text-accent-primary" />
          </button>
          
          {showThemeMenu && (
            <div className="absolute bottom-12 right-0 bg-slate-900/95 border border-accent-primary/50 rounded-lg p-2 backdrop-blur-md min-w-[150px] shadow-xl">
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
      


      {/* ==== TOP SECTION: Dynamic Layout (50% height) ==== */}
      <div 
        className="relative z-10 p-6" 
        style={{ 
          height: '540px',
          position: 'relative'
        }}
      >
        {/* Layout rendering based on preset */}
        {layoutPreset === 'default' && (
          /* Default Layout: 50/50 balanced split */
          <div className="h-full grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden relative border-2 border-accent-primary/10 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm">
              <div className="corner-bracket corner-tl" />
              <div className="corner-bracket corner-tr" />
              <div className="corner-bracket corner-bl" />
              <div className="corner-bracket corner-br" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-primary/30 text-xl font-bold tracking-wider">CAMERA FEED</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden relative border-2 border-accent-primary/10 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm">
              <div className="corner-bracket corner-tl" />
              <div className="corner-bracket corner-tr" />
              <div className="corner-bracket corner-bl" />
              <div className="corner-bracket corner-br" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-primary/30 text-xl font-bold tracking-wider">REACTION FEED</p>
              </div>
            </div>
          </div>
        )}

        {layoutPreset === 'theater' && (
          /* Theater Layout: 70% reaction feed, 30% camera in corner */
          <div className="h-full relative">
            <div className="h-full rounded-2xl overflow-hidden relative border-2 border-accent-primary/10 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm">
              <div className="corner-bracket corner-tl" />
              <div className="corner-bracket corner-tr" />
              <div className="corner-bracket corner-bl" />
              <div className="corner-bracket corner-br" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-primary/30 text-2xl font-bold tracking-wider">REACTION FEED (MAIN)</p>
              </div>
            </div>
            {/* Camera in corner (30% size) */}
            <div className="absolute bottom-4 right-4 w-[30%] h-[35%] rounded-xl overflow-hidden border-2 border-accent-secondary/40 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-sm shadow-lg shadow-accent-secondary/20">
              <div className="corner-bracket corner-tl" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="corner-bracket corner-tr" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="corner-bracket corner-bl" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="corner-bracket corner-br" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-secondary/40 text-sm font-bold tracking-wider">CAMERA</p>
              </div>
            </div>
          </div>
        )}

        {layoutPreset === 'interview' && (
          /* Interview Layout: Perfect 50/50 split with clear divider */
          <div className="h-full grid grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden relative border-2 border-accent-primary/10 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm">
              <div className="corner-bracket corner-tl" />
              <div className="corner-bracket corner-tr" />
              <div className="corner-bracket corner-bl" />
              <div className="corner-bracket corner-br" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-primary/30 text-xl font-bold tracking-wider">HOST</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden relative border-2 border-accent-primary/10 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm">
              <div className="corner-bracket corner-tl" />
              <div className="corner-bracket corner-tr" />
              <div className="corner-bracket corner-bl" />
              <div className="corner-bracket corner-br" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-primary/30 text-xl font-bold tracking-wider">GUEST</p>
              </div>
            </div>
          </div>
        )}

        {layoutPreset === 'camera-focus' && (
          /* Camera Focus Layout: 65% camera, 35% reaction in corner */
          <div className="h-full relative">
            <div className="h-full rounded-2xl overflow-hidden relative border-2 border-accent-primary/10 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm">
              <div className="corner-bracket corner-tl" />
              <div className="corner-bracket corner-tr" />
              <div className="corner-bracket corner-bl" />
              <div className="corner-bracket corner-br" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-primary/30 text-2xl font-bold tracking-wider">CAMERA FEED (MAIN)</p>
              </div>
            </div>
            {/* Reaction in corner (35% size) */}
            <div className="absolute bottom-4 right-4 w-[35%] h-[40%] rounded-xl overflow-hidden border-2 border-accent-secondary/40 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-sm shadow-lg shadow-accent-secondary/20">
              <div className="corner-bracket corner-tl" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="corner-bracket corner-tr" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="corner-bracket corner-bl" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="corner-bracket corner-br" style={{ borderColor: 'var(--accent-secondary)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-accent-secondary/40 text-sm font-bold tracking-wider">REACTION</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==== BOTTOM SECTION: MODULAR INFO DASHBOARD (50% height) ==== */}
      <div className="relative z-10 grid grid-cols-12 gap-4 px-6 pb-6" style={{ height: '540px' }}>
        
        {/* CENTER: Active Question Display + Voice Visualizer + BetaBot Controls */}
        <div className="col-span-9 flex flex-col gap-4">
          
          {/* Question Display */}
          <div className={`flex-1 bg-gradient-to-br from-slate-900/80 to-blue-950/80 rounded-2xl border-2 border-blue-500/30 backdrop-blur-sm p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative overflow-hidden ${questionTransition === 'enter' ? 'question-enter' : ''} ${questionTransition === 'exit' ? 'question-exit' : ''}`}>
            {/* Animated Border Glow */}
            <div className="absolute inset-0 border-2 border-accent-primary/0 rounded-2xl animate-border-glow" />
            
            {playingQuestion ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-accent-primary to-blue-500 rounded-full p-2">
                    <Zap className="w-6 h-6 text-white" />
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
                <Activity className="w-4 h-4 text-indigo-400" />
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

      {/* Logo - positioned with higher z-index to avoid being covered */}
      {logo && (
        <div className="absolute top-20 left-8 z-40">
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
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 overflow-hidden border-t-2 border-red-400 shadow-[0_-5px_20px_rgba(239,68,68,0.3)]">
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
      
      {/* Audio Permission Prompt for OBS/Stream */}
      {showAudioPrompt && !audioPermissionGranted && (
        <div className="fixed bottom-8 right-8 z-[100] animate-fade-in">
          <div className="bg-gradient-to-r from-cyan-900/95 to-blue-900/95 backdrop-blur-md border-2 border-cyan-400 rounded-xl px-6 py-4 shadow-[0_0_30px_rgba(6,182,212,0.6)] max-w-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Volume2 className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">Enable Audio for Broadcast</h3>
                <p className="text-cyan-200 text-sm mb-3">Click to allow BetaBot voice playback in OBS/Stream</p>
                <div className="flex gap-2">
                  <button
                    onClick={enableAudio}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                  >
                    Enable Audio
                  </button>
                  <button
                    onClick={() => setShowAudioPrompt(false)}
                    className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 font-semibold rounded-lg transition-all"
                  >
                    Later
                  </button>
                </div>
                <p className="text-xs text-cyan-300 mt-2 opacity-70">Required once per session for autoplay</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcut Visual Feedback */}
      {shortcutFeedback && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
          <div className="shortcut-feedback-animation">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6 rounded-2xl border-4 border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.8)]">
              <p className="text-5xl font-bold text-white text-center tracking-wider">{shortcutFeedback}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Emergency Black Screen Overlay (B key) */}
      {blackScreenActive && (
        <div className="fixed inset-0 z-[500] bg-black flex items-end justify-end p-8">
          <div className="bg-gray-900/80 border border-gray-700 px-4 py-2 rounded-lg backdrop-blur-sm">
            <p className="text-white text-sm font-bold tracking-wider flex items-center gap-2">
              <span className="w-3 h-3 bg-white rounded-sm animate-pulse"></span>
              BLACK SCREEN ACTIVE
            </p>
            <p className="text-gray-400 text-xs mt-1">Press 'B' to exit</p>
          </div>
        </div>
      )}
      
      {/* Emergency Technical Difficulties Overlay (T key) */}
      {techDifficultiesActive && (
        <div className="fixed inset-0 z-[500] bg-gradient-to-br from-orange-950/95 to-red-950/95 flex items-center justify-center">
          <div className="text-center max-w-2xl px-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-6xl font-bold text-white mb-4 tracking-wider">TECHNICAL DIFFICULTIES</h1>
            <p className="text-3xl text-yellow-300 mb-6">PLEASE STAND BY</p>
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
            </div>
            <p className="text-gray-400 text-sm mt-8">Press 'T' to exit</p>
          </div>
        </div>
      )}

      {/* NEW: Segment Title Display */}
      <SegmentTitleDisplay 
        segment={activeSegment}
        animated={true}
      />

      {/* NEW: BetaBot Popup */}
      <BetaBotPopup
        question={popupQuestion}
        visible={popupVisible}
        duration={popupDuration}
        onPlay={handlePopupPlay}
        onNext={handlePopupNext}
        onDismiss={handlePopupDismiss}
      />

      {/* NEW: Lower Third Overlay - keyboard controlled with 'L' key */}
      <LowerThirdOverlay forceVisible={lowerThirdVisible} />

      {/* NEW: Episode Info Display */}
      <EpisodeInfoDisplay />

      {/* NEW: LIVE Indicator */}
      <LiveIndicator />

      {/* NEW: Next Up Preview - repositioned to top-right to avoid timeline overlap */}
      <div className={nextUpHighlight ? 'next-up-highlight' : ''}>
        <NextUpPreview position="top-right" />
      </div>

      {/* NEW: Total Show Timer */}
      <TotalShowTimer position="top-center" />

      {/* NEW: Help Overlay */}
      <HelpOverlay />

      {/* NEW: Emergency Controls */}
      <EmergencyControls />

      {/* NEW: Show Timeline */}
      <ShowTimeline position="bottom" />

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
        
        /* Keyboard Shortcut Visual Feedback Animation */
        @keyframes shortcut-feedback {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }
        
        .shortcut-feedback-animation {
          animation: shortcut-feedback 1s ease-out;
        }
        
        /* Next Up Highlight Animation */
        @keyframes next-up-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(6,182,212,0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 40px rgba(6,182,212,0.8);
          }
        }
        
        .next-up-highlight {
          animation: next-up-pulse 2s ease-in-out 3;
        }
      `}</style>
    </div>
  )
}
