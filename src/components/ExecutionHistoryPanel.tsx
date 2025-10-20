import { useState, useEffect } from 'react'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import type { AutomationEvent } from '../lib/automation/types'
import {
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  TrendingUp,
  Zap
} from 'lucide-react'

type OutcomeFilter = 'all' | 'executed' | 'skipped' | 'failed' | 'pending'
type TriggerFilter = 'all' | 'manual' | 'keyword' | 'context' | 'event' | 'timer'

export function ExecutionHistoryPanel() {
  const { recentEvents } = useAutomationEngine()
  const [filteredEvents, setFilteredEvents] = useState<AutomationEvent[]>([])
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all')
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filter events
  useEffect(() => {
    let filtered = [...recentEvents]

    // Filter by outcome
    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(event => event.outcome === outcomeFilter)
    }

    // Filter by trigger type
    if (triggerFilter !== 'all') {
      filtered = filtered.filter(event => event.trigger_type === triggerFilter)
    }

    setFilteredEvents(filtered)
  }, [recentEvents, outcomeFilter, triggerFilter])

  const getOutcomeColor = (outcome?: string): string => {
    switch (outcome) {
      case 'executed': return 'text-green-400'
      case 'skipped': return 'text-gray-400'
      case 'failed': return 'text-red-400'
      case 'pending': return 'text-yellow-400'
      case 'overridden': return 'text-orange-400'
      default: return 'text-gray-500'
    }
  }

  const getOutcomeBg = (outcome?: string): string => {
    switch (outcome) {
      case 'executed': return 'bg-green-500/20 border-green-500/50'
      case 'skipped': return 'bg-gray-500/20 border-gray-500/50'
      case 'failed': return 'bg-red-500/20 border-red-500/50'
      case 'pending': return 'bg-yellow-500/20 border-yellow-500/50'
      case 'overridden': return 'bg-orange-500/20 border-orange-500/50'
      default: return 'bg-gray-500/20 border-gray-500/50'
    }
  }

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'executed': return <CheckCircle2 className="w-4 h-4" />
      case 'skipped': return <XCircle className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getActionTypeIcon = (actionType: string) => {
    if (actionType.startsWith('betabot')) return '🤖'
    if (actionType.startsWith('obs')) return '🎥'
    if (actionType.startsWith('graphic')) return '🖼️'
    if (actionType.startsWith('lower_third')) return '📝'
    if (actionType.startsWith('soundboard')) return '🔊'
    if (actionType.startsWith('segment')) return '📺'
    return '⚡'
  }

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatTimeAgo = (timestamp: string): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Calculate stats
  const stats = {
    total: filteredEvents.length,
    executed: filteredEvents.filter(e => e.outcome === 'executed').length,
    skipped: filteredEvents.filter(e => e.outcome === 'skipped').length,
    failed: filteredEvents.filter(e => e.outcome === 'failed').length,
    pending: filteredEvents.filter(e => e.outcome === 'pending').length,
    avgConfidence: filteredEvents.reduce((sum, e) => sum + (e.confidence || 0), 0) / filteredEvents.length || 0,
    avgExecutionTime: filteredEvents
      .filter(e => e.execution_time_ms)
      .reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) /
      filteredEvents.filter(e => e.execution_time_ms).length || 0
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          Execution History
          {filteredEvents.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs font-semibold rounded-full">
              {filteredEvents.length}
            </span>
          )}
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Executed</div>
          <div className="text-xl font-bold text-green-400">{stats.executed}</div>
        </div>
        <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Skipped</div>
          <div className="text-xl font-bold text-gray-400">{stats.skipped}</div>
        </div>
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Failed</div>
          <div className="text-xl font-bold text-red-400">{stats.failed}</div>
        </div>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Pending</div>
          <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2 bg-gray-900 border border-gray-700 rounded text-sm">
          <div className="text-gray-500 text-xs mb-1">Avg Confidence</div>
          <div className="text-white font-semibold">{Math.round(stats.avgConfidence * 100)}%</div>
        </div>
        <div className="p-2 bg-gray-900 border border-gray-700 rounded text-sm">
          <div className="text-gray-500 text-xs mb-1">Avg Execution Time</div>
          <div className="text-white font-semibold">{Math.round(stats.avgExecutionTime)}ms</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Outcome</label>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as OutcomeFilter)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            >
              <option value="all">All Outcomes</option>
              <option value="executed">Executed</option>
              <option value="skipped">Skipped</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trigger Type</label>
            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value as TriggerFilter)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            >
              <option value="all">All Triggers</option>
              <option value="manual">Manual</option>
              <option value="keyword">Keyword</option>
              <option value="context">AI Context</option>
              <option value="event">Event</option>
              <option value="timer">Timer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 && (
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center text-sm text-gray-500">
            No events match the selected filters
          </div>
        )}

        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className={`bg-gray-900 border rounded-lg p-3 cursor-pointer transition-colors ${
              expandedId === event.id ? 'border-blue-500/50' : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getActionTypeIcon(event.action_type)}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{event.action_type}</div>
                  <div className="text-xs text-gray-500">{formatTime(event.created_at)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {event.confidence !== undefined && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span className="text-white">{Math.round(event.confidence * 100)}%</span>
                  </div>
                )}
                <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold ${getOutcomeBg(event.outcome)} ${getOutcomeColor(event.outcome)}`}>
                  {getOutcomeIcon(event.outcome)}
                  <span>{event.outcome || 'unknown'}</span>
                </div>
              </div>
            </div>

            {/* Trigger Info */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="px-2 py-0.5 bg-gray-800 rounded">
                Trigger: {event.trigger_type}
              </span>
              <span className="px-2 py-0.5 bg-gray-800 rounded">
                Mode: {event.execution_mode}
              </span>
              {event.execution_time_ms && (
                <span className="px-2 py-0.5 bg-gray-800 rounded">
                  {event.execution_time_ms}ms
                </span>
              )}
              <span className="ml-auto text-gray-600">{formatTimeAgo(event.created_at)}</span>
            </div>

            {/* Expanded Details */}
            {expandedId === event.id && (
              <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                {/* Action Data */}
                <div>
                  <div className="text-xs text-gray-500 font-semibold mb-1">Action Data:</div>
                  <div className="p-2 bg-gray-800 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                    {JSON.stringify(event.action_data, null, 2)}
                  </div>
                </div>

                {/* Trigger Data */}
                {event.trigger_data && Object.keys(event.trigger_data).length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">Trigger Data:</div>
                    <div className="p-2 bg-gray-800 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                      {JSON.stringify(event.trigger_data, null, 2)}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {event.error_message && (
                  <div>
                    <div className="text-xs text-red-400 font-semibold mb-1">Error:</div>
                    <div className="p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300">
                      {event.error_message}
                    </div>
                  </div>
                )}

                {/* Operator Action */}
                {event.operator_action && (
                  <div className="text-xs text-gray-500">
                    Operator: <span className="text-gray-300 font-semibold">{event.operator_action}</span>
                  </div>
                )}

                {/* Metadata */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">Metadata:</div>
                    <div className="p-2 bg-gray-800 rounded text-xs text-gray-400">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span> {JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing last {filteredEvents.length} events • Click to expand details
      </div>
    </div>
  )
}
