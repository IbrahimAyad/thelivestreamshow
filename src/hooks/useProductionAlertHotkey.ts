/**
 * Production Alert Hotkey Hook
 * 
 * Enables "P" key hotkey to manually trigger Claude Production Alert
 * This is a backup method - primary activation should be voice/keyword
 * 
 * Usage:
 * ```tsx
 * import { useProductionAlertHotkey } from '@/hooks/useProductionAlertHotkey'
 * 
 * function Dashboard() {
 *   useProductionAlertHotkey()
 *   // ... rest of component
 * }
 * ```
 */

import { useEffect } from 'react'
import { useAutomationEngine } from './useAutomationEngine'

interface HotkeyConfig {
  enabled: boolean
  key: string
  requireModifier: boolean
  cooldownSeconds: number
}

const DEFAULT_CONFIG: HotkeyConfig = {
  enabled: true,
  key: 'p',
  requireModifier: false, // Set to true to require Ctrl/Cmd + P
  cooldownSeconds: 30
}

export function useProductionAlertHotkey(config: Partial<HotkeyConfig> = {}) {
  const { manualTrigger } = useAutomationEngine()
  const hotkeyConfig = { ...DEFAULT_CONFIG, ...config }

  useEffect(() => {
    if (!hotkeyConfig.enabled) return

    let lastTriggerTime = 0

    const handleKeyPress = async (event: KeyboardEvent) => {
      // ✅ EMERGENCY FIX: Add null check to prevent crash
      if (!event || !event.key) {
        console.warn('[ProductionAlertHotkey] Invalid key event');
        return;
      }
      
      // Check if correct key is pressed
      const isCorrectKey = event.key.toLowerCase() === hotkeyConfig.key.toLowerCase();
      if (!isCorrectKey) return;

      // Check if modifier is required
      if (hotkeyConfig.requireModifier) {
        const hasModifier = event.ctrlKey || event.metaKey
        if (!hasModifier) return
      } else {
        // Don't trigger if user is typing in an input field
        const target = event.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
      }

      // Check cooldown
      const now = Date.now()
      const timeSinceLastTrigger = (now - lastTriggerTime) / 1000
      if (timeSinceLastTrigger < hotkeyConfig.cooldownSeconds) {
        const remaining = Math.ceil(hotkeyConfig.cooldownSeconds - timeSinceLastTrigger)
        console.log(`[ProductionAlertHotkey] Cooldown active: ${remaining}s remaining`)
        return
      }

      // Prevent default behavior
      event.preventDefault()

      // Update last trigger time
      lastTriggerTime = now

      // Trigger the production alert
      console.log('[ProductionAlertHotkey] Triggering production alert via hotkey')
      
      try {
        await manualTrigger(
          'graphic.show',
          {
            graphic_type: 'claude_production_alert',
            duration_seconds: 10,
            // Include context in action data since hook doesn't accept 3rd param
            _context: {
              trigger_source: 'hotkey',
              hotkey: hotkeyConfig.key.toUpperCase(),
              timestamp: new Date().toISOString()
            }
          }
        )
        
        console.log('[ProductionAlertHotkey] ✅ Production alert triggered successfully')
      } catch (error) {
        console.error('[ProductionAlertHotkey] ❌ Failed to trigger alert:', error)
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyPress)
    console.log(`[ProductionAlertHotkey] ⌨️  Hotkey listener active (Key: "${hotkeyConfig.key.toUpperCase()}")`)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      console.log('[ProductionAlertHotkey] Hotkey listener removed')
    }
  }, [hotkeyConfig.enabled, hotkeyConfig.key, hotkeyConfig.requireModifier, hotkeyConfig.cooldownSeconds, manualTrigger])
}
