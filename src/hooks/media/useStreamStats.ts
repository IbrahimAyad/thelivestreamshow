import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface StreamStats {
  viewerCount: number;
  chatRate: number;
  followerCount?: number;
  subscriberCount?: number;
  streamStatus: 'live' | 'offline';
  platform: 'twitch' | 'youtube';
  timestamp: string;
  error?: string;
}

export interface StreamStatsHistory {
  platform: string;
  viewer_count: number;
  chat_rate: number;
  recorded_at: string;
}

export function useStreamStats() {
  const [twitchStats, setTwitchStats] = useState<StreamStats | null>(null);
  const [youtubeStats, setYoutubeStats] = useState<StreamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [history, setHistory] = useState<StreamStatsHistory[]>([]);

  const fetchTwitchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-twitch-stats');
      
      if (error) {
        console.error('Twitch stats error:', error);
        setTwitchStats({
          viewerCount: 0,
          chatRate: 0,
          followerCount: 0,
          streamStatus: 'offline',
          platform: 'twitch',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      } else if (data?.data) {
        setTwitchStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch Twitch stats:', err);
    }
  };

  const fetchYoutubeStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-stats');
      
      if (error) {
        console.error('YouTube stats error:', error);
        setYoutubeStats({
          viewerCount: 0,
          chatRate: 0,
          subscriberCount: 0,
          streamStatus: 'offline',
          platform: 'youtube',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      } else if (data?.data) {
        setYoutubeStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch YouTube stats:', err);
    }
  };

  const fetchHistory = async (timeRange: 'hour' | 'day' | 'stream' = 'hour') => {
    try {
      let query = supabase
        .from('stream_stats')
        .select('platform, viewer_count, chat_rate, recorded_at')
        .order('recorded_at', { ascending: true });

      const now = new Date();
      let cutoffTime = new Date();

      if (timeRange === 'hour') {
        cutoffTime.setHours(now.getHours() - 1);
      } else if (timeRange === 'day') {
        cutoffTime.setHours(now.getHours() - 24);
      }

      query = query.gte('recorded_at', cutoffTime.toISOString());

      const { data } = await query;
      if (data) {
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const refreshStats = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTwitchStats(), fetchYoutubeStats()]);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshStats();
    fetchHistory();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    twitchStats,
    youtubeStats,
    loading,
    lastUpdated,
    history,
    refreshStats,
    fetchHistory
  };
}
