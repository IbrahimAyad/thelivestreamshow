import { useState, useEffect, useCallback, useRef } from 'react'
import OBSWebSocket from 'obs-websocket-js'

export interface OBSConnectionConfig {
  address: string
  password: string
}

export interface OBSWebSocketStatus {
  connected: boolean
  connecting: boolean
  error: string | null
  protocol: 'ws' | 'wss' | null
  serverInfo?: {
    version: string
    rpcVersion: string
  }
}

export interface OBSScene {
  sceneName: string
  sceneUuid: string
}

export interface OBSInput {
  inputName: string
  inputKind: string
  inputUuid: string
}

export interface AudioLevel {
  inputName: string
  volumeDb: number
  volumeMul: number
  inputMuted: boolean
}

// Configuration manager for OBS WebSocket
class OBSConfigManager {
  private static instance: OBSConfigManager
  private config: OBSConnectionConfig = {
    address: 'ws://localhost:4455',
    password: '94bga6eD9Fizgzbv'
  }

  static getInstance(): OBSConfigManager {
    if (!OBSConfigManager.instance) {
      OBSConfigManager.instance = new OBSConfigManager()
    }
    return OBSConfigManager.instance
  }

  getConfig(): OBSConnectionConfig {
    return { ...this.config }
  }

  setConfig(config: Partial<OBSConnectionConfig>) {
    this.config = { ...this.config, ...config }
    this.validateAddress()
  }

  private validateAddress() {
    // Ensure proper WebSocket protocol
    if (!this.config.address.startsWith('ws://') && !this.config.address.startsWith('wss://')) {
      this.config.address = `ws://${this.config.address}`
    }
    
    // Extract host and port for validation
    const urlMatch = this.config.address.match(/^wss?:\/\/([^:]+):?(\d+)?/)
    if (!urlMatch) {
      throw new Error('Invalid WebSocket address format. Use format: ws://hostname:port or wss://hostname:port')
    }
    
    const [, host, port] = urlMatch
    if (!host) {
      throw new Error('Invalid hostname in WebSocket address')
    }
    
    // Default port if not specified
    if (!port) {
      this.config.address = this.config.address.replace(/\/$/, '') + ':4455'
    }
  }

  getConnectionString(): string {
    return this.config.address
  }
}

