import { useState, useEffect } from 'react'
import { Play, Square, Wifi, WifiOff, Activity, AlertTriangle } from 'lucide-react'
import OBSWebSocket from 'obs-websocket-js'

interface StreamControlsProps {
  obs: OBSWebSocket
  connected: boolean
}

interface StreamStats {
  activeFps: number
  averageFrameRenderTime: number
  cpuUsage: number
  memoryUsage: number
  outputSkippedFrames: number
  outputTotalFrames: number
  renderSkippedFrames: number
  renderTotalFrames: number
}

interface OutputStatus {
  outputActive: boolean
  outputDuration?: number
}

export function StreamControls({ obs, connected }: StreamControlsProps) {
  const [recording, setRecording] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [streamDuration, setStreamDuration] = useState(0)
  const [stats, setStats] = useState<StreamStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch stream stats every 2 seconds when streaming
  useEffect(() => {let interval: NodeJS.Timeout
    if (connected && streaming) {
      interval = setInterval(async () => {
        try {
          const statsData = await obs.call('GetStats')
          setStats(statsData as unknown as StreamStats)
        } catch (err) {
          console.error('Failed to fetch stats:', err)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [connected, streaming, obs])

  // Update durations every second
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (recording || streaming) {
      interval = setInterval(() => {
        if (recording) setRecordDuration(d => d + 1)
        if (streaming) setStreamDuration(d => d + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [recording, streaming])

  // Check initial status
  useEffect(() => {
    if (connected) {
      checkStatus()
    }
  }, [connected])

  const checkStatus = async () => {
    try {
      const recordStatus = await obs.call('GetRecordStatus') as unknown as OutputStatus
      setRecording(recordStatus.outputActive)
      if (recordStatus.outputDuration) {
        setRecordDuration(Math.floor(recordStatus.outputDuration / 1000))
      }

      const streamStatus = await obs.call('GetStreamStatus') as unknown as OutputStatus
      setStreaming(streamStatus.outputActive)
      if (streamStatus.outputDuration) {
        setStreamDuration(Math.floor(streamStatus.outputDuration / 1000))
      }
    } catch (err) {
      console.error('Failed to check status:', err)
    }
  }

  const startRecording = async () => {
    setLoading(true)
    try {
      await obs.call('StartRecord')
      setRecording(true)
      setRecordDuration(0)
    } catch (err: any) {
      alert('Failed to start recording: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const stopRecording = async () => {
    setLoading(true)
    try {
      await obs.call('StopRecord')
      setRecording(false)
      setRecordDuration(0)
    } catch (err: any) {
      alert('Failed to stop recording: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const startStreaming = async () => {
    setLoading(true)
    try {
      await obs.call('StartStream')
      setStreaming(true)
      setStreamDuration(0)
    } catch (err: any) {
      alert('Failed to start streaming: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const stopStreaming = async () => {
    setLoading(true)
    try {
      await obs.call('StopStream')
      setStreaming(false)
      setStreamDuration(0)
      setStats(null)
    } catch (err: any) {
      alert('Failed to stop streaming: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDroppedFramePercentage = (): number => {
    if (!stats || stats.outputTotalFrames === 0) return 0
    return (stats.outputSkippedFrames / stats.outputTotalFrames) * 100
  }

  const getHealthColor = (percentage: number): string => {
    if (percentage < 1) return 'text-green-400'
    if (percentage < 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recording & Streaming
      </h2>

      {/* Recording Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="font-semibold">Recording</span>
          </div>
          {recording && (
            <span className="font-mono text-red-400 font-bold">
              {formatDuration(recordDuration)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={startRecording}
            disabled={!connected || recording || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            disabled={!connected || !recording || loading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>
      </div>

      {/* Streaming Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {streaming ? (
              <>
                <Wifi className="w-4 h-4 text-red-500" />
                <span className="font-semibold bg-red-600 px-2 py-1 rounded text-xs animate-pulse">LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-600" />
                <span className="font-semibold">Streaming</span>
              </>
            )}
          </div>
          {streaming && (
            <span className="font-mono text-red-400 font-bold">
              {formatDuration(streamDuration)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={startStreaming}
            disabled={!connected || streaming || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Wifi className="w-4 h-4" />
            Go Live
          </button>
          <button
            onClick={stopStreaming}
            disabled={!connected || !streaming || loading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <WifiOff className="w-4 h-4" />
            End Stream
          </button>
        </div>
      </div>

      {/* Stream Health Monitor */}
      {streaming && stats && (
        <div className="bg-[#1a1a1a] rounded p-4 border border-[#3a3a3a]">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Stream Health
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400 text-xs">FPS</div>
              <div className="font-mono font-bold">{stats.activeFps.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">CPU Usage</div>
              <div className="font-mono font-bold">{stats.cpuUsage.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">Dropped Frames</div>
              <div className={`font-mono font-bold ${getHealthColor(getDroppedFramePercentage())}`}>
                {stats.outputSkippedFrames} ({getDroppedFramePercentage().toFixed(2)}%)
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">Memory</div>
              <div className="font-mono font-bold">{(stats.memoryUsage / 1024 / 1024).toFixed(0)} MB</div>
            </div>
          </div>
          {getDroppedFramePercentage() > 5 && (
            <div className="mt-3 bg-red-900/20 border border-red-900/50 rounded p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-300">
                <strong>Warning:</strong> High dropped frame rate detected. Consider reducing stream quality or closing other applications.
              </div>
            </div>
          )}
        </div>
      )}

      {!connected && (
        <div className="text-sm text-gray-500 text-center mt-4">
          Connect to OBS to access recording and streaming controls
        </div>
      )}
    </div>
  )
}
