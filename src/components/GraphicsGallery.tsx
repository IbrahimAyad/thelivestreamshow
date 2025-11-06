import { useState, useEffect } from 'react'
import { supabase, BroadcastGraphic } from '../lib/supabase'
import {
  Radio, Coffee, Clock, AlertTriangle, Image,
  BarChart3, Trophy, MessageSquare, Sparkles,
  Award, Zap, UserPlus, Gauge, Swords, Target,
  Tv
} from 'lucide-react'

const GRAPHIC_CONFIGS = [
  // Core Graphics
  { type: 'starting_soon', label: 'Starting Soon', icon: Clock, color: 'blue', htmlFile: '/stream-starting-soon.html' },
  { type: 'brb', label: 'BRB', icon: Coffee, color: 'yellow', htmlFile: '/stream-brb-screen.html' },
  { type: 'brb_tomato_game', label: 'Tomato', icon: Target, color: 'red', htmlFile: '/brb-tomato-game.html' },
  { type: 'tomato_chat_game', label: 'Tomato Chat', icon: Target, color: 'red', htmlFile: '/tomato-chat-game.html' },
  { type: 'tech_difficulties', label: 'Tech Issues', icon: AlertTriangle, color: 'orange', htmlFile: '/stream-technical-issues.html' },
  { type: 'outro', label: 'OUTRO', icon: Radio, color: 'red', htmlFile: '/stream-outro-screen.html' },
  
  // DJ Visualizer
  { type: 'ai_dj_visualizer', label: 'AI DJ', icon: Sparkles, color: 'purple', htmlFile: '/animations/ai-dj-visualizer.html' },

  // SHOW LAYOUTS (distinct purple outline)
  { type: 'out_of_context_background', label: 'Out of Context', icon: Radio, color: 'purple', htmlFile: '/graphics/out-of-context-full.html' },
  { type: 'alpha_wednesday', label: 'Alpha Wednesday', icon: Tv, color: 'purple', htmlFile: '/graphics/alpha-wednesday-universal.html', hasModeSwitcher: true },
  { type: 'morning_blitz', label: 'Morning Blitz', icon: Coffee, color: 'purple', htmlFile: '/graphics/morning-blitz-universal.html', hasImageManager: true },

  // NEW: Interactive Graphics with Audio
  { type: 'poll', label: 'Poll/Vote', icon: BarChart3, color: 'purple', htmlFile: '/stream-poll-screen.html' },
  { type: 'milestone', label: 'Milestone', icon: Trophy, color: 'gold', htmlFile: '/stream-milestone-screen.html' },
  { type: 'chat_highlight', label: 'Chat Highlight', icon: MessageSquare, color: 'blue', htmlFile: '/stream-chat-highlight.html' },

  // NEW: Additional Interactive Graphics
  { type: 'award_show', label: 'Award Show', icon: Award, color: 'gold', htmlFile: '/stream-award-show.html' },
  { type: 'finish_him', label: 'Finish Him', icon: Zap, color: 'red', htmlFile: '/stream-finish-him.html' },
  { type: 'new_member', label: 'New Member', icon: UserPlus, color: 'green', htmlFile: '/stream-new-member.html' },
  { type: 'rage_meter', label: 'Rage Meter', icon: Gauge, color: 'red', htmlFile: '/stream-rage-meter.html' },
  { type: 'versus', label: 'Versus', icon: Swords, color: 'purple', htmlFile: '/stream-versus-screen.html' },

  // Placeholder for logo
  { type: 'logo', label: 'Logo', icon: Image, color: 'white', htmlFile: null }
]

