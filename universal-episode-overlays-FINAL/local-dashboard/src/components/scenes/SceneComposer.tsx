import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { Layers, Save, Video, Image, Monitor, Globe } from 'lucide-react'
import type { StreamSource, MediaLibraryItem } from '../../lib/supabase'

export function SceneComposer() {
  const [sources, setSources] = useState<StreamSource[]>([])
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryItem[]>([])
  const [selectedSource, setSelectedSource] = useState<StreamSource | null>(null)
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false)

  useEffect(() => {
    loadSources()
    loadMediaLibrary()
  }, [])

  const loadSources = async () => {
    const { data } = await supabase
      .from('stream_sources')
      .select('*')
      .order('z_index', { ascending: false })
    
    if (data) setSources(data as StreamSource[])
  }

  const loadMediaLibrary = async () => {
    const { data } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setMediaLibrary(data as MediaLibraryItem[])
  }

  const addSource = async (type: string, sourceUrl?: string, mediaId?: string) => {
    const maxZIndex = sources.reduce((max, s) => Math.max(max, s.z_index), 0)
    const timestamp = Date.now()

    const { error } = await supabase
      .from('stream_sources')
      .insert({
        name: `${type} Source ${timestamp}`,
        source_type: type,
        source_url: sourceUrl || null,
        media_id: mediaId || null,
        position_x: 100,
        position_y: 100,
        width: 400,
        height: 300,
        z_index: maxZIndex + 1,
        is_active: true,
        volume: 100,
        config: {}
      })

    if (error) {
      console.error('Error adding source:', error)
      toast.error('Failed to add source: ' + error.message)
      return
    }

    loadSources()
    setShowAddSourceDialog(false)
  }

  const updateSourcePosition = async (id: string, x: number, y: number) => {
    await supabase
      .from('stream_sources')
      .update({ position_x: x, position_y: y })
      .eq('id', id)
  }

  const updateSourceSize = async (id: string, width: number, height: number) => {
    await supabase
      .from('stream_sources')
      .update({ width, height })
      .eq('id', id)
  }

  const updateSourceZIndex = async (id: string, direction: 'up' | 'down') => {
    const source = sources.find(s => s.id === id)
    if (!source) return

    const newZIndex = direction === 'up' ? source.z_index + 1 : source.z_index - 1
    await supabase
      .from('stream_sources')
      .update({ z_index: newZIndex })
      .eq('id', id)

    loadSources()
  }

  const deleteSource = async (id: string) => {
    await supabase.from('stream_sources').delete().eq('id', id)
    loadSources()
  }

  const saveAsTemplate = async () => {
    const templateName = prompt('Enter template name:')
    if (!templateName) return

    const config = {
      sources: sources.map(s => ({
        type: s.source_type,
        position_x: s.position_x,
        position_y: s.position_y,
        width: s.width,
        height: s.height,
        z_index: s.z_index
      }))
    }

    await supabase
      .from('scene_templates')
      .insert({
        name: templateName,
        layout_type: 'custom',
        is_custom: true,
        config
      })

    toast.success('Template saved!')
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-500" />
          Scene Composer
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddSourceDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
          >
            Add Source
          </button>
          <button
            onClick={saveAsTemplate}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Template
          </button>
        </div>
      </div>

      {showAddSourceDialog && (
        <div className="mb-6 p-4 bg-[#1a1a1a] rounded border border-blue-500/30">
          <h3 className="font-bold mb-3">Add Source</h3>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => addSource('webcam')}
              className="p-4 bg-blue-600/20 border border-blue-500 rounded hover:bg-blue-600/30"
            >
              <Video className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm">Webcam</div>
            </button>
            <button
              onClick={() => {
                const url = prompt('Enter stream URL:')
                if (url) addSource('stream', url)
              }}
              className="p-4 bg-purple-600/20 border border-purple-500 rounded hover:bg-purple-600/30"
            >
              <Globe className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm">Stream URL</div>
            </button>
            <button
              onClick={() => {
                const mediaId = prompt('Enter media ID or select from list:')
                if (mediaId) addSource('video_file', undefined, mediaId)
              }}
              className="p-4 bg-green-600/20 border border-green-500 rounded hover:bg-green-600/30"
            >
              <Video className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm">Video File</div>
            </button>
            <button
              onClick={() => {
                const mediaId = prompt('Enter media ID or select from list:')
                if (mediaId) addSource('image', undefined, mediaId)
              }}
              className="p-4 bg-yellow-600/20 border border-yellow-500 rounded hover:bg-yellow-600/30"
            >
              <Image className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm">Image</div>
            </button>
          </div>
          <button
            onClick={() => setShowAddSourceDialog(false)}
            className="mt-3 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-black rounded-lg aspect-video relative border-2 border-[#3a3a3a] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
              1920 x 1080 Canvas Preview
            </div>
            {sources.map(source => (
              <div
                key={source.id}
                className={`absolute border-2 cursor-move ${
                  selectedSource?.id === source.id ? 'border-blue-500' : 'border-white/30'
                }`}
                style={{
                  left: `${(source.position_x / 1920) * 100}%`,
                  top: `${(source.position_y / 1080) * 100}%`,
                  width: `${(source.width / 1920) * 100}%`,
                  height: `${(source.height / 1080) * 100}%`,
                  zIndex: source.z_index
                }}
                onClick={() => setSelectedSource(source)}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <div className="text-xs text-white bg-black/60 px-2 py-1 rounded">
                    {source.source_type}
                  </div>
                </div>
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-1">
                  Z:{source.z_index}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-gray-400 mb-3">SOURCE LAYERS</h3>
          <div className="space-y-2">
            {sources.map(source => (
              <div
                key={source.id}
                className={`p-3 rounded border cursor-pointer ${
                  selectedSource?.id === source.id
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-[#1a1a1a] border-[#3a3a3a]'
                }`}
                onClick={() => setSelectedSource(source)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm capitalize">{source.source_type}</div>
                  <div className="text-xs text-gray-400">Z: {source.z_index}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateSourceZIndex(source.id, 'up')
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    Up
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateSourceZIndex(source.id, 'down')
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    Down
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSource(source.id)
                    }}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No sources added
              </div>
            )}
          </div>

          {selectedSource && (
            <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
              <h4 className="font-bold text-sm mb-3">Selected Source</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="text-gray-400 text-xs">Position X</label>
                  <input
                    type="number"
                    value={selectedSource.position_x}
                    onChange={(e) => updateSourcePosition(selectedSource.id, parseInt(e.target.value), selectedSource.position_y)}
                    className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs">Position Y</label>
                  <input
                    type="number"
                    value={selectedSource.position_y}
                    onChange={(e) => updateSourcePosition(selectedSource.id, selectedSource.position_x, parseInt(e.target.value))}
                    className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs">Width</label>
                  <input
                    type="number"
                    value={selectedSource.width}
                    onChange={(e) => updateSourceSize(selectedSource.id, parseInt(e.target.value), selectedSource.height)}
                    className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs">Height</label>
                  <input
                    type="number"
                    value={selectedSource.height}
                    onChange={(e) => updateSourceSize(selectedSource.id, selectedSource.width, parseInt(e.target.value))}
                    className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
