import { useState } from 'react'
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Settings } from 'lucide-react'

interface ConnectionPanelProps {
  connected: boolean
  connecting: boolean
  error: string | null
  onConnect: (address: string, password: string) => void
  onDisconnect: () => void
  status?: {
    protocol: 'ws' | 'wss' | null
    serverInfo?: {
      version: string
      rpcVersion: string
    }
  }
}

export const ConnectionPanel = ({ connected, connecting, error, onConnect, onDisconnect, status }: ConnectionPanelProps) => {
  const [address, setAddress] = useState('ws://localhost:4455')
  const [password, setPassword] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleConnect = () => {
    if (!address) return
    
    // Validate address format
    const trimmedAddress = address.trim()
    if (!trimmedAddress.startsWith('ws://') && !trimmedAddress.startsWith('wss://')) {
      // Auto-fix protocol if missing
      const fixedAddress = `ws://${trimmedAddress}`
      onConnect(fixedAddress, password)
    } else {
      onConnect(trimmedAddress, password)
    }
  }

  const presetAddresses = [
    { label: 'Local OBS', value: 'ws://localhost:4455' },
    { label: 'Local (no protocol)', value: 'localhost:4455' },
    { label: 'Network OBS', value: 'ws://192.168.1.100:4455' },
    { label: 'Secure WebSocket', value: 'wss://your-server.com:4455' }
  ]

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {connected ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
          OBS WebSocket Connection
        </h2>
        <div className="flex items-center gap-2">
          {status?.protocol && (
            <div className={`px-2 py-1 rounded text-xs font-semibold ${
              status.protocol === 'wss' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {status.protocol.toUpperCase()}
            </div>
          )}
          <div className={`px-3 py-1 rounded text-sm font-semibold ${
            connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>
      </div>

      {/* Server Info */}
      {connected && status?.serverInfo && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">Connected to OBS WebSocket</span>
          </div>
          <div className="text-xs opacity-80">
            Version: {status.serverInfo.version} | RPC: {status.serverInfo.rpcVersion}
          </div>
        </div>
      )}

      {!connected && (
        <div className="space-y-3">
          {/* Quick Address Presets */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quick Connect</label>
            <div className="grid grid-cols-2 gap-2">
              {presetAddresses.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setAddress(preset.value)}
                  className="text-left p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] rounded text-sm text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">WebSocket Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ws://localhost:4455"
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              Format: ws://hostname:port or wss://hostname:port
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter OBS WebSocket password"
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            Advanced Settings
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="p-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded">
              <h4 className="text-sm font-semibold text-white mb-2">Troubleshooting</h4>
              <div className="space-y-2 text-xs text-gray-400">
                <div>• Ensure OBS Studio is running</div>
                <div>• Enable WebSocket in: Tools → WebSocket Server Settings</div>
                <div>• Check firewall isn't blocking port 4455</div>
                <div>• For HTTP 426 errors: verify protocol (ws:// vs http://)</div>
              </div>
            </div>
          )}

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={connecting || !address}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {connecting ? 'Connecting...' : 'Connect to OBS'}
          </button>

          {/* HTTP 426 Error Help */}
          {error && error.includes('426') && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">HTTP 426 Error Detected</div>
                  <div className="text-xs mt-1">
                    This error occurs when the client tries to connect via HTTP instead of WebSocket protocol.
                    The system will automatically try to fix this by adding the correct protocol prefix.
                  </div>
                  <div className="text-xs mt-2 opacity-80">
                    <strong>Manual fix:</strong> Ensure address starts with "ws://" or "wss://"
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {connected && (
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-semibold">Successfully Connected</span>
            </div>
            {status?.protocol && (
              <span className="text-xs text-gray-400">
                Protocol: {status.protocol.toUpperCase()}
              </span>
            )}
          </div>

          {/* Disconnect Button */}
          <button
            onClick={onDisconnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* General Error Display */}
      {error && !error.includes('426') && (
        <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold">Connection Error</div>
              <div className="text-xs mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {!connected && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-xs">
          <p className="font-semibold mb-2">📋 OBS Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open OBS Studio</li>
            <li>Go to <strong>Tools → WebSocket Server Settings</strong></li>
            <li>✅ Enable WebSocket server</li>
            <li>🔑 Set a password (or use default)</li>
            <li>📡 Note the port (default: 4455)</li>
            <li>💾 Click <strong>Apply</strong> and <strong>OK</strong></li>
          </ol>
          <div className="mt-2 pt-2 border-t border-blue-500/20">
            <strong>For HTTP 426 errors:</strong> Make sure you're using "ws://" not "http://"
          </div>
        </div>
      )}
    </div>
  )
}
