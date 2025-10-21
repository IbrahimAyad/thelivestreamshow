import { useState } from 'react'
import { useRecorder } from '@/hooks/useRecorder'

interface RecordingPanelProps {
  audioContext: AudioContext | null
  masterOutput: AudioNode | null
}

export function RecordingPanel({ audioContext, masterOutput }: RecordingPanelProps) {
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useRecorder(audioContext, masterOutput)

  const [title, setTitle] = useState('')
  const [showTitleInput, setShowTitleInput] = useState(false)

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = () => {
    setShowTitleInput(true)
  }

  const handleConfirmStart = () => {
    startRecording(title || 'Untitled')
    setShowTitleInput(false)
  }

  const handleCancelStart = () => {
    setShowTitleInput(false)
    setTitle('')
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold">Set Recording</h3>
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-500">RECORDING</span>
            </div>
          )}
        </div>
      </div>

      {/* Title Input Modal */}
      {showTitleInput && (
        <div className="mb-4 p-4 bg-neutral-800 rounded-lg border border-neutral-600">
          <label className="block text-sm text-neutral-400 mb-2">Recording Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Saturday Night Mix"
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-sm focus:outline-none focus:border-red-500 mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleConfirmStart}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
            >
              Start Recording
            </button>
            <button
              onClick={handleCancelStart}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className="mb-4 p-4 bg-neutral-800 rounded-lg border border-red-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-400">Duration</span>
            <span className="text-2xl font-mono font-bold text-red-500">
              {formatDuration(duration)}
            </span>
          </div>
          {isPaused && (
            <div className="flex items-center gap-2 justify-center py-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-yellow-500">PAUSED</span>
            </div>
          )}
        </div>
      )}

      {/* Recording Controls */}
      <div className="space-y-2">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="6" />
            </svg>
            Start Recording
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 4l10 6-10 6V4z" />
                </svg>
                Resume
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 4h3v12H6V4zm5 0h3v12h-3V4z" />
                </svg>
                Pause
              </button>
            )}
            <button
              onClick={stopRecording}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <rect x="4" y="4" width="12" height="12" rx="1" />
              </svg>
              Stop & Save
            </button>
            <button
              onClick={cancelRecording}
              className="px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-neutral-800 rounded border border-neutral-700">
        <p className="text-xs text-neutral-400">
          <strong className="text-neutral-300">Recording Info:</strong> Your DJ set will be captured in high-quality WebM/Opus format. The recording includes all audio playing through the master output.
        </p>
      </div>
    </div>
  )
}
