import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Sparkles, Radio, Image, Timer, Info } from 'lucide-react'

interface BroadcastGraphic {
  id: string
  graphic_type: string
  is_visible: boolean
  position: string
  config: any
}

export const GraphicsPanel = () => {
  const [graphics, setGraphics] = useState<BroadcastGraphic[]>([])

  useEffect(() => {
    loadGraphics()

    const channel = supabase
      .channel('graphics_panel_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_graphics'
      }, () => {
        loadGraphics()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadGraphics = async () => {
    const { data } = await supabase
      .from('broadcast_graphics')
      .select('*')
    
    if (data) setGraphics(data as BroadcastGraphic[])
  }

  const toggleGraphic = async (graphicId: string, isVisible: boolean) => {
    await supabase
      .from('broadcast_graphics')
      .update({ is_visible: !isVisible })
      .eq('id', graphicId)
  }

  const updatePosition = async (graphicId: string, position: string) => {
    await supabase
      .from('broadcast_graphics')
      .update({ position })
      .eq('id', graphicId)
  }

  const getGraphicIcon = (type: string) => {
    const icons: Record<string, any> = {
      'live_indicator': Radio,
      'logo': Image,
      'timer_overlay': Timer,
      'segment_banner': Info
    }
    const Icon = icons[type] || Sparkles
    return <Icon className="w-4 h-4" />
  }

  const getGraphicLabel = (type: string) => {
    const labels: Record<string, string> = {
      'live_indicator': 'LIVE Indicator',
      'logo': 'Logo/Branding',
      'timer_overlay': 'Timer Overlay',
      'segment_banner': 'Segment Banner'
    }
    return labels[type] || type
  }

  const positions = [
    { value: 'top_left', label: 'Top Left' },
    { value: 'top_center', label: 'Top Center' },
    { value: 'top_right', label: 'Top Right' },
    { value: 'bottom_left', label: 'Bottom Left' },
    { value: 'bottom_center', label: 'Bottom Center' },
    { value: 'bottom_right', label: 'Bottom Right' }
  ]

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        Graphics Overlays
      </h2>

      <div className="space-y-3">
        {graphics.map(graphic => (
          <div
            key={graphic.id}
            className={`p-3 rounded-lg border transition-all ${
              graphic.is_visible
                ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30'
                : 'bg-[#1a1a1a] border-[#3a3a3a]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={graphic.is_visible ? 'text-yellow-400' : 'text-gray-500'}>
                  {getGraphicIcon(graphic.graphic_type)}
                </div>
                <span className={`font-semibold text-sm ${
                  graphic.is_visible ? 'text-white' : 'text-gray-400'
                }`}>
                  {getGraphicLabel(graphic.graphic_type)}
                </span>
              </div>
              <button
                onClick={() => toggleGraphic(graphic.id, graphic.is_visible)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  graphic.is_visible
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {graphic.is_visible ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>

            {graphic.is_visible && (
              <div className="mt-2">
                <label className="text-xs text-gray-400 mb-1 block">Position</label>
                <select
                  value={graphic.position}
                  onChange={(e) => updatePosition(graphic.id, e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  {positions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded text-sm text-yellow-300">
        <p className="font-semibold mb-1">💡 Tip</p>
        <p className="text-xs">Graphics appear on top of your scene layout in the Broadcast View</p>
      </div>
    </div>
  )
}
