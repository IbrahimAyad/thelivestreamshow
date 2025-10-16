import { useState, useEffect } from 'react'
import { supabase, ShowBookmark, ShowSegment, ShowMetadata } from '../lib/supabase'
import { Bookmark, Download, Trash2, Tag, FileText } from 'lucide-react'

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function BookmarkPanel() {
  const [bookmarks, setBookmarks] = useState<ShowBookmark[]>([])
  const [segments, setSegments] = useState<ShowSegment[]>([])
  const [currentTimestamp, setCurrentTimestamp] = useState(0)
  const [bookmarkLabel, setBookmarkLabel] = useState('')
  const [bookmarkNotes, setBookmarkNotes] = useState('')
  const [showMetadata, setShowMetadata] = useState<ShowMetadata | null>(null)

  useEffect(() => {
    loadBookmarks()
    loadSegments()
    loadShowMetadata()

    // Subscribe to bookmarks changes
    const bookmarksChannel = supabase
      .channel('bookmarks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_bookmarks'
      }, () => {
        loadBookmarks()
      })
      .subscribe()

    // Subscribe to show metadata changes
    const metadataChannel = supabase
      .channel('metadata_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_metadata'
      }, () => {
        loadShowMetadata()
      })
      .subscribe()

    return () => {
      bookmarksChannel.unsubscribe()
      metadataChannel.unsubscribe()
    }
  }, [])

  // Update current timestamp based on show metadata
  useEffect(() => {
    if (!showMetadata?.show_start_time || !showMetadata?.is_live) return

    const interval = setInterval(() => {
      const now = new Date()
      const startTime = new Date(showMetadata.show_start_time!)
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setCurrentTimestamp(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [showMetadata])

  const loadBookmarks = async () => {
    const { data } = await supabase
      .from('show_bookmarks')
      .select('*')
      .order('timestamp_seconds', { ascending: true })
    
    if (data) setBookmarks(data as ShowBookmark[])
  }

  const loadSegments = async () => {
    const { data } = await supabase
      .from('show_segments')
      .select('*')
      .order('segment_order', { ascending: true })
    
    if (data) setSegments(data as ShowSegment[])
  }

  const loadShowMetadata = async () => {
    const { data } = await supabase
      .from('show_metadata')
      .select('*')
      .limit(1)
      .single()
    
    if (data) setShowMetadata(data as ShowMetadata)
  }

  const markClip = async () => {
    if (!bookmarkLabel.trim()) {
      alert('Please enter a bookmark label')
      return
    }

    // Get active segment
    const activeSegment = segments.find(s => s.is_active)
    if (!activeSegment) {
      alert('No active segment. Please activate a segment first.')
      return
    }

    try {
      const { error } = await supabase
        .from('show_bookmarks')
        .insert({
          timestamp_seconds: currentTimestamp,
          segment_id: activeSegment.id,
          bookmark_label: bookmarkLabel,
          bookmark_notes: bookmarkNotes || ''
        })

      if (error) throw error

      // Clear inputs
      setBookmarkLabel('')
      setBookmarkNotes('')
      
      // Show success feedback
      const btn = document.getElementById('mark-clip-btn')
      if (btn) {
        btn.textContent = '✓ Marked!'
        setTimeout(() => {
          btn.textContent = 'Mark Clip'
        }, 2000)
      }
    } catch (error) {
      console.error('Error creating bookmark:', error)
      alert('Failed to create bookmark')
    }
  }

  const deleteBookmark = async (id: string) => {
    if (!confirm('Delete this bookmark?')) return

    try {
      const { error } = await supabase
        .from('show_bookmarks')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      alert('Failed to delete bookmark')
    }
  }

  const exportBookmarks = () => {
    const exportData = bookmarks.map(bm => {
      const segment = segments.find(s => s.id === bm.segment_id)
      return {
        timestamp: formatTime(bm.timestamp_seconds),
        timestamp_seconds: bm.timestamp_seconds,
        segment: segment?.segment_name || 'Unknown',
        label: bm.bookmark_label,
        notes: bm.bookmark_notes,
        created_at: bm.created_at
      }
    })

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `show-bookmarks-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getSegmentName = (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId)
    return segment?.segment_name || 'Unknown'
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Bookmark className="w-7 h-7 text-cyan-400" />
        Clip Bookmarks
      </h2>

      {/* Current Timestamp Display */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-2 border-cyan-400 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-cyan-300 font-semibold">CURRENT TIMESTAMP</p>
            <p className="text-2xl font-mono font-bold text-white">{formatTime(currentTimestamp)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-cyan-300 font-semibold">ACTIVE SEGMENT</p>
            <p className="text-sm font-bold text-white">
              {segments.find(s => s.is_active)?.segment_name || 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Mark Clip Section */}
      <div className="mb-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
        <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Create Bookmark
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Label *</label>
            <input
              type="text"
              value={bookmarkLabel}
              onChange={(e) => setBookmarkLabel(e.target.value)}
              placeholder="e.g., Great quote, Key moment, Transition"
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes (Optional)</label>
            <textarea
              value={bookmarkNotes}
              onChange={(e) => setBookmarkNotes(e.target.value)}
              placeholder="Add context or details..."
              rows={2}
              className="w-full px-3 py-2 bg-black border border-gray-600 rounded text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>

          <button
            id="mark-clip-btn"
            onClick={markClip}
            className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4" />
            Mark Clip
          </button>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Bookmarks ({bookmarks.length})
          </h3>
          {bookmarks.length > 0 && (
            <button
              onClick={exportBookmarks}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export JSON
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bookmarks.length === 0 ? (
            <div className="p-4 bg-gray-900/30 border border-gray-700 rounded text-center text-gray-500 text-sm">
              No bookmarks yet. Click "Mark Clip" to create one.
            </div>
          ) : (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-cyan-400 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-mono font-bold text-cyan-400">
                        {formatTime(bookmark.timestamp_seconds)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-indigo-900/50 border border-indigo-500/50 text-indigo-300 rounded">
                        {getSegmentName(bookmark.segment_id)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{bookmark.bookmark_label}</p>
                    {bookmark.bookmark_notes && (
                      <p className="text-xs text-gray-400">{bookmark.bookmark_notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded transition-all"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded text-sm text-cyan-300">
        <p className="font-semibold">Clip Markers</p>
        <p className="text-xs mt-1">Mark important moments for post-production editing</p>
      </div>
    </div>
  )
}
