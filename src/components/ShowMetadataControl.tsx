import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Radio, PlayCircle, StopCircle, RotateCcw, AlertTriangle, Database, Clock } from 'lucide-react'
import type { ShowMetadata } from '../lib/supabase'
import { EndShowModal } from './EndShowModal'

export function ShowMetadataControl() {
  const [metadata, setMetadata] = useState<ShowMetadata | null>(null)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [episodeInfo, setEpisodeInfo] = useState({
    number: 1,
    title: 'Episode 1',
    topic: 'Today\'s Show'
  })
  const [sessionDuration, setSessionDuration] = useState<string>('00:00:00')

  // Update session duration timer
  useEffect(() => {
    if (!metadata?.show_start_time) {
      setSessionDuration('00:00:00')
      return
    }

    const updateDuration = () => {
      const startTime = new Date(metadata.show_start_time!)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      
      const hours = Math.floor(diffSeconds / 3600)
      const minutes = Math.floor((diffSeconds % 3600) / 60)
      const seconds = diffSeconds % 60
      
      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      setSessionDuration(formatted)
    }

    // Update immediately
    updateDuration()

    // Then update every second
    const interval = setInterval(updateDuration, 1000)

    return () => clearInterval(interval)
  }, [metadata?.show_start_time])

  useEffect(() => {
    loadMetadata()

    const channel = supabase
      .channel('show_metadata_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_metadata'
      }, () => {
        loadMetadata()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadMetadata = async () => {
    const { data } = await supabase
      .from('show_metadata')
      .select('*')
      .single()
    
    if (data) {
      setMetadata(data)
      
      // If there's an active session, recover it
      if (data.active_session_id) {
        console.log('[ShowMetadataControl] Recovering active session:', data.active_session_id)
        
        const { data: session, error: sessionError } = await supabase
          .from('show_sessions')
          .select('id, episode_number, episode_title, episode_topic, status')
          .eq('id', data.active_session_id)
          .single()
        
        if (sessionError) {
          console.error('[ShowMetadataControl] ⚠️ Error fetching active session:', sessionError)
          // Clear the orphaned reference
          await supabase
            .from('show_metadata')
            .update({ active_session_id: null })
            .eq('id', data.id)
          console.log('[ShowMetadataControl] ⚠️ Orphaned session reference cleared')
        } else if (session) {
          // Check if session is actually live
          if (session.status === 'live') {
            setSessionId(session.id)
            setEpisodeInfo({
              number: session.episode_number || 1,
              title: session.episode_title || 'Episode',
              topic: session.episode_topic || 'Today\'s Show'
            })
            console.log('[ShowMetadataControl] ✅ Session recovered:', session.id)
          } else {
            // Session exists but is not live - clear the reference
            console.warn('[ShowMetadataControl] ⚠️ Orphaned session detected (status: ' + session.status + ')')
            await supabase
              .from('show_metadata')
              .update({ active_session_id: null })
              .eq('id', data.id)
            console.log('[ShowMetadataControl] ⚠️ Orphaned session cleared')
          }
        }
      }
    }
  }

  const toggleLive = async () => {
    console.log('🔴 toggleLive clicked!')
    if (!metadata) return

    console.log('🔴 Toggling live from', metadata.is_live, 'to', !metadata.is_live)
    const { error } = await supabase
      .from('show_metadata')
      .update({
        is_live: !metadata.is_live,
        updated_at: new Date().toISOString()
      })
      .eq('id', metadata.id)

    if (error) {
      console.error('Error toggling live status:', error)
      alert('Failed to update live status')
    } else {
      console.log('✅ Live status updated successfully')
      loadMetadata() // Immediately reload to update UI
    }
  }

  const toggleRehearsal = async () => {
    console.log('⚠️ toggleRehearsal clicked!')
    if (!metadata) return

    console.log('⚠️ Toggling rehearsal from', metadata.is_rehearsal, 'to', !metadata.is_rehearsal)
    const { error } = await supabase
      .from('show_metadata')
      .update({
        is_rehearsal: !metadata.is_rehearsal,
        updated_at: new Date().toISOString()
      })
      .eq('id', metadata.id)

    if (error) {
      console.error('Error toggling rehearsal status:', error)
      alert('Failed to update rehearsal status')
    } else {
      console.log('✅ Rehearsal status updated successfully')
      loadMetadata() // Immediately reload to update UI
    }
  }

  const toggleAutoAdvance = async () => {
    console.log('🤖 toggleAutoAdvance clicked!')
    if (!metadata) return

    console.log('🤖 Toggling AI Automation from', metadata.auto_advance_enabled, 'to', !metadata.auto_advance_enabled)
    const { error } = await supabase
      .from('show_metadata')
      .update({
        auto_advance_enabled: !metadata.auto_advance_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', metadata.id)

    if (error) {
      console.error('Error toggling auto-advance:', error)
      alert('Failed to update auto-advance setting')
    } else {
      console.log('✅ AI Automation updated successfully')
      loadMetadata() // Immediately reload to update UI
    }
  }

  const startShow = async () => {
    if (!metadata) return

    try {
      // 1. Get episode info from EpisodeInfoPanel
      const { data: episodeData } = await supabase
        .from('show_metadata')
        .select('episode_number, episode_title, episode_topic')
        .single()

      if (episodeData) {
        setEpisodeInfo({
          number: episodeData.episode_number || 1,
          title: episodeData.episode_title || 'Episode',
          topic: episodeData.episode_topic || 'Today\'s Show'
        })
      }

      // 2. Create a new session
      const { data: newSession, error: sessionError } = await supabase
        .from('show_sessions')
        .insert({
          episode_number: episodeData?.episode_number || 1,
          episode_title: episodeData?.episode_title || 'Episode',
          episode_topic: episodeData?.episode_topic || 'Today\'s Show',
          episode_date: new Date().toISOString().split('T')[0],
          status: 'live',
          show_notes: ''
        })
        .select()
        .single()

      if (sessionError) {
        console.error('[ShowMetadataControl] Error creating session:', sessionError)
        throw sessionError
      }
      
      if (!newSession) {
        throw new Error('Session creation returned no data')
      }
      
      setSessionId(newSession.id)
      console.log('[ShowMetadataControl] ✅ Session created:', newSession.id)

      // 3. Update show metadata with active session link
      const { error } = await supabase
        .from('show_metadata')
        .update({
          show_start_time: new Date().toISOString(),
          is_live: true,
          active_session_id: newSession.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.id)

      if (error) throw error

      setShowStartConfirm(false)
      loadMetadata()
    } catch (err) {
      console.error('[ShowMetadataControl] Error starting show:', err)
      alert('Failed to start show: ' + (err as Error).message)
    }
  }

  const endShow = async () => {
    if (!metadata) return

    const { error } = await supabase
      .from('show_metadata')
      .update({
        is_live: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', metadata.id)

    if (error) {
      console.error('Error ending show:', error)
      alert('Failed to end show')
    } else {
      setShowEndModal(false)
      loadMetadata() // Immediately reload to update UI
    }
  }

  const resetShow = async () => {
    if (!metadata) return

    // Check if there's an active session
    if (metadata.active_session_id) {
      const confirmMessage = 'Active session detected! Do you want to archive it first?\n\nYes = Archive & Reset\nNo = Discard Session & Reset (destructive)'
      const shouldArchive = confirm(confirmMessage)
      
      if (shouldArchive) {
        // Open the End Show modal instead
        setShowEndModal(true)
        setShowResetConfirm(false)
        return
      }
      // User chose to discard - continue with reset
    }

    const { error } = await supabase
      .from('show_metadata')
      .update({
        show_start_time: null,
        total_elapsed_seconds: 0,
        is_live: false,
        active_session_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', metadata.id)

    if (error) {
      console.error('Error resetting show:', error)
      alert('Failed to reset show')
    } else {
      setShowResetConfirm(false)
      setSessionId(undefined)
      loadMetadata() // Immediately reload to update UI
    }
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Not started'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!metadata) {
    return (
      <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
        <p className="text-gray-500">Loading metadata...</p>
      </div>
    )
  }

  return (
    <div className="bg-black border-2 border-orange-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Radio className="w-7 h-7 text-orange-400" />
        Show Metadata Control
      </h2>

      {/* Current Status Display */}
      <div className="mb-4 p-4 bg-gradient-to-r from-orange-900/40 to-red-900/40 border-2 border-orange-400 rounded-lg">
        <p className="text-xs text-orange-300 font-semibold mb-2">CURRENT STATUS</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Show Status:</span>
            <span className={`px-3 py-1 rounded-full font-bold text-sm ${
              metadata.is_live 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-gray-700 text-gray-300'
            }`}>
              {metadata.is_live ? '🔴 LIVE' : 'OFF AIR'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Mode:</span>
            <span className={`px-3 py-1 rounded-full font-bold text-sm ${
              metadata.is_rehearsal 
                ? 'bg-yellow-600 text-white' 
                : 'bg-green-700 text-white'
            }`}>
              {metadata.is_rehearsal ? '⚠️ REHEARSAL' : '✓ PRODUCTION'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Start Time:</span>
            <span className="text-gray-300 text-sm">
              {formatDateTime(metadata.show_start_time)}
            </span>
          </div>
          
          {/* Active Session Indicator */}
          {metadata.active_session_id && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  Active Session:
                </span>
                <span className="px-3 py-1 rounded-full font-bold text-xs bg-blue-600/40 border border-blue-400 text-blue-300">
                  Episode #{episodeInfo.number} - {episodeInfo.title}
                </span>
              </div>
              
              {/* Session Duration Timer */}
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  Duration:
                </span>
                <span className="text-green-400 text-sm font-mono font-bold">
                  {sessionDuration}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toggle Controls */}
      <div className="mb-4 space-y-3">
        <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Live Status</p>
              <p className="text-xs text-gray-400">Toggle broadcast live state</p>
            </div>
            <button
              onClick={toggleLive}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer z-10 ${
                metadata.is_live ? 'bg-red-600' : 'bg-gray-600'
              }`}
              style={{ pointerEvents: 'auto' }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  metadata.is_live ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Rehearsal Mode</p>
              <p className="text-xs text-gray-400">Enable for practice runs</p>
            </div>
            <button
              onClick={toggleRehearsal}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer z-10 ${
                metadata.is_rehearsal ? 'bg-yellow-600' : 'bg-gray-600'
              }`}
              style={{ pointerEvents: 'auto' }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  metadata.is_rehearsal ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">🤖 AI Automation</p>
              <p className="text-xs text-gray-400">Master switch: Producer AI, Auto-Director, AI Context Analyzer</p>
            </div>
            <button
              onClick={toggleAutoAdvance}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer z-10 ${
                metadata.auto_advance_enabled ? 'bg-purple-600' : 'bg-gray-600'
              }`}
              style={{ pointerEvents: 'auto' }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  metadata.auto_advance_enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Start Show Button */}
        {!showStartConfirm ? (
          <button
            onClick={() => setShowStartConfirm(true)}
            disabled={metadata.is_live}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Start Show
          </button>
        ) : (
          <div className="p-3 bg-green-900/40 border-2 border-green-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-sm font-semibold text-white">Start the show now?</p>
            </div>
            <p className="text-xs text-gray-300 mb-3">This will set start time and go LIVE</p>
            <div className="flex gap-2">
              <button
                onClick={startShow}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all"
              >
                Confirm Start
              </button>
              <button
                onClick={() => setShowStartConfirm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* End Show Button */}
        <button
          onClick={() => setShowEndModal(true)}
          disabled={!metadata.is_live && !metadata.active_session_id}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <StopCircle className="w-5 h-5" />
          End Show & Archive
        </button>

        {/* Reset Show Button */}
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset Show
          </button>
        ) : (
          <div className="p-3 bg-red-900/40 border-2 border-red-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-sm font-semibold text-white">⚠️ Reset all show data?</p>
            </div>
            <p className="text-xs text-gray-300 mb-3">This will clear start time, timers, and set to OFF</p>
            <div className="flex gap-2">
              <button
                onClick={resetShow}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded text-sm text-orange-300">
        <p className="font-semibold">⚠️ Production Controls</p>
        <p className="text-xs mt-1">Use these controls carefully during live broadcasts</p>
      </div>

      {/* End Show Modal */}
      <EndShowModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        sessionId={sessionId}
        episodeInfo={episodeInfo}
      />
    </div>
  )
}
