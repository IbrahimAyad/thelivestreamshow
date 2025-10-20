// =====================================================
// OBS CONTROLLER - Controls OBS via WebSocket
// =====================================================

import OBSWebSocket from 'obs-websocket-js'
import type { ObsConnectionStatus, ObsScene } from '../automation/types'

export class ObsController {
  private obs: OBSWebSocket
  private connectionStatus: ObsConnectionStatus = {
    connected: false,
    error: undefined
  }
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectInterval: number = 5000 // 5 seconds

  constructor() {
    this.obs = new OBSWebSocket()

    // Set up event listeners
    this.obs.on('ConnectionClosed', () => {
      console.log('[OBS] Connection closed')
      this.connectionStatus.connected = false
      this.attemptReconnect()
    })

    this.obs.on('ConnectionError', (error) => {
      console.error('[OBS] Connection error:', error)
      this.connectionStatus.connected = false
      this.connectionStatus.error = error.message
    })
  }

  /**
   * Connect to OBS WebSocket
   */
  async connect(url: string = 'ws://localhost:4455', password?: string): Promise<void> {
    try {
      console.log('[OBS] Connecting to', url)

      await this.obs.connect(url, password)

      // Get version info
      const { obsVersion, obsWebSocketVersion } = await this.obs.call('GetVersion')

      this.connectionStatus = {
        connected: true,
        version: `OBS ${obsVersion} / WebSocket ${obsWebSocketVersion}`,
        error: undefined
      }

      this.reconnectAttempts = 0

      console.log('[OBS] Connected successfully:', this.connectionStatus.version)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.connectionStatus = {
        connected: false,
        error: errorMessage
      }

      console.error('[OBS] Connection failed:', errorMessage)
      throw error
    }
  }

  /**
   * Disconnect from OBS WebSocket
   */
  async disconnect(): Promise<void> {
    try {
      await this.obs.disconnect()
      this.connectionStatus.connected = false
      console.log('[OBS] Disconnected')
    } catch (error) {
      console.error('[OBS] Disconnect error:', error)
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[OBS] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`[OBS] Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[OBS] Reconnect failed:', error)
      })
    }, this.reconnectInterval)
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ObsConnectionStatus {
    return { ...this.connectionStatus }
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.connectionStatus.connected
  }

  /**
   * Get list of scenes
   */
  async getScenes(): Promise<ObsScene[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      const { scenes } = await this.obs.call('GetSceneList')

      return scenes.map((scene, index) => ({
        sceneName: scene.sceneName,
        sceneIndex: scene.sceneIndex ?? index
      }))
    } catch (error) {
      console.error('[OBS] Error getting scenes:', error)
      throw error
    }
  }

  /**
   * Get current scene
   */
  async getCurrentScene(): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      const { currentProgramSceneName } = await this.obs.call('GetCurrentProgramScene')
      return currentProgramSceneName
    } catch (error) {
      console.error('[OBS] Error getting current scene:', error)
      throw error
    }
  }

  /**
   * Switch to a scene
   */
  async switchScene(
    sceneName: string,
    transition?: string,
    transitionDuration?: number
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      // Set transition if specified
      if (transition) {
        await this.obs.call('SetCurrentSceneTransition', {
          transitionName: transition
        })

        if (transitionDuration !== undefined) {
          await this.obs.call('SetCurrentSceneTransitionDuration', {
            transitionDuration
          })
        }
      }

      // Switch scene
      await this.obs.call('SetCurrentProgramScene', {
        sceneName
      })

      console.log(`[OBS] Switched to scene: ${sceneName}`)
    } catch (error) {
      console.error('[OBS] Error switching scene:', error)
      throw error
    }
  }

  /**
   * Toggle source visibility
   */
  async toggleSource(
    sourceName: string,
    visible: boolean,
    sceneName?: string
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      // Get current scene if not specified
      const targetScene = sceneName || await this.getCurrentScene()

      // Get scene item ID
      const { sceneItemId } = await this.obs.call('GetSceneItemId', {
        sceneName: targetScene,
        sourceName
      })

      // Set visibility
      await this.obs.call('SetSceneItemEnabled', {
        sceneName: targetScene,
        sceneItemId,
        sceneItemEnabled: visible
      })

      console.log(`[OBS] Set ${sourceName} visibility to ${visible}`)
    } catch (error) {
      console.error('[OBS] Error toggling source:', error)
      throw error
    }
  }

  /**
   * Get source list for a scene
   */
  async getSceneItems(sceneName?: string): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      const targetScene = sceneName || await this.getCurrentScene()

      const { sceneItems } = await this.obs.call('GetSceneItemList', {
        sceneName: targetScene
      })

      return sceneItems
    } catch (error) {
      console.error('[OBS] Error getting scene items:', error)
      throw error
    }
  }

  /**
   * Start streaming
   */
  async startStreaming(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      await this.obs.call('StartStream')
      console.log('[OBS] Started streaming')
    } catch (error) {
      console.error('[OBS] Error starting stream:', error)
      throw error
    }
  }

  /**
   * Stop streaming
   */
  async stopStreaming(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      await this.obs.call('StopStream')
      console.log('[OBS] Stopped streaming')
    } catch (error) {
      console.error('[OBS] Error stopping stream:', error)
      throw error
    }
  }

  /**
   * Get streaming status
   */
  async getStreamingStatus(): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      const { outputActive } = await this.obs.call('GetStreamStatus')
      return outputActive
    } catch (error) {
      console.error('[OBS] Error getting stream status:', error)
      throw error
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      await this.obs.call('StartRecord')
      console.log('[OBS] Started recording')
    } catch (error) {
      console.error('[OBS] Error starting recording:', error)
      throw error
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBS')
    }

    try {
      await this.obs.call('StopRecord')
      console.log('[OBS] Stopped recording')
    } catch (error) {
      console.error('[OBS] Error stopping recording:', error)
      throw error
    }
  }
}
