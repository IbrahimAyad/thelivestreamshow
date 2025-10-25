import { useState } from 'react'
import { X, Maximize2 } from 'lucide-react'

interface ScenePreviewProps {
  template: any
  isFullscreen?: boolean
  onClose?: () => void
}

export function ScenePreview({ template, isFullscreen = false, onClose }: ScenePreviewProps) {
  if (!template) return null

  const config = template.config as any
  const sources = config?.sources || []
  const sortedSources = [...sources].sort((a, b) => (a.z_index || 0) - (b.z_index || 0))

  const containerClass = isFullscreen 
    ? 'fixed inset-0 bg-black z-50'
    : 'relative w-full bg-black rounded border-2 border-[#3a3a3a]'

  const aspectRatio = isFullscreen ? '' : 'aspect-video'

  return (
    <div className={containerClass}>
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 p-3 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className={`relative w-full h-full ${aspectRatio}`}>
        {sortedSources.map((source, index) => {
          const { position, type, url, z_index } = source
          
          // Skip if position is undefined or missing required properties
          if (!position || position.x === undefined || position.y === undefined) {
            console.warn('Source missing position data:', source)
            return null
          }
          
          const style = {
            position: 'absolute' as const,
            left: `${position.x}%`,
            top: `${position.y}%`,
            width: `${position.width || 100}%`,
            height: `${position.height || 100}%`,
            zIndex: z_index || index
          }

          if (type === 'image' && url) {
            return (
              <img
                key={`preview-source-${index}`}
                src={url}
                alt={`Layer ${index}`}
                style={style}
                className="object-cover"
              />
            )
          }

          if (type === 'webcam') {
            return (
              <div
                key={`preview-source-${index}`}
                style={style}
                className="bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-600 rounded"
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📷</div>
                  <div className="text-xs">Webcam</div>
                </div>
              </div>
            )
          }

          return null
        })}

        {/* Preview Watermark */}
        {!isFullscreen && (
          <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded text-xs font-bold text-yellow-400 border border-yellow-400/50">
            PREVIEW
          </div>
        )}
      </div>
    </div>
  )
}

// Full Preview Modal
interface ScenePreviewModalProps {
  template: any
  isOpen: boolean
  onClose: () => void
}

export function ScenePreviewModal({ template, isOpen, onClose }: ScenePreviewModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full h-full p-8" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full h-full">
          <ScenePreview template={template} isFullscreen={true} onClose={onClose} />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-6 py-3">
            <div className="text-center">
              <div className="font-bold text-lg">{template.name}</div>
              {template.description && (
                <div className="text-sm text-gray-400 mt-1">{template.description}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
