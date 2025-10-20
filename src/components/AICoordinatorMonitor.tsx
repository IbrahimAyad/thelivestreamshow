/**
 * AI Coordinator Monitor
 *
 * Real-time dashboard for monitoring AI Coordinator activity:
 * - Live event feed (last 50 events)
 * - Event type breakdown
 * - Success/failure rates
 * - Recent errors
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, AlertCircle, CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react'

interface CoordinatorLog {
  id: string
  event_type: string
  event_data: Record<string, any>
  created_at: string
}

interface EventStats {
  [eventType: string]: {
    count: number
    successRate: number
  }
}

export function AICoordinatorMonitor() {
  const [events, setEvents] = useState<CoordinatorLog[]>([])
  const [stats, setStats] = useState<EventStats>({})
  const [errors, setErrors] = useState<CoordinatorLog[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    loadEvents()
    loadStats()
    loadErrors()
  }, [])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('ai_coordinator_logs_feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_coordinator_logs'
      }, (payload) => {
        console.log('🔄 New coordinator event:', payload.new)
        // Add new event to top of feed
        setEvents(prev => [payload.new as CoordinatorLog, ...prev].slice(0, 50))

        // Update stats
        loadStats()

        // Update errors if it's an error event
        if (payload.new.event_type?.includes('error') || payload.new.event_type?.includes('failed')) {
          setErrors(prev => [payload.new as CoordinatorLog, ...prev].slice(0, 10))
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ai_coordinator_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to load coordinator events:', error)
    } else if (data) {
      setEvents(data as CoordinatorLog[])
    }
    setLoading(false)
  }

  const loadStats = async () => {
    const { data } = await supabase
      .from('ai_coordinator_logs')
      .select('event_type, event_data')
      .order('created_at', { ascending: false })
      .limit(200)

    if (data) {
      const statsMap: EventStats = {}

      data.forEach(log => {
        if (!statsMap[log.event_type]) {
          statsMap[log.event_type] = { count: 0, successRate: 0 }
        }
        statsMap[log.event_type].count++
      })

      setStats(statsMap)
    }
  }

  const loadErrors = async () => {
    const { data } = await supabase
      .from('ai_coordinator_logs')
      .select('*')
      .or('event_type.ilike.%error%,event_type.ilike.%failed%')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setErrors(data as CoordinatorLog[])
    }
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('error') || eventType.includes('failed')) {
      return <XCircle className="w-3 h-3 text-red-400" />
    } else if (eventType.includes('success') || eventType.includes('approved')) {
      return <CheckCircle className="w-3 h-3 text-green-400" />
    } else {
      return <Activity className="w-3 h-3 text-blue-400" />
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
    return date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-purple-300">Loading AI Coordinator Monitor...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-purple-500/30 rounded-lg">
      {/* Header */}
      <div
        className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-300">AI Coordinator Monitor</h3>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
              {events.length} events
            </span>
          </div>
          <button className="text-gray-400 hover:text-white text-xs">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800 border border-gray-700 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Total Events</span>
              </div>
              <p className="text-xl font-bold text-white">{events.length}</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Event Types</span>
              </div>
              <p className="text-xl font-bold text-white">{Object.keys(stats).length}</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">Errors</span>
              </div>
              <p className="text-xl font-bold text-white">{errors.length}</p>
            </div>
          </div>

          {/* Event Type Breakdown */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h4 className="text-xs font-semibold text-gray-300 mb-2">Event Type Breakdown</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries(stats).slice(0, 10).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate flex-1">{formatEventType(type)}</span>
                  <span className="text-white font-semibold ml-2">{data.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Errors */}
          {errors.length > 0 && (
            <div className="bg-red-900/10 border border-red-500/30 rounded p-3">
              <h4 className="text-xs font-semibold text-red-300 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Recent Errors
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {errors.slice(0, 5).map(error => (
                  <div key={error.id} className="bg-gray-900/50 rounded p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-red-300 font-semibold">{formatEventType(error.event_type)}</p>
                        {error.event_data?.reason && (
                          <p className="text-xs text-gray-400 mt-0.5">{error.event_data.reason}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatTimestamp(error.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Event Feed */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Event Feed (Last 10)
            </h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {events.slice(0, 10).map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 p-2 hover:bg-gray-700/50 rounded text-xs"
                >
                  {getEventIcon(event.event_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 truncate">{formatEventType(event.event_type)}</p>
                    {event.event_data?.question && (
                      <p className="text-gray-500 truncate text-xs mt-0.5">
                        "{event.event_data.question.slice(0, 50)}..."
                      </p>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap">{formatTimestamp(event.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
