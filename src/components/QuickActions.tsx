import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { EyeOff, Maximize, Minimize, Layout } from 'lucide-react'

export function QuickActions() {
  const [isProcessing, setIsProcessing] = useState(false)

  const hideAll = async () => {
    setIsProcessing(true)
    try {
      // Hide all graphics
      await supabase
        .from('broadcast_graphics')
        .update({ is_visible: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Hide question banner
      await supabase
        .from('question_banners')
        .update({ is_visible: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Hide lower thirds
      await supabase
        .from('lower_thirds')
        .update({ is_visible: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Deactivate AI features
      await supabase
        .from('ai_engagement')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyPreset = async (preset: string) => {
    setIsProcessing(true)
    try {
      // First hide everything
      await hideAll()

      // Then apply preset
      if (preset === 'clean') {
        // Nothing else to do, everything hidden
      } else if (preset === 'branded') {
        // Show logo and LIVE indicator
        await supabase
          .from('broadcast_graphics')
          .update({ is_visible: true })
          .in('graphic_type', ['logo', 'live_indicator'])
      } else if (preset === 'full') {
        // Show everything
        await supabase
          .from('broadcast_graphics')
          .update({ is_visible: true })
          .in('graphic_type', ['logo', 'live_indicator'])

        await supabase
          .from('question_banners')
          .update({ is_visible: true })
          .limit(1)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Layout className="w-7 h-7 text-yellow-400" />
        Quick Actions
      </h2>

      {/* Emergency Hide All */}
      <button
        onClick={hideAll}
        disabled={isProcessing}
        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold text-lg rounded-lg mb-4 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-red-900/50"
      >
        <EyeOff className="w-6 h-6" />
        HIDE ALL OVERLAYS
      </button>

      {/* Scene Presets */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">SCENE PRESETS:</h3>
        
        <button
          onClick={() => applyPreset('clean')}
          disabled={isProcessing}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Minimize className="w-5 h-5" />
          Clean (No Overlays)
        </button>

        <button
          onClick={() => applyPreset('branded')}
          disabled={isProcessing}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Layout className="w-5 h-5" />
          Branded (Logo + LIVE)
        </button>

        <button
          onClick={() => applyPreset('full')}
          disabled={isProcessing}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Maximize className="w-5 h-5" />
          Full Overlay
        </button>
      </div>

      <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300">
        <p className="font-semibold">Emergency Control</p>
        <p className="text-xs mt-1">Use &quot;Hide All&quot; to instantly clear all overlays during stream</p>
      </div>
    </div>
  )
}
