import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import type { AIAnalysisResult, SuggestedAction } from '../lib/ai/AIContextAnalyzer'
import {
  Sparkles,
  Brain,
  TrendingUp,
  MessageSquare,
  Zap,
  Settings,
  Play,
  AlertCircle,
  CheckCircle2,
  Activity
} from 'lucide-react'

export function AIAnalysisPanel() {
  const { aiAnalyzer, transcriptListener } = useAutomationEngine()
  const [lastAnalysis, setLastAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [provider, setProvider] = useState<'mock' | 'openai' | 'anthropic'>('mock')
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiAutomationEnabled, setAiAutomationEnabled] = useState(false)

  // Watch for AI Automation toggle
  useEffect(() => {
    const loadAIAutomation = async () => {
      const { data } = await supabase
        .from('show_metadata')
        .select('auto_advance_enabled')
        .single()

      if (data) {
        setAiAutomationEnabled(data.auto_advance_enabled)
      }
    }

    loadAIAutomation()

    const channel = supabase
      .channel('ai_analysis_metadata_sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'show_metadata'
      }, (payload) => {
        const newValue = payload.new.auto_advance_enabled
        if (newValue !== undefined) {
          console.log(`🤖 AI Analyzer: AI Automation toggled to ${newValue ? 'ON' : 'OFF'}`)
          setAiAutomationEnabled(newValue)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Poll for analysis updates
  useEffect(() => {
    if (!aiAnalyzer) return

    const updateAnalysis = () => {
      const status = aiAnalyzer.getStatus()
      setIsAnalyzing(status.isAnalyzing)
      setLastAnalysis(status.lastAnalysis)
    }

    // Set up callback for new analyses
    const unsubscribe = aiAnalyzer.onAnalysis((result: AIAnalysisResult) => {
      setLastAnalysis(result)
    })

    updateAnalysis()
    const interval = setInterval(updateAnalysis, 1000)

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [aiAnalyzer])

  const handleAnalyze = async () => {
    if (!aiAnalyzer || !transcriptListener) {
      setError('AI Analyzer or Transcript Listener not available')
      return
    }

    try {
      setError(null)
      setIsAnalyzing(true)

      // Get recent transcript segments
      const segments = transcriptListener.getSegments(10)
      const transcripts = segments
        .filter(s => s.isFinal)
        .map(s => s.transcript)

      if (transcripts.length === 0) {
        setError('No transcript available. Start transcription first.')
        setIsAnalyzing(false)
        return
      }

      // Trigger analysis
      const result = await aiAnalyzer.analyze({
        recentTranscripts: transcripts,
        showDuration: 0, // TODO: Track show duration
        participantCount: 1 // TODO: Track participant count
      })

      setLastAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUpdateProvider = () => {
    if (!aiAnalyzer) return

    aiAnalyzer.updateConfig({
      provider,
      apiKey: apiKey || undefined
    })

    setShowSettings(false)
  }

  const getSentimentColor = (sentiment: AIAnalysisResult['sentiment']) => {
    switch (sentiment) {
      case 'very_positive': return 'text-green-400'
      case 'positive': return 'text-green-300'
      case 'neutral': return 'text-gray-400'
      case 'negative': return 'text-orange-400'
      case 'very_negative': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSentimentBg = (sentiment: AIAnalysisResult['sentiment']) => {
    switch (sentiment) {
      case 'very_positive': return 'bg-green-500/20 border-green-500/50'
      case 'positive': return 'bg-green-500/10 border-green-500/30'
      case 'neutral': return 'bg-gray-500/10 border-gray-500/30'
      case 'negative': return 'bg-orange-500/10 border-orange-500/30'
      case 'very_negative': return 'bg-red-500/20 border-red-500/50'
      default: return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const getEngagementColor = (engagement: AIAnalysisResult['engagement']) => {
    switch (engagement) {
      case 'very_high': return 'text-purple-400'
      case 'high': return 'text-blue-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          AI Context Analysis
          {aiAutomationEnabled && (
            <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
              AUTO
            </span>
          )}
          {isAnalyzing && (
            <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              Analyzing...
            </span>
          )}
          {!isAnalyzing && lastAnalysis && !aiAutomationEnabled && (
            <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs font-semibold rounded-full">
              Ready
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <h4 className="text-sm font-bold text-white mb-3">AI Provider Settings</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              >
                <option value="mock">Mock (Testing)</option>
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            {(provider === 'openai' || provider === 'anthropic') && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                />
              </div>
            )}

            <button
              onClick={handleUpdateProvider}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition-colors"
            >
              Update Provider
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Automation Notice */}
      <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded text-sm text-purple-300">
        <p className="font-semibold">🤖 AI Automation Control</p>
        <p className="text-xs mt-1">
          This analyzer is controlled by the <span className="font-bold">AI Automation</span> toggle in Show Metadata Control.
          When enabled, context analysis runs automatically.
        </p>
      </div>

      {/* Analyze Button - Only available when automation is OFF */}
      {!aiAutomationEnabled && (
        <div className="mb-4">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
          </button>
        </div>
      )}

      {/* Help Text */}
      {!lastAnalysis && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-300">
          <p className="mb-2"><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Start transcription and speak for a few seconds</li>
            <li>Click "Analyze Now" to process conversation context</li>
            <li>AI detects sentiment, topic, and engagement level</li>
            <li>Suggested actions appear for approval/execution</li>
          </ul>
        </div>
      )}

      {/* Analysis Results */}
      {lastAnalysis && (
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Sentiment */}
            <div className={`p-3 border rounded-lg ${getSentimentBg(lastAnalysis.sentiment)}`}>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className={`w-4 h-4 ${getSentimentColor(lastAnalysis.sentiment)}`} />
                <span className="text-xs text-gray-400">Sentiment</span>
              </div>
              <div className={`text-sm font-bold ${getSentimentColor(lastAnalysis.sentiment)}`}>
                {lastAnalysis.sentiment.replace('_', ' ')}
              </div>
            </div>

            {/* Topic */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Topic</span>
              </div>
              <div className="text-sm font-bold text-blue-400 truncate">
                {lastAnalysis.topic}
              </div>
            </div>

            {/* Engagement */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className={`w-4 h-4 ${getEngagementColor(lastAnalysis.engagement)}`} />
                <span className="text-xs text-gray-400">Engagement</span>
              </div>
              <div className={`text-sm font-bold ${getEngagementColor(lastAnalysis.engagement)}`}>
                {lastAnalysis.engagement.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Confidence</span>
              <span className="text-sm font-bold text-white">
                {Math.round(lastAnalysis.confidence * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${lastAnalysis.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Reasoning */}
          <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400">Analysis</span>
            </div>
            <p className="text-sm text-gray-300">{lastAnalysis.reasoning}</p>
          </div>

          {/* NEW: Aspect-Based Sentiment */}
          {lastAnalysis.aspects && lastAnalysis.aspects.length > 0 && (
            <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">
                  Aspect-Based Sentiment ({lastAnalysis.aspects.length} topics)
                </span>
              </div>
              <div className="space-y-3">
                {lastAnalysis.aspects.map((aspect, index) => (
                  <div key={index} className="p-3 bg-black/30 border border-indigo-500/20 rounded-lg">
                    {/* Aspect Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{aspect.topic}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getSentimentBg(aspect.sentiment)}`}>
                          <span className={getSentimentColor(aspect.sentiment)}>
                            {aspect.sentiment.replace('_', ' ')}
                          </span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{Math.round(aspect.confidence * 100)}%</span>
                    </div>

                    {/* Key Phrases */}
                    {aspect.keyPhrases.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-400">Key phrases: </span>
                        <span className="text-xs text-gray-300 italic">
                          {aspect.keyPhrases.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Speaker Positions */}
                    {aspect.speakerPositions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-400 font-semibold">Speaker positions:</span>
                        {aspect.speakerPositions.map((position, pIndex) => (
                          <div key={pIndex} className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{position.speaker}:</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${
                                position.stance === 'strongly_for' ? 'text-green-400' :
                                position.stance === 'for' ? 'text-green-300' :
                                position.stance === 'neutral' ? 'text-gray-400' :
                                position.stance === 'against' ? 'text-orange-300' :
                                'text-red-400'
                              }`}>
                                {position.stance.replace('_', ' ')}
                              </span>
                              <span className="text-gray-500">({Math.round(position.confidence * 100)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW: Emotion Detection */}
          {lastAnalysis.emotions && lastAnalysis.emotions.length > 0 && (
            <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">
                  Detected Emotions ({lastAnalysis.emotions.length})
                </span>
              </div>
              <div className="space-y-2">
                {lastAnalysis.emotions.map((emotion, index) => (
                  <div key={index} className="p-2 bg-black/30 border border-purple-500/20 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${
                        emotion.emotion === 'joy' || emotion.emotion === 'excitement' ? 'text-green-400' :
                        emotion.emotion === 'surprise' || emotion.emotion === 'curiosity' ? 'text-blue-400' :
                        emotion.emotion === 'concern' ? 'text-yellow-400' :
                        emotion.emotion === 'frustration' || emotion.emotion === 'anger' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {emotion.emotion}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              emotion.emotion === 'joy' || emotion.emotion === 'excitement' ? 'bg-green-400' :
                              emotion.emotion === 'surprise' || emotion.emotion === 'curiosity' ? 'bg-blue-400' :
                              emotion.emotion === 'concern' ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${emotion.intensity * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{Math.round(emotion.intensity * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">{emotion.trigger}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW: Conversation Dynamics */}
          {lastAnalysis.dynamics && (
            <div className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Conversation Dynamics</span>
              </div>
              <div className="space-y-3">
                {/* Agreement Level */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Agreement Level</span>
                    <span className="text-xs font-semibold text-white">
                      {Math.round(lastAnalysis.dynamics.agreement_level * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${lastAnalysis.dynamics.agreement_level * 100}%` }}
                    />
                  </div>
                </div>

                {/* Tension Level */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Tension Level</span>
                    <span className="text-xs font-semibold text-white">
                      {Math.round(lastAnalysis.dynamics.tension * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-orange-400 h-2 rounded-full transition-all"
                      style={{ width: `${lastAnalysis.dynamics.tension * 100}%` }}
                    />
                  </div>
                </div>

                {/* Momentum */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Momentum</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    lastAnalysis.dynamics.momentum === 'building' ? 'bg-green-900/40 text-green-400' :
                    lastAnalysis.dynamics.momentum === 'steady' ? 'bg-blue-900/40 text-blue-400' :
                    'bg-red-900/40 text-red-400'
                  }`}>
                    {lastAnalysis.dynamics.momentum}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {lastAnalysis.suggestedActions.length > 0 && (
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">
                  Suggested Actions ({lastAnalysis.suggestedActions.length})
                </span>
              </div>
              <div className="space-y-2">
                {lastAnalysis.suggestedActions.map((action: SuggestedAction, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">
                          {action.actionType}
                        </div>
                        <div className="text-xs text-gray-400">
                          {action.reasoning}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                        <CheckCircle2 className="w-3 h-3" />
                        {Math.round(action.confidence * 100)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {JSON.stringify(action.actionData)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastAnalysis.suggestedActions.length === 0 && (
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center text-sm text-gray-500">
              No actions suggested for current context
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Note:</strong> AI analysis uses recent transcript segments to understand conversation context.</p>
        <p className="mt-1">Provider: <span className="text-purple-400 font-semibold">{provider}</span> (change in Settings)</p>
      </div>
    </div>
  )
}
