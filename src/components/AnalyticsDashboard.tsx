import { useState, useEffect } from 'react'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import { LearningEngine } from '../lib/learning/LearningEngine'
import type { LearningMetrics, OptimizationRecommendation } from '../lib/learning/LearningEngine'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Lightbulb,
  Activity,
  Zap,
  Clock,
  Target,
  Award
} from 'lucide-react'

export function AnalyticsDashboard() {
  const { recentEvents, config } = useAutomationEngine()
  const [learningEngine] = useState(() => new LearningEngine())
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null)
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh metrics
  const refreshMetrics = () => {
    setIsRefreshing(true)

    // Ingest events
    learningEngine.ingestEvents(recentEvents)

    // Calculate metrics
    const newMetrics = learningEngine.calculateMetrics()
    setMetrics(newMetrics)

    // Generate recommendations
    const newRecommendations = learningEngine.generateRecommendations({
      autoExecuteThreshold: config?.confidence_auto_execute || 0.85,
      requireApprovalThreshold: config?.confidence_suggest || 0.60,
      autoExecutionEnabled: config?.auto_execute_enabled || false
    })
    setRecommendations(newRecommendations)

    setIsRefreshing(false)
  }

  // Auto-refresh on events change
  useEffect(() => {
    refreshMetrics()
  }, [recentEvents])

  // Export metrics to CSV
  const handleExportCSV = () => {
    const csv = learningEngine.exportMetricsCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `automation-metrics-${new Date().toISOString()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export events to JSON
  const handleExportJSON = () => {
    const json = learningEngine.exportEventsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `automation-events-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getPriorityColor = (priority: OptimizationRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/50'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/50'
    }
  }

  const getPriorityIcon = (priority: OptimizationRecommendation['priority']) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <Lightbulb className="w-4 h-4" />
      case 'low': return <CheckCircle2 className="w-4 h-4" />
    }
  }

  if (!metrics) {
    return (
      <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-500 animate-pulse" />
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Analytics & Learning Dashboard
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshMetrics}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Total Events */}
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Total Events</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalEvents}</div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.eventsToday} today • {metrics.eventsThisWeek} this week
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {Math.round(metrics.successRate * 100)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {Math.round(metrics.totalEvents * metrics.successRate)} executed
          </div>
        </div>

        {/* Approval Rate */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Approval Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(metrics.approvalRate * 100)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {Math.round(metrics.rejectionRate * 100)}% rejected
          </div>
        </div>

        {/* Auto-Execution Rate */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Auto-Exec Rate</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {Math.round(metrics.autoExecutionRate * 100)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {Math.round(metrics.totalEvents * metrics.autoExecutionRate)} automated
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-gray-900 border border-gray-700 rounded text-sm">
          <div className="flex items-center gap-2 mb-1 text-gray-400">
            <Award className="w-3 h-3" />
            Avg Confidence (Approved)
          </div>
          <div className="text-lg font-bold text-white">
            {Math.round(metrics.avgConfidenceApproved * 100)}%
          </div>
        </div>
        <div className="p-3 bg-gray-900 border border-gray-700 rounded text-sm">
          <div className="flex items-center gap-2 mb-1 text-gray-400">
            <TrendingDown className="w-3 h-3" />
            Avg Confidence (Rejected)
          </div>
          <div className="text-lg font-bold text-orange-400">
            {Math.round(metrics.avgConfidenceRejected * 100)}%
          </div>
        </div>
        <div className="p-3 bg-gray-900 border border-gray-700 rounded text-sm">
          <div className="flex items-center gap-2 mb-1 text-gray-400">
            <Clock className="w-3 h-3" />
            Avg Execution Time
          </div>
          <div className="text-lg font-bold text-white">
            {Math.round(metrics.avgExecutionTime)}ms
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Optimization Recommendations ({recommendations.length})
          </h4>
          <div className="space-y-2">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(rec.priority)}
                    <span className="font-semibold text-sm">{rec.title}</span>
                  </div>
                  <div className="text-xs px-2 py-0.5 bg-gray-800 rounded">
                    {Math.round(rec.confidence * 100)}% confidence
                  </div>
                </div>
                <p className="text-xs mb-2">{rec.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400">Current:</span>{' '}
                    <span className="font-mono">{JSON.stringify(rec.currentValue)}</span>
                    {' → '}
                    <span className="text-gray-400">Suggested:</span>{' '}
                    <span className="font-mono font-semibold">{JSON.stringify(rec.suggestedValue)}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  💡 {rec.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance by Action Type */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Performance by Action Type
        </h4>
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-2 text-gray-400 font-semibold">Action Type</th>
                <th className="text-center p-2 text-gray-400 font-semibold">Total</th>
                <th className="text-center p-2 text-gray-400 font-semibold">Executed</th>
                <th className="text-center p-2 text-gray-400 font-semibold">Approved</th>
                <th className="text-center p-2 text-gray-400 font-semibold">Rejected</th>
                <th className="text-center p-2 text-gray-400 font-semibold">Failed</th>
                <th className="text-center p-2 text-gray-400 font-semibold">Avg Conf</th>
                <th className="text-center p-2 text-gray-400 font-semibold">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.performanceByActionType)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([actionType, data]) => (
                  <tr key={actionType} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-2 text-white font-mono text-xs">{actionType}</td>
                    <td className="p-2 text-center text-gray-300">{data.total}</td>
                    <td className="p-2 text-center text-green-400">{data.executed}</td>
                    <td className="p-2 text-center text-blue-400">{data.approved}</td>
                    <td className="p-2 text-center text-orange-400">{data.rejected}</td>
                    <td className="p-2 text-center text-red-400">{data.failed}</td>
                    <td className="p-2 text-center text-gray-300">
                      {Math.round(data.avgConfidence * 100)}%
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={data.successRate > 0.7 ? 'text-green-400' : data.successRate > 0.4 ? 'text-yellow-400' : 'text-red-400'}>
                          {Math.round(data.successRate * 100)}%
                        </span>
                        {data.successRate > 0.7 ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : data.successRate < 0.4 ? (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance by Trigger Type */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          Performance by Trigger Type
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(metrics.performanceByTriggerType)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([triggerType, data]) => (
              <div key={triggerType} className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                <div className="text-xs text-gray-400 mb-1 capitalize">{triggerType}</div>
                <div className="text-xl font-bold text-white mb-1">{data.total}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-400">{Math.round(data.successRate * 100)}%</span>
                  <span className="text-gray-500">{Math.round(data.avgConfidence * 100)}% conf</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Time Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3">Hourly Distribution</h4>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-end justify-between h-32 gap-1">
              {metrics.hourlyDistribution.map((count, hour) => {
                const maxCount = Math.max(...metrics.hourlyDistribution)
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                      style={{ height: `${height}%` }}
                      title={`${hour}:00 - ${count} events`}
                    />
                    {hour % 4 === 0 && (
                      <div className="text-xs text-gray-500">{hour}</div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 text-xs text-center text-gray-400">Hour of Day</div>
          </div>
        </div>

        {/* Daily Distribution */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3">Daily Distribution</h4>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-end justify-between h-32 gap-2">
              {metrics.dailyDistribution.map((count, day) => {
                const maxCount = Math.max(...metrics.dailyDistribution)
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-400"
                      style={{ height: `${height}%` }}
                      title={`${dayNames[day]} - ${count} events`}
                    />
                    <div className="text-xs text-gray-400">{dayNames[day]}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 text-xs text-center text-gray-400">Day of Week</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
        <p className="mb-1"><strong>Learning System:</strong> Analyzes operator feedback patterns to improve suggestions over time.</p>
        <p>Recommendations are generated based on {metrics.totalEvents} events. More data = better insights.</p>
      </div>
    </div>
  )
}
