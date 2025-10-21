import { formatDuration } from '@/lib/media/youtube';
import { Plus } from 'lucide-react';

interface VideoCardProps {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  viewCount?: string;
  onAdd: () => void;
}

export function VideoCard({
  title,
  channel,
  thumbnail,
  duration,
  viewCount,
  onAdd
}: VideoCardProps) {
  const formatViews = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  return (
    <div className="bg-white border border-neutral-300 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250 group">
      <div className="relative aspect-video">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {formatDuration(duration)}
        </div>
        <button
          onClick={onAdd}
          className="absolute top-2 right-2 w-9 h-9 bg-primary-600 hover:bg-primary-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          title="Add to queue"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-neutral-900 line-clamp-2 leading-tight mb-1">
          {title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <span>{channel}</span>
          {viewCount && (
            <>
              <span>•</span>
              <span>{formatViews(viewCount)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
