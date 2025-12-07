import { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface VoiceSearchSession {
  session_active: boolean
  started_at: string | null
}

export function VoiceSearchOverlay() {
  const [isActive, setIsActive] = useState(false)
  const [hasLoggedError, setHasLoggedError] = useState(false)

  useEffect(() => {
    // Subscribe to voice search session status
    const channel = supabase
      .channel('voice-search-session')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_search_sessions'
        },
        (payload) => {
          console.log('🎤 [VoiceSearchOverlay] Session update:', payload)
          const session = payload.new as VoiceSearchSession
          const newActiveState = session?.session_active || false
          console.log('🎤 [VoiceSearchOverlay] Setting active state to:', newActiveState)
          setIsActive(newActiveState)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [VoiceSearchOverlay] Subscribed to voice_search_sessions')
          setHasLoggedError(false)
        } else if (status === 'CHANNEL_ERROR') {
          if (!hasLoggedError) {
            console.warn('⚠️ [VoiceSearchOverlay] Channel error - table may not exist yet. Run SQL setup from /tmp/create_voice_search.sql')
            setHasLoggedError(true)
          }
        }
      })

    // Fetch initial state
    const fetchInitialState = async () => {
      try {
        const { data, error } = await supabase
          .from('voice_search_sessions')
          .select('session_active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          if (!hasLoggedError) {
            console.warn('⚠️ [VoiceSearchOverlay] Table not found:', error.message)
            console.warn('📋 Run this SQL: /tmp/create_voice_search.sql')
            setHasLoggedError(true)
          }
          return
        }

        if (data) {
          console.log('🎤 [VoiceSearchOverlay] Initial state:', data.session_active)
          setIsActive(data.session_active || false)
        } else {
          console.log('🎤 [VoiceSearchOverlay] No session found, defaulting to inactive')
        }
      } catch (err) {
        if (!hasLoggedError) {
          console.error('❌ [VoiceSearchOverlay] Error fetching initial state:', err)
          setHasLoggedError(true)
        }
      }
    }

    fetchInitialState()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  if (!isActive) return null

  return (
    <div className="voice-search-indicator">
      <div className="indicator-content">
        <div className="mic-container">
          <Mic className="mic-icon" />
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
        <div className="indicator-text">
          <div className="text-label">VOICE</div>
          <div className="text-status">ACTIVE</div>
        </div>
      </div>

      <style>{`
        .voice-search-indicator {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 9999;
          pointer-events: none;
        }

        .indicator-content {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.95));
          backdrop-filter: blur(12px);
          padding: 16px 24px;
          border-radius: 50px;
          border: 2px solid rgba(167, 139, 250, 0.5);
          box-shadow:
            0 0 40px rgba(139, 92, 246, 0.6),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 0 20px rgba(167, 139, 250, 0.2);
        }

        .mic-container {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mic-icon {
          width: 20px;
          height: 20px;
          color: white;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: voice-search-pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .pulse-ring.delay-1 {
          animation-delay: 0.4s;
        }

        .pulse-ring.delay-2 {
          animation-delay: 0.8s;
        }

        .indicator-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .text-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .text-status {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1px;
          color: white;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        @keyframes voice-search-pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
