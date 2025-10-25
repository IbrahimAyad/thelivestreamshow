import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useDiscord } from '../../contexts/DiscordContext'
import { Radio, Tv, Film, MessageSquare, Hash, Users, Save, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Show {
  id: string
  name: string
  theme_color: string
  default_hashtag: string | null
}

interface Episode {
  id: string
  season_number: number
  episode_number: number
  title: string
}

interface Guest {
  id: string
  name: string
  title: string | null
}

export function LiveBroadcastControl() {
  const discord = useDiscord();
  
  const [shows, setShows] = useState<Show[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  
  const [selectedShowId, setSelectedShowId] = useState<string>('')
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('')
  const [currentTopic, setCurrentTopic] = useState('')
  const [currentHashtag, setCurrentHashtag] = useState('')
  const [displaySocial, setDisplaySocial] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [previousTopic, setPreviousTopic] = useState('')

  useEffect(() => {
    loadInitialData()
    loadBroadcastMetadata()

    const channel = supabase
      .channel('broadcast_metadata_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_metadata'
      }, () => {
        loadBroadcastMetadata()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (selectedShowId) {
      loadEpisodes(selectedShowId)
    }
  }, [selectedShowId])

  const loadInitialData = async () => {
    const { data: showsData } = await supabase
      .from('shows')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    const { data: guestsData } = await supabase
      .from('guests')
      .select('id, name, title')
      .order('name')
    
    if (showsData) setShows(showsData as Show[])
    if (guestsData) setGuests(guestsData as Guest[])
  }

  const loadEpisodes = async (showId: string) => {
    const { data } = await supabase
      .from('episodes')
      .select('*')
      .eq('show_id', showId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (data) setEpisodes(data as Episode[])
  }

  const loadBroadcastMetadata = async () => {
    const { data } = await supabase
      .from('broadcast_metadata')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    if (data) {
      setSelectedShowId(data.current_show_id || '')
      setSelectedEpisodeId(data.current_episode_id || '')
      const topic = data.current_topic || '';
      setCurrentTopic(topic)
      setPreviousTopic(topic) // Initialize previous topic
      setCurrentHashtag(data.current_hashtag || '')
      setDisplaySocial(data.display_social_media)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Get the first metadata row or create one
      const { data: existingData } = await supabase
        .from('broadcast_metadata')
        .select('*')
        .limit(1)
        .maybeSingle()
      
      const updateData = {
        current_show_id: selectedShowId || null,
        current_episode_id: selectedEpisodeId || null,
        current_topic: currentTopic,
        current_hashtag: currentHashtag,
        display_social_media: displaySocial,
        updated_at: new Date().toISOString()
      }

      // Check if this is a new stream start (episode changed)
      const isStreamStart = !existingData?.current_episode_id && selectedEpisodeId;
      
      // Check if topic changed
      const topicChanged = existingData && 
        previousTopic && 
        currentTopic && 
        currentTopic !== previousTopic;

      if (existingData) {
        await supabase
          .from('broadcast_metadata')
          .update(updateData)
          .eq('id', existingData.id)
      } else {
        await supabase
          .from('broadcast_metadata')
          .insert([updateData])
      }

      // Update episode status to 'live' if selected
      if (selectedEpisodeId) {
        await supabase
          .from('episodes')
          .update({ is_live: true })
          .eq('id', selectedEpisodeId)
        
        // Set all other episodes to not live
        await supabase
          .from('episodes')
          .update({ is_live: false })
          .neq('id', selectedEpisodeId)
      }

      // Send Discord notifications
      if (discord.isEnabled) {
        const currentShow = getCurrentShow();
        const currentEpisode = getCurrentEpisode();

        // Stream start notification
        if (isStreamStart && currentShow && currentEpisode) {
          await discord.sendStreamStart({
            title: currentEpisode.title,
            description: currentTopic || 'Join us for an exciting episode!',
            showName: currentShow.name,
            episodeInfo: `Season ${currentEpisode.season_number}, Episode ${currentEpisode.episode_number}`,
            topic: currentTopic,
            hashtag: currentHashtag
          });
          toast.success('Discord: Stream start notification sent');
        }
        
        // Topic change notification
        else if (topicChanged) {
          await discord.sendTopicUpdate({
            newTopic: currentTopic,
            previousTopic: previousTopic,
            hashtags: currentHashtag ? [currentHashtag.replace('#', '')] : undefined
          });
          toast.success('Discord: Topic update sent');
        }
      }

      // Update previous topic for next comparison
      setPreviousTopic(currentTopic);

      setLastSaved(new Date())
      toast.success('Broadcast metadata saved and synced');
    } catch (error) {
      console.error('Failed to save broadcast metadata:', error);
      toast.error('Failed to save broadcast metadata');
    } finally {
      setSaving(false)
    }
  }

  const getCurrentShow = () => shows.find(s => s.id === selectedShowId)
  const getCurrentEpisode = () => episodes.find(e => e.id === selectedEpisodeId)

  const quickTopics = [
    'Opening Segment',
    'Main Discussion',
    'Q&A Session',
    'Guest Interview',
    'News & Updates',
    'Closing Remarks',
    'Ad Break'
  ]

  return (
    <div className="bg-gradient-to-br from-red-900/20 to-purple-900/20 border-2 border-red-500/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-6 h-6 text-red-500 animate-pulse" />
        <h2 className="text-xl font-bold text-white">LIVE BROADCAST CONTROL</h2>
      </div>

      <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a] space-y-4">
        {/* Show Selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Tv className="w-4 h-4" />
            Current Show
          </label>
          <select
            value={selectedShowId}
            onChange={(e) => {
              setSelectedShowId(e.target.value)
              const show = shows.find(s => s.id === e.target.value)
              if (show?.default_hashtag) {
                setCurrentHashtag(show.default_hashtag)
              }
            }}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white font-semibold"
          >
            <option value="">-- Select Show --</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
          {getCurrentShow() && (
            <div className="mt-2 flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getCurrentShow()?.theme_color }}
              />
              <span className="text-sm text-gray-400">
                Theme: {getCurrentShow()?.theme_color}
              </span>
            </div>
          )}
        </div>

        {/* Episode Selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Film className="w-4 h-4" />
            Current Episode
          </label>
          <select
            value={selectedEpisodeId}
            onChange={(e) => setSelectedEpisodeId(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white font-semibold"
            disabled={!selectedShowId}
          >
            <option value="">-- Select Episode --</option>
            {episodes.map((episode) => (
              <option key={episode.id} value={episode.id}>
                S{episode.season_number}E{episode.episode_number}: {episode.title}
              </option>
            ))}
          </select>
          {getCurrentEpisode() && (
            <div className="mt-2 bg-blue-900/30 border border-blue-500/30 rounded px-3 py-2">
              <div className="text-sm font-semibold text-blue-300">
                Season {getCurrentEpisode()?.season_number}, Episode {getCurrentEpisode()?.episode_number}
              </div>
              <div className="text-sm text-blue-400">{getCurrentEpisode()?.title}</div>
            </div>
          )}
        </div>

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
          <div className="mt-2 flex flex-wrap gap-2">
            {quickTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setCurrentTopic(topic)}
                className="text-xs bg-[#2a2a2a] hover:bg-blue-600 border border-[#3a3a3a] hover:border-blue-500 rounded px-2 py-1 text-gray-400 hover:text-white transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Hashtag */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Current Hashtag
          </label>
          <input
            type="text"
            value={currentHashtag}
            onChange={(e) => setCurrentHashtag(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white font-semibold"
            placeholder="#YourHashtag"
          />
        </div>

        {/* Social Media Toggle */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={displaySocial}
              onChange={(e) => setDisplaySocial(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-400">Display Social Media on Broadcast View</span>
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 px-4 py-3 rounded font-bold text-white flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'SAVE & SYNC TO BROADCAST VIEW'}
        </button>

        {lastSaved && (
          <div className="text-center text-xs text-green-400">
            Last updated: {lastSaved.toLocaleTimeString()}
          </div>
        )}

        {/* Status */}
        <div className="bg-green-900/30 border border-green-500/30 rounded p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-300">
              <strong>Real-Time Sync:</strong> All changes are automatically reflected on the Broadcast View in real-time after saving. No manual refresh needed!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
