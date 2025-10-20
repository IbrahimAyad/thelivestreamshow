import { useState, useEffect } from 'react'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import type { AutomationEvent } from '../lib/automation/types'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  TrendingUp,
  Info
} from 'lucide-react'

export function SuggestionApprovalPanel() {
  const { recentEvents, approveSuggestion, rejectSuggestion } = useAutomationEngine()
  const [pendingSuggestions, setPendingSuggestions] = useState<AutomationEvent[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Filter pending suggestions from recent events
  useEffect(() => {
    const pending = recentEvents.filter(event => event.outcome === 'pending')
    setPendingSuggestions(pending)
  }, [recentEvents])

  const handleApprove = async (eventId: string) => {
    setProcessingId(eventId)
    try {
      await approveSuggestion(eventId)
    } catch (error) {
      console.error('Failed to approve suggestion:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (eventId: string) => {
    setProcessingId(eventId)
    try {
      await rejectSuggestion(eventId)
    } catch (error) {
      console.error('Failed to reject suggestion:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getActionTypeColor = (actionType: string): string => {
    if (actionType.startsWith('betabot')) return 'text-purple-400'
    if (actionType.startsWith('obs')) return 'text-blue-400'
    if (actionType.startsWith('graphic')) return 'text-green-400'
    if (actionType.startsWith('lower_third')) return 'text-yellow-400'
    if (actionType.startsWith('soundboard')) return 'text-pink-400'
    if (actionType.startsWith('segment')) return 'text-orange-400'
    return 'text-gray-400'
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

  const getTriggerTypeLabel = (triggerType: string): string => {
    switch (triggerType) {
      case 'manual': return 'Manual'
      case 'keyword': return 'Keyword'
      case 'context': return 'AI Context'
      case 'event': return 'Event'
      case 'timer': return 'Timer'
      default: return triggerType
    }
  }

  const getTriggerTypeBg = (triggerType: string): string => {
    switch (triggerType) {
      case 'manual': return 'bg-gray-500/20 border-gray-500/50'
      case 'keyword': return 'bg-green-500/20 border-green-500/50'
      case 'context': return 'bg-purple-500/20 border-purple-500/50'
      case 'event': return 'bg-blue-500/20 border-blue-500/50'
      case 'timer': return 'bg-orange-500/20 border-orange-500/50'
      default: return 'bg-gray-500/20 border-gray-500/50'
    }
  }

  const formatTimeAgo = (timestamp: string): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Suggestions
          {pendingSuggestions.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs font-semibold rounded-full">
              {pendingSuggestions.length}
            </span>
          )}
        </h3>
      </div>

      {/* Help Text */}
      {pendingSuggestions.length === 0 && (
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400 opacity-50" />
          <p className="text-sm text-gray-400">No pending suggestions</p>
          <p className="text-xs text-gray-500 mt-1">
            Automation suggestions will appear here for your approval
          </p>
        </div>
      )}

      {/* Pending Suggestions List */}
      {pendingSuggestions.length > 0 && (
        <div className="space-y-3">
          {pendingSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-gray-900 border-2 border-yellow-500/30 rounded-lg p-4 hover:border-yellow-500/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getActionTypeIcon(suggestion.action_type)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${getActionTypeColor(suggestion.action_type)}`}>
                        {suggestion.action_type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getTriggerTypeBg(suggestion.trigger_type)}`}>
                        {getTriggerTypeLabel(suggestion.trigger_type)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(suggestion.created_at)}
                    </div>
                  </div>
                </div>

                {/* Confidence Badge */}
                {suggestion.confidence !== undefined && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span className="text-white font-semibold">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Action Data */}
              <div className="mb-3 p-2 bg-gray-800 rounded text-xs font-mono text-gray-300">
                {JSON.stringify(suggestion.action_data, null, 2)}
              </div>

              {/* Trigger Data */}
              {suggestion.trigger_data && Object.keys(suggestion.trigger_data).length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Info className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500 font-semibold">Trigger Context:</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded text-xs text-gray-400">
                    {Object.entries(suggestion.trigger_data).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-gray-300">{JSON.stringify(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(suggestion.id)}
                  disabled={processingId === suggestion.id}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {processingId === suggestion.id ? 'Approving...' : 'Approve & Execute'}
                </button>
                <button
                  onClick={() => handleReject(suggestion.id)}
                  disabled={processingId === suggestion.id}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {processingId === suggestion.id ? 'Rejecting...' : 'Reject'}
                </button>
              </div>

              {/* Execution Mode Badge */}
              <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <Zap className="w-3 h-3" />
                  <span>Mode: <span className="text-yellow-400 font-semibold">{suggestion.execution_mode}</span></span>
                </div>
                {suggestion.show_segment && (
                  <div className="text-gray-500">
                    Segment: <span className="text-gray-300">{suggestion.show_segment}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
        <p className="mb-1"><strong>Auto-Execution:</strong> Suggestions with high confidence (≥85%) can auto-execute if enabled.</p>
        <p>Suggestions with medium confidence (60-84%) require your approval.</p>
      </div>
    </div>
  )
}
