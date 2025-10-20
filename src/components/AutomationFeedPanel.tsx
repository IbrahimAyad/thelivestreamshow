import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { AutomationEvent } from '../lib/automation/types'
import {
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Keyboard,
  Calendar,
  MessageSquare,
  Brain,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

export function AutomationFeedPanel() {
  const [events, setEvents] = useState<AutomationEvent[]>([])
  const [filter, setFilter] = useState<'all' | 'suggestions' | 'executed' | 'failed'>('all')

  useEffect(() => {
    loadEvents()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('automation_events_feed')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'automation_events' },
        () => loadEvents()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [filter])

  const loadEvents = async () => {
    let query = supabase
      .from('automation_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter === 'suggestions') {
      query = query.eq('outcome', 'pending')
    } else if (filter === 'executed') {
      query = query.eq('outcome', 'executed')
    } else if (filter === 'failed') {
      query = query.eq('outcome', 'failed')
    }

    const { data } = await query

    if (data) {
      setEvents(data as AutomationEvent[])
    }
  }

  const approveSuggestion = async (eventId: string) => {
    // This would call the automation engine to approve
    await supabase
      .from('automation_events')
      .update({
        outcome: 'executed',
        operator_action: 'approved'
      })
      .eq('id', eventId)

    loadEvents()
  }

  const rejectSuggestion = async (eventId: string) => {
    await supabase
      .from('automation_events')
      .update({
        outcome: 'skipped',
        operator_action: 'rejected'
      })
      .eq('id', eventId)

    loadEvents()
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'manual': return <Keyboard className="w-4 h-4" />
      case 'timer': return <Clock className="w-4 h-4" />
      case 'keyword': return <MessageSquare className="w-4 h-4" />
      case 'ai': return <Brain className="w-4 h-4" />
      case 'event': return <Zap className="w-4 h-4" />
      case 'context': return <Sparkles className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'executed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'skipped': return <AlertTriangle className="w-4 h-4 text-gray-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const formatActionType = (actionType: string) => {
    return actionType
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' → ')
  }

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const suggestions = events.filter(e => e.outcome === 'pending')

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Auto-Director Feed
          {suggestions.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full">
              {suggestions.length} Pending
            </span>
          )}
        </h3>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['all', 'suggestions', 'executed', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No automation events yet</p>
            <p className="text-sm mt-1">Events will appear here as the auto-director works</p>
          </div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                event.outcome === 'pending'
                  ? 'bg-yellow-900/20 border-yellow-500/50'
                  : event.outcome === 'executed'
                  ? 'bg-green-900/10 border-green-500/20'
                  : event.outcome === 'failed'
                  ? 'bg-red-900/10 border-red-500/20'
                  : 'bg-gray-900/50 border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    {getTriggerIcon(event.trigger_type)}
                    <span className="text-sm font-semibold text-white">
                      {formatActionType(event.action_type)}
                    </span>
                    {event.confidence !== null && event.confidence !== undefined && (
                      <span className="text-xs text-gray-400">
                        ({Math.round(event.confidence * 100)}% confident)
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{event.trigger_type} trigger</span>
                      <span>•</span>
                      <span className="capitalize">{event.execution_mode} mode</span>
                      <span>•</span>
                      <span>{formatTimeAgo(event.created_at)}</span>
                    </div>

                    {/* Show trigger data if interesting */}
                    {event.trigger_data?.matched_keywords && (
                      <div className="text-blue-400">
                        Keywords: {event.trigger_data.matched_keywords.join(', ')}
                      </div>
                    )}

                    {event.error_message && (
                      <div className="text-red-400">
                        Error: {event.error_message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Outcome & Actions */}
                <div className="flex items-center gap-2">
                  {event.outcome === 'pending' ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => approveSuggestion(event.id)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Approve"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectSuggestion(event.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Reject"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    getOutcomeIcon(event.outcome)
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between">
          <div>Showing {events.length} events</div>
          {suggestions.length > 0 && (
            <div className="text-yellow-400">
              {suggestions.length} awaiting approval
            </div>
          )}
        </div>
      )}
    </div>
  )
}
