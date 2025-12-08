import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface PrepProgressProps {
  progress: any
}

export function PrepProgress({ progress }: PrepProgressProps) {
  const stats = [
    {
      label: 'Segments',
      current: progress.segments_prepared || 0,
      total: progress.total_segments || 0,
      color: 'blue'
    },
    {
      label: 'News Stories',
      current: progress.news_stories_approved || 0,
      total: progress.news_stories_generated || 0,
      color: 'cyan'
    },
    {
      label: 'Questions',
      current: progress.questions_approved || 0,
      total: progress.questions_generated || 0,
      color: 'purple'
    },
    {
      label: 'Clip Lines',
      current: progress.clip_lines_approved || 0,
      total: progress.clip_lines_generated || 0,
      color: 'pink'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const percentage = stat.total > 0 ? Math.round((stat.current / stat.total) * 100) : 0
        const isComplete = stat.current === stat.total && stat.total > 0

        const colorClasses = {
          blue: 'from-blue-600/20 to-blue-900/20 border-blue-500/30 text-blue-300',
          cyan: 'from-cyan-600/20 to-cyan-900/20 border-cyan-500/30 text-cyan-300',
          purple: 'from-purple-600/20 to-purple-900/20 border-purple-500/30 text-purple-300',
          pink: 'from-pink-600/20 to-pink-900/20 border-pink-500/30 text-pink-300'
        }

        return (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} border rounded-lg p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-300">{stat.label}</p>
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : stat.total > 0 ? (
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-gray-500" />
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white">{stat.current}</span>
              <span className="text-gray-400">/ {stat.total}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${isComplete ? 'from-green-500 to-green-600' : 'from-blue-500 to-purple-600'} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 mt-2">{percentage}% Complete</p>
          </div>
        )
      })}
    </div>
  )
}
