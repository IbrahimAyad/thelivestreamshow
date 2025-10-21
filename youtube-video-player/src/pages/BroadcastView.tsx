import { useEffect, useRef, useState } from 'react';
import YouTubeComponent from 'react-youtube';
import { useQueue } from '@/hooks/useQueue';
import { usePlaybackState } from '@/hooks/usePlaybackState';
import { trackPlayHistory } from '@/lib/recommendations';
import { categorizeVideo } from '@/lib/recommendations';
import { getVideoDetails } from '@/lib/youtube';

// Type workaround for react-youtube
const YouTube = YouTubeComponent as any;

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
}

interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
}

export function BroadcastView() {
  const { queue, removeFromQueue } = useQueue();
  const { state: playbackState, updateState } = usePlaybackState();
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentChannel, setCurrentChannel] = useState('');
  const playerRef = useRef<any>(null);
  const watchStartTime = useRef(0);

  const currentVideo = queue.find(v => v.video_id === playbackState.currentVideoId) || queue[0];

  useEffect(() => {
    if (!playbackState.currentVideoId && queue.length > 0) {
      updateState({ currentVideoId: queue[0].video_id });
    }
  }, [queue, playbackState.currentVideoId]);

  useEffect(() => {
    if (currentVideo) {
      setCurrentTitle(currentVideo.title);
      setCurrentChannel(currentVideo.channel);
      watchStartTime.current = Date.now();
    }
  }, [currentVideo]);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    if (currentVideo) {
      event.target.seekTo(currentVideo.start_time, true);
      if (playbackState.isPlaying) {
        event.target.playVideo();
      }
    }
    event.target.setVolume(playbackState.volume);
  };

  const onStateChange = (event: YouTubeEvent) => {
    if (event.data === 1) {
      updateState({ isPlaying: true });
    } else if (event.data === 2) {
      updateState({ isPlaying: false });
    } else if (event.data === 0) {
      handleVideoEnd();
    }
  };

  const handleVideoEnd = async () => {
    if (currentVideo) {
      const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
      const totalDuration = (currentVideo.end_time || currentVideo.duration) - currentVideo.start_time;
      
      const videoDetails = await getVideoDetails(currentVideo.video_id);
      const category = videoDetails ? categorizeVideo(videoDetails) : 'Trending';
      
      await trackPlayHistory(
        currentVideo.video_id,
        currentVideo.title,
        currentVideo.channel,
        watchDuration,
        totalDuration,
        category
      );
      
      await removeFromQueue(currentVideo.id);
      
      if (playbackState.autoAdvance && queue.length > 1) {
        const currentIndex = queue.findIndex(v => v.id === currentVideo.id);
        const nextVideo = queue[currentIndex + 1];
        if (nextVideo) {
          updateState({ currentVideoId: nextVideo.video_id });
        }
      } else {
        updateState({ isPlaying: false, currentVideoId: null });
      }
    }
  };

  useEffect(() => {
    if (playerRef.current) {
      if (playbackState.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [playbackState.isPlaying]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(playbackState.volume);
    }
  }, [playbackState.volume]);

  useEffect(() => {
    if (playerRef.current && currentVideo) {
      const checkTime = setInterval(() => {
        if (playerRef.current && currentVideo.end_time) {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime >= currentVideo.end_time) {
            handleVideoEnd();
          }
        }
      }, 500);

      return () => clearInterval(checkTime);
    }
  }, [currentVideo]);

  const opts = {
    height: '1080',
    width: '1920',
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      playsinline: 1,
      start: currentVideo?.start_time || 0,
      end: currentVideo?.end_time || undefined
    },
  };

  if (!currentVideo) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">No video in queue</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <YouTube
          videoId={currentVideo.video_id}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="w-full h-full"
          // @ts-ignore - react-youtube type definitions issue
        />
      </div>

      {playbackState.isPlaying && (
        <div className="absolute bottom-20 left-20 right-20 bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  NOW PLAYING
                </span>
                <span className="text-sm text-white/80">{currentChannel}</span>
              </div>
              <h2 className="text-lg font-semibold truncate">{currentTitle}</h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
