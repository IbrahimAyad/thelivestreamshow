import { Upload } from 'lucide-react'
import { useCallback, useState } from 'react'

interface UploadZoneProps {
  onUpload: (files: File[]) => void
  uploading: boolean
  uploadProgress: number
  accept?: string
  multiple?: boolean
}

export function UploadZone({
  onUpload,
  uploading,
  uploadProgress,
  accept = 'audio/*',
  multiple = true,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onUpload(files)
      }
    },
    [onUpload]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onUpload(files)
      }
    },
    [onUpload]
  )

  return (
    <div
      className={`relative min-h-[240px] border-2 border-dashed rounded-lg bg-neutral-900 flex flex-col items-center justify-center p-6 transition-all duration-250 ${
        isDragOver
          ? 'border-primary-500 bg-primary-600/10 scale-[1.02]'
          : 'border-neutral-700 hover:border-primary-500'
      } ${uploading ? 'pointer-events-none' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploading && document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />

      <Upload
        className={`w-12 h-12 mb-4 transition-colors duration-150 ${
          isDragOver ? 'text-primary-400' : 'text-neutral-400'
        }`}
      />

      <p className="text-base font-medium text-neutral-100 mb-1">
        {isDragOver ? 'Drop files here' : 'Upload Audio Files'}
      </p>
      <p className="text-sm text-neutral-400">
        Drag and drop or click to browse
      </p>
      <p className="text-xs text-neutral-400 mt-2">
        Supported formats: MP3, WAV, OGG
      </p>

      {uploading && (
        <div className="absolute top-0 left-0 right-0">
          <div className="h-1 bg-primary-500" style={{ width: `${uploadProgress}%` }} />
          <div className="mt-4 text-sm text-neutral-100">
            Uploading... {uploadProgress}%
          </div>
        </div>
      )}
    </div>
  )
}
