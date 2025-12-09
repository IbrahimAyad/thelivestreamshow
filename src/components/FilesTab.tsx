import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Download, ExternalLink, Upload, Trash2, Plus, Eye } from 'lucide-react'

interface CastFile {
  id: string
  file_name: string
  file_type: string
  file_category: string
  description: string
  file_url: string
  public_url: string
  is_active: boolean
  download_count: number
  created_at: string
}

export function FilesTab() {
  const [files, setFiles] = useState<CastFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddFile, setShowAddFile] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    const { data, error } = await supabase
      .from('cast_files')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading files:', error)
    } else {
      setFiles(data || [])
    }

    setIsLoading(false)
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return

    const { error } = await supabase
      .from('cast_files')
      .update({ is_active: false })
      .eq('id', fileId)

    if (error) {
      console.error('Error deleting file:', error)
      alert('❌ Failed to delete file')
    } else {
      loadFiles()
    }
  }

  const logFileAccess = async (fileId: string, accessType: string) => {
    await supabase
      .from('cast_file_access_log')
      .insert({
        file_id: fileId,
        access_type: accessType,
        cast_member_name: 'Admin' // You can customize this
      })

    // Increment download count
    if (accessType === 'download' || accessType === 'view') {
      await supabase.rpc('increment_download_count', { file_id: fileId })
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'html') return <FileText className="w-5 h-5 text-blue-400" />
    return <FileText className="w-5 h-5 text-gray-400" />
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      forms: 'bg-purple-900/30 border-purple-500/50 text-purple-300',
      documents: 'bg-blue-900/30 border-blue-500/50 text-blue-300',
      resources: 'bg-green-900/30 border-green-500/50 text-green-300'
    }
    return colors[category] || 'bg-gray-800 border-gray-600 text-gray-300'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <FileText className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Cast Files</h2>
                <p className="text-blue-200/70 text-sm">Forms, documents, and resources for the cast</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddFile(!showAddFile)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add File
          </button>
        </div>
      </div>

      {/* Add File Form */}
      {showAddFile && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New File</h3>
          <p className="text-gray-400 text-sm mb-4">
            Upload files or link to external resources for the cast to access
          </p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="File Name"
              className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
            />
            <textarea
              placeholder="Description"
              className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white h-20"
            />
            <div className="flex gap-4">
              <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                Upload File
              </button>
              <button
                onClick={() => setShowAddFile(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Files Yet</h3>
          <p className="text-gray-400">Add files for your cast to access</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{file.file_name}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${getCategoryColor(file.file_category)}`}>
                        {file.file_category}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{file.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📊 {file.download_count} views</span>
                      <span>📅 {new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {file.public_url && (
                    <a
                      href={file.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logFileAccess(file.id, 'view')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  )}
                  <button
                    onClick={() => {
                      logFileAccess(file.id, 'download')
                      window.open(file.file_url, '_blank')
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Public URL Display */}
              {file.public_url && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Cast Access URL:</p>
                  <code className="text-sm text-cyan-400 break-all">{file.public_url}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
