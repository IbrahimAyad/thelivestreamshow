import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { AutomationConfig } from '../lib/automation/types'
import {
  Settings,
  Power,
  PowerOff,
  Zap,
  AlertOctagon,
  Shield,
  Gauge,
  Clock,
  Video,
  Brain,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export function AutomationConfigPanel() {
  const [config, setConfig] = useState<AutomationConfig | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadConfig()

    // Watch for AI Automation toggle in show_metadata
    const syncWithAIAutomation = async () => {
      const { data } = await supabase
        .from('show_metadata')
        .select('auto_advance_enabled')
        .single()

      if (data && config) {
        if (data.auto_advance_enabled !== config.automation_enabled) {
          console.log(`🤖 Auto-Director: AI Automation toggled to ${data.auto_advance_enabled ? 'ON' : 'OFF'}`)
          await updateConfig({ automation_enabled: data.auto_advance_enabled })
        }
      }
    }

    syncWithAIAutomation()

    // Subscribe to realtime config updates
    const configSubscription = supabase
      .channel('automation_config')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'automation_config' },
        () => loadConfig()
      )
      .subscribe()

    // Subscribe to show_metadata AI Automation changes
    const metadataSubscription = supabase
      .channel('automation_metadata_sync')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'show_metadata' },
        (payload) => {
          const newValue = payload.new.auto_advance_enabled
          if (newValue !== undefined && config && newValue !== config.automation_enabled) {
            console.log(`🤖 Auto-Director: AI Automation toggled to ${newValue ? 'ON' : 'OFF'}`)
            updateConfig({ automation_enabled: newValue })
          }
        }
      )
      .subscribe()

    return () => {
      configSubscription.unsubscribe()
      metadataSubscription.unsubscribe()
    }
  }, [config])

  const loadConfig = async () => {
    const { data } = await supabase
      .from('automation_config')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (data) {
      setConfig(data as AutomationConfig)
    }
  }

  const updateConfig = async (updates: Partial<AutomationConfig>) => {
    await supabase
      .from('automation_config')
      .update(updates)
      .eq('id', '00000000-0000-0000-0000-000000000001')

    loadConfig()
  }

  const toggleAutomation = () => {
    if (config) {
      updateConfig({ automation_enabled: !config.automation_enabled })
    }
  }

  const toggleAutoExecute = () => {
    if (config) {
      updateConfig({ auto_execute_enabled: !config.auto_execute_enabled })
    }
  }

  const emergencyStop = async () => {
    if (confirm('EMERGENCY STOP: This will immediately halt all automation. Continue?')) {
      await updateConfig({ emergency_stop: true })
    }
  }

  const resumeFromEmergencyStop = async () => {
    await updateConfig({ emergency_stop: false })
  }

  if (!config) {
    return (
      <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-700 rounded" />
          <div className="h-4 bg-gray-700 rounded w-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          Auto-Director Control
          {config.automation_enabled && !config.emergency_stop && (
            <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
              AUTO
            </span>
          )}
          {config.emergency_stop && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              STOPPED
            </span>
          )}
        </h3>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Controls - Always Visible */}
      <div className="space-y-3 mb-4">
        {/* Master Switch */}
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-3">
            {config.automation_enabled ? (
              <Power className="w-5 h-5 text-green-400" />
            ) : (
              <PowerOff className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <div className="font-semibold text-white">Automation System</div>
              <div className="text-xs text-gray-400">
                {config.automation_enabled ? 'Active and monitoring' : 'Controlled by AI Automation master switch'}
              </div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            config.automation_enabled
              ? 'bg-green-600/20 text-green-400 border border-green-500/50'
              : 'bg-gray-700/20 text-gray-400 border border-gray-600/50'
          }`}>
            {config.automation_enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Auto-Execute Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-3">
            <Zap className={`w-5 h-5 ${config.auto_execute_enabled ? 'text-yellow-400' : 'text-gray-500'}`} />
            <div>
              <div className="font-semibold text-white">Auto-Execute</div>
              <div className="text-xs text-gray-400">
                {config.auto_execute_enabled
                  ? 'High-confidence actions execute automatically'
                  : 'All actions require manual approval'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleAutoExecute}
            disabled={!config.automation_enabled || config.emergency_stop}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              config.auto_execute_enabled
                ? 'bg-yellow-600 hover:bg-yellow-700 text-black'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            } ${(!config.automation_enabled || config.emergency_stop) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {config.auto_execute_enabled ? 'Auto' : 'Manual'}
          </button>
        </div>

        {/* Emergency Stop */}
        <div className="flex items-center justify-between p-3 bg-red-900/20 border-2 border-red-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-red-400" />
            <div>
              <div className="font-semibold text-white">Emergency Stop</div>
              <div className="text-xs text-gray-400">
                Immediately halt all automation
              </div>
            </div>
          </div>
          {config.emergency_stop ? (
            <button
              onClick={resumeFromEmergencyStop}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={emergencyStop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              STOP
            </button>
          )}
        </div>
      </div>

      {/* AI Automation Notice */}
      <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded text-sm text-purple-300">
        <p className="font-semibold">🤖 AI Automation Control</p>
        <p className="text-xs mt-1">
          This automation system is controlled by the <span className="font-bold">AI Automation</span> toggle in Show Metadata Control.
          Flipping that master switch will enable/disable the Auto-Director.
        </p>
      </div>

      {/* Advanced Settings - Expandable */}
      {isExpanded && (
        <div className="pt-4 border-t border-gray-700 space-y-4">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Safety & Thresholds
          </h4>

          {/* Confidence Thresholds */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Auto-Execute</div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-green-400" />
                <input
                  type="number"
                  value={config.confidence_auto_execute * 100}
                  onChange={(e) => updateConfig({ confidence_auto_execute: Number(e.target.value) / 100 })}
                  className="w-16 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-white">%</span>
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Suggest</div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-yellow-400" />
                <input
                  type="number"
                  value={config.confidence_suggest * 100}
                  onChange={(e) => updateConfig({ confidence_suggest: Number(e.target.value) / 100 })}
                  className="w-16 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-white">%</span>
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Log Only</div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={config.confidence_log_only * 100}
                  onChange={(e) => updateConfig({ confidence_log_only: Number(e.target.value) / 100 })}
                  className="w-16 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-white">%</span>
              </div>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Max Actions/Min</div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <input
                  type="number"
                  value={config.max_actions_per_minute}
                  onChange={(e) => updateConfig({ max_actions_per_minute: Number(e.target.value) })}
                  className="w-16 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700"
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Cooldown</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <input
                  type="number"
                  value={config.cooldown_seconds}
                  onChange={(e) => updateConfig({ cooldown_seconds: Number(e.target.value) })}
                  className="w-16 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700"
                  min="0"
                  max="60"
                />
                <span className="text-sm text-white">s</span>
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Debounce</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <input
                  type="number"
                  value={config.debounce_seconds}
                  onChange={(e) => updateConfig({ debounce_seconds: Number(e.target.value) })}
                  className="w-16 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700"
                  min="0"
                  max="30"
                />
                <span className="text-sm text-white">s</span>
              </div>
            </div>
          </div>

          {/* OBS Settings */}
          <div className="bg-gray-900 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">OBS Integration</span>
              </div>
              <button
                onClick={() => updateConfig({ obs_enabled: !config.obs_enabled })}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  config.obs_enabled
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {config.obs_enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            {config.obs_enabled && (
              <div className="text-xs text-gray-400 mt-2">
                <div>WebSocket: {config.obs_websocket_url}</div>
                <div className="mt-1 text-yellow-400">
                  ⚠️ Make sure OBS is running and WebSocket is enabled
                </div>
              </div>
            )}
          </div>

          {/* AI Settings */}
          <div className="bg-gray-900 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-semibold text-white">AI Settings</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Provider:</span>
                <span className="ml-2 text-white">{config.ai_provider}</span>
              </div>
              <div>
                <span className="text-gray-400">Model:</span>
                <span className="ml-2 text-white">{config.ai_model}</span>
              </div>
              <div>
                <span className="text-gray-400">Context Window:</span>
                <span className="ml-2 text-white">{config.ai_context_window} messages</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
