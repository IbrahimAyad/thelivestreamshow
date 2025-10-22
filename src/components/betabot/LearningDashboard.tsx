import { useState, useEffect } from 'react';
import { useBetaBotFeedback } from '../../hooks/useBetaBotFeedback';
import { TrendingUp, TrendingDown, Minus, Brain, MessageSquare, Clock, Target } from 'lucide-react';

export function LearningDashboard() {
  const feedback = useBetaBotFeedback();
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    const [daily, weekly] = await Promise.all([
      feedback.getCurrentMetrics(),
      feedback.getMetrics('weekly')
    ]);
    setCurrentMetrics(daily);
    setWeeklyMetrics(weekly);
    setIsLoading(false);
  };

  const getTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return 'neutral';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'neutral';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!currentMetrics && !weeklyMetrics) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Learning Progress</h3>
        </div>
        <p className="text-sm text-gray-400">
          No data yet. Start using BetaBot to see improvement metrics!
        </p>
      </div>
    );
  }

  const metrics = currentMetrics || weeklyMetrics;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Learning Progress</h3>
        </div>
        <button className="text-gray-400 hover:text-white text-xs">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Quick Stats (Always Visible) */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Question Usage Rate */}
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Question Usage"
          value={formatPercentage(metrics.questionUsageRate || 0)}
          trend={getTrend(metrics.questionUsageRate, 0.5)}
          color="blue"
        />

        {/* Response Quality */}
        <MetricCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="Response Quality"
          value={`${(metrics.responseQualityScore || 0).toFixed(1)}/2`}
          trend={getTrend(metrics.responseQualityScore, 0)}
          color="green"
        />

        {/* Timing Accuracy */}
        {isExpanded && (
          <>
            <MetricCard
              icon={<Clock className="w-4 h-4" />}
              label="Timing Accuracy"
              value={formatPercentage(metrics.timingAccuracyRate || 0)}
              trend={getTrend(metrics.timingAccuracyRate, 0.5)}
              color="yellow"
            />

            {/* Total Interactions */}
            <MetricCard
              icon={<Brain className="w-4 h-4" />}
              label="Interactions"
              value={`${metrics.totalInteractions || 0}`}
              trend="neutral"
              color="purple"
            />
          </>
        )}
      </div>

      {/* Detailed Stats (Expanded) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
          <DetailRow
            label="Questions Generated"
            value={metrics.questionsGenerated || 0}
          />
          <DetailRow
            label="Questions Used"
            value={metrics.questionsUsed || 0}
            highlight={metrics.questionsUsed > 0}
          />
          <DetailRow
            label="Questions Ignored"
            value={metrics.questionsIgnored || 0}
            muted={true}
          />
          <DetailRow
            label="Helpful Responses"
            value={metrics.responsesHelpful || 0}
            highlight={metrics.responsesHelpful > 0}
          />
          <DetailRow
            label="Poor Responses"
            value={metrics.responsesPoor || 0}
            muted={true}
          />
        </div>
      )}

      {/* Refresh Button */}
      {isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadMetrics();
          }}
          className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
        >
          Refresh Metrics
        </button>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function MetricCard({ icon, label, value, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10'
  };

  const trendIcons = {
    up: <TrendingUp className="w-3 h-3 text-green-400" />,
    down: <TrendingDown className="w-3 h-3 text-red-400" />,
    neutral: <Minus className="w-3 h-3 text-gray-400" />
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-300">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-white">{value}</span>
        {trendIcons[trend]}
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
}

function DetailRow({ label, value, highlight, muted }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={muted ? 'text-gray-500' : 'text-gray-400'}>{label}</span>
      <span className={
        highlight
          ? 'text-green-400 font-semibold'
          : muted
          ? 'text-gray-500'
          : 'text-gray-300'
      }>
        {value}
      </span>
    </div>
  );
}
