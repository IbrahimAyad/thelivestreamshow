import { useState, useEffect } from 'react';
import { Search, Play, Pause, SkipForward, Volume2, Trash2, Sparkles, Calendar, BarChart3, Clock, Image as ImageIcon, Monitor as MonitorIcon } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { searchYouTubeVideos, YouTubeVideo } from '@/lib/youtube';
import { useQueue } from '@/hooks/useQueue';
import { usePlaybackState } from '@/hooks/usePlaybackState';
import { useImageQueue } from '@/hooks/useImageQueue';
import { useImageDisplayState } from '@/hooks/useImageDisplayState';
import { VideoCard } from '@/components/video-player/VideoCard';
import { QueueItem } from '@/components/video-player/QueueItem';
import { RecommendationCard } from '@/components/video-player/RecommendationCard';
import { AnalyticsPanel } from '@/components/video-player/AnalyticsPanel';
import { SchedulingModal } from '@/components/video-player/SchedulingModal';
import { ImageUploadZone } from '@/components/image-player/ImageUploadZone';
import { ImageQueueCard } from '@/components/image-player/ImageQueueCard';
import { ImageDisplayControls } from '@/components/image-player/ImageDisplayControls';
import { ImageHistory } from '@/components/image-player/ImageHistory';
import { supabase } from '@/lib/supabase';
import { VideoRecommendation, VideoCategory } from '@/types/video';
import { generateRecommendations } from '@/lib/recommendations';

import { MonitorTab } from '@/components/monitor/MonitorTab';

const CATEGORIES: VideoCategory[] = ['Funny', 'Fails', 'Gaming', 'Tech', 'Wholesome', 'Trending'];

type Tab = 'queue' | 'analytics' | 'scheduled' | 'images' | 'monitor';

