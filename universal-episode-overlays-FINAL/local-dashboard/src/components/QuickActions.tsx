import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, VolumeX, Monitor, Scissors, Play } from 'lucide-react'

export function QuickActions() {
  const [currentScene, setCurrentScene] = useState<string>('Unknown')
  const [playingMedia, setPlayingMedia] = useState<string | null>(null)
  const [allMuted, setAllMuted] = useState(false)

  useEffect(() => {
    loadCurrentScene()
    subscribeToChanges()
  }, [])

  const loadCurrentScene = async () => {
    const { data } = await supabase
      .from('broadcast_scenes')
      .select('scene_name')
      .eq('is_active', true)
      .maybeSingle()
    
    if (data) setCurrentScene(data.scene_name)
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('quick_actions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_scenes'
      }, () => {
        loadCurrentScene()
      })
      .subscribe()

    return () => channel.unsubscribe()
  }

  const muteAll = async () => {
    setAllMuted(!allMuted)
    // Mute all audio tracks
  }

  const showStandby = async () => {
    // Show standby screen graphic
    alert('Standby screen activated')
  }

  const markClip = async () => {
    await supabase
      .from('clip_markers')
      .insert({
        timestamp: new Date().toISOString(),
        title: 'Quick Clip ' + new Date().toLocaleTimeString(),
        is_clipped: false
      })
    
    alert('Clip marker added!')
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-6 border-2 border-purple-500/30">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={muteAll}
          className={`p-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            allMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <VolumeX className="w-5 h-5" />
          {allMuted ? 'Unmute All' : 'Mute All'}
        </button>

        <button
          onClick={showStandby}
          className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
        >
          <Monitor className="w-5 h-5" />
          Standby Screen
        </button>

        <button
          onClick={markClip}
          className="p-4 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 font-semibold flex items-center justify-center gap-2 col-span-2"
        >
          <Scissors className="w-5 h-5" />
          Mark Clip NOW
        </button>
      </div>

      <div className="space-y-2">
        <div className="bg-[#1a1a1a] rounded p-3 border border-[#3a3a3a]">
          <div className="text-xs text-gray-400 mb-1">Active Scene</div>
          <div className="font-semibold">{currentScene}</div>
        </div>

        {playingMedia && (
          <div className="bg-[#1a1a1a] rounded p-3 border border-purple-500/50">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Play className="w-3 h-3" />
              Currently Playing
            </div>
            <div className="font-semibold text-sm">{playingMedia}</div>
          </div>
        )}
      </div>
    </div>
  )
}
