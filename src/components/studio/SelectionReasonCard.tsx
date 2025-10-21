import type { ScoredTrack } from '@/utils/trackScorer'
import { Music } from 'lucide-react'

interface SelectionReasonCardProps {
  scoredTrack: ScoredTrack
  onAccept: () => void
  onSkip: () => void
  onLock: () => void
}

export function SelectionReasonCard({
  scoredTrack,
  onAccept,
  onSkip,
  onLock
}: SelectionReasonCardProps) {
  const { track, totalScore, harmonicScore, bpmScore, energyScore, recencyScore, harmonicReason, bpmReason, energyReason } = scoredTrack

  // Calculate max possible score (using weights: 30+30+25+15 = 100)
  const maxScore = 100
  
  // Helper to get color class based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }
  
  // Helper to get progress bar color
  const getBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-2 border-purple-500/50 rounded-lg p-4 animate-pulse-slow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          <h4 className="text-lg font-semibold text-purple-300">Auto-DJ Suggestion</h4>
        </div>
        <div className="text-2xl font-bold text-purple-400">
          {totalScore}<span className="text-sm text-neutral-400">/{maxScore}</span>
        </div>
      </div>

      {/* Track Info */}
      <div className="mb-3">
        <div className="text-base font-medium text-neutral-100">{track.title}</div>
        {track.artist && (
          <div className="text-sm text-neutral-400">{track.artist}</div>
        )}
      </div>

      {/* Analysis Badges */}
      <div className="flex gap-2 mb-4">
        {track.bpm && (
          <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs font-mono text-purple-400">
            {track.bpm} BPM
          </div>
        )}
        {track.musical_key && (
          <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs font-mono text-green-400">
            {track.musical_key}
          </div>
        )}
        {track.energy_level && (
          <div
            className={`px-2 py-1 rounded text-xs font-bold ${
              track.energy_level >= 8
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : track.energy_level >= 4
                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
            }`}
          >
            E{track.energy_level}
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mb-4">
        {/* Harmonic Score */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-400">Harmonic</span>
            <span className={`font-mono ${getScoreColor(harmonicScore)}`}>
              {harmonicScore}/100
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(harmonicScore)} transition-all duration-300`}
              style={{ width: `${harmonicScore}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">{harmonicReason}</div>
        </div>

        {/* BPM Score */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-400">BPM</span>
            <span className={`font-mono ${getScoreColor(bpmScore)}`}>
              {bpmScore}/100
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(bpmScore)} transition-all duration-300`}
              style={{ width: `${bpmScore}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">{bpmReason}</div>
        </div>

        {/* Energy Score */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-400">Energy</span>
            <span className={`font-mono ${getScoreColor(energyScore)}`}>
              {energyScore}/100
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(energyScore)} transition-all duration-300`}
              style={{ width: `${energyScore}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">{energyReason}</div>
        </div>

        {/* Recency Score */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-400">Recency</span>
            <span className={`font-mono ${getScoreColor(recencyScore)}`}>
              {recencyScore}/100
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(recencyScore)} transition-all duration-300`}
              style={{ width: `${recencyScore}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {recencyScore === 100 ? 'Never played' : recencyScore >= 80 ? 'Played long ago' : 'Recently played'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
        >
          <span>Accept</span>
        </button>
        <button
          onClick={onSkip}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-medium transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onLock}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
        >
          Lock Custom
        </button>
      </div>
    </div>
  )
}
