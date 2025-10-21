import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { formatDuration } from '@/lib/media/youtube';
import { QueueVideo } from '@/types/video';

interface QueueItemProps {
  video: QueueVideo;
  onRemove: () => void;
  onUpdateTimes: (startTime: number, endTime: number | null) => void;
}

export function QueueItem({ video, onRemove, onUpdateTimes }: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onUpdateTimes(value, video.end_time);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || video.duration;
    onUpdateTimes(video.start_time, value);
  };

  const clipDuration = (video.end_time || video.duration) - video.start_time;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border-l-4 border-l-primary-500 rounded-md p-3 mb-2 flex items-center gap-3 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <img
        src={video.thumbnail_url}
        alt={video.title}
        className="w-20 h-11 object-cover rounded"
      />

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-neutral-900 truncate">
          {video.title}
        </h4>
        <p className="text-xs text-neutral-600 truncate">{video.channel}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs">
          <input
            type="number"
            value={video.start_time}
            onChange={handleStartTimeChange}
            className="w-14 px-2 py-1 border border-neutral-300 rounded text-center"
            min={0}
            max={video.duration}
          />
          <span className="text-neutral-600">→</span>
          <input
            type="number"
            value={video.end_time || video.duration}
            onChange={handleEndTimeChange}
            className="w-14 px-2 py-1 border border-neutral-300 rounded text-center"
            min={video.start_time}
            max={video.duration}
          />
        </div>
        <span className="text-xs text-neutral-600 whitespace-nowrap">
          ({formatDuration(clipDuration)})
        </span>
      </div>

      <button
        onClick={onRemove}
        className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:text-error-500 hover:bg-neutral-100 rounded-md transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
