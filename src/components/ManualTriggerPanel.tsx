import { useState } from 'react'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import {
  Hand,
  Smile,
  Zap,
  Eye,
  EyeOff,
  MessageSquare,
  Layers,
  Type,
  PlayCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export function ManualTriggerPanel() {
  const automation = useAutomationEngine()
  const [expandedSection, setExpandedSection] = useState<string | null>('betabot')

  const triggerBetaBotMood = async (mood: string, intensity: number) => {
    await automation.manualTrigger('betabot.mood', { mood, intensity })
  }

  const triggerBetaBotMovement = async (movement: string) => {
    await automation.manualTrigger('betabot.movement', { movement })
  }

  const triggerGraphic = async (graphicType: string, show: boolean) => {
    await automation.manualTrigger(show ? 'graphic.show' : 'graphic.hide', {
      graphic_type: graphicType
    })
  }

  const triggerQuestionIndicator = async (show: boolean) => {
    await automation.manualTrigger('question.indicate', { show })
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const Section = ({ id, title, icon: Icon, children }: any) => {
    const isExpanded = expandedSection === id

    return (
      <div className="border-2 border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-3 bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 bg-gray-800 space-y-2">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Hand className="w-5 h-5 text-purple-400" />
          Manual Trigger Testing
        </h3>
        <div className="text-xs text-gray-400">
          Click to trigger automation actions
        </div>
      </div>

      {!automation.isEnabled && (
        <div className="mb-4 p-3 bg-yellow-900/20 border-2 border-yellow-500/50 rounded-lg">
          <div className="text-sm text-yellow-400">
            ⚠️ Automation is disabled. Enable it in the control panel above to see triggers in action.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* BetaBot Moods */}
        <Section id="betabot" title="BetaBot Moods" icon={Smile}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => triggerBetaBotMood('calm', 3)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              😌 Calm
            </button>
            <button
              onClick={() => triggerBetaBotMood('excited', 8)}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              🤩 Excited
            </button>
            <button
              onClick={() => triggerBetaBotMood('thoughtful', 5)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              🤔 Thoughtful
            </button>
            <button
              onClick={() => triggerBetaBotMood('playful', 7)}
              className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              😄 Playful
            </button>
            <button
              onClick={() => triggerBetaBotMood('serious', 6)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              😐 Serious
            </button>
          </div>
        </Section>

        {/* BetaBot Movements */}
        <Section id="movement" title="BetaBot Movements" icon={Zap}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => triggerBetaBotMovement('idle')}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Idle
            </button>
            <button
              onClick={() => triggerBetaBotMovement('nodding')}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Nodding
            </button>
            <button
              onClick={() => triggerBetaBotMovement('gesturing')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Gesturing
            </button>
            <button
              onClick={() => triggerBetaBotMovement('leaning')}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Leaning
            </button>
          </div>
        </Section>

        {/* Question Indicator */}
        <Section id="indicator" title="Question Indicator" icon={MessageSquare}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerQuestionIndicator(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Show Indicator
            </button>
            <button
              onClick={() => triggerQuestionIndicator(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              Hide Indicator
            </button>
          </div>
        </Section>

        {/* Graphics Control */}
        <Section id="graphics" title="Graphics Control" icon={Layers}>
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">
              Test showing/hiding broadcast graphics
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerGraphic('logo', true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Show Logo
              </button>
              <button
                onClick={() => triggerGraphic('logo', false)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <EyeOff className="w-4 h-4" />
                Hide Logo
              </button>
            </div>
          </div>
        </Section>

        {/* Test All Actions */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={async () => {
              // Fire multiple actions in sequence to test the system
              await triggerBetaBotMood('excited', 8)
              setTimeout(() => triggerQuestionIndicator(true), 500)
              setTimeout(() => triggerBetaBotMovement('gesturing'), 1000)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg"
          >
            <PlayCircle className="w-5 h-5" />
            Test All Actions (Demo Sequence)
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Triggers: Excited mood → Question indicator → Gesturing movement
          </p>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{automation.recentEvents.length}</div>
          <div className="text-xs text-gray-400">Recent Events</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">{automation.pendingDecisions.length}</div>
          <div className="text-xs text-gray-400">Pending</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${automation.isEnabled ? 'text-green-400' : 'text-gray-500'}`}>
            {automation.isEnabled ? 'ON' : 'OFF'}
          </div>
          <div className="text-xs text-gray-400">Status</div>
        </div>
      </div>
    </div>
  )
}
