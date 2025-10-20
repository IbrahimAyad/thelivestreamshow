import { useState, useEffect } from 'react'
import { useAutomationEngine } from '../hooks/useAutomationEngine'
import type { ObsScene } from '../lib/automation/types'
import {
  Video,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Monitor,
  Play,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

export function OBSConnectionPanel() {
  const { obsController } = useAutomationEngine()
  const [isConnected, setIsConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scenes, setScenes] = useState<ObsScene[]>([])
  const [currentScene, setCurrentScene] = useState<string | null>(null)
  const [version, setVersion] = useState<string | null>(null)

  // Connection form state
  const [url, setUrl] = useState('ws://localhost:4455')
  const [password, setPassword] = useState('')

  // Poll connection status
  useEffect(() => {
    const checkStatus = () => {
      if (!obsController) return

      const connected = obsController.isConnected
      setIsConnected(connected)

      const status = obsController.getConnectionStatus()
      setVersion(status.version || null)
      setError(status.error || null)

      // If connected, fetch scenes and current scene
      if (connected) {
        loadScenes()
        loadCurrentScene()
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 1000)

    return () => clearInterval(interval)
  }, [obsController])

  const loadScenes = async () => {
    if (!obsController || !obsController.isConnected) return

    try {
      const sceneList = await obsController.getScenes()
      setScenes(sceneList)
    } catch (err) {
      console.error('[OBS] Error loading scenes:', err)
    }
  }

  const loadCurrentScene = async () => {
    if (!obsController || !obsController.isConnected) return

    try {
      const scene = await obsController.getCurrentScene()
      setCurrentScene(scene)
    } catch (err) {
      console.error('[OBS] Error loading current scene:', err)
    }
  }

  const handleConnect = async () => {
    if (!obsController) return

    setConnecting(true)
    setError(null)

    try {
      await obsController.connect(url, password || undefined)
      setIsConnected(true)
      await loadScenes()
      await loadCurrentScene()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      setError(errorMessage)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!obsController) return

    try {
      await obsController.disconnect()
      setIsConnected(false)
      setScenes([])
      setCurrentScene(null)
      setVersion(null)
    } catch (err) {
      console.error('[OBS] Disconnect error:', err)
    }
  }

  const handleSwitchScene = async (sceneName: string) => {
    if (!obsController) return

    try {
      await obsController.switchScene(sceneName)
      setCurrentScene(sceneName)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Scene switch failed'
      setError(errorMessage)
    }
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-400" />
          OBS Camera Control
          {isConnected && (
            <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </span>
          )}
          {!isConnected && !connecting && (
            <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs font-semibold rounded-full flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Disconnected
            </span>
          )}
        </h3>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 space-y-3">
          <div className="text-sm text-gray-400">
            Connect to OBS Studio via WebSocket to enable camera switching automation.
          </div>

          {/* Connection Form */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">WebSocket URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="ws://localhost:4455"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password (optional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="Leave blank if no password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5" />
                Connect to OBS
              </>
            )}
          </button>

          <div className="text-xs text-gray-500 mt-2">
            <p><strong>Note:</strong> Make sure OBS Studio is running and WebSocket server is enabled.</p>
            <p className="mt-1">Go to: <strong>Tools → WebSocket Server Settings</strong></p>
          </div>
        </div>
      )}

      {/* Connected View */}
      {isConnected && (
        <div className="space-y-4">
          {/* Version Info */}
          {version && (
            <div className="text-xs text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {version}
            </div>
          )}

          {/* Current Scene */}
          {currentScene && (
            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded">
              <div className="text-xs text-gray-400 mb-1">Current Scene</div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-400" />
                {currentScene}
              </div>
            </div>
          )}

          {/* Scene List */}
          {scenes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Available Scenes ({scenes.length})
                </h4>
                <button
                  onClick={loadScenes}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors flex items-center gap-1"
                  title="Refresh scene list"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {scenes.map((scene) => (
                  <button
                    key={scene.sceneName}
                    onClick={() => handleSwitchScene(scene.sceneName)}
                    disabled={scene.sceneName === currentScene}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left flex items-center gap-2 ${
                      scene.sceneName === currentScene
                        ? 'bg-purple-600 text-white cursor-default'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {scene.sceneName === currentScene && (
                      <Play className="w-4 h-4 text-white" />
                    )}
                    {scene.sceneName !== currentScene && (
                      <Monitor className="w-4 h-4 text-gray-400" />
                    )}
                    {scene.sceneName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <WifiOff className="w-4 h-4" />
            Disconnect
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {isConnected && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
          <p><strong>Automation Ready!</strong> Scene switching can now be triggered by:</p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Manual triggers in the panel above</li>
            <li>Keyword triggers (e.g., "camera 2")</li>
            <li>Event-based triggers from database</li>
            <li>AI-suggested scene changes</li>
          </ul>
        </div>
      )}
    </div>
  )
}
