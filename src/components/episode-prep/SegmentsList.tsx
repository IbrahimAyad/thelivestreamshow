import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { generateAIContent } from '../../lib/api/contentGenerator'
import { Sparkles, Loader2, CheckCircle2, Clock, FileText } from 'lucide-react'

interface SegmentsListProps {
  episodeId: string
  onContentGenerated: () => void
}

export function SegmentsList({ episodeId, onContentGenerated }: SegmentsListProps) {
  const [segments, setSegments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generatingSegmentId, setGeneratingSegmentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSegments()
    subscribeToSegments()
  }, [episodeId])

  const loadSegments = async () => {
    const { data, error } = await supabase
      .from('episode_segments')
      .select('*')
      .eq('episode_info_id', episodeId)
      .order('segment_number', { ascending: true })

    if (error) {
      console.error('Error loading segments:', error)
      setError(error.message)
    } else {
      setSegments(data || [])
    }

    setIsLoading(false)
  }

  const subscribeToSegments = () => {
    const channel = supabase
      .channel('episode_segments_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_segments',
        filter: `episode_info_id=eq.${episodeId}`
      }, () => {
        loadSegments()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleGenerateContent = async (segment: any) => {
    setGeneratingSegmentId(segment.id)
    setError(null)

    try {
      console.log('🤖 Generating AI content for segment:', segment.title)

      // Update segment status
      await supabase
        .from('episode_segments')
        .update({ ai_generation_status: 'generating' })
        .eq('id', segment.id)

      // Generate AI content (news stories, questions, talking points)
      const aiContent = await generateAIContent(segment, episodeId)

      console.log('✅ AI content generated:', aiContent)

      // Update segment with AI content
      await supabase
        .from('episode_segments')
        .update({
          ai_generated_content: aiContent,
          ai_generation_status: 'completed'
        })
        .eq('id', segment.id)

      // Reload segments
      loadSegments()

      // Notify parent to update progress
      onContentGenerated()

    } catch (err: any) {
      console.error('❌ Error generating AI content:', err)
      setError(err.message)

      await supabase
        .from('episode_segments')
        .update({ ai_generation_status: 'failed' })
        .eq('id', segment.id)
    } finally {
      setGeneratingSegmentId(null)
    }
  }

  const handleGenerateAll = async () => {
    for (const segment of segments) {
      if (segment.ai_generation_status !== 'completed') {
        await handleGenerateContent(segment)
        // Wait 2 seconds between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (segments.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Segments Yet</h3>
        <p className="text-gray-400">Import a script first to detect segments</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate All button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Detected Segments ({segments.length})</h3>
          <p className="text-gray-400 text-sm">Generate AI content for each segment</p>
        </div>

        <button
          onClick={handleGenerateAll}
          disabled={generatingSegmentId !== null || segments.every(s => s.ai_generation_status === 'completed')}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate All
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Segments List */}
      <div className="space-y-4">
        {segments.map((segment, index) => {
          const isGenerating = generatingSegmentId === segment.id
          const isComplete = segment.ai_generation_status === 'completed'
          const hasFailed = segment.ai_generation_status === 'failed'

          return (
            <div
              key={segment.id}
              className={`bg-gray-900 border rounded-lg p-6 transition-all ${
                isComplete
                  ? 'border-green-500/50 bg-green-900/10'
                  : hasFailed
                  ? 'border-red-500/50 bg-red-900/10'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-cyan-400">#{index + 1}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{segment.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          segment.segment_type === 'trending_news'
                            ? 'bg-red-900/30 text-red-300'
                            : segment.segment_type === 'real_estate_qa'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {segment.segment_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {segment.planned_duration_seconds && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.floor(segment.planned_duration_seconds / 60)}m {segment.planned_duration_seconds % 60}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Generated Content Summary */}
                  {isComplete && segment.ai_generated_content && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-2">AI Generated Content:</p>
                      <div className="flex gap-4 text-xs">
                        {segment.ai_generated_content.news_stories?.length > 0 && (
                          <span className="text-cyan-400">
                            📰 {segment.ai_generated_content.news_stories.length} news stories
                          </span>
                        )}
                        {segment.ai_generated_content.questions?.length > 0 && (
                          <span className="text-purple-400">
                            ❓ {segment.ai_generated_content.questions.length} questions
                          </span>
                        )}
                        {segment.ai_generated_content.talking_points?.length > 0 && (
                          <span className="text-blue-400">
                            💡 {segment.ai_generated_content.talking_points.length} talking points
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <div>
                  {isComplete ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-semibold">Complete</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateContent(segment)}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate AI Content
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Segment Content Preview (collapsed) */}
              {segment.original_content && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                    View original script content...
                  </summary>
                  <div className="mt-2 p-3 bg-gray-800/30 rounded text-sm text-gray-400 max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {segment.original_content.substring(0, 500)}
                      {segment.original_content.length > 500 ? '...' : ''}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
