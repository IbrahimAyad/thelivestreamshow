/**
 * OBS WebSocket Configuration Manager
 * Handles connection settings, validation, and error recovery for OBS WebSocket connections
 */

export interface OBSWebSocketConfig {
  address: string
  password: string
  autoReconnect: boolean
  connectionTimeout: number
  maxRetries: number
  protocols: ('ws' | 'wss')[]
}

export interface ConnectionDiagnostic {
  timestamp: Date
  success: boolean
  error?: string
  protocol?: 'ws' | 'wss'
  address: string
  responseTime?: number
}

class OBSConfigManager {
  private static instance: OBSConfigManager
  private config: OBSWebSocketConfig = {
    address: 'ws://localhost:4455',
    password: '94bga6eD9Fizgzbv',
    autoReconnect: true,
    connectionTimeout: 10000,
    maxRetries: 3,
    protocols: ['ws', 'wss']
  }

  private diagnosticHistory: ConnectionDiagnostic[] = []
  private readonly maxDiagnosticHistory = 50

  static getInstance(): OBSConfigManager {
    if (!OBSConfigManager.instance) {
      OBSConfigManager.instance = new OBSConfigManager()
    }
    return OBSConfigManager.instance
  }

  /**
   * Get current configuration
   */
  getConfig(): OBSWebSocketConfig {
    return { ...this.config }
  }

  /**
   * Update configuration with validation
   */
  setConfig(updates: Partial<OBSWebSocketConfig>): string[] {
    const errors: string[] = []
    const newConfig = { ...this.config, ...updates }

    // Validate address format
    if (newConfig.address) {
      const addressErrors = this.validateAddress(newConfig.address)
      errors.push(...addressErrors)
    }

    // Validate password
    if (newConfig.password !== undefined) {
      if (typeof newConfig.password !== 'string' || newConfig.password.trim() === '') {
        errors.push('Password must be a non-empty string')
      }
    }

    // Validate timeout
    if (newConfig.connectionTimeout !== undefined) {
      if (typeof newConfig.connectionTimeout !== 'number' || newConfig.connectionTimeout < 1000) {
        errors.push('Connection timeout must be at least 1000ms')
      }
    }

    // Validate max retries
    if (newConfig.maxRetries !== undefined) {
      if (typeof newConfig.maxRetries !== 'number' || newConfig.maxRetries < 0 || newConfig.maxRetries > 10) {
        errors.push('Max retries must be between 0 and 10')
      }
    }

    // If no errors, update configuration
    if (errors.length === 0) {
      this.config = newConfig
      this.saveToStorage()
    }

    return errors
  }

  /**
   * Validate WebSocket address format
   */
  validateAddress(address: string): string[] {
    const errors: string[] = []

    if (!address || typeof address !== 'string') {
      errors.push('Address is required')
      return errors
    }

    const trimmed = address.trim()
    
    // Check for proper protocol
    if (!trimmed.startsWith('ws://') && !trimmed.startsWith('wss://')) {
      errors.push('Address must start with ws:// or wss://')
    }

    // Parse URL components
    let url: URL
    try {
      url = new URL(trimmed)
    } catch {
      errors.push('Invalid URL format')
      return errors
    }

    // Validate hostname
    if (!url.hostname) {
      errors.push('Hostname is required')
    } else if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      // Localhost is allowed
    } else {
      // Basic IP validation for remote hosts
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      
      if (!ipRegex.test(url.hostname) && !hostnameRegex.test(url.hostname)) {
        errors.push('Invalid hostname format')
      }
    }

