import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { History, ExternalLink, FileText, Copy, CheckCircle2, Eye, Download } from 'lucide-react'

interface ShowSession {
  id: string
  episode_number: number
  episode_title: string
  episode_topic: string
  episode_date: string
  duration_seconds: number
  status: string
  analytics: any
  youtube_description: string
  show_notes: string
  questions_used: any[]
  bookmarks: any[]
}

export function ShowHistoryPanel() {
  const [sessions, setSessions] = useState<ShowSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ShowSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('show_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setSessions(data || [])
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewSession = async (session: ShowSession) => {
    setSelectedSession(session)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const exportSession = (session: ShowSession) => {
    const dataStr = JSON.stringify(session, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `episode-${session.episode_number}-${session.episode_title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="bg-gray-800 border-2 border-purple-600 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Show History</h2>
          </div>
          <Button onClick={loadSessions} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Browse archived episodes with full session data
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading show history...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No archived shows yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Complete a show to see it here
            </p>
          </div>
        ) : selectedSession ? (
          /* Session Detail View */
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSession(null)}
                >
                  ← Back to list
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportSession(selectedSession)}
                  className="bg-green-900/30 border-green-500 text-green-300 hover:bg-green-600 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                {/* Episode Header */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Episode #{selectedSession.episode_number}: {selectedSession.episode_title}
                  </h3>
                  <p className="text-gray-400">{selectedSession.episode_topic}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>{new Date(selectedSession.episode_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{formatDuration(selectedSession.duration_seconds)}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedSession.status}</span>
                  </div>
                </div>

                {/* Show Notes */}
                {selectedSession.show_notes && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Show Notes
                    </h4>
                    <div className="bg-gray-800 rounded p-4 text-gray-300 whitespace-pre-wrap">
                      {selectedSession.show_notes}
                    </div>
                  </div>
                )}

                {/* Questions Used */}
                {selectedSession.questions_used && selectedSession.questions_used.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-semibold text-white mb-3">
                      Questions Used ({selectedSession.questions_used.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedSession.questions_used.map((q: any, idx: number) => (
                        <div key={idx} className="bg-gray-800 rounded p-3">
                          <p className="text-white">{q.text}</p>
                          {q.topic && (
                            <p className="text-xs text-gray-500 mt-1">Topic: {q.topic}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bookmarks */}
                {selectedSession.bookmarks && selectedSession.bookmarks.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-semibold text-white mb-3">
                      Bookmarks ({selectedSession.bookmarks.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedSession.bookmarks.map((b: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-800 rounded p-3">
                          <div>
                            <p className="text-white">{b.description}</p>
                            {b.tags && (
                              <div className="flex gap-1 mt-1">
                                {b.tags.map((tag: string, i: number) => (
                                  <span key={i} className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-400">
                            {Math.floor(b.timestamp / 60)}:{String(b.timestamp % 60).padStart(2, '0')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube Description */}
                {selectedSession.youtube_description && (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        YouTube Description
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedSession.youtube_description, selectedSession.id)}
                      >
                        {copiedId === selectedSession.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-gray-800 rounded p-4 text-gray-300 text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                      {selectedSession.youtube_description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Sessions List */
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => viewSession(session)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      Episode #{session.episode_number} - {session.episode_title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{session.episode_topic}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(session.episode_date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{formatDuration(session.duration_seconds)}</span>
                      {session.questions_used && (
                        <>
                          <span>•</span>
                          <span>{session.questions_used.length} questions</span>
                        </>
                      )}
                      {session.bookmarks && session.bookmarks.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{session.bookmarks.length} bookmarks</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
