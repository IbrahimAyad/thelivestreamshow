import { useState, useEffect } from 'react'
import { supabase, BroadcastGraphic } from '../lib/supabase'
import {
  Radio, Coffee, Clock, AlertTriangle, Image,
  BarChart3, Trophy, MessageSquare, Sparkles,
  Award, Zap, UserPlus, Gauge, Swords, Target
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
        <p className="text-xs mt-1">Click any graphic to show/hide on broadcast view</p>
      </div>
    </div>
  )
}
