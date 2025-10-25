import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

interface RealtimeChannel {
  channel: any
  unsubscribe: () => void
}

interface ChannelConfig {
  table: string
  events?: string[]
  schema?: string
  onChange?: (payload: any) => void
  onError?: (error: any) => void
  onOpen?: () => void
  onClose?: () => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

/**
 * Custom hook for managing Supabase realtime channels with proper error handling
 * Prevents CHANNEL_ERROR by implementing automatic reconnection and error recovery
 */
export function useRealtimeChannel(channelName: string, config: ChannelConfig) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [lastError, setLastError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isUnmountedRef = useRef(false)

  // Default configuration
  const maxReconnectAttempts = config.reconnectAttempts || 10
  const reconnectInterval = config.reconnectInterval || 3000

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const scheduleReconnect = () => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts && !isUnmountedRef.current) {
      const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current), 30000)
      
      logger.debugIf(delay < 10000, `Scheduling reconnect for ${channelName} in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`)
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++
        connect()
      }, delay)
    } else {
      logger.error(`Max reconnection attempts reached for ${channelName}`)
      setStatus('error')
      setLastError('Max reconnection attempts reached')
    }
  }

  const connect = () => {
    if (isUnmountedRef.current) return

    setStatus('connecting')
    setLastError(null)

    // Clean up existing channel
    if (channelRef.current) {
      logger.debug(`Cleaning up existing channel: ${channelName}`)
      try {
        channelRef.current.unsubscribe()
      } catch (error) {
        logger.warn('Error unsubscribing from channel:', error)
      }
      channelRef.current = null
    }

    try {
      // Create new channel
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: config.events ? config.events.join(',') : '*',
            schema: config.schema || 'public',
            table: config.table
          },
          (payload) => {
            // Only log first few updates to reduce spam
            if (reconnectAttemptsRef.current < 3) {
              logger.debug(`Realtime update for ${channelName}:`, payload)
            }
            if (config.onChange) {
              config.onChange(payload)
            }
          }
        )
        .subscribe((state, err) => {
          // Only log state changes for first few attempts to reduce noise
          if (reconnectAttemptsRef.current < 2) {
            logger.debug(`Channel ${channelName} state:`, state, err ? `Error: ${err.message}` : '')
          }
          
          switch (state) {
            case 'SUBSCRIBED':
              setStatus('connected')
              setLastError(null)
              reconnectAttemptsRef.current = 0
              logger.system(`Successfully connected to ${channelName}`)
              if (config.onOpen) config.onOpen()
              break
              
            case 'CHANNEL_ERROR':
              setStatus('error')
              const errorMessage = err?.message || 'Channel error'
              setLastError(errorMessage)
              logger.error(`Channel error for ${channelName}:`, errorMessage)
              if (config.onError) config.onError(err)
              scheduleReconnect()
              break
              
            case 'TIMED_OUT':
              setStatus('error')
              setLastError('Connection timed out')
              logger.error(`Timeout for ${channelName}`)
              if (config.onError) config.onError(new Error('Connection timed out'))
              scheduleReconnect()
              break
              
            case 'CLOSED':
              setStatus('disconnected')
              logger.debug(`Channel ${channelName} closed`)
              if (config.onClose) config.onClose()
              break
              
            default:
              // Only log non-critical state changes in debug mode
              logger.debugIf(false, `Channel ${channelName} state change:`, state)
          }
        })

      channelRef.current = {
        channel,
        unsubscribe: () => {
          try {
            channel.unsubscribe()
          } catch (error) {
            logger.warn('Error during channel unsubscribe:', error)
          }
        }
      }
    } catch (error: any) {
      logger.error(`Failed to create channel ${channelName}:`, error)
      setStatus('error')
      setLastError(error.message)
      scheduleReconnect()
    }
  }

  const disconnect = () => {
    logger.debug(`Disconnecting from channel: ${channelName}`)
    setStatus('disconnected')
    clearReconnectTimeout()
    
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe()
      } catch (error) {
        logger.warn('Error during disconnect:', error)
      }
      channelRef.current = null
    }
  }

  const reconnect = () => {
    logger.debug(`Manual reconnect for ${channelName}`)
    reconnectAttemptsRef.current = 0
    clearReconnectTimeout()
    connect()
  }

  // Auto-connect on mount
  useEffect(() => {
    connect()

    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true
      clearReconnectTimeout()
      disconnect()
    }
  }, [channelName, config.table])

  return {
    status,
    lastError,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    hasError: status === 'error',
    reconnect,
    disconnect
  }
}

/**
 * Hook for creating a stable realtime channel with common patterns
 */
export function useStableRealtimeTable(tableName: string, onChange?: (payload: any) => void) {
  const channelName = `${tableName}_changes_${Date.now()}`
  
  const { status, lastError, isConnected, reconnect } = useRealtimeChannel(channelName, {
    table: tableName,
    onChange: onChange,
    onError: (error) => {
      logger.error(`Realtime error for ${tableName}:`, error)
    }
  })

  return {
    status,
    lastError,
    isConnected,
    reconnect
  }
}

/**
 * Hook for managing multiple realtime channels
 */
export function useRealtimeChannels(configs: Record<string, ChannelConfig>) {
  const channels = Object.keys(configs).reduce((acc, name) => {
    acc[name] = useRealtimeChannel(name, configs[name])
    return acc
  }, {} as Record<string, ReturnType<typeof useRealtimeChannel>>)

  const anyConnected = Object.values(channels).some(channel => channel.isConnected)
  const anyError = Object.values(channels).some(channel => channel.hasError)

  return {
    channels,
    anyConnected,
    anyError,
    reconnectAll: () => {
      Object.values(channels).forEach(channel => {
        if (channel.hasError) {
          channel.reconnect()
        }
      })
    }
  }
}
