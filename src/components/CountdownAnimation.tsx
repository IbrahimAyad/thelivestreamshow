import { useState, useEffect } from 'react';

interface CountdownAnimationProps {
  visible: boolean;
  onComplete: () => void;
}

export default function CountdownAnimation({ visible, onComplete }: CountdownAnimationProps) {
  const [count, setCount] = useState(3);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCount(3);
      setIsExiting(false);
      return;
    }

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Start fade out animation
          setIsExiting(true);
          // Call onComplete after fade out
          setTimeout(() => {
            onComplete();
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 1500 }}
    >
      {count > 0 && (
        <div
          className={`countdown-number ${isExiting ? 'fade-out' : ''}`}
          key={count}
        >
          {count}
        </div>
      )}

      <style>{`
        .countdown-number {
          font-size: 120px;
          font-weight: 900;
          color: #00ffff;
          text-shadow: 
            0 0 20px rgba(0, 255, 255, 0.8),
            0 0 40px rgba(0, 255, 255, 0.6),
            0 0 60px rgba(0, 255, 255, 0.4),
            0 0 80px rgba(0, 255, 255, 0.2);
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), pulse 1s ease-in-out infinite;
        }

        .countdown-number.fade-out {
          animation: fadeOut 0.5s ease-out forwards;
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            text-shadow: 
              0 0 20px rgba(0, 255, 255, 0.8),
              0 0 40px rgba(0, 255, 255, 0.6),
              0 0 60px rgba(0, 255, 255, 0.4),
              0 0 80px rgba(0, 255, 255, 0.2);
          }
          50% {
            text-shadow: 
              0 0 30px rgba(0, 255, 255, 1),
              0 0 60px rgba(0, 255, 255, 0.8),
              0 0 90px rgba(0, 255, 255, 0.6),
              0 0 120px rgba(0, 255, 255, 0.4);
          }
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
