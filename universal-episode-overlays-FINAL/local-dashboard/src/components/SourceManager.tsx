import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Unlock, Layers } from 'lucide-react'
import OBSWebSocket from 'obs-websocket-js'

interface SourceManagerProps {
  obs: OBSWebSocket
  connected: boolean
  currentScene: string | null
}

interface SceneItem {
  sceneItemId: number
  sceneItemIndex: number
  sourceName: string
  sourceType: string
  sceneItemEnabled: boolean
  sceneItemLocked: boolean
}

export function SourceManager({ obs, connected, currentScene }: SourceManagerProps) {
  const [sources, setSources] = useState<SceneItem[]>([])
  const [filter, setFilter] = useState<'all' | 'cameras' | 'overlays' | 'media'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (connected && currentScene) {
      loadSceneSources()
    } else {
      setSources([])
    }
  }, [connected, currentScene])

  const loadSceneSources = async () => {
    if (!currentScene) return
    
    setLoading(true)
    try {
      const response = await obs.call('GetSceneItemList', { sceneName: currentScene })
      const items = response.sceneItems as unknown as SceneItem[]
      // Reverse to show top items first (higher index = on top)
      setSources(items.reverse())
    } catch (err) {
      console.error('Failed to load scene sources:', err)
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (item: SceneItem) => {
    if (!currentScene) return
    
    try {
      await obs.call('SetSceneItemEnabled', {
        sceneName: currentScene,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: !item.sceneItemEnabled
      })
      // Update local state
      setSources(sources.map(s => 
        s.sceneItemId === item.sceneItemId 
          ? { ...s, sceneItemEnabled: !s.sceneItemEnabled }
          : s
      ))
    } catch (err: any) {
      alert('Failed to toggle visibility: ' + err.message)
    }
  }

  const toggleLock = async (item: SceneItem) => {
    if (!currentScene) return
    
    try {
      await obs.call('SetSceneItemLocked', {
        sceneName: currentScene,
        sceneItemId: item.sceneItemId,
        sceneItemLocked: !item.sceneItemLocked
      })
      // Update local state
      setSources(sources.map(s => 
        s.sceneItemId === item.sceneItemId 
          ? { ...s, sceneItemLocked: !s.sceneItemLocked }
          : s
      ))
    } catch (err: any) {
      alert('Failed to toggle lock: ' + err.message)
    }
  }

  const matchesFilter = (source: SceneItem): boolean => {
    if (filter === 'all') return true
    const name = source.sourceName.toLowerCase()
    
    switch (filter) {
      case 'cameras':
        return name.includes('cam') || name.includes('webcam') || name.includes('camera')
      case 'overlays':
        return name.includes('overlay') || name.includes('graphic') || name.includes('lower')
      case 'media':
        return name.includes('video') || name.includes('media') || name.includes('audio')
      default:
        return true
    }
  }

  const filteredSources = sources.filter(matchesFilter)

  const getSourceTypeColor = (type: string): string => {
    if (type.includes('camera') || type.includes('video_capture')) return 'bg-blue-600'
    if (type.includes('browser') || type.includes('image')) return 'bg-purple-600'
    if (type.includes('text')) return 'bg-green-600'
    if (type.includes('audio')) return 'bg-yellow-600'
    return 'bg-gray-600'
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5" />
        Source Manager
        {currentScene && <span className="text-sm text-gray-400 font-normal">({currentScene})</span>}
      </h2>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {['all', 'cameras', 'overlays', 'media'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Source List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {loading && (
          <div className="text-center text-gray-500 py-8">
            Loading sources...
          </div>
        )}
        
        {!loading && !connected && (
          <div className="text-center text-gray-500 py-8">
            Connect to OBS to manage sources
          </div>
        )}
        
        {!loading && connected && !currentScene && (
          <div className="text-center text-gray-500 py-8">
            Select a scene to manage sources
          </div>
        )}
        
        {!loading && connected && currentScene && filteredSources.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No sources found{filter !== 'all' ? ` in "${filter}" category` : ''}
          </div>
        )}
        
        {filteredSources.map((item, index) => (
          <div
            key={item.sceneItemId}
            className={`bg-[#1a1a1a] rounded p-3 border border-[#3a3a3a] flex items-center gap-3 transition-opacity ${
              !item.sceneItemEnabled ? 'opacity-50' : ''
            }`}
          >
            {/* Z-Index Indicator */}
            <div className="text-xs text-gray-500 font-mono w-6 text-center">
              {sources.length - index}
            </div>

            {/* Source Info */}
            <div className="flex-1">
              <div className="font-semibold">{item.sourceName}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded ${getSourceTypeColor(item.sourceType)}`}>
                  {item.sourceType}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleVisibility(item)}
                className={`p-2 rounded transition-colors ${
                  item.sceneItemEnabled
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={item.sceneItemEnabled ? 'Hide source' : 'Show source'}
              >
                {item.sceneItemEnabled ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => toggleLock(item)}
                className={`p-2 rounded transition-colors ${
                  item.sceneItemLocked
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={item.sceneItemLocked ? 'Unlock source' : 'Lock source'}
              >
                {item.sceneItemLocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {connected && currentScene && filteredSources.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Z-order: Higher numbers appear on top
        </div>
      )}
    </div>
  )
}
