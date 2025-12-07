import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MessageSquare, User, Newspaper, Radio } from 'lucide-react'

interface ShowQuestion {
  id: string
  question_text: string
  topic: string
  is_played: boolean
  tts_generated: boolean
  tts_audio_url: string | null
}

export function UltraChatOverlay() {
  const [activeQuestion, setActiveQuestion] = useState<ShowQuestion | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check for currently playing question
    checkActiveQuestion()

    // Subscribe to changes
    const channel = supabase
      .channel('ultra_chat_overlay')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'show_questions'
      }, (payload) => {
        const newQuestion = payload.new as ShowQuestion
        if (newQuestion.is_played) {
          setActiveQuestion(newQuestion)
          setIsVisible(true)
        } else if (activeQuestion?.id === newQuestion.id && !newQuestion.is_played) {
          setIsVisible(false)
          setTimeout(() => setActiveQuestion(null), 500) // Wait for exit animation
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [activeQuestion])

  const checkActiveQuestion = async () => {
    const { data } = await supabase
      .from('show_questions')
      .select('*')
      .eq('is_played', true)
      .maybeSingle()

    if (data) {
      setActiveQuestion(data as ShowQuestion)
      setIsVisible(true)
    }
  }

  if (!activeQuestion && !isVisible) return null

  // Detect if this is a news story by checking for [BREAKING NEWS] prefix
  const isNews = activeQuestion?.question_text?.startsWith('[BREAKING NEWS]') || false

  // Clean up the question text (remove prefix if news)
  const displayText = isNews
    ? activeQuestion?.question_text?.replace('[BREAKING NEWS]', '').trim()
    : activeQuestion?.question_text

  return (
    <div className={`ultra-chat-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className={`ultra-chat-card ${isNews ? 'news-mode' : ''}`}>
        <div className={`ultra-chat-header ${isNews ? 'news-header' : ''}`}>
          <div className="avatar-container">
            {isNews ? (
              <div className="avatar-placeholder news-icon">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="avatar-placeholder">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div className="author-info">
            <span className="author-name">
              {isNews ? 'BREAKING NEWS' : 'VIEWER QUESTION'}
            </span>
            <span className="badge">
              {isNews ? 'LIVE REPORT' : 'ULTRA CHAT'}
            </span>
          </div>
          {isNews ? (
            <Radio className="w-6 h-6 text-white opacity-80 animate-pulse" />
          ) : (
            <MessageSquare className="w-6 h-6 text-white opacity-80" />
          )}
        </div>

        <div className="ultra-chat-body">
          <p className="question-text">{displayText}</p>
          <p className="topic-badge">{activeQuestion?.topic?.toUpperCase()}</p>
        </div>
      </div>

      <style>{`
        .ultra-chat-container {
          position: absolute;
          bottom: 180px;
          right: 60px;
          width: 600px; /* Wider for news */
          perspective: 1000px;
          z-index: 200;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .ultra-chat-container.hidden {
          opacity: 0;
          transform: translateX(100px) scale(0.9);
          pointer-events: none;
        }

        .ultra-chat-container.visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }

        .ultra-chat-card {
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid #ec4899;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(236, 72, 153, 0.3),
            inset 0 0 20px rgba(236, 72, 153, 0.1);
        }

        .ultra-chat-card.news-mode {
          border-color: #06b6d4; /* Cyan for news */
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(6, 182, 212, 0.3),
            inset 0 0 20px rgba(6, 182, 212, 0.1);
        }

        .ultra-chat-header {
          background: linear-gradient(90deg, #be185d, #db2777);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ultra-chat-header.news-header {
          background: linear-gradient(90deg, #0891b2, #06b6d4);
        }

        .avatar-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid white;
          overflow: hidden;
          background: #000;
          flex-shrink: 0;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #333;
        }

        .news-icon {
          background: #0e7490;
        }

        .author-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .author-name {
          color: white;
          font-weight: 800;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 700;
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          align-self: flex-start;
          margin-top: 2px;
        }

        .ultra-chat-body {
          padding: 20px;
        }

        .question-text {
          color: white;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.3;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          margin-bottom: 12px;
        }

        .topic-badge {
          display: inline-block;
          color: #fbbf24;
          font-size: 12px;
          font-weight: 800;
          background: rgba(251, 191, 36, 0.2);
          padding: 4px 12px;
          border-radius: 4px;
          border: 1px solid rgba(251, 191, 36, 0.4);
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  )
}
