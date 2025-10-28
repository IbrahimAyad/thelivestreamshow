import { useState, useRef, useEffect } from 'react'
import { Music, Scissors, Download, Play, Pause, Volume2, Plus, X } from 'lucide-react'
import { useMusicLibrary } from '@/hooks/studio/useMusicLibrary'
import { supabase } from '@/lib/supabase'
import type { MusicTrack } from '@/types/database'

interface TrackSlot {
  id: string
  track: MusicTrack | null
  startTime: number // When this track starts in the mix (seconds)
  trimStart: number // Trim from beginning (seconds)
  trimEnd: number // Trim from end (seconds)
  volume: number // 0-1
  audioBuffer: AudioBuffer | null
}

export function AudioMixer() {
  const { tracks, loading } = useMusicLibrary()
  const [slot1, setSlot1] = useState<TrackSlot>({
    id: 'slot1',
    track: null,
    startTime: 0,
    trimStart: 0,
    trimEnd: 0,
    volume: 1.0,
    audioBuffer: null
  })
  const [slot2, setSlot2] = useState<TrackSlot>({
    id: 'slot2',
    track: null,
    startTime: 0,
    trimStart: 0,
    trimEnd: 0,
    volume: 1.0,
    audioBuffer: null
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [mixName, setMixName] = useState('My Mix')
  const [showTrackPicker, setShowTrackPicker] = useState<'slot1' | 'slot2' | null>(null)
  const [processing, setProcessing] = useState(false)

  // Audio context for preview and mixing (ISOLATED)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([])
  const animationFrameRef = useRef<number | null>(null)

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Load audio file into buffer
  const loadAudioBuffer = async (track: MusicTrack): Promise<AudioBuffer | null> => {
    try {
      const { data } = supabase.storage.from('music').getPublicUrl(track.file_path)

      const response = await fetch(data.publicUrl)
      const arrayBuffer = await response.arrayBuffer()

      const context = audioContextRef.current!
      const audioBuffer = await context.decodeAudioData(arrayBuffer)

      return audioBuffer
    } catch (error) {
      console.error('Error loading audio:', error)
      return null
    }
  }

  // Select track for slot
  const selectTrack = async (slotId: 'slot1' | 'slot2', track: MusicTrack) => {
    const audioBuffer = await loadAudioBuffer(track)

    if (!audioBuffer) {
      alert('Failed to load audio file')
      return
    }

    const newSlot: TrackSlot = {
      id: slotId,
      track,
      startTime: slotId === 'slot2' ? 0 : 0, // Slot 2 can overlap slot 1
      trimStart: 0,
      trimEnd: audioBuffer.duration,
      volume: 1.0,
      audioBuffer
    }

    if (slotId === 'slot1') {
      setSlot1(newSlot)
    } else {
      setSlot2(newSlot)
    }

    setShowTrackPicker(null)
  }

  // Remove track from slot
  const removeTrack = (slotId: 'slot1' | 'slot2') => {
    if (slotId === 'slot1') {
      setSlot1({
        id: 'slot1',
        track: null,
        startTime: 0,
        trimStart: 0,
        trimEnd: 0,
        volume: 1.0,
        audioBuffer: null
      })
    } else {
      setSlot2({
        id: 'slot2',
        track: null,
        startTime: 0,
        trimStart: 0,
        trimEnd: 0,
        volume: 1.0,
        audioBuffer: null
      })
    }
  }

  // Calculate total mix duration
  const calculateMixDuration = (): number => {
    let maxDuration = 0

    if (slot1.audioBuffer) {
      const slot1Duration = slot1.startTime + (slot1.trimEnd - slot1.trimStart)
      maxDuration = Math.max(maxDuration, slot1Duration)
    }

    if (slot2.audioBuffer) {
      const slot2Duration = slot2.startTime + (slot2.trimEnd - slot2.trimStart)
      maxDuration = Math.max(maxDuration, slot2Duration)
    }

    return maxDuration
  }

  // Preview playback
  const playPreview = () => {
    if (!audioContextRef.current) return

    stopPreview() // Stop any existing playback

    const context = audioContextRef.current
    const startTime = context.currentTime

    // Play slot 1
    if (slot1.audioBuffer) {
      const source = context.createBufferSource()
      const gainNode = context.createGain()

      source.buffer = slot1.audioBuffer
      gainNode.gain.value = slot1.volume

      source.connect(gainNode)
      gainNode.connect(context.destination)

      // Apply trimming
      const duration = slot1.trimEnd - slot1.trimStart
      source.start(startTime + slot1.startTime, slot1.trimStart, duration)

      sourceNodesRef.current.push(source)
    }

    // Play slot 2
    if (slot2.audioBuffer) {
      const source = context.createBufferSource()
      const gainNode = context.createGain()

      source.buffer = slot2.audioBuffer
      gainNode.gain.value = slot2.volume

      source.connect(gainNode)
      gainNode.connect(context.destination)

      // Apply trimming
      const duration = slot2.trimEnd - slot2.trimStart
      source.start(startTime + slot2.startTime, slot2.trimStart, duration)

      sourceNodesRef.current.push(source)
    }

    setIsPlaying(true)
    setCurrentTime(0)

    // Update current time
    const updateTime = () => {
      const elapsed = context.currentTime - startTime
      setCurrentTime(elapsed)

      if (elapsed < calculateMixDuration()) {
        animationFrameRef.current = requestAnimationFrame(updateTime)
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }

    updateTime()
  }

  // Stop preview
  const stopPreview = () => {
    sourceNodesRef.current.forEach(source => {
      try {
        source.stop()
      } catch (e) {
        // Already stopped
      }
    })
    sourceNodesRef.current = []

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    setIsPlaying(false)
    setCurrentTime(0)
  }

  // Mix and export audio
  const exportMix = async () => {
    if (!slot1.audioBuffer && !slot2.audioBuffer) {
      alert('Please add at least one track to mix')
      return
    }

    setProcessing(true)

    try {
      const mixDuration = calculateMixDuration()
      const sampleRate = audioContextRef.current!.sampleRate

      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext(2, sampleRate * mixDuration, sampleRate)

      // Render slot 1
      if (slot1.audioBuffer) {
        const source = offlineContext.createBufferSource()
        const gainNode = offlineContext.createGain()

        source.buffer = slot1.audioBuffer
        gainNode.gain.value = slot1.volume

        source.connect(gainNode)
        gainNode.connect(offlineContext.destination)

        const duration = slot1.trimEnd - slot1.trimStart
        source.start(slot1.startTime, slot1.trimStart, duration)
      }

      // Render slot 2
      if (slot2.audioBuffer) {
        const source = offlineContext.createBufferSource()
        const gainNode = offlineContext.createGain()

        source.buffer = slot2.audioBuffer
        gainNode.gain.value = slot2.volume

        source.connect(gainNode)
        gainNode.connect(offlineContext.destination)

        const duration = slot2.trimEnd - slot2.trimStart
        source.start(slot2.startTime, slot2.trimStart, duration)
      }

      // Render to buffer
      const renderedBuffer = await offlineContext.startRendering()

      // Convert to WAV
      const wavBlob = audioBufferToWav(renderedBuffer)

      // Upload to Supabase
      const fileName = `${mixName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.wav`
      const filePath = `mixes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, wavBlob, {
          contentType: 'audio/wav',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // Fallback: Download locally
        const url = URL.createObjectURL(wavBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
        alert('Mix saved locally as download')
      } else {
        // Add to music library
        const { data: publicUrlData } = supabase.storage.from('music').getPublicUrl(filePath)

        const { error: insertError } = await supabase.from('music_library').insert({
          title: mixName,
          artist: 'Mixed Track',
          file_path: filePath,
          file_url: publicUrlData.publicUrl,
          duration: mixDuration,
          category: 'music'
        })

        if (insertError) {
          console.error('Database insert error:', insertError)
          alert('Mix uploaded but failed to add to library. Check console for details.')
        } else {
          alert(`✅ Mix saved as "${mixName}"!\nAvailable in Music Library`)
        }
      }

      setProcessing(false)
    } catch (error) {
      console.error('Error exporting mix:', error)
      alert('Failed to export mix')
      setProcessing(false)
    }
  }

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels
    const length = buffer.length * numberOfChannels * 2
    const arrayBuffer = new ArrayBuffer(44 + length)
    const view = new DataView(arrayBuffer)
    const channels = []
    let offset = 0
    let pos = 0

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true)
      pos += 2
    }

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true)
      pos += 4
    }

    // RIFF identifier
    setUint32(0x46464952)
    // File length
    setUint32(36 + length)
    // RIFF type
    setUint32(0x45564157)
    // Format chunk identifier
    setUint32(0x20746d66)
    // Format chunk length
    setUint32(16)
    // Sample format (PCM)
    setUint16(1)
    // Channel count
    setUint16(numberOfChannels)
    // Sample rate
    setUint32(buffer.sampleRate)
    // Byte rate
    setUint32(buffer.sampleRate * numberOfChannels * 2)
    // Block align
    setUint16(numberOfChannels * 2)
    // Bits per sample
    setUint16(16)
    // Data chunk identifier
    setUint32(0x61746164)
    // Data chunk length
    setUint32(length)

    // Write interleaved data
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    while (pos < arrayBuffer.byteLength) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-blue-500/30 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Scissors className="w-7 h-7 text-blue-400" />
        Audio Mixer & Editor
      </h2>

      {/* Mix Name */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-semibold mb-2">Mix Name</label>
        <input
          type="text"
          value={mixName}
          onChange={(e) => setMixName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          placeholder="Enter mix name..."
        />
      </div>

      {/* Track Slot 1 */}
      <div className="mb-4 p-4 bg-black/50 rounded-lg border border-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-blue-400">Track 1</h3>
          {slot1.track ? (
            <button
              onClick={() => removeTrack('slot1')}
              className="p-2 bg-red-600 hover:bg-red-700 rounded text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowTrackPicker('slot1')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Track
            </button>
          )}
        </div>

        {slot1.track && slot1.audioBuffer ? (
          <div className="space-y-3">
            <div className="text-white font-semibold">{slot1.track.title}</div>

            {/* Start Time */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Start at: {formatTime(slot1.startTime)}
              </label>
              <input
                type="range"
                min="0"
                max="60"
                step="0.1"
                value={slot1.startTime}
                onChange={(e) => setSlot1({ ...slot1, startTime: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>

            {/* Trim Start */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Trim Start: {formatTime(slot1.trimStart)}
              </label>
              <input
                type="range"
                min="0"
                max={slot1.audioBuffer.duration}
                step="0.1"
                value={slot1.trimStart}
                onChange={(e) => setSlot1({ ...slot1, trimStart: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>

            {/* Trim End */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Trim End: {formatTime(slot1.trimEnd)}
              </label>
              <input
                type="range"
                min={slot1.trimStart}
                max={slot1.audioBuffer.duration}
                step="0.1"
                value={slot1.trimEnd}
                onChange={(e) => setSlot1({ ...slot1, trimEnd: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-gray-400 text-xs mb-1 flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                Volume: {Math.round(slot1.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={slot1.volume}
                onChange={(e) => setSlot1({ ...slot1, volume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No track selected</div>
        )}
      </div>

      {/* Track Slot 2 */}
      <div className="mb-4 p-4 bg-black/50 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-purple-400">Track 2 (Optional)</h3>
          {slot2.track ? (
            <button
              onClick={() => removeTrack('slot2')}
              className="p-2 bg-red-600 hover:bg-red-700 rounded text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowTrackPicker('slot2')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Track
            </button>
          )}
        </div>

        {slot2.track && slot2.audioBuffer ? (
          <div className="space-y-3">
            <div className="text-white font-semibold">{slot2.track.title}</div>

            {/* Start Time */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Start at: {formatTime(slot2.startTime)}
              </label>
              <input
                type="range"
                min="0"
                max="60"
                step="0.1"
                value={slot2.startTime}
                onChange={(e) => setSlot2({ ...slot2, startTime: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>

            {/* Trim Start */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Trim Start: {formatTime(slot2.trimStart)}
              </label>
              <input
                type="range"
                min="0"
                max={slot2.audioBuffer.duration}
                step="0.1"
                value={slot2.trimStart}
                onChange={(e) => setSlot2({ ...slot2, trimStart: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>

            {/* Trim End */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Trim End: {formatTime(slot2.trimEnd)}
              </label>
              <input
                type="range"
                min={slot2.trimStart}
                max={slot2.audioBuffer.duration}
                step="0.1"
                value={slot2.trimEnd}
                onChange={(e) => setSlot2({ ...slot2, trimEnd: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-gray-400 text-xs mb-1 flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                Volume: {Math.round(slot2.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={slot2.volume}
                onChange={(e) => setSlot2({ ...slot2, volume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded"
              />
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No track selected</div>
        )}
      </div>

      {/* Mix Info */}
      <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
        <div className="text-blue-300 text-sm">
          <strong>Total Duration:</strong> {formatTime(calculateMixDuration())}
        </div>
        {isPlaying && (
          <div className="text-blue-400 text-sm mt-1">
            <strong>Playing:</strong> {formatTime(currentTime)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={isPlaying ? stopPreview : playPreview}
          disabled={!slot1.track && !slot2.track}
          className={`flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            slot1.track || slot2.track
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              Stop Preview
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Preview Mix
            </>
          )}
        </button>

        <button
          onClick={exportMix}
          disabled={(!slot1.track && !slot2.track) || processing}
          className={`flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            slot1.track || slot2.track
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Download className="w-5 h-5" />
          {processing ? 'Processing...' : 'Save Mix'}
        </button>
      </div>

      {/* Track Picker Modal */}
      {showTrackPicker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-blue-500 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Music className="w-6 h-6 text-blue-400" />
                Select Track for {showTrackPicker === 'slot1' ? 'Track 1' : 'Track 2'}
              </h3>
              <button
                onClick={() => setShowTrackPicker(null)}
                className="p-2 hover:bg-gray-800 rounded text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading tracks...</div>
              ) : tracks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No tracks in library</div>
              ) : (
                <div className="space-y-2">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => selectTrack(showTrackPicker!, track)}
                      className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded text-left transition-colors"
                    >
                      <div className="text-white font-semibold">{track.title}</div>
                      <div className="text-gray-400 text-sm">
                        {track.artist} • {formatTime(track.duration || 0)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-300">
        <p className="font-bold mb-2">🎵 How to use:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Add Track 1 from your music library</li>
          <li>Optionally add Track 2 to mix/overlay</li>
          <li>Adjust start times to sequence or overlap tracks</li>
          <li>Use trim controls to cut to specific time ranges</li>
          <li>Adjust volume for each track independently</li>
          <li>Preview your mix before saving</li>
          <li>Save mix - it will appear in your Music Library</li>
        </ol>
      </div>
    </div>
  )
}
