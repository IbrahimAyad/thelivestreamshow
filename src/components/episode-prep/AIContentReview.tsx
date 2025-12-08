import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, X, Send, Newspaper, MessageSquare, Quote, Lightbulb } from 'lucide-react'

interface AIContentReviewProps {
  episodeId: string
  onApprovalChange: () => void
}

export function AIContentReview({ episodeId, onApprovalChange }: AIContentReviewProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'questions' | 'clips' | 'points'>('news')
  const [content, setContent] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadContent()
    subscribeToContent()
  }, [episodeId, activeTab])

  const loadContent = async () => {
    const contentTypeMap = {
      news: 'news_story',
      questions: 'listener_question',
      clips: 'clip_line',
      points: 'talking_point'
    }

    const { data, error } = await supabase
      .from('episode_ai_content')
      .select('*')
      .eq('episode_info_id', episodeId)
      .eq('content_type', contentTypeMap[activeTab])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading AI content:', error)
    } else {
      setContent(data || [])
    }

    setIsLoading(false)
  }

  const subscribeToContent = () => {
    const channel = supabase
      .channel('ai_content_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_ai_content',
        filter: `episode_info_id=eq.${episodeId}`
      }, () => {
        loadContent()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleApprove = async (item: any) => {
    const { error } = await supabase
      .from('episode_ai_content')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString()
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error approving content:', error)
    } else {
      onApprovalChange()
      loadContent()
    }
  }

  const handleReject = async (item: any) => {
    const { error } = await supabase
      .from('episode_ai_content')
      .delete()
      .eq('id', item.id)

    if (error) {
      console.error('Error rejecting content:', error)
    } else {
      onApprovalChange()
      loadContent()
    }
  }

  const handleQueueForBroadcast = async () => {
    const approvedContent = content.filter(c => c.is_approved)

    if (approvedContent.length === 0) {
      alert('No approved content to queue')
      return
    }

    // Queue different content types to appropriate tables
    if (activeTab === 'news') {
      await queueNewsStories(approvedContent)
    } else if (activeTab === 'questions') {
      await queueQuestions(approvedContent)
    }

    alert(`Queued ${approvedContent.length} items for broadcast!`)
  }

  const queueNewsStories = async (stories: any[]) => {
    for (const item of stories) {
      const story = item.content_data

      // Insert to morning_news_stories table
      const { error } = await supabase
        .from('morning_news_stories')
        .insert({
          headline: story.title,
          category: 'general',
          source: 'AI Generated',
          is_visible: true,
          display_order: 1
        })

      if (error) {
        console.error('Error queueing news story:', error)
      } else {
        // Mark as queued
        await supabase
          .from('episode_ai_content')
          .update({
            was_queued_for_broadcast: true,
            queued_at: new Date().toISOString()
          })
          .eq('id', item.id)
      }
    }
  }

  const queueQuestions = async (questions: any[]) => {
    for (const item of questions) {
      const q = item.content_data

      // Insert to show_questions table
      const { error } = await supabase
        .from('show_questions')
        .insert({
          topic: 'AI Generated',
          question_text: q.question,
          tts_generated: false,
          is_played: false,
          show_on_overlay: false
        })

      if (error) {
        console.error('Error queueing question:', error)
      } else {
        // Mark as queued
        await supabase
          .from('episode_ai_content')
          .update({
            was_queued_for_broadcast: true,
            queued_at: new Date().toISOString()
          })
          .eq('id', item.id)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Queue button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Review AI-Generated Content</h3>
          <p className="text-gray-400 text-sm">Approve content to queue for broadcast</p>
        </div>

        <button
          onClick={handleQueueForBroadcast}
          disabled={content.filter(c => c.is_approved).length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Queue Approved ({content.filter(c => c.is_approved).length})
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
        <TabButton
          active={activeTab === 'news'}
          onClick={() => setActiveTab('news')}
          icon={Newspaper}
          label="News Stories"
          count={content.filter(c => c.content_type === 'news_story').length}
        />
        <TabButton
          active={activeTab === 'questions'}
          onClick={() => setActiveTab('questions')}
          icon={MessageSquare}
          label="Questions"
          count={content.filter(c => c.content_type === 'listener_question').length}
        />
        <TabButton
          active={activeTab === 'clips'}
          onClick={() => setActiveTab('clips')}
          icon={Quote}
          label="Clip Lines"
          count={content.filter(c => c.content_type === 'clip_line').length}
        />
        <TabButton
          active={activeTab === 'points'}
          onClick={() => setActiveTab('points')}
          icon={Lightbulb}
          label="Talking Points"
          count={content.filter(c => c.content_type === 'talking_point').length}
        />
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {content.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No {activeTab} generated yet</p>
            <p className="text-gray-500 text-sm mt-2">Generate AI content from segments first</p>
          </div>
        ) : (
          content.map((item) => (
            <ContentItem
              key={item.id}
              item={item}
              type={activeTab}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
        active
          ? 'bg-purple-600 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-purple-700' : 'bg-gray-700'}`}>
        {count}
      </span>
    </button>
  )
}

// Content Item Component
function ContentItem({ item, type, onApprove, onReject }: any) {
  const data = item.content_data

  const isApproved = item.is_approved
  const isQueued = item.was_queued_for_broadcast

  return (
    <div className={`bg-gray-900 border rounded-lg p-4 transition-all ${
      isApproved ? 'border-green-500/50 bg-green-900/10' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* News Story */}
          {type === 'news' && (
            <div className="space-y-2">
              <h4 className="text-white font-semibold">{data.title}</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-400">
                  <span className="text-cyan-400 font-semibold">Layer 1 (Surface):</span> {data.layer1_surface}
                </p>
                <p className="text-gray-400">
                  <span className="text-purple-400 font-semibold">Layer 2 (Reality):</span> {data.layer2_reality}
                </p>
                <p className="text-gray-400">
                  <span className="text-pink-400 font-semibold">Layer 3 (Narrative):</span> {data.layer3_narrative}
                </p>
              </div>
              {data.sources && data.sources.length > 0 && (
                <div className="text-xs text-gray-500">
                  Sources: {data.sources.map((s: string, i: number) => (
                    <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      [{i + 1}]
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Listener Question */}
          {type === 'questions' && (
            <div className="space-y-2">
              <p className="text-white">{data.question}</p>
              <div className="flex gap-3 text-xs">
                <span className="text-cyan-400">Relevance: {data.relevance_score}/10</span>
                <span className="text-purple-400">Engagement: {data.engagement_score}/10</span>
              </div>
            </div>
          )}

          {/* Clip Line */}
          {type === 'clips' && (
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-pink-400 mt-1 flex-shrink-0" />
              <p className="text-white italic">"{data.text}"</p>
            </div>
          )}

          {/* Talking Point */}
          {type === 'points' && (
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <p className="text-white">{data.text}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isApproved ? (
            <>
              <button
                onClick={onApprove}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={onReject}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-1.5 bg-green-900/30 border border-green-500 text-green-300 text-sm font-semibold rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Approved
              </div>
              {isQueued && (
                <span className="text-xs text-cyan-400">✓ Queued</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
