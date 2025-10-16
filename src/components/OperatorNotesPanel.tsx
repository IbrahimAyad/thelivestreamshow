import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StickyNote, Plus, Trash2, Filter, CheckCircle, Circle } from 'lucide-react'
import type { OperatorNote, ShowSegment } from '../lib/supabase'

type NoteType = 'cue' | 'reminder' | 'general'
type FilterType = 'all' | 'segment' | 'uncompleted'

export function OperatorNotesPanel() {
  const [notes, setNotes] = useState<OperatorNote[]>([])
  const [segments, setSegments] = useState<ShowSegment[]>([])
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string>('')
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({
    segment_id: '',
    note_text: '',
    note_type: 'general' as NoteType
  })

  useEffect(() => {
    loadNotes()
    loadSegments()

    const notesChannel = supabase
      .channel('operator_notes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'operator_notes'
      }, () => {
        loadNotes()
      })
      .subscribe()

    const segmentsChannel = supabase
      .channel('segments_notes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_segments'
      }, () => {
        loadSegments()
      })
      .subscribe()

    return () => {
      notesChannel.unsubscribe()
      segmentsChannel.unsubscribe()
    }
  }, [])

  const loadNotes = async () => {
    const { data } = await supabase
      .from('operator_notes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setNotes(data)
  }

  const loadSegments = async () => {
    const { data } = await supabase
      .from('show_segments')
      .select('*')
      .order('segment_order')
    
    if (data) setSegments(data)
  }

  const addNote = async () => {
    if (!newNote.segment_id || !newNote.note_text.trim()) {
      alert('Please select a segment and enter note text')
      return
    }

    const { error } = await supabase
      .from('operator_notes')
      .insert([{
        segment_id: newNote.segment_id,
        note_text: newNote.note_text.trim(),
        note_type: newNote.note_type,
        is_completed: false
      }])

    if (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note')
    } else {
      setNewNote({ segment_id: '', note_text: '', note_type: 'general' })
      setShowAddNote(false)
    }
  }

  const toggleCompleted = async (noteId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('operator_notes')
      .update({ 
        is_completed: !currentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)

    if (error) {
      console.error('Error updating note:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return

    const { error } = await supabase
      .from('operator_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const getSegmentName = (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId)
    return segment?.segment_name || 'Unknown'
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'cue': return 'bg-yellow-900/40 border-yellow-500 text-yellow-300'
      case 'reminder': return 'bg-blue-900/40 border-blue-500 text-blue-300'
      case 'general': return 'bg-gray-900/40 border-gray-500 text-gray-300'
      default: return 'bg-gray-900/40 border-gray-500 text-gray-300'
    }
  }

  const filteredNotes = notes.filter(note => {
    if (filterType === 'uncompleted' && note.is_completed) return false
    if (filterType === 'segment' && selectedSegmentFilter && note.segment_id !== selectedSegmentFilter) return false
    return true
  })

  return (
    <div className="bg-black border-2 border-cyan-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <StickyNote className="w-7 h-7 text-cyan-400" />
          Operator Notes
        </h2>
        <button
          onClick={() => setShowAddNote(!showAddNote)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Note
        </button>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <div className="mb-4 p-4 bg-cyan-900/20 border-2 border-cyan-500 rounded-lg">
          <h3 className="text-lg font-bold text-cyan-300 mb-3">New Note</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-cyan-300 mb-1">Segment</label>
              <select
                value={newNote.segment_id}
                onChange={(e) => setNewNote({ ...newNote, segment_id: e.target.value })}
                className="w-full px-3 py-2 bg-black border border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-400"
              >
                <option value="">Select segment...</option>
                {segments.map(seg => (
                  <option key={seg.id} value={seg.id}>{seg.segment_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-cyan-300 mb-1">Note Type</label>
              <select
                value={newNote.note_type}
                onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as NoteType })}
                className="w-full px-3 py-2 bg-black border border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-400"
              >
                <option value="general">General</option>
                <option value="cue">Cue</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-cyan-300 mb-1">Note Text</label>
              <textarea
                value={newNote.note_text}
                onChange={(e) => setNewNote({ ...newNote, note_text: e.target.value })}
                placeholder="Enter your note..."
                className="w-full px-3 py-2 bg-black border border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={addNote}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-all"
              >
                Save Note
              </button>
              <button
                onClick={() => {
                  setShowAddNote(false)
                  setNewNote({ segment_id: '', note_text: '', note_type: 'general' })
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-300">Filters</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
              filterType === 'all' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Show All
          </button>
          <button
            onClick={() => setFilterType('uncompleted')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
              filterType === 'uncompleted' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Uncompleted
          </button>
          <button
            onClick={() => setFilterType('segment')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
              filterType === 'segment' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            By Segment
          </button>
        </div>
        {filterType === 'segment' && (
          <select
            value={selectedSegmentFilter}
            onChange={(e) => setSelectedSegmentFilter(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-black border border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">All segments...</option>
            {segments.map(seg => (
              <option key={seg.id} value={seg.id}>{seg.segment_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notes found</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`p-3 border-2 rounded-lg transition-all ${
                note.is_completed ? 'opacity-60' : ''
              } ${getNoteTypeColor(note.note_type)}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase">
                      {getSegmentName(note.segment_id)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-black/50 rounded">
                      {note.note_type}
                    </span>
                  </div>
                  <p className={`text-sm ${note.is_completed ? 'line-through' : ''}`}>
                    {note.note_text}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleCompleted(note.id, note.is_completed)}
                    className="p-1 hover:bg-black/30 rounded transition-all"
                    title={note.is_completed ? 'Mark as uncompleted' : 'Mark as completed'}
                  >
                    {note.is_completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 hover:bg-red-900/50 rounded transition-all"
                    title="Delete note"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded text-sm text-cyan-300">
        <p className="font-semibold">Quick Notes for Operators</p>
        <p className="text-xs mt-1">Track cues, reminders, and important notes per segment</p>
      </div>
    </div>
  )
}
