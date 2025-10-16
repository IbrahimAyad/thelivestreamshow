import { useState, useEffect } from 'react'
import { supabase, AIEngagement } from '../lib/supabase'
import { Zap, Eye, Activity, Sparkles } from 'lucide-react'

export function AIEngagementPanel() {
  const [features, setFeatures] = useState<AIEngagement[]>([])

  useEffect(() => {
    loadFeatures()

    const channel = supabase
      .channel('ai_engagement_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_engagement'
      }, () => {
        loadFeatures()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadFeatures = async () => {
    const { data } = await supabase
      .from('ai_engagement')
      .select('*')
    
    if (data) setFeatures(data as AIEngagement[])
  }

  const toggleFeature = async (id: string, isActive: boolean) => {
    await supabase
      .from('ai_engagement')
      .update({ 
        is_active: !isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  }

  const getFeature = (type: string) => features.find(f => f.feature_type === type)

  const FEATURE_CONFIGS = [
    {
      type: 'activity_pulse',
      label: 'Activity Pulse',
      description: 'Subtle animations showing stream activity',
      icon: Activity,
      color: 'blue'
    },
    {
      type: 'viewer_count',
      label: 'Viewer Count (Test Mode)',
      description: 'Display simulated viewer count for testing',
      icon: Eye,
      color: 'yellow'
    },
    {
      type: 'engagement_effects',
      label: 'Engagement Effects',
      description: 'Particle effects and visual enhancements',
      icon: Sparkles,
      color: 'purple'
    }
  ]

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Zap className="w-7 h-7 text-yellow-400" />
        AI Engagement Tools
      </h2>

      <div className="space-y-3">
        {FEATURE_CONFIGS.map((config) => {
          const feature = getFeature(config.type)
          const isActive = feature?.is_active || false
          const Icon = config.icon

          return (
            <div
              key={config.type}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-yellow-900/20 to-red-900/20 border-yellow-400'
                  : 'bg-gray-900 border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`w-6 h-6 mt-1 ${
                    isActive ? 'text-yellow-400' : 'text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <h3 className={`font-bold text-base mb-1 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {config.label}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {config.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => feature && toggleFeature(feature.id, isActive)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isActive ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-sm text-yellow-300">
        <p className="font-semibold">Ethical Note</p>
        <p className="text-xs mt-1">These features are clearly labeled as test/simulation mode. Always be transparent with your audience.</p>
      </div>
    </div>
  )
}
