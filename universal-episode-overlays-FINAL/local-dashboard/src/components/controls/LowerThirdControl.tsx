import { useState, useEffect } from 'react'
import { useLowerThird } from '../../contexts/LowerThirdContext'
import { useScene } from '../../contexts/SceneContext'
import { ChevronDown, Eye, EyeOff, Image } from 'lucide-react'

export function LowerThirdControl() {
  const { isVisible, currentGraphic, availableGraphics, showLowerThird, hideLowerThird, toggleLowerThird } = useLowerThird()
  const { activeScene } = useScene()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Auto-select show-specific lower third when scene changes
  useEffect(() => {
    if (activeScene?.config?.show_id && availableGraphics.length > 0) {
      const showGraphic = availableGraphics.find(g => g.show_id === activeScene.config.show_id)
      if (showGraphic && (!currentGraphic || currentGraphic.id !== showGraphic.id)) {
        // Don't auto-show, just set as current option
        // User must manually toggle
      }
    }
  }, [activeScene, availableGraphics])

  const handleSelectGraphic = (graphic: any) => {
    showLowerThird(graphic)
    setIsDropdownOpen(false)
  }

  return (
    <div className="bg-[#2a2a2a] p-6 rounded-lg shadow-lg border border-[#3a3a3a]">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Image className="w-5 h-5 text-purple-500" />
        Lower Third Overlay
      </h2>

      <div className="space-y-4">
        {/* Graphic Selector */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Select Graphic</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-4 py-3 text-white flex items-center justify-between hover:border-purple-500/50 transition-colors"
            >
              <span className="truncate">
                {currentGraphic ? currentGraphic.name : 'No graphic selected'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded shadow-lg max-h-64 overflow-y-auto z-10">
                {availableGraphics.length > 0 ? (
                  availableGraphics.map(graphic => (
                    <button
                      key={graphic.id}
                      onClick={() => handleSelectGraphic(graphic)}
                      className={`w-full px-4 py-3 text-left hover:bg-[#2a2a2a] transition-colors flex items-center gap-3 ${
                        currentGraphic?.id === graphic.id ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
                      }`}
                    >
                      <div className="w-12 h-8 bg-black rounded border border-[#3a3a3a] overflow-hidden flex-shrink-0">
                        <img src={graphic.file_url} alt={graphic.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{graphic.name}</div>
                        {graphic.tags && graphic.tags.length > 0 && (
                          <div className="text-xs text-gray-400 truncate">
                            {graphic.tags.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <p>No overlay graphics available</p>
                    <p className="text-xs mt-1">Upload graphics with category 'overlay'</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {currentGraphic && (
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Preview</label>
            <div className="bg-black rounded border border-[#3a3a3a] overflow-hidden">
              <img 
                src={currentGraphic.file_url} 
                alt={currentGraphic.name}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Toggle Control */}
        <div className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded border border-[#3a3a3a]">
          <div>
            <div className="font-semibold">{isVisible ? 'Lower Third Visible' : 'Lower Third Hidden'}</div>
            <div className="text-xs text-gray-400 mt-1">
              {isVisible ? 'Overlay is showing on broadcast' : 'Click to show overlay'}
            </div>
          </div>
          <button
            onClick={toggleLowerThird}
            disabled={!currentGraphic}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isVisible
                ? 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                : 'bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
            }`}
          >
            {isVisible ? (
              <>
                <EyeOff className="w-5 h-5" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Show
              </>
            )}
          </button>
        </div>

        {/* Keyboard Hint */}
        <div className="text-xs text-gray-500 text-center">
          Keyboard shortcut: Press <kbd className="px-2 py-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded">L</kbd> to toggle
        </div>
      </div>
    </div>
  )
}