export function GraphicsGallery() {
  const [graphics, setGraphics] = useState<BroadcastGraphic[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAlphaWedModal, setShowAlphaWedModal] = useState(false)
  const [episodeTitle, setEpisodeTitle] = useState('')
  const [episodeTopic, setEpisodeTopic] = useState('')

  const [showMorningBlitzModal, setShowMorningBlitzModal] = useState(false)
  const [blitzImages, setBlitzImages] = useState<any[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageCaption, setNewImageCaption] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadGraphics()

    const channel = supabase
      .channel('graphics_gallery_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_graphics'
      }, () => {
        loadGraphics()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadGraphics = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('broadcast_graphics')
        .select('*')
        .order('graphic_type', { ascending: true })
      
      if (fetchError) throw fetchError
      if (data) setGraphics(data as BroadcastGraphic[])
    } catch (err) {
      console.error('Failed to load graphics:', err)
      setError('Failed to load graphics. Please refresh the page.')
    }
  }

  const toggleGraphic = async (graphicId: string, isVisible: boolean, htmlFile: string | null) => {
    try {
      setError(null)
      const { error: updateError } = await supabase
        .from('broadcast_graphics')
        .update({
          is_visible: !isVisible,
          html_file: htmlFile,
          updated_at: new Date().toISOString()
        })
        .eq('id', graphicId)

      if (updateError) throw updateError
    } catch (err) {
      console.error('Failed to toggle graphic:', err)
      setError('Failed to toggle graphic. Please try again.')
    }
  }

  const changeAlphaWednesdayMode = async (mode: string) => {
    try {
      setError(null)
      const graphic = getGraphic('alpha_wednesday')
      if (!graphic) return

      const { error: updateError } = await supabase
        .from('broadcast_graphics')
        .update({
          config: {
            ...graphic.config,
            mode
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', graphic.id)

      if (updateError) throw updateError
    } catch (err) {
      console.error('Failed to change mode:', err)
      setError('Failed to change mode. Please try again.')
    }
  }

  const loadEpisodeInfo = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('episode_info')
        .select('*')
        .eq('is_active', true)
        .single()

      if (fetchError) throw fetchError
      if (data) {
        setEpisodeTitle(data.episode_title || '')
        setEpisodeTopic(data.episode_topic || '')
      }
    } catch (err) {
      console.error('Failed to load episode info:', err)
    }
  }

  const saveEpisodeInfo = async () => {
    try {
      setError(null)

      // First check if there's an active episode
      const { data: checkData, error: checkError } = await supabase
        .from('episode_info')
        .select('id')
        .eq('is_active', true)
        .single()

      if (checkError || !checkData) {
        setError('No active episode found. Please create one in the database first.')
        return
      }

      // Update the episode
      const { error: updateError } = await supabase
        .from('episode_info')
        .update({
          episode_title: episodeTitle,
          episode_topic: episodeTopic
        })
        .eq('id', checkData.id)

      if (updateError) throw updateError

      setShowAlphaWedModal(false)
      alert('Episode info updated successfully! ✅')
    } catch (err) {
      console.error('Failed to save episode info:', err)
      setError(`Failed to save episode info: ${err.message || 'Unknown error'}`)
    }
  }

  const handleAlphaWedClick = (e: React.MouseEvent) => {
    e.preventDefault()
    loadEpisodeInfo()
    setShowAlphaWedModal(true)
  }

  const loadBlitzImages = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('morning_blitz_images')
        .select('*')
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError
      if (data) setBlitzImages(data)
    } catch (err) {
      console.error('Failed to load blitz images:', err)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      setError(null)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `morning-blitz/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('broadcast-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('broadcast-assets')
        .getPublicUrl(fileName)

      setNewImageUrl(publicUrl)
      alert('Image uploaded! ✅ Add a caption and click "Add Image"')
    } catch (err: any) {
      console.error('Failed to upload image:', err)
      setError(`Failed to upload image: ${err.message || 'Unknown error'}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const addBlitzImage = async () => {
    try {
      if (!newImageUrl.trim()) {
        alert('Please enter an image URL or upload an image')
        return
      }

      const maxOrder = blitzImages.length > 0
        ? Math.max(...blitzImages.map(img => img.display_order))
        : 0

      const { error: insertError } = await supabase
        .from('morning_blitz_images')
        .insert({
          image_url: newImageUrl,
          caption: newImageCaption || null,
          display_order: maxOrder + 1,
          is_active: true
        })

      if (insertError) throw insertError

      setNewImageUrl('')
      setNewImageCaption('')
      loadBlitzImages()
      alert('Image added successfully! ✅')
    } catch (err) {
      console.error('Failed to add image:', err)
      setError('Failed to add image. Please try again.')
    }
  }

  const toggleBlitzImage = async (id: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('morning_blitz_images')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (updateError) throw updateError
      loadBlitzImages()
    } catch (err) {
      console.error('Failed to toggle image:', err)
      setError('Failed to toggle image. Please try again.')
    }
  }

  const deleteBlitzImage = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('morning_blitz_images')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      loadBlitzImages()
    } catch (err) {
      console.error('Failed to delete image:', err)
      setError('Failed to delete image. Please try again.')
    }
  }

  const handleMorningBlitzClick = (e: React.MouseEvent) => {
    e.preventDefault()
    loadBlitzImages()
    setShowMorningBlitzModal(true)
  }

  const getGraphic = (type: string) => graphics.find(g => g.graphic_type === type)
  const getConfig = (type: string) => GRAPHIC_CONFIGS.find(c => c.type === type)

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Image className="w-7 h-7 text-yellow-400" />
        Graphics Overlays
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {GRAPHIC_CONFIGS.map((config) => {
          const graphic = getGraphic(config.type)
          const isActive = graphic?.is_visible || false
          const Icon = config.icon
          const currentMode = graphic?.config?.mode || 'default'

          // Special rendering for Morning Blitz with image manager
          if (config.hasImageManager && config.type === 'morning_blitz') {
            return (
              <div key={config.type} className="col-span-2 md:col-span-3 lg:col-span-4">
                <div
                  onClick={handleMorningBlitzClick}
                  className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-400 shadow-lg shadow-cyan-500/60'
                      : 'bg-gray-900 border-gray-700'
                  }`}
                  title="Click to manage conversation images"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-8 h-8 transition-all ${
                        isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-gray-500'
                      }`} />
                      <div>
                        <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {config.label}
                        </h3>
                        <p className="text-xs text-gray-500">Conversation Starter Images</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        graphic && toggleGraphic(graphic.id, isActive, config.htmlFile)
                      }}
                      className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {isActive ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          // Special rendering for Alpha Wednesday with mode switcher
          if (config.hasModeSwitcher && config.type === 'alpha_wednesday') {
            return (
              <div key={config.type} className="col-span-2 md:col-span-3 lg:col-span-4">
                <div
                  onClick={handleAlphaWedClick}
                  className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-400 shadow-lg shadow-purple-500/60'
                      : 'bg-gray-900 border-gray-700'
                  }`}
                  title="Click to edit episode info"
                >
                  {/* Header with toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-8 h-8 transition-all ${
                        isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-gray-500'
                      }`} />
                      <div>
                        <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {config.label}
                        </h3>
                        <p className="text-xs text-gray-500">AI, Tech News & Community Discussion</p>
                      </div>
                    </div>
                    <button
                      onClick={() => graphic && toggleGraphic(graphic.id, isActive, config.htmlFile)}
                      className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        isActive
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {isActive ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>

                  {/* Mode Switcher */}
                  {isActive && (
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-400 flex items-center">Layout Mode:</span>
                      <div className="flex gap-2 flex-1">
                        {['default', 'debate', 'presentation', 'gaming'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => changeAlphaWednesdayMode(mode)}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              currentMode === mode
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {mode.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          // Regular graphic button
          return (
            <button
              key={config.type}
              onClick={() => graphic && toggleGraphic(graphic.id, isActive, config.htmlFile)}
              className={`relative h-32 rounded-lg border-2 transition-all transform ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-400 shadow-lg shadow-cyan-500/60 scale-105'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Icon className={`w-10 h-10 transition-all ${
                  isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-gray-500'
                }`} />
                <span className={`font-bold text-sm transition-all ${
                  isActive ? 'text-white drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]' : 'text-gray-400'
                }`}>
                  {config.label}
                </span>
                {isActive && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-cyan-500 text-white text-xs font-bold rounded shadow-lg shadow-cyan-500/50 animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              {/* Active state glow ring animation */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg border-2 border-cyan-400 animate-pulse" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300">
        <p className="font-semibold">Quick Tip</p>
        <p className="text-xs mt-1">Click Morning Blitz to manage images • Click Alpha Wednesday to edit episode • Use SHOW/HIDE buttons to control visibility</p>
      </div>

      {/* Morning Blitz Image Manager Modal */}
      {showMorningBlitzModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowMorningBlitzModal(false)}>
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Coffee className="w-7 h-7 text-cyan-400" />
                Morning Blitz - Conversation Images
              </h2>
              <button
                onClick={() => setShowMorningBlitzModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Add New Image Section */}
            <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <h3 className="text-cyan-400 font-bold text-lg mb-4">Add New Image</h3>
              <div className="space-y-3">
                {/* File Upload */}
                <div>
                  <label className="block text-white font-semibold mb-2">Upload Image</label>
                  <div className="flex gap-2">
                    <label className={`flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-center cursor-pointer hover:bg-cyan-700 transition-colors font-bold ${uploadingImage ? 'opacity-50' : ''}`}>
                      {uploadingImage ? 'Uploading...' : '📤 Choose File'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file)
                        }}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Or enter URL below</p>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-white font-semibold mb-2">Image URL</label>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    disabled={uploadingImage}
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Caption (Optional)</label>
                  <input
                    type="text"
                    value={newImageCaption}
                    onChange={(e) => setNewImageCaption(e.target.value)}
                    placeholder="e.g., What's your hot take on AI?"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={addBlitzImage}
                  className="w-full px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-bold"
                >
                  Add Image
                </button>
              </div>
            </div>

            {/* Current Images List */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Current Images ({blitzImages.length})</h3>
              {blitzImages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No images added yet. Add your first conversation starter above!</p>
              ) : (
                <div className="space-y-2">
                  {blitzImages.map((image, index) => (
                    <div
                      key={image.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        image.is_active
                          ? 'bg-cyan-900/20 border-cyan-500/30'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    >
                      <div className="text-gray-400 font-bold w-8">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="text-white font-semibold truncate">{image.caption || 'No caption'}</div>
                        <div className="text-xs text-gray-500 truncate">{image.image_url}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleBlitzImage(image.id, image.is_active)}
                          className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                            image.is_active
                              ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {image.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this image?')) {
                              deleteBlitzImage(image.id)
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded text-sm text-cyan-300">
              <p className="font-semibold">Tip</p>
              <p className="text-xs mt-1">Only active images will appear on the overlay. Max 5 images shown at once.</p>
            </div>
          </div>
        </div>
      )}

      {/* Alpha Wednesday Edit Modal */}
      {showAlphaWedModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowAlphaWedModal(false)}>
          <div className="bg-gray-900 border-2 border-purple-500 rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Tv className="w-7 h-7 text-purple-400" />
                Edit Overlay: alpha_wednesday
              </h2>
              <button
                onClick={() => setShowAlphaWedModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Content Fields Tab Header */}
              <div className="border-b border-gray-700 pb-2">
                <h3 className="text-yellow-400 font-bold text-lg">Content Fields</h3>
              </div>

              {/* Mode Field */}
              <div>
                <label className="block text-white font-semibold mb-2">Mode</label>
                <input
                  type="text"
                  value={getGraphic('alpha_wednesday')?.config?.mode || 'default'}
                  disabled
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-400"
                />
              </div>

              {/* Episode Title */}
              <div>
                <label className="block text-white font-semibold mb-2">Episode Title</label>
                <input
                  type="text"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="e.g., Alpha Wednesday Returns"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Episode Topic */}
              <div>
                <label className="block text-white font-semibold mb-2">Episode Topic</label>
                <input
                  type="text"
                  value={episodeTopic}
                  onChange={(e) => setEpisodeTopic(e.target.value)}
                  placeholder="e.g., AI, Tech News, and Community Discussion"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Available Modes (Read-only) */}
              <div>
                <label className="block text-white font-semibold mb-2">Available Modes</label>
                <input
                  type="text"
                  value="default,debate,presentation,gaming"
                  disabled
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowAlphaWedModal(false)}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEpisodeInfo}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
