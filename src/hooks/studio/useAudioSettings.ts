import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AudioSettings } from "@/types/database"

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings | null>(null)
  const [settingsId, setSettingsId] = useState<string | null>(null)

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('audio_settings')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching settings:', error)
        return
      }

      if (data) {
        setSettings(data)
        setSettingsId(data.id)
      }
    }

    fetchSettings()
  }, [])

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<AudioSettings>) => {
      if (!settingsId) return

      const { data, error } = await supabase
        .from('audio_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settingsId)
        .select()
        .single()

      if (error) {
        console.error('Error updating settings:', error)
        throw error
      }

      if (data) {
        setSettings(data)
      }
    },
    [settingsId]
  )

  return {
    settings,
    updateSettings,
  }
}
