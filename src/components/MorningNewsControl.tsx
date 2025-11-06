import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMorningNews, fetchCategoryNews, getDemoNews, NewsStory } from '../lib/api/morningNews'
import { Newspaper, RefreshCw, TrendingUp, Zap, Tv, Trophy, Sparkles, Eye, EyeOff } from 'lucide-react'

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
          timestamp: row.created_at
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
      for (let i = 0; i < stories.length; i++) {
        const story = stories[i]
        await supabase.from('morning_news_stories').insert({
          headline: story.headline,
          summary: story.summary,
          category: story.category,
          source: story.source || 'Perplexity News',
          talking_points: story.talkingPoints,
          is_visible: i < 3, // Auto-show top 3 stories
          display_order: i + 1
        })
      }

      setNewsStories(stories)
      setLastFetched(new Date())
      console.log(`✅ Fetched and saved ${stories.length} news stories (top 3 auto-visible)`)
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
      for (let i = 0; i < stories.length; i++) {
        const story = stories[i]
        await supabase.from('morning_news_stories').insert({
          headline: story.headline,
          summary: story.summary,
          category: story.category,
          source: story.source || 'Perplexity News',
          talking_points: story.talkingPoints,
          is_visible: true, // Auto-show category stories
          display_order: i + 1
        })
      }

      await loadStoriesFromDatabase()
      console.log(`✅ Fetched ${stories.length} ${category} stories (all visible)`)
    } catch (err: any) {
      console.error(`Failed to fetch ${category} news:`, err)
      setError(err.message || `Failed to fetch ${category} news`)
    } finally {
      setLoading(false)
    }
  }

  const toggleStoryVisibility = async (storyId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('morning_news_stories')
        .update({ is_visible: !isVisible })
        .eq('id', storyId)

      if (error) throw error

      // Update local state
      setNewsStories(prev => prev.map(story =>
        story.id === storyId ? { ...story } : story
      ))

      await loadStoriesFromDatabase()
    } catch (err) {
      console.error('Failed to toggle story visibility:', err)
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
        <button
          onClick={clearAllStories}
          className="ml-auto px-3 py-1 bg-red-900/30 text-red-400 rounded-md text-sm hover:bg-red-900/50 border border-red-500/30"
        >
          Clear All Stories
        </button>
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
                className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-4 hover:border-cyan-600/50 transition-colors"
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
                    onClick={() => toggleStoryVisibility(story.id, false)}
                    className="p-2 bg-gray-700 rounded-md hover:bg-cyan-600 transition-colors"
                    title="Show on overlay"
                  >
                    <Eye className="w-4 h-4 text-gray-300" />
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
