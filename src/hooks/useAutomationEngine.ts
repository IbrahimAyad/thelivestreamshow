// =====================================================
// USE AUTOMATION ENGINE - React hook for automation
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { AutomationEngine } from '../lib/automation/AutomationEngine'
import { EventListener } from '../lib/automation/EventListener'
import { ObsController } from '../lib/obs/ObsController'
import { TranscriptListener } from '../lib/transcription/TranscriptListener'
import { AIContextAnalyzer } from '../lib/ai/AIContextAnalyzer'
import { AICoordinator } from '../lib/ai/AICoordinator'
import type {
  AutomationConfig,
  AutomationEvent,
  ActionType,
  UseAutomationEngineReturn
} from '../lib/automation/types'

export function useAutomationEngine(): UseAutomationEngineReturn {
  const [config, setConfig] = useState<AutomationConfig | null>(null)
  const [recentEvents, setRecentEvents] = useState<AutomationEvent[]>([])
  const [pendingDecisions, setPendingDecisions] = useState<any[]>([])
  const engineRef = useRef<AutomationEngine | null>(null)
  const eventListenerRef = useRef<EventListener | null>(null)
  const obsControllerRef = useRef<ObsController | null>(null)
  const transcriptListenerRef = useRef<TranscriptListener | null>(null)
  const aiAnalyzerRef = useRef<AIContextAnalyzer | null>(null)
  const aiCoordinatorRef = useRef<AICoordinator | null>(null)

  // Initialize engine on mount
  useEffect(() => {
    const engine = new AutomationEngine()
    engine.initialize()
    engineRef.current = engine

    // Create OBS controller
    const obsController = new ObsController()
    obsControllerRef.current = obsController
    engine.setObsController(obsController)
    console.log('[useAutomationEngine] ObsController created and injected')

    // Create transcript listener
    const transcriptListener = new TranscriptListener(engine)
    transcriptListenerRef.current = transcriptListener
    console.log('[useAutomationEngine] TranscriptListener created and injected')

    // Create AI Coordinator
    const aiCoordinator = new AICoordinator({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL!,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
      enablePredictions: false, // Can be enabled later
      enableHostProfile: false,
      enableContextMemory: false
    })
    aiCoordinatorRef.current = aiCoordinator
    console.log('[useAutomationEngine] AICoordinator created')

    // Initialize AI Coordinator asynchronously
    aiCoordinator.initialize().then(() => {
      console.log('[useAutomationEngine] AICoordinator initialized')
    }).catch((error) => {
      console.error('[useAutomationEngine] Failed to initialize AICoordinator:', error)
    })

    // Create AI context analyzer
    const aiAnalyzer = new AIContextAnalyzer({ provider: 'mock' }) // Default to mock, can be configured later
    aiAnalyzer.setAutomationEngine(engine)
    aiAnalyzer.setCoordinator(aiCoordinator) // Connect to coordinator for priority system
    aiAnalyzerRef.current = aiAnalyzer
    console.log('[useAutomationEngine] AIContextAnalyzer created and connected to coordinator')

    // Create and start event listener
    const eventListener = new EventListener(engine)
    eventListener.start()
    eventListenerRef.current = eventListener
    engine.setEventListener(eventListener)

    loadConfig()
    loadRecentEvents()

    // Subscribe to config changes
    const configSubscription = supabase
      .channel('automation_config_hook')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'automation_config' },
        () => loadConfig()
      )
      .subscribe()

    // Subscribe to event changes
    const eventsSubscription = supabase
      .channel('automation_events_hook')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'automation_events' },
        () => loadRecentEvents()
      )
      .subscribe()

    return () => {
      configSubscription.unsubscribe()
      eventsSubscription.unsubscribe()
      eventListenerRef.current?.stop()
    }
  }, [])

  const loadConfig = async () => {
    const { data } = await supabase
      .from('automation_config')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (data) {
      setConfig(data as AutomationConfig)
    }
  }

  const loadRecentEvents = async () => {
    const { data } = await supabase
      .from('automation_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setRecentEvents(data as AutomationEvent[])

      // Update pending decisions
      const pending = data.filter(e => e.outcome === 'pending')
      setPendingDecisions(pending)
    }
  }

  const updateConfig = useCallback(async (updates: Partial<AutomationConfig>) => {
    if (!engineRef.current) return

    await engineRef.current.updateConfig(updates)
    await loadConfig()
  }, [])

  const toggleAutomation = useCallback(async () => {
    if (!config) return
    await updateConfig({ automation_enabled: !config.automation_enabled })
  }, [config, updateConfig])

  const toggleAutoExecute = useCallback(async () => {
    if (!config) return
    await updateConfig({ auto_execute_enabled: !config.auto_execute_enabled })
  }, [config, updateConfig])

  const triggerEmergencyStop = useCallback(async () => {
    if (!engineRef.current) return
    await engineRef.current.emergencyStop()
    await loadConfig()
  }, [])

  const manualTrigger = useCallback(async (
    actionType: ActionType,
    actionData: Record<string, any>
  ) => {
    if (!engineRef.current) return

    await engineRef.current.manualTrigger(actionType, actionData)
    await loadRecentEvents()
  }, [])

  const approveSuggestion = useCallback(async (eventId: string) => {
    if (!engineRef.current) return

    await engineRef.current.approveSuggestion(eventId)
    await loadRecentEvents()
  }, [])

  const rejectSuggestion = useCallback(async (eventId: string) => {
    if (!engineRef.current) return

    await engineRef.current.rejectSuggestion(eventId)
    await loadRecentEvents()
  }, [])

  return {
    isEnabled: config?.automation_enabled || false,
    isAutoExecuteEnabled: config?.auto_execute_enabled || false,
    emergencyStop: config?.emergency_stop || false,
    recentEvents,
    pendingDecisions,
    config,
    obsController: obsControllerRef.current,
    transcriptListener: transcriptListenerRef.current,
    aiAnalyzer: aiAnalyzerRef.current,
    aiCoordinator: aiCoordinatorRef.current,
    updateConfig,
    toggleAutomation,
    toggleAutoExecute,
    triggerEmergencyStop,
    manualTrigger,
    approveSuggestion,
    rejectSuggestion
  }
}
