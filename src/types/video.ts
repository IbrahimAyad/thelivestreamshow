export interface QueueVideo {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  thumbnail_url: string;
  duration: number;
  start_time: number;
  end_time: number | null;
  position: number;
  created_at: string;
}

export interface PlayHistory {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  played_at: string;
  duration_watched: number;
  engagement_score: number;
  category: string;
}

export interface VideoPreference {
  id: string;
  category: string;
  preference_score: number;
  last_updated: string;
}

export interface ScheduledVideo {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  thumbnail_url: string;
  duration: number;
  scheduled_time: string;
  auto_play: boolean;
  created_at: string;
  played: boolean;
}

export interface VideoRecommendation {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  thumbnail_url: string;
  recommendation_score: number;
  category: string;
  energy_level: 'Hype' | 'Chill' | 'Funny';
  created_at: string;
}

export interface ImageQueueItem {
  id: string;
  file_path: string;
  filename: string;
  caption: string | null;
  file_size: number;
  position: number;
  uploaded_at: string;
  created_at: string;
}

export interface ImageDisplayHistory {
  id: string;
  image_id: string | null;
  filename: string;
  displayed_at: string;
  duration_seconds: number | null;
  created_at: string;
}

export type TransitionEffect = 'instant' | 'fade' | 'slide-left' | 'slide-right' | 'zoom-in';

export type VideoCategory = 'Funny' | 'Fails' | 'Gaming' | 'Tech' | 'Wholesome' | 'Trending';
export type EnergyLevel = 'Hype' | 'Chill' | 'Funny';

export interface YouTubeVideo {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  channelId?: string; // Alias for channel
  thumbnail_url: string;
  thumbnail?: string; // Alias for thumbnail_url
  duration: number;
  category?: string;
  created_at?: string;
  viewCount?: number; // View count
}
