import { useEffect, useState } from 'react';

interface BetaBotAvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: number;
  className?: string;
  voiceName?: string;
  currentAction?: string;
  streamStatus?: 'live' | 'rehearsal' | 'off_air';
  mood?: 'neutral' | 'bored' | 'amused' | 'spicy';
  movement?: 'home' | 'run_left' | 'run_right' | 'bounce' | 'hide';
  showIncoming?: boolean;
  incomingCount?: number;
}

export function BetaBotAvatar({
  state,
  size = 160,
  className = '',
  voiceName,
  currentAction,
  streamStatus = 'off_air',
  mood = 'neutral',
  movement = 'home',
  showIncoming = false,
  incomingCount = 0
}: BetaBotAvatarProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Blink animation (every 3-5 seconds)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 2000 + 3000); // Random between 3-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

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

  // State-based colors
  const getStateColor = () => {
    switch (state) {
      case 'idle': return '#DC2626'; // Red
      case 'listening': return '#FCD34D'; // Gold
      case 'thinking': return '#6366F1'; // Indigo
      case 'speaking': return '#10B981'; // Green
      default: return '#DC2626';
    }
  };

  // Get stream status text and color
  const getStreamStatusDisplay = () => {
    switch (streamStatus) {
      case 'live':
        return { text: 'LIVE', color: '#EF4444', showDot: true };
      case 'rehearsal':
        return { text: 'REHEARSAL', color: '#F59E0B', showDot: false };
      case 'off_air':
        return { text: 'OFF AIR', color: '#6B7280', showDot: false };
      default:
        return { text: 'OFF AIR', color: '#6B7280', showDot: false };
    }
  };

  const statusDisplay = getStreamStatusDisplay();

  // Get mood-specific visual styles
  const getMoodStyles = () => {
    switch (mood) {
      case 'neutral':
        return {
          faceGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          glowColor: 'rgba(220, 38, 38, 0.5)',
          borderColor: '#1f2937',
          animation: 'float 2s ease-in-out infinite',
          eyeHeight: 18,
          mouthHeight: 10
        };
      case 'bored':
        return {
          faceGradient: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
          glowColor: 'rgba(107, 114, 128, 0.3)',
          borderColor: '#1f2937',
          animation: 'drift-down 3s ease-in-out infinite',
          eyeHeight: 8, // Sleepy half-closed eyes
          mouthHeight: 4  // Small flat mouth
        };
      case 'amused':
        return {
          faceGradient: 'linear-gradient(135deg, #FCD34D 0%, #FDE047 100%)',
          glowColor: 'rgba(252, 211, 77, 0.7)',
          borderColor: '#FCD34D',
          animation: 'bounce-happy 0.6s ease-in-out infinite',
          eyeHeight: 12, // Squinted happy eyes
          mouthHeight: 16 // Big smile
        };
      case 'spicy':
        return {
          faceGradient: 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)',
          glowColor: 'rgba(249, 115, 22, 0.8)',
          borderColor: '#F97316',
          animation: 'shake-nervous 0.3s ease-in-out infinite',
          eyeHeight: 22, // Wide eyes
          mouthHeight: 18 // Worried "O" shape
        };
      default:
        return {
          faceGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          glowColor: 'rgba(220, 38, 38, 0.5)',
          borderColor: '#1f2937',
          animation: 'float 2s ease-in-out infinite',
          eyeHeight: 18,
          mouthHeight: 10
        };
    }
  };

  const moodStyles = getMoodStyles();

  return (
    <div className={`betabot-avatar-container movement-${movement} ${className}`} style={{ width: size + 60, height: size + 100 }}>
      {/* Incoming Question Indicator */}
      {showIncoming && (
        <div className="incoming-indicator">
          <div className="incoming-icon">📩</div>
          {incomingCount > 0 && (
            <div className="incoming-badge">{incomingCount}</div>
          )}
        </div>
      )}

      <div className={`betabot-avatar state-${state} mood-${mood}`} style={{ width: size, height: size }}>
        {/* Gradient Glow Rings */}
        <div className="glow-rings">
          {[0, 0.3, 0.6].map((delay, i) => (
            <div
              key={i}
              className="glow-ring"
              style={{
                animationDelay: `${delay}s`,
                borderColor: getStateColor()
              }}
            />
          ))}
        </div>

        {/* Thinking Particles */}
        {state === 'thinking' && (
          <div className="thinking-particles">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  left: `${15 + (i % 3) * 35}%`,
                  animationDuration: `${2 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}

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

        {/* Voice Waveform for Speaking State */}
        {state === 'speaking' && (
          <div className="voice-waveform">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="waveform-bar"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  height: `${20 + Math.random() * 30}%`
                }}
              />
            ))}
          </div>
        )}

        {/* Bot Face */}
        <div
          className={`bot-face state-${state} mood-${mood}`}
          style={{
            background: moodStyles.faceGradient,
            boxShadow: `0 0 30px ${moodStyles.glowColor}, inset 0 -10px 20px rgba(0, 0, 0, 0.3)`,
            borderColor: moodStyles.borderColor,
            animation: moodStyles.animation
          }}
        >
        {/* Eyes Container */}
        <div className="eyes-container">
          {/* Left Eye */}
          <div
            className={`eye ${isBlinking ? 'blinking' : ''}`}
            style={{ height: isBlinking ? '2px' : `${moodStyles.eyeHeight}px` }}
          >
            <div
              className="pupil"
              style={{
                transform: `translate(calc(-50% + ${leftPupilOffset.x}px), calc(-50% + ${leftPupilOffset.y}px))`
              }}
            />
          </div>

          {/* Right Eye */}
          <div
            className={`eye ${isBlinking ? 'blinking' : ''}`}
            style={{ height: isBlinking ? '2px' : `${moodStyles.eyeHeight}px` }}
          >
            <div
              className="pupil"
              style={{
                transform: `translate(calc(-50% + ${rightPupilOffset.x}px), calc(-50% + ${rightPupilOffset.y}px))`
              }}
            />
          </div>
        </div>

        {/* Mouth */}
        <div
          className={`mouth ${state === 'speaking' ? 'talking' : ''}`}
          style={{ height: `${moodStyles.mouthHeight}px` }}
        />
      </div>
    </div>

    {/* Stream Status Indicator */}
    <div className="stream-status-indicator" style={{
      color: statusDisplay.color,
      borderColor: statusDisplay.color
    }}>
      {statusDisplay.showDot && <div className="status-dot" style={{ background: statusDisplay.color }} />}
      <span>{statusDisplay.text}</span>
    </div>

    {/* Voice Name Badge */}
    {voiceName && (
      <div className="voice-badge">
        🎙️ {voiceName}
      </div>
    )}

      <style>{`
        .betabot-avatar-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Movement States */
        .betabot-avatar-container.movement-home {
          transform: translate(0, 0);
        }

        .betabot-avatar-container.movement-run_left {
          transform: translateX(-1200px);
          transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .betabot-avatar-container.movement-run_right {
          transform: translateX(400px);
          transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .betabot-avatar-container.movement-bounce {
          animation: bounce-around 2s ease-in-out infinite;
        }

        .betabot-avatar-container.movement-hide {
          transform: translateY(-400px);
          opacity: 0;
          transition: transform 0.8s ease-in, opacity 0.8s ease-in;
        }

        @keyframes bounce-around {
          0%, 100% {
            transform: translate(0, 0);
          }
          12.5% {
            transform: translate(-80px, -60px);
          }
          25% {
            transform: translate(-120px, 40px);
          }
          37.5% {
            transform: translate(-40px, 80px);
          }
          50% {
            transform: translate(60px, 60px);
          }
          62.5% {
            transform: translate(100px, -40px);
          }
          75% {
            transform: translate(40px, -80px);
          }
          87.5% {
            transform: translate(-60px, -40px);
          }
        }

        .betabot-avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Gradient Glow Rings */
        .glow-rings {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .glow-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid;
          border-radius: 50%;
          opacity: 0;
          animation: glow-pulse 2s ease-out infinite;
        }

        @keyframes glow-pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        /* Thinking Particles */
        .thinking-particles {
          position: absolute;
          width: 120%;
          height: 120%;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #6366F1;
          border-radius: 50%;
          animation: float-particle 3s ease-in-out infinite;
          box-shadow: 0 0 10px #6366F1;
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(-60px) scale(0.8);
            opacity: 0.8;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) scale(0.5);
            opacity: 0;
          }
        }

        /* Voice Waveform */
        .voice-waveform {
          position: absolute;
          bottom: 15%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 30px;
          pointer-events: none;
        }

        .waveform-bar {
          width: 3px;
          background: #10B981;
          border-radius: 2px;
          animation: waveform-pulse 0.5s ease-in-out infinite alternate;
          box-shadow: 0 0 8px #10B981;
        }

        @keyframes waveform-pulse {
          0% {
            height: 20%;
          }
          100% {
            height: 100%;
          }
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
          border-radius: 50%;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 4px solid #1f2937;
          transition: all 0.5s ease;
        }

        /* State-specific face styling */
        .bot-face.state-idle {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          box-shadow: 0 0 30px rgba(220, 38, 38, 0.5), inset 0 -10px 20px rgba(0, 0, 0, 0.3);
          animation: float 2s ease-in-out infinite;
        }

        .bot-face.state-listening {
          background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%);
          box-shadow: 0 0 40px rgba(252, 211, 77, 0.6), inset 0 -10px 20px rgba(0, 0, 0, 0.3);
          border-color: #FCD34D;
          animation: pulse-yellow 1.5s ease-in-out infinite;
        }

        .bot-face.state-thinking {
          background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
          box-shadow: 0 0 40px rgba(99, 102, 241, 0.6), inset 0 -10px 20px rgba(0, 0, 0, 0.3);
          border-color: #6366F1;
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .bot-face.state-speaking {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.6), inset 0 -10px 20px rgba(0, 0, 0, 0.3);
          border-color: #10B981;
          animation: speak-glow 0.3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        /* Mood-specific animations */
        @keyframes drift-down {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }

        @keyframes bounce-happy {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }

        @keyframes shake-nervous {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
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
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: height 0.1s ease;
        }

        .eye.blinking {
          height: 2px;
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
          border: 3px solid #FCD34D;
          border-top: none;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(252, 211, 77, 0.3);
        }

        .mouth.talking {
          animation: talk 0.3s ease-in-out infinite;
        }

        @keyframes talk {
          0%, 100% { height: 10px; }
          50% { height: 18px; }
        }

        /* Stream Status Indicator */
        .stream-status-indicator {
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          padding: 6px 16px;
          background: rgba(0, 0, 0, 0.9);
          border-radius: 20px;
          border: 2px solid currentColor;
          letter-spacing: 1px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.3s ease-out;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Voice Badge */
        .voice-badge {
          font-size: 12px;
          font-weight: 600;
          color: #FCD34D;
          text-align: center;
          padding: 4px 12px;
          background: rgba(252, 211, 77, 0.1);
          border: 1px solid #FCD34D;
          border-radius: 12px;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 8px rgba(252, 211, 77, 0.2);
          animation: fadeIn 0.3s ease-out;
        }

        /* Incoming Question Indicator */
        .incoming-indicator {
          position: absolute;
          top: 50%;
          left: -40px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: slideInLeft 0.5s ease-out;
          z-index: 100;
        }

        .incoming-icon {
          font-size: 28px;
          filter: drop-shadow(0 4px 12px rgba(252, 211, 77, 0.6));
          animation: gentleBounce 2s ease-in-out infinite, pulseglow 2s ease-in-out infinite;
        }

        .incoming-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #EF4444;
          color: white;
          font-size: 12px;
          font-weight: 700;
          min-width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.6);
          animation: pulse-badge 1.5s ease-in-out infinite;
        }

        @keyframes slideDownBounce {
          0% {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          60% {
            transform: translateX(-50%) translateY(5px);
            opacity: 1;
          }
          80% {
            transform: translateX(-50%) translateY(-2px);
          }
          100% {
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes slideUpBounce {
          0% {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
            opacity: 1;
          }
          80% {
            transform: translateX(-50%) translateY(2px);
          }
          100% {
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes slideInLeft {
          0% {
            transform: translateY(-50%) translateX(-30px);
            opacity: 0;
          }
          60% {
            transform: translateY(-50%) translateX(5px);
            opacity: 1;
          }
          80% {
            transform: translateY(-50%) translateX(-2px);
          }
          100% {
            transform: translateY(-50%) translateX(0);
          }
        }

        @keyframes gentleBounce {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }

        @keyframes pulseglow {
          0%, 100% {
            filter: drop-shadow(0 4px 12px rgba(252, 211, 77, 0.6));
          }
          50% {
            filter: drop-shadow(0 4px 16px rgba(252, 211, 77, 0.9));
          }
        }
      `}</style>
    </div>
  );
}
