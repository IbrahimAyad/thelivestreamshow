import { useEffect, useState } from 'react'

interface LiveIndicatorProps {
  position: string
  config: any
}

export const LiveIndicator = ({ position, config }: LiveIndicatorProps) => {
  const positionClasses: Record<string, string> = {
    'top_left': 'top-6 left-6',
    'top_right': 'top-6 right-6',
    'top_center': 'top-6 left-1/2 -translate-x-1/2',
    'bottom_left': 'bottom-6 left-6',
    'bottom_right': 'bottom-6 right-6'
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-50`}>
      <div className="bg-red-600 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-pulse">
        <div className="w-3 h-3 bg-white rounded-full" />
        <span className="text-white text-2xl font-bold">{config.text || 'LIVE'}</span>
      </div>
    </div>
  )
}

interface LowerThirdProps {
  data: any
  onComplete?: () => void
}

export const LowerThirdGraphic = ({ data, onComplete }: LowerThirdProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100)

    // Auto-hide if duration is set
    if (data.duration && data.duration > 0) {
      const timeout = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onComplete?.(), 500)
      }, data.duration * 1000)
      return () => clearTimeout(timeout)
    }
  }, [data.duration, onComplete])

  useEffect(() => {
    if (!data.is_visible) {
      setIsVisible(false)
      setTimeout(() => onComplete?.(), 500)
    }
  }, [data.is_visible, onComplete])

  const animationClasses: Record<string, string> = {
    'slide': isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0',
    'fade': isVisible ? 'opacity-100' : 'opacity-0',
    'wipe': isVisible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
  }

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      'guest_name': '👤',
      'social_media': '📱',
      'topic': '📌',
      'breaking': '🚨'
    }
    return icons[type] || '📝'
  }

  return (
    <div
      className={`absolute bottom-16 left-8 transition-all duration-500 ${animationClasses[data.animation_style || 'slide']}`}
      style={{
        backgroundColor: data.background_color || '#1a1a1a',
        color: data.text_color || '#ffffff'
      }}
    >
      <div className="border-t-4 border-purple-600 px-8 py-6 backdrop-blur-md shadow-2xl rounded-r-lg flex items-center gap-4">
        <div className="text-5xl">{getIcon(data.template_type)}</div>
        <div>
          <div className={`font-bold drop-shadow-lg ${
            data.font_size === 'large' ? 'text-5xl' :
            data.font_size === 'small' ? 'text-2xl' :
            'text-4xl'
          }`}>
            {data.title_text}
          </div>
          {data.subtitle_text && (
            <div className={`mt-1 drop-shadow-md opacity-90 ${
              data.font_size === 'large' ? 'text-3xl' :
              data.font_size === 'small' ? 'text-xl' :
              'text-2xl'
            }`}>
              {data.subtitle_text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TimerOverlayProps {
  timer: any
  position: string
}

export const TimerOverlay = ({ timer, position }: TimerOverlayProps) => {
  const [elapsed, setElapsed] = useState(timer.elapsed || 0)

  useEffect(() => {
    setElapsed(timer.elapsed || 0)
  }, [timer.elapsed])

  useEffect(() => {
    if (!timer.is_running) return

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.is_running])

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerDisplay = (): string => {
    if (timer.type === 'countdown') {
      const remaining = Math.max(0, timer.duration - elapsed)
      return formatTime(remaining)
    } else {
      return formatTime(elapsed)
    }
  }

  const getTimerColor = (): string => {
    if (timer.type === 'countup') return 'text-green-400'
    
    const remaining = timer.duration - elapsed
    const percentage = (remaining / timer.duration) * 100
    
    if (percentage > 50) return 'text-green-400'
    if (percentage > 20) return 'text-yellow-400'
    return 'text-red-400'
  }

  const positionClasses: Record<string, string> = {
    'top_center': 'top-6 left-1/2 -translate-x-1/2',
    'bottom_center': 'bottom-6 left-1/2 -translate-x-1/2',
    'top_right': 'top-6 right-6',
    'bottom_right': 'bottom-6 right-6'
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-40`}>
      <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 border-2 border-gray-700 rounded-xl px-8 py-4 backdrop-blur-sm shadow-2xl">
        <div className="text-gray-400 text-sm font-semibold mb-1 text-center">
          {timer.name.toUpperCase()}
        </div>
        <div className={`font-mono text-5xl font-bold text-center ${getTimerColor()}`}>
          {getTimerDisplay()}
        </div>
      </div>
    </div>
  )
}

interface SegmentBannerProps {
  segment: any
  config: any
}

export const SegmentBanner = ({ segment, config }: SegmentBannerProps) => {
  if (!segment) return null

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
      <div
        className="px-8 py-4 rounded-lg backdrop-blur-md shadow-2xl border border-white/20"
        style={{ backgroundColor: config.background || '#7c3aed' }}
      >
        <div className="text-purple-200 text-sm font-semibold mb-1 text-center">CURRENT SEGMENT</div>
        <h3 className="text-white text-3xl font-bold text-center">{segment.title}</h3>
        {segment.description && (
          <p className="text-gray-200 text-lg mt-1 text-center">{segment.description}</p>
        )}
      </div>
    </div>
  )
}

interface LogoOverlayProps {
  config: any
  position: string
}

export const LogoOverlay = ({ config, position }: LogoOverlayProps) => {
  const positionClasses: Record<string, string> = {
    'top_left': 'top-6 left-6',
    'top_right': 'top-6 right-6',
    'bottom_left': 'bottom-6 left-6',
    'bottom_right': 'bottom-6 right-6'
  }

  const sizeClasses: Record<string, string> = {
    'small': 'w-20 h-20',
    'medium': 'w-32 h-32',
    'large': 'w-48 h-48'
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-20`}>
      {config.url ? (
        <img
          src={config.url}
          alt="Logo"
          className={`${sizeClasses[config.size || 'medium']} object-contain drop-shadow-2xl`}
          style={{ opacity: config.opacity || 0.9 }}
        />
      ) : (
        <div className={`${sizeClasses[config.size || 'medium']} bg-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl`}
          style={{ opacity: config.opacity || 0.9 }}
        >
          📺
        </div>
      )}
    </div>
  )
}