export function VideoPlayerControl() {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [searching, setSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'All'>('All');
  const [schedulingVideo, setSchedulingVideo] = useState<YouTubeVideo | null>(null);
  const [scheduledVideos, setScheduledVideos] = useState<any[]>([]);
  const [deadAirFiller, setDeadAirFiller] = useState(false);
  const { queue, addToQueue, removeFromQueue, updateQueue, clearQueue } = useQueue();
  const { state: playbackState, updateState: updatePlaybackState } = usePlaybackState();
  const { images, addToQueue: addImageToQueue, removeFromQueue: removeImageFromQueue, updateQueue: updateImageQueue, updateCaption, clearQueue: clearImageQueue } = useImageQueue();
  const { state: imageDisplayState, updateState: updateImageDisplayState, showImage, hideImage, hideAll } = useImageDisplayState();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchRecommendations();
    fetchScheduledVideos();
    
    const deadAirSetting = localStorage.getItem('deadAirFiller') === 'true';
    setDeadAirFiller(deadAirSetting);
  }, []);

  useEffect(() => {
    if (deadAirFiller && queue.length === 0 && !playbackState.isPlaying && recommendations.length > 0) {
      const random = recommendations[Math.floor(Math.random() * recommendations.length)];
      const video: YouTubeVideo = {
        id: random.video_id,
        title: random.title,
        channel: random.channel,
        channelId: '',
        thumbnail: random.thumbnail_url,
        duration: 0
      };
      handleAddToQueue(video);
    }
  }, [queue.length, deadAirFiller, playbackState.isPlaying]);

  const fetchRecommendations = async () => {
    const { data } = await supabase
      .from('video_recommendations')
      .select('*')
      .order('recommendation_score', { ascending: false });

    if (data) {
      setRecommendations(data);
    }
  };

  const fetchScheduledVideos = async () => {
    const { data } = await supabase
      .from('scheduled_videos')
      .select('*')
      .eq('played', false)
      .order('scheduled_time', { ascending: true });

    if (data) {
      setScheduledVideos(data);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchYouTubeVideos(searchQuery, 12);
      setSearchResults(results);
      
      await generateRecommendations(results, 12);
      await fetchRecommendations();
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToQueue = async (video: YouTubeVideo) => {
    try {
      await addToQueue({
        video_id: video.id,
        title: video.title,
        channel: video.channel,
        thumbnail_url: video.thumbnail,
        duration: video.duration,
        start_time: 0,
        end_time: video.duration
      });
    } catch (error) {
      console.error('Failed to add to queue:', error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex(v => v.id === active.id);
      const newIndex = queue.findIndex(v => v.id === over.id);

      const newQueue = arrayMove(queue, oldIndex, newIndex);
      updateQueue(newQueue);
    }
  };

  const handlePlayPause = () => {
    updatePlaybackState({ isPlaying: !playbackState.isPlaying });
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const currentIndex = queue.findIndex(v => v.video_id === playbackState.currentVideoId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < queue.length) {
        updatePlaybackState({ currentVideoId: queue[nextIndex].video_id });
      }
    }
  };

  const handleSurpriseMe = async () => {
    const filtered = recommendations.filter(r => 
      selectedCategory === 'All' || r.category === selectedCategory
    );
    
    if (filtered.length > 0) {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      
      const video: YouTubeVideo = {
        id: random.video_id,
        title: random.title,
        channel: random.channel,
        channelId: '',
        thumbnail: random.thumbnail_url,
        duration: 0
      };
      
      await handleAddToQueue(video);
    }
  };

  const toggleDeadAirFiller = () => {
    const newValue = !deadAirFiller;
    setDeadAirFiller(newValue);
    localStorage.setItem('deadAirFiller', String(newValue));
  };

  const deleteScheduledVideo = async (id: string) => {
    await supabase.from('scheduled_videos').delete().eq('id', id);
    fetchScheduledVideos();
  };

  const filteredRecommendations = selectedCategory === 'All' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

  // If Monitor tab is active, render it fullscreen
  if (activeTab === 'monitor') {
    return <MonitorTab />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">YouTube Video Player</h1>
          <p className="text-neutral-600">Search, queue, and manage videos for your livestream</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search YouTube videos..."
                    className="w-full h-12 pl-12 pr-4 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 h-12 bg-primary-600 hover:bg-primary-500 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {searchResults.map(video => (
                    <div key={video.id} className="relative">
                      <VideoCard
                        videoId={video.id}
                        title={video.title}
                        channel={video.channel}
                        thumbnail={video.thumbnail}
                        duration={video.duration}
                        viewCount={video.viewCount}
                        onAdd={() => handleAddToQueue(video)}
                      />
                      <button
                        onClick={() => setSchedulingVideo(video)}
                        className="absolute top-2 left-2 w-9 h-9 bg-accent-500 hover:bg-accent-400 text-neutral-900 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Schedule video"
                      >
                        <Calendar className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex border-b border-neutral-300 mb-4">
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'queue'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-neutral-600 border-transparent hover:text-neutral-900'
                  }`}
                >
                  Video Queue ({queue.length})
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'analytics'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-neutral-600 border-transparent hover:text-neutral-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('scheduled')}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'scheduled'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-neutral-600 border-transparent hover:text-neutral-900'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Scheduled ({scheduledVideos.length})
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'images'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-neutral-600 border-transparent hover:text-neutral-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Images ({images.length})
                </button>
                <button
                  onClick={() => setActiveTab('monitor' as Tab)}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === ('monitor' as Tab)
                      ? 'text-primary-600 border-primary-600'
                      : 'text-neutral-600 border-transparent hover:text-neutral-900'
                  }`}
                >
                  <MonitorIcon className="w-4 h-4 inline mr-1" />
                  Monitor
                </button>
              </div>

              {activeTab === 'queue' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={clearQueue}
                      className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md border border-neutral-300 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={queue.map(v => v.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {queue.map(video => (
                          <QueueItem
                            key={video.id}
                            video={video}
                            onRemove={() => removeFromQueue(video.id)}
                            onUpdateTimes={async (start, end) => {
                              await supabase
                                .from('video_queue')
                                .update({ start_time: start, end_time: end })
                                .eq('id', video.id);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {queue.length === 0 && (
                    <p className="text-center text-neutral-600 py-8">No videos in queue. Search and add videos to get started!</p>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && <AnalyticsPanel />}

              {activeTab === 'scheduled' && (
                <div className="space-y-3">
                  {scheduledVideos.map(video => (
                    <div key={video.id} className="flex items-center gap-3 p-3 border border-neutral-300 rounded-md">
                      <img src={video.thumbnail_url} alt={video.title} className="w-20 h-11 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-neutral-900 truncate">{video.title}</h4>
                        <p className="text-xs text-neutral-600">{new Date(video.scheduled_time).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => deleteScheduledVideo(video.id)}
                        className="px-3 py-1 text-sm bg-error-500 hover:bg-error-500/90 text-white rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {scheduledVideos.length === 0 && (
                    <p className="text-center text-neutral-600 py-8">No scheduled videos</p>
                  )}
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-6">
                  <ImageUploadZone onUpload={addImageToQueue} />

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900">Image Queue ({images.length})</h3>
                    <button
                      onClick={clearImageQueue}
                      className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md border border-neutral-300 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = images.findIndex(img => img.id === active.id);
                        const newIndex = images.findIndex(img => img.id === over.id);
                        const newImages = arrayMove(images, oldIndex, newIndex);
                        updateImageQueue(newImages);
                      }
                    }}
                  >
                    <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {images.map(image => (
                          <ImageQueueCard
                            key={image.id}
                            image={image}
                            onRemove={() => removeImageFromQueue(image.id)}
                            onShow={() => showImage(image.id, image.file_path, image.caption)}
                            onUpdateCaption={(caption) => updateCaption(image.id, caption)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {images.length === 0 && (
                    <p className="text-center text-neutral-600 py-8">No images in queue. Upload images to get started!</p>
                  )}

                  <ImageHistory />
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Playback Controls</h2>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 bg-primary-600 hover:bg-primary-500 text-white rounded-md flex items-center justify-center transition-colors"
                >
                  {playbackState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <button
                  onClick={handleNext}
                  className="w-12 h-12 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md border border-neutral-300 flex items-center justify-center transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 ml-4">
                  <Volume2 className="w-5 h-5 text-neutral-600" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={playbackState.volume}
                    onChange={(e) => updatePlaybackState({ volume: parseInt(e.target.value) })}
                    className="w-32"
                  />
                  <span className="text-sm text-neutral-600 w-12">{playbackState.volume}%</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={playbackState.autoAdvance}
                    onChange={(e) => updatePlaybackState({ autoAdvance: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-neutral-800">Auto-advance</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deadAirFiller}
                    onChange={toggleDeadAirFiller}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-neutral-800">Dead Air Filler</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Image Display Controls - Only show when Images tab is active */}
            {activeTab === 'images' && (
              <ImageDisplayControls
                currentImage={images.find(img => img.id === imageDisplayState.currentImageId) || null}
                isDisplayed={imageDisplayState.isDisplayed}
                transition={imageDisplayState.transition}
                autoAdvance={imageDisplayState.autoAdvance}
                autoAdvanceInterval={imageDisplayState.autoAdvanceInterval}
                onPrevious={() => {
                  const currentIndex = images.findIndex(img => img.id === imageDisplayState.currentImageId);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                  if (images[prevIndex]) {
                    showImage(images[prevIndex].id, images[prevIndex].file_path, images[prevIndex].caption);
                  }
                }}
                onNext={() => {
                  const currentIndex = images.findIndex(img => img.id === imageDisplayState.currentImageId);
                  const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                  if (images[nextIndex]) {
                    showImage(images[nextIndex].id, images[nextIndex].file_path, images[nextIndex].caption);
                  }
                }}
                onHide={hideImage}
                onHideAll={hideAll}
                onTransitionChange={(transition) => updateImageDisplayState({ transition })}
                onAutoAdvanceChange={(autoAdvance) => updateImageDisplayState({ autoAdvance })}
                onIntervalChange={(autoAdvanceInterval) => updateImageDisplayState({ autoAdvanceInterval })}
              />
            )}

            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Recommendations</h2>
                <button
                  onClick={handleSurpriseMe}
                  className="px-3 py-1.5 text-sm bg-accent-500 hover:bg-accent-400 text-neutral-900 rounded-md font-medium transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Surprise Me
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredRecommendations.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    title={rec.title}
                    channel={rec.channel}
                    thumbnail={rec.thumbnail_url}
                    category={rec.category}
                    energyLevel={rec.energy_level}
                    score={rec.recommendation_score}
                    onAdd={async () => {
                      const video: YouTubeVideo = {
                        id: rec.video_id,
                        title: rec.title,
                        channel: rec.channel,
                        channelId: '',
                        thumbnail: rec.thumbnail_url,
                        duration: 0
                      };
                      await handleAddToQueue(video);
                    }}
                  />
                ))}
              </div>

              {filteredRecommendations.length === 0 && (
                <p className="text-center text-neutral-600 py-8 text-sm">Search for videos to get personalized recommendations!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {schedulingVideo && (
        <SchedulingModal
          isOpen={!!schedulingVideo}
          onClose={() => {
            setSchedulingVideo(null);
            fetchScheduledVideos();
          }}
          videoId={schedulingVideo.id}
          title={schedulingVideo.title}
          channel={schedulingVideo.channel}
          thumbnailUrl={schedulingVideo.thumbnail}
          duration={schedulingVideo.duration}
        />
      )}
    </div>
  );
}