export const useOBSWebSocket = () => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [currentScene, setCurrentScene] = useState<string | null>(null)
  const [scenes, setScenes] = useState<OBSScene[]>([])
  const [inputs, setInputs] = useState<OBSInput[]>([])
  const [audioLevels, setAudioLevels] = useState<Map<string, AudioLevel>>(new Map())
  const [status, setStatus] = useState<OBSWebSocketStatus>({
    connected: false,
    connecting: false,
    error: null,
    protocol: null
  })
  
  const obsRef = useRef<OBSWebSocket>(new OBSWebSocket())
  const configManager = useRef(OBSConfigManager.getInstance())
  const connectionAttempts = useRef(0)
  const maxRetries = 3

  const validateConnectionConfig = useCallback((config: OBSConnectionConfig): string[] => {
    const errors: string[] = []
    
    // Validate address format
    if (!config.address) {
      errors.push('WebSocket address is required')
    } else {
      const validProtocol = config.address.startsWith('ws://') || config.address.startsWith('wss://')
      if (!validProtocol) {
        errors.push('Address must start with ws:// or wss://')
      }
      
      const urlMatch = config.address.match(/^wss?:\/\/([^:]+):?(\d+)?/)
      if (!urlMatch) {
        errors.push('Invalid address format. Use: ws://hostname:port')
      } else {
        const [, host, port] = urlMatch
        if (!host || host.trim() === '') {
          errors.push('Valid hostname is required')
        }
        if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
          errors.push('Port must be between 1 and 65535')
        }
      }
    }
    
    // Validate password
    if (!config.password || config.password.trim() === '') {
      errors.push('Password is required')
    }
    
    return errors
  }, [])

  const getServerInfo = useCallback(async () => {
    try {
      // Test connection with basic info request
      const result = await obsRef.current.call('GetVersion')
      return {
        version: result.obsWebSocketVersion || 'Unknown',
        rpcVersion: result.negotiatedRpcVersion || 'Unknown'
      }
    } catch (error) {
      console.warn('Could not get server info:', error)
      return undefined
    }
  }, [])

  const connect = useCallback(async (config?: OBSConnectionConfig) => {
    if (connecting) {
      console.log('Connection already in progress...')
      return
    }

    setConnecting(true)
    setStatus(prev => ({ ...prev, connecting: true, error: null }))

    try {
      // Use provided config or get from manager
      const connectionConfig = config || configManager.current.getConfig()
      
      // Validate configuration
      const validationErrors = validateConnectionConfig(connectionConfig)
      if (validationErrors.length > 0) {
        throw new Error(`Configuration invalid: ${validationErrors.join(', ')}`)
      }

      // Update config manager
      configManager.current.setConfig(connectionConfig)

      console.log(`🔌 Connecting to OBS WebSocket: ${connectionConfig.address}`)
      
      // Attempt connection
      await obsRef.current.connect(connectionConfig.address, connectionConfig.password)
      
      // Update status
      const protocol = connectionConfig.address.startsWith('wss://') ? 'wss' : 'ws'
      setStatus(prev => ({ 
        ...prev, 
        connected: true, 
        connecting: false, 
        protocol,
        error: null 
      }))
      
      setConnected(true)
      connectionAttempts.current = 0

      // Get server information
      const serverInfo = await getServerInfo()
      if (serverInfo) {
        setStatus(prev => ({ ...prev, serverInfo }))
      }

      // Get initial data
      console.log('📊 Fetching initial OBS data...')
      const sceneData = await obsRef.current.call('GetSceneList')
      setScenes(sceneData.scenes as unknown as OBSScene[])
      setCurrentScene(sceneData.currentProgramSceneName as string)
      
      const inputData = await obsRef.current.call('GetInputList')
      setInputs(inputData.inputs as unknown as OBSInput[])
      
      console.log('✅ Successfully connected to OBS')
      
    } catch (err: any) {
      connectionAttempts.current++
      const errorMessage = err.message || 'Failed to connect to OBS'
      
      console.error('❌ OBS Connection failed:', errorMessage)
      
      // Specific error handling for HTTP 426
      if (errorMessage.includes('426') || errorMessage.includes('Upgrade Required')) {
        const config = configManager.current.getConfig()
        if (!config.address.startsWith('ws://') && !config.address.startsWith('wss://')) {
          console.log('🔧 Fixing protocol - adding ws:// prefix')
          configManager.current.setConfig({ 
            ...config, 
            address: `ws://${config.address}` 
          })
          
          // Retry with fixed protocol
          if (connectionAttempts.current < maxRetries) {
            setStatus(prev => ({ ...prev, error: 'Retrying with WebSocket protocol...' }))
            setTimeout(() => connect(), 1000)
            return
          }
        }
      }
      
      setStatus(prev => ({ 
        ...prev, 
        connected: false, 
        connecting: false, 
        error: errorMessage 
      }))
      setConnected(false)
      
      // Reset state
      setCurrentScene(null)
      setScenes([])
      setInputs([])
      setAudioLevels(new Map())
      
    } finally {
      setConnecting(false)
    }
  }, [connecting, validateConnectionConfig, getServerInfo])

  const disconnect = useCallback(async () => {
    try {
      await obsRef.current.disconnect()
      setConnected(false)
      setCurrentScene(null)
      setScenes([])
      setInputs([])
      setAudioLevels(new Map())
      setStatus(prev => ({ 
        ...prev, 
        connected: false, 
        protocol: null,
        serverInfo: undefined 
      }))
      console.log('🔌 Disconnected from OBS')
    } catch (err: any) {
      console.error('Disconnect error:', err)
    }
  }, [])

  const switchScene = useCallback(async (sceneName: string) => {
    try {
      await obsRef.current.call('SetCurrentProgramScene', { sceneName })
      setCurrentScene(sceneName)
    } catch (err: any) {
      console.error('Scene switch error:', err)
      throw err
    }
  }, [])

  const setInputMute = useCallback(async (inputName: string, muted: boolean) => {
    try {
      await obsRef.current.call('SetInputMute', { inputName, inputMuted: muted })
    } catch (err: any) {
      console.error('Mute error:', err)
      throw err
    }
  }, [])

  const setInputVolume = useCallback(async (inputName: string, volumeDb: number) => {
    try {
      await obsRef.current.call('SetInputVolume', { inputName, inputVolumeDb: volumeDb })
    } catch (err: any) {
      console.error('Volume error:', err)
      throw err
    }
  }, [])

  const getInputVolume = useCallback(async (inputName: string): Promise<AudioLevel | null> => {
    try {
      const data = await obsRef.current.call('GetInputVolume', { inputName })
      const muteData = await obsRef.current.call('GetInputMute', { inputName })
      return {
        inputName,
        volumeDb: data.inputVolumeDb,
        inputMuted: muteData.inputMuted,
        volumeMul: data.inputVolumeMul
      }
    } catch (err: any) {
      console.error('Get volume error:', err)
      return null
    }
  }, [])

  const setSceneItemEnabled = useCallback(async (sceneName: string, sceneItemId: number, enabled: boolean) => {
    try {
      await obsRef.current.call('SetSceneItemEnabled', { 
        sceneName, 
        sceneItemId, 
        sceneItemEnabled: enabled 
      })
    } catch (err: any) {
      console.error('Source visibility error:', err)
      throw err
    }
  }, [])

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      await obsRef.current.call('GetVersion')
      return true
    } catch {
      return false
    }
  }, [])

  const getCurrentConfig = useCallback((): OBSConnectionConfig => {
    return configManager.current.getConfig()
  }, [])

  const updateConfig = useCallback((config: Partial<OBSConnectionConfig>) => {
    configManager.current.setConfig(config)
  }, [])

  // Listen to OBS events
  useEffect(() => {
    const obs = obsRef.current

    const handleConnectionClosed = () => {
      console.log('🔌 OBS connection closed')
      setConnected(false)
      setCurrentScene(null)
      setStatus(prev => ({ 
        ...prev, 
        connected: false, 
        protocol: null,
        serverInfo: undefined 
      }))
    }

    const handleConnectionError = (err: any) => {
      console.error('❌ OBS connection error:', err)
      setStatus(prev => ({ 
        ...prev, 
        connected: false, 
        connecting: false,
        error: err.message || 'Connection error' 
      }))
      setConnected(false)
    }

    obs.on('ConnectionClosed', handleConnectionClosed)
    obs.on('ConnectionError', handleConnectionError)
    
    // Add other event handlers as needed
    obs.on('CurrentProgramSceneChanged', (data) => {
      setCurrentScene(data.sceneName)
    })

    return () => {
      obs.removeAllListeners()
    }
  }, [])

  return {
    // Status
    connected,
    connecting,
    currentScene,
    scenes,
    inputs,
    audioLevels,
    status,
    
    // Actions
    connect,
    disconnect,
    switchScene,
    setInputMute,
    setInputVolume,
    getInputVolume,
    setSceneItemEnabled,
    testConnection,
    
    // Configuration
    getCurrentConfig,
    updateConfig,
    
    // Raw OBS instance
    obs: obsRef.current
  }
}