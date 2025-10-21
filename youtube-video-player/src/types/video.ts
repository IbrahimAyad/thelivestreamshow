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

export type VideoCategory = 'Funny' | 'Fails' | 'Gaming' | 'Tech' | 'Wholesome' | 'Trending';
export type EnergyLevel = 'Hype' | 'Chill' | 'Funny';
