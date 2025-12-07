import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMorningNews, fetchCategoryNews, getDemoNews, NewsStory } from '../lib/api/morningNews'
import { Newspaper, RefreshCw, TrendingUp, Zap, Tv, Trophy, Sparkles, Eye, EyeOff, Radio } from 'lucide-react'

// Normalize categories to match database constraints
const normalizeCategory = (cat: string): string => {
  // Handle null/undefined
  if (!cat) {
    console.warn(`⚠️ Empty category normalized to "general"`)
    return 'general'
  }

  // Normalize: lowercase, trim, replace spaces/hyphens with underscore
  let normalized = cat.toLowerCase().trim().replace(/[\s-]+/g, '_')

  const validCategories = ['breaking', 'business', 'real_estate', 'tech', 'entertainment', 'sports', 'politics', 'general']

  if (!validCategories.includes(normalized)) {
    console.warn(`⚠️ Invalid category "${cat}" (normalized: "${normalized}") → "general"`)
    return 'general'
  }

  return normalized
}

export function MorningNewsControl() {
  const [newsStories, setNewsStories] = useState<NewsStory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set())
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30) // minutes

  useEffect(() => {
    loadStoriesFromDatabase()
  }, [])

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return

    const intervalMs = refreshInterval * 60 * 1000
    console.log(`📰 Auto-refresh enabled: fetching news every ${refreshInterval} minutes`)

    const timer = setInterval(() => {
      console.log('📰 Auto-refresh: Fetching latest news...')
      handleFetchNews()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [autoRefresh, refreshInterval])

  const loadStoriesFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('morning_news_stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (data && data.length > 0) {
        const stories: NewsStory[] = data.map(row => ({
          id: row.id,
          headline: row.headline,
          summary: row.summary,
          category: row.category,
          source: row.source,
          talkingPoints: row.talking_points || [],
          timestamp: row.created_at,
          isVisible: row.is_visible
        }))
        setNewsStories(stories)
        console.log(`📰 Loaded ${stories.length} stories from database`)
      } else {
        // Load demo news if database is empty
        setNewsStories(getDemoNews())
      }
    } catch (err) {
      console.error('Failed to load stories from database:', err)
      setNewsStories(getDemoNews())
    }
  }

  const handleFetchNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const stories = await fetchMorningNews()

      if (stories.length === 0) {
        throw new Error('No stories returned from API')
      }

      // Save to database and auto-show top 3 stories
      const storiesToInsert = stories.map((story, i) => {
        const normalizedCategory = normalizeCategory(story.category)
        return {
          headline: story.headline,
          summary: story.summary,
          category: normalizedCategory,
          source: story.source || 'Perplexity News',
          talking_points: story.talkingPoints,
          is_visible: i < 3, // Auto-show top 3 stories
          display_order: i + 1
        }
      })

      // Log what we're about to insert for debugging
      console.log('📊 Stories to insert:')
      storiesToInsert.forEach((s, i) => {
        console.log(`  [${i}] ${s.headline.substring(0, 50)}... → category: "${s.category}"`)
      })

      const { data: insertedData, error: insertError } = await supabase
        .from('morning_news_stories')
        .insert(storiesToInsert)
        .select()

      if (insertError) {
        console.error('❌ Error inserting stories:', insertError)
        console.error('❌ Full error details:', JSON.stringify(insertError, null, 2))
        console.error('❌ Attempted categories:', storiesToInsert.map(s => `"${s.category}"`).join(', '))
        console.error('❌ Valid categories are: breaking, business, real_estate, tech, entertainment, sports, politics, general')
        throw insertError
      }

      console.log(`✅ Fetched and saved ${stories.length} news stories (top 3 auto-visible)`)
      console.log(`📊 Inserted ${insertedData?.length || 0} stories to database`)

      setLastFetched(new Date())
      await loadStoriesFromDatabase()
    } catch (err: any) {
      console.error('Failed to fetch news:', err)
      setError(err.message || 'Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchCategory = async (category: string) => {
    setLoading(true)
    setError(null)

    try {
      const stories = await fetchCategoryNews(category)

      // Save to database and auto-show all category stories
      const storiesToInsert = stories.map((story, i) => {
        const normalizedCategory = normalizeCategory(story.category)
        return {
          headline: story.headline,
          summary: story.summary,
          category: normalizedCategory,
          source: story.source || 'Perplexity News',
          talking_points: story.talkingPoints,
          is_visible: true, // Auto-show category stories
          display_order: i + 1
        }
      })

      const { data: insertedData, error: insertError } = await supabase
        .from('morning_news_stories')
        .insert(storiesToInsert)
        .select()

      if (insertError) {
        console.error('❌ Error inserting category stories:', insertError)
        throw insertError
      }

      console.log(`✅ Fetched ${stories.length} ${category} stories (all visible)`)
      console.log(`📊 Inserted ${insertedData?.length || 0} ${category} stories`)

      await loadStoriesFromDatabase()
    } catch (err: any) {
      console.error(`Failed to fetch ${category} news:`, err)
      setError(err.message || `Failed to fetch ${category} news`)
    } finally {
      setLoading(false)
    }
  }

  const toggleStoryVisibility = async (storyId: string, isVisible: boolean) => {
    try {
      console.log(`🔄 Toggling story ${storyId} from ${isVisible} to ${!isVisible}`)
      const { data, error } = await supabase
        .from('morning_news_stories')
        .update({ is_visible: !isVisible })
        .eq('id', storyId)
        .select()

      if (error) {
        console.error('❌ Toggle error:', error)
        throw error
      }

      console.log(`✅ Story visibility toggled:`, data)
      await loadStoriesFromDatabase()
    } catch (err: any) {
      console.error('Failed to toggle story visibility:', err)
      setError(err.message || 'Failed to toggle story visibility')
    }
  }

  const clearAllStories = async () => {
    if (!confirm('Delete all news stories? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('morning_news_stories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (error) throw error

      await loadStoriesFromDatabase()
      console.log('✅ All stories cleared')
    } catch (err) {
      console.error('Failed to clear stories:', err)
      setError('Failed to clear stories')
    }
  }

  const showAllStories = async () => {
    try {
      const { error } = await supabase
        .from('morning_news_stories')
        .update({ is_visible: true })
        .eq('is_visible', false)

      if (error) throw error

      await loadStoriesFromDatabase()
      console.log('✅ All stories now visible')
    } catch (err) {
      console.error('Failed to show all stories:', err)
      setError('Failed to show all stories')
    }
  }

  const hideAllStories = async () => {
    try {
      const { error } = await supabase
        .from('morning_news_stories')
        .update({ is_visible: false })
        .eq('is_visible', true)

      if (error) throw error

      await loadStoriesFromDatabase()
      console.log('✅ All stories now hidden')
    } catch (err) {
      console.error('Failed to hide all stories:', err)
      setError('Failed to hide all stories')
    }
  }

  const handleQueueForBroadcast = async (story: NewsStory) => {
    try {
      console.log('🎙️ Queueing story for broadcast:', story.headline)
      setError('🤖 Generating conversational summary...')

      // Use Perplexity AI to create a conversational, TTS-friendly summary
      const conversationalText = await generateConversationalSummary(story)

      const { error } = await supabase
        .from('show_questions')
        .insert({
          topic: story.category,
          question_text: conversationalText,
          tts_generated: false,
          is_played: false,
          show_on_overlay: false,
          position: 0
        })

      if (error) throw error

      console.log('✅ Story queued successfully')
      setError('')
      alert('📰 News story queued for TTS with AI summary!')
    } catch (err: any) {
      console.error('Failed to queue story:', err)
      setError(err.message || 'Failed to queue story')
    }
  }

  const generateConversationalSummary = async (story: NewsStory): Promise<string> => {
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY

    if (!apiKey) {
      // Fallback to simple format if no API key
      return `Breaking news in ${story.category}: ${story.headline}. ${story.summary}`
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a broadcast news anchor. Create SHORT, punchy TTS announcements. Maximum 100 characters. Be conversational and engaging. Focus ONLY on the main point.'
            },
            {
              role: 'user',
              content: `Make this headline into a SHORT 80-100 character announcement:\n\n${story.headline}\n\nBe brief, conversational, and engaging.`
            }
          ],
          max_tokens: 50,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`)
      }

      const data = await response.json()
      const conversationalText = data.choices[0]?.message?.content?.trim()

      if (!conversationalText) {
        throw new Error('No response from AI')
      }

      console.log('🤖 AI Summary (raw):', conversationalText)
      console.log('📏 Length:', conversationalText.length)

      // Ensure it's under 120 chars for short TTS clips
      const shortened = conversationalText.slice(0, 120)
      console.log('✂️ Shortened to:', shortened)
      return shortened

    } catch (error) {
      console.error('AI summary generation failed:', error)
      // Fallback to simple headline announcement
      const fallback = `Breaking: ${story.headline.slice(0, 90)}`
      return fallback.slice(0, 120)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breaking': return Zap
      case 'business': return TrendingUp
      case 'real_estate': return Newspaper
      case 'tech': return Sparkles
      case 'entertainment': return Tv
      case 'sports': return Trophy
      case 'politics': return TrendingUp
      default: return Newspaper
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breaking': return 'text-red-400 bg-red-900/20 border-red-500'
      case 'business': return 'text-emerald-400 bg-emerald-900/20 border-emerald-500'
      case 'real_estate': return 'text-amber-400 bg-amber-900/20 border-amber-500'
      case 'tech': return 'text-purple-400 bg-purple-900/20 border-purple-500'
      case 'entertainment': return 'text-pink-400 bg-pink-900/20 border-pink-500'
      case 'sports': return 'text-green-400 bg-green-900/20 border-green-500'
      case 'politics': return 'text-blue-400 bg-blue-900/20 border-blue-500'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500'
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-cyan-600/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Morning News Feed</h2>
            <p className="text-sm text-gray-400">
              {lastFetched
                ? `Last updated: ${lastFetched.toLocaleTimeString()}`
                : 'AI-powered news curation via Perplexity'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-300 cursor-pointer">
              Auto-refresh every
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-700 text-white text-sm rounded px-2 py-1"
              disabled={!autoRefresh}
            >
              <option value={15}>15min</option>
              <option value={30}>30min</option>
              <option value={60}>1hr</option>
              <option value={120}>2hr</option>
            </select>
          </div>
          <button
            onClick={handleFetchNews}
            disabled={loading}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching...' : 'Fetch Now'}
          </button>
        </div>
      </div>

      {/* Category Quick Fetch */}
      <div className="mb-6 flex gap-2 flex-wrap items-center">
        <span className="text-sm text-gray-400 mr-2">Quick Fetch:</span>
        {['business', 'real_estate', 'tech', 'entertainment', 'sports'].map(category => {
          const Icon = getCategoryIcon(category)
          return (
            <button
              key={category}
              onClick={() => handleFetchCategory(category)}
              disabled={loading}
              className="px-3 py-1 bg-gray-800 text-gray-300 rounded-md text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1 capitalize"
            >
              <Icon className="w-4 h-4" />
              {category}
            </button>
          )
        })}
        <div className="ml-auto flex gap-2">
          <button
            onClick={showAllStories}
            className="px-3 py-1 bg-green-900/30 text-green-400 rounded-md text-sm hover:bg-green-900/50 border border-green-500/30"
          >
            Show All
          </button>
          <button
            onClick={hideAllStories}
            className="px-3 py-1 bg-gray-800 text-gray-400 rounded-md text-sm hover:bg-gray-700 border border-gray-600"
          >
            Hide All
          </button>
          <button
            onClick={clearAllStories}
            className="px-3 py-1 bg-red-900/30 text-red-400 rounded-md text-sm hover:bg-red-900/50 border border-red-500/30"
          >
            Clear All
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* News Stories Grid */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {newsStories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No news stories loaded</p>
            <p className="text-sm">Click "Fetch Latest News" to get started</p>
          </div>
        ) : (
          newsStories.map((story) => {
            const Icon = getCategoryIcon(story.category)
            const colorClass = getCategoryColor(story.category)

            return (
              <div
                key={story.id}
                className={`bg-gray-800/50 border-2 rounded-lg p-4 transition-colors ${story.isVisible
                  ? 'border-cyan-600/70 shadow-lg shadow-cyan-600/20'
                  : 'border-gray-700 hover:border-gray-600'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-md border ${colorClass} flex items-center gap-1`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">{story.category}</span>
                    </div>
                    {story.source && (
                      <span className="text-xs text-gray-500">{story.source}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey) {
                        handleQueueForBroadcast(story)
                      } else {
                        toggleStoryVisibility(story.id, story.isVisible || false)
                      }
                    }}
                    className={`p-2 rounded-md transition-colors ${story.isVisible
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    title={story.isVisible
                      ? "Click to hide from ticker (Cmd+Click to Queue for TTS)"
                      : "Click to show on ticker (Cmd+Click to Queue for TTS)"}
                  >
                    {story.isVisible ? (
                      <Eye className="w-4 h-4 text-white" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{story.headline}</h3>
                <p className="text-sm text-gray-400 mb-3">{story.summary}</p>

                {story.talkingPoints && story.talkingPoints.length > 0 && (
                  <div className="bg-gray-900/50 rounded-md p-3">
                    <p className="text-xs text-cyan-400 font-bold mb-2">💡 TALKING POINTS:</p>
                    <ul className="space-y-1">
                      {story.talkingPoints.map((point, index) => (
                        <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-cyan-400">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
