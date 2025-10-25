import { Sparkles, Brain, Target, Settings, BarChart3 } from 'lucide-react'
import { ErrorBoundary } from './ErrorBoundary'
import { AutomationConfigPanel } from './AutomationConfigPanel'
import { OBSConnectionPanel } from './OBSConnectionPanel'
import { TranscriptionPanel } from './TranscriptionPanel'
import { AIAnalysisPanel } from './AIAnalysisPanel'
import { SuggestionApprovalPanel } from './SuggestionApprovalPanel'
import { ExecutionHistoryPanel } from './ExecutionHistoryPanel'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { ManualTriggerPanel } from './ManualTriggerPanel'
import { TriggerRulesPanel } from './TriggerRulesPanel'
import { AutomationFeedPanel } from './AutomationFeedPanel'
import { ProducerAIPanel } from './ProducerAIPanel'

export function AITab() {
  return (
    <div className="space-y-8">
      {/* AI Tab Header */}
      <div className="bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-2 border-yellow-600/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-amber-600 rounded-lg flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🤖 AI Automation & Intelligence
              <span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded-full font-bold">BETA</span>
            </h2>
            <p className="text-gray-300">Consolidated AI automation, analysis, and intelligence systems</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">Smart production automation</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">Context-aware AI analysis</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">Real-time insights & metrics</span>
          </div>
        </div>
      </div>

      {/* Section 1: AI Core Systems */}
      <ErrorBoundary sectionName="AI Core Systems">
        <div>
          <h3 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wide flex items-center gap-2">
            🤖 AI Core Systems
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2"><AutomationConfigPanel /></div>
            <div className="lg:col-span-2"><OBSConnectionPanel /></div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Section 2: Producer Intelligence */}
      <ErrorBoundary sectionName="Producer Intelligence">
        <div>
          <h3 className="text-xl font-bold text-purple-400 mb-4 uppercase tracking-wide flex items-center gap-2">
            <Target className="w-6 h-6" />
            Producer Intelligence
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div><ProducerAIPanel /></div>
            <div><TranscriptionPanel /></div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Section 3: Context & Analysis */}
      <ErrorBoundary sectionName="Context & Analysis">
        <div>
          <h3 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Context & Analysis
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2"><AIAnalysisPanel /></div>
            <div className="lg:col-span-2"><SuggestionApprovalPanel /></div>
            <div className="lg:col-span-2"><ExecutionHistoryPanel /></div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Section 4: Automation Rules */}
      <ErrorBoundary sectionName="Automation Rules">
        <div>
          <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wide flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Automation Rules
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2"><TriggerRulesPanel /></div>
            <div className="lg:col-span-2"><ManualTriggerPanel /></div>
            <div className="lg:col-span-2"><AutomationFeedPanel /></div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Section 5: Analytics & Insights */}
      <ErrorBoundary sectionName="Analytics & Insights">
        <div>
          <h3 className="text-xl font-bold text-cyan-400 mb-4 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics & Insights
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div><AnalyticsDashboard /></div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  )
}
