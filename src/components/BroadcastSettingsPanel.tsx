import { useState, useEffect } from 'react'
import { supabase, BroadcastSettings } from '../lib/supabase'
import { Layout, Palette, Monitor, Video, Users, Focus } from 'lucide-react'

export function BroadcastSettingsPanel() {
  const [layoutPreset, setLayoutPreset] = useState('default')
  const [colorTheme, setColorTheme] = useState('cyber-blue')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadSettings()

    // Subscribe to settings changes
    const channel = supabase.channel('broadcast_settings_panel').on('postgres_changes', {
      event: '*', schema: 'public', table: 'broadcast_settings'
    }, loadSettings).subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadSettings = async () => {
    try {
      const { data: layoutData } = await supabase
        .from('broadcast_settings')
        .select('*')
        .eq('setting_type', 'layout_preset')
        .eq('is_active', true)
        .maybeSingle()

      const { data: themeData } = await supabase
        .from('broadcast_settings')
        .select('*')
        .eq('setting_type', 'color_theme')
        .eq('is_active', true)
        .maybeSingle()

      if (layoutData) {
        setLayoutPreset((layoutData as BroadcastSettings).setting_value.layout_preset || 'default')
      }

      if (themeData) {
        setColorTheme((themeData as BroadcastSettings).setting_value.color_theme || 'cyber-blue')
      }
    } catch (error) {
      console.error('Error loading broadcast settings:', error)
    }
  }

  const updateLayout = async (mode: string) => {
    setUpdating(true)
    try {
      // First, get the existing setting
      const { data: existing } = await supabase
        .from('broadcast_settings')
        .select('*')
        .eq('setting_type', 'layout_preset')
        .maybeSingle()

      if (existing) {
        await supabase
          .from('broadcast_settings')
          .update({
            setting_value: { mode },
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('broadcast_settings')
          .insert({
            setting_type: 'layout_preset',
            setting_value: { mode },
            is_active: true
          })
      }

      setLayoutPreset(mode)
    } catch (error) {
      console.error('Error updating layout:', error)
    } finally {
      setUpdating(false)
    }
  }

  const updateTheme = async (theme: string) => {
    setUpdating(true)
    try {
      // First, get the existing setting
      const { data: existing } = await supabase
        .from('broadcast_settings')
        .select('*')
        .eq('setting_type', 'color_theme')
        .maybeSingle()

      if (existing) {
        await supabase
          .from('broadcast_settings')
          .update({
            setting_value: { theme },
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('broadcast_settings')
          .insert({
            setting_type: 'color_theme',
            setting_value: { theme },
            is_active: true
          })
      }

      setColorTheme(theme)
    } catch (error) {
      console.error('Error updating theme:', error)
    } finally {
      setUpdating(false)
    }
  }

  const layouts = [
    { id: 'default', name: 'Default', icon: Monitor, description: '50/50 split, balanced view' },
    { id: 'theater', name: 'Theater', icon: Video, description: 'Reaction 70%, camera corner' },
    { id: 'interview', name: 'Interview', icon: Users, description: 'Perfect 50/50 split' },
    { id: 'camera-focus', name: 'Camera Focus', icon: Focus, description: 'Camera 65%, reaction corner' }
  ]

  const themes = [
    { id: 'cyber-blue', name: 'Cyber Blue', primary: '#00f0ff', secondary: '#8b00ff' },
    { id: 'neon-red', name: 'Neon Red', primary: '#ff0055', secondary: '#ff6b00' },
    { id: 'matrix-green', name: 'Matrix Green', primary: '#00ff41', secondary: '#00c9a7' }
  ]

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 space-y-6">
      {/* Layout Presets */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">Layout Presets</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {layouts.map((layout) => {
            const Icon = layout.icon
            const isActive = layoutPreset === layout.id
            return (
              <button
                key={layout.id}
                onClick={() => updateLayout(layout.id)}
                disabled={updating}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${isActive 
                    ? 'border-yellow-400 bg-yellow-400/20 scale-105' 
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                  }
                  ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${isActive ? 'text-yellow-400' : 'text-gray-400'}`} />
                <p className={`font-bold text-sm mb-1 ${isActive ? 'text-yellow-400' : 'text-white'}`}>
                  {layout.name}
                </p>
                <p className="text-xs text-gray-400">{layout.description}</p>
              </button>
            )
          })}
        </div>
        
        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
          <p className="text-xs text-gray-400">
            <strong className="text-yellow-400">Keyboard:</strong> Ctrl+Shift+1/2/3/4 to switch layouts
          </p>
        </div>
      </div>

      {/* Color Themes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">Color Themes</h3>
        </div>
        
        <div className="space-y-3">
          {themes.map((theme) => {
            const isActive = colorTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => updateTheme(theme.id)}
                disabled={updating}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4
                  ${isActive 
                    ? 'border-yellow-400 bg-yellow-400/20 scale-105' 
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                  }
                  ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white"
                    style={{ backgroundColor: theme.secondary }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-bold ${isActive ? 'text-yellow-400' : 'text-white'}`}>
                    {theme.name}
                  </p>
                  <p className="text-xs text-gray-400">Primary & Secondary Colors</p>
                </div>
                {isActive && (
                  <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                )}
              </button>
            )
          })}
        </div>
        
        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
          <p className="text-xs text-gray-400">
            <strong className="text-yellow-400">Tip:</strong> Theme changes apply instantly to broadcast overlay
          </p>
        </div>
      </div>
    </div>
  )
}
