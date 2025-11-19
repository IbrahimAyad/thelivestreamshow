import { useState, useEffect } from 'react'
import { supabase, BroadcastGraphic } from '../lib/supabase'
import {
  Radio, Coffee, Clock, AlertTriangle, Image,
  BarChart3, Trophy, MessageSquare, Sparkles,
  Award, Zap, UserPlus, Gauge, Swords, Target,
  Tv, Send, Plus, Trash2, Loader2, Volume2
} from 'lucide-react'

interface ShowQuestion {
  id: string
  topic: string
  question_text: string
  tts_audio_url: string | null
  tts_generated: boolean
  position: number
  show_on_overlay: boolean
}

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
  { type: 'morning_show_intro', label: 'Morning Show Intro', icon: Sparkles, color: 'cyan', htmlFile: '/graphics/morning-show-intro.html' },
  { type: 'morning_blitz', label: 'Morning Show', icon: Coffee, color: 'purple', htmlFile: '/graphics/morning-blitz-universal.html', hasModeSwitcher: true, hasImageManager: true },

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

  // Ultra Chat state
  const [questions, setQuestions] = useState<ShowQuestion[]>([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestionTopic, setNewQuestionTopic] = useState('')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [generatingTTS, setGeneratingTTS] = useState<string | null>(null)
  const [addingQuestion, setAddingQuestion] = useState(false)

  useEffect(() => {
    loadGraphics()
    loadQuestions()

    const graphicsChannel = supabase
      .channel('graphics_gallery_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_graphics'
      }, () => {
        loadGraphics()
      })
      .subscribe()

    const questionsChannel = supabase
      .channel('ultra_chat_questions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_questions'
      }, () => {
        loadQuestions()
      })
      .subscribe()

    return () => {
      graphicsChannel.unsubscribe()
      questionsChannel.unsubscribe()
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

  const changeOverlayMode = async (graphicType: string, mode: string) => {
    try {
      setError(null)
      const graphic = getGraphic(graphicType)
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

  // Backwards compatibility aliases
  const changeAlphaWednesdayMode = (mode: string) => changeOverlayMode('alpha_wednesday', mode)
  const changeMorningShowMode = (mode: string) => changeOverlayMode('morning_blitz', mode)

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
      alert('✅ Image uploaded successfully!\n\nThe image URL has been filled in. Now:\n1. Add a caption (optional)\n2. Click "Add Image" button below')
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
        setError('⚠️ Please enter an image URL or upload an image first')
        return
      }

      setError(null)
      const maxOrder = blitzImages.length > 0
        ? Math.max(...blitzImages.map(img => img.display_order))
        : 0

      const { error: insertError } = await supabase
        .from('morning_blitz_images')
        .insert({
          image_url: newImageUrl,
          caption: newImageCaption || `Image ${maxOrder + 1}`,
          display_order: maxOrder + 1,
          is_active: true
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(insertError.message || 'Database insert failed')
      }

      setNewImageUrl('')
      setNewImageCaption('')
      await loadBlitzImages()
      alert('✅ Conversation image added successfully!')
    } catch (err: any) {
      console.error('Failed to add image:', err)
      setError(`❌ Failed to add image: ${err.message || 'Unknown error'}`)
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

  // Ultra Chat Functions
  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('show_questions')
        .select('*')
        .order('position', { ascending: true })
        .limit(10)

      if (error) throw error
      if (data) setQuestions(data as ShowQuestion[])
    } catch (err) {
      console.error('Failed to load questions:', err)
    }
  }

  const addQuestion = async () => {
    if (!newQuestionTopic.trim() || !newQuestionText.trim()) {
      setError('⚠️ Please enter both character name and question')
      return
    }

    setAddingQuestion(true)
    try {
      const nextPosition = questions.length + 1

      const { data, error } = await supabase
        .from('show_questions')
        .insert({
          topic: newQuestionTopic.trim(),
          question_text: newQuestionText.trim(),
          position: nextPosition,
          tts_generated: false,
          show_on_overlay: false
        })
        .select()
        .single()

      if (error) throw error

      // Auto-generate TTS for new question
      if (data) {
        await generateQuestionTTS(data.id, data.question_text)
      }

      setNewQuestionTopic('')
      setNewQuestionText('')
      setShowAddQuestion(false)
      await loadQuestions()
    } catch (err: any) {
      console.error('Failed to add question:', err)
      setError(`❌ Failed to add question: ${err.message}`)
    } finally {
      setAddingQuestion(false)
    }
  }

  const generateQuestionTTS = async (questionId: string, text: string) => {
    setGeneratingTTS(questionId)
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-tts`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: text,
          voiceId: 'DTKMou8ccj1ZaWGBiotd' // ElevenLabs BetaBot voice
        }),
      })

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // Convert base64 to blob
      const audioBlob = base64ToBlob(result.audioContent, 'audio/mpeg')
      const fileName = `betabot-${questionId}-${Date.now()}.mp3`

      const { error: uploadError } = await supabase.storage
        .from('tts-audio')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('tts-audio')
        .getPublicUrl(fileName)

      await supabase
        .from('show_questions')
        .update({
          tts_generated: true,
          tts_audio_url: publicUrl
        })
        .eq('id', questionId)

    } catch (err: any) {
      console.error('TTS generation error:', err)
      setError(`⚠️ TTS generation failed: ${err.message}`)
    } finally {
      setGeneratingTTS(null)
    }
  }

  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type })
  }

  const sendQuestionToOverlay = async (questionId: string) => {
    try {
      // Clear any previously shown questions
      await supabase
        .from('show_questions')
        .update({ show_on_overlay: false })
        .eq('show_on_overlay', true)

      // Set this question to show on overlay
      const { error } = await supabase
        .from('show_questions')
        .update({
          show_on_overlay: true,
          overlay_triggered_at: new Date().toISOString()
        })
        .eq('id', questionId)

      if (error) throw error
    } catch (err) {
      console.error('Error sending question:', err)
      setError('Failed to send question to overlay')
    }
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('show_questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error
      await loadQuestions()
    } catch (err) {
      console.error('Error deleting question:', err)
      setError('Failed to delete question')
    }
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

          // Special rendering for Morning Show with mode switcher AND image manager
          if (config.hasImageManager && config.hasModeSwitcher && config.type === 'morning_blitz') {
            return (
              <div key={config.type} className="col-span-2 md:col-span-3 lg:col-span-4">
                <div
                  className={`relative rounded-lg border-2 p-4 transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-400 shadow-lg shadow-cyan-500/60'
                      : 'bg-gray-900 border-gray-700'
                  }`}
                >
                  {/* Header with toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-8 h-8 transition-all ${
                        isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-gray-500'
                      }`} />
                      <div>
                        <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {config.label}
                        </h3>
                        <p className="text-xs text-gray-500">Morning Show Layouts & Images</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMorningBlitzClick}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-bold text-sm"
                      >
                        📸 Manage Images
                      </button>
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

                  {/* Mode Switcher */}
                  {isActive && (
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-400 flex items-center">Layout Mode:</span>
                      <div className="flex gap-2 flex-1">
                        {['blitz', 'out_of_context', '3_camera', '4_camera'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => changeMorningShowMode(mode)}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              currentMode === mode
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {mode.toUpperCase().replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          // Special rendering for Alpha Wednesday with mode switcher
          if (config.hasModeSwitcher && config.type === 'alpha_wednesday') {
            return (
              <div key={config.type} className="col-span-2 md:col-span-3 lg:col-span-4">
                <div
                  className={`relative rounded-lg border-2 p-4 transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-400 shadow-lg shadow-purple-500/60'
                      : 'bg-gray-900 border-gray-700'
                  }`}
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
                    <div className="flex gap-2">
                      <button
                        onClick={handleAlphaWedClick}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-bold text-sm"
                      >
                        ✏️ Edit Episode
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          graphic && toggleGraphic(graphic.id, isActive, config.htmlFile)
                        }}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${
                          isActive
                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {isActive ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  {/* Mode Switcher */}
                  {isActive && (
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-400 flex items-center">Layout Mode:</span>
                      <div className="flex gap-2 flex-1">
                        {[
                          { id: 'default', label: 'DEFAULT' },
                          { id: 'debate', label: 'DEBATE' },
                          { id: 'presentation', label: 'PRESENTATION' },
                          { id: 'gaming', label: 'CLEAN SLATE' }
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={(e) => {
                              e.stopPropagation()
                              changeAlphaWednesdayMode(id)
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              currentMode === id
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {label}
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

        {/* Ultra Chat Section */}
        <div className="col-span-2 md:col-span-3 lg:col-span-4">
          <div className="relative rounded-lg border-2 p-4 bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-yellow-400 shadow-lg shadow-yellow-500/60">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <div>
                  <h3 className="font-bold text-lg text-white">💬 Ultra Chat</h3>
                  <p className="text-xs text-gray-400">BetaBot Questions ({questions.length} queued)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddQuestion(!showAddQuestion)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-bold text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {/* Add Question Form */}
            {showAddQuestion && (
              <div className="mb-4 p-4 bg-gray-900 border border-yellow-500/30 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Character Name</label>
                    <input
                      type="text"
                      value={newQuestionTopic}
                      onChange={(e) => setNewQuestionTopic(e.target.value)}
                      placeholder="BetaBot, Alpha, AZ, etc."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Question Text</label>
                    <textarea
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Enter the question BetaBot will ask..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addQuestion}
                      disabled={addingQuestion}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-700 font-bold transition-colors"
                    >
                      {addingQuestion ? 'Adding...' : 'Add & Generate TTS'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddQuestion(false)
                        setNewQuestionTopic('')
                        setNewQuestionText('')
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-2">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No questions queued. Click "Add Question" to get started.
                </div>
              ) : (
                questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 font-bold">#{index + 1}</span>
                        <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-800 rounded">{q.topic}</span>
                        {q.tts_generated && (
                          <Volume2 className="w-3 h-3 text-green-400" title="TTS Ready" />
                        )}
                        {generatingTTS === q.id && (
                          <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" title="Generating TTS..." />
                        )}
                      </div>
                      <p className="text-white text-sm line-clamp-2">{q.question_text}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendQuestionToOverlay(q.id)}
                        disabled={!q.tts_generated}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold rounded transition-colors flex items-center gap-2"
                        title={q.tts_generated ? 'Send to overlay' : 'TTS not ready'}
                      >
                        <Send className="w-4 h-4" />
                        SEND
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Info */}
            <div className="mt-4 text-xs text-gray-400 bg-yellow-900/20 p-2 rounded">
              💡 Questions auto-generate ElevenLabs TTS. Click SEND when ready to show on stream.
            </div>
          </div>
        </div>
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
