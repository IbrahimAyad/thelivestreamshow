import React, { useEffect, useState } from 'react'
import { ShowSegment } from '../lib/supabase'

interface SegmentTitleDisplayProps {
  segment: ShowSegment | null
  animated?: boolean
}

export const SegmentTitleDisplay: React.FC<SegmentTitleDisplayProps> = ({ 
  segment, 
  animated = true 
}) => {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [segmentStartTime, setSegmentStartTime] = useState<Date | null>(null)

  // Reset timer when segment changes
  useEffect(() => {
    if (segment?.is_active) {
      setSegmentStartTime(new Date())
      setElapsedTime(0)
    }
  }, [segment?.id, segment?.is_active])

  // Update timer every second
  useEffect(() => {
    if (!segment?.is_active || !segmentStartTime) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - segmentStartTime.getTime()) / 1000)
      setElapsedTime(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [segment?.is_active, segmentStartTime])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSegmentIcon = () => {
    const name = segment?.segment_name?.toLowerCase() || ''
    if (name.includes('intro')) return '🎬'
    if (name.includes('part') || name.includes('segment')) return '📺'
    if (name.includes('outro') || name.includes('end')) return '🎭'
    if (name.includes('break')) return '☕'
    if (name.includes('qa') || name.includes('question')) return '❓'
    return '⭐'
  }

  if (!segment) {
    return (
      <div className="segment-title-display no-segment">
        <div className="segment-icon">⏸️</div>
        <div className="segment-name">No Active Segment</div>
        <div className="segment-subtitle">Select a segment to begin</div>
      </div>
    )
  }

  return (
    <div className={`segment-title-display ${animated ? 'animated' : ''} ${segment.is_active ? 'active' : ''}`}>
      <div className="segment-icon">{getSegmentIcon()}</div>
      <div className="segment-name">★ {segment.segment_name.toUpperCase()} ★</div>
      <div className="segment-subtitle">Now Playing: {segment.segment_name}</div>
      {segment.is_active && (
        <div className="segment-timer">{formatTime(elapsedTime)}</div>
      )}
      
      <style>{`
        .segment-title-display {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 80, 0.95));
          border: 2px solid var(--primary-glow, #00d9ff);
          border-radius: 20px;
          padding: 30px 60px;
          text-align: center;
          box-shadow: 0 0 40px var(--primary-glow, #00d9ff), 0 10px 30px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          z-index: 95;
          min-width: 500px;
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .segment-title-display.animated {
          animation: segmentEntrance 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .segment-title-display.active {
          animation: segmentPulse 3s ease-in-out infinite;
        }

        .segment-title-display.no-segment {
          opacity: 0.6;
          border-color: #666;
          box-shadow: 0 0 20px rgba(100, 100, 100, 0.3);
        }

        .segment-icon {
          font-size: 48px;
          margin-bottom: 15px;
          filter: drop-shadow(0 0 10px var(--primary-glow, #00d9ff));
        }

        .segment-name {
          font-family: 'Orbitron', 'Rajdhani', sans-serif;
          font-size: 56px;
          font-weight: 900;
          background: linear-gradient(135deg, #ffffff, var(--primary-glow, #00d9ff));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 4px;
          margin-bottom: 10px;
          text-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
          line-height: 1.2;
        }

        .segment-subtitle {
          font-family: 'Rajdhani', sans-serif;
          font-size: 20px;
          color: #aaddff;
          margin-bottom: 15px;
          letter-spacing: 1px;
        }

        .segment-timer {
          font-family: 'Orbitron', monospace;
          font-size: 32px;
          color: var(--primary-glow, #00d9ff);
          font-weight: 700;
          margin-top: 10px;
          text-shadow: 0 0 15px var(--primary-glow, #00d9ff);
          letter-spacing: 3px;
        }

        @keyframes segmentEntrance {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(100px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes segmentPulse {
          0%, 100% {
            box-shadow: 0 0 30px var(--primary-glow, #00d9ff), 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 50px var(--primary-glow, #00d9ff), 0 10px 40px rgba(0, 0, 0, 0.6);
          }
        }
      `}</style>
    </div>
  )
}
