import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LowerThirdData {
  id: string;
  guest_name: string;
  guest_title: string;
  guest_social: string;
  is_visible: boolean;
}

interface LowerThirdOverlayProps {
  forceVisible?: boolean;
}

export default function LowerThirdOverlay({ forceVisible }: LowerThirdOverlayProps = {}) {
  const [lowerThird, setLowerThird] = useState<LowerThirdData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fetch initial data
    const fetchLowerThird = async () => {
      const { data, error } = await supabase
        .from('lower_thirds_templates')
        .select('*')
        .eq('is_visible', true)
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setLowerThird(data);
        setIsVisible(true);
      }
    };

    fetchLowerThird();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('lower_thirds_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lower_thirds_templates',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as LowerThirdData;
            if (newData.is_visible) {
              setLowerThird(newData);
              setIsVisible(true);
            } else {
              setIsVisible(false);
              setTimeout(() => setLowerThird(null), 600); // Wait for animation
            }
          } else if (payload.eventType === 'DELETE') {
            setIsVisible(false);
            setTimeout(() => setLowerThird(null), 600);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Override visibility with keyboard control
  useEffect(() => {
    if (forceVisible !== undefined) {
      setIsVisible(forceVisible);
    }
  }, [forceVisible]);

  if (!lowerThird) return null;

  return (
    <div className={`lower-third-overlay-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="lower-third-minimal">
        <div className="show-host">{lowerThird.guest_name}</div>
        <div className="show-title">{lowerThird.guest_title}</div>
        <div className="show-social">{lowerThird.guest_social}</div>
      </div>

      <style>{`
        .lower-third-overlay-container {
          position: fixed;
          bottom: 30px;
          left: 30px;
          z-index: 98;
          transition: transform 400ms ease-out, opacity 400ms ease-out;
        }

        .lower-third-overlay-container.visible {
          transform: translateX(0);
          opacity: 1;
        }

        .lower-third-overlay-container.hidden {
          transform: translateX(-100%);
          opacity: 0;
        }

        .lower-third-minimal {
          background: rgba(15, 15, 15, 0.92);
          border-left: 3px solid #FCD34D;
          border-radius: 2px;
          padding: 12px 20px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3);
          text-align: left;
          min-width: 200px;
        }

        .show-host {
          font-size: 13px;
          font-weight: 600;
          color: #EF4444;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .show-title {
          font-size: 14px;
          font-weight: 500;
          color: #FFFFFF;
          line-height: 1.3;
          margin-bottom: 6px;
        }

        .show-social {
          font-size: 11px;
          font-weight: 400;
          color: #F87171;
        }
      `}</style>
    </div>
  );
}
