import { useState, useEffect } from 'react'
import { Mic, MicOff, Search, Video, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import { useBetaBotComplete } from '../hooks/useBetaBotComplete'

interface VoiceSearchControlPanelProps {
  isActive: boolean
  onToggle: () => void
}

type SearchMode = 'alakazam' | 'kadabra' | 'abra' | null

export function VoiceSearchControlPanel({ isActive, onToggle }: VoiceSearchControlPanelProps) {
  const { transcriptListener } = useAutomationEngine()
  const { handlePerplexitySearch, handleVideoSearch, handleImageSearch } = useBetaBotComplete()
  const [lastQuery, setLastQuery] = useState<string>('')
  const [activeMode, setActiveMode] = useState<SearchMode>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  // Listen for transcripts and execute search when mode is active
  useEffect(() => {
    if (!transcriptListener || !activeMode || !isActive) {
      return
    }

    // Set up callback to handle transcripts
    const handleTranscript = async (segment: { transcript: string, isFinal: boolean }) => {
      if (!segment.isFinal) return

      const query = segment.transcript.trim()
      if (!query) return

      console.log(`🎯 [VoiceSearch] Mode: ${activeMode}, Query: "${query}"`)
      setLastQuery(query)

      // Execute search based on active mode
      try {
        if (activeMode === 'alakazam') {
          console.log('🔍 Executing Perplexity search...')
          await handlePerplexitySearch(query)
        } else if (activeMode === 'kadabra') {
          console.log('🎥 Executing YouTube search...')
          await handleVideoSearch(query)
        } else if (activeMode === 'abra') {
          console.log('🖼️ Executing Unsplash search...')
          await handleImageSearch(query)
        }

        // Clear mode after executing
        setActiveMode(null)
        console.log('✅ [VoiceSearch] Search completed, mode cleared')
      } catch (error) {
        console.error('❌ [VoiceSearch] Search failed:', error)
      }
    }

    transcriptListener.onTranscript(handleTranscript)

    return () => {
      // Cleanup callback
      transcriptListener.onTranscript(() => {})
    }
  }, [activeMode, isActive, transcriptListener, handlePerplexitySearch, handleVideoSearch, handleImageSearch])

  // Start/stop microphone when voice search is toggled
  useEffect(() => {
    console.log('🎤 [VoiceSearchControl] Effect triggered - isActive:', isActive, 'isListening:', isListening)
    console.log('🎤 [VoiceSearchControl] Listener check:', transcriptListener ? 'FOUND' : 'NULL')

    if (!transcriptListener) {
      console.warn('⚠️ [VoiceSearchControl] TranscriptListener not ready yet')
      return
    }

    if (isActive && !isListening) {
      console.log('🎤 [VoiceSearchControl] Activating microphone...')

      try {
        transcriptListener.start()
        setIsListening(true)
        console.log('✅ [VoiceSearchControl] Microphone started successfully')
      } catch (error) {
        console.error('❌ [VoiceSearchControl] Failed to start microphone:', error)
      }
    } else if (!isActive && isListening) {
      console.log('🛑 [VoiceSearchControl] Deactivating microphone...')

      try {
        transcriptListener.stop()
        setIsListening(false)
        console.log('✅ [VoiceSearchControl] Microphone stopped successfully')
      } catch (error) {
        console.error('❌ [VoiceSearchControl] Failed to stop microphone:', error)
      }
    } else {
      console.log('🎤 [VoiceSearchControl] No action needed - already in desired state')
    }
  }, [isActive, isListening, transcriptListener])

  // Handle feature card clicks
  const handleFeatureClick = (mode: SearchMode) => {
    if (!isActive) {
      console.warn('⚠️ Voice search must be activated first!')
      return
    }

    console.log(`🎯 [VoiceSearch] Activating mode: ${mode}`)
    setActiveMode(mode)
  }

  // Handle session state changes
  useEffect(() => {
    const updateSession = async () => {
      try {
        if (isActive) {
          console.log('🎤 [VoiceSearchControl] Activating voice search...')

          // Create or update session to active
          const { data: existingSession, error: fetchError } = await supabase
            .from('voice_search_sessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (fetchError) {
            console.error('❌ [VoiceSearchControl] Table not found. Run SQL from /tmp/create_voice_search.sql')
            console.error('Error:', fetchError.message)
            return
          }

          if (existingSession) {
            // Update existing session
            const { error: updateError } = await supabase
              .from('voice_search_sessions')
              .update({
                session_active: true,
                started_at: new Date().toISOString()
              })
              .eq('id', existingSession.id)

            if (updateError) {
              console.error('❌ [VoiceSearchControl] Failed to update session:', updateError)
              return
            }

            setSessionId(existingSession.id)
            console.log('✅ [VoiceSearchControl] Session activated:', existingSession.id)
          } else {
            // Create new session
            const { data: newSession, error: createError } = await supabase
              .from('voice_search_sessions')
              .insert({
                session_active: true,
                started_at: new Date().toISOString()
              })
              .select()
              .single()

            if (createError) {
              console.error('❌ [VoiceSearchControl] Failed to create session:', createError)
              return
            }

            if (newSession) {
              setSessionId(newSession.id)
              console.log('✅ [VoiceSearchControl] New session created:', newSession.id)
            }
          }
        } else if (sessionId) {
          console.log('🛑 [VoiceSearchControl] Deactivating voice search...')

          // Deactivate session
          const { error: deactivateError } = await supabase
            .from('voice_search_sessions')
            .update({
              session_active: false,
              ended_at: new Date().toISOString()
            })
            .eq('id', sessionId)

          if (deactivateError) {
            console.error('❌ [VoiceSearchControl] Failed to deactivate:', deactivateError)
            return
          }

          console.log('✅ [VoiceSearchControl] Session deactivated:', sessionId)
        }
      } catch (err) {
        console.error('❌ [VoiceSearchControl] Unexpected error:', err)
      }
    }

    updateSession()
  }, [isActive])

  return (
    <div className="bg-gray-800/50 border-2 border-purple-900/50 rounded-xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg border transition-all ${
            isActive
              ? 'bg-purple-500/20 border-purple-400/50 voice-search-pulse'
              : 'bg-gray-700/50 border-gray-600/50'
          }`}>
            {isActive ? (
              <Mic className="w-6 h-6 text-purple-300" />
            ) : (
              <MicOff className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Voice Search Control</h3>
            <p className="text-sm text-gray-400">
              {isActive ? '🔴 LIVE - Listening for commands' : '⚫ Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Activation Button */}
      <div className="mb-6">
        <button
          onClick={onToggle}
          className={`w-full py-6 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
            isActive
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xl voice-search-active-button'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-xl'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            {isActive ? (
              <>
                <div className="w-3 h-3 bg-white rounded-full voice-search-pulse-dot"></div>
                <span>🛑 DEACTIVATE VOICE SEARCH</span>
              </>
            ) : (
              <>
                <Mic className="w-6 h-6" />
                <span>🎤 ACTIVATE VOICE SEARCH</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Status Display */}
      {isActive && activeMode && (
        <div className="mb-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-400/50 rounded-lg p-4 voice-search-pulse">
          <div className="text-sm text-purple-300 mb-1 font-bold">🎤 LISTENING FOR:</div>
          <div className="text-white font-mono text-lg">
            {activeMode === 'alakazam' && '🔍 Perplexity Search Query'}
            {activeMode === 'kadabra' && '🎥 YouTube Video Query'}
            {activeMode === 'abra' && '🖼️ Image Search Query'}
          </div>
          <div className="text-xs text-gray-400 mt-2">Speak your query now...</div>
        </div>
      )}

      {isActive && lastQuery && !activeMode && (
        <div className="mb-6 bg-gray-900/50 border border-green-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Last Query:</div>
          <div className="text-white font-mono text-sm">"{lastQuery}"</div>
        </div>
      )}

      {/* Features List */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-300 mb-3">
          {isActive ? 'Click a feature to activate:' : 'Available Features:'}
        </div>

        <button
          onClick={() => handleFeatureClick('alakazam')}
          disabled={!isActive}
          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
            activeMode === 'alakazam'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 shadow-xl voice-search-pulse transform scale-105'
              : isActive
              ? 'bg-purple-900/20 border-purple-500/30 hover:bg-purple-800/30 hover:border-purple-400/50 cursor-pointer transform hover:scale-102'
              : 'bg-gray-800/30 border-gray-700/30 cursor-not-allowed opacity-50'
          }`}
        >
          <Search className={`w-5 h-5 ${activeMode === 'alakazam' ? 'text-white' : isActive ? 'text-purple-300' : 'text-gray-500'}`} />
          <div className="flex-1 text-left">
            <div className={`font-semibold ${activeMode === 'alakazam' ? 'text-white' : isActive ? 'text-purple-200' : 'text-gray-400'}`}>
              Alakazam
            </div>
            <div className="text-xs text-gray-400">Perplexity Search</div>
          </div>
          {activeMode === 'alakazam' ? (
            <span className="text-white text-xs font-bold animate-pulse">🎤 LISTENING</span>
          ) : isActive ? (
            <span className="text-green-400 text-xs font-bold">✓ CLICK TO ACTIVATE</span>
          ) : null}
        </button>

        <button
          onClick={() => handleFeatureClick('kadabra')}
          disabled={!isActive}
          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
            activeMode === 'kadabra'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 shadow-xl voice-search-pulse transform scale-105'
              : isActive
              ? 'bg-purple-900/20 border-purple-500/30 hover:bg-purple-800/30 hover:border-purple-400/50 cursor-pointer transform hover:scale-102'
              : 'bg-gray-800/30 border-gray-700/30 cursor-not-allowed opacity-50'
          }`}
        >
          <Video className={`w-5 h-5 ${activeMode === 'kadabra' ? 'text-white' : isActive ? 'text-purple-300' : 'text-gray-500'}`} />
          <div className="flex-1 text-left">
            <div className={`font-semibold ${activeMode === 'kadabra' ? 'text-white' : isActive ? 'text-purple-200' : 'text-gray-400'}`}>
              Kadabra
            </div>
            <div className="text-xs text-gray-400">YouTube Videos</div>
          </div>
          {activeMode === 'kadabra' ? (
            <span className="text-white text-xs font-bold animate-pulse">🎤 LISTENING</span>
          ) : isActive ? (
            <span className="text-green-400 text-xs font-bold">✓ CLICK TO ACTIVATE</span>
          ) : null}
        </button>

        <button
          onClick={() => handleFeatureClick('abra')}
          disabled={!isActive}
          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
            activeMode === 'abra'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 shadow-xl voice-search-pulse transform scale-105'
              : isActive
              ? 'bg-purple-900/20 border-purple-500/30 hover:bg-purple-800/30 hover:border-purple-400/50 cursor-pointer transform hover:scale-102'
              : 'bg-gray-800/30 border-gray-700/30 cursor-not-allowed opacity-50'
          }`}
        >
          <Image className={`w-5 h-5 ${activeMode === 'abra' ? 'text-white' : isActive ? 'text-purple-300' : 'text-gray-500'}`} />
          <div className="flex-1 text-left">
            <div className={`font-semibold ${activeMode === 'abra' ? 'text-white' : isActive ? 'text-purple-200' : 'text-gray-400'}`}>
              Abra
            </div>
            <div className="text-xs text-gray-400">Unsplash Images</div>
          </div>
          {activeMode === 'abra' ? (
            <span className="text-white text-xs font-bold animate-pulse">🎤 LISTENING</span>
          ) : isActive ? (
            <span className="text-green-400 text-xs font-bold">✓ CLICK TO ACTIVATE</span>
          ) : null}
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes voice-search-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(168, 85, 247, 0);
          }
        }

        @keyframes voice-search-pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }

        @keyframes voice-search-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.5);
          }
        }

        .voice-search-pulse {
          animation: voice-search-pulse 2s ease-in-out infinite;
        }

        .voice-search-pulse-dot {
          animation: voice-search-pulse-dot 1.5s ease-in-out infinite;
        }

        .voice-search-active-button {
          animation: voice-search-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
