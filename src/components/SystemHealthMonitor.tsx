import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useF5TTS } from '../hooks/useF5TTS'
import { Activity, Database, Mic, MessageSquare, Zap, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  details: string
  icon: React.ElementType
}

export function SystemHealthMonitor() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([])
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date())
  const f5tts = useF5TTS()

  useEffect(() => {
    checkAllHealth()
    const interval = setInterval(checkAllHealth, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [f5tts.isConnected, f5tts.error])

  const checkAllHealth = async () => {
    const statuses: HealthStatus[] = []
    const startTime = Date.now()

    // 1. Check Supabase Connection
    try {
      const pingStart = Date.now()
      const { error } = await supabase.from('betabot_mood').select('id').limit(1)
      const latency = Date.now() - pingStart

      if (error) {
        statuses.push({
          service: 'Supabase',
          status: 'down',
          details: error.message,
          icon: Database
        })
      } else if (latency > 3000) {
        statuses.push({
          service: 'Supabase',
          status: 'degraded',
          details: `Slow (${latency}ms)`,
          icon: Database
        })
      } else {
        statuses.push({
          service: 'Supabase',
          status: 'healthy',
          details: `${latency}ms`,
          icon: Database
        })
      }
    } catch (err) {
      statuses.push({
        service: 'Supabase',
        status: 'down',
        details: 'Connection failed',
        icon: Database
      })
    }

    // 2. Check F5TTS Service
    if (f5tts.isConnected && !f5tts.error) {
      statuses.push({
        service: 'F5TTS',
        status: 'healthy',
        details: f5tts.isSpeaking ? 'Speaking' : 'Ready',
        icon: Mic
      })
    } else if (f5tts.error) {
      statuses.push({
        service: 'F5TTS',
        status: 'down',
        details: f5tts.error,
        icon: Mic
      })
    } else {
      statuses.push({
        service: 'F5TTS',
        status: 'down',
        details: 'Disconnected',
        icon: Mic
      })
    }

    // 3. Check Question Queue
    try {
      const { data: questions, error } = await supabase
        .from('show_questions')
        .select('id', { count: 'exact', head: true })
        .eq('is_played', false)

      if (error) {
        statuses.push({
          service: 'Question Queue',
          status: 'degraded',
          details: 'Cannot count',
          icon: MessageSquare
        })
      } else {
        const count = questions?.length || 0
        statuses.push({
          service: 'Question Queue',
          status: 'healthy',
          details: `${count} pending`,
          icon: MessageSquare
        })
      }
    } catch (err) {
      statuses.push({
        service: 'Question Queue',
        status: 'down',
        details: 'Error',
        icon: MessageSquare
      })
    }

    // 4. Check BetaBot Mood Sync
    try {
      const { data: mood, error } = await supabase
        .from('betabot_mood')
        .select('updated_at')
        .limit(1)
        .single()

      if (error) {
        statuses.push({
          service: 'BetaBot Sync',
          status: 'degraded',
          details: 'Cannot read',
          icon: Activity
        })
      } else if (mood) {
        const lastUpdate = new Date(mood.updated_at)
        const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000)

        if (minutesAgo > 10) {
          statuses.push({
            service: 'BetaBot Sync',
            status: 'degraded',
            details: `${minutesAgo}m ago`,
            icon: Activity
          })
        } else {
          statuses.push({
            service: 'BetaBot Sync',
            status: 'healthy',
            details: minutesAgo === 0 ? 'Just now' : `${minutesAgo}m ago`,
            icon: Activity
          })
        }
      }
    } catch (err) {
      statuses.push({
        service: 'BetaBot Sync',
        status: 'down',
        details: 'Error',
        icon: Activity
      })
    }

    setHealthStatuses(statuses)
    setLastCheckTime(new Date())
  }

  const getOverallStatus = (): 'healthy' | 'degraded' | 'down' => {
    if (healthStatuses.some(s => s.status === 'down')) return 'down'
    if (healthStatuses.some(s => s.status === 'degraded')) return 'degraded'
    return 'healthy'
  }

  const overallStatus = getOverallStatus()
  const statusColors = {
    healthy: 'text-green-400',
    degraded: 'text-yellow-400',
    down: 'text-red-400'
  }

  const statusBgColors = {
    healthy: 'bg-green-900/30 border-green-500/50',
    degraded: 'bg-yellow-900/30 border-yellow-500/50',
    down: 'bg-red-900/30 border-red-500/50'
  }

  const StatusIcon = ({ status }: { status: 'healthy' | 'degraded' | 'down' }) => {
    if (status === 'healthy') return <CheckCircle2 className="w-4 h-4" />
    if (status === 'degraded') return <AlertCircle className="w-4 h-4" />
    return <XCircle className="w-4 h-4" />
  }

  return (
    <div className="relative">
      {/* Compact Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${statusBgColors[overallStatus]} hover:brightness-110`}
      >
        <Zap className={`w-4 h-4 ${statusColors[overallStatus]}`} />
        <span className={`text-sm font-semibold ${statusColors[overallStatus]}`}>
          {overallStatus === 'healthy' ? 'All Systems Healthy' :
           overallStatus === 'degraded' ? 'Systems Degraded' :
           'Systems Down'}
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-black/95 border-2 border-gray-700 rounded-lg shadow-2xl z-50 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                System Health Monitor
              </h3>
              <span className="text-xs text-gray-500">
                Updated {lastCheckTime.toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-2">
              {healthStatuses.map((status, index) => {
                const Icon = status.icon
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border ${
                      status.status === 'healthy' ? 'bg-green-900/10 border-green-500/20' :
                      status.status === 'degraded' ? 'bg-yellow-900/10 border-yellow-500/20' :
                      'bg-red-900/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${statusColors[status.status]}`} />
                      <span className="text-sm font-medium text-gray-300">
                        {status.service}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${statusColors[status.status]}`}>
                        {status.details}
                      </span>
                      <StatusIcon status={status.status} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
              <button
                onClick={checkAllHealth}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Refresh Now
              </button>
              <span className="text-xs text-gray-500">
                Auto-refresh: 10s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
