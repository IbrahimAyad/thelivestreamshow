import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ShowQuestion {
  id: string
  created_at: string
  // Add other fields as needed
}

export function useShowQuestionsMonitor(onTTSStart: () => void, onTTSEnd: () => void) {
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    if (!isMonitoring) return

    // Subscribe to new entries in show_questions table
    const channel = supabase
      .channel('show_questions_monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'show_questions',
        },
        (payload) => {
          console.log('New question detected, triggering ducking:', payload)
          onTTSStart()

          // Estimate TTS duration (you can refine this based on your TTS implementation)
          // For now, we'll unduck after 10 seconds (adjust as needed)
          setTimeout(() => {
            onTTSEnd()
          }, 10000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isMonitoring, onTTSStart, onTTSEnd])

  return {
    isMonitoring,
    startMonitoring: () => setIsMonitoring(true),
    stopMonitoring: () => setIsMonitoring(false),
  }
}
