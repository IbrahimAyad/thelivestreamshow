import { useState, useEffect } from 'react'
import { ShowManager, ShowProfile, ShowFilter } from '../lib/shows/ShowManager'
import {
  Tv,
  Play,
  Archive,
  Trash2,
  Copy,
  Download,
  Upload,
  Edit,
  Search,
  Star,
  Grid3x3,
  List,
  Plus,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react'

interface ShowLibraryProps {
  onEditShow?: (showId: string) => void
  onCreateNew?: () => void
}

export function ShowLibrary({ onEditShow, onCreateNew }: ShowLibraryProps) {
  const [showManager] = useState(() => new ShowManager())
  const [shows, setShows] = useState<ShowProfile[]>([])
  const [filteredShows, setFilteredShows] = useState<ShowProfile[]>([])
  const [filter, setFilter] = useState<ShowFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showArchived, setShowArchived] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = showManager.subscribe(setShows)
    showManager.loadShows()
    return unsubscribe
  }, [showManager])

  useEffect(() => {
    const newFilter: ShowFilter = {
      ...filter,
      search: searchQuery || undefined,
      is_archived: showArchived ? undefined : false
    }

    const filtered = showManager.filterShows(newFilter)
    setFilteredShows(filtered)
  }, [shows, searchQuery, showArchived, filter, showManager])

  const handleActivateShow = async (showId: string) => {
    setActivating(showId)
    try {
      await showManager.setActiveShow(showId)
    } catch (error) {
      console.error('Failed to activate show:', error)
    } finally {
      setActivating(null)
    }
  }

  const handleArchive = async (showId: string) => {
    if (confirm('Archive this show? You can unarchive it later.')) {
      await showManager.archiveShow(showId)
    }
  }

  const handleUnarchive = async (showId: string) => {
    await showManager.unarchiveShow(showId)
  }

  const handleDuplicate = async (showId: string) => {
    try {
      await showManager.duplicateShow(showId)
    } catch (error) {
      console.error('Failed to duplicate show:', error)
    }
  }

  const handleDelete = async (showId: string) => {
    if (confirm('Delete this show permanently? This cannot be undone.')) {
      try {
        await showManager.deleteShow(showId)
      } catch (error) {
        console.error('Failed to delete show:', error)
      }
    }
  }

  const handleExport = (showId: string) => {
    try {
      const json = showManager.exportShow(showId)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `show-${showId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export show:', error)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await showManager.importShow(text)
    } catch (error) {
      console.error('Failed to import show:', error)
      alert('Failed to import show')
    }
  }

  const getScheduleDisplay = (show: ShowProfile): string => {
    if (!show.schedule_type) return 'Not scheduled'

    const scheduleTypes = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      custom: 'Custom'
    }

    let display = scheduleTypes[show.schedule_type]

    if (show.schedule_time) {
      display += ` at ${show.schedule_time}`
    }

    return display
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Tv className="w-5 h-5 text-purple-400" />
          Show Library
          {filteredShows.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs font-semibold rounded-full">
              {filteredShows.length}
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
            placeholder="Search shows..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-1 ${
              showArchived
                ? 'bg-orange-600 border-orange-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Archive className="w-3 h-3" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredShows.length === 0 && (
        <div className="p-8 bg-gray-900 border border-gray-700 rounded-lg text-center">
          <Tv className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 mb-2">No shows found</p>
          <p className="text-xs text-gray-500 mb-4">
            {searchQuery || showArchived
              ? 'Try adjusting your filters'
              : 'Create your first show to get started'}
          </p>
          {!searchQuery && !showArchived && onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Show
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredShows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShows.map((show) => (
            <div
              key={show.id}
              className={`bg-gray-900 border rounded-lg p-4 hover:border-purple-500/50 transition-all ${
                show.is_active ? 'border-green-500/50 ring-2 ring-green-500/20' : 'border-gray-700'
              }`}
            >
              {/* Header with Color Bar */}
              <div className="mb-3">
                <div
                  className="h-2 rounded-full mb-3"
                  style={{
                    background: show.primary_color
                      ? `linear-gradient(90deg, ${show.primary_color}, ${show.secondary_color || show.primary_color})`
                      : '#6b7280'
                  }}
                />
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate mb-1">
                      {show.name}
                    </h4>
                    {show.is_active && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold rounded-full">
                        <Play className="w-3 h-3" fill="currentColor" />
                        ACTIVE
                      </span>
                    )}
                    {show.is_archived && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs font-bold rounded-full">
                        <Archive className="w-3 h-3" />
                        ARCHIVED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {show.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{show.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <TrendingUp className="w-3 h-3" />
                  {show.total_episodes} eps
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {getScheduleDisplay(show)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!show.is_active && !show.is_archived && (
                  <button
                    onClick={() => handleActivateShow(show.id)}
                    disabled={activating === show.id}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                  >
                    {activating === show.id ? (
                      <>Activating...</>
                    ) : (
                      <>
                        <Play className="w-4 h-4" fill="currentColor" />
                        Activate
                      </>
                    )}
                  </button>
                )}

                {show.is_active && (
                  <button
                    disabled
                    className="flex-1 px-3 py-2 bg-green-600/50 text-white text-sm font-semibold rounded cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Play className="w-4 h-4" fill="currentColor" />
                    Active
                  </button>
                )}

                {show.is_archived && (
                  <button
                    onClick={() => handleUnarchive(show.id)}
                    className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded transition-colors"
                  >
                    Unarchive
                  </button>
                )}

                {onEditShow && (
                  <button
                    onClick={() => onEditShow(show.id)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDuplicate(show.id)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleExport(show.id)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  title="Export"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleArchive(show.id)}
                  className="p-2 bg-gray-700 hover:bg-orange-600 text-gray-300 hover:text-white rounded transition-colors"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredShows.length > 0 && (
        <div className="space-y-2">
          {filteredShows.map((show) => (
            <div
              key={show.id}
              className={`bg-gray-900 border rounded-lg p-3 hover:border-purple-500/50 transition-all ${
                show.is_active ? 'border-green-500/50' : 'border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Color Indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      background: show.primary_color || '#6b7280'
                    }}
                  />

                  {/* Show Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{show.name}</h4>
                      {show.is_active && (
                        <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold rounded-full">
                          ACTIVE
                        </span>
                      )}
                      {show.is_archived && (
                        <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs font-bold rounded-full">
                          ARCHIVED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{show.total_episodes} episodes</span>
                      <span>{getScheduleDisplay(show)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {!show.is_active && !show.is_archived && (
                    <button
                      onClick={() => handleActivateShow(show.id)}
                      disabled={activating === show.id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1"
                    >
                      <Play className="w-4 h-4" fill="currentColor" />
                      Activate
                    </button>
                  )}
                  {show.is_archived && (
                    <button
                      onClick={() => handleUnarchive(show.id)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded transition-colors"
                    >
                      Unarchive
                    </button>
                  )}
                  {onEditShow && (
                    <button
                      onClick={() => onEditShow(show.id)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicate(show.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport(show.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded text-xs text-purple-300">
        <p><strong>Shows:</strong> Create separate show profiles with their own configurations and presets.</p>
        <p className="mt-1">Activate a show to apply its settings and track episodes separately.</p>
      </div>
    </div>
  )
}
