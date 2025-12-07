import React, { useEffect, useState, useRef } from 'react'
import { ShowQuestion } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { useF5TTS } from '../hooks/useF5TTS'
import { playSoundEffect } from '../utils/audioGenerator'

interface BetaBotPopupEnhancedProps {
  question: ShowQuestion | null
  visible: boolean
  duration?: number
  autoReadTTS?: boolean
  notificationSoundEnabled?: boolean
  onDismiss?: () => void
  onNext?: () => void
}

// Character configuration with visual themes
const CHARACTERS = {
  Alpha: {
    name: 'Alpha',
    color: '#EF4444', // red
    badge: '⚠️',
    bgGradient: 'from-red-900/20 to-red-950/10',
    borderColor: 'border-red-500/50',
    glowColor: 'shadow-red-500/40'
  },
  AZ: {
    name: 'AZ',
    color: '#F59E0B', // amber
    badge: '🏈',
    bgGradient: 'from-amber-900/20 to-amber-950/10',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/40'
  },
  Sylvester: {
    name: 'Sylvester',
    color: '#8B5CF6', // violet
    badge: '⚖️',
    bgGradient: 'from-violet-900/20 to-violet-950/10',
    borderColor: 'border-violet-500/50',
    glowColor: 'shadow-violet-500/40'
  },
  Rattlesnake: {
    name: 'Rattlesnake',
    color: '#10B981', // emerald
    badge: '🐍',
    bgGradient: 'from-emerald-900/20 to-emerald-950/10',
    borderColor: 'border-emerald-500/50',
    glowColor: 'shadow-emerald-500/40'
  },
  'Dr. MindEye': {
    name: 'Dr. MindEye',
    color: '#06B6D4', // cyan
    badge: '🧠',
    bgGradient: 'from-cyan-900/20 to-cyan-950/10',
    borderColor: 'border-cyan-500/50',
    glowColor: 'shadow-cyan-500/40'
  },
  'Vic Nasty': {
    name: 'Vic Nasty',
    color: '#DC2626', // red-dark
    badge: '😈',
    bgGradient: 'from-red-950/30 to-black/20',
    borderColor: 'border-red-600/50',
    glowColor: 'shadow-red-600/60'
  },
  Gio: {
    name: 'Gio',
    color: '#FBBF24', // yellow
    badge: '🏠',
    bgGradient: 'from-yellow-900/20 to-yellow-950/10',
    borderColor: 'border-yellow-500/50',
    glowColor: 'shadow-yellow-500/40'
  },
  'Emgo Billups': {
    name: 'Emgo Billups',
    color: '#EC4899', // pink
    badge: '📢',
    bgGradient: 'from-pink-900/20 to-pink-950/10',
    borderColor: 'border-pink-500/50',
    glowColor: 'shadow-pink-500/40'
  },
  'Ole Duit': {
    name: 'Ole Duit',
    color: '#14B8A6', // teal
    badge: '💰',
    bgGradient: 'from-teal-900/20 to-teal-950/10',
    borderColor: 'border-teal-500/50',
    glowColor: 'shadow-teal-500/40'
  },
  Abe: {
    name: 'Abe',
    color: '#6366F1', // indigo
    badge: '🎮',
    bgGradient: 'from-indigo-900/20 to-indigo-950/10',
    borderColor: 'border-indigo-500/50',
    glowColor: 'shadow-indigo-500/40'
  },
  Carlos: {
    name: 'Carlos',
    color: '#3B82F6', // blue
    badge: '💬',
    bgGradient: 'from-blue-900/20 to-blue-950/10',
    borderColor: 'border-blue-500/50',
    glowColor: 'shadow-blue-500/40'
  },
  BetaBot: {
    name: 'BetaBot',
    color: '#FBBF24', // default yellow
    badge: '🤖',
    bgGradient: 'from-yellow-900/20 to-yellow-950/10',
    borderColor: 'border-yellow-500/50',
    glowColor: 'shadow-yellow-500/40'
  }
}

