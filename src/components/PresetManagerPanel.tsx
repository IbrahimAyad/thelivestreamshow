import { useState } from 'react'
import { PresetLibrary } from './PresetLibrary'
import { PresetEditor } from './PresetEditor'
import { ScenePreset } from '../lib/presets/PresetManager'
import { Layers } from 'lucide-react'

export function PresetManagerPanel() {
  const [view, setView] = useState<'library' | 'editor'>('library')
  const [editingPresetId, setEditingPresetId] = useState<string | undefined>(undefined)

  const handleCreateNew = () => {
    setEditingPresetId(undefined)
    setView('editor')
  }

  const handleEditPreset = (presetId: string) => {
    setEditingPresetId(presetId)
    setView('editor')
  }

  const handleSave = (preset: ScenePreset) => {
    console.log('Preset saved:', preset)
    setView('library')
    setEditingPresetId(undefined)
  }

  const handleCancel = () => {
    setView('library')
    setEditingPresetId(undefined)
  }

  return (
    <div className="bg-gray-900 border-2 border-purple-600/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-gray-900/50 border-b border-purple-600/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Scene Presets & Templates</h2>
              <p className="text-sm text-gray-400">
                {view === 'library' ? 'Browse and apply saved configurations' : editingPresetId ? 'Edit preset' : 'Create new preset'}
              </p>
            </div>
          </div>

          {view === 'library' && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              + Create New
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'library' ? (
          <PresetLibrary onEditPreset={handleEditPreset} />
        ) : (
          <PresetEditor
            presetId={editingPresetId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  )
}
