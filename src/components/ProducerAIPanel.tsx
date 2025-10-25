import { useState, useEffect, useRef } from 'react';
import { useProducerAI } from '../hooks/useProducerAI';
import { usePredictiveAI } from '../hooks/usePredictiveAI';
import { useAuth } from '../contexts/AuthContext';
import { useShow } from '../contexts/ShowContext';
import { supabase } from '../lib/supabase'; // Use shared singleton
import { PredictionDashboard } from './PredictionDashboard';
import { ImportPlanModal } from './ImportPlanModal';
import { ShowPlanSelector } from './ShowPlanSelector';
import { ShowPlanViewer } from './ShowPlanViewer';
import { AICoordinatorMonitor } from './AICoordinatorMonitor';
import { Brain, Play, Pause, Zap, TrendingUp, Clock, CheckCircle, AlertCircle, Settings, Network, BarChart3, DollarSign, Database, Sparkles, History, Target, Upload, FolderOpen, FileText, AlertTriangle, X } from 'lucide-react';
import type { SavedShowPlan } from '../types/show-plan-import';

export function ProducerAIPanel() {
  const producerAI = useProducerAI();
  const { hostId } = useAuth();
  const { showId, startShow, endShow } = useShow();
  const [showSettings, setShowSettings] = useState(false);
  const [showPhase5, setShowPhase5] = useState(false);
  const [tempInterval, setTempInterval] = useState(producerAI.config.analysisInterval);
  const [tempMinWords, setTempMinWords] = useState(producerAI.config.minTranscriptLength);

  // Phase 6.1: Show Plan Management
  const [showPhase6, setShowPhase6] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [activePlan, setActivePlan] = useState<SavedShowPlan | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [showElapsedMinutes, setShowElapsedMinutes] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(null);
  const [accumulatedMinutes, setAccumulatedMinutes] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Phase 5: Predictive Intelligence
  const predictiveAI = usePredictiveAI({
    enabled: showPhase5 && producerAI.isEnabled,
    showId: showId || 'default-show',
    hostId: hostId || 'default-host',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    enablePredictions: true,
    enableAnalytics: true
  });

  // Update temp values when config changes
  useEffect(() => {
    setTempInterval(producerAI.config.analysisInterval);
    setTempMinWords(producerAI.config.minTranscriptLength);
  }, [producerAI.config]);

  // Automatic timer for show tracking (timestamp-based for precision)
  useEffect(() => {
    if (isTimerRunning && activePlan) {
      // Start timestamp if not already set
      if (!timerStartTimestamp) {
        setTimerStartTimestamp(Date.now());
      }

      // Update every second for smooth display
      timerRef.current = setInterval(() => {
        if (timerStartTimestamp) {
          // Calculate elapsed time from timestamp
          const elapsedMs = Date.now() - timerStartTimestamp;
          const elapsedMinutesFromStart = elapsedMs / 60000;
          const totalElapsed = Math.floor(accumulatedMinutes + elapsedMinutesFromStart);

          setShowElapsedMinutes(totalElapsed);

          // Auto-advance segments based on timing
          const timing = getCurrentSegmentTiming();
          if (timing && totalElapsed >= timing.endTime) {
            const nextSegmentIndex = currentSegmentIndex + 1;
            if (nextSegmentIndex < activePlan.segments.length) {
              setCurrentSegmentIndex(nextSegmentIndex);
            }
          }
        }
      }, 1000); // 1 second for better precision

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      // Timer paused - accumulate elapsed time
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (timerStartTimestamp && !isTimerRunning) {
        // Accumulate time before clearing timestamp
        const elapsedMs = Date.now() - timerStartTimestamp;
        const elapsedMinutesFromStart = elapsedMs / 60000;
        setAccumulatedMinutes(prev => prev + elapsedMinutesFromStart);
        setTimerStartTimestamp(null);
      }
    }
  }, [isTimerRunning, activePlan, currentSegmentIndex, timerStartTimestamp, accumulatedMinutes]);

  // Restore plan state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('active_plan_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setActivePlan(state.plan);
        setCurrentSegmentIndex(state.segmentIndex || 0);
        setShowElapsedMinutes(state.elapsedMinutes || 0);
        setIsTimerRunning(state.timerRunning || false);
        setAccumulatedMinutes(state.accumulatedMinutes || state.elapsedMinutes || 0);
        // Don't restore timestamp - it will be recreated if timer is running
      } catch (error) {
        console.error('Failed to restore plan state:', error);
      }
    }
  }, []);

  // Save plan state to localStorage on changes
  useEffect(() => {
    if (activePlan) {
      const state = {
        plan: activePlan,
        segmentIndex: currentSegmentIndex,
        elapsedMinutes: showElapsedMinutes,
        timerRunning: isTimerRunning,
        accumulatedMinutes: accumulatedMinutes,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('active_plan_state', JSON.stringify(state));
    } else {
      localStorage.removeItem('active_plan_state');
    }
  }, [activePlan, currentSegmentIndex, showElapsedMinutes, isTimerRunning, accumulatedMinutes]);

  // Sync plan state to Supabase (every 30 seconds when timer is running)
  useEffect(() => {
    if (!activePlan || !showId || !hostId) return;

    const syncToSupabase = async () => {
      try {
        // First check if row exists
        const { data: existingPlan, error: fetchError } = await supabase
          .from('show_plans')
          .select('id')
          .eq('show_id', showId)
          .eq('host_id', hostId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Row doesn't exist - this is expected on first sync before plan is saved
            console.warn('Plan not yet saved to database - skipping sync');
            return;
          }
          throw fetchError;
        }

        if (!existingPlan) {
          console.warn('Plan not found in database - skipping sync');
          return;
        }

        // Update show_plans table with current state
        // Store timer state in metadata to avoid corrupting current_plan structure
        const updatedMetadata = {
          ...(activePlan.metadata || {}),
          timerState: {
            currentSegmentIndex,
            elapsedMinutes: showElapsedMinutes,
            timerRunning: isTimerRunning,
            lastUpdated: new Date().toISOString()
          }
        };

        const { error } = await supabase
          .from('show_plans')
          .update({
            current_plan: activePlan.segments, // Only store segments array
            actual_engagement_curve: predictiveAI.showHealth?.engagementCurve || [],
            plan_effectiveness: predictiveAI.showHealth?.effectivenessScore || null,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('show_id', showId)
          .eq('host_id', hostId);

        if (error) {
          console.error('Failed to sync to Supabase:', error);
        }
      } catch (error) {
        console.error('Error syncing to Supabase:', error);
      }
    };

    // Sync immediately
    syncToSupabase();

    // Then sync every 30 seconds if timer is running
    if (isTimerRunning) {
      const syncInterval = setInterval(syncToSupabase, 30000);
      return () => clearInterval(syncInterval);
    }
  }, [activePlan, showId, hostId, currentSegmentIndex, showElapsedMinutes, isTimerRunning, predictiveAI.showHealth]);

  // Helper function to get current segment timing
  const getCurrentSegmentTiming = () => {
    if (!activePlan) return null;
    let startTime = 0;
    for (let i = 0; i < currentSegmentIndex; i++) {
      startTime += activePlan.segments[i]?.duration || 0;
    }
    const endTime = startTime + (activePlan.segments[currentSegmentIndex]?.duration || 0);
    return { startTime, endTime };
  };

  const toggleProducerAI = () => {
    producerAI.updateConfig({ enabled: !producerAI.isEnabled });
  };

  const saveSettings = () => {
    producerAI.updateConfig({
      analysisInterval: tempInterval,
      minTranscriptLength: tempMinWords
    });
    setShowSettings(false);
  };

  return (
    <div className="bg-black border-2 border-indigo-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Brain className="w-7 h-7 text-indigo-400" />
        Producer AI
        <span className="text-sm font-normal text-gray-400">(Background Analyst)</span>
        {producerAI.isEnabled && (
          <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded-full font-bold">AUTO</span>
        )}
      </h2>

      {/* Status Banner */}
      <div className={`mb-4 p-4 rounded-lg border-2 transition-all ${
        producerAI.isEnabled
          ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-400'
          : 'bg-gray-900 border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${
                producerAI.isAnalyzing ? 'bg-yellow-400 animate-pulse' :
                producerAI.isEnabled ? 'bg-green-400' :
                'bg-gray-600'
              }`} />
              <p className="text-xs text-indigo-300 font-semibold uppercase">
                {producerAI.isAnalyzing ? 'Analyzing Stream...' :
                 producerAI.isEnabled ? 'Listening to Stream' :
                 'Offline'}
              </p>
            </div>
            <p className="text-white font-bold text-lg">
              {producerAI.isEnabled ? 'Producer AI Active' : 'Producer AI Disabled'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {producerAI.isEnabled
                ? `Analyzing transcripts every ${producerAI.config.analysisInterval}s`
                : 'Controlled by AI Automation toggle in Show Metadata Control'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400 font-semibold">Analyses Run</span>
          </div>
          <p className="text-2xl font-bold text-white">{producerAI.analysisCount}</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400 font-semibold">Questions Generated</span>
          </div>
          <p className="text-2xl font-bold text-white">{producerAI.questionsGenerated}</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400 font-semibold">Quality</span>
          </div>
          <p className="text-lg font-bold text-white capitalize">{producerAI.config.questionQuality}</p>
        </div>
      </div>

      {/* NEW: Adaptive Timing Display */}
      {producerAI.isEnabled && producerAI.conversationState && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Adaptive Timing
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Conversation State:</span>
              <span className={`font-semibold ${
                producerAI.conversationState.type === 'rapid_exchange' ? 'text-orange-400' :
                producerAI.conversationState.type === 'topic_shift' ? 'text-purple-400' :
                producerAI.conversationState.type === 'silence' ? 'text-gray-400' :
                producerAI.conversationState.type === 'deep_discussion' ? 'text-blue-400' :
                'text-green-400'
              }`}>
                {producerAI.conversationState.type.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Words/Minute:</span>
              <span className="text-white font-semibold">{producerAI.conversationState.wordsPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Speaker Changes:</span>
              <span className="text-white font-semibold">{producerAI.conversationState.speakerChanges}</span>
            </div>
            {producerAI.nextAnalysisIn !== null && (
              <div className="flex justify-between pt-2 border-t border-blue-500/20">
                <span className="text-gray-400">Next Analysis:</span>
                <span className="text-blue-300 font-bold">{producerAI.nextAnalysisIn}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW Day 4: Rejected Questions Display */}
      {producerAI.rejectedQuestions && producerAI.rejectedQuestions.length > 0 && (
        <div className="mb-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Rejected Questions ({producerAI.rejectedQuestions.length})
          </h3>
          <div className="space-y-2">
            {producerAI.rejectedQuestions.slice(-3).reverse().map((rejected, idx) => (
              <div key={idx} className="p-2 bg-gray-900/50 rounded border border-orange-500/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-300 mb-1">{rejected.question}</p>
                    <p className="text-xs text-orange-400">
                      Reason: <span className="font-semibold">{rejected.reason}</span>
                      {rejected.reason === 'duplicate' && ' (similar question already exists)'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW Day 6: AI Coordinator Monitor */}
      <AICoordinatorMonitor />

      {/* Last Analysis */}
      {producerAI.lastAnalysis && (
        <div className="mb-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Latest Analysis
          </h3>
          <p className="text-white text-sm mb-2">
            <span className="font-semibold">Topic:</span> {producerAI.lastAnalysis.topic_summary}
          </p>

          {/* NEW: Reasoning Chain Display */}
          {producerAI.lastAnalysis.reasoning_chain && (
            <div className="mb-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <p className="text-xs font-semibold text-purple-300 mb-2">🧠 AI Reasoning Chain</p>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-400">State:</span>{' '}
                  <span className={`font-semibold ${
                    producerAI.lastAnalysis.reasoning_chain.conversation_state === 'deepening' ? 'text-green-400' :
                    producerAI.lastAnalysis.reasoning_chain.conversation_state === 'plateau' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {producerAI.lastAnalysis.reasoning_chain.conversation_state}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400">Momentum:</span>{' '}
                  <span className="text-gray-300">{producerAI.lastAnalysis.reasoning_chain.momentum_assessment}</span>
                </div>

                {producerAI.lastAnalysis.reasoning_chain.unexplored_angles.length > 0 && (
                  <div>
                    <span className="text-gray-400">Unexplored Angles:</span>
                    <ul className="list-disc list-inside text-gray-300 ml-2 mt-1">
                      {producerAI.lastAnalysis.reasoning_chain.unexplored_angles.map((angle, i) => (
                        <li key={i}>{angle}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {producerAI.lastAnalysis.key_points.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 font-semibold mb-1">Key Points:</p>
              <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                {producerAI.lastAnalysis.key_points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400">
            <span className="font-semibold">Generated:</span> {producerAI.lastAnalysis.questions.length} questions
          </p>

          {producerAI.lastAnalysis.segment_recommendation && (
            <div className={`mt-2 p-2 rounded text-xs ${
              producerAI.lastAnalysis.segment_recommendation.should_transition
                ? 'bg-orange-900/30 border border-orange-500/50 text-orange-300'
                : 'bg-green-900/30 border border-green-500/50 text-green-300'
            }`}>
              <span className="font-semibold">Segment Status:</span> {producerAI.lastAnalysis.segment_recommendation.reason}
            </div>
          )}
        </div>
      )}

      {/* NEW Phase 2: Multi-Model Results */}
      {producerAI.config.useMultiModel && producerAI.multiModelResult && (
        <div className="mb-4 p-4 bg-gradient-to-br from-cyan-900/20 to-teal-900/20 border border-cyan-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Multi-Model Generation (Phase 2)
          </h3>

          {/* Model Status Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* GPT-4o Status */}
            <div className={`p-2 rounded-lg border ${
              producerAI.multiModelResult.gpt4o
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                {producerAI.multiModelResult.gpt4o ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                )}
                <span className={producerAI.multiModelResult.gpt4o ? 'text-green-300' : 'text-red-300'}>
                  GPT-4o
                </span>
              </div>
              {producerAI.multiModelResult.gpt4o ? (
                <>
                  <div className="text-xs text-gray-400">
                    {producerAI.multiModelResult.gpt4o.questions.length} questions
                  </div>
                  <div className="text-xs text-gray-400">
                    {producerAI.multiModelResult.gpt4o.timing}ms
                  </div>
                  <div className="text-xs text-green-400 font-semibold">
                    ${producerAI.multiModelResult.gpt4o.cost.toFixed(4)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-red-400">
                  {producerAI.multiModelResult.errors['gpt-4o'] || 'Failed'}
                </div>
              )}
            </div>

            {/* Claude Status */}
            <div className={`p-2 rounded-lg border ${
              producerAI.multiModelResult.claude
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                {producerAI.multiModelResult.claude ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                )}
                <span className={producerAI.multiModelResult.claude ? 'text-green-300' : 'text-red-300'}>
                  Claude
                </span>
              </div>
              {producerAI.multiModelResult.claude ? (
                <>
                  <div className="text-xs text-gray-400">
                    {producerAI.multiModelResult.claude.questions.length} questions
                  </div>
                  <div className="text-xs text-gray-400">
                    {producerAI.multiModelResult.claude.timing}ms
                  </div>
                  <div className="text-xs text-green-400 font-semibold">
                    ${producerAI.multiModelResult.claude.cost.toFixed(4)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-red-400">
                  {producerAI.multiModelResult.errors['claude'] || 'Failed'}
                </div>
              )}
            </div>

            {/* Gemini Status */}
            <div className={`p-2 rounded-lg border ${
              producerAI.multiModelResult.gemini
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                {producerAI.multiModelResult.gemini ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                )}
                <span className={producerAI.multiModelResult.gemini ? 'text-green-300' : 'text-red-300'}>
                  Gemini
                </span>
              </div>
              {producerAI.multiModelResult.gemini ? (
                <>
                  <div className="text-xs text-gray-400">
                    {producerAI.multiModelResult.gemini.questions.length} questions
                  </div>
                  <div className="text-xs text-gray-400">
                    {producerAI.multiModelResult.gemini.timing}ms
                  </div>
                  <div className="text-xs text-green-400 font-semibold">
                    ${producerAI.multiModelResult.gemini.cost.toFixed(4)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-red-400">
                  {producerAI.multiModelResult.errors['gemini'] || 'Failed'}
                </div>
              )}
            </div>
          </div>

          {/* Total Stats */}
          <div className="flex items-center justify-between p-2 bg-cyan-900/20 border border-cyan-500/20 rounded-lg text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-400">Total Time:</span>{' '}
                <span className="text-white font-semibold">{producerAI.multiModelResult.totalTiming}ms</span>
              </div>
              <div>
                <span className="text-gray-400">Total Cost:</span>{' '}
                <span className="text-cyan-300 font-bold">${producerAI.multiModelResult.totalCost.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW Phase 2: Voted Questions Display */}
      {producerAI.config.useMultiModel && producerAI.votedQuestions.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Voted & Ranked Questions (Top {producerAI.votedQuestions.length})
          </h3>

          <div className="space-y-3">
            {producerAI.votedQuestions.slice(0, 5).map((vq, index) => (
              <div
                key={index}
                className="p-3 bg-black/30 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-colors"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-bold px-2 py-0.5 rounded ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-700 text-white'
                    }`}>
                      #{index + 1}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      vq.sourceModel === 'gpt-4o' ? 'bg-green-900/40 text-green-300' :
                      vq.sourceModel === 'claude' ? 'bg-orange-900/40 text-orange-300' :
                      'bg-blue-900/40 text-blue-300'
                    }`}>
                      {vq.sourceModel}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400">Final Score:</span>{' '}
                    <span className="text-purple-300 font-bold">{(vq.final_score * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-sm text-white mb-2 italic">"{vq.question.question_text}"</p>

                {/* Voting Scores */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-xs">
                    <span className="text-gray-400">GPT-4o:</span>{' '}
                    <span className="text-green-300 font-semibold">{(vq.votes.gpt4o_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400">Claude:</span>{' '}
                    <span className="text-orange-300 font-semibold">{(vq.votes.claude_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400">Gemini:</span>{' '}
                    <span className="text-blue-300 font-semibold">{(vq.votes.gemini_score * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Quality, Diversity & Novelty Breakdown (Phase 3) */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Quality:</span>{' '}
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${vq.votes.average * 100}%` }}
                      />
                    </div>
                    <span className="text-purple-300 font-semibold">{(vq.votes.average * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Diversity:</span>{' '}
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{ width: `${vq.diversity_score * 100}%` }}
                      />
                    </div>
                    <span className="text-pink-300 font-semibold">{(vq.diversity_score * 100).toFixed(0)}%</span>
                  </div>
                  {/* NEW Phase 3: Novelty Score */}
                  <div>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Novelty:
                    </span>{' '}
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          ((vq as any).novelty_score || 0.5) >= 0.7 ? 'bg-cyan-400' :
                          ((vq as any).novelty_score || 0.5) >= 0.5 ? 'bg-yellow-400' :
                          'bg-orange-400'
                        }`}
                        style={{ width: `${((vq as any).novelty_score || 0.5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold ${
                      ((vq as any).novelty_score || 0.5) >= 0.7 ? 'text-cyan-300' :
                      ((vq as any).novelty_score || 0.5) >= 0.5 ? 'text-yellow-300' :
                      'text-orange-300'
                    }`}>
                      {(((vq as any).novelty_score || 0.5) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW Phase 3: Context Memory Status */}
      {producerAI.config.useMultiModel && producerAI.contextMemoryStats && (
        <div className="mb-4 p-4 bg-gradient-to-br from-cyan-900/20 to-emerald-900/20 border border-cyan-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Context Memory (Phase 3)
            <span className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded-full font-bold">ACTIVE</span>
          </h3>

          {/* Memory Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-black/30 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <History className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400 font-semibold">Total Questions</span>
              </div>
              <p className="text-2xl font-bold text-white">{producerAI.contextMemoryStats.totalQuestions}</p>
              <p className="text-xs text-gray-500 mt-1">In memory cache</p>
            </div>

            <div className="p-3 bg-black/30 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-400 font-semibold">Recent Questions</span>
              </div>
              <p className="text-2xl font-bold text-white">{producerAI.contextMemoryStats.recentQuestions}</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 minutes</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-cyan-900/20 border border-cyan-500/10 rounded">
              <span className="text-gray-400">Show ID:</span>
              <span className="text-cyan-300 font-mono font-semibold">{producerAI.contextMemoryStats.showId || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-cyan-900/20 border border-cyan-500/10 rounded">
              <span className="text-gray-400">Cache Age:</span>
              <span className="text-white font-semibold">{producerAI.contextMemoryStats.cacheAge.toFixed(1)} minutes</span>
            </div>
            {producerAI.contextMemoryStats.totalQuestions > 0 && (
              <div className="flex justify-between items-center p-2 bg-emerald-900/20 border border-emerald-500/10 rounded">
                <span className="text-gray-400">Duplicate Prevention:</span>
                <span className="text-emerald-300 font-semibold">Enabled (80% threshold)</span>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-3 p-2 bg-cyan-900/10 border-t border-cyan-500/20 text-xs text-cyan-200">
            <p className="font-semibold mb-1">How Context Memory Works:</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-400">
              <li>Blocks questions &gt; 80% similar to recent history</li>
              <li>Penalizes questions 70-80% similar (reduces score)</li>
              <li>Boosts novel questions &lt; 60% similar</li>
              <li>Temporal decay: older questions have less impact</li>
            </ul>
          </div>
        </div>
      )}

      {/* NEW Phase 5: Predictive Intelligence Dashboard */}
      {showPhase5 && predictiveAI.isInitialized && (
        <div className="mb-4 p-4 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Predictive Intelligence (Phase 5)
              <span className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded-full font-bold">BETA</span>
            </h3>
            <button
              onClick={() => setShowPhase5(false)}
              className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              Hide
            </button>
          </div>

          {/* Prediction Dashboard */}
          <PredictionDashboard
            predictions={predictiveAI.predictions}
            showHealth={predictiveAI.showHealth || {
              overallScore: 0.5,
              engagementTrend: 'stable',
              pacingScore: 0.5,
              audienceRetention: 0.5,
              riskFactors: [],
              recommendations: []
            }}
            recommendations={predictiveAI.recommendations}
            onSelectQuestion={(question) => {
              // TODO: Integrate with show prep system
              console.log('Selected question:', question);
            }}
          />

          {/* Analytics Summary */}
          {predictiveAI.topPerformingTopics.length > 0 && (
            <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
              <h4 className="text-xs font-semibold text-indigo-300 mb-2">Top Performing Topics</h4>
              <div className="space-y-2">
                {predictiveAI.topPerformingTopics.slice(0, 3).map((topic, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-300">{topic.topic}</span>
                    <span className="text-indigo-400 font-semibold">
                      {(topic.avgEngagement * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-3 p-2 bg-purple-900/10 border-t border-purple-500/20 text-xs text-purple-200">
            <p className="font-semibold mb-1">Phase 5 Features:</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-400">
              <li>Predicts engagement before asking questions</li>
              <li>Real-time show health monitoring</li>
              <li>Learns from similar hosts across platform</li>
              <li>Analyzes success patterns and trends</li>
            </ul>
          </div>
        </div>
      )}

      {/* Phase 5 Enable Button */}
      {!showPhase5 && producerAI.isEnabled && (
        <button
          onClick={() => setShowPhase5(true)}
          className="mb-4 w-full py-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-800/50 hover:to-indigo-800/50 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          Enable Phase 5: Predictive Intelligence
          <span className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded-full">BETA</span>
        </button>
      )}

      {/* NEW Phase 6.1: Show Plan Management */}
      {showPhase6 && (
        <div className="mb-4 p-4 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Show Plan Management (Phase 6.1)
            </h3>
            <button
              onClick={() => setShowPhase6(false)}
              className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              Hide
            </button>
          </div>

          {/* Action Buttons */}
          {!activePlan && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setShowImportModal(true)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Plan
              </button>
              <button
                onClick={() => setShowPlanSelector(!showPlanSelector)}
                className="py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                {showPlanSelector ? 'Hide' : 'Select'} Plan
              </button>
            </div>
          )}

          {/* Plan Selector */}
          {showPlanSelector && !activePlan && (
            <div className="mb-4">
              <ShowPlanSelector
                onSelect={(plan) => {
                  setActivePlan(plan);
                  setShowPlanSelector(false);
                  setCurrentSegmentIndex(0);
                  setShowElapsedMinutes(0);
                  setIsTimerRunning(true); // Auto-start timer
                  // Start show in context
                  startShow(plan.show_id, plan.metadata?.title || 'Untitled Show');
                }}
              />
            </div>
          )}

          {/* Active Plan Viewer */}
          {activePlan && (
            <div>
              <div className="flex items-center justify-between mb-3 p-2 bg-emerald-900/30 border border-emerald-500/30 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300 font-semibold">
                    Active Plan: {activePlan.metadata?.title}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActivePlan(null);
                    setCurrentSegmentIndex(0);
                    setShowElapsedMinutes(0);
                    setIsTimerRunning(false); // Stop timer
                    endShow();
                  }}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  End Show
                </button>
              </div>

              <ShowPlanViewer
                plan={activePlan}
                currentSegmentIndex={currentSegmentIndex}
                elapsedMinutes={showElapsedMinutes}
                currentEngagement={predictiveAI.showHealth?.currentEngagement || 0}
                onSegmentSelect={(index) => setCurrentSegmentIndex(index)}
              />

              {/* Timer Controls */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`flex-1 px-3 py-2 text-sm font-semibold rounded transition-colors flex items-center justify-center gap-2 ${
                      isTimerRunning
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause Timer
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Timer
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowElapsedMinutes(prev => Math.max(0, prev - 1));
                      setAccumulatedMinutes(prev => Math.max(0, prev - 1));
                    }}
                    className="text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    -1 min
                  </button>
                  <button
                    onClick={() => {
                      setShowElapsedMinutes(prev => prev + 1);
                      setAccumulatedMinutes(prev => prev + 1);
                    }}
                    className="text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    +1 min
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-3 p-2 bg-emerald-900/10 border-t border-emerald-500/20 text-xs text-emerald-200">
            <p className="font-semibold mb-1">Phase 6.1 Features:</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-400">
              <li>Import pre-planned shows from Abe I Stream</li>
              <li>Real-time tracking against planned segments</li>
              <li>Engagement comparison (predicted vs actual)</li>
              <li>Deviation warnings (ahead/behind schedule)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Phase 6.1 Enable Button */}
      {!showPhase6 && producerAI.isEnabled && (
        <button
          onClick={() => setShowPhase6(true)}
          className="mb-4 w-full py-3 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 hover:from-emerald-800/50 hover:to-teal-800/50 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Enable Phase 6.1: Show Plan Management
        </button>
      )}

      {/* Import Plan Modal */}
      <ImportPlanModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(importedShowId) => {
          console.log('Plan imported:', importedShowId);
          setShowImportModal(false);
          // Optionally refresh the plan selector or auto-select the imported plan
        }}
      />

      {/* Error Display */}
      {producerAI.error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{producerAI.error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>

        <button
          onClick={producerAI.manualAnalyze}
          disabled={producerAI.isAnalyzing || !producerAI.isEnabled}
          className="py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Analyze Now
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Producer AI Configuration
          </h3>

          {/* Analysis Interval */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-2">
              <Clock className="w-3 h-3 inline mr-1" />
              Analysis Interval (seconds)
            </label>
            <input
              type="number"
              value={tempInterval}
              onChange={(e) => setTempInterval(parseInt(e.target.value) || 60)}
              min="30"
              max="600"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">How often to analyze transcripts (30-600 seconds)</p>
          </div>

          {/* Minimum Words */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-2">
              Minimum Words Required
            </label>
            <input
              type="number"
              value={tempMinWords}
              onChange={(e) => setTempMinWords(parseInt(e.target.value) || 50)}
              min="50"
              max="500"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Skip analysis if transcripts are too short</p>
          </div>

          {/* Quality Threshold */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-2">
              Question Quality Filter
            </label>
            <select
              value={producerAI.config.questionQuality}
              onChange={(e) => producerAI.updateConfig({ questionQuality: e.target.value as 'high' | 'medium' | 'low' })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="high">High (80%+ confidence)</option>
              <option value="medium">Medium (60%+ confidence)</option>
              <option value="low">Low (40%+ confidence)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Only add questions that meet this threshold</p>
          </div>

          {/* Auto-add Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
            <div>
              <p className="text-sm text-white font-semibold">Auto-add to Queue</p>
              <p className="text-xs text-gray-400">Automatically add questions to show prep</p>
            </div>
            <button
              onClick={() => producerAI.updateConfig({ autoAddToQueue: !producerAI.config.autoAddToQueue })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                producerAI.config.autoAddToQueue ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  producerAI.config.autoAddToQueue ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      )}

      {/* AI Automation Notice */}
      <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded text-sm text-purple-300">
        <p className="font-semibold">🤖 AI Automation Control</p>
        <p className="text-xs mt-1">
          This AI is automatically controlled by the <span className="font-bold">AI Automation</span> toggle in Show Metadata Control.
          When you flip that master switch, all AI features (Producer AI, Auto Director, etc.) turn on/off together.
        </p>
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-sm text-indigo-300">
        <p className="font-semibold">🤖 What Producer AI Does:</p>
        <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
          <li>Listens to stream transcripts in background</li>
          <li>Analyzes conversation flow every {producerAI.config.analysisInterval}s</li>
          <li>Generates intelligent follow-up questions</li>
          <li>Suggests when to transition segments</li>
          <li>Does NOT respond to direct questions (that's BetaBot's job)</li>
        </ul>
      </div>
    </div>
  );
}
