import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Scissors, Plus, Download, Check } from 'lucide-react'
import type { ClipMarker } from '../../lib/supabase'

export function ClipMarkers() {
  const [markers, setMarkers] = useState<ClipMarker[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')

  useEffect(() => {
    loadMarkers()
  }, [])

  const loadMarkers = async () => {
    const { data } = await supabase
      .from('clip_markers')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (data) setMarkers(data as ClipMarker[])
  }

  const addMarker = async () => {
    if (!newTitle.trim()) {
      alert('Please enter a title for the clip marker')
      return
    }

    await supabase
      .from('clip_markers')
      .insert({
        timestamp: new Date().toISOString(),
        title: newTitle,
        notes: newNotes || null,
        is_clipped: false
      })

    setNewTitle('')
    setNewNotes('')
    setShowAddDialog(false)
    loadMarkers()
  }

  const toggleClipped = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('clip_markers')
      .update({ is_clipped: !currentStatus })
      .eq('id', id)
    
    loadMarkers()
  }

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Title', 'Notes', 'Clipped']
    const rows = markers.map(m => [
      new Date(m.timestamp).toLocaleString(),
      m.title,
      m.notes || '',
      m.is_clipped ? 'Yes' : 'No'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clip-markers-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="w-6 h-6 text-yellow-500" />
          Clip Markers
        </h2>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
            disabled={markers.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Mark Clip
          </button>
        </div>
      </div>

      {showAddDialog && (
        <div className="mb-6 p-4 bg-[#1a1a1a] rounded border border-yellow-500/30">
          <h3 className="font-bold mb-3">Add Clip Marker</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Clip title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded"
            />
            <textarea
              placeholder="Notes (optional)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={addMarker}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold"
              >
                Add Marker
              </button>
              <button
                onClick={() => {
                  setShowAddDialog(false)
                  setNewTitle('')
                  setNewNotes('')
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {markers.map(marker => (
          <div
            key={marker.id}
            className={`bg-[#1a1a1a] rounded border p-4 ${
              marker.is_clipped ? 'border-green-500/50 bg-green-900/10' : 'border-[#3a3a3a]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold">{marker.title}</div>
                  {marker.is_clipped && (
                    <span className="text-xs bg-green-600 px-2 py-0.5 rounded">CLIPPED</span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {formatTime(marker.timestamp)}
                </div>
                {marker.notes && (
                  <div className="text-sm text-gray-300">{marker.notes}</div>
                )}
              </div>
              <button
                onClick={() => toggleClipped(marker.id, marker.is_clipped)}
                className={`p-2 rounded ${
                  marker.is_clipped
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={marker.is_clipped ? 'Mark as not clipped' : 'Mark as clipped'}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {markers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No clip markers yet</p>
          <p className="text-sm">Click Mark Clip to capture important moments</p>
        </div>
      )}
    </div>
  )
}
