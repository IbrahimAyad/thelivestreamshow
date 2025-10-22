/**
 * AI Training Panel
 * UI for controlling and monitoring the AI DJ training system
 */

import { Brain, TrendingUp, Target, Zap, Download, Upload, RotateCcw, Play, Pause } from 'lucide-react';
import { useAIDJ } from '@/hooks/studio/useAIDJ';
import { TrainingMode } from '@/utils/studio/aiTrainingManager';
import { MixingStyle } from '@/utils/studio/aiDecisionEngine';

interface AITrainingPanelProps {
  className?: string;
}

export function AITrainingPanel({ className = '' }: AITrainingPanelProps) {
  const {
    aiState: state,
    aiConfig: config,
    aiStatistics: statistics,
    startTraining: start,
    stopTraining: stop,
    setMode,
    setMixingStyle,
    setConfidenceThreshold,
    setAutoApply,
    approveDecision,
    rejectDecision,
    startAutonomousMode,
    stopAutonomousMode,
    executeAIDecision,
    isAutomating,
    getSessionStats,
    reset,
    exportData,
    importData,
  } = useAIDJ();

  const handleExport = () => {
    const data = exportData();
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-training-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            importData(json);
          } catch (error) {
            console.error('Failed to import AI training data:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Reset all AI training data? This cannot be undone.')) {
      reset();
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          AI Training System
        </h3>
        <p className="text-xs text-gray-500">
          Autonomous DJ that learns from your mixing style
        </p>
      </div>

      {/* Training Status */}
      <div
        className={`mb-4 p-3 rounded-lg border ${
          state.isActive
            ? 'bg-purple-900/20 border-purple-500'
            : 'bg-gray-800 border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">
            Training Status
          </span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                state.isActive ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                state.isActive ? 'text-purple-400' : 'text-gray-500'
              }`}
            >
              {state.isActive ? 'Learning' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{(state.trainingProgress * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${state.trainingProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-gray-500">Events</div>
            <div className="text-white font-medium">{statistics.totalEvents}</div>
          </div>
          <div>
            <div className="text-gray-500">Patterns</div>
            <div className="text-white font-medium">
              {statistics.patternsDiscovered}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Accuracy</div>
            <div className="text-white font-medium">
              {(state.accuracy * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Training Mode */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Training Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['passive', 'active', 'autonomous'] as TrainingMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                config.mode === mode
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          {config.mode === 'passive' &&
            'Observe and learn - no suggestions'}
          {config.mode === 'active' &&
            'Provide suggestions - user approves'}
          {config.mode === 'autonomous' &&
            'Full control - AI mixes automatically'}
        </p>
      </div>

      {/* Mixing Style */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Mixing Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['smooth', 'energetic', 'technical', 'minimal'] as MixingStyle[]).map(
            (style) => (
              <button
                key={style}
                onClick={() => setMixingStyle(style)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  statistics.preferences?.preferredMixingStyle === style
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Confidence Threshold */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Confidence Threshold: {(config.confidenceThreshold * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.confidenceThreshold * 100}
          onChange={(e) => setConfidenceThreshold(parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <p className="text-[10px] text-gray-500 mt-1">
          AI only suggests when {(config.confidenceThreshold * 100).toFixed(0)}%+ certain
        </p>
      </div>

      {/* Auto-Apply Toggle */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-xs font-medium text-gray-300">Auto-Apply Decisions</div>
            <div className="text-[10px] text-gray-500">
              Let AI execute decisions automatically
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={config.autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </div>
        </label>
      </div>

      {/* Autonomous Mode Controls */}
      {config.mode === 'autonomous' && (
        <div className="mb-4">
          <button
            onClick={isAutomating ? stopAutonomousMode : startAutonomousMode}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isAutomating
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isAutomating ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Stop Autonomous DJ</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Autonomous DJ</span>
              </>
            )}
          </button>
          {isAutomating && (
            <div className="mt-2 p-2 bg-green-900/20 border border-green-500 rounded text-xs text-green-400 text-center animate-pulse">
              🤖 AI is actively DJing...
            </div>
          )}
        </div>
      )}

      {/* Current Suggestion */}
      {state.currentSuggestion && (
        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-purple-300 mb-1">
                AI Suggestion
              </div>
              <div className="text-xs text-purple-200">
                {state.currentSuggestion}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={approveDecision}
              className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
            >
              ✓ Approve
            </button>
            <button
              onClick={executeAIDecision}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
              ▶ Execute
            </button>
            <button
              onClick={rejectDecision}
              className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      )}

      {/* Training Stats */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <div className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
          <TrendingUp className="w-3 h-3" />
          Training Statistics
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Session Duration</span>
            <span className="text-white">
              {formatDuration(statistics.sessionDuration)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Approval Rate</span>
            <span className="text-white">
              {(statistics.approvalRate * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Actions</span>
            <span className="text-white">{state.totalActions}</span>
          </div>
        </div>
      </div>

      {/* Most Common Actions */}
      {statistics.mostCommonActions?.length > 0 && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Target className="w-3 h-3" />
            Top Actions
          </div>
          <div className="space-y-1">
            {statistics.mostCommonActions.slice(0, 3).map((action: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-400">{action.action}</span>
                <span className="text-white font-medium">{action.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="mb-4">
        <button
          onClick={state.isActive ? stop : start}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
            state.isActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30'
          }`}
        >
          {state.isActive ? 'Stop Training' : 'Start Training'}
        </button>
      </div>

      {/* Import/Export/Reset */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleImport}
          className="flex items-center justify-center gap-1 py-2 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium"
          title="Import training data"
        >
          <Upload className="w-3 h-3" />
          <span>Import</span>
        </button>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1 py-2 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium"
          title="Export training data"
        >
          <Download className="w-3 h-3" />
          <span>Export</span>
        </button>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-1 py-2 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium"
          title="Reset all training"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Session Stats */}
      {state.isActive && (() => {
        const sessionStats = getSessionStats();
        return sessionStats ? (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-xs font-medium text-gray-300 mb-2">
              📊 Session Statistics
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="text-white">{sessionStats.sessionDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tracks Played</span>
                <span className="text-white">{sessionStats.tracksPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Energy</span>
                <span className="text-white">{(sessionStats.avgEnergy * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mix Quality</span>
                <span className="text-white">{(sessionStats.mixQuality * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actions/Min</span>
                <span className="text-white">{sessionStats.actionsPerMinute.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400 space-y-2">
        <div className="font-medium text-gray-300">🧠 How AI Training Works:</div>
        <ol className="space-y-1 list-decimal list-inside text-[10px]">
          <li>AI observes your mixing decisions</li>
          <li>Learns patterns and preferences</li>
          <li>Suggests actions based on context</li>
          <li>Adapts from your feedback</li>
          <li>Gets smarter with more use</li>
        </ol>
      </div>
    </div>
  );
}
