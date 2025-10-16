import React, { useEffect, useState } from 'react'
import { ShowQuestion } from '../lib/supabase'

interface BetaBotPopupProps {
  question: ShowQuestion | null
  visible: boolean
  duration?: number // seconds
  onPlay?: (question: ShowQuestion) => void
  onNext?: () => void
  onDismiss?: () => void
}

export const BetaBotPopup: React.FC<BetaBotPopupProps> = ({
  question,
  visible,
  duration = 15,
  onPlay,
  onNext,
  onDismiss
}) => {
  const [isExiting, setIsExiting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(duration)

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible || !question) return

    setTimeRemaining(duration)
    setIsExiting(false)

    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdown)
  }, [visible, question, duration])

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

  const handlePlayClick = () => {
    if (question) {
      onPlay?.(question)
    }
  }

  const handleNextClick = () => {
    setIsExiting(true)
    setTimeout(() => {
      onNext?.()
    }, 300)
  }

  if (!visible || !question) return null

  return (
    <div className={`betabot-popup ${isExiting ? 'exiting' : 'entering'}`}>
      <div className="popup-header">
        <span className="popup-icon">🤖</span>
        <span className="popup-title">BETABOT ASKS:</span>
        <span className="popup-timer">{timeRemaining}s</span>
      </div>
      
      <div className="popup-divider"></div>
      
      <div className="popup-content">
        <div className="popup-topic">{question.topic}</div>
        <div className="popup-question">{question.question_text}</div>
      </div>
      
      <div className="popup-controls">
        <button className="control-btn play-btn" onClick={handlePlayClick}>
          <span className="btn-icon">▶</span>
          <span className="btn-label">Play</span>
        </button>
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
        .betabot-popup {
          position: fixed;
          right: 40px;
          top: 50%;
          transform: translateY(-50%);
          width: 420px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 26, 26, 0.95));
          border: 2px solid #FBBF24;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.4), 0 10px 40px rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(15px);
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .betabot-popup.entering {
          animation: slideInFromRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .betabot-popup.exiting {
          animation: fadeOutSlideDown 0.3s ease-out forwards;
        }

        .popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .popup-icon {
          font-size: 28px;
          filter: drop-shadow(0 0 8px #F59E0B);
        }

        .popup-title {
          font-size: 16px;
          font-weight: 700;
          color: #FBBF24;
          letter-spacing: 2px;
          flex: 1;
          text-transform: uppercase;
        }

        .popup-timer {
          font-size: 14px;
          font-weight: 600;
          color: #D1D5DB;
          background: rgba(251, 191, 36, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #FBBF24;
        }

        .popup-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #FBBF24, transparent);
          margin-bottom: 16px;
        }

        .popup-topic {
          font-size: 12px;
          color: #F59E0B;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .popup-question {
          font-size: 20px;
          color: #ffffff;
          line-height: 1.5;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .popup-controls {
          display: flex;
          gap: 10px;
          justify-content: space-between;
        }

        .control-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          background: rgba(42, 42, 42, 0.8);
          border: 1px solid #6B7280;
          border-radius: 8px;
          color: #D1D5DB;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .control-btn:hover {
          background: rgba(42, 42, 42, 1);
          transform: translateY(-2px);
        }

        .control-btn:active {
          transform: translateY(0);
        }

        .btn-icon {
          font-size: 20px;
        }

        .btn-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .play-btn:hover {
          border-color: #FBBF24;
          color: #FBBF24;
          box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
        }

        .next-btn:hover {
          border-color: #F59E0B;
          color: #F59E0B;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
        }

        .dismiss-btn:hover {
          border-color: #EF4444;
          color: #EF4444;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
        }

        @keyframes slideInFromRight {
          from {
            transform: translateY(-50%) translateX(500px);
            opacity: 0;
          }
          to {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOutSlideDown {
          from {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
          to {
            transform: translateY(-50%) translateX(0) translateY(20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
