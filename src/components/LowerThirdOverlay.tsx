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
        <div className="lower-third-content">
          <span className="guest-name">{lowerThird.guest_name}</span>
          <span className="separator">•</span>
          <span className="guest-title">{lowerThird.guest_title}</span>
          <span className="separator">•</span>
          <span className="guest-social">{lowerThird.guest_social}</span>
        </div>
      </div>

      <style>{`
        .lower-third-overlay-container {
          position: fixed;
          bottom: 180px;
          left: 24px;
          z-index: 98;
          max-width: 600px;
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
          border-left: 3px solid #22D3EE;
          border-radius: 2px;
          padding: 12px 20px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .lower-third-content {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          line-height: 1;
        }

        .guest-name {
          font-weight: 600;
          color: #EF4444;
          letter-spacing: 0.3px;
        }

        .separator {
          color: #6B7280;
          font-weight: 300;
        }

        .guest-title {
          font-weight: 400;
          color: #F87171;
        }

        .guest-social {
          font-weight: 400;
          color: #EF4444;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
