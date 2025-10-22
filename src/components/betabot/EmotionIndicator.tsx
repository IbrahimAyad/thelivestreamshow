import { Heart, Smile, Frown, Zap, Meh } from 'lucide-react';
import { EmotionAnalysisResult, MoodMapping } from '../../lib/emotionDetection';

interface EmotionIndicatorProps {
  currentEmotion: EmotionAnalysisResult | null;
  recommendedMode: MoodMapping | null;
  isAnalyzing: boolean;
}

export function EmotionIndicator({
  currentEmotion,
  recommendedMode,
  isAnalyzing
}: EmotionIndicatorProps) {
  if (!currentEmotion && !isAnalyzing) {
    return null;
  }

  const getEmotionIcon = (emotion: string) => {
    const lowerEmotion = emotion.toLowerCase();
    if (lowerEmotion.includes('joy') || lowerEmotion.includes('happy')) {
      return <Smile className="w-4 h-4 text-yellow-400" />;
    }
    if (lowerEmotion.includes('sad') || lowerEmotion.includes('disappointed')) {
      return <Frown className="w-4 h-4 text-blue-400" />;
    }
    if (lowerEmotion.includes('excite') || lowerEmotion.includes('enthusiasm')) {
      return <Zap className="w-4 h-4 text-orange-400" />;
    }
    return <Meh className="w-4 h-4 text-gray-400" />;
  };

  const getValenceColor = (valence: number) => {
    if (valence > 0.3) return 'text-green-400';
    if (valence < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getArousalColor = (arousal: number) => {
    if (arousal > 0.6) return 'text-orange-400';
    if (arousal < 0.4) return 'text-blue-400';
    return 'text-purple-400';
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'creative': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'professional': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'empathetic': return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-pink-400" />
        <h4 className="text-sm font-semibold text-white">Emotion Detection</h4>
        {isAnalyzing && (
          <span className="text-xs text-gray-400 animate-pulse">Analyzing...</span>
        )}
      </div>

      {currentEmotion && (
        <>
          {/* Dominant Emotion */}
          <div className="bg-gray-700/30 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              {getEmotionIcon(currentEmotion.dominantEmotion)}
              <span className="text-sm font-semibold text-white capitalize">
                {currentEmotion.dominantEmotion}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {(currentEmotion.confidence * 100).toFixed(0)}% confident
              </span>
            </div>

            {/* Top Emotions */}
            {currentEmotion.topEmotions.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentEmotion.topEmotions.slice(1, 4).map((emotion, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-300"
                  >
                    {emotion.emotion} {(emotion.score * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Emotional Dimensions */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-700/30 rounded-lg p-2">
              <div className="text-xs text-gray-400 mb-1">Valence</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getValenceColor(currentEmotion.emotionalValence)} bg-current`}
                    style={{
                      width: `${((currentEmotion.emotionalValence + 1) / 2) * 100}%`
                    }}
                  />
                </div>
                <span className={`text-xs font-semibold ${getValenceColor(currentEmotion.emotionalValence)}`}>
                  {currentEmotion.emotionalValence > 0 ? '+' : ''}
                  {currentEmotion.emotionalValence.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-2">
              <div className="text-xs text-gray-400 mb-1">Arousal</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getArousalColor(currentEmotion.arousal)} bg-current`}
                    style={{
                      width: `${currentEmotion.arousal * 100}%`
                    }}
                  />
                </div>
                <span className={`text-xs font-semibold ${getArousalColor(currentEmotion.arousal)}`}>
                  {currentEmotion.arousal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Mode */}
          {recommendedMode && (
            <div className={`rounded-lg p-3 border ${getModeColor(recommendedMode.recommendedMode)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase">
                  Recommended Mode: {recommendedMode.recommendedMode}
                </span>
                <span className="text-xs opacity-80">
                  {(recommendedMode.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs opacity-80">
                {recommendedMode.reasoning}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
