import { useState, useEffect, useRef } from 'react'
import { ShowManager, ShowProfile } from '../lib/shows/ShowManager'
import { Tv, ChevronDown, Plus, Settings } from 'lucide-react'

interface ShowSelectorProps {
  onManageShows?: () => void
}

export function ShowSelector({ onManageShows }: ShowSelectorProps) {
  const [showManager] = useState(() => new ShowManager())
  const [shows, setShows] = useState<ShowProfile[]>([])
  const [activeShow, setActiveShow] = useState<ShowProfile | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load shows and subscribe to changes
    const unsubscribe = showManager.subscribe(setShows)
    const unsubscribeActive = showManager.subscribeToActiveShow(setActiveShow)

    showManager.loadShows()

    return () => {
      unsubscribe()
      unsubscribeActive()
    }
  }, [showManager])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectShow = async (showId: string) => {
    await showManager.setActiveShow(showId)
    setIsOpen(false)
  }

  const activeShows = shows.filter(s => !s.is_archived && !s.is_template)
  const hasShows = activeShows.length > 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
          activeShow
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        style={
          activeShow?.primary_color
            ? {
                background: `linear-gradient(135deg, ${activeShow.primary_color}, ${activeShow.secondary_color || activeShow.primary_color})`,
              }
            : undefined
        }
      >
        <Tv className="w-5 h-5" />
        <span className="max-w-[200px] truncate">
          {activeShow ? activeShow.name : 'No Show Selected'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Select Show</h3>
              <button
                onClick={() => {
                  setIsOpen(false)
                  onManageShows?.()
                }}
                className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded transition-colors"
              >
                <Settings className="w-3 h-3" />
                Manage
              </button>
            </div>
          </div>

          {/* Show List */}
          <div className="max-h-96 overflow-y-auto">
            {!hasShows && (
              <div className="p-8 text-center">
                <Tv className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 mb-2">No shows yet</p>
                <p className="text-xs text-gray-500 mb-4">
                  Create your first show to get started
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onManageShows?.()
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Show
                </button>
              </div>
            )}

            {hasShows && (
              <div className="py-2">
                {activeShows.map((show) => (
                  <button
                    key={show.id}
                    onClick={() => handleSelectShow(show.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                      activeShow?.id === show.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Indicator */}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          background: show.primary_color || '#6b7280',
                        }}
                      />

                      {/* Show Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {show.name}
                          </h4>
                          {activeShow?.id === show.id && (
                            <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        {show.description && (
                          <p className="text-xs text-gray-400 truncate">
                            {show.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{show.total_episodes} episodes</span>
                          {show.schedule_type && (
                            <span className="capitalize">{show.schedule_type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {hasShows && (
            <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false)
                  onManageShows?.()
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Show
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