    // Validate port if specified
    if (url.port) {
      const portNum = parseInt(url.port, 10)
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        errors.push('Port must be between 1 and 65535')
      }
    }

    return errors
  }

  /**
   * Auto-fix common address issues
   */
  autoFixAddress(address: string): string {
    let fixed = address.trim()

    // Add protocol if missing
    if (!fixed.startsWith('ws://') && !fixed.startsWith('wss://')) {
      // Determine if HTTPS should be used (for external hosts)
      const isLocalhost = fixed.includes('localhost') || fixed.includes('127.0.0.1')
      fixed = `${isLocalhost ? 'ws' : 'wss'}://${fixed}`
    }

    // Add default port if missing
    if (!fixed.includes(':')) {
      fixed += ':4455'
    }

    return fixed
  }

  /**
   * Test connection with diagnostics
   */
  async testConnection(config: OBSWebSocketConfig): Promise<ConnectionDiagnostic> {
    const startTime = Date.now()
    const diagnostic: ConnectionDiagnostic = {
      timestamp: new Date(),
      success: false,
      address: config.address,
      protocol: config.address.startsWith('wss://') ? 'wss' : 'ws'
    }

    try {
      // Attempt basic connection test
      const WebSocket = require('ws') // This would need to be available
      
      return new Promise((resolve) => {
        const ws = new WebSocket(config.address, {
          timeout: config.connectionTimeout
        })

        ws.on('open', () => {
          diagnostic.success = true
          diagnostic.responseTime = Date.now() - startTime
          ws.close()
          resolve(diagnostic)
        })

        ws.on('error', (error: any) => {
          diagnostic.success = false
          diagnostic.error = error.message
          diagnostic.responseTime = Date.now() - startTime
          resolve(diagnostic)
        })

        ws.on('timeout', () => {
          diagnostic.success = false
          diagnostic.error = 'Connection timeout'
          diagnostic.responseTime = Date.now() - startTime
          ws.close()
          resolve(diagnostic)
        })
      })
    } catch (error: any) {
      diagnostic.success = false
      diagnostic.error = error.message
      diagnostic.responseTime = Date.now() - startTime
    }

    return diagnostic
  }

  /**
   * Get diagnostic history
   */
  getDiagnosticHistory(): ConnectionDiagnostic[] {
    return [...this.diagnosticHistory]
  }

  /**
   * Add diagnostic result to history
   */
  private addDiagnostic(diagnostic: ConnectionDiagnostic) {
    this.diagnosticHistory.unshift(diagnostic)
    
    // Keep only the most recent entries
    if (this.diagnosticHistory.length > this.maxDiagnosticHistory) {
      this.diagnosticHistory = this.diagnosticHistory.slice(0, this.maxDiagnosticHistory)
    }
  }

  /**
   * Get connection recommendations based on diagnostics
   */
  getRecommendations(): string[] {
    const recent = this.diagnosticHistory.slice(0, 10)
    const recommendations: string[] = []

    if (recent.length === 0) {
      return ['No connection history available. Try connecting to test.']
    }

    const successRate = recent.filter(d => d.success).length / recent.length
    
    if (successRate < 0.3) {
      recommendations.push('Connection attempts frequently fail. Check if OBS WebSocket server is enabled.')
      recommendations.push('Verify firewall settings aren\'t blocking the connection.')
    }

    const recentErrors = recent.filter(d => !d.success && d.error)
    if (recentErrors.length > 0) {
      const errorTypes = recentErrors.map(d => d.error).filter(Boolean) as string[]
      
      if (errorTypes.some(e => e.includes('426'))) {
        recommendations.push('HTTP 426 errors detected. Ensure address uses ws:// or wss:// protocol.')
      }
      
      if (errorTypes.some(e => e.includes('timeout'))) {
        recommendations.push('Connection timeouts. Check if OBS is running and accessible.')
      }
      
      if (errorTypes.some(e => e.includes('refused'))) {
        recommendations.push('Connection refused. OBS WebSocket server may not be enabled.')
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Connection quality appears good based on recent history.')
    }

    return recommendations
  }

  /**
   * Save configuration to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem('obs-websocket-config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save OBS WebSocket config to localStorage:', error)
    }
  }

  /**
   * Load configuration from localStorage
   */
  loadFromStorage(): boolean {
    try {
      const saved = localStorage.getItem('obs-websocket-config')
      if (saved) {
        const parsed = JSON.parse(saved)
        const errors = this.setConfig(parsed)
        return errors.length === 0
      }
    } catch (error) {
      console.warn('Failed to load OBS WebSocket config from localStorage:', error)
    }
    return false
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults() {
    this.config = {
      address: 'ws://localhost:4455',
      password: '94bga6eD9Fizgzbv',
      autoReconnect: true,
      connectionTimeout: 10000,
      maxRetries: 3,
      protocols: ['ws', 'wss']
    }
    this.saveToStorage()
  }
}

// Export singleton instance
export const obsConfigManager = OBSConfigManager.getInstance()

// Predefined connection presets
export const CONNECTION_PRESETS = {
  LOCAL: {
    label: 'Local OBS',
    address: 'ws://localhost:4455',
    description: 'Connect to OBS running on the same computer'
  },
  NETWORK: {
    label: 'Network OBS',
    address: 'ws://192.168.1.100:4455',
    description: 'Connect to OBS on another computer in your network'
  },
  SECURE: {
    label: 'Secure WebSocket',
    address: 'wss://your-server.com:4455',
    description: 'Connect to OBS using secure WebSocket (HTTPS/WSS)'
  }
} as const

export type ConnectionPreset = keyof typeof CONNECTION_PRESETS