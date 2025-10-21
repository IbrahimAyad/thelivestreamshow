import { Monitor as MonitorIcon } from 'lucide-react';
import { useStreamStats } from '@/hooks/media/useStreamStats';
import { useBroadcastState } from '@/hooks/media/useBroadcastState';
import { useQueue } from '@/hooks/media/useQueue';
import { useImageQueue } from '@/hooks/media/useImageQueue';
import { usePlaybackState } from '@/hooks/media/usePlaybackState';
import { useImageDisplayState } from '@/hooks/media/useImageDisplayState';
import { PiPBroadcastMonitor } from './PiPBroadcastMonitor';
import { DualPlatformStats } from './DualPlatformStats';
import { QuickPreview } from './QuickPreview';
import { StreamHistoryChart } from './StreamHistoryChart';
import { EmergencyControls } from './EmergencyControls';

export function MonitorTab() {
  const {
    twitchStats,
    youtubeStats,
    loading,
    lastUpdated,
    history,
    refreshStats,
    fetchHistory
  } = useStreamStats();

  const { state: broadcastState, hideAll, restore } = useBroadcastState();
  const { queue, removeFromQueue } = useQueue();
  const { images, removeFromQueue: removeImageFromQueue } = useImageQueue();
  const { updateState: updatePlaybackState } = usePlaybackState();
  const { showImage } = useImageDisplayState();

  // Determine next item to preview
  const getNextItem = () => {
    if (queue.length > 0) {
      const video = queue[0];
      return {
        type: 'video' as const,
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail_url
      };
    }
    if (images.length > 0) {
      const image = images[0];
      return {
        type: 'image' as const,
        id: image.id,
        caption: image.caption,
        thumbnail: `https://vcniezwtltraqramjlux.supabase.co/storage/v1/object/public/stream-images/${image.file_path}`
      };
    }
    return null;
  };

  const handlePlayNow = () => {
    const next = getNextItem();
    if (!next) return;

    if (next.type === 'video') {
      const video = queue[0];
      updatePlaybackState({
        currentVideoId: video.video_id,
        isPlaying: true
      });
    } else {
      const image = images[0];
      showImage(image.id, image.file_path, image.caption);
    }
  };

  const handleSkip = async () => {
    const next = getNextItem();
    if (!next) return;

    if (next.type === 'video') {
      const video = queue[0];
      await removeFromQueue(video.id);
    } else {
      const image = images[0];
      await removeImageFromQueue(image.id);
    }
  };

  const handleEdit = () => {
    const next = getNextItem();
    if (!next) return;

    // For now, navigate to the appropriate tab to edit
    // Video editing happens in the Queue tab, Image editing in Images tab
    // Future enhancement: Could open a modal here
    alert(`To edit this ${next.type}, please switch to the ${next.type === 'video' ? 'Video Queue' : 'Images'} tab`);
  };

  const broadcastUrl = `${window.location.origin}/broadcast/video-player`;

  return (
    <div className="min-h-screen bg-black p-5 relative">
      {/* PiP Monitor - Floating */}
      <PiPBroadcastMonitor broadcastUrl={broadcastUrl} />

      {/* Main Grid Layout */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Dual-Platform Stats - Spans 2 columns on desktop */}
        <div className="lg:col-span-2">
          <DualPlatformStats
            twitchStats={twitchStats}
            youtubeStats={youtubeStats}
            lastUpdated={lastUpdated}
            onRefresh={refreshStats}
            loading={loading}
          />
        </div>

        {/* Quick Preview - 1 column */}
        <div className="lg:col-span-1">
          <QuickPreview
            nextItem={getNextItem()}
            onPlayNow={handlePlayNow}
            onSkip={handleSkip}
            onEdit={handleEdit}
          />
        </div>

        {/* Placeholder for alignment - 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700 h-full">
            <h2 className="text-lg font-bold text-white mb-2">Quick Stats</h2>
            <div className="space-y-2 text-sm text-neutral-400">
              <div className="flex justify-between">
                <span>Videos Queued:</span>
                <span className="text-white font-mono">{queue.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Images Queued:</span>
                <span className="text-white font-mono">{images.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Viewers:</span>
                <span className="text-white font-mono">
                  {(twitchStats?.viewerCount || 0) + (youtubeStats?.viewerCount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stream History Chart - Full width */}
        <div className="lg:col-span-4">
          <StreamHistoryChart
            history={history}
            onTimeRangeChange={fetchHistory}
          />
        </div>

        {/* Emergency Controls - Full width */}
        <div className="lg:col-span-4">
          <EmergencyControls
            onHideAll={hideAll}
            onRestore={() => restore('video')}
            hideAllActive={broadcastState?.hide_all || false}
          />
        </div>
      </div>
    </div>
  );
}
