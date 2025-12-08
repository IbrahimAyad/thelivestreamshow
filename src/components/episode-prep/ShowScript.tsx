import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FileDown, Loader2, Radio, Eye } from 'lucide-react'

interface ShowScriptProps {
  episodeId: string
}

interface SegmentData {
  id: string
  segment_number: number
  title: string
  segment_type: string
  planned_duration_seconds: number | null
}

interface NewsStory {
  title: string
  layer1_surface: string
  layer2_reality: string
  layer3_narrative: string
}

interface Question {
  question: string
  relevance_score: number
  engagement_score: number
  tts_suitability_score: number
}

interface TalkingPoint {
  text: string
}

interface ClipLine {
  text: string
}

export function ShowScript({ episodeId }: ShowScriptProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [segments, setSegments] = useState<SegmentData[]>([])
  const [content, setContent] = useState<any>({})
  const [episodeInfo, setEpisodeInfo] = useState<any>(null)

  useEffect(() => {
    loadShowScript()
  }, [episodeId])

  const loadShowScript = async () => {
    setIsLoading(true)

    try {
      // Load episode info
      const { data: episode } = await supabase
        .from('episode_info')
        .select('*')
        .eq('id', episodeId)
        .single()

      setEpisodeInfo(episode)

      // Load all segments
      const { data: segmentsData } = await supabase
        .from('episode_segments')
        .select('*')
        .eq('episode_info_id', episodeId)
        .order('segment_number', { ascending: true })

      setSegments(segmentsData || [])

      // Load all approved content
      const { data: aiContent } = await supabase
        .from('episode_ai_content')
        .select('*')
        .eq('episode_info_id', episodeId)
        .eq('is_approved', true)

      // Organize content by segment
      const organized: any = {}
      for (const item of aiContent || []) {
        const segmentId = item.segment_id
        if (!organized[segmentId]) {
          organized[segmentId] = {
            news: [],
            questions: [],
            talkingPoints: [],
            clipLines: []
          }
        }

        if (item.content_type === 'news_story') {
          organized[segmentId].news.push(item.content_data)
        } else if (item.content_type === 'listener_question') {
          organized[segmentId].questions.push(item.content_data)
        } else if (item.content_type === 'talking_point') {
          organized[segmentId].talkingPoints.push(item.content_data)
        } else if (item.content_type === 'clip_line') {
          organized[segmentId].clipLines.push(item.content_data)
        }
      }

      setContent(organized)
    } catch (error) {
      console.error('Error loading show script:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSegmentIcon = (type: string) => {
    switch (type) {
      case 'trending_news': return '📰'
      case 'real_estate_qa': return '🏠'
      case 'deal_structures': return '💼'
      case 'audience_interaction': return '💬'
      case 'reality_breakdown': return '🔍'
      case 'intro': return '🎬'
      case 'closing': return '👋'
      default: return '⭐'
    }
  }

  const exportAsMarkdown = () => {
    let markdown = `# ${episodeInfo?.episode_title || 'SHOW SCRIPT'}\n\n`
    markdown += `**Episode #${episodeInfo?.episode_number}** • ${episodeInfo?.episode_date}\n\n`
    markdown += `**Topic:** ${episodeInfo?.episode_topic}\n\n`
    markdown += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    for (const segment of segments) {
      const segmentContent = content[segment.id] || {}
      const icon = getSegmentIcon(segment.segment_type)

      // Segment header with extra spacing
      markdown += `\n\n## ${icon} SEGMENT ${segment.segment_number}: ${segment.title.toUpperCase()}\n\n`

      if (segment.planned_duration_seconds) {
        markdown += `⏱️ **Duration:** ${formatDuration(segment.planned_duration_seconds)}\n\n`
      }

      markdown += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      // News stories with clear separation
      if (segmentContent.news?.length > 0) {
        markdown += `### 📰 NEWS STORIES\n\n`
        segmentContent.news.forEach((story: NewsStory, i: number) => {
          markdown += `**${i + 1}. ${story.title}**\n\n`
          markdown += `🔵 **Layer 1 (Surface)**  \n${story.layer1_surface}\n\n`
          markdown += `🟣 **Layer 2 (Reality)**  \n${story.layer2_reality}\n\n`
          markdown += `🔴 **Layer 3 (Narrative)**  \n${story.layer3_narrative}\n\n`
          markdown += `────────────────────────────────────────────────────────────────\n\n`
        })
      }

      // Questions with numbered format
      if (segmentContent.questions?.length > 0) {
        markdown += `### ❓ LISTENER QUESTIONS (TTS Ready ✅)\n\n`
        segmentContent.questions.forEach((q: Question, i: number) => {
          markdown += `**Q${i + 1}**\n\n`
          markdown += `"${q.question}"\n\n`
          markdown += `📊 TTS: ${q.tts_suitability_score}/10 | Relevance: ${q.relevance_score}/10 | Engagement: ${q.engagement_score}/10\n\n`
          markdown += `\n`
        })
      }

      // Talking points with clear bullets
      if (segmentContent.talkingPoints?.length > 0) {
        markdown += `### 💡 HOST TALKING POINTS\n\n`
        segmentContent.talkingPoints.forEach((point: TalkingPoint, i: number) => {
          markdown += `${i + 1}. ${point.text}\n\n`
        })
      }

      // Clip lines with quotation styling
      if (segmentContent.clipLines?.length > 0) {
        markdown += `### 💬 CLIP LINES\n\n`
        segmentContent.clipLines.forEach((line: ClipLine) => {
          markdown += `> 💬 "${line.text}"\n\n`
        })
      }

      markdown += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    }

    // Footer
    markdown += `\n\n---\n\n`
    markdown += `🤖 Generated with AI Episode Prep  \n`
    markdown += `Powered by Perplexity AI  \n`
    markdown += `Export Date: ${new Date().toLocaleString()}\n`

    // Download markdown file
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Episode-${episodeInfo?.episode_number}-Broadcast-Script.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (segments.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
        <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Show Script Yet</h3>
        <p className="text-gray-400">Import a script and generate AI content first</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Radio className="w-8 h-8 text-cyan-400" />
              <div>
                <h2 className="text-3xl font-bold text-white">{episodeInfo?.episode_title}</h2>
                <p className="text-cyan-200/70 text-sm">Broadcast-Ready Show Script</p>
              </div>
            </div>
            <div className="ml-11 space-y-1">
              <p className="text-white font-semibold">
                Episode #{episodeInfo?.episode_number} • {episodeInfo?.episode_date}
              </p>
              <p className="text-gray-400 text-sm">{episodeInfo?.episode_topic}</p>
            </div>
          </div>

          <button
            onClick={exportAsMarkdown}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <FileDown className="w-5 h-5" />
            Export Script
          </button>
        </div>
      </div>

      {/* Show Script Content */}
      <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-8 max-h-[800px] overflow-y-auto">
        <div className="space-y-12">
          {segments.map((segment) => {
            const segmentContent = content[segment.id] || {}
            const icon = getSegmentIcon(segment.segment_type)

            return (
              <div key={segment.id} className="border-b border-gray-700 pb-8 last:border-b-0">
                {/* Segment Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-cyan-400">
                      {icon} SEGMENT {segment.segment_number}: {segment.title.toUpperCase()}
                    </h3>
                    {segment.planned_duration_seconds && (
                      <span className="text-sm text-gray-400 font-mono">
                        Duration: {formatDuration(segment.planned_duration_seconds)}
                      </span>
                    )}
                  </div>
                  <div className="h-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full" />
                </div>

                {/* News Stories */}
                {segmentContent.news?.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📰</span> NEWS STORIES
                    </h4>
                    <div className="space-y-6">
                      {segmentContent.news.map((story: NewsStory, i: number) => (
                        <div key={i} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                          <h5 className="text-xl font-bold text-white mb-4">{story.title}</h5>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-semibold text-cyan-400 mb-1">Layer 1 (Surface)</p>
                              <p className="text-gray-300 leading-relaxed">{story.layer1_surface}</p>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-purple-400 mb-1">Layer 2 (Reality)</p>
                              <p className="text-gray-300 leading-relaxed">{story.layer2_reality}</p>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-pink-400 mb-1">Layer 3 (Narrative)</p>
                              <p className="text-gray-300 leading-relaxed">{story.layer3_narrative}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions */}
                {segmentContent.questions?.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">❓</span> LISTENER QUESTIONS
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                        TTS READY
                      </span>
                    </h4>
                    <div className="space-y-4">
                      {segmentContent.questions.map((q: Question, i: number) => (
                        <div key={i} className="bg-gray-900/50 border border-gray-700 rounded-lg p-5">
                          <div className="flex items-start gap-4">
                            <span className="text-2xl font-bold text-cyan-400 mt-1">Q{i + 1}</span>
                            <div className="flex-1">
                              <p className="text-lg text-white leading-relaxed mb-3">{q.question}</p>
                              <div className="flex gap-4 text-xs text-gray-400">
                                <span>TTS: {q.tts_suitability_score}/10</span>
                                <span>Relevance: {q.relevance_score}/10</span>
                                <span>Engagement: {q.engagement_score}/10</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Talking Points */}
                {segmentContent.talkingPoints?.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">💡</span> TALKING POINTS
                    </h4>
                    <ul className="space-y-2">
                      {segmentContent.talkingPoints.map((point: TalkingPoint, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span className="leading-relaxed">{point.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Clip Lines */}
                {segmentContent.clipLines?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">💬</span> CLIP LINES
                    </h4>
                    <div className="space-y-3">
                      {segmentContent.clipLines.map((line: ClipLine, i: number) => (
                        <div key={i} className="border-l-4 border-pink-500 pl-4 py-2 bg-pink-900/10">
                          <p className="text-white italic text-lg">"{line.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Tip */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <Eye className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-200">
          <p className="font-semibold mb-1">Pro Tip: Keep this script open during broadcast</p>
          <p className="text-blue-300/70">Reference news layers, questions, and talking points in real-time. All questions have TTS audio ready in the Ultra Chat tab.</p>
        </div>
      </div>
    </div>
  )
}
