import { useState } from 'react'
import { Filter, X, Plus } from 'lucide-react'
import type { SmartPlaylistFilter } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface SmartPlaylistBuilderProps {
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
  { value: 'music', label: 'Music' },
  { value: 'jingle', label: 'Sound Drop' },
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'background', label: 'Background' },
  { value: 'stinger', label: 'Stinger' },
]

export function SmartPlaylistBuilder({
  isOpen,
  onClose,
  onSave,
}: SmartPlaylistBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagsLogic, setTagsLogic] = useState<'AND' | 'OR'>('OR')
  const [moods, setMoods] = useState<string[]>([])
  const [energyRange, setEnergyRange] = useState<[number, number]>([1, 10])
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 600])
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 200])
  const [categories, setCategories] = useState<string[]>([])
  const [matchingCount, setMatchingCount] = useState(0)
  const [saving, setSaving] = useState(false)

  // Calculate matching tracks whenever filters change
  const updateMatchingCount = async () => {
    try {
      let query = supabase.from('music_library').select('id', { count: 'exact' })

      // Apply filters
      if (tags.length > 0) {
        if (tagsLogic === 'AND') {
          query = query.contains('tags', tags)
        } else {
          query = query.overlaps('tags', tags)
        }
      }

      if (moods.length > 0) {
        query = query.in('mood', moods)
      }

      if (energyRange[0] > 1 || energyRange[1] < 10) {
        query = query.gte('energy_level', energyRange[0]).lte('energy_level', energyRange[1])
      }

      if (durationRange[0] > 0 || durationRange[1] < 600) {
        query = query.gte('duration', durationRange[0]).lte('duration', durationRange[1])
      }

      if (bpmRange[0] > 60 || bpmRange[1] < 200) {
        query = query.gte('bpm', bpmRange[0]).lte('bpm', bpmRange[1])
      }

      if (categories.length > 0) {
        query = query.in('category', categories)
      }

      const { count } = await query
      setMatchingCount(count || 0)
    } catch (error) {
      console.error('Failed to count matching tracks:', error)
    }
  }

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

  const handleToggleMood = (mood: string) => {
    setMoods(moods.includes(mood) ? moods.filter((m) => m !== mood) : [...moods, mood])
  }

  const handleToggleCategory = (category: string) => {
    setCategories(
      categories.includes(category)
        ? categories.filter((c) => c !== category)
        : [...categories, category]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a playlist name')
      return
    }

    setSaving(true)
    try {
      const filterConfig: SmartPlaylistFilter = {
        tags: tags.length > 0 ? tags : undefined,
        energy:
          energyRange[0] > 1 || energyRange[1] < 10
            ? { min: energyRange[0], max: energyRange[1] }
            : undefined,
        bpm:
          bpmRange[0] > 60 || bpmRange[1] < 200
            ? { min: bpmRange[0], max: bpmRange[1] }
            : undefined,
      }

      await supabase.from('smart_playlists').insert({
        name,
        description: description || null,
        filter_config: filterConfig,
      })

      onSave()
      handleReset()
      onClose()
    } catch (error) {
      console.error('Failed to save smart playlist:', error)
      alert('Failed to save smart playlist')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setName('')
    setDescription('')
    setTags([])
    setTagInput('')
    setTagsLogic('OR')
    setMoods([])
    setEnergyRange([1, 10])
    setDurationRange([0, 600])
    setBpmRange([60, 200])
    setCategories([])
    setMatchingCount(0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold">Create Smart Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name and Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Playlist Name
              </label>
              <input
                type="text"
                placeholder="My Smart Playlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description (optional)
              </label>
              <textarea
                placeholder="Describe this smart playlist..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setTagsLogic('OR')}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  tagsLogic === 'OR'
                    ? 'bg-primary-600 text-neutral-100'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                Match ANY tag
              </button>
              <button
                onClick={() => setTagsLogic('AND')}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  tagsLogic === 'AND'
                    ? 'bg-primary-600 text-neutral-100'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                Match ALL tags
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600/20 text-primary-400 border border-primary-600/30 rounded text-sm"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}>
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
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(tagInput))}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Mood Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Moods
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleToggleMood(mood)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    moods.includes(mood)
                      ? 'bg-primary-600 text-neutral-100'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Range */}
          <div>
            <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
              <span>Energy Level Range</span>
              <span className="text-primary-400">
                {energyRange[0]} - {energyRange[1]}
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="1"
                max="10"
                value={energyRange[0]}
                onChange={(e) =>
                  setEnergyRange([parseInt(e.target.value), energyRange[1]])
                }
                className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="range"
                min="1"
                max="10"
                value={energyRange[1]}
                onChange={(e) =>
                  setEnergyRange([energyRange[0], parseInt(e.target.value)])
                }
                className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Duration Range */}
          <div>
            <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
              <span>Duration Range (seconds)</span>
              <span className="text-primary-400">
                {durationRange[0]}s - {durationRange[1]}s
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max="600"
                step="10"
                value={durationRange[0]}
                onChange={(e) =>
                  setDurationRange([parseInt(e.target.value), durationRange[1]])
                }
                className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="range"
                min="0"
                max="600"
                step="10"
                value={durationRange[1]}
                onChange={(e) =>
                  setDurationRange([durationRange[0], parseInt(e.target.value)])
                }
                className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* BPM Range */}
          <div>
            <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
              <span>BPM Range</span>
              <span className="text-primary-400">
                {bpmRange[0]} - {bpmRange[1]} BPM
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="60"
                max="200"
                step="5"
                value={bpmRange[0]}
                onChange={(e) =>
                  setBpmRange([parseInt(e.target.value), bpmRange[1]])
                }
                className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="range"
                min="60"
                max="200"
                step="5"
                value={bpmRange[1]}
                onChange={(e) =>
                  setBpmRange([bpmRange[0], parseInt(e.target.value)])
                }
                className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleToggleCategory(cat.value)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    categories.includes(cat.value)
                      ? 'bg-primary-600 text-neutral-100'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matching Count */}
          <div className="bg-neutral-800 border border-neutral-700 rounded p-3">
            <button
              onClick={updateMatchingCount}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded font-medium transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              Preview Matching Tracks
            </button>
            {matchingCount > 0 && (
              <p className="text-center text-neutral-400 text-sm mt-2">
                {matchingCount} track{matchingCount !== 1 ? 's' : ''} match this filter
              </p>
            )}
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
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-neutral-100 rounded font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Creating...' : 'Create Smart Playlist'}
          </button>
        </div>
      </div>
    </div>
  )
}
