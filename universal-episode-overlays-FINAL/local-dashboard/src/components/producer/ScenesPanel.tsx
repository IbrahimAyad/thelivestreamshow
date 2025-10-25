import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Monitor, Video, Grid3x3, Users, MessageSquare, Play, Coffee } from 'lucide-react'

interface Scene {
  id: string
  scene_name: string
  layout_type: string
  is_active: boolean
  config: any
}

export const ScenesPanel = () => {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)

  useEffect(() => {
    loadScenes()

    const channel = supabase
      .channel('scenes_panel_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_scenes'
      }, () => {
        loadScenes()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadScenes = async () => {
    const { data } = await supabase
      .from('broadcast_scenes')
      .select('*')
      .order('created_at')
    
    if (data) {
      setScenes(data as Scene[])
      const active = data.find((s: Scene) => s.is_active)
      if (active) setActiveSceneId(active.id)
    }
  }

  const switchScene = async (sceneId: string) => {
    // Set all scenes to inactive
    await supabase
      .from('broadcast_scenes')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Set selected scene to active
    await supabase
      .from('broadcast_scenes')
      .update({ is_active: true })
      .eq('id', sceneId)

    setActiveSceneId(sceneId)
  }

  const getSceneIcon = (layoutType: string) => {
    const icons: Record<string, any> = {
      'fullscreen_video': Video,
      'pip': Monitor,
      'split_screen': Grid3x3,
      'panel_grid': Grid3x3,
      'interview': Users,
      'reaction_view': MessageSquare,
      'intermission': Coffee
    }
    const Icon = icons[layoutType] || Video
    return <Icon className="w-6 h-6" />
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Monitor className="w-5 h-5 text-purple-500" />
        Scene Templates
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {scenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => switchScene(scene.id)}
            className={`p-4 rounded-lg transition-all ${
              scene.is_active
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white border-2 border-purple-400 shadow-lg scale-105'
                : 'bg-[#1a1a1a] text-gray-400 border border-[#3a3a3a] hover:bg-[#252525] hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={scene.is_active ? 'text-white' : 'text-gray-500'}>
                {getSceneIcon(scene.layout_type)}
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">{scene.scene_name}</div>
                <div className="text-xs opacity-75 capitalize">
                  {scene.layout_type.replace('_', ' ')}
                </div>
              </div>
            </div>
            {scene.is_active && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                <Play className="w-3 h-3" fill="currentColor" />
                <span>ACTIVE</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {activeSceneId && (
        <div className="mt-4 p-3 bg-purple-900/30 border border-purple-500/30 rounded text-sm text-purple-300">
          <span className="font-semibold">✅ Active Scene:</span> {scenes.find(s => s.id === activeSceneId)?.scene_name}
        </div>
      )}
    </div>
  )
}
