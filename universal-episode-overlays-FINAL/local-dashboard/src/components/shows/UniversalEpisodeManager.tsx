import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  Film,
  Calendar,
  Tag,
  CheckCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useEpisodeInfo } from '../../hooks/useEpisodeInfo'

interface UniversalEpisode {
  id?: string
  episode_number: number
  episode_title: string
  episode_topic: string
  episode_date: string
  season_number: number
  show_name: string
  is_visible: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function UniversalEpisodeManager() {
  const { episodeData, isVisible, loading, error, refetch, toggleVisibility } = useEpisodeInfo()
  
  // State management
  const [episodes, setEpisodes] = useState<UniversalEpisode[]>([])
  const [editingEpisode, setEditingEpisode] = useState<UniversalEpisode | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<UniversalEpisode>({
    episode_number: 1,
    episode_title: '',
    episode_topic: '',
    episode_date: new Date().toISOString().split('T')[0],
    season_number: 1,
    show_name: 'Alpha Wednesday',
    is_visible: true,
    is_active: true
  })

  // Load all episodes
  const loadEpisodes = async () => {
    try {
      const { data, error } = await supabase
        .from('episode_info')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEpisodes(data || [])
    } catch (error) {
      console.error('Failed to load episodes:', error)
      toast.error('Failed to load episodes')
    }
  }

  // Create new episode
  const createEpisode = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('episode_info')
        .insert([formData])
        .select()
        .single()

      if (error) throw error

      setEpisodes([data, ...episodes])
      setIsCreating(false)
      setFormData({
        episode_number: episodes.length + 1,
        episode_title: '',
        episode_topic: '',
        episode_date: new Date().toISOString().split('T')[0],
        season_number: 1,
        show_name: 'Alpha Wednesday',
        is_visible: true,
        is_active: true
      })
      
      toast.success('Episode created successfully')
      refetch() // Refresh universal episode data
    } catch (error) {
      console.error('Failed to create episode:', error)
      toast.error('Failed to create episode')
    } finally {
      setSaving(false)
    }
  }

  // Update episode
  const updateEpisode = async () => {
    if (!editingEpisode?.id) return

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('episode_info')
        .update({
          episode_number: formData.episode_number,
          episode_title: formData.episode_title,
          episode_topic: formData.episode_topic,
          episode_date: formData.episode_date,
          season_number: formData.season_number,
          show_name: formData.show_name,
          is_visible: formData.is_visible,
          is_active: formData.is_active
        })
        .eq('id', editingEpisode.id)
        .select()
        .single()

      if (error) throw error

      setEpisodes(episodes.map(ep => 
        ep.id === editingEpisode.id ? data : ep
      ))
      setEditingEpisode(null)
      
      toast.success('Episode updated successfully')
      refetch() // Refresh universal episode data
    } catch (error) {
      console.error('Failed to update episode:', error)
      toast.error('Failed to update episode')
    } finally {
      setSaving(false)
    }
  }

  // Delete episode
  const deleteEpisode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return

    try {
      const { error } = await supabase
        .from('episode_info')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEpisodes(episodes.filter(ep => ep.id !== id))
      toast.success('Episode deleted successfully')
      refetch() // Refresh universal episode data
    } catch (error) {
      console.error('Failed to delete episode:', error)
      toast.error('Failed to delete episode')
    }
  }

  // Start editing
  const startEdit = (episode: UniversalEpisode) => {
    setEditingEpisode(episode)
    setFormData({
      episode_number: episode.episode_number,
      episode_title: episode.episode_title,
      episode_topic: episode.episode_topic || '',
      episode_date: episode.episode_date || new Date().toISOString().split('T')[0],
      season_number: episode.season_number,
      show_name: episode.show_name,
      is_visible: episode.is_visible,
      is_active: episode.is_active
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingEpisode(null)
    setIsCreating(false)
    setFormData({
      episode_number: 1,
      episode_title: '',
      episode_topic: '',
      episode_date: new Date().toISOString().split('T')[0],
      season_number: 1,
      show_name: 'Alpha Wednesday',
      is_visible: true,
      is_active: true
    })
  }

  // Set as active episode
  const setAsActive = async (episode: UniversalEpisode) => {
    try {
      // Deactivate all episodes
      await supabase
        .from('episode_info')
        .update({ is_active: false })
        .neq('id', episode.id)

      // Activate selected episode
      const { error } = await supabase
        .from('episode_info')
        .update({ is_active: true })
        .eq('id', episode.id)

      if (error) throw error

      toast.success(`Episode ${episode.episode_number} set as active`)
      loadEpisodes()
      refetch() // Refresh universal episode data
    } catch (error) {
      console.error('Failed to set active episode:', error)
      toast.error('Failed to set active episode')
    }
  }

  // Load episodes on mount
  useEffect(() => {
    loadEpisodes()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading episode data...</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Film className="w-6 h-6" />
              Universal Episode Manager
            </h2>
            <p className="text-gray-400 mt-1">
              Manage episode data that controls all overlays across your broadcast
            </p>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Episode
          </button>
        </div>

        {/* Current Active Episode */}
        {episodeData && (
          <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded p-4">
            <h3 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Current Active Episode
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Show</div>
                <div className="text-white font-semibold">{episodeData.show_name}</div>
              </div>
              <div>
                <div className="text-gray-400">Season & Episode</div>
                <div className="text-white font-semibold">
                  S{episodeData.season_number}E{episodeData.episode_number}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Title</div>
                <div className="text-white font-semibold">{episodeData.episode_title}</div>
              </div>
              <div>
                <div className="text-gray-400">Visibility</div>
                <div className={`font-semibold ${episodeData.is_visible ? 'text-green-400' : 'text-red-400'}`}>
                  {episodeData.is_visible ? 'Visible' : 'Hidden'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingEpisode) && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingEpisode ? 'Edit Episode' : 'Create New Episode'}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Show Name</label>
              <input
                type="text"
                value={formData.show_name}
                onChange={(e) => setFormData({ ...formData, show_name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                placeholder="Alpha Wednesday"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Season Number</label>
              <input
                type="number"
                value={formData.season_number}
                onChange={(e) => setFormData({ ...formData, season_number: parseInt(e.target.value) })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Episode Number</label>
              <input
                type="number"
                value={formData.episode_number}
                onChange={(e) => setFormData({ ...formData, episode_number: parseInt(e.target.value) })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Episode Date</label>
              <input
                type="date"
                value={formData.episode_date}
                onChange={(e) => setFormData({ ...formData, episode_date: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Episode Title</label>
              <input
                type="text"
                value={formData.episode_title}
                onChange={(e) => setFormData({ ...formData, episode_title: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                placeholder="Episode title..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Episode Topic</label>
              <input
                type="text"
                value={formData.episode_topic}
                onChange={(e) => setFormData({ ...formData, episode_topic: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                placeholder="Episode topic or focus..."
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Active Episode
              </label>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Visible on Overlays
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={editingEpisode ? updateEpisode : createEpisode}
              disabled={saving || !formData.episode_title}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingEpisode ? 'Update Episode' : 'Create Episode'}
                </>
              )}
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Episodes List */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">All Episodes</h3>
        
        {episodes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No episodes found. Create your first episode to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className={`p-4 rounded border transition-colors ${
                  episode.is_active 
                    ? 'border-green-500 bg-green-900/10' 
                    : 'border-[#444] bg-[#2a2a2a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-semibold text-white">
                        S{episode.season_number}E{episode.episode_number}
                      </div>
                      {episode.is_active && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          ACTIVE
                        </span>
                      )}
                      {!episode.is_visible && (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    
                    <div className="text-white font-medium">{episode.episode_title}</div>
                    <div className="text-gray-400 text-sm">{episode.episode_topic}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {episode.show_name} • {episode.episode_date}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(episode)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit episode"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setAsActive(episode)}
                      disabled={episode.is_active}
                      className={`p-2 rounded transition-colors ${
                        episode.is_active
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-gray-400 hover:text-green-400 hover:bg-green-900/20'
                      }`}
                      title="Set as active episode"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteEpisode(episode.id!)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                      title="Delete episode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Universal System Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Universal Episode System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
          <div>
            <h4 className="font-semibold mb-2">Single Source of Truth</h4>
            <p>All episode displays across your broadcast are controlled by one database table.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Real-time Updates</h4>
            <p>Changes to episode data instantly update all overlays and displays.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Flexible Shows</h4>
            <p>Support multiple shows with different layouts and styling.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Global Visibility Control</h4>
            <p>Toggle episode info visibility across all overlays simultaneously.</p>
          </div>
        </div>
      </div>
    </div>
  )
}