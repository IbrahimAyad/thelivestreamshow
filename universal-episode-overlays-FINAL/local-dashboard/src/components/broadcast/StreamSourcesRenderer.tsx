import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface StreamSource {
  id: string
  source_type: string
  source_url: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  is_active: boolean
  config: any
}

export function StreamSourcesRenderer() {
  const [sources, setSources] = useState<StreamSource[]>([])

  useEffect(() => {
    loadSources()
    subscribeToChanges()
  }, [])

  const loadSources = async () => {
    const { data } = await supabase
      .from('stream_sources')
      .select('*')
      .eq('is_active', true)
      .order('z_index')
    
    if (data) setSources(data as StreamSource[])
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('stream_sources_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_sources'
      }, () => loadSources())
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {sources.map((source) => {
        if (!source.is_active) return null

        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${source.position_x}px`,
          top: `${source.position_y}px`,
          width: `${source.width}px`,
          height: `${source.height}px`,
          zIndex: source.z_index
        }

        if (source.source_type === 'image' && source.source_url) {
          return (
            <img
              key={source.id}
              src={source.source_url}
              alt={source.config?.graphicName || 'Stream graphic'}
              style={style}
              className="object-contain"
              onError={(e) => {
                console.error('Failed to load image:', source.source_url)
                e.currentTarget.style.display = 'none'
              }}
            />
          )
        }

        if (source.source_type === 'webcam') {
          return (
            <div
              key={source.id}
              style={style}
              className="bg-gray-800 border-2 border-blue-500 flex items-center justify-center rounded-lg overflow-hidden"
            >
              <div className="text-white text-sm font-semibold">🎥 Webcam</div>
            </div>
          )
        }

        if (source.source_type === 'video' && source.source_url) {
          return (
            <video
              key={source.id}
              src={source.source_url}
              style={style}
              className="object-contain"
              autoPlay
              loop
              muted
            />
          )
        }

        if (source.source_type === 'text') {
          return (
            <div
              key={source.id}
              style={{
                ...style,
                color: source.config?.textColor || '#ffffff',
                fontSize: source.config?.fontSize || '24px',
                fontWeight: source.config?.fontWeight || 'bold'
              }}
              className="flex items-center justify-center"
            >
              {source.config?.text || 'Text Source'}
            </div>
          )
        }

        return null
      })}

      {sources.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-lg">No active sources</p>
            <p className="text-sm mt-2">Apply a scene template or add sources in the Scenes tab</p>
          </div>
        </div>
      )}
    </div>
  )
}
