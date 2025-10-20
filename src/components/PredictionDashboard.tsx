/**
 * Prediction Dashboard - Phase 5.5
 *
 * Real-time predictions and recommendations during live shows
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Target, Clock, Brain, Zap } from 'lucide-react';
import { QuestionPrediction, ShowHealth, Recommendation } from '../lib/ai/types-phase5';
import { GeneratedQuestion } from '../hooks/useProducerAI';

interface PredictionDashboardProps {
  predictions: QuestionPrediction[];
  showHealth: ShowHealth;
  recommendations: Recommendation[];
  onSelectQuestion?: (question: GeneratedQuestion) => void;
}

export const PredictionDashboard: React.FC<PredictionDashboardProps> = ({
  predictions,
  showHealth,
  recommendations,
  onSelectQuestion
}) => {
  const [selectedPrediction, setSelectedPrediction] = useState<QuestionPrediction | null>(null);

  return (
    <div className="space-y-4">
      {/* Show Health Widget */}
      <ShowHealthWidget health={showHealth} />

      {/* Top Recommendations */}
      {recommendations.length > 0 && (
        <RecommendationsPanel
          recommendations={recommendations}
          onSelect={onSelectQuestion}
        />
      )}

      {/* Question Predictions */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Question Predictions
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            AI-predicted outcomes for top questions
          </p>
        </div>

        <div className="divide-y divide-gray-700">
          {predictions.slice(0, 5).map((prediction, index) => (
            <QuestionPredictionCard
              key={prediction.question.id}
              prediction={prediction}
              rank={index + 1}
              isSelected={selectedPrediction?.question.id === prediction.question.id}
              onClick={() => setSelectedPrediction(prediction)}
              onSelect={() => onSelectQuestion?.(prediction.question)}
            />
          ))}
        </div>

        {predictions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No predictions available yet</p>
            <p className="text-sm mt-1">Generate questions to see predictions</p>
          </div>
        )}
      </div>

      {/* Prediction Details Modal */}
      {selectedPrediction && (
        <PredictionDetailsModal
          prediction={selectedPrediction}
          onClose={() => setSelectedPrediction(null)}
        />
      )}
    </div>
  );
};

/**
 * Show Health Widget - Real-time show performance metrics
 */
const ShowHealthWidget: React.FC<{ health: ShowHealth }> = ({ health }) => {
  const getHealthColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400 bg-green-900/20 border-green-500/30';
    if (score >= 0.4) return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
    return 'text-red-400 bg-red-900/20 border-red-500/30';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return '📈';
    if (trend === 'falling') return '📉';
    return '➡️';
  };

  const healthColor = getHealthColor(health.overallScore);

  return (
    <div className={`border rounded-lg p-4 ${healthColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-sm opacity-90">Show Health</h4>
          <div className="text-3xl font-bold mt-1">
            {(health.overallScore * 100).toFixed(0)}%
          </div>
        </div>
        <Zap className="w-8 h-8 opacity-60" />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
        <div>
          <div className="opacity-70">Engagement</div>
          <div className="font-semibold flex items-center gap-1 mt-1">
            {getTrendIcon(health.engagementTrend)}
            {health.engagementTrend}
          </div>
        </div>
        <div>
          <div className="opacity-70">Pacing</div>
          <div className="font-semibold mt-1">
            {(health.pacingScore * 100).toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="opacity-70">Retention</div>
          <div className="font-semibold mt-1">
            {(health.audienceRetention * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Recommendations Panel - Urgent suggestions
 */
const RecommendationsPanel: React.FC<{
  recommendations: Recommendation[];
  onSelect?: (question: GeneratedQuestion) => void;
}> = ({ recommendations, onSelect }) => {
  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'immediate') return 'border-red-500/50 bg-red-900/20';
    if (urgency === 'next') return 'border-yellow-500/50 bg-yellow-900/20';
    return 'border-blue-500/50 bg-blue-900/20';
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'immediate') return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (urgency === 'next') return <Clock className="w-4 h-4 text-yellow-400" />;
    return <Target className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Recommendations
      </h4>

      {recommendations.slice(0, 3).map((rec, index) => (
        <div
          key={index}
          className={`border rounded-lg p-3 ${getUrgencyColor(rec.urgency)}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getUrgencyIcon(rec.urgency)}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                {rec.suggestedQuestion.question_text}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {rec.reasoning}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  Expected impact: +{(rec.expectedImpact * 100).toFixed(0)}%
                </span>
                {onSelect && (
                  <button
                    onClick={() => onSelect(rec.suggestedQuestion)}
                    className="ml-auto text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                  >
                    Use this
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Question Prediction Card - Individual prediction display
 */
const QuestionPredictionCard: React.FC<{
  prediction: QuestionPrediction;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  onSelect?: () => void;
}> = ({ prediction, rank, isSelected, onClick, onSelect }) => {
  const getRiskColor = (risk: string) => {
    if (risk === 'high') return 'text-red-400 bg-red-900/30';
    if (risk === 'medium') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-green-400 bg-green-900/30';
  };

  const getTimingBadge = (timing: string) => {
    if (timing === 'now') return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (timing === 'soon') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <div
      className={`p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-gray-800/70' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-300 font-semibold text-sm">
          {rank}
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium line-clamp-2">
            {prediction.question.question_text}
          </div>

          {/* Prediction Metrics */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-gray-400">
                {(prediction.predictedEngagement * 100).toFixed(0)}% engagement
              </span>
            </div>

            <div className={`px-2 py-0.5 rounded border ${getRiskColor(prediction.riskLevel)}`}>
              {prediction.riskLevel} risk
            </div>

            <div className={`px-2 py-0.5 rounded border text-xs ${getTimingBadge(prediction.optimalTiming)}`}>
              {prediction.optimalTiming === 'now' ? 'Ask now' :
               prediction.optimalTiming === 'soon' ? 'Ask soon' :
               'Save for later'}
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Confidence</span>
              <span>{(prediction.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${prediction.confidenceLevel * 100}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="mt-3 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            >
              Ask this question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Prediction Details Modal - Detailed view of a single prediction
 */
const PredictionDetailsModal: React.FC<{
  prediction: QuestionPrediction;
  onClose: () => void;
}> = ({ prediction, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Prediction Details</h3>
            <p className="text-sm text-gray-400 mt-1">
              Confidence: {(prediction.confidenceLevel * 100).toFixed(0)}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Question */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Question</h4>
            <div className="bg-gray-800 p-3 rounded border border-gray-700 text-white">
              {prediction.question.question_text}
            </div>
          </div>

          {/* Predictions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Predicted Outcomes</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <div className="text-xs text-gray-400">Engagement</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {(prediction.predictedEngagement * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <div className="text-xs text-gray-400">Risk Level</div>
                <div className="text-2xl font-bold text-white mt-1 capitalize">
                  {prediction.riskLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Why this prediction?</h4>
            <div className="bg-gray-800 p-3 rounded border border-gray-700 text-sm text-gray-300">
              {prediction.reasoning}
            </div>
          </div>

          {/* Optimal Timing */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">When to ask</h4>
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-white capitalize">{prediction.optimalTiming}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Handle ask question
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            Ask this question
          </button>
        </div>
      </div>
    </div>
  );
};
