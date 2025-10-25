import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, CheckCircle, Archive } from 'lucide-react'

interface EndShowModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId?: string
  episodeInfo: {
    number: number
    title: string
    topic: string
  }
}

export function EndShowModal({ isOpen, onClose, sessionId, episodeInfo }: EndShowModalProps) {
  const [isArchiving, setIsArchiving] = useState(false)
  const [showNotes, setShowNotes] = useState('')
  const [archived, setArchived] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(sessionId)

  // When modal opens, fetch active_session_id from metadata if sessionId prop is undefined
  useEffect(() => {
    if (isOpen && !sessionId) {
      console.log('[EndShowModal] No sessionId prop provided, fetching from metadata...')
      fetchActiveSession()
    } else if (sessionId) {
      setActiveSessionId(sessionId)
    }
  }, [isOpen, sessionId])

  const fetchActiveSession = async () => {
    try {
      const { data, error } = await supabase
        .from('show_metadata')
        .select('active_session_id')
        .single()

      if (error) {
        console.error('[EndShowModal] Error fetching metadata:', error)
        return
      }

      if (data?.active_session_id) {
        console.log('[EndShowModal] ✅ Retrieved active session from database:', data.active_session_id)
        setActiveSessionId(data.active_session_id)
      } else {
        console.warn('[EndShowModal] ⚠️ No active_session_id found in metadata')
      }
    } catch (err) {
      console.error('[EndShowModal] Error:', err)
    }
  }

  const handleEndShow = async () => {
    setIsArchiving(true)

    try {
      const sessionToArchive = activeSessionId || sessionId
      
      // 1. Archive the session if we have a session ID
      if (sessionToArchive) {
        console.log('[EndShowModal] Archiving session:', sessionToArchive)
        const { data, error } = await supabase.rpc('archive_current_session', {
          p_session_id: sessionToArchive
        })

        if (error) {
          console.error('[EndShowModal] ❌ Archive RPC error:', error)
          throw error
        }

        console.log('[EndShowModal] ✅ Session archived:', data)
      } else {
        console.warn('[EndShowModal] ⚠️ No session ID available, skipping archival')
      }

      // 2. Save show notes if provided
      if (showNotes && sessionToArchive) {
        await supabase
          .from('show_sessions')
          .update({ show_notes: showNotes })
          .eq('id', sessionToArchive)
      }

      // 3. Mark show as not live and clear active_session_id
      await supabase
        .from('show_metadata')
        .update({ 
          is_live: false, 
          is_rehearsal: false,
          active_session_id: null
        })
        .limit(1)

      console.log('[EndShowModal] ✅ Show ended successfully')
      setArchived(true)

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
        setArchived(false)
        setShowNotes('')
        setActiveSessionId(undefined)
      }, 2000)

    } catch (err) {
      console.error('[EndShowModal] Failed to archive show:', err)
      alert('Failed to archive show. Check console for details.')
    } finally {
      setIsArchiving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="bg-gray-900 border-2 border-red-600/50 rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">
              End Show - Episode #{episodeInfo.number}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isArchiving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!archived ? (
            <>
              {/* Episode Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">{episodeInfo.title}</h3>
                <p className="text-sm text-gray-400">{episodeInfo.topic}</p>
              </div>

              {/* Show Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Show Notes (Optional)
                </label>
                <Textarea
                  value={showNotes}
                  onChange={(e) => setShowNotes(e.target.value)}
                  placeholder="Add any notes about this episode for future reference..."
                  rows={6}
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  disabled={isArchiving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes will be saved with the archived session
                </p>
              </div>

              {/* What Will Be Saved */}
              <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  What will be saved:
                </h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    All questions used with timestamps
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    BetaBot conversation history
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    Bookmarks & key moments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    Segments completed during show
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    Analytics & engagement scores
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    YouTube description (auto-generated with chapters)
                  </li>
                </ul>
              </div>

              {/* Warning */}
              <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  <strong>Note:</strong> This will mark the show as ended and save all data for archival.
                  The show will no longer be live.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Show Archived Successfully!</h3>
              <p className="text-gray-400">All data has been saved. Closing...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!archived && (
          <div className="flex gap-3 justify-end p-6 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndShow}
              disabled={isArchiving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isArchiving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  End Show & Archive
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
