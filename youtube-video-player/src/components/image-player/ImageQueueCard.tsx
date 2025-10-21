import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, Eye } from 'lucide-react';
import { ImageQueueItem } from '@/types/video';

interface ImageQueueCardProps {
  image: ImageQueueItem;
  onRemove: () => void;
  onShow: () => void;
  onUpdateCaption: (caption: string) => void;
}

export function ImageQueueCard({ image, onRemove, onShow, onUpdateCaption }: ImageQueueCardProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState(image.caption || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleSaveCaption = () => {
    onUpdateCaption(caption);
    setIsEditingCaption(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white rounded-md border border-neutral-300 shadow-sm hover:shadow-md transition-all"
    >
      {/* Position Badge */}
      <div className="absolute top-2 left-2 w-6 h-6 bg-accent-500 text-neutral-900 rounded-full flex items-center justify-center text-xs font-bold z-10">
        {image.position + 1}
      </div>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 w-8 h-8 bg-neutral-800/70 hover:bg-neutral-800 rounded cursor-grab active:cursor-grabbing flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Thumbnail */}
      <img
        src={image.file_path}
        alt={image.filename}
        className="w-full h-40 object-cover rounded-t-md"
      />

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium text-neutral-900 truncate" title={image.filename}>
          {image.filename}
        </h3>

        {/* Caption */}
        {isEditingCaption ? (
          <div className="space-y-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add caption..."
              className="w-full px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveCaption}
                className="flex-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-500"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setCaption(image.caption || '');
                  setIsEditingCaption(false);
                }}
                className="flex-1 px-2 py-1 text-xs bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-600 line-clamp-2 min-h-[2rem]">
            {image.caption || 'No caption'}
          </p>
        )}

        {/* Metadata */}
        <p className="text-xs text-neutral-500">
          {(image.file_size / 1024 / 1024).toFixed(2)} MB
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onShow}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            Show Now
          </button>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditingCaption(true)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md text-xs transition-colors"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={onRemove}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-error-500 hover:bg-error-600 text-white rounded-md text-xs transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
