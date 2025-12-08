import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useEpisodeInfo } from '../hooks/useEpisodeInfo'
import { Sparkles, FileText, Loader2, CheckCircle2, AlertCircle, Brain } from 'lucide-react'
import { ScriptImporter } from './episode-prep/ScriptImporter'
import { PrepProgress } from './episode-prep/PrepProgress'
import { SegmentsList } from './episode-prep/SegmentsList'
import { AIContentReview } from './episode-prep/AIContentReview'

export function AIPrepTab() {
  const { episodeInfo } = useEpisodeInfo()
  const [prepProgress, setPrepProgress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'segments' | 'review'>('import')

  useEffect(() => {
    if (episodeInfo) {
      loadPrepProgress()
      subscribeToProgress()
    }
  }, [episodeInfo])

  const loadPrepProgress = async () => {
    if (!episodeInfo) return

    const { data, error } = await supabase
      .from('episode_prep_progress')
      .select('*')
      .eq('episode_info_id', episodeInfo.id)
      .maybeSingle()

    if (error) {
      console.error('Error loading prep progress:', error)
    } else if (data) {
      setPrepProgress(data)
    } else {
      // Create initial progress record
      const { data: newProgress, error: createError } = await supabase
        .from('episode_prep_progress')
        .insert({
          episode_info_id: episodeInfo.id,
          prep_status: 'not_started'
        })
        .select()
        .single()

      if (!createError && newProgress) {
        setPrepProgress(newProgress)
      }
    }

    setIsLoading(false)
  }

  const subscribeToProgress = () => {
    if (!episodeInfo) return

    const channel = supabase
      .channel('episode_prep_progress_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_prep_progress',
        filter: `episode_info_id=eq.${episodeInfo.id}`
      }, (payload) => {
        console.log('📊 Prep progress updated:', payload)
        setPrepProgress(payload.new)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  if (!episodeInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Episode</h3>
          <p className="text-gray-400">Create an episode in the Overview tab first</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Episode Info */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <Brain className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Episode Prep</h2>
                <p className="text-purple-200/70 text-sm">Powered by Perplexity AI</p>
              </div>
            </div>
            <div className="ml-11 space-y-1">
              <p className="text-white font-semibold">
                Episode #{episodeInfo.episode_number} · {episodeInfo.episode_title}
              </p>
              <p className="text-gray-400 text-sm">{episodeInfo.episode_topic}</p>
              <p className="text-gray-500 text-xs">{episodeInfo.episode_date}</p>
            </div>
          </div>

          {/* Prep Status Badge */}
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={prepProgress?.prep_status || 'not_started'} />
            {prepProgress && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Completion</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {prepProgress.prep_completion_percent || 0}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {prepProgress && <PrepProgress progress={prepProgress} />}

      {/* Sub-Tab Navigation */}
      <div className="flex gap-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
        <button
          onClick={() => setActiveSubTab('import')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'import'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Import Script
        </button>
        <button
          onClick={() => setActiveSubTab('segments')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'segments'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          disabled={!prepProgress || prepProgress.prep_status === 'not_started'}
        >
          <Sparkles className="w-4 h-4" />
          Segments ({prepProgress?.total_segments || 0})
        </button>
        <button
          onClick={() => setActiveSubTab('review')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'review'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          disabled={!prepProgress || prepProgress.total_ai_content_generated === 0}
        >
          <CheckCircle2 className="w-4 h-4" />
          Review Content ({prepProgress?.ai_content_approved || 0}/{prepProgress?.total_ai_content_generated || 0})
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeSubTab === 'import' && (
          <ScriptImporter
            episodeId={episodeInfo.id}
            onScriptParsed={() => {
              loadPrepProgress()
              setActiveSubTab('segments')
            }}
          />
        )}

        {activeSubTab === 'segments' && (
          <SegmentsList
            episodeId={episodeInfo.id}
            onContentGenerated={() => {
              loadPrepProgress()
              setActiveSubTab('review')
            }}
          />
        )}

        {activeSubTab === 'review' && (
          <AIContentReview
            episodeId={episodeInfo.id}
            onApprovalChange={() => loadPrepProgress()}
          />
        )}
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    not_started: { label: 'Not Started', color: 'gray', icon: AlertCircle },
    script_imported: { label: 'Script Imported', color: 'blue', icon: FileText },
    ai_generating: { label: 'AI Generating...', color: 'purple', icon: Loader2 },
    reviewing: { label: 'Reviewing', color: 'amber', icon: CheckCircle2 },
    ready_for_broadcast: { label: 'Ready!', color: 'green', icon: CheckCircle2 },
    live: { label: 'LIVE', color: 'red', icon: Sparkles },
    completed: { label: 'Completed', color: 'green', icon: CheckCircle2 },
    archived: { label: 'Archived', color: 'gray', icon: FileText }
  }

  const config = statusConfig[status] || statusConfig.not_started
  const Icon = config.icon

  const colorClasses = {
    gray: 'bg-gray-600/20 border-gray-500 text-gray-300',
    blue: 'bg-blue-600/20 border-blue-500 text-blue-300',
    purple: 'bg-purple-600/20 border-purple-500 text-purple-300',
    amber: 'bg-amber-600/20 border-amber-500 text-amber-300',
    green: 'bg-green-600/20 border-green-500 text-green-300',
    red: 'bg-red-600/20 border-red-500 text-red-300 animate-pulse'
  }

  return (
    <div className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm flex items-center gap-2 ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <Icon className={`w-4 h-4 ${status === 'ai_generating' ? 'animate-spin' : ''}`} />
      {config.label}
    </div>
  )
}
