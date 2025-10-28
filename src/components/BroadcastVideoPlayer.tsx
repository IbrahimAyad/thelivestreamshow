import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import YouTube, { YouTubeProps } from 'react-youtube';

interface QueuedVideo {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  thumbnail_url: string;
  start_time: number;
  end_time: number;
  queue_position: number;
}

interface PlaybackState {
  currentVideoId: string | null;
  isPlaying: boolean;
  volume: number;
  autoAdvance: boolean;
}

export function BroadcastVideoPlayer() {
  const [queue, setQueue] = useState<QueuedVideo[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentVideoId: null,
    isPlaying: false,
    volume: 80,
    autoAdvance: true
  });
  const [currentVideo, setCurrentVideo] = useState<QueuedVideo | null>(null);
  const playerRef = useRef<any>(null);

  // Load queue and playback state
  useEffect(() => {
    loadQueue();
    loadPlaybackState();

    // Subscribe to queue changes
    const queueChannel = supabase
      .channel('video_queue_broadcast')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_queue',
        },
        loadQueue
      )
      .subscribe();

    // Subscribe to playback state changes
    const playbackChannel = supabase
      .channel('video_playback_state_broadcast')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_playback_state',
        },
        loadPlaybackState
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(playbackChannel);
    };
  }, []);

  const loadQueue = async () => {
    const { data } = await supabase
      .from('video_queue')
      .select('*')
      .order('queue_position', { ascending: true });

    if (data) {
      setQueue(data as QueuedVideo[]);
    }
  };

  const loadPlaybackState = async () => {
    const { data } = await supabase
      .from('video_playback_state')
      .select('*')
      .single();

    if (data) {
      setPlaybackState({
        currentVideoId: data.current_video_id,
        isPlaying: data.is_playing,
        volume: data.volume,
        autoAdvance: data.auto_advance
      });
    }
  };

  // Update current video when playback state changes
  useEffect(() => {
    if (playbackState.currentVideoId) {
      const video = queue.find(v => v.video_id === playbackState.currentVideoId);
      setCurrentVideo(video || null);
    } else if (queue.length > 0 && playbackState.isPlaying) {
      // Auto-play first video in queue if none selected
      setCurrentVideo(queue[0]);
    } else {
      setCurrentVideo(null);
    }
  }, [playbackState.currentVideoId, queue, playbackState.isPlaying]);

  // YouTube player event handlers
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    event.target.setVolume(playbackState.volume);

    // Start at specified time if provided
    if (currentVideo && currentVideo.start_time > 0) {
      event.target.seekTo(currentVideo.start_time, true);
    }

    // Auto-play if playback state says so
    if (playbackState.isPlaying) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = async (event) => {
    // YouTube.PlayerState.ENDED = 0
    if (event.data === 0) {
      // Video ended
      if (playbackState.autoAdvance && queue.length > 0) {
        // Find next video in queue
        const currentIndex = queue.findIndex(v => v.id === currentVideo?.id);
        if (currentIndex >= 0 && currentIndex < queue.length - 1) {
          const nextVideo = queue[currentIndex + 1];

          // Update playback state to next video
          await supabase
            .from('video_playback_state')
            .update({
              current_video_id: nextVideo.video_id,
              is_playing: true
            })
            .eq('id', '00000000-0000-0000-0000-000000000000'); // Assuming single row

          // Remove completed video from queue
          await supabase
            .from('video_queue')
            .delete()
            .eq('id', currentVideo?.id);
        } else {
          // No more videos, stop playback
          await supabase
            .from('video_playback_state')
            .update({
              current_video_id: null,
              is_playing: false
            })
            .eq('id', '00000000-0000-0000-0000-000000000000');
        }
      } else {
        // Stop playback
        await supabase
          .from('video_playback_state')
          .update({ is_playing: false })
          .eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    // YouTube.PlayerState.PLAYING = 1
    if (event.data === 1) {
      // Check if we should stop at end_time
      if (currentVideo && currentVideo.end_time > 0) {
        const checkEndTime = setInterval(() => {
          const currentTime = playerRef.current?.getCurrentTime();
          if (currentTime >= currentVideo.end_time) {
            clearInterval(checkEndTime);
            playerRef.current?.stopVideo();
            // Trigger end event
            onPlayerStateChange({ data: 0 } as any);
          }
        }, 100);

        return () => clearInterval(checkEndTime);
      }
    }
  };

  // Update volume when playback state changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(playbackState.volume);
    }
  }, [playbackState.volume]);

  // Control playback
  useEffect(() => {
    if (playerRef.current) {
      if (playbackState.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [playbackState.isPlaying]);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0, // Hide YouTube controls for cleaner broadcast
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  return (
    <div className="fixed inset-0 bg-black">
      {currentVideo ? (
        <div className="w-full h-full">
          <YouTube
            videoId={currentVideo.video_id}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-2xl">
          No video playing
        </div>
      )}

      {/* Debug info (remove in production) */}
      <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm">
        <div>Queue: {queue.length} videos</div>
        <div>Playing: {playbackState.isPlaying ? 'Yes' : 'No'}</div>
        <div>Volume: {playbackState.volume}%</div>
        <div>Current: {currentVideo?.title || 'None'}</div>
      </div>
    </div>
  );
}
