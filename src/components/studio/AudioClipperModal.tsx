import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Play, Pause, Scissors, Loader2 } from 'lucide-react'
import type { MusicTrack } from '@/types/database'
import { supabase } from '@/lib/supabase'
import {
  fetchAndDecodeAudio,
  extractClip,
  audioBufferToWav,
  generateWaveformData,
  formatTime,
  type ClipSettings,
} from '@/utils/studio/audioClipping'

interface AudioClipperModalProps {
  track: MusicTrack
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  refreshTracks?: () => void
}

export function AudioClipperModal({ track, isOpen, onClose, onSuccess, refreshTracks }: AudioClipperModalProps) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  // Selection state
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [clipTitle, setClipTitle] = useState('')
  const [clipFriendlyName, setClipFriendlyName] = useState('')

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null)

  // Load and decode audio on mount
  useEffect(() => {
    if (!isOpen || !track) return

    const loadAudio = async () => {
      try {
        setIsLoading(true)
        setLoadingProgress(0)

        const buffer = await fetchAndDecodeAudio(track.file_url, setLoadingProgress)
        setAudioBuffer(buffer)

        // Generate waveform
        const waveform = generateWaveformData(buffer, 500)
        setWaveformData(waveform)

        // Initialize selection to full track
        setStartTime(0)
        setEndTime(buffer.duration)

        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.error('Error loading audio:', error)
        alert('Failed to load audio file. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAudio()

    return () => {
      // Cleanup
      stopPlayback()
      stopPreview()
      audioContextRef.current?.close()
    }
  }, [isOpen, track])

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0 || !audioBuffer) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const barWidth = width / waveformData.length

    // Clear canvas
    ctx.fillStyle = '#171717'
    ctx.fillRect(0, 0, width, height)

    // Normalize waveform data
    const max = Math.max(...waveformData)
    const normalized = waveformData.map((v) => v / max)

    // Calculate selection positions
    const startX = (startTime / audioBuffer.duration) * width
    const endX = (endTime / audioBuffer.duration) * width

    // Draw waveform bars
    normalized.forEach((value, i) => {
      const x = i * barWidth
      const barHeight = value * height * 0.8
      const y = (height - barHeight) / 2

      // Color based on selection
      if (x >= startX && x <= endX) {
        ctx.fillStyle = '#3b82f6' // Selected (blue)
      } else {
        ctx.fillStyle = '#404040' // Unselected (gray)
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight)
    })

    // Draw selection handles
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 3

    // Start handle
    ctx.beginPath()
    ctx.moveTo(startX, 0)
    ctx.lineTo(startX, height)
    ctx.stroke()

    // End handle
    ctx.beginPath()
    ctx.moveTo(endX, 0)
    ctx.lineTo(endX, height)
    ctx.stroke()
  }, [waveformData, audioBuffer, startTime, endTime])

  // Play full track
  const playFullTrack = useCallback(() => {
    if (!audioBuffer || !audioContextRef.current) return

    stopPlayback()

    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContextRef.current.destination)
    source.start(0)
    sourceNodeRef.current = source
    setIsPlaying(true)

    source.onended = () => {
      setIsPlaying(false)
      sourceNodeRef.current = null
    }
  }, [audioBuffer])

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Play preview of selected clip
  const playPreview = useCallback(() => {
    if (!audioBuffer || !audioContextRef.current) return

    stopPreview()

    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContextRef.current.destination)
    source.start(0, startTime, endTime - startTime)
    previewSourceRef.current = source
    setIsPreviewPlaying(true)

    source.onended = () => {
      setIsPreviewPlaying(false)
      previewSourceRef.current = null
    }
  }, [audioBuffer, startTime, endTime])

  // Stop preview
  const stopPreview = useCallback(() => {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop()
      } catch (e) {
        // Ignore if already stopped
      }
      previewSourceRef.current = null
    }
    setIsPreviewPlaying(false)
  }, [])

  // Handle canvas click/drag for selection
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickTime = (x / rect.width) * audioBuffer.duration

    const startX = (startTime / audioBuffer.duration) * rect.width
    const endX = (endTime / audioBuffer.duration) * rect.width

    // Check if clicking near handles (within 10px)
    if (Math.abs(x - startX) < 10) {
      setIsDragging('start')
    } else if (Math.abs(x - endX) < 10) {
      setIsDragging('end')
    } else {
      // Set start time to click position
      setStartTime(clickTime)
      setIsDragging('end')
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !audioBuffer) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const time = (x / rect.width) * audioBuffer.duration

    if (isDragging === 'start') {
      setStartTime(Math.min(time, endTime - 0.1)) // Ensure at least 0.1s clip
    } else if (isDragging === 'end') {
      setEndTime(Math.max(time, startTime + 0.1)) // Ensure at least 0.1s clip
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(null)
  }

  // Save clip
  const handleSaveClip = async () => {
    if (!audioBuffer || !clipTitle.trim()) {
      alert('Please enter a title for the clip')
      return
    }

    if (endTime - startTime < 0.1) {
      alert('Clip must be at least 0.1 seconds long')
      return
    }

    setIsProcessing(true)

    try {
      // Extract clip
      const clipBuffer = extractClip(audioBuffer, startTime, endTime)

      // Convert to WAV
      const wavBlob = audioBufferToWav(clipBuffer)

      // Generate filename
      const timestamp = Date.now()
      const filename = `clip_${timestamp}_${clipTitle.replace(/[^a-zA-Z0-9]/g, '_')}.wav`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('music-audio')
        .upload(filename, wavBlob, {
          contentType: 'audio/wav',
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('music-audio').getPublicUrl(filename)

      // Insert into database
      const { error: dbError } = await supabase.from('music_library').insert({
        title: clipTitle,
        friendly_name: clipFriendlyName || null,
        artist: track.artist,
        category: 'jingle',
        duration: Math.floor(endTime - startTime),
        file_url: urlData.publicUrl,
        file_path: filename,
        file_size: wavBlob.size,
        file_format: 'wav',
        source_url: `clipped_from:${track.id}`,
      })

      if (dbError) throw dbError

      // Success - refresh tracks and close
      if (refreshTracks) {
        await refreshTracks()
      }
      alert(`Clip "${clipTitle}" saved successfully!`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving clip:', error)
      alert('Failed to save clip. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  const clipDuration = endTime - startTime

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <Scissors className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-semibold">Create Audio Clip</h2>
              <p className="text-sm text-neutral-400 mt-0.5">
                Source: {track.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-neutral-800 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <p className="text-neutral-400">Loading audio... {Math.round(loadingProgress)}%</p>
            </div>
          ) : (
            <>
              {/* Waveform */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-300 mb-3">Waveform</h3>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={150}
                  className="w-full h-auto bg-neutral-950 rounded cursor-crosshair border border-neutral-700"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                <p className="text-xs text-neutral-400 mt-2">
                  Click and drag on the waveform to select a region, or drag the blue handles
                </p>
              </div>

              {/* Playback Controls */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => (isPlaying ? stopPlayback() : playFullTrack())}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Stop Full Track</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Play Full Track</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => (isPreviewPlaying ? stopPreview() : playPreview())}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded transition-colors"
                  disabled={clipDuration < 0.1}
                >
                  {isPreviewPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Stop Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Preview Clip</span>
                    </>
                  )}
                </button>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={endTime - 0.1}
                    value={startTime.toFixed(1)}
                    onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value)))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-xs text-neutral-400 mt-1">{formatTime(startTime)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={startTime + 0.1}
                    max={audioBuffer?.duration || 0}
                    value={endTime.toFixed(1)}
                    onChange={(e) =>
                      setEndTime(
                        Math.min(
                          audioBuffer?.duration || 0,
                          parseFloat(e.target.value)
                        )
                      )
                    }
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-xs text-neutral-400 mt-1">{formatTime(endTime)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Duration
                  </label>
                  <div className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-center">
                    <p className="text-lg font-semibold text-primary-400">
                      {clipDuration.toFixed(1)}s
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{formatTime(clipDuration)}</p>
                </div>
              </div>

              {/* Clip Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Clip Title <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clipTitle}
                    onChange={(e) => setClipTitle(e.target.value)}
                    placeholder="Enter a title for this clip"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Friendly Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={clipFriendlyName}
                    onChange={(e) => setClipFriendlyName(e.target.value)}
                    placeholder="e.g., intro_clip, stinger_1"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Use for API reference (letters, numbers, underscores only)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClip}
                  disabled={isProcessing || !clipTitle.trim() || clipDuration < 0.1}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>Save Clip</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
