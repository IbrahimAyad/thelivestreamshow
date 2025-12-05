import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MessageSquare, User } from 'lucide-react'

interface ShowQuestion {
    id: string
    question_text: string
    author_name?: string
    author_avatar?: string
    is_played: boolean
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

    return (
        <div className={`ultra-chat-container ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="ultra-chat-card">
                <div className="ultra-chat-header">
                    <div className="avatar-container">
                        {activeQuestion?.author_avatar ? (
                            <img src={activeQuestion.author_avatar} alt="User" className="avatar-img" />
                        ) : (
                            <div className="avatar-placeholder">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="author-info">
                        <span className="author-name">{activeQuestion?.author_name || 'Viewer Question'}</span>
                        <span className="badge">ULTRA CHAT</span>
                    </div>
                    <MessageSquare className="w-6 h-6 text-white opacity-80" />
                </div>

                <div className="ultra-chat-body">
                    <p className="question-text">{activeQuestion?.question_text}</p>
                </div>
            </div>

            <style>{`
        .ultra-chat-container {
          position: absolute;
          bottom: 180px; /* Positioned above the lower third area */
          right: 60px;
          width: 500px;
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
          border: 2px solid #ec4899; /* Pink border for "Ultra" feel */
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(236, 72, 153, 0.3),
            inset 0 0 20px rgba(236, 72, 153, 0.1);
        }

        .ultra-chat-header {
          background: linear-gradient(90deg, #be185d, #db2777);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
          font-size: 20px;
          font-weight: 600;
          line-height: 1.4;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
      `}</style>
        </div>
    )
}
