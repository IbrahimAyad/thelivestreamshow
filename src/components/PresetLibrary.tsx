import { useState, useEffect } from 'react'
import { PresetManager } from '../lib/presets/PresetManager'
import type { ScenePreset, PresetCategory, PresetFilter } from '../lib/presets/PresetManager'
import {
  Library,
  Play,
  Star,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit,
  Search,
  Filter,
  Plus,
  Zap,
  TrendingUp,
  Clock,
  Grid3x3,
  List
} from 'lucide-react'

interface PresetLibraryProps {
  onEditPreset?: (presetId: string) => void
}

export function PresetLibrary({ onEditPreset }: PresetLibraryProps) {
  const [presetManager] = useState(() => new PresetManager())
  const [presets, setPresets] = useState<ScenePreset[]>([])
  const [filteredPresets, setFilteredPresets] = useState<ScenePreset[]>([])
  const [filter, setFilter] = useState<PresetFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [isApplying, setIsApplying] = useState<string | null>(null)

  // Load presets
  useEffect(() => {
    const unsubscribe = presetManager.subscribe(() => {
      presetManager.getAllPresets().then(setPresets)
    })
    presetManager.loadPresets()
    return unsubscribe
  }, [presetManager])

  // Apply filters
  useEffect(() => {
    const newFilter: PresetFilter = {
      ...filter,
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined
    }

    const filtered = presetManager.filterPresets(newFilter)
    setFilteredPresets(filtered)
  }, [presets, searchQuery, selectedCategory, filter, presetManager])

  const handleApplyPreset = async (presetId: string) => {
    setIsApplying(presetId)
    try {
      await presetManager.applyPreset(presetId)
      // Success feedback could go here
    } catch (error) {
      console.error('Failed to apply preset:', error)
      alert('Failed to apply preset')
    } finally {
      setIsApplying(null)
    }
  }

  const handleToggleFavorite = async (presetId: string) => {
    await presetManager.toggleFavorite(presetId)
  }

  const handleDuplicate = async (presetId: string) => {
    try {
      await presetManager.duplicatePreset(presetId)
    } catch (error) {
      console.error('Failed to duplicate preset:', error)
    }
  }

  const handleDelete = async (presetId: string) => {
    if (confirm('Delete this preset?')) {
      try {
        await presetManager.deletePreset(presetId)
      } catch (error) {
        console.error('Failed to delete preset:', error)
      }
    }
  }

  const handleExport = async (presetId: string) => {
    try {
      const json = await presetManager.exportPreset(presetId)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `preset-${presetId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export preset:', error)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await presetManager.importPreset(text)
    } catch (error) {
      console.error('Failed to import preset:', error)
      alert('Failed to import preset')
    }
  }

  const getCategoryIcon = (category: PresetCategory): string => {
    switch (category) {
      case 'intro': return '🎬'
      case 'outro': return '🎞️'
      case 'interview': return '🎙️'
      case 'discussion': return '💬'
      case 'presentation': return '📊'
      case 'qa': return '❓'
      case 'break': return '☕'
      case 'technical': return '🔧'
      case 'custom': return '⚙️'
      default: return '📁'
    }
  }

  const getCategoryColor = (category: PresetCategory): string => {
    switch (category) {
      case 'intro': return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'outro': return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
      case 'interview': return 'bg-purple-500/20 border-purple-500/50 text-purple-400'
      case 'discussion': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'presentation': return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
      case 'qa': return 'bg-pink-500/20 border-pink-500/50 text-pink-400'
      case 'break': return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
      case 'technical': return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'custom': return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
    }
  }

  const categories: (PresetCategory | 'all')[] = [
    'all', 'intro', 'outro', 'interview', 'discussion',
    'presentation', 'qa', 'break', 'technical', 'custom'
  ]

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Library className="w-5 h-5 text-purple-400" />
          Preset Library
          {filteredPresets.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs font-semibold rounded-full">
              {filteredPresets.length}
            </span>
          )}
        </h3>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Import */}
          <label className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded transition-colors cursor-pointer flex items-center gap-1">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search presets..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat === 'all' ? '📂' : getCategoryIcon(cat as PresetCategory)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter({ ...filter, favorites_only: !filter.favorites_only })}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-1 ${
              filter.favorites_only
                ? 'bg-yellow-600 border-yellow-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Star className="w-3 h-3" />
            Favorites Only
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-xs font-semibold rounded transition-colors flex items-center gap-1"
          >
            <Filter className="w-3 h-3" />
            More Filters
          </button>
        </div>
      </div>

      {/* Preset Grid/List */}
      {filteredPresets.length === 0 && (
        <div className="p-8 bg-gray-900 border border-gray-700 rounded-lg text-center">
          <Library className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 mb-2">No presets found</p>
          <p className="text-xs text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first preset to get started'}
          </p>
        </div>
      )}

      {viewMode === 'grid' && filteredPresets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map(preset => (
            <div
              key={preset.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(preset.category)}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{preset.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(preset.category)}`}>
                      {preset.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleFavorite(preset.id)}
                  className={`transition-colors ${
                    preset.is_favorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-4 h-4" fill={preset.is_favorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{preset.description}</p>

              {/* Tags */}
              {preset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {preset.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {preset.use_count} uses
                </div>
                {preset.last_used_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(preset.last_used_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApplyPreset(preset.id)}
                  disabled={isApplying === preset.id}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                >
                  {isApplying === preset.id ? (
                    <>
                      <Zap className="w-4 h-4 animate-pulse" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Apply
                    </>
                  )}
                </button>

                {onEditPreset && (
                  <button
                    onClick={() => onEditPreset(preset.id)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDuplicate(preset.id)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleExport(preset.id)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  title="Export"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(preset.id)}
                  className="p-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && filteredPresets.length > 0 && (
        <div className="space-y-2">
          {filteredPresets.map(preset => (
            <div
              key={preset.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-3 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{getCategoryIcon(preset.category)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{preset.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(preset.category)}`}>
                        {preset.category}
                      </span>
                      {preset.is_favorite && (
                        <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{preset.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {preset.use_count}
                    </div>
                    {preset.last_used_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(preset.last_used_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleApplyPreset(preset.id)}
                    disabled={isApplying === preset.id}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Apply
                  </button>
                  {onEditPreset && (
                    <button
                      onClick={() => onEditPreset(preset.id)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicate(preset.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport(preset.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id)}
                    className="p-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded text-xs text-purple-300">
        <p><strong>Presets:</strong> Save and reuse automation configurations, trigger rules, and action sequences.</p>
        <p className="mt-1">Click "Apply" to instantly configure your show with saved settings.</p>
      </div>
    </div>
  )
}
