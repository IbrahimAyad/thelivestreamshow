import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Radio, 
  MessageSquare, 
  Film, 
  Users, 
  Hash,
  Settings,
  Zap,
  CheckCircle
} from 'lucide-react'
import { discord } from '../../utils/discord'
import { useEpisodeInfo } from '../../hooks/useEpisodeInfo'

interface UniversalEpisodeControlProps {
  onSettingsChange?: (settings: any) => void
}

export function LiveBroadcastControlUniversal({ onSettingsChange }: UniversalEpisodeControlProps) {
  const { episodeData, isVisible, loading, error, toggleVisibility } = useEpisodeInfo()
  
  // Broadcast settings
  const [currentTopic, setCurrentTopic] = useState('')
  const [currentHashtag, setCurrentHashtag] = useState('')
  const [displaySocialMedia, setDisplaySocialMedia] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isStreamStart, setIsStreamStart] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Track previous topic for change detection
  const [previousTopic, setPreviousTopic] = useState('')

  // Handle episode visibility toggle
  const handleToggleVisibility = async () => {
    try {
      await toggleVisibility()
      toast.success(`Episode overlay ${isVisible ? 'hidden' : 'shown'}`)
    } catch (error) {
      toast.error('Failed to toggle episode visibility')
      console.error('Toggle visibility error:', error)
    }
  }

  // Save broadcast settings
  const saveBroadcastSettings = async () => {
    if (!episodeData) {
      toast.error('No episode data available')
      return
    }

    setSaving(true)
    try {
      // Get topic change detection
      const topicChanged = currentTopic && currentTopic !== previousTopic

      // Prepare universal episode data for Discord
      const universalEpisodeInfo = {
        title: episodeData.episode_title,
        description: episodeData.episode_topic || 'Join us for an exciting episode!',
        showName: episodeData.show_name,
        episodeInfo: `Season ${episodeData.season_number}, Episode ${episodeData.episode_number}`,
        topic: currentTopic,
        hashtag: currentHashtag,
        episodeNumber: episodeData.episode_number,
        seasonNumber: episodeData.season_number,
        episodeTopic: episodeData.episode_topic
      }

      // Stream start notification
      if (isStreamStart) {
        await discord.sendStreamStart({
          title: universalEpisodeInfo.title,
          description: universalEpisodeInfo.description,
          showName: universalEpisodeInfo.showName,
          episodeInfo: universalEpisodeInfo.episodeInfo,
          topic: universalEpisodeInfo.topic,
          hashtag: universalEpisodeInfo.hashtag
        })
        toast.success('Discord: Stream start notification sent')
        setIsStreamStart(false) // Reset after sending
      }
      
      // Topic change notification
      else if (topicChanged) {
        await discord.sendTopicUpdate({
          newTopic: currentTopic,
          previousTopic: previousTopic,
          hashtags: currentHashtag ? [currentHashtag.replace('#', '')] : undefined
        })
        toast.success('Discord: Topic update sent')
      }

      // Update previous topic for next comparison
      setPreviousTopic(currentTopic)

      setLastSaved(new Date())
      toast.success('Broadcast settings saved and synced')
      
      // Notify parent component of settings change
      onSettingsChange?.({
        episode: episodeData,
        topic: currentTopic,
        hashtag: currentHashtag,
        displaySocial: displaySocialMedia
      })
      
    } catch (error) {
      console.error('Failed to save broadcast settings:', error)
      toast.error('Failed to save broadcast settings')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (episodeData && (currentTopic || currentHashtag)) {
        saveBroadcastSettings()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [episodeData, currentTopic, currentHashtag, isStreamStart])

  // Show loading state
  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading universal episode system...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="text-red-400">❌</div>
          <div>
            <h3 className="text-red-400 font-semibold">Episode System Error</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="w-6 h-6" />
          Universal Episode Control
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleVisibility}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              isVisible 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isVisible ? 'Episode Overlay: ON' : 'Episode Overlay: OFF'}
          </button>
          {lastSaved && (
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Episode Information Display */}
      {episodeData && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
            <Film className="w-4 h-4" />
            Current Episode (Universal)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Show Name</div>
              <div className="text-lg font-semibold text-white">{episodeData.show_name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Season & Episode</div>
              <div className="text-lg font-semibold text-white">
                S{episodeData.season_number}E{episodeData.episode_number}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Episode Title</div>
              <div className="text-lg font-semibold text-white">{episodeData.episode_title}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Episode Topic</div>
              <div className="text-lg font-semibold text-white">{episodeData.episode_topic}</div>
            </div>
          </div>
          
          {/* Real-time update indicator */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time updates enabled</span>
            <span className="text-gray-500">
              Last updated: {new Date(episodeData.updated_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Broadcast Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Topic */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Current Topic / Segment
          </label>
          <input
            type="text"
            value={currentTopic}
            onChange={(e) => setCurrentTopic(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white font-semibold"
            placeholder="What are you discussing now?"
          />
          <p className="text-xs text-gray-500 mt-1">
            This updates Discord and will appear in overlays
          </p>
        </div>

        {/* Hashtag */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Episode Hashtag
          </label>
          <input
            type="text"
            value={currentHashtag}
            onChange={(e) => setCurrentHashtag(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white font-semibold"
            placeholder="#AlphaWednesday"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for social media integration
          </p>
        </div>
      </div>

      {/* Broadcast Settings */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Broadcast Settings
        </h3>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={displaySocialMedia}
              onChange={(e) => setDisplaySocialMedia(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            Display Social Media Integration
          </label>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={isStreamStart}
              onChange={(e) => setIsStreamStart(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            This is a Stream Start
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-[#333]">
        <button
          onClick={saveBroadcastSettings}
          disabled={saving || !episodeData}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Save & Sync Settings
            </>
          )}
        </button>
      </div>

      {/* Universal System Info */}
      <div className="bg-green-900/20 border border-green-500/30 rounded p-4">
        <h4 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Universal Episode System Active
        </h4>
        <div className="text-sm text-green-200 space-y-1">
          <p>✅ Single source of truth: episode_info table</p>
          <p>✅ Real-time updates across all overlays</p>
          <p>✅ Controls all broadcast overlays simultaneously</p>
          <p>✅ Works with Alpha Wednesday and future shows</p>
        </div>
      </div>
    </div>
  )
}