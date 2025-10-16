import React, { useEffect, useState } from 'react'
import { supabase, ShowSegment } from '../lib/supabase'

interface NextUpPreviewProps {
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'
}

export const NextUpPreview: React.FC<NextUpPreviewProps> = ({ 
  position = 'bottom-right' 
}) => {
  const [nextSegment, setNextSegment] = useState<ShowSegment | null>(null)
  const [currentOrder, setCurrentOrder] = useState<number>(0)

  useEffect(() => {
    // Fetch initial data
    const fetchNextSegment = async () => {
      // Get current active segment
      const { data: currentSegment } = await supabase
        .from('show_segments')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (currentSegment) {
        setCurrentOrder(currentSegment.segment_order || 0)
        // Get next segment by order
        const { data: next } = await supabase
          .from('show_segments')
          .select('*')
          .gt('segment_order', currentSegment.segment_order || 0)
          .order('segment_order', { ascending: true })
          .limit(1)
          .maybeSingle()

        setNextSegment(next || null)
      } else {
        // No active segment, get first segment
        const { data: first } = await supabase
          .from('show_segments')
          .select('*')
          .order('segment_order', { ascending: true })
          .limit(1)
          .maybeSingle()

        setNextSegment(first || null)
      }
    }

    fetchNextSegment()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('next-up-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'show_segments'
        },
        () => {
          fetchNextSegment()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 950
    }
    
    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' }
      case 'top-right':
        return { ...base, top: '20px', right: '20px' }
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' }
      case 'top-left':
        return { ...base, top: '20px', left: '20px' }
      default:
        return { ...base, bottom: '20px', right: '20px' }
    }
  }

  if (!nextSegment) {
    return null // Don't show if no next segment
  }

  return (
    <div className="next-up-preview" style={getPositionStyles()}>
      <div className="next-up-content">
        <div className="next-up-label">NEXT UP</div>
        <div className="next-up-segment">
          {nextSegment.segment_name}
        </div>
        <div className="next-up-duration">
          ({formatDuration(nextSegment.timer_seconds)})
        </div>
      </div>

      <style>{`
        .next-up-preview {
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.85), rgba(0, 40, 80, 0.85));
          border: 2px solid var(--primary-glow, #00d9ff);
          border-radius: 12px;
          padding: 15px 20px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 30px rgba(0, 217, 255, 0.4), 0 5px 20px rgba(0, 0, 0, 0.5);
          min-width: 280px;
          animation: nextUpPulse 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .next-up-preview:hover {
          transform: scale(1.05);
          box-shadow: 0 0 40px rgba(0, 217, 255, 0.6), 0 5px 25px rgba(0, 0, 0, 0.6);
        }

        .next-up-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .next-up-label {
          font-family: 'Orbitron', 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--primary-glow, #00d9ff);
          letter-spacing: 3px;
          text-shadow: 0 0 10px var(--primary-glow, #00d9ff);
        }

        .next-up-segment {
          font-family: 'Rajdhani', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 1px;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        }

        .next-up-duration {
          font-family: 'Orbitron', monospace;
          font-size: 16px;
          color: #aaddff;
          font-weight: 500;
          letter-spacing: 1px;
        }

        @keyframes nextUpPulse {
          0%, 100% {
            border-color: var(--primary-glow, #00d9ff);
            box-shadow: 0 0 30px rgba(0, 217, 255, 0.4), 0 5px 20px rgba(0, 0, 0, 0.5);
          }
          50% {
            border-color: #00ffff;
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.5), 0 5px 25px rgba(0, 0, 0, 0.6);
          }
        }
      `}</style>
    </div>
  )
}
