import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface SceneSource {
  type: string
  url?: string
  position: { x: number; y: number; width: number; height: number }
  z_index?: number
}

interface SceneConfig {
  sources?: SceneSource[]
  show?: string
  show_id?: string
  thumbnail_url?: string
}

interface ActiveScene {
  id: string
  name: string
  config: SceneConfig
  thumbnail_url?: string
  layout_type?: string
}

interface SceneContextType {
  activeScene: ActiveScene | null
  setActiveScene: (scene: ActiveScene | null) => void
  applyScene: (sceneId: string, sceneName: string, config: SceneConfig, thumbnail?: string) => Promise<void>
  isTransitioning: boolean
}

const SceneContext = createContext<SceneContextType | undefined>(undefined)

export function SceneProvider({ children }: { children: ReactNode }) {
  const [activeScene, setActiveSceneState] = useState<ActiveScene | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Load active scene from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('activeScene')
    if (stored) {
      try {
        setActiveSceneState(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored scene:', e)
      }
    }
  }, [])

  const setActiveScene = (scene: ActiveScene | null) => {
    setActiveSceneState(scene)
    if (scene) {
      localStorage.setItem('activeScene', JSON.stringify(scene))
    } else {
      localStorage.removeItem('activeScene')
    }
  }

  const applyScene = async (sceneId: string, sceneName: string, config: SceneConfig, thumbnail?: string) => {
    setIsTransitioning(true)
    
    try {
      // Update active scene
      const newScene: ActiveScene = {
        id: sceneId,
        name: sceneName,
        config,
        thumbnail_url: thumbnail
      }
      
      setActiveScene(newScene)
      
      // Optional: Update stream_sources table for backward compatibility
      if (config?.sources) {
        await supabase.from('stream_sources').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        
        for (const source of config.sources) {
          await supabase.from('stream_sources').insert({
            source_type: source.type,
            source_url: source.url || null,
            position_x: source.position?.x || 0,
            position_y: source.position?.y || 0,
            width: source.position?.width || 100,
            height: source.position?.height || 100,
            z_index: source.z_index || 1,
            is_active: true,
            volume: 100,
            config: {}
          })
        }
      }
      
      // Simulate transition delay
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
      
    } catch (error) {
      console.error('Failed to apply scene:', error)
      setIsTransitioning(false)
      throw error
    }
  }

  return (
    <SceneContext.Provider value={{ activeScene, setActiveScene, applyScene, isTransitioning }}>
      {children}
    </SceneContext.Provider>
  )
}

export function useScene() {
  const context = useContext(SceneContext)
  if (context === undefined) {
    throw new Error('useScene must be used within a SceneProvider')
  }
  return context
}
