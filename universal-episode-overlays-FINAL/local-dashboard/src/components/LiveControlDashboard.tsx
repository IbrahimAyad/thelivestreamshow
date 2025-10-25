import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Play, Pause, Square, Radio, Scissors, VolumeX, Volume2,
  Monitor, Clock, Video, Music2, Zap, Eye
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import OBSWebSocket from 'obs-websocket-js'

interface LiveControlDashboardProps {
  obs: OBSWebSocket
  connected: boolean
  currentScene: string | null
  scenes: string[]
  onSwitchScene: (sceneName: string) => Promise<void>
  user: SupabaseUser | null
}

interface BroadcastScene {
  id: string
  scene_name: string
  layout_type: string
  is_active: boolean
}

interface SceneTemplate {
  id: string
  name: string
  layout_type: string
}

interface Timer {
  id: string
  name: string
  duration: number
  elapsed: number
  is_running: boolean
  type: 'countdown' | 'countup'
}

export function LiveControlDashboard({ obs, connected, currentScene, scenes, onSwitchScene, user }: LiveControlDashboardProps) {
  const [broadcastScenes, setBroadcastScenes] = useState<BroadcastScene[]>([])
  const [activeScene, setActiveScene] = useState<BroadcastScene | null>(null)
  const [sceneTemplates, setSceneTemplates] = useState<SceneTemplate[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [allMuted, setAllMuted] = useState(false)
  const [showBlankScreen, setShowBlankScreen] = useState(false)
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null)
  const [currentShow, setCurrentShow] = useState<any>(null)
  const [currentEpisode, setCurrentEpisode] = useState<any>(null)
  const [micVolume, setMicVolume] = useState(80)
  const [musicVolume, setMusicVolume] = useState(30)
  const [videoVolume, setVideoVolume] = useState(70)

  useEffect(() => {
    loadData()
    subscribeToChanges()
  }, [])

  const loadData = async () => {
    // Load broadcast scenes
    const { data: scenesData } = await supabase
      .from('broadcast_scenes')
      .select('*')
      .order('created_at')
    
    if (scenesData) {
      setBroadcastScenes(scenesData as BroadcastScene[])
      const active = scenesData.find((s: BroadcastScene) => s.is_active)
      if (active) setActiveScene(active as BroadcastScene)
    }

    // Load scene templates
    const { data: templatesData } = await supabase
      .from('scene_templates')
      .select('*')
      .limit(5)
    
    if (templatesData) setSceneTemplates(templatesData as SceneTemplate[])

    // Load active timer
    const { data: timerData } = await supabase
      .from('timers')
      .select('*')
      .eq('is_running', true)
      .maybeSingle()
    
    if (timerData) setActiveTimer(timerData as Timer)

    // Load current show/episode
    const { data: metadata } = await supabase
      .from('broadcast_metadata')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    if (metadata) {
      if (metadata.current_show_id) {
        const { data: showData } = await supabase
          .from('shows')
          .select('*')
          .eq('id', metadata.current_show_id)
          .maybeSingle()
        setCurrentShow(showData)
      }
      if (metadata.current_episode_id) {
        const { data: episodeData } = await supabase
          .from('episodes')
          .select('*')
          .eq('id', metadata.current_episode_id)
          .maybeSingle()
        setCurrentEpisode(episodeData)
      }
    }
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('live_control_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_scenes'
      }, () => loadData())
      .subscribe()

    return () => channel.unsubscribe()
  }

  const switchBroadcastScene = async (sceneId: string) => {
    await supabase
      .from('broadcast_scenes')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    await supabase
      .from('broadcast_scenes')
      .update({ is_active: true })
      .eq('id', sceneId)

    loadData()
  }

  const toggleStreaming = async () => {
    if (!connected) return
    try {
      if (isStreaming) {
        await obs.call('StopStream')
      } else {
        await obs.call('StartStream')
      }
      setIsStreaming(!isStreaming)
    } catch (err) {
      console.error('Stream toggle error:', err)
    }
  }

  const toggleRecording = async () => {
    if (!connected) return
    try {
      if (isRecording) {
        await obs.call('StopRecord')
      } else {
        await obs.call('StartRecord')
      }
      setIsRecording(!isRecording)
    } catch (err) {
      console.error('Recording toggle error:', err)
    }
  }

  const handleMuteAll = () => {
    setAllMuted(!allMuted)
    if (!allMuted) {
      setMicVolume(0)
      setMusicVolume(0)
      setVideoVolume(0)
    } else {
      setMicVolume(80)
      setMusicVolume(30)
      setVideoVolume(70)
    }
  }

  const markClip = async () => {
    await supabase
      .from('clip_markers')
      .insert({
        timestamp: new Date().toISOString(),
        title: 'Live Clip ' + new Date().toLocaleTimeString(),
        show_id: currentShow?.id || null,
        episode_id: currentEpisode?.id || null,
        is_clipped: false
      })
    
    // Visual feedback
    const button = document.getElementById('clip-marker-btn')
    if (button) {
      button.classList.add('animate-ping')
      setTimeout(() => button.classList.remove('animate-ping'), 500)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Bar - Stream Status & Critical Controls */}
      <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 border-2 border-red-500/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xl font-bold text-red-400">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                <span className="text-xl font-bold text-gray-400">OFFLINE</span>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">REC</span>
              </div>
            )}
            {currentShow && (
              <div className="text-sm">
                <span className="text-gray-400">Show:</span>
                <span className="ml-2 font-semibold">{currentShow.name}</span>
                {currentEpisode && (
                  <span className="ml-2 text-gray-400">
                    S{currentEpisode.season_number}E{currentEpisode.episode_number}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStreaming}
              disabled={!connected}
              className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                isStreaming
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isStreaming ? (
                <><Square className="w-5 h-5" /> Stop Stream</>
              ) : (
                <><Radio className="w-5 h-5" /> Go Live</>
              )}
            </button>
            <button
              onClick={toggleRecording}
              disabled={!connected}
              className={`px-4 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {isRecording ? 'Stop Rec' : 'Record'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Scene Switcher */}
        <div className="col-span-5 space-y-4">
          <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-500" />
              Quick Scene Switch
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {broadcastScenes.slice(0, 6).map(scene => (
                <button
                  key={scene.id}
                  onClick={() => switchBroadcastScene(scene.id)}
                  className={`p-4 rounded-lg font-semibold transition-all ${
                    activeScene?.id === scene.id
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-2 border-blue-400 scale-105'
                      : 'bg-[#1a1a1a] border border-[#3a3a3a] hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-sm">{scene.scene_name}</div>
                  {activeScene?.id === scene.id && (
                    <div className="text-xs text-blue-300 mt-1">ACTIVE</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scene Templates Quick Access */}
          <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
            <h3 className="text-sm font-bold mb-2 text-gray-400">Scene Templates</h3>
            <div className="flex gap-2">
              {sceneTemplates.slice(0, 4).map(template => (
                <button
                  key={template.id}
                  className="flex-1 px-3 py-2 bg-[#1a1a1a] rounded border border-[#3a3a3a] hover:border-purple-500/50 text-xs"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column - Emergency & Quick Actions */}
        <div className="col-span-3 space-y-4">
          <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                id="clip-marker-btn"
                onClick={markClip}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                <Scissors className="w-5 h-5" />
                MARK CLIP
              </button>
              
              <button
                onClick={handleMuteAll}
                className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                {allMuted ? (
                  <><Volume2 className="w-5 h-5" /> Unmute All</>
                ) : (
                  <><VolumeX className="w-5 h-5" /> MUTE ALL</>
                )}
              </button>
              
              <button
                onClick={() => setShowBlankScreen(!showBlankScreen)}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                {showBlankScreen ? (
                  <><Eye className="w-5 h-5" /> Show Stream</>
                ) : (
                  <><Monitor className="w-5 h-5" /> BRB Screen</>
                )}
              </button>
            </div>
          </div>

          {/* Timer Display */}
          {activeTimer && (
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-400">{activeTimer.name}</span>
              </div>
              <div className="text-3xl font-bold text-center text-green-400">
                {Math.floor(activeTimer.elapsed / 60)}:{(activeTimer.elapsed % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Audio Faders */}
        <div className="col-span-4">
          <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a] h-full">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Music2 className="w-5 h-5 text-green-500" />
              Audio Faders
            </h3>
            <div className="space-y-4">
              {/* Microphone */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Microphone</span>
                  <span className="text-blue-400 font-semibold">{micVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micVolume}
                  onChange={(e) => setMicVolume(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Video Audio */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Video Audio</span>
                  <span className="text-purple-400 font-semibold">{videoVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={videoVolume}
                  onChange={(e) => setVideoVolume(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Music */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Music</span>
                  <span className="text-green-400 font-semibold">{musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OBS Connection Status */}
      {!connected && (
        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 text-center">
          <span className="text-yellow-400 font-semibold">OBS Not Connected - Some features unavailable</span>
        </div>
      )}
    </div>
  )
}
