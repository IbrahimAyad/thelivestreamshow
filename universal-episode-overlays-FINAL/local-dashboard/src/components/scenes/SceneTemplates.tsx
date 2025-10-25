import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useScene } from '../../contexts/SceneContext'
import { useShow } from '../../contexts/ShowContext'
import { normalizeSceneSources } from '../../utils/dataNormalization'
import { Layout, Play, Filter, Sparkles, Check } from 'lucide-react'
import type { SceneTemplate } from '../../lib/supabase'

interface Show {
  id: string
  name: string
  theme_color: string
}

export function SceneTemplates() {
  const { activeScene, applyScene, isTransitioning } = useScene()
  const { currentShow } = useShow()
  const [templates, setTemplates] = useState<SceneTemplate[]>([])
  const [shows, setShows] = useState<Show[]>([])
  const [selectedShow, setSelectedShow] = useState<string>('all')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoIndex, setDemoIndex] = useState(0)
  const [applying, setApplying] = useState<string | null>(null)
  const [hoveredTemplate, setHoveredTemplate] = useState<SceneTemplate | null>(null)

  useEffect(() => {
    loadTemplates()
    loadShows()
  }, [])

  useEffect(() => {
    if (isDemoMode && templates.length > 0 && !isTransitioning) {
      const interval = setInterval(() => {
        setDemoIndex((prev) => {
          const nextIndex = (prev + 1) % templates.length
          applyTemplate(templates[nextIndex])
          return nextIndex
        })
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [isDemoMode, templates, isTransitioning])

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('scene_templates')
      .select('*')
      .order('is_custom', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (data) setTemplates(data as SceneTemplate[])
  }

  const loadShows = async () => {
    const { data } = await supabase
      .from('shows')
      .select('id, name, theme_color')
      .order('name')
    
    if (data) setShows(data as Show[])
  }

  const applyTemplate = async (template: SceneTemplate) => {
    if (applying || isTransitioning) return
    
    setApplying(template.id)
    
    try {
      const config = template.config as any
      const thumbnailUrl = config?.thumbnail_url || template.thumbnail_url
      
      // Normalize scene sources to ensure correct data structure
      // Database stores position_x/position_y as flat properties
      // Frontend expects position: { x, y } nested object
      const normalizedConfig = {
        ...config,
        sources: config?.sources ? normalizeSceneSources(config.sources) : undefined
      }
      
      // Use scene context to apply the template
      await applyScene(
        template.id,
        template.name,
        normalizedConfig,
        thumbnailUrl
      )
      
      // Show success toast
      toast.success(`Switched to ${template.name}`)
    } catch (error) {
      console.error('Failed to apply template:', error)
      toast.error('Failed to apply template')
    } finally {
      setApplying(null)
    }
  }

  const deleteCustomTemplate = async (id: string) => {
    if (!confirm('Delete this custom template?')) return

    await supabase.from('scene_templates').delete().eq('id', id)
    loadTemplates()
  }

  const filteredTemplates = selectedShow === 'all'
    ? templates
    : templates.filter(t => {
        const config = t.config as any
        return config?.show_id === selectedShow
      })

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode)
    if (!isDemoMode) {
      setDemoIndex(0)
    }
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layout className="w-6 h-6 text-green-500" />
          Scene Templates
          {isDemoMode && (
            <span className="text-sm font-normal text-yellow-400 animate-pulse">
              (Demo Mode)
            </span>
          )}
        </h2>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDemoMode}
            className={`px-4 py-2 rounded font-semibold flex items-center gap-2 transition-colors ${
              isDemoMode
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isDemoMode ? 'Stop Demo' : 'Demo Templates'}
          </button>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedShow}
              onChange={(e) => setSelectedShow(e.target.value)}
              className="bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
            >
              <option value="all">All Shows</option>
              {shows.map(show => (
                <option key={show.id} value={show.id}>{show.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredTemplates.map(template => {
          const config = template.config as any
          const thumbnailUrl = config?.thumbnail_url || template.thumbnail_url
          const isRecommended = currentShow && config?.show_id === currentShow.id
          
          return (
            <div
              key={template.id}
              className={`bg-[#1a1a1a] rounded-lg border overflow-hidden group cursor-pointer transition-all ${
                activeScene?.id === template.id 
                  ? 'border-green-500 ring-2 ring-green-500/50' 
                  : isDemoMode && templates[demoIndex]?.id === template.id
                  ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                  : applying === template.id
                  ? 'border-blue-500 ring-2 ring-blue-500/50 opacity-75'
                  : isRecommended && currentShow
                  ? `border-2 ring-1`
                  : 'border-[#3a3a3a] hover:border-green-500/50'
              }`}
              style={{
                borderColor: isRecommended && currentShow ? currentShow.theme_color : undefined,
                boxShadow: isRecommended && currentShow ? `0 0 0 1px ${currentShow.theme_color}50` : undefined
              }}
              onClick={() => activeScene?.id !== template.id && applyTemplate(template)}
              onMouseEnter={() => setHoveredTemplate(template)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                {thumbnailUrl ? (
                  <img 
                    src={thumbnailUrl} 
                    alt={template.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <Layout className="w-12 h-12 text-gray-600" />
                )}
                {activeScene?.id !== template.id && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                )}
                {activeScene?.id === template.id && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    LIVE
                  </div>
                )}
                {applying === template.id && (
                  <div className="absolute inset-0 bg-blue-600/80 flex items-center justify-center">
                    <div className="text-white font-bold">Applying...</div>
                  </div>
                )}
                {isDemoMode && templates[demoIndex]?.id === template.id && (
                  <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded animate-pulse">
                    DEMO
                  </div>
                )}
                {isRecommended && currentShow && (
                  <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded font-bold" style={{ backgroundColor: currentShow.theme_color, color: 'white' }}>
                    RECOMMENDED
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm truncate">{template.name}</div>
                {template.description && (
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">{template.description}</div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 capitalize">{template.layout_type}</span>
                  {template.is_custom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCustomTemplate(template.id)
                      }}
                      className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{selectedShow === 'all' ? 'No templates available' : 'No templates for this show'}</p>
          <p className="text-sm mt-2">Create scene templates in the Scenes tab</p>
        </div>
      )}
    </div>
  )
}
