import { Plus } from 'lucide-react';
import { EnergyLevel } from '@/types/video';

interface RecommendationCardProps {
  title: string;
  channel: string;
  thumbnail: string;
  category: string;
  energyLevel: EnergyLevel;
  score: number;
  onAdd: () => void;
}

const ENERGY_COLORS = {
  Hype: 'bg-error-500 text-white',
  Chill: 'bg-info-500 text-white',
  Funny: 'bg-accent-500 text-neutral-900'
};

export function RecommendationCard({
  title,
  channel,
  thumbnail,
  category,
  energyLevel,
  score,
  onAdd
}: RecommendationCardProps) {
  return (
    <div className="bg-white border border-neutral-300 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250 group">
      <div className="relative aspect-video">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-xs px-2 py-1 bg-black/80 text-white rounded">
            {category}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${ENERGY_COLORS[energyLevel]}`}>
            {energyLevel}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="absolute top-2 right-2 w-9 h-9 bg-primary-600 hover:bg-primary-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          title="Add to queue"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-tight mb-1">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600">{channel}</span>
          <span className="text-xs text-primary-600 font-medium">
            Score: {score.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
