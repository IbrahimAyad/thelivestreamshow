import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { TriggerRule } from '../lib/automation/types'
import {
  Zap,
  Play,
  Pause,
  MessageSquare,
  Calendar,
  Brain,
  Keyboard,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'

export function TriggerRulesPanel() {
  const [rules, setRules] = useState<TriggerRule[]>([])
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')

  useEffect(() => {
    loadRules()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('trigger_rules_panel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'trigger_rules' },
        () => loadRules()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [filter])

  const loadRules = async () => {
    let query = supabase
      .from('trigger_rules')
      .select('*')
      .order('priority')
      .order('rule_name')

    if (filter === 'enabled') {
      query = query.eq('enabled', true)
    } else if (filter === 'disabled') {
      query = query.eq('enabled', false)
    }

    const { data } = await query

    if (data) {
      setRules(data as TriggerRule[])
    }
  }

  const toggleRule = async (ruleId: string, currentlyEnabled: boolean) => {
    await supabase
      .from('trigger_rules')
      .update({ enabled: !currentlyEnabled })
      .eq('id', ruleId)

    loadRules()
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'keyword': return <MessageSquare className="w-4 h-4" />
      case 'event': return <Zap className="w-4 h-4" />
      case 'context': return <Brain className="w-4 h-4" />
      case 'timer': return <Calendar className="w-4 h-4" />
      case 'manual': return <Keyboard className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 0) return 'text-red-400'
    if (priority === 1) return 'text-orange-400'
    if (priority === 2) return 'text-yellow-400'
    if (priority === 3) return 'text-green-400'
    if (priority === 4) return 'text-blue-400'
    return 'text-gray-400'
  }

  const getPriorityLabel = (priority: number) => {
    const labels = {
      0: 'Emergency',
      1: 'Critical',
      2: 'High',
      3: 'Normal',
      4: 'Low',
      5: 'Background'
    }
    return labels[priority as keyof typeof labels] || 'Unknown'
  }

  const formatActionType = (actionType: string) => {
    return actionType
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' → ')
  }

  const eventRules = rules.filter(r => r.trigger_type === 'event')
  const keywordRules = rules.filter(r => r.trigger_type === 'keyword')
  const contextRules = rules.filter(r => r.trigger_type === 'context')
  const timerRules = rules.filter(r => r.trigger_type === 'timer')

  const RuleCard = ({ rule }: { rule: TriggerRule }) => (
    <div
      className={`p-3 rounded-lg border-2 transition-all ${
        rule.enabled
          ? 'bg-green-900/10 border-green-500/20'
          : 'bg-gray-900/50 border-gray-700 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            {getTriggerIcon(rule.trigger_type)}
            <span className="text-sm font-semibold text-white">
              {rule.rule_name}
            </span>
            <span className={`text-xs ${getPriorityColor(rule.priority)}`}>
              P{rule.priority} {getPriorityLabel(rule.priority)}
            </span>
          </div>

          {/* Description */}
          {rule.description && (
            <div className="text-xs text-gray-400 mb-2">
              {rule.description}
            </div>
          )}

          {/* Trigger Details */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              <span className="text-gray-400">Trigger:</span>{' '}
              {rule.trigger_type === 'event' && (
                <>
                  {rule.trigger_conditions.event_source} ({rule.trigger_conditions.event_type})
                  {rule.trigger_conditions.filters && (
                    <span className="ml-1 text-blue-400">
                      [filtered]
                    </span>
                  )}
                </>
              )}
              {rule.trigger_type === 'keyword' && (
                <>
                  {rule.trigger_conditions.keywords?.join(', ')}
                </>
              )}
              {rule.trigger_type === 'context' && (
                <>
                  {rule.trigger_conditions.sentiment || 'any sentiment'}
                </>
              )}
            </div>

            <div>
              <span className="text-gray-400">Action:</span>{' '}
              <span className="text-blue-300">{formatActionType(rule.action_type)}</span>
            </div>

            {rule.max_executions_per_show && (
              <div>
                <span className="text-gray-400">Limit:</span>{' '}
                {rule.current_execution_count} / {rule.max_executions_per_show} per show
              </div>
            )}

            {rule.require_operator_approval && (
              <div className="flex items-center gap-1 text-yellow-400">
                <AlertCircle className="w-3 h-3" />
                <span>Requires approval</span>
              </div>
            )}
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <button
          onClick={() => toggleRule(rule.id, rule.enabled)}
          className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
            rule.enabled
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title={rule.enabled ? 'Click to disable' : 'Click to enable'}
        >
          {rule.enabled ? (
            <>
              <Eye className="w-4 h-4" />
              Active
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Disabled
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Trigger Rules
          <span className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-semibold rounded-full">
            {rules.length} total
          </span>
          {rules.filter(r => r.enabled).length > 0 && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
              {rules.filter(r => r.enabled).length} active
            </span>
          )}
        </h3>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['all', 'enabled', 'disabled'] as const).map(f => (
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

      <div className="space-y-4">
        {/* Event-Based Rules */}
        {eventRules.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Event-Based Triggers ({eventRules.length})
            </h4>
            <div className="space-y-2">
              {eventRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        )}

        {/* Keyword Rules */}
        {keywordRules.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Keyword Triggers ({keywordRules.length})
            </h4>
            <div className="space-y-2">
              {keywordRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        )}

        {/* Context Rules */}
        {contextRules.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Context Triggers ({contextRules.length})
            </h4>
            <div className="space-y-2">
              {contextRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        )}

        {/* Timer Rules */}
        {timerRules.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-orange-400 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timer Triggers ({timerRules.length})
            </h4>
            <div className="space-y-2">
              {timerRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        )}

        {rules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No trigger rules found</p>
            <p className="text-sm mt-1">
              {filter === 'enabled' && 'No rules are currently enabled'}
              {filter === 'disabled' && 'No rules are currently disabled'}
              {filter === 'all' && 'Run the database migration to see example rules'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {rules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between">
          <div>
            Click <Eye className="inline w-3 h-3 mx-1" /><strong>Active</strong> or <EyeOff className="inline w-3 h-3 mx-1" /><strong>Disabled</strong> to toggle rules
          </div>
          <div className="flex items-center gap-2">
            {rules.filter(r => r.enabled && r.trigger_type === 'event').length > 0 && (
              <span className="text-green-400">
                ⚡ Listening for events
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
