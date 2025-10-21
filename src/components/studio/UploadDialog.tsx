import { Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'

interface UploadDialogProps {
  onUpload: (files: File[], metadata: { friendly_name?: string; jingle_type?: string }) => void
  uploading: boolean
  uploadProgress: number
  category: 'music' | 'jingle'
  onClose: () => void
}

export function UploadDialog({
  onUpload,
  uploading,
  uploadProgress,
  category,
  onClose,
}: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [friendlyName, setFriendlyName] = useState('')
  const [jingleType, setJingleType] = useState('custom')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(droppedFiles)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
  }, [])

  const handleSubmit = () => {
    if (files.length === 0) return
    onUpload(files, {
      friendly_name: friendlyName || undefined,
      jingle_type: category === 'jingle' ? jingleType : undefined,
    })
    setFiles([])
    setFriendlyName('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 w-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-neutral-100">
            Upload {category === 'jingle' ? 'Sound Drop' : 'Music'}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-neutral-400 hover:text-neutral-100" />
          </button>
        </div>

        <div
          className="border-2 border-dashed border-neutral-700 rounded-lg p-6 mb-4 text-center cursor-pointer hover:border-primary-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-dialog')?.click()}
        >
          <input
            id="file-upload-dialog"
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          {files.length > 0 ? (
            <div>
              <p className="text-sm text-neutral-100 font-medium">
                {files.length} file(s) selected
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {files.map((f) => f.name).join(', ')}
              </p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-100">Drop files here or click to browse</p>
              <p className="text-xs text-neutral-400 mt-1">MP3, WAV, OGG</p>
            </>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm text-neutral-400 mb-2">
            Friendly Name (for AI Director)
            <span className="text-xs text-neutral-500 ml-2">Optional</span>
          </label>
          <input
            type="text"
            placeholder="e.g., intro, outro, thinking, jazz-background"
            value={friendlyName}
            onChange={(e) => setFriendlyName(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 text-sm focus:outline-none focus:border-primary-500"
          />
          <p className="text-xs text-neutral-500 mt-1">
            A unique identifier for API control (alphanumeric and dashes only)
          </p>
        </div>

        {category === 'jingle' && (
          <div className="mb-4">
            <label className="block text-sm text-neutral-400 mb-2">Sound Drop Type</label>
            <select
              value={jingleType}
              onChange={(e) => setJingleType(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="intro">Intro</option>
              <option value="outro">Outro</option>
              <option value="stinger">Stinger</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        )}

        {uploading && (
          <div className="mb-4">
            <div className="h-1 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || uploading}
            className="flex-1 px-4 py-2 bg-primary-600 rounded hover:bg-primary-700 text-neutral-100 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 bg-neutral-700 rounded hover:bg-neutral-600 text-neutral-100 text-sm font-medium transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
