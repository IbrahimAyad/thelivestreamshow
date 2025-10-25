import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Music2, Upload, Play, Trash2, Repeat } from 'lucide-react'
import type { AudioTrack } from '../../lib/supabase'

export function MusicLibrary() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(true)
  const [duckingIntegration, setDuckingIntegration] = useState(true)

  useEffect(() => {
    loadTracks()
  }, [])

  const loadTracks = async () => {
    const { data } = await supabase
      .from('audio_tracks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setTracks(data as AudioTrack[])
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('audio-files')
          .getPublicUrl(fileName)

        await supabase
          .from('audio_tracks')
          .insert({
            name: file.name.replace(/\.[^/.]+$/, ''),
            file_url: publicUrl,
            category: 'background'
          })
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload music track')
      }
    }
    setUploading(false)
    e.target.value = ''
    loadTracks()
  }

  const playTrack = (track: AudioTrack) => {
    setCurrentTrack(track)
    const audio = new Audio(track.file_url)
    audio.loop = loopEnabled
    audio.play().catch(err => console.error('Play error:', err))
  }

  const deleteTrack = async (id: string, fileUrl: string) => {
    if (!confirm('Delete this music track?')) return

    try {
      const filePath = fileUrl.split('/').pop()
      if (filePath) {
        await supabase.storage.from('audio-files').remove([filePath])
      }
      
      await supabase.from('audio_tracks').delete().eq('id', id)
      loadTracks()
      if (currentTrack?.id === id) setCurrentTrack(null)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete track')
    }
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Music2 className="w-6 h-6 text-purple-500" />
          Background Music Library
        </h2>
        <label className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold cursor-pointer flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Music
          <input
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setLoopEnabled(!loopEnabled)}
          className={`p-3 rounded border flex items-center gap-2 justify-center ${
            loopEnabled ? 'bg-purple-600/20 border-purple-500' : 'bg-[#1a1a1a] border-[#3a3a3a]'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Loop: {loopEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
          className={`p-3 rounded border ${
            crossfadeEnabled ? 'bg-purple-600/20 border-purple-500' : 'bg-[#1a1a1a] border-[#3a3a3a]'
          }`}
        >
          Crossfade: {crossfadeEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setDuckingIntegration(!duckingIntegration)}
          className={`p-3 rounded border ${
            duckingIntegration ? 'bg-purple-600/20 border-purple-500' : 'bg-[#1a1a1a] border-[#3a3a3a]'
          }`}
        >
          Ducking: {duckingIntegration ? 'ON' : 'OFF'}
        </button>
      </div>

      {uploading && (
        <div className="mb-4 p-4 bg-purple-900/30 border border-purple-500/30 rounded text-purple-300">
          Uploading music tracks...
        </div>
      )}

      {currentTrack && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-2 border-purple-500/50 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">NOW PLAYING</div>
              <div className="font-bold text-lg">{currentTrack.name}</div>
            </div>
            <Play className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tracks.map(track => (
          <div
            key={track.id}
            className={`bg-[#1a1a1a] rounded border p-3 flex items-center gap-3 ${
              currentTrack?.id === track.id ? 'border-purple-500' : 'border-[#3a3a3a]'
            }`}
          >
            <button
              onClick={() => playTrack(track)}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded"
            >
              <Play className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <div className="font-semibold">{track.name}</div>
              <div className="text-xs text-gray-400 capitalize">{track.category}</div>
            </div>
            <button
              onClick={() => deleteTrack(track.id, track.file_url)}
              className="p-2 bg-red-600 hover:bg-red-700 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {tracks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No music tracks found</p>
          <p className="text-sm">Upload audio files to build your music library</p>
        </div>
      )}
    </div>
  )
}
