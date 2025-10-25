import { useState, useEffect } from 'react'
import { Type, Eye, EyeOff, Plus, Edit2, Trash2 } from 'lucide-react'
import OBSWebSocket from 'obs-websocket-js'
import { supabase } from '../lib/supabase'

interface LowerThirdsProps {
  obs: OBSWebSocket
  connected: boolean
}

interface LowerThird {
  id: string
  template_type: string
  title_text: string
  subtitle_text: string
  is_visible: boolean
  position: string
}

const TEMPLATE_TYPES = [
  { value: 'guest_name', label: 'Guest Name + Title', icon: '👤' },
  { value: 'social_media', label: 'Social Media', icon: '📱' },
  { value: 'topic', label: 'Topic/Segment', icon: '📌' },
  { value: 'breaking', label: 'Breaking News', icon: '🚨' }
]

export function LowerThirds({ obs, connected }: LowerThirdsProps) {
  const [lowerThirds, setLowerThirds] = useState<LowerThird[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    template_type: 'guest_name',
    title_text: '',
    subtitle_text: '',
    position: 'bottom_left'
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLowerThirds()
  }, [])

  const loadLowerThirds = async () => {
    try {
      const { data, error } = await supabase
        .from('lower_thirds')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setLowerThirds((data as unknown as LowerThird[]) || [])
    } catch (err) {
      console.error('Failed to load lower thirds:', err)
    }
  }

  const createLowerThird = async () => {
    if (!formData.title_text.trim()) return

    try {
      const { data, error } = await supabase
        .from('lower_thirds')
        .insert([formData])
        .select()

      if (error) throw error
      if (data && data.length > 0) {
        setLowerThirds([...lowerThirds, data[0] as unknown as LowerThird])
        setShowCreateModal(false)
        resetForm()
      }
    } catch (err: any) {
      alert('Failed to create lower third: ' + err.message)
    }
  }

  const updateLowerThird = async () => {
    if (!editingId || !formData.title_text.trim()) return

    try {
      const { error } = await supabase
        .from('lower_thirds')
        .update(formData)
        .eq('id', editingId)

      if (error) throw error

      setLowerThirds(lowerThirds.map(lt => 
        lt.id === editingId ? { ...lt, ...formData } : lt
      ))
      setEditingId(null)
      setShowCreateModal(false)
      resetForm()
    } catch (err: any) {
      alert('Failed to update lower third: ' + err.message)
    }
  }

  const deleteLowerThird = async (id: string) => {
    if (!confirm('Delete this lower third?')) return

    try {
      const { error } = await supabase
        .from('lower_thirds')
        .delete()
        .eq('id', id)

      if (error) throw error
      setLowerThirds(lowerThirds.filter(lt => lt.id !== id))
    } catch (err: any) {
      alert('Failed to delete lower third: ' + err.message)
    }
  }

  const toggleVisibility = async (lowerThird: LowerThird) => {
    if (!connected) {
      alert('Please connect to OBS first')
      return
    }

    setLoading(true)
    try {
      const newVisibility = !lowerThird.is_visible

      // Update text sources in OBS
      try {
        await obs.call('SetInputSettings', {
          inputName: 'LowerThird_Title',
          inputSettings: { text: lowerThird.title_text }
        })
      } catch (err) {
        console.warn('LowerThird_Title source not found in OBS')
      }

      try {
        await obs.call('SetInputSettings', {
          inputName: 'LowerThird_Subtitle',
          inputSettings: { text: lowerThird.subtitle_text }
        })
      } catch (err) {
        console.warn('LowerThird_Subtitle source not found in OBS')
      }

      // Try to toggle visibility of the text sources
      // Note: This requires the text sources to be in the current scene
      try {
        const sceneItems = await obs.call('GetSceneItemList', { sceneName: await getCurrentScene() })
        const items = (sceneItems as any).sceneItems || []
        
        for (const item of items) {
          if (item.sourceName === 'LowerThird_Title' || item.sourceName === 'LowerThird_Subtitle') {
            await obs.call('SetSceneItemEnabled', {
              sceneName: await getCurrentScene(),
              sceneItemId: item.sceneItemId,
              sceneItemEnabled: newVisibility
            })
          }
        }
      } catch (err) {
        console.warn('Failed to toggle source visibility:', err)
      }

      // Update database
      const { error } = await supabase
        .from('lower_thirds')
        .update({ is_visible: newVisibility })
        .eq('id', lowerThird.id)

      if (error) throw error

      // Hide all others
      await supabase
        .from('lower_thirds')
        .update({ is_visible: false })
        .neq('id', lowerThird.id)

      setLowerThirds(lowerThirds.map(lt => ({
        ...lt,
        is_visible: lt.id === lowerThird.id ? newVisibility : false
      })))
    } catch (err: any) {
      alert('Failed to toggle visibility: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentScene = async (): Promise<string> => {
    const response = await obs.call('GetCurrentProgramScene')
    return (response as any).currentProgramSceneName
  }

  const resetForm = () => {
    setFormData({
      template_type: 'guest_name',
      title_text: '',
      subtitle_text: '',
      position: 'bottom_left'
    })
  }

  const openEditModal = (lowerThird: LowerThird) => {
    setEditingId(lowerThird.id)
    setFormData({
      template_type: lowerThird.template_type,
      title_text: lowerThird.title_text,
      subtitle_text: lowerThird.subtitle_text,
      position: lowerThird.position
    })
    setShowCreateModal(true)
  }

  const navigateQueue = (direction: 'next' | 'prev') => {
    if (lowerThirds.length === 0) return
    
    let newIndex = currentIndex
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % lowerThirds.length
    } else {
      newIndex = currentIndex === 0 ? lowerThirds.length - 1 : currentIndex - 1
    }
    setCurrentIndex(newIndex)
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Type className="w-5 h-5" />
          Lower Thirds & Graphics
        </h2>
        <button
          onClick={() => {
            resetForm()
            setEditingId(null)
            setShowCreateModal(true)
          }}
          className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      {/* Setup Instructions */}
      {lowerThirds.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-900/50 rounded p-3 mb-4 text-sm">
          <strong>OBS Setup:</strong> Create two text sources named "LowerThird_Title" and "LowerThird_Subtitle" in your scene.
        </div>
      )}

      {/* Queue Navigation */}
      {lowerThirds.length > 1 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => navigateQueue('prev')}
            className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#333] rounded text-sm"
          >
            ← Previous
          </button>
          <div className="flex-1 text-center text-sm text-gray-400 py-1">
            {currentIndex + 1} of {lowerThirds.length}
          </div>
          <button
            onClick={() => navigateQueue('next')}
            className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#333] rounded text-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Lower Thirds List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {lowerThirds.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No lower thirds created yet. Click "Create New" to get started!
          </div>
        )}

        {lowerThirds.map((lt, index) => (
          <div
            key={lt.id}
            className={`bg-[#1a1a1a] rounded p-4 border-2 transition-all ${
              lt.is_visible
                ? 'border-green-600 shadow-lg shadow-green-900/50'
                : 'border-[#3a3a3a]'
            } ${
              index === currentIndex ? 'ring-2 ring-purple-600' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {TEMPLATE_TYPES.find(t => t.value === lt.template_type)?.icon || '📝'}
                  </span>
                  <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">
                    {TEMPLATE_TYPES.find(t => t.value === lt.template_type)?.label || lt.template_type}
                  </span>
                </div>
                <div className="font-bold text-lg">{lt.title_text}</div>
                {lt.subtitle_text && (
                  <div className="text-sm text-gray-400">{lt.subtitle_text}</div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(lt)}
                  className="p-2 text-blue-400 hover:text-blue-300"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteLowerThird(lt.id)}
                  className="p-2 text-red-400 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => toggleVisibility(lt)}
              disabled={!connected || loading}
              className={`w-full px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors ${
                lt.is_visible
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:bg-gray-700 disabled:text-gray-500`}
            >
              {lt.is_visible ? (
                <><EyeOff className="w-4 h-4" /> Hide Lower Third</>
              ) : (
                <><Eye className="w-4 h-4" /> Show Lower Third</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Lower Third' : 'Create Lower Third'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Template Type</label>
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                >
                  {TEMPLATE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Title Text</label>
                <input
                  type="text"
                  value={formData.title_text}
                  onChange={(e) => setFormData({ ...formData, title_text: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Subtitle Text</label>
                <input
                  type="text"
                  value={formData.subtitle_text}
                  onChange={(e) => setFormData({ ...formData, subtitle_text: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  placeholder="e.g., Expert Guest"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Position</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                >
                  <option value="bottom_left">Bottom Left</option>
                  <option value="bottom_center">Bottom Center</option>
                  <option value="bottom_right">Bottom Right</option>
                  <option value="top">Top</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingId ? updateLowerThird : createLowerThird}
                  disabled={!formData.title_text.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 rounded font-semibold"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingId(null)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
