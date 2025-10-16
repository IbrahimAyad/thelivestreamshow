import React, { useEffect, useState } from 'react'
import { supabase, ShowMetadata } from '../lib/supabase'

interface TotalShowTimerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center'
}

export const TotalShowTimer: React.FC<TotalShowTimerProps> = ({ 
  position = 'top-right' 
}) => {
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [showStartTime, setShowStartTime] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    // Fetch show metadata
    const fetchShowMetadata = async () => {
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

    fetchShowMetadata()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('show-metadata-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'show_metadata'
        },
        (payload) => {
          const newData = payload.new as ShowMetadata
          setIsLive(newData.is_live)
          if (newData.show_start_time) {
            setShowStartTime(new Date(newData.show_start_time))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Update timer every second
  useEffect(() => {
    if (!showStartTime || !isLive) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - showStartTime.getTime()) / 1000)
      setTotalElapsed(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [showStartTime, isLive])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 950
    }
    
    switch (position) {
      case 'top-left':
        return { ...base, top: '20px', left: '20px' }
      case 'top-right':
        return { ...base, top: '20px', right: '20px' }
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' }
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' }
      case 'top-center':
        return { ...base, top: '20px', left: '50%', transform: 'translateX(-50%)' }
      default:
        return { ...base, top: '20px', right: '20px' }
    }
  }

  if (!isLive || !showStartTime) {
    return null // Don't show if not live or no start time
  }

  return (
    <div className="total-show-timer" style={getPositionStyles()}>
      <div className="timer-content">
        <div className="timer-label">TOTAL</div>
        <div className="timer-display">{formatTime(totalElapsed)}</div>
      </div>

      <style>{`
        .total-show-timer {
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.9), rgba(0, 40, 80, 0.9));
          border: 2px solid var(--primary-glow, #00d9ff);
          border-radius: 12px;
          padding: 15px 25px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 40px rgba(0, 217, 255, 0.5), 0 5px 20px rgba(0, 0, 0, 0.5);
          min-width: 200px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .total-show-timer:hover {
          transform: scale(1.05);
          box-shadow: 0 0 50px rgba(0, 217, 255, 0.7), 0 5px 25px rgba(0, 0, 0, 0.6);
        }

        .timer-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .timer-label {
          font-family: 'Orbitron', 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--primary-glow, #00d9ff);
          letter-spacing: 3px;
          text-shadow: 0 0 15px var(--primary-glow, #00d9ff);
        }

        .timer-display {
          font-family: 'Orbitron', monospace;
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 3px;
          text-shadow: 0 0 20px var(--primary-glow, #00d9ff), 0 0 10px rgba(255, 255, 255, 0.5);
          animation: timerGlow 2s ease-in-out infinite;
        }

        @keyframes timerGlow {
          0%, 100% {
            text-shadow: 0 0 20px var(--primary-glow, #00d9ff), 0 0 10px rgba(255, 255, 255, 0.5);
          }
          50% {
            text-shadow: 0 0 30px var(--primary-glow, #00d9ff), 0 0 15px rgba(255, 255, 255, 0.7);
          }
        }
      `}</style>
    </div>
  )
}
