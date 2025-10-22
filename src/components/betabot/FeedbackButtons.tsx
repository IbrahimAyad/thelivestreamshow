import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface FeedbackButtonsProps {
  interactionId: string;
  onFeedback?: (type: 'thumbs_up' | 'thumbs_down') => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function FeedbackButtons({
  interactionId,
  onFeedback,
  size = 'md',
  disabled = false
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFeedback = (type: 'thumbs_up' | 'thumbs_down') => {
    if (disabled || feedback) return;

    setFeedback(type);
    setIsAnimating(true);

    // Trigger callback
    onFeedback?.(type);

    // Reset animation after delay
    setTimeout(() => setIsAnimating(false), 600);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center gap-2">
      {/* Thumbs Up Button */}
      <button
        onClick={() => handleFeedback('thumbs_up')}
        disabled={disabled || feedback !== null}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          ${feedback === 'thumbs_up'
            ? 'bg-green-500 text-white scale-110'
            : 'bg-gray-700 hover:bg-green-600 text-gray-300 hover:text-white'
          }
          ${disabled || feedback !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isAnimating && feedback === 'thumbs_up' ? 'animate-bounce' : ''}
        `}
        title="Helpful response"
      >
        {feedback === 'thumbs_up' ? (
          <Check className={iconSizeClasses[size]} />
        ) : (
          <ThumbsUp className={iconSizeClasses[size]} />
        )}
      </button>

      {/* Thumbs Down Button */}
      <button
        onClick={() => handleFeedback('thumbs_down')}
        disabled={disabled || feedback !== null}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          ${feedback === 'thumbs_down'
            ? 'bg-red-500 text-white scale-110'
            : 'bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white'
          }
          ${disabled || feedback !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isAnimating && feedback === 'thumbs_down' ? 'animate-bounce' : ''}
        `}
        title="Unhelpful response"
      >
        {feedback === 'thumbs_down' ? (
          <Check className={iconSizeClasses[size]} />
        ) : (
          <ThumbsDown className={iconSizeClasses[size]} />
        )}
      </button>

      {/* Feedback confirmation text */}
      {feedback && (
        <span className={`
          text-xs
          ${feedback === 'thumbs_up' ? 'text-green-400' : 'text-red-400'}
          animate-fadeIn
        `}>
          {feedback === 'thumbs_up' ? 'Thanks!' : 'Noted'}
        </span>
      )}
    </div>
  );
}
