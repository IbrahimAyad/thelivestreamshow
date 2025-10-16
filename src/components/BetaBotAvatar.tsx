import { useEffect, useState } from 'react';

interface BetaBotAvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: number;
  className?: string;
}

export function BetaBotAvatar({ state, size = 120, className = '' }: BetaBotAvatarProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0 });

  // Track mouse for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate pupil position based on mouse
  const getPupilOffset = (eyeX: number, eyeY: number) => {
    const dx = mousePosition.x - (avatarPosition.x + eyeX);
    const dy = mousePosition.y - (avatarPosition.y + eyeY);
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(7, Math.sqrt(dx * dx + dy * dy) / 30);
    
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  const leftPupilOffset = getPupilOffset(size * 0.35, size * 0.4);
  const rightPupilOffset = getPupilOffset(size * 0.65, size * 0.4);

  return (
    <div className={`betabot-avatar ${className}`} style={{ width: size, height: size }}>
      {/* Sound Waves for Listening State */}
      {state === 'listening' && (
        <div className="sound-waves">
          {[0, 0.5, 1].map((delay, i) => (
            <div
              key={i}
              className="wave"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      )}

      {/* Bot Face */}
      <div className={`bot-face state-${state}`}>
        {/* Eyes Container */}
        <div className="eyes-container">
          {/* Left Eye */}
          <div className="eye">
            <div 
              className="pupil"
              style={{
                transform: `translate(calc(-50% + ${leftPupilOffset.x}px), calc(-50% + ${leftPupilOffset.y}px))`
              }}
            />
          </div>
          
          {/* Right Eye */}
          <div className="eye">
            <div 
              className="pupil"
              style={{
                transform: `translate(calc(-50% + ${rightPupilOffset.x}px), calc(-50% + ${rightPupilOffset.y}px))`
              }}
            />
          </div>
        </div>

        {/* Mouth */}
        <div className={`mouth ${state === 'speaking' ? 'talking' : ''}`} />
      </div>

      <style>{`
        .betabot-avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sound-waves {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .wave {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid rgba(250, 204, 21, 0.4);
          border-radius: 50%;
          animation: wave-animation 1.5s ease-out infinite;
        }

        @keyframes wave-animation {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .bot-face {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border-radius: 50%;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(220, 38, 38, 0.4), inset 0 -10px 20px rgba(0, 0, 0, 0.3);
          border: 4px solid #1f2937;
          transition: all 0.3s ease;
        }

        .bot-face.state-idle {
          animation: float 2s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .bot-face.state-listening {
          animation: pulse-yellow 1.5s ease-in-out infinite;
          border-color: #facc15;
        }

        @keyframes pulse-yellow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(250, 204, 21, 0.8);
            transform: scale(1.05);
          }
        }

        .bot-face.state-thinking {
          box-shadow: 0 0 30px rgba(250, 204, 21, 0.5);
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .bot-face.state-speaking {
          animation: speak-glow 0.3s ease-in-out infinite;
        }

        @keyframes speak-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(220, 38, 38, 0.6); }
          50% { box-shadow: 0 0 50px rgba(220, 38, 38, 0.9); }
        }

        .eyes-container {
          display: flex;
          gap: 20px;
          margin-bottom: 8px;
        }

        .eye {
          width: 15px;
          height: 15px;
          background: white;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .pupil {
          width: 7px;
          height: 7px;
          background: #000;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transition: transform 0.2s ease;
        }

        .mouth {
          width: 40px;
          height: 10px;
          border-radius: 0 0 40px 40px;
          border: 3px solid #facc15;
          border-top: none;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(250, 204, 21, 0.3);
        }

        .mouth.talking {
          animation: talk 0.3s ease-in-out infinite;
        }

        @keyframes talk {
          0%, 100% { height: 10px; }
          50% { height: 18px; }
        }
      `}</style>
    </div>
  );
}
