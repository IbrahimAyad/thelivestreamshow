import { useState, useEffect, useRef } from 'react'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import type { TranscriptSegment } from '../lib/transcription/TranscriptListener'
import {
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  MessageSquare
} from 'lucide-react'

export function TranscriptionPanel() {
  const { transcriptListener } = useAutomationEngine()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [error, setError] = useState<string | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Check support on mount
  useEffect(() => {
    if (!transcriptListener) return

    const supported = transcriptListener.isSupported()
    setIsSupported(supported)

    if (!supported) {
      setError('Web Speech API not supported in this browser. Use Chrome or Edge.')
    }
  }, [transcriptListener])

  // Poll for status and segments
  useEffect(() => {
    if (!transcriptListener) return

    const updateStatus = () => {
      const status = transcriptListener.getStatus()
      setIsListening(status.isListening)

      const currentSegments = transcriptListener.getSegments(20) // Last 20 segments
      setSegments(currentSegments)
    }

    // Set up callback for new transcripts
    transcriptListener.onTranscript((segment: TranscriptSegment) => {
      setSegments(prev => [...prev.slice(-19), segment]) // Keep last 20
    })

    updateStatus()
    const interval = setInterval(updateStatus, 500)

    return () => clearInterval(interval)
  }, [transcriptListener])

  // Auto-scroll to bottom when new segments arrive - only within container
  useEffect(() => {
    if (transcriptEndRef.current) {
      // Get the scrollable parent container
      const container = transcriptEndRef.current.closest('.overflow-y-auto')
      if (container) {
        // Scroll within the container, not the whole page
        container.scrollTop = container.scrollHeight
      }
    }
  }, [segments])

  const handleStartListening = async () => {
    if (!transcriptListener) return

    try {
      transcriptListener.start()
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listening'
      setError(errorMessage)
    }
  }

  const handleStopListening = () => {
    if (!transcriptListener) return
    transcriptListener.stop()
  }

  const handleClearTranscript = () => {
    if (!transcriptListener) return
    transcriptListener.clearSegments()
    setSegments([])
  }

  if (!isSupported) {
    return (
      <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-400" />
            Live Transcription
          </h3>
        </div>
        <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Web Speech API not supported in this browser. Please use Chrome or Edge for real-time transcription.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Mic className="w-5 h-5 text-green-400" />
          Live Transcription
          {isListening && (
            <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 animate-pulse">
              <Volume2 className="w-3 h-3" />
              Listening
            </span>
          )}
          {!isListening && (
            <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs font-semibold rounded-full">
              Stopped
            </span>
          )}
        </h3>
      </div>

      {/* Controls */}
      <div className="mb-4 flex items-center gap-2">
        {!isListening ? (
          <button
            onClick={handleStartListening}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Mic className="w-5 h-5" />
            Start Listening
          </button>
        ) : (
          <button
            onClick={handleStopListening}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MicOff className="w-5 h-5" />
            Stop Listening
          </button>
        )}

        <button
          onClick={handleClearTranscript}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          title="Clear transcript"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      {!isListening && segments.length === 0 && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-300">
          <p className="mb-2"><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click "Start Listening" to enable microphone</li>
            <li>Speak keywords like "camera 2", "switch to wide", etc.</li>
            <li>Keywords will trigger automation actions automatically</li>
            <li>Enable keyword rules in Trigger Rules panel first</li>
          </ul>
        </div>
      )}

      {/* Transcript Display */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
        {segments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No transcript yet</p>
            <p className="text-xs mt-1">
              {isListening ? 'Start speaking...' : 'Click "Start Listening" to begin'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className={`p-2 rounded ${
                  segment.isFinal
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-gray-700/50 border border-gray-600/50 opacity-70'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm text-white">{segment.transcript}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{new Date(segment.timestamp).toLocaleTimeString()}</span>
                      {segment.confidence > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {Math.round(segment.confidence * 100)}%
                        </span>
                      )}
                      {!segment.isFinal && (
                        <span className="text-yellow-400">interim...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* Stats */}
      {segments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between">
          <div>
            {segments.filter(s => s.isFinal).length} final segments
          </div>
          <div>
            Listening for keyword triggers in real-time
          </div>
        </div>
      )}

      {/* Microphone Permission Note */}
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Note:</strong> You'll be prompted for microphone permission when you start listening.</p>
        <p className="mt-1">This uses your browser's built-in Web Speech API (Chrome/Edge only).</p>
      </div>
    </div>
  )
}
