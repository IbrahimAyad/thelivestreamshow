/**
 * Show Plan Viewer - Phase 6.1
 *
 * Displays show plan during live show with real-time tracking
 */

import { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle,
  Circle,
  Clock,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Target,
  BarChart3
} from 'lucide-react';
import type { SavedShowPlan, ShowSegment } from '../types/show-plan-import';

interface ShowPlanViewerProps {
  plan: SavedShowPlan;
  currentSegmentIndex?: number;
  elapsedMinutes?: number;
  currentEngagement?: number;
  onSegmentSelect?: (segmentIndex: number) => void;
  className?: string;
}

export function ShowPlanViewer({
  plan,
  currentSegmentIndex = 0,
  elapsedMinutes = 0,
  currentEngagement,
  onSegmentSelect,
  className = ''
}: ShowPlanViewerProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set([currentSegmentIndex]));

  // Auto-expand current segment
  useEffect(() => {
    setExpandedSegments(prev => new Set(prev).add(currentSegmentIndex));
  }, [currentSegmentIndex]);

  /**
   * Calculate cumulative timing for segments
   */
  const getSegmentTiming = (index: number) => {
    let startTime = 0;
    for (let i = 0; i < index; i++) {
      startTime += plan.segments[i]?.duration || 0;
    }
    const endTime = startTime + (plan.segments[index]?.duration || 0);
    return { startTime, endTime };
  };

  /**
   * Get segment status
   */
  const getSegmentStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentSegmentIndex) return 'completed';
    if (index === currentSegmentIndex) return 'current';
    return 'upcoming';
  };

  /**
   * Calculate progress percentage
   */
  const calculateProgress = () => {
    const totalDuration = plan.total_duration;
    return Math.min((elapsedMinutes / totalDuration) * 100, 100);
  };

  /**
   * Get predicted engagement for current time
   */
  const getCurrentPredictedEngagement = () => {
    if (!plan.predicted_engagement_curve?.segments) return null;

    const currentSegmentCurve = plan.predicted_engagement_curve.segments.find(
      seg => seg.segmentId === plan.segments[currentSegmentIndex]?.id
    );

    return currentSegmentCurve?.predictedEngagement;
  };

  /**
   * Toggle segment expansion
   */
  const toggleSegment = (index: number) => {
    setExpandedSegments(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const progress = calculateProgress();
  const predictedEngagement = getCurrentPredictedEngagement();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Plan Header */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              {plan.metadata?.title || 'Untitled Show'}
            </h3>
            <p className="text-sm text-gray-400">
              {plan.metadata?.format || 'Unknown Format'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {elapsedMinutes}/{plan.total_duration}
            </div>
            <div className="text-xs text-gray-400">minutes</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Show Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Engagement Comparison */}
        {currentEngagement !== undefined && predictedEngagement !== undefined && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-black/30 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-400">Predicted</span>
              </div>
              <div className="text-lg font-bold text-white">
                {(predictedEngagement * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-black/30 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-400">Actual</span>
              </div>
              <div className={`text-lg font-bold ${
                currentEngagement >= predictedEngagement * 100
                  ? 'text-green-400'
                  : 'text-yellow-400'
              }`}>
                {currentEngagement.toFixed(0)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Segments List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Show Segments
        </h4>

        {plan.segments.map((segment, index) => {
          const timing = getSegmentTiming(index);
          const status = getSegmentStatus(index);
          const isExpanded = expandedSegments.has(index);

          return (
            <div
              key={segment.id}
              className={`border-2 rounded-lg overflow-hidden transition-all ${
                status === 'current'
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : status === 'completed'
                  ? 'border-gray-700 bg-gray-900/50'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              {/* Segment Header */}
              <button
                onClick={() => {
                  toggleSegment(index);
                  onSegmentSelect?.(index);
                }}
                className="w-full p-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : status === 'current' ? (
                      <Play className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-600" />
                    )}
                  </div>

                  {/* Segment Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="font-semibold text-white">
                        {segment.order}. {segment.name}
                      </h4>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                      {segment.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timing.startTime}-{timing.endTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{(segment.expectedEngagement * 100).toFixed(0)}% expected</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{segment.questions?.length || 0} questions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && segment.questions && segment.questions.length > 0 && (
                <div className="border-t border-gray-700 bg-black/20 p-4">
                  <h5 className="text-xs font-semibold text-gray-400 mb-3 uppercase">
                    Questions for this segment
                  </h5>
                  <div className="space-y-2">
                    {segment.questions.map((question, qIdx) => (
                      <div
                        key={question.id}
                        className="bg-gray-900 border border-gray-700 rounded p-3 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                            {qIdx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white mb-1">
                              {question.text}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>~{question.estimatedDuration} min</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan Metadata */}
      {(plan.metadata?.hook || plan.metadata?.throughline || plan.metadata?.panelists) && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-300">Show Notes</h4>

          {plan.metadata.hook && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Hook</div>
              <p className="text-sm text-white">{plan.metadata.hook}</p>
            </div>
          )}

          {plan.metadata.throughline && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Throughline</div>
              <p className="text-sm text-white">{plan.metadata.throughline}</p>
            </div>
          )}

          {plan.metadata.panelists && plan.metadata.panelists.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Panelists</div>
              <div className="flex flex-wrap gap-2">
                {plan.metadata.panelists.map((panelist, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded border border-gray-700"
                  >
                    {panelist}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deviation Warning */}
      {elapsedMinutes > 0 && (
        (() => {
          const currentTiming = getSegmentTiming(currentSegmentIndex);
          const isAhead = elapsedMinutes < currentTiming.startTime;
          const isBehind = elapsedMinutes > currentTiming.endTime;

          if (isAhead || isBehind) {
            return (
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-300 font-semibold mb-1">
                    {isAhead ? 'Ahead of Schedule' : 'Behind Schedule'}
                  </p>
                  <p className="text-yellow-400">
                    {isAhead
                      ? `You're ${(currentTiming.startTime - elapsedMinutes).toFixed(0)} minutes ahead of the plan. Consider slowing down or adding more depth to current discussion.`
                      : `You're ${(elapsedMinutes - currentTiming.endTime).toFixed(0)} minutes behind. Consider speeding up or skipping optional questions.`
                    }
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })()
      )}
    </div>
  );
}
