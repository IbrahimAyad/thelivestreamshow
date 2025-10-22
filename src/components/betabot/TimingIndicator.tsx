import { Clock, Zap, MessageCircle, TrendingUp } from 'lucide-react';
import { TimingOpportunity } from '../../hooks/useConversationTiming';
import { EnergyMetrics } from '../../lib/conversationTiming';

interface TimingIndicatorProps {
  timingOpportunity: TimingOpportunity | null;
  currentEnergy: EnergyMetrics | null;
  totalSignals: number;
}

export function TimingIndicator({
  timingOpportunity,
  currentEnergy,
  totalSignals
}: TimingIndicatorProps) {
  if (!timingOpportunity && !currentEnergy) {
    return null;
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'interrupt_now': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'good_time': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'wait': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getPaceColor = (pace: string) => {
    switch (pace) {
      case 'slow': return 'text-blue-400';
      case 'normal': return 'text-green-400';
      case 'fast': return 'text-yellow-400';
      case 'very_fast': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'text-blue-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-semibold text-white">Smart Timing</h4>
        <span className="text-xs text-gray-400">
          ({totalSignals} signals detected)
        </span>
      </div>

      {/* Timing Opportunity */}
      {timingOpportunity && (
        <div className={`rounded-lg p-3 mb-3 border ${getRecommendationColor(timingOpportunity.recommendation)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase">
              {timingOpportunity.recommendation.replace('_', ' ')}
            </span>
            <span className="text-lg font-bold">
              {(timingOpportunity.score * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs opacity-80">
            {timingOpportunity.reasoning}
          </p>

          {/* Signal Badges */}
          {timingOpportunity.signals.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {timingOpportunity.signals.map((signal, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-300"
                >
                  {signal.type.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Energy Metrics */}
      {currentEnergy && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-700/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-gray-400">Pace</span>
            </div>
            <span className={`text-sm font-semibold ${getPaceColor(currentEnergy.pace)}`}>
              {currentEnergy.pace}
            </span>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-400">Energy</span>
            </div>
            <span className={`text-sm font-semibold ${getIntensityColor(currentEnergy.intensity)}`}>
              {currentEnergy.intensity}
            </span>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <MessageCircle className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-gray-400">WPM</span>
            </div>
            <span className="text-sm font-semibold text-white">
              {currentEnergy.wordsPerMinute.toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
