import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Users } from 'lucide-react'
import { supabase, Note } from '../lib/supabase'
import { useRealtimeChannel } from '../hooks/useRealtimeChannel'

export const NotesPanel = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newNote, setNewNote] = useState({
    content: '',
    note_type: 'general',
    target_role: '',
    is_cue_card: false
  })
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadNotes()
  }, [])

  // Use stable realtime channel for notes updates
  useRealtimeChannel('notes_changes_stable', {
    table: 'notes',
    onChange: (payload) => {
      console.log('📝 Notes updated via realtime:', payload)
      loadNotes()
    },
    onError: (error) => {
      console.error('❌ Notes realtime channel error:', error)
    }
  })

  const loadNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setNotes(data)
  }

  const addNote = async () => {
    if (!newNote.content) return

    await supabase.from('notes').insert({
      ...newNote,
      author: 'Producer'
    })

    setNewNote({
      content: '',
      note_type: 'general',
      target_role: '',
      is_cue_card: false
    })
    setShowAdd(false)
  }

  const deleteNote = async (id: string) => {
    await supabase
      .from('notes')
      .delete()
      .eq('id', id)
  }

  const filteredNotes = filterType === 'all' 
    ? notes 
    : filterType === 'cue-cards'
    ? notes.filter(n => n.is_cue_card)
    : notes.filter(n => n.note_type === filterType)

  const noteTypes = ['general', 'technical', 'script', 'reminder']
  const roles = ['Host', 'Producer', 'Director', 'Everyone']

  const getNoteIcon = (type: string) => {
    if (type === 'cue-cards') return '📋'
    if (type === 'technical') return '🔧'
    if (type === 'script') return '📝'
    if (type === 'reminder') return '⏰'
    return '📄'
  }

  const getNoteColor = (type: string) => {
    if (type === 'technical') return 'border-blue-500/50 bg-blue-500/10'
    if (type === 'script') return 'border-purple-500/50 bg-purple-500/10'
    if (type === 'reminder') return 'border-yellow-500/50 bg-yellow-500/10'
    return 'border-gray-500/50 bg-gray-500/10'
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Notes & Cue Cards
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'cue-cards', ...noteTypes].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
              filterType === type
                ? 'bg-blue-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#1e1e1e]'
            }`}
          >
            {type.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded p-3 mb-4 space-y-3">
          <textarea
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            placeholder="Enter note content..."
            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={newNote.note_type}
                onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
              >
                {noteTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Target Role</label>
              <select
                value={newNote.target_role}
                onChange={(e) => setNewNote({ ...newNote, target_role: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
              >
                <option value="">All</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={newNote.is_cue_card}
              onChange={(e) => setNewNote({ ...newNote, is_cue_card: e.target.checked })}
              className="w-4 h-4"
            />
            Mark as Cue Card
          </label>
          <button
            onClick={addNote}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
          >
            Add Note
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredNotes.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No notes found.</p>
        )}

        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`border rounded p-3 ${getNoteColor(note.note_type)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getNoteIcon(note.is_cue_card ? 'cue-cards' : note.note_type)}</span>
                <div>
                  {note.is_cue_card && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded font-semibold">CUE CARD</span>
                  )}
                  {note.target_role && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3" />
                      {note.target_role}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white text-sm leading-relaxed">{note.content}</p>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{note.author || 'Unknown'}</span>
              <span>{new Date(note.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
