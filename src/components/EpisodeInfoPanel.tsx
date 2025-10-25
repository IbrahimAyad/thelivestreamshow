import { useState, useEffect } from 'react'
import { supabase, EpisodeInfo } from '../lib/supabase'
import { useEpisodeInfo } from '../hooks/useEpisodeInfo'
import { Film, Calendar, Type, MessageSquare, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

export function EpisodeInfoPanel() {
  const { episodeInfo: currentEpisode, isVisible: isBroadcastVisible, toggleVisibility } = useEpisodeInfo()
  const [episodeNumber, setEpisodeNumber] = useState<number>(1)
  const [episodeDate, setEpisodeDate] = useState<string>('')
  const [episodeTitle, setEpisodeTitle] = useState<string>('')
  const [episodeTopic, setEpisodeTopic] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true) // ✅ Toggle state for panel

  // Sync form fields with current episode data
  useEffect(() => {
    if (currentEpisode) {
      setEpisodeNumber(currentEpisode.episode_number)
      setEpisodeDate(currentEpisode.episode_date)
      setEpisodeTitle(currentEpisode.episode_title)
      setEpisodeTopic(currentEpisode.episode_topic)
    } else {
      // Set defaults if no active episode exists
      const today = new Date().toISOString().split('T')[0]
      setEpisodeDate(today)
    }
  }, [currentEpisode])

  const updateEpisodeInfo = async () => {
    if (!episodeTitle.trim() || !episodeTopic.trim()) {
      setError('Title and topic are required')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (currentEpisode) {
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
          .eq('id', currentEpisode.id)

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
            is_active: true,
            is_visible: true  // Default visible
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

  const handleToggleVisibility = async () => {
    try {
      await toggleVisibility()
      setSuccessMessage(isBroadcastVisible ? 'Episode info hidden from broadcast!' : 'Episode info now visible on broadcast!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error toggling visibility:', err)
      setError('Failed to toggle visibility')
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-cyan-500" />
          Episode Info
        </h2>
        <div className="flex gap-2">
          {currentEpisode && (
            <button
              onClick={handleToggleVisibility}
              className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isBroadcastVisible
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
              title={isBroadcastVisible ? "Hide from broadcast" : "Show on broadcast"}
            >
              {isBroadcastVisible ? (
                <>
                  <Eye className="w-4 h-4" />
                  On Air
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hidden
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            title={isExpanded ? "Hide episode info" : "Show episode info"}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {isExpanded && successMessage && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300 text-sm">
          {successMessage}
        </div>
      )}

      {isExpanded && (
      <>
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
      {currentEpisode && (
        <div className="mt-6 p-3 bg-gray-800/50 border border-gray-700/50 rounded">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Current Episode</h3>
          <div className="space-y-1.5 text-sm">
            <p className="text-gray-400">
              <span className="text-gray-500">Episode #{currentEpisode.episode_number}</span> · {currentEpisode.episode_date}
            </p>
            <p className="text-white font-semibold">{currentEpisode.episode_title}</p>
            <p className="text-gray-400 text-sm">{currentEpisode.episode_topic}</p>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
