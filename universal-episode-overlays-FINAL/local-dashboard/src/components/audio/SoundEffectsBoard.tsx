import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Music, Play, Upload, Trash2, Keyboard } from 'lucide-react'
import type { SoundEffect } from '../../lib/supabase'

export function SoundEffectsBoard() {
  const [effects, setEffects] = useState<SoundEffect[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadEffects()
  }, [])

  const loadEffects = async () => {
    const { data } = await supabase
      .from('sound_effects')
      .select('*')
      .order('category')
    
    if (data) {
      setEffects(data as SoundEffect[])
      const uniqueCategories = [...new Set(data.map(e => e.category))]
      setCategories(uniqueCategories)
    }
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
          .from('sound_effects')
          .insert({
            name: file.name.replace(/\.[^/.]+$/, ''),
            file_url: publicUrl,
            category: 'custom'
          })
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload sound effect')
      }
    }
    setUploading(false)
    e.target.value = ''
    loadEffects()
  }

  const playSound = async (fileUrl: string) => {
    const audio = new Audio(fileUrl)
    audio.play().catch(err => console.error('Play error:', err))
  }

  const deleteEffect = async (id: string, fileUrl: string) => {
    if (!confirm('Delete this sound effect?')) return

    try {
      const filePath = fileUrl.split('/').pop()
      if (filePath) {
        await supabase.storage.from('audio-files').remove([filePath])
      }
      
      await supabase.from('sound_effects').delete().eq('id', id)
      loadEffects()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete sound effect')
    }
  }

  const assignHotkey = async (id: string) => {
    const hotkey = prompt('Enter hotkey (e.g., F1, Ctrl+1):')
    if (!hotkey) return

    await supabase
      .from('sound_effects')
      .update({ hotkey })
      .eq('id', id)

    loadEffects()
  }

  const filteredEffects = selectedCategory === 'all' 
    ? effects 
    : effects.filter(e => e.category === selectedCategory)

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Music className="w-6 h-6 text-green-500" />
          Sound Effects Board
        </h2>
        <label className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold cursor-pointer flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Sound
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

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded font-semibold text-sm ${
            selectedCategory === 'all' ? 'bg-green-600' : 'bg-[#1a1a1a]'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded font-semibold text-sm capitalize ${
              selectedCategory === cat ? 'bg-green-600' : 'bg-[#1a1a1a]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {uploading && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded text-green-300">
          Uploading sound effects...
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {filteredEffects.map(effect => (
          <div key={effect.id} className="bg-[#1a1a1a] rounded border border-[#3a3a3a] p-3 group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" title={effect.name}>
                  {effect.name}
                </div>
                {effect.hotkey && (
                  <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <Keyboard className="w-3 h-3" />
                    {effect.hotkey}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteEffect(effect.id, effect.file_url)}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            <button
              onClick={() => playSound(effect.file_url)}
              className="w-full bg-green-600 hover:bg-green-700 rounded py-2 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Play
            </button>

            <button
              onClick={() => assignHotkey(effect.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded py-1 mt-2 text-xs"
            >
              Set Hotkey
            </button>
          </div>
        ))}
      </div>

      {filteredEffects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No sound effects found</p>
          <p className="text-sm">Upload audio files to get started</p>
        </div>
      )}
    </div>
  )
}
