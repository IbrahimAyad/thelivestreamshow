import { useState } from 'react'
import { ShowLibrary } from './ShowLibrary'
import { ShowEditor } from './ShowEditor'
import { ShowProfile } from '../lib/shows/ShowManager'
import { Tv } from 'lucide-react'

export function ShowManagerPanel() {
  const [view, setView] = useState<'library' | 'editor'>('library')
  const [editingShowId, setEditingShowId] = useState<string | undefined>(undefined)

  const handleCreateNew = () => {
    setEditingShowId(undefined)
    setView('editor')
  }

  const handleEditShow = (showId: string) => {
    setEditingShowId(showId)
    setView('editor')
  }

  const handleSave = (show: ShowProfile) => {
    console.log('Show saved:', show)
    setView('library')
    setEditingShowId(undefined)
  }

  const handleCancel = () => {
    setView('library')
    setEditingShowId(undefined)
  }

  return (
    <div className="bg-gray-900 border-2 border-purple-600/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-gray-900/50 border-b border-purple-600/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Show Management</h2>
              <p className="text-sm text-gray-400">
                {view === 'library'
                  ? 'Manage all your shows and configurations'
                  : editingShowId
                  ? 'Edit show profile'
                  : 'Create new show'}
              </p>
            </div>
          </div>

          {view === 'library' && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              + Create New Show
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'library' ? (
          <ShowLibrary onEditShow={handleEditShow} onCreateNew={handleCreateNew} />
        ) : (
          <ShowEditor showId={editingShowId} onSave={handleSave} onCancel={handleCancel} />
        )}
      </div>
    </div>
  )
}
