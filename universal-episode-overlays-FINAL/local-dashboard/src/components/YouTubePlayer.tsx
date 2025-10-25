import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Square, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface YouTubePlayerProps {
  videoId: string | null
  onVideoEnd?: () => void
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export const YouTubePlayer = ({ videoId, onVideoEnd }: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(50)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true)
      }
    } else {
      setIsReady(true)
    }
  }, [])

  // Initialize player when ready and videoId changes
  useEffect(() => {
    if (!isReady || !videoId || !containerRef.current) return

    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId)
    } else {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration())
            event.target.setVolume(volume)
          },
          onStateChange: (event: any) => {
            const state = event.data
            setIsPlaying(state === window.YT.PlayerState.PLAYING)
            
            if (state === window.YT.PlayerState.ENDED && onVideoEnd) {
              onVideoEnd()
            }
          },
        },
      })
    }
  }, [isReady, videoId])

  // Update current time
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime())
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying])

  const handlePlayPause = () => {
    if (!playerRef.current) return

    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const handleStop = () => {
    if (!playerRef.current) return
    playerRef.current.stopVideo()
    setCurrentTime(0)
  }

  const handleMuteToggle = () => {
    if (!playerRef.current) return

    if (isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current) return
    playerRef.current.setVolume(newVolume)
    setVolume(newVolume)
    if (newVolume > 0 && isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    }
  }

  const handleSeek = (time: number) => {
    if (!playerRef.current) return
    playerRef.current.seekTo(time, true)
    setCurrentTime(time)
  }

  const toggleFullscreen = () => {
    const container = document.getElementById('youtube-player-container')
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!videoId) {
    return (
      <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 h-full flex items-center justify-center">
        <p className="text-gray-500 text-center">
          No video selected.<br />
          <span className="text-sm">Add videos to the queue and click Play to start.</span>
        </p>
      </div>
    )
  }

  return (
    <div id="youtube-player-container" className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Video Player</h2>
        <div className="text-xs text-gray-500">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4 flex-1">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, #0a0a0a ${(currentTime / duration) * 100}%, #0a0a0a 100%)`
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={handleStop}
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded transition-colors"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={handleMuteToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="w-32 h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #0a0a0a ${volume}%, #0a0a0a 100%)`
            }}
          />
          <span className="text-sm text-gray-500 w-10">{volume}%</span>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
