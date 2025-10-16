import { useState, useEffect } from 'react'
import { supabase, ShowSegment, ShowMetadata } from '../lib/supabase'
import { Clock } from 'lucide-react'

interface ShowTimelineProps {
  position?: 'top' | 'bottom'
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ShowTimeline({ position = 'bottom' }: ShowTimelineProps) {
  const [segments, setSegments] = useState<ShowSegment[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [showMetadata, setShowMetadata] = useState<ShowMetadata | null>(null)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSegments()
    loadShowMetadata()

    // Subscribe to segments changes
    const segmentsChannel = supabase
      .channel('timeline_segments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_segments'
      }, () => {
        loadSegments()
      })
      .subscribe()

    // Subscribe to show metadata changes
    const metadataChannel = supabase
      .channel('timeline_metadata')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_metadata'
      }, () => {
        loadShowMetadata()
      })
      .subscribe()

    return () => {
      segmentsChannel.unsubscribe()
      metadataChannel.unsubscribe()
    }
  }, [])

  // Update current time based on show metadata
  useEffect(() => {
    if (!showMetadata?.show_start_time || !showMetadata?.is_live) return

    const interval = setInterval(() => {
      const now = new Date()
      const startTime = new Date(showMetadata.show_start_time!)
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setCurrentTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [showMetadata])

  const loadSegments = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('show_segments')
        .select('*')
        .order('segment_order', { ascending: true })
      
      if (fetchError) throw fetchError
      if (data) setSegments(data as ShowSegment[])
    } catch (err) {
      console.error('Failed to load segments:', err)
      setError('Failed to load segments')
    }
  }

  const loadShowMetadata = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('show_metadata')
        .select('*')
        .limit(1)
        .maybeSingle()
      
      if (fetchError) throw fetchError
      if (data) setShowMetadata(data as ShowMetadata)
      else setShowMetadata(null)
    } catch (err) {
      console.error('Failed to load show metadata:', err)
      setError('Failed to load show metadata')
    }
  }

  const activateSegment = async (segmentId: string) => {
    try {
      setError(null)
      // Deactivate all segments except the one we're activating
      const { error: deactivateError } = await supabase
        .from('show_segments')
        .update({ is_active: false })
        .neq('id', segmentId)

      if (deactivateError) throw deactivateError

      // Activate selected segment
      const { error: activateError } = await supabase
        .from('show_segments')
        .update({ is_active: true })
        .eq('id', segmentId)
      
      if (activateError) throw activateError
    } catch (err) {
      console.error('Error activating segment:', err)
      setError('Failed to activate segment. Please try again.')
    }
  }

  const getSegmentColor = (segment: ShowSegment) => {
    if (segment.is_active) return 'bg-cyan-500'
    return 'bg-gray-600'
  }

  const getSegmentGlow = (segment: ShowSegment) => {
    if (segment.is_active) return 'shadow-lg shadow-cyan-500/50'
    return ''
  }

  const getTotalDuration = () => {
    return segments.reduce((sum, seg) => sum + (seg.timer_seconds || 0), 0)
  }

  const getSegmentProgress = (segment: ShowSegment) => {
    if (!segment.is_active) return 0
    
    // Calculate elapsed time in active segment
    // This is a simplified version - in real implementation you'd track segment start time
    const activeSegmentIndex = segments.findIndex(s => s.is_active)
    const previousSegmentsDuration = segments
      .slice(0, activeSegmentIndex)
      .reduce((sum, seg) => sum + (seg.timer_seconds || 0), 0)
    
    const elapsedInSegment = currentTime - previousSegmentsDuration
    const progress = Math.min((elapsedInSegment / (segment.timer_seconds || 1)) * 100, 100)
    return Math.max(0, progress)
  }

  const totalDuration = getTotalDuration()
  const activeSegment = segments.find(s => s.is_active)

  const positionClasses = position === 'top' 
    ? 'top-0 border-b-2' 
    : 'bottom-0 border-t-2'

  return (
    <div className={`fixed left-0 right-0 ${positionClasses} border-gray-700 bg-black/95 backdrop-blur-sm z-50`}>
      <div className="px-6 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 tracking-wide">SHOW TIMELINE</span>
          </div>
          {activeSegment && (
            <div className="text-xs text-gray-400">
              <span className="text-cyan-400 font-semibold">{activeSegment.segment_name}</span>
              {' '}- {formatTime(activeSegment.timer_seconds || 0)} planned
            </div>
          )}
        </div>

        {/* Timeline Bar */}
        <div className="relative h-10 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
          <div className="absolute inset-0 flex">
            {segments.map((segment, index) => {
              const widthPercent = totalDuration > 0 
                ? ((segment.timer_seconds || 0) / totalDuration) * 100 
                : 100 / segments.length
              
              return (
                <div
                  key={segment.id}
                  className="relative group cursor-pointer"
                  style={{ width: `${widthPercent}%` }}
                  onClick={() => activateSegment(segment.id)}
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  {/* Segment Block */}
                  <div
                    className={`h-full ${getSegmentColor(segment)} ${getSegmentGlow(segment)} transition-all duration-300 ${
                      segment.is_active ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                    }`}
                    style={{
                      borderRight: index < segments.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}
                  >
                    {/* Progress Fill for Active Segment */}
                    {segment.is_active && (
                      <div
                        className="h-full bg-cyan-300 transition-all duration-1000 ease-linear"
                        style={{ width: `${getSegmentProgress(segment)}%` }}
                      />
                    )}
                  </div>

                  {/* Segment Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-white drop-shadow-lg truncate px-2">
                      {segment.segment_name}
                    </span>
                  </div>

                  {/* Hover Tooltip */}
                  {hoveredSegment === segment.id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 border border-cyan-400 rounded shadow-lg whitespace-nowrap z-50">
                      <p className="text-sm font-bold text-white">{segment.segment_name}</p>
                      <p className="text-xs text-cyan-400">Duration: {formatTime(segment.timer_seconds || 0)}</p>
                      <p className="text-xs text-gray-400">Click to activate</p>
                    </div>
                  )}

                  {/* Active Indicator */}
                  {segment.is_active && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Current Position Indicator */}
          {activeSegment && totalDuration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50 z-10 transition-all duration-1000 ease-linear"
              style={{
                left: `${Math.min((currentTime / totalDuration) * 100, 100)}%`
              }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50" />
            </div>
          )}
        </div>

        {/* Timeline Info */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>Total Duration: {formatTime(totalDuration)}</span>
          <span>{segments.length} Segments</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
