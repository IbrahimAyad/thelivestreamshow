import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface EpisodeInfo {
  id: string;
  episode_number: number;
  episode_date: string;
  episode_title: string;
  is_active: boolean;
}

export default function EpisodeInfoDisplay() {
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null);

  useEffect(() => {
    // Fetch initial data
    const fetchEpisodeInfo = async () => {
      const { data, error } = await supabase
        .from('episode_info')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (data && !error) {
        setEpisodeInfo(data);
      }
    };

    fetchEpisodeInfo();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('episode_info_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'episode_info',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as EpisodeInfo;
            if (newData.is_active) {
              setEpisodeInfo(newData);
            }
          } else if (payload.eventType === 'DELETE') {
            setEpisodeInfo(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!episodeInfo) return null;

  const formattedDate = new Date(episodeInfo.episode_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="episode-info-display">
      <div className="episode-info-minimal">
        <div className="episode-number">EP {episodeInfo.episode_number}</div>
        <div className="episode-date">{formattedDate}</div>
        <div className="episode-title">{episodeInfo.episode_title}</div>
      </div>

      <style>{`
        .episode-info-display {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 100;
        }

        .episode-info-minimal {
          background: rgba(15, 15, 15, 0.92);
          border-right: 3px solid #FCD34D;
          border-radius: 2px;
          padding: 12px 20px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3);
          text-align: right;
          min-width: 200px;
        }

        .episode-number {
          font-size: 13px;
          font-weight: 600;
          color: #FCD34D;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .episode-date {
          font-size: 11px;
          font-weight: 400;
          color: #6B7280;
          margin-bottom: 6px;
        }

        .episode-title {
          font-size: 14px;
          font-weight: 500;
          color: #E5E7EB;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}
