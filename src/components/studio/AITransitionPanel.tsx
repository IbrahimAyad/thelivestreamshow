/**
 * AI Transition Feedback Panel
 * Shows upcoming transition plan and allows manual override
 */

import React from 'react'
import type { TransitionState } from '@/hooks/studio/useEnhancedAutoDJ'

interface AITransitionPanelProps {
  transition: TransitionState
  aiEnabled: boolean
  onToggleAI: () => void
  onCancelTransition?: () => void
}

export function AITransitionPanel({ 
  transition, 
  aiEnabled, 
  onToggleAI,
  onCancelTransition 
}: AITransitionPanelProps) {
  const getTransitionLabel = (type: string | null) => {
    switch (type) {
      case 'bass_swap': return 'Bass Swap'
      case 'filter_sweep': return 'Filter Sweep'
      case 'echo_out': return 'Echo Out'
      case 'reverb_tail': return 'Reverb Tail'
      case 'quick_cut': return 'Quick Cut'
      default: return 'Simple Crossfade'
    }
  }
  
  const getTransitionColor = (type: string | null) => {
    switch (type) {
      case 'bass_swap': return 'text-blue-400'
      case 'filter_sweep': return 'text-purple-400'
      case 'echo_out': return 'text-green-400'
      case 'reverb_tail': return 'text-cyan-400'
      case 'quick_cut': return 'text-yellow-400'
      default: return 'text-neutral-400'
    }
  }
  
  return (
    <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Transition Intelligence
        </h3>
        
        <button
          onClick={onToggleAI}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            aiEnabled
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
          }`}
        >
          {aiEnabled ? 'AI: ON' : 'AI: OFF'}
        </button>
      </div>
      
      {!aiEnabled && (
        <div className="text-center py-6 text-neutral-400">
          <p className="text-sm">AI Transitions disabled</p>
          <p className="text-xs mt-1">Enable to use professional DJ techniques</p>
        </div>
      )}
      
      {aiEnabled && !transition.isActive && (
        <div className="text-center py-6 text-neutral-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-sm">Waiting for next track...</p>
          <p className="text-xs mt-1">AI will analyze and prepare transition at 75%</p>
        </div>
      )}
      
      {aiEnabled && transition.isActive && (
        <div className="space-y-4">
          {/* Transition Type */}
          <div className="bg-neutral-900 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">Next Transition:</span>
              <span className={`text-lg font-bold ${getTransitionColor(transition.type)}`}>
                {getTransitionLabel(transition.type)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Deck {transition.fromDeck} → Deck {transition.toDeck}</span>
              <span>{transition.duration}s duration</span>
            </div>
          </div>
          
          {/* Transition Plan Details */}
          {transition.plan && (
            <div className="space-y-2">
              {/* EQ Automation */}
              {transition.plan.eqTimeline.length > 0 && (
                <div className="bg-neutral-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="text-xs font-medium text-neutral-300">EQ Automation</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {transition.plan.eqTimeline.length} keyframes
                  </div>
                </div>
              )}
              
              {/* FX Automation */}
              {transition.plan.fxTimeline.length > 0 && (
                <div className="bg-neutral-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-medium text-neutral-300">FX Chain</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(transition.plan.fxTimeline.map(fx => fx.effect))).map(effect => (
                      <span key={effect} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Hot Cues */}
              {transition.plan.suggestedCues.length > 0 && (
                <div className="bg-neutral-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium text-neutral-300">Cue Points</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {transition.plan.suggestedCues.length} cues suggested
                  </div>
                </div>
              )}
              
              {/* Loops */}
              {transition.plan.suggestedLoops.length > 0 && (
                <div className="bg-neutral-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs font-medium text-neutral-300">Loop Controls</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {transition.plan.suggestedLoops.length} loops planned
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Cancel Button */}
          {onCancelTransition && (
            <button
              onClick={onCancelTransition}
              className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded text-red-300 text-sm font-medium transition-colors"
            >
              Cancel AI Transition
            </button>
          )}
        </div>
      )}
      
      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-neutral-700">
        <p className="text-xs text-neutral-500 text-center">
          AI analyzes BPM, musical key, and energy to select professional techniques
        </p>
      </div>
    </div>
  )
}