export const BetaBotPopupEnhanced: React.FC<BetaBotPopupEnhancedProps> = ({
  question,
  visible,
  duration = 15,
  autoReadTTS = false,
  notificationSoundEnabled = true,
  onDismiss,
  onNext
}) => {
  const [isExiting, setIsExiting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)
  const [hasPlayedNotification, setHasPlayedNotification] = useState(false)
  const f5TTS = useF5TTS()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Detect character from topic field
  const characterKey = Object.keys(CHARACTERS).find(char =>
    question?.topic.includes(char)
  ) as keyof typeof CHARACTERS || 'BetaBot'

  const character = CHARACTERS[characterKey]

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible || !question) {
      console.log('🚫 Popup not showing:', { visible, hasQuestion: !!question })
      return
    }

    console.log('✅ Popup showing question:', question)
    console.log('🔊 Audio URL:', question.tts_audio_url)
    console.log('⚙️ Settings:', { notificationSoundEnabled, autoReadTTS })

    setTimeRemaining(duration)
    setIsExiting(false)
    setHasPlayedNotification(false)

    // Play notification sound + auto-read TTS if enabled
    if (notificationSoundEnabled || autoReadTTS) {
      handleInitialSequence()
    }

    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = countdown

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [visible, question, duration])

  const playNotificationSound = async () => {
    try {
      console.log('🔔 Playing TTS Notification sound...')
      // Play the notification sound using audioGenerator
      await playSoundEffect('TTS Notification')
      console.log('✅ TTS Notification sound played')

      // Also update database flag for other systems that might be listening
      await supabase
        .from('soundboard_effects')
        .update({ is_playing: true })
        .eq('effect_name', 'TTS Notification')

      // Reset after 500ms
      setTimeout(async () => {
        await supabase
          .from('soundboard_effects')
          .update({ is_playing: false })
          .eq('effect_name', 'TTS Notification')
      }, 500)

      setHasPlayedNotification(true)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  const handleInitialSequence = async () => {
    // Step 1: Play notification sound
    if (notificationSoundEnabled) {
      await playNotificationSound()
      // Wait for sound to finish (500ms)
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    // Step 2: Auto-play TTS if enabled
    if (autoReadTTS && question) {
      handlePlayTTS()
    }
  }

  const handlePlayTTS = async () => {
    if (!question || !question.tts_audio_url) {
      console.warn('⚠️ TTS not available - no audio URL')
      return
    }

    try {
      console.log('🗣️ Playing TTS audio from:', question.tts_audio_url)
      setIsTTSPlaying(true)

      // Play the pre-generated ElevenLabs audio
      const audio = new Audio(question.tts_audio_url)
      audio.volume = 1.0 // Full volume for broadcast

      audio.onended = () => {
        console.log('✅ TTS audio finished')
        setIsTTSPlaying(false)
      }

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error)
        setIsTTSPlaying(false)
      }

      await audio.play()
      console.log('▶️ TTS audio started')
    } catch (error) {
      console.error('❌ TTS playback failed:', error)
      setIsTTSPlaying(false)
    }
  }

  const handleAutoDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss?.()
    }, 300)
  }

  const handleDismissClick = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss?.()
    }, 300)
  }

  const handleNextClick = () => {
    setIsExiting(true)
    setTimeout(() => {
      onNext?.()
    }, 300)
  }

  if (!visible || !question) return null

  // Detect if this is a news story (check for "real_estate", "business", etc. topics or BREAKING NEWS prefix)
  const isNews = question.topic && ['real_estate', 'business', 'tech', 'sports', 'entertainment', 'breaking', 'politics', 'general'].includes(question.topic.toLowerCase())
  const isBreakingNews = question.question_text?.includes('[BREAKING NEWS]') || isNews

  console.log('🔍 News detection:', {
    topic: question.topic,
    isNews,
    hasBreakingNewsPrefix: question.question_text?.includes('[BREAKING NEWS]'),
    isBreakingNews
  })

  return (
    <div className={`betabot-popup-enhanced ${isBreakingNews ? 'news-mode' : 'chat-mode'} ${isExiting ? 'exiting' : 'entering'}`}>
      {/* Character Header */}
      <div className="popup-header">
        <div className="character-badge">
          <span className="badge-icon">{isBreakingNews ? '🚨' : character.badge}</span>
        </div>
        <div className="header-content">
          <span className="character-name" style={{ color: character.color }}>
            {isBreakingNews ? 'BREAKING NEWS' : character.name}
          </span>
          <span className="popup-subtitle">{isBreakingNews ? 'LIVE REPORT' : 'says...'}</span>
        </div>
        {isBreakingNews && (
          <span className="live-indicator">
            <span className="live-dot"></span>
            LIVE
          </span>
        )}
        {!isBreakingNews && <span className="popup-timer">{timeRemaining}s</span>}
      </div>

      <div className="popup-divider" style={{
        background: `linear-gradient(90deg, transparent, ${character.color}, transparent)`
      }}></div>

      {/* Message Content */}
      <div className="popup-content">
        <div className={`popup-message ${isTTSPlaying ? 'tts-playing' : ''}`}>
          {question.question_text?.replace('[BREAKING NEWS]', '').trim()}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="popup-controls">
        {!autoReadTTS && !isTTSPlaying && (
          <button
            className="control-btn play-btn"
            onClick={handlePlayTTS}
            disabled={!f5TTS.isConnected}
          >
            <span className="btn-icon">▶</span>
            <span className="btn-label">Play</span>
          </button>
        )}
        {isTTSPlaying && (
          <button
            className="control-btn playing-btn"
            disabled
          >
            <span className="btn-icon animate-pulse">🔊</span>
            <span className="btn-label">Playing...</span>
          </button>
        )}
        <button className="control-btn next-btn" onClick={handleNextClick}>
          <span className="btn-icon">⏭</span>
          <span className="btn-label">Next</span>
        </button>
        <button className="control-btn dismiss-btn" onClick={handleDismissClick}>
          <span className="btn-icon">✖</span>
          <span className="btn-label">Dismiss</span>
        </button>
      </div>

      <style>{`
        /* CHAT MODE - Slide in from right, centered vertically */
        .betabot-popup-enhanced.chat-mode {
          position: fixed;
          right: 40px;
          top: 50%;
          transform: translateY(-50%);
          width: 480px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(20, 20, 20, 0.98));
          border: 3px solid ${character.color};
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 0 40px ${character.color}40, 0 15px 50px rgba(0, 0, 0, 0.8);
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
        }

        /* NEWS MODE - Slide up from bottom, centered horizontally */
        .betabot-popup-enhanced.news-mode {
          position: fixed;
          left: 50%;
          bottom: 120px;
          transform: translateX(-50%);
          width: 900px;
          max-width: 90vw;
          background: linear-gradient(135deg, rgba(139, 0, 0, 0.98), rgba(0, 0, 0, 0.98));
          border: 4px solid #EF4444;
          border-radius: 16px;
          padding: 28px;
          box-shadow:
            0 0 60px rgba(239, 68, 68, 0.6),
            0 20px 60px rgba(0, 0, 0, 0.9),
            inset 0 0 40px rgba(239, 68, 68, 0.1);
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
        }

        /* CHAT ANIMATIONS */
        .betabot-popup-enhanced.chat-mode.entering {
          animation: slideInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .betabot-popup-enhanced.chat-mode.exiting {
          animation: fadeOutSlideRight 0.3s ease-out forwards;
        }

        /* NEWS ANIMATIONS */
        .betabot-popup-enhanced.news-mode.entering {
          animation: slideUpFromBottom 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .betabot-popup-enhanced.news-mode.exiting {
          animation: slideDownToBottom 0.4s ease-in forwards;
        }

        .popup-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .character-badge {
          width: 56px;
          height: 56px;
          background: ${character.color}20;
          border: 2px solid ${character.color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: badgePulse 2s ease-in-out infinite;
        }

        .badge-icon {
          font-size: 32px;
          filter: drop-shadow(0 0 10px ${character.color});
        }

        .header-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .character-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 0 0 20px ${character.color}80;
        }

        .popup-subtitle {
          font-size: 12px;
          color: #9CA3AF;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .popup-timer {
          font-size: 16px;
          font-weight: 700;
          color: #FFFFFF;
          background: ${character.color}30;
          padding: 8px 16px;
          border-radius: 24px;
          border: 2px solid ${character.color};
          min-width: 60px;
          text-align: center;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 900;
          color: #FFFFFF;
          background: rgba(220, 38, 38, 0.3);
          padding: 8px 18px;
          border-radius: 24px;
          border: 2px solid #EF4444;
          letter-spacing: 2px;
        }

        .live-dot {
          width: 12px;
          height: 12px;
          background: #EF4444;
          border-radius: 50%;
          animation: livePulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 10px #EF4444;
        }

        @keyframes livePulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.8);
          }
        }

        .popup-divider {
          height: 3px;
          margin-bottom: 20px;
          border-radius: 2px;
        }

        .popup-message {
          font-size: 24px;
          color: #FFFFFF;
          line-height: 1.6;
          margin-bottom: 24px;
          font-weight: 600;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border-left: 4px solid ${character.color};
        }

        /* News mode: larger, bolder text */
        .news-mode .popup-message {
          font-size: 32px;
          font-weight: 800;
          line-height: 1.4;
          text-align: center;
          padding: 24px;
          border-left: none;
          border: 2px solid rgba(239, 68, 68, 0.3);
          background: rgba(139, 0, 0, 0.2);
        }

        .popup-message.tts-playing {
          animation: textGlow 1.5s ease-in-out infinite;
        }

        .popup-controls {
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }

        .control-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 12px;
          background: rgba(30, 30, 30, 0.9);
          border: 2px solid #4B5563;
          border-radius: 12px;
          color: #D1D5DB;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          font-weight: 600;
        }

        .control-btn:hover:not(:disabled) {
          background: rgba(40, 40, 40, 1);
          transform: translateY(-3px) scale(1.02);
        }

        .control-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .control-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 24px;
        }

        .btn-label {
          font-size: 13px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .play-btn:hover:not(:disabled) {
          border-color: #10B981;
          color: #10B981;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }

        .playing-btn {
          border-color: #FBBF24;
          color: #FBBF24;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }

        .next-btn:hover:not(:disabled) {
          border-color: #3B82F6;
          color: #3B82F6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .dismiss-btn:hover:not(:disabled) {
          border-color: #EF4444;
          color: #EF4444;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }

        @keyframes slideInBounce {
          0% {
            transform: translateY(-50%) translateX(600px);
            opacity: 0;
          }
          70% {
            transform: translateY(-50%) translateX(-20px);
          }
          100% {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOutSlideRight {
          from {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
          to {
            transform: translateY(-50%) translateX(100px);
            opacity: 0;
          }
        }

        /* NEWS ANIMATIONS */
        @keyframes slideUpFromBottom {
          0% {
            transform: translateX(-50%) translateY(200px);
            opacity: 0;
          }
          60% {
            transform: translateX(-50%) translateY(-10px);
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDownToBottom {
          from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          to {
            transform: translateX(-50%) translateY(150px);
            opacity: 0;
          }
        }

        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 ${character.color}60;
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px 8px ${character.color}00;
          }
        }

        @keyframes textGlow {
          0%, 100% {
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          }
          50% {
            text-shadow: 0 0 20px ${character.color}80, 0 2px 8px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  )
}
