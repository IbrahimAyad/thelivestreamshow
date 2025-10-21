import { Users, MessageCircle, UserPlus, Radio, TrendingUp, TrendingDown } from 'lucide-react';
import { StreamStats } from '@/hooks/useStreamStats';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  platform: 'twitch' | 'youtube';
  trend?: 'up' | 'down';
}

function StatCard({ label, value, icon, platform, trend }: StatCardProps) {
  const platformColor = platform === 'twitch' ? 'border-t-[#9146FF]' : 'border-t-[#FF0000]';
  const platformBg = platform === 'twitch' ? 'bg-[#9146FF]' : 'bg-[#FF0000]';

  return (
    <div className={`bg-neutral-800 rounded-lg p-3 border-t-2 ${platformColor} border border-neutral-700`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 ${platformBg} rounded flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-neutral-400 uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono font-semibold text-white">{value}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-green-500' : 'text-yellow-500'}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
        )}
      </div>
    </div>
  );
}

interface DualPlatformStatsProps {
  twitchStats: StreamStats | null;
  youtubeStats: StreamStats | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export function DualPlatformStats({
  twitchStats,
  youtubeStats,
  lastUpdated,
  onRefresh,
  loading
}: DualPlatformStatsProps) {
  const formatTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Platform Statistics</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs font-mono text-neutral-500">
              Updated {formatTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Twitch Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#9146FF] rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-base font-semibold text-[#9146FF]">Twitch</span>
            {twitchStats?.streamStatus === 'live' && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-500 font-medium">LIVE</span>
              </div>
            )}
          </div>
          <StatCard
            label="Viewers"
            value={twitchStats?.viewerCount ?? 0}
            icon={<Users className="w-4 h-4 text-white" />}
            platform="twitch"
          />
          <StatCard
            label="Chat Rate"
            value={`${twitchStats?.chatRate ?? 0}/min`}
            icon={<MessageCircle className="w-4 h-4 text-white" />}
            platform="twitch"
          />
          <StatCard
            label="Followers"
            value={twitchStats?.followerCount ?? 0}
            icon={<UserPlus className="w-4 h-4 text-white" />}
            platform="twitch"
          />
          {twitchStats?.error && (
            <div className="text-xs text-red-400 p-2 bg-red-900/20 rounded border border-red-800">
              {twitchStats.error}
            </div>
          )}
        </div>

        {/* YouTube Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#FF0000] rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <span className="text-base font-semibold text-[#FF0000]">YouTube</span>
            {youtubeStats?.streamStatus === 'live' && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-500 font-medium">LIVE</span>
              </div>
            )}
          </div>
          <StatCard
            label="Viewers"
            value={youtubeStats?.viewerCount ?? 0}
            icon={<Users className="w-4 h-4 text-white" />}
            platform="youtube"
          />
          <StatCard
            label="Chat Rate"
            value={`${youtubeStats?.chatRate ?? 0}/min`}
            icon={<MessageCircle className="w-4 h-4 text-white" />}
            platform="youtube"
          />
          <StatCard
            label="Subscribers"
            value={youtubeStats?.subscriberCount ?? 0}
            icon={<UserPlus className="w-4 h-4 text-white" />}
            platform="youtube"
          />
          {youtubeStats?.error && (
            <div className="text-xs text-red-400 p-2 bg-red-900/20 rounded border border-red-800">
              {youtubeStats.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
