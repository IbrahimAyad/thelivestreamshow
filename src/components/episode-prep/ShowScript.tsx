import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FileDown, Loader2, Radio, Eye, Printer, Search, Star } from 'lucide-react'

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
  const [ttsStatus, setTtsStatus] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [allQuestions, setAllQuestions] = useState<any[]>([]) // All questions with scores

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

      // Load ALL questions (approved + not approved) for runner-ups display
      const { data: allQuestionsData } = await supabase
        .from('episode_ai_content')
        .select('*')
        .eq('episode_info_id', episodeId)
        .eq('content_type', 'listener_question')
        .order('overall_score', { ascending: false })

      setAllQuestions(allQuestionsData || [])

      // Load all approved content
      const { data: aiContent } = await supabase
        .from('episode_ai_content')
        .select('*')
        .eq('episode_info_id', episodeId)
        .eq('is_approved', true)

      // Load TTS status from show_questions
      const { data: showQuestions } = await supabase
        .from('show_questions')
        .select('question_text, tts_generated')
        .eq('topic', 'AI Generated')

      const ttsMap: Record<string, boolean> = {}
      for (const q of showQuestions || []) {
        ttsMap[q.question_text] = q.tts_generated
      }
      setTtsStatus(ttsMap)

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
          // Add TTS status and auto_approved flag
          organized[segmentId].questions.push({
            ...item.content_data,
            auto_approved: item.auto_approved,
            tts_ready: ttsMap[item.content_data.question] || false
          })
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

  const exportAsHTML = () => {
    const html = generateHTMLScript()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const newWindow = window.open(url, '_blank')
    if (newWindow) {
      newWindow.document.title = `Episode ${episodeInfo?.episode_number} - Broadcast Script`
    }
    URL.revokeObjectURL(url)
  }

  const generateHTMLScript = () => {
    const approved = allQuestions.filter(q => q.is_approved)
    const notApproved = allQuestions.filter(q => !q.is_approved)

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Episode ${episodeInfo?.episode_number} - Broadcast Script</title>
  <style>
    @media print {
      body {
        font-size: 14pt;
        line-height: 1.6;
      }
      .segment {
        page-break-after: always;
      }
      .no-print { display: none; }
      h1 { font-size: 28pt; }
      h2 { font-size: 20pt; margin-top: 0; }
      h3 { font-size: 16pt; }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
      color: #000;
    }

    h1 {
      font-size: 36px;
      margin-bottom: 10px;
      border-bottom: 4px solid #0ea5e9;
      padding-bottom: 10px;
    }

    h2 {
      font-size: 28px;
      margin-top: 40px;
      color: #0ea5e9;
      border-left: 6px solid #0ea5e9;
      padding-left: 15px;
    }

    h3 {
      font-size: 20px;
      margin-top: 30px;
      color: #6366f1;
    }

    .meta {
      font-size: 18px;
      color: #666;
      margin-bottom: 30px;
    }

    .segment {
      margin-bottom: 60px;
    }

    .duration {
      float: right;
      background: #f0f9ff;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: bold;
      color: #0284c7;
    }

    .news-story {
      background: #f8fafc;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
    }

    .layer {
      margin: 15px 0;
      padding-left: 20px;
    }

    .layer-label {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .layer-1 { border-left: 4px solid #06b6d4; }
    .layer-2 { border-left: 4px solid #a855f7; }
    .layer-3 { border-left: 4px solid #ec4899; }

    .question {
      background: #fefce8;
      padding: 20px;
      margin: 15px 0;
      border-radius: 8px;
      border: 2px solid #eab308;
    }

    .question-text {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 10px;
      line-height: 1.8;
    }

    .question-meta {
      font-size: 13px;
      color: #666;
      display: flex;
      gap: 20px;
      margin-top: 10px;
    }

    .tts-ready {
      background: #dcfce7;
      border-color: #22c55e;
      border-left: 6px solid #22c55e;
    }

    .tts-pending {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .auto-selected {
      border: 3px solid #fbbf24;
      box-shadow: 0 4px 6px rgba(251, 191, 36, 0.2);
    }

    .talking-point {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 16px;
      line-height: 1.7;
    }

    .clip-line {
      background: #f1f5f9;
      padding: 15px 20px;
      margin: 10px 0;
      border-left: 5px solid #f472b6;
      font-style: italic;
      font-size: 17px;
    }

    .summary-box {
      background: #dbeafe;
      border: 2px solid #3b82f6;
      padding: 20px;
      margin: 30px 0;
      border-radius: 12px;
    }

    .summary-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .summary-item {
      background: white;
      padding: 12px;
      border-radius: 8px;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }

    .badge-success { background: #22c55e; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    .badge-star { background: #fbbf24; color: #78350f; }

    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #0ea5e9;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
      z-index: 1000;
    }

    .print-btn:hover {
      background: #0284c7;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print Script</button>

  <h1>${episodeInfo?.episode_title || 'SHOW SCRIPT'}</h1>
  <div class="meta">
    <strong>Episode #${episodeInfo?.episode_number}</strong> • ${episodeInfo?.episode_date}<br>
    <strong>Topic:</strong> ${episodeInfo?.episode_topic}
  </div>

  <div class="summary-box no-print">
    <div class="summary-title">✅ Auto-Approval Summary</div>
    <div class="summary-grid">
      <div class="summary-item">
        <strong>Auto-Selected Questions:</strong> ${approved.length}
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          Avg TTS Score: ${(approved.reduce((sum, q) => sum + (q.content_data?.tts_suitability_score || 0), 0) / approved.length || 0).toFixed(1)}/10
        </div>
      </div>
      <div class="summary-item">
        <strong>Runner-Up Questions:</strong> ${notApproved.length}
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          Available in archive
        </div>
      </div>
      <div class="summary-item">
        <strong>News Stories:</strong> ${Object.values(content).reduce((sum: number, seg: any) => sum + (seg.news?.length || 0), 0)}
      </div>
      <div class="summary-item">
        <strong>Talking Points:</strong> ${Object.values(content).reduce((sum: number, seg: any) => sum + (seg.talkingPoints?.length || 0), 0)}
      </div>
    </div>
  </div>
`

    for (const segment of segments) {
      const segmentContent = content[segment.id] || {}
      const icon = getSegmentIcon(segment.segment_type)

      html += `
  <div class="segment">
    <h2>${icon} SEGMENT ${segment.segment_number}: ${segment.title.toUpperCase()}</h2>
    ${segment.planned_duration_seconds ? `<span class="duration">⏱️ ${formatDuration(segment.planned_duration_seconds)}</span>` : ''}
    <div style="clear: both;"></div>
`

      if (segmentContent.news?.length > 0) {
        html += `<h3>📰 NEWS STORIES</h3>`
        segmentContent.news.forEach((story: NewsStory, i: number) => {
          html += `
    <div class="news-story">
      <strong style="font-size: 18px;">${i + 1}. ${story.title}</strong>
      <div class="layer layer-1">
        <div class="layer-label">🔵 Layer 1 (Surface)</div>
        ${story.layer1_surface}
      </div>
      <div class="layer layer-2">
        <div class="layer-label">🟣 Layer 2 (Reality)</div>
        ${story.layer2_reality}
      </div>
      <div class="layer layer-3">
        <div class="layer-label">🔴 Layer 3 (Narrative)</div>
        ${story.layer3_narrative}
      </div>
    </div>
`
        })
      }

      if (segmentContent.questions?.length > 0) {
        html += `<h3>❓ LISTENER QUESTIONS</h3>`
        segmentContent.questions.forEach((q: any, i: number) => {
          const ttsReady = q.tts_ready
          const autoSelected = q.auto_approved
          const classes = `question ${ttsReady ? 'tts-ready' : 'tts-pending'} ${autoSelected ? 'auto-selected' : ''}`

          html += `
    <div class="${classes}">
      <div style="font-size: 14px; font-weight: bold; color: #666; margin-bottom: 8px;">
        Q${i + 1}
        ${ttsReady ? '<span class="badge badge-success">✅ TTS Ready</span>' : '<span class="badge badge-warning">⏳ Generating</span>'}
        ${autoSelected ? '<span class="badge badge-star">⭐ Auto-Selected</span>' : ''}
      </div>
      <div class="question-text">"${q.question}"</div>
      <div class="question-meta">
        <span>📊 TTS: ${q.tts_suitability_score || 0}/10</span>
        <span>🎯 Relevance: ${q.relevance_score || 0}/10</span>
        <span>⚡ Engagement: ${q.engagement_score || 0}/10</span>
      </div>
    </div>
`
        })
      }

      if (segmentContent.talkingPoints?.length > 0) {
        html += `<h3>💡 HOST TALKING POINTS</h3>`
        segmentContent.talkingPoints.forEach((point: TalkingPoint, i: number) => {
          html += `<div class="talking-point">${i + 1}. ${point.text}</div>`
        })
      }

      if (segmentContent.clipLines?.length > 0) {
        html += `<h3>💬 CLIP LINES</h3>`
        segmentContent.clipLines.forEach((line: ClipLine) => {
          html += `<div class="clip-line">💬 "${line.text}"</div>`
        })
      }

      html += `</div>`
    }

    html += `
  <div style="margin-top: 60px; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center; color: #666;">
    🤖 Generated with AI Episode Prep<br>
    Powered by Perplexity AI<br>
    Export Date: ${new Date().toLocaleString()}
  </div>
</body>
</html>
`
    return html
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

          <div className="flex gap-3">
            <button
              onClick={exportAsHTML}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Script
            </button>
            <button
              onClick={exportAsMarkdown}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <FileDown className="w-5 h-5" />
              Export MD
            </button>
          </div>
        </div>

        {/* Auto-Approval Summary */}
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">✅ Auto-Approval Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Auto-Selected</p>
              <p className="text-2xl font-bold text-cyan-400">
                {allQuestions.filter(q => q.is_approved).length}
              </p>
              <p className="text-xs text-gray-500">
                Avg TTS: {(allQuestions.filter(q => q.is_approved).reduce((sum, q) => sum + (q.content_data?.tts_suitability_score || 0), 0) / (allQuestions.filter(q => q.is_approved).length || 1)).toFixed(1)}/10
              </p>
            </div>
            <div>
              <p className="text-gray-400">Runner-Ups</p>
              <p className="text-2xl font-bold text-purple-400">
                {allQuestions.filter(q => !q.is_approved).length}
              </p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
            <div>
              <p className="text-gray-400">News Stories</p>
              <p className="text-2xl font-bold text-green-400">
                {Object.values(content).reduce((sum: number, seg: any) => sum + (seg.news?.length || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Talking Points</p>
              <p className="text-2xl font-bold text-yellow-400">
                {Object.values(content).reduce((sum: number, seg: any) => sum + (seg.talkingPoints?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions, news, talking points..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Segment Navigation */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-3">Jump to Segment:</p>
        <div className="flex gap-2 flex-wrap">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => {
                const el = document.getElementById(`segment-${segment.id}`)
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setActiveSegmentId(segment.id)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSegmentId === segment.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {getSegmentIcon(segment.segment_type)} #{segment.segment_number}
            </button>
          ))}
        </div>
      </div>

      {/* Show Script Content */}
      <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-8 max-h-[800px] overflow-y-auto">
        <div className="space-y-12">
          {segments.map((segment) => {
            const icon = getSegmentIcon(segment.segment_type)

            // Filter content by search query
            const segmentContent = content[segment.id] || {}
            const filteredContent = {
              news: segmentContent.news?.filter((s: NewsStory) =>
                !searchQuery ||
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.layer1_surface.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.layer2_reality.toLowerCase().includes(searchQuery.toLowerCase())
              ),
              questions: segmentContent.questions?.filter((q: Question) =>
                !searchQuery ||
                q.question.toLowerCase().includes(searchQuery.toLowerCase())
              ),
              talkingPoints: segmentContent.talkingPoints?.filter((p: TalkingPoint) =>
                !searchQuery ||
                p.text.toLowerCase().includes(searchQuery.toLowerCase())
              ),
              clipLines: segmentContent.clipLines?.filter((c: ClipLine) =>
                !searchQuery ||
                c.text.toLowerCase().includes(searchQuery.toLowerCase())
              )
            }

            // Skip segment if no matching content
            if (searchQuery && !filteredContent.news?.length && !filteredContent.questions?.length && !filteredContent.talkingPoints?.length && !filteredContent.clipLines?.length) {
              return null
            }

            return (
              <div key={segment.id} id={`segment-${segment.id}`} className="border-b border-gray-700 pb-8 last:border-b-0 scroll-mt-6">
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
                {filteredContent.news?.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📰</span> NEWS STORIES
                    </h4>
                    <div className="space-y-6">
                      {filteredContent.news.map((story: NewsStory, i: number) => (
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
                {filteredContent.questions?.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">❓</span> LISTENER QUESTIONS
                    </h4>
                    <div className="space-y-4">
                      {filteredContent.questions.map((q: any, i: number) => {
                        const ttsReady = q.tts_ready
                        const autoSelected = q.auto_approved

                        return (
                          <div
                            key={i}
                            className={`border rounded-lg p-5 ${
                              ttsReady
                                ? 'bg-green-900/10 border-green-500/50'
                                : 'bg-yellow-900/10 border-yellow-500/50'
                            } ${autoSelected ? 'ring-2 ring-yellow-400' : ''}`}
                          >
                            <div className="flex items-start gap-4">
                              <span className="text-2xl font-bold text-cyan-400 mt-1">Q{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {ttsReady ? (
                                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-semibold">
                                      ✅ TTS Ready
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded font-semibold">
                                      ⏳ Generating
                                    </span>
                                  )}
                                  {autoSelected && (
                                    <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded font-semibold flex items-center gap-1">
                                      <Star className="w-3 h-3" /> Auto-Selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-lg text-white leading-relaxed mb-3">{q.question}</p>
                                <div className="flex gap-4 text-xs text-gray-400">
                                  <span>📊 TTS: {q.tts_suitability_score}/10</span>
                                  <span>🎯 Relevance: {q.relevance_score}/10</span>
                                  <span>⚡ Engagement: {q.engagement_score}/10</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Talking Points */}
                {filteredContent.talkingPoints?.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">💡</span> HOST TALKING POINTS
                    </h4>
                    <ul className="space-y-2">
                      {filteredContent.talkingPoints.map((point: TalkingPoint, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span className="leading-relaxed">{point.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Clip Lines */}
                {filteredContent.clipLines?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">💬</span> CLIP LINES
                    </h4>
                    <div className="space-y-3">
                      {filteredContent.clipLines.map((line: ClipLine, i: number) => (
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
