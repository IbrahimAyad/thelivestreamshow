import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LiveIndicator() {
  const [isLive, setIsLive] = useState(false);
  const [isRehearsal, setIsRehearsal] = useState(false);

  useEffect(() => {
    // Fetch initial state
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('show_metadata')
        .select('is_live, is_rehearsal')
        .single();

      if (data && !error) {
        setIsLive(data.is_live || false);
        setIsRehearsal(data.is_rehearsal || false);
      }
    };

    fetchStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('show_metadata_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'show_metadata',
        },
        (payload: any) => {
          if (payload.new) {
            setIsLive(payload.new.is_live || false);
            setIsRehearsal(payload.new.is_rehearsal || false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusConfig = () => {
    if (isLive) {
      return {
        text: 'LIVE',
        color: '#ff0000',
        glowColor: 'rgba(255, 0, 0, 0.8)',
        showDot: true,
      };
    } else if (isRehearsal) {
      return {
        text: 'REHEARSAL',
        color: '#ffa500',
        glowColor: 'rgba(255, 165, 0, 0.8)',
        showDot: false,
      };
    } else {
      return {
        text: 'OFF AIR',
        color: '#808080',
        glowColor: 'rgba(128, 128, 128, 0.5)',
        showDot: false,
      };
    }
  };

  const status = getStatusConfig();

  return (
    <div
      className="fixed flex items-center gap-2"
      style={{
        top: '20px',
        left: '20px',
        zIndex: 40,
        padding: '10px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
      }}
    >
      {status.showDot && (
        <div
          className="pulsing-dot"
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: status.color,
          }}
        />
      )}
      <span
        className="status-text"
        style={{
          color: status.color,
          fontSize: '18px',
          fontWeight: '700',
          letterSpacing: '1px',
          textShadow: `0 0 10px ${status.glowColor}, 0 0 20px ${status.glowColor}`,
        }}
      >
        {status.text}
      </span>

      <style>{`
        .pulsing-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 10px ${status.glowColor}, 0 0 20px ${status.glowColor};
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
            box-shadow: 0 0 15px ${status.glowColor}, 0 0 30px ${status.glowColor};
          }
        }

        .status-text {
          animation: glow-text 2s ease-in-out infinite;
        }

        @keyframes glow-text {
          0%, 100% {
            text-shadow: 0 0 10px ${status.glowColor}, 0 0 20px ${status.glowColor};
          }
          50% {
            text-shadow: 0 0 15px ${status.glowColor}, 0 0 30px ${status.glowColor}, 0 0 40px ${status.glowColor};
          }
        }
      `}</style>
    </div>
  );
}
