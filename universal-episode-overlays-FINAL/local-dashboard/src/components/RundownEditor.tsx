import { useState, useEffect } from 'react'
import { List, Plus, Trash2, CheckCircle, Circle } from 'lucide-react'
import { supabase, RundownSegment } from '../lib/supabase'

export const RundownEditor = () => {
  const [segments, setSegments] = useState<RundownSegment[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newSegment, setNewSegment] = useState({
    title: '',
    description: '',
    duration_seconds: 300,
    segment_type: 'content',
    color: '#3b82f6'
  })

  useEffect(() => {
    loadSegments()

    const subscription = supabase
      .channel('rundown_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rundown_segments' }, () => {
        loadSegments()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSegments = async () => {
    const { data } = await supabase
      .from('rundown_segments')
      .select('*')
      .order('position', { ascending: true })
    
    if (data) setSegments(data)
  }

  const addSegment = async () => {
    if (!newSegment.title) return

    await supabase.from('rundown_segments').insert({
      ...newSegment,
      position: segments.length,
      status: 'pending'
    })

    setNewSegment({
      title: '',
      description: '',
      duration_seconds: 300,
      segment_type: 'content',
      color: '#3b82f6'
    })
    setShowAdd(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('rundown_segments')
      .update({ status })
      .eq('id', id)
  }

  const deleteSegment = async (id: string) => {
    await supabase
      .from('rundown_segments')
      .delete()
      .eq('id', id)
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalDuration = (): string => {
    const total = segments.reduce((sum, seg) => sum + seg.duration_seconds, 0)
    return formatDuration(total)
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'in-progress': return 'text-yellow-500'
      case 'pending': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const segmentTypes = ['intro', 'content', 'discussion', 'video-reaction', 'outro', 'break']
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <List className="w-5 h-5" />
            Show Rundown
          </h2>
          <p className="text-sm text-gray-500">Total Duration: {getTotalDuration()}</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded p-3 mb-4 space-y-3">
          <input
            type="text"
            value={newSegment.title}
            onChange={(e) => setNewSegment({ ...newSegment, title: e.target.value })}
            placeholder="Segment title"
            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
          />
          <textarea
            value={newSegment.description}
            onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={newSegment.duration_seconds}
                onChange={(e) => setNewSegment({ ...newSegment, duration_seconds: parseInt(e.target.value) })}
                className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={newSegment.segment_type}
                onChange={(e) => setNewSegment({ ...newSegment, segment_type: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
              >
                {segmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Color</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewSegment({ ...newSegment, color })}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    newSegment.color === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={addSegment}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
          >
            Add Segment
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {segments.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No segments added yet.</p>
        )}

        {segments.map((segment, index) => (
          <div
            key={segment.id}
            className="bg-[#1a1a1a] border border-[#3a3a3a] rounded p-3 flex items-start gap-3"
          >
            <div
              className="w-1 h-full rounded"
              style={{ backgroundColor: segment.color || '#3b82f6', minHeight: '60px' }}
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm font-mono">#{index + 1}</span>
                    <h3 className="text-white font-semibold">{segment.title}</h3>
                  </div>
                  {segment.description && (
                    <p className="text-gray-400 text-sm mt-1">{segment.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteSegment(segment.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">
                    {formatDuration(segment.duration_seconds)}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400 capitalize">{segment.segment_type}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(segment.id, 'pending')}
                    className={`text-xs px-2 py-1 rounded ${
                      segment.status === 'pending' ? 'bg-gray-600 text-white' : 'text-gray-500'
                    }`}
                  >
                    <Circle className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => updateStatus(segment.id, 'in-progress')}
                    className={`text-xs px-2 py-1 rounded ${
                      segment.status === 'in-progress' ? 'bg-yellow-600 text-white' : 'text-gray-500'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateStatus(segment.id, 'completed')}
                    className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                      segment.status === 'completed' ? 'bg-green-600 text-white' : 'text-gray-500'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
