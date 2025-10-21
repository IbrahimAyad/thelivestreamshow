import { useState, useEffect } from 'react';
import { Search, Play, Pause, SkipForward, Volume2, Trash2, Sparkles, Calendar, BarChart3 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { searchYouTubeVideos, YouTubeVideo } from '@/lib/youtube';
import { useQueue } from '@/hooks/useQueue';
import { usePlaybackState } from '@/hooks/usePlaybackState';
import { VideoCard } from '@/components/video-player/VideoCard';
import { QueueItem } from '@/components/video-player/QueueItem';
import { RecommendationCard } from '@/components/video-player/RecommendationCard';
import { supabase } from '@/lib/supabase';
import { VideoRecommendation, VideoCategory } from '@/types/video';
import { generateRecommendations, categorizeVideo } from '@/lib/recommendations';

const CATEGORIES: VideoCategory[] = ['Funny', 'Fails', 'Gaming', 'Tech', 'Wholesome', 'Trending'];

export function VideoPlayerControl() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [searching, setSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'All'>('All');
  const { queue, addToQueue, removeFromQueue, updateQueue, clearQueue } = useQueue();
  const { state: playbackState, updateState: updatePlaybackState } = usePlaybackState();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    const { data } = await supabase
      .from('video_recommendations')
      .select('*')
      .order('recommendation_score', { ascending: false });

    if (data) {
      setRecommendations(data);
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

  const filteredRecommendations = selectedCategory === 'All' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

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
                    <VideoCard
                      key={video.id}
                      videoId={video.id}
                      title={video.title}
                      channel={video.channel}
                      thumbnail={video.thumbnail}
                      duration={video.duration}
                      viewCount={video.viewCount}
                      onAdd={() => handleAddToQueue(video)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Video Queue ({queue.length})</h2>
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

            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Playback Controls</h2>
              <div className="flex items-center gap-4">
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
                <label className="flex items-center gap-2 ml-auto">
                  <input
                    type="checkbox"
                    checked={playbackState.autoAdvance}
                    onChange={(e) => updatePlaybackState({ autoAdvance: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-neutral-800">Auto-advance</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
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
    </div>
  );
}
