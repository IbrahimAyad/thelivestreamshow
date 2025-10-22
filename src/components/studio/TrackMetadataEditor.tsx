import { useState, useEffect } from 'react'
import { X, Tag as TagIcon, Hash } from 'lucide-react'
import type { MusicTrack } from "@/types/database"
import { supabase } from '@/lib/supabase'

interface TrackMetadataEditorProps {
  track: MusicTrack
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const MOOD_OPTIONS = [
  'Energetic',
  'Calm',
  'Dramatic',
  'Happy',
  'Sad',
  'Inspiring',
  'Dark',
  'Uplifting',
  'Intense',
  'Chill',
]

const CATEGORY_OPTIONS = [
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'background', label: 'Background' },
  { value: 'jingle', label: 'Sound Drop' },
  { value: 'stinger', label: 'Stinger' },
  { value: 'transition', label: 'Transition' },
  { value: 'ambient', label: 'Ambient' },
]

const POPULAR_TAGS = [
  'upbeat',
  'slow',
  'vocal',
  'instrumental',
  'electronic',
  'acoustic',
  'rock',
  'pop',
  'cinematic',
  'corporate',
]

export function TrackMetadataEditor({
  track,
  isOpen,
  onClose,
  onSave,
}: TrackMetadataEditorProps) {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [mood, setMood] = useState<string>('')
  const [energyLevel, setEnergyLevel] = useState<number>(5)
  const [customCategory, setCustomCategory] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (track) {
      try {
        const trackTags = Array.isArray(track.tags) ? track.tags : 
                         (track.tags ? JSON.parse(track.tags as any) : [])
        setTags(trackTags)
      } catch (e) {
        setTags([])
      }
      setMood(track.mood || '')
      setEnergyLevel(track.energy_level || 5)
      setCustomCategory(track.custom_category || '')
    }
  }, [track])

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(tagInput)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase
        .from('music_library')
        .update({
          tags,
          mood,
          energy_level: energyLevel,
          custom_category: customCategory,
        })
        .eq('id', track.id)
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save metadata:', error)
      alert('Failed to save metadata')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Track Metadata</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Track Info */}
          <div>
            <h3 className="text-lg font-medium mb-2">{track.title}</h3>
            {track.artist && (
              <p className="text-sm text-neutral-400">{track.artist}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <TagIcon className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600/20 text-primary-400 border border-primary-600/30 rounded text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-primary-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-primary-500"
            />
            <div className="mt-2">
              <p className="text-xs text-neutral-400 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-1">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    disabled={tags.includes(tag)}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-400 border border-neutral-700 rounded text-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Mood
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">Select mood...</option>
              {MOOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Energy Level */}
          <div>
            <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
              <span>
                <Hash className="w-4 h-4 inline mr-1" />
                Energy Level
              </span>
              <span className="text-primary-400">{energyLevel}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Custom Category
            </label>
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">Select category...</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-neutral-100 rounded font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Metadata'}
          </button>
        </div>
      </div>
    </div>
  )
}
