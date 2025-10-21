import { Play, Trash2, Edit2 } from 'lucide-react';

interface QuickPreviewProps {
  nextItem: {
    type: 'video' | 'image';
    id: string;
    title?: string;
    caption?: string;
    thumbnail: string;
  } | null;
  onPlayNow: () => void;
  onSkip: () => void;
  onEdit: () => void;
}

export function QuickPreview({ nextItem, onPlayNow, onSkip, onEdit }: QuickPreviewProps) {
  if (!nextItem) {
    return (
      <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
        <h2 className="text-lg font-bold text-white mb-4">Quick Preview</h2>
        <div className="text-center py-8 text-neutral-500">
          <p className="text-sm">No items in queue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
      <h2 className="text-lg font-bold text-white mb-4">Next Up</h2>
      
      <div className="space-y-3">
        {/* Thumbnail Preview */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <img
            src={nextItem.thumbnail}
            alt={nextItem.title || nextItem.caption || 'Preview'}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title/Caption */}
        <div>
          <p className="text-sm font-medium text-white line-clamp-2">
            {nextItem.title || nextItem.caption || 'Untitled'}
          </p>
          <span className="text-xs text-neutral-500 uppercase">
            {nextItem.type}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onPlayNow}
            className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Play Now
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onSkip}
            className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
            title="Skip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
