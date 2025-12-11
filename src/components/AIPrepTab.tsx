import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useEpisodeInfo } from '../hooks/useEpisodeInfo'
import { Sparkles, FileText, Loader2, CheckCircle2, AlertCircle, Brain, MoreVertical, Trash2, Archive, Radio, Tv } from 'lucide-react'
import { clearEpisodeContent, archiveAndCreateNew, markAsReady, goLive } from '../lib/episodeManagement'
import { ScriptImporter } from './episode-prep/ScriptImporter'
import { PrepProgress } from './episode-prep/PrepProgress'
import { SegmentsList } from './episode-prep/SegmentsList'
import { ShowScript } from './episode-prep/ShowScript'

export function AIPrepTab() {
  const { episodeInfo } = useEpisodeInfo()
  const [prepProgress, setPrepProgress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'segments' | 'script'>('import')
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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

        // Show completion notification
        if (payload.new.prep_completion_percent === 100 && payload.old?.prep_completion_percent !== 100) {
          showCompletionNotification()
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to prep progress updates')
        }
        if (err) {
          console.warn('⚠️ Subscription error (non-critical):', err)
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }

  const showCompletionNotification = () => {
    // Create a simple notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-in'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">✅</span>
        <div>
          <p class="font-bold">Episode Ready for Broadcast!</p>
          <p class="text-sm opacity-90">All content generated and TTS ready</p>
        </div>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      notification.remove()
    }, 5000)
  }

  const handleClearEpisode = async () => {
    if (!episodeInfo) return

    if (!confirm('Clear all AI-generated content AND Ultra Chat messages for this episode? This cannot be undone.\n\nEpisode info will be kept, but all segments, questions, news, and Ultra Chat messages will be deleted.')) {
      return
    }

    setActionLoading(true)
    const result = await clearEpisodeContent(episodeInfo.id)
    setActionLoading(false)

    if (result.success) {
      const messages = []
      messages.push('✅ Episode content cleared successfully')
      messages.push('• AI content: Cleared')
      messages.push('• Segments: Cleared')
      messages.push('• Scripts: Cleared')
      if (result.questionCount && result.questionCount > 0) {
        messages.push(`• Ultra Chat: ${result.questionCount} messages removed`)
      }
      messages.push('• Progress: Reset to 0%')
      alert(messages.join('\n'))
      loadPrepProgress()
      setActiveSubTab('import')
    } else {
      alert('❌ Failed to clear episode. Check console for errors.')
    }

    setShowActionsMenu(false)
  }

  const handleArchiveAndCreateNew = async () => {
    if (!episodeInfo) return

    if (!confirm(`Archive Episode #${episodeInfo.episode_number} and create Episode #${(episodeInfo.episode_number || 0) + 1}?\n\nCurrent episode will be moved to archive, and a new episode will be created.`)) {
      return
    }

    setActionLoading(true)
    const result = await archiveAndCreateNew(episodeInfo.id)
    setActionLoading(false)

    if (result.success) {
      alert(`✅ Archived Episode #${episodeInfo.episode_number}\n📝 Created Episode #${result.newEpisode.episode_number}\n\nRefresh the page to see the new episode.`)
      window.location.reload()
    } else {
      alert('❌ Failed to archive and create new. Check console for errors.')
    }

    setShowActionsMenu(false)
  }

  const handleMarkAsReady = async () => {
    if (!episodeInfo) return

    setActionLoading(true)
    const result = await markAsReady(episodeInfo.id)
    setActionLoading(false)

    if (result.success) {
      alert('✅ Episode marked as ready for broadcast')
      loadPrepProgress()
    } else {
      alert('❌ Failed to mark as ready. Check console for errors.')
    }

    setShowActionsMenu(false)
  }

  const handleGoLive = async () => {
    if (!episodeInfo) return

    if (!confirm('Set this episode to LIVE status?\n\nThis will lock the episode from further editing.')) {
      return
    }

    setActionLoading(true)
    const result = await goLive(episodeInfo.id)
    setActionLoading(false)

    if (result.success) {
      alert('🔴 Episode is now LIVE!')
      loadPrepProgress()
    } else {
      alert('❌ Failed to go live. Check console for errors.')
    }

    setShowActionsMenu(false)
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

          {/* Prep Status Badge and Actions */}
          <div className="flex items-start gap-4">
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

            {/* Episode Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-50">
                  <div className="p-2">
                    <p className="text-xs text-gray-400 px-3 py-2 font-semibold">Episode Actions</p>

                    <button
                      onClick={handleMarkAsReady}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded text-left text-sm text-white transition-colors"
                    >
                      <Tv className="w-4 h-4 text-blue-400" />
                      Mark as Ready for Broadcast
                    </button>

                    <button
                      onClick={handleGoLive}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded text-left text-sm text-white transition-colors"
                    >
                      <Radio className="w-4 h-4 text-red-400" />
                      Go Live
                    </button>

                    <div className="h-px bg-gray-700 my-2" />

                    <button
                      onClick={handleArchiveAndCreateNew}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded text-left text-sm text-white transition-colors"
                    >
                      <Archive className="w-4 h-4 text-purple-400" />
                      Archive & Start New Episode
                    </button>

                    <button
                      onClick={handleClearEpisode}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-900/30 rounded text-left text-sm text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Episode Content
                    </button>
                  </div>
                </div>
              )}
            </div>
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
          onClick={() => setActiveSubTab('script')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'script'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          disabled={!prepProgress || prepProgress.total_ai_content_generated === 0}
        >
          <CheckCircle2 className="w-4 h-4" />
          Show Script
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
              setActiveSubTab('script')
            }}
          />
        )}

        {activeSubTab === 'script' && (
          <ShowScript
            episodeId={episodeInfo.id}
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
