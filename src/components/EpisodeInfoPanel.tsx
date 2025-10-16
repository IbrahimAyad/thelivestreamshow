import { useState, useEffect } from 'react'
import { supabase, EpisodeInfo } from '../lib/supabase'
import { Film, Calendar, Type, MessageSquare } from 'lucide-react'

export function EpisodeInfoPanel() {
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null)
  const [episodeNumber, setEpisodeNumber] = useState<number>(1)
  const [episodeDate, setEpisodeDate] = useState<string>('')
  const [episodeTitle, setEpisodeTitle] = useState<string>('')
  const [episodeTopic, setEpisodeTopic] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadEpisodeInfo()

    // Real-time subscription
    const channel = supabase
      .channel('episode_info_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'episode_info'
      }, () => {
        loadEpisodeInfo()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadEpisodeInfo = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('episode_info')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        setEpisodeInfo(data as EpisodeInfo)
        setEpisodeNumber(data.episode_number)
        setEpisodeDate(data.episode_date)
        setEpisodeTitle(data.episode_title)
        setEpisodeTopic(data.episode_topic)
      } else {
        // Set defaults if no active episode info exists
        const today = new Date().toISOString().split('T')[0]
        setEpisodeDate(today)
      }
    } catch (err) {
      console.error('Error loading episode info:', err)
      setError('Failed to load episode info')
    }
  }

  const updateEpisodeInfo = async () => {
    if (!episodeTitle.trim() || !episodeTopic.trim()) {
      setError('Title and topic are required')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (episodeInfo) {
        // Update existing
        const { error: updateError } = await supabase
          .from('episode_info')
          .update({
            episode_number: episodeNumber,
            episode_date: episodeDate,
            episode_title: episodeTitle,
            episode_topic: episodeTopic,
            updated_at: new Date().toISOString()
          })
          .eq('id', episodeInfo.id)

        if (updateError) throw updateError
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('episode_info')
          .insert({
            episode_number: episodeNumber,
            episode_date: episodeDate,
            episode_title: episodeTitle,
            episode_topic: episodeTopic,
            is_active: true
          })

        if (insertError) throw insertError
      }

      setSuccessMessage('Episode info updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error updating episode info:', err)
      setError('Failed to update episode info')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Film className="w-5 h-5 text-cyan-500" />
        Episode Info
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300 text-sm">
          {successMessage}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Episode Number
            </label>
            <input
              type="number"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Episode Date
            </label>
            <input
              type="date"
              value={episodeDate}
              onChange={(e) => setEpisodeDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Episode Title
          </label>
          <input
            type="text"
            value={episodeTitle}
            onChange={(e) => setEpisodeTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            placeholder="Enter episode title"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Episode Topic
          </label>
          <textarea
            value={episodeTopic}
            onChange={(e) => setEpisodeTopic(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
            placeholder="Describe what this episode is about..."
          />
        </div>

        <button
          onClick={updateEpisodeInfo}
          disabled={isLoading || !episodeTitle.trim() || !episodeTopic.trim()}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Updating...
            </>
          ) : (
            'Update Episode Info'
          )}
        </button>
      </div>

      {/* Current Info Display */}
      {episodeInfo && (
        <div className="mt-6 p-3 bg-gray-800/50 border border-gray-700/50 rounded">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Current Episode</h3>
          <div className="space-y-1.5 text-sm">
            <p className="text-gray-400">
              <span className="text-gray-500">Episode #{episodeInfo.episode_number}</span> · {episodeInfo.episode_date}
            </p>
            <p className="text-white font-semibold">{episodeInfo.episode_title}</p>
            <p className="text-gray-400 text-sm">{episodeInfo.episode_topic}</p>
          </div>
        </div>
      )}
    </div>
  )
}
