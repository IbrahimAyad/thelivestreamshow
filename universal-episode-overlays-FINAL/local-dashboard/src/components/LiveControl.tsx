// src/components/LiveControl.tsx
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useScene } from '../contexts/SceneContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useRealtimeChannel } from '../hooks/useRealtimeChannel'
import { LowerThirdControl } from './controls/LowerThirdControl'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import OBSWebSocket from 'obs-websocket-js'

interface LiveControlProps {
  obs: OBSWebSocket
  connected: boolean
  currentScene: string | null
  scenes: Array<{ sceneName: string; sceneUuid: string }>
  onSwitchScene: (sceneName: string) => Promise<void>
  user: SupabaseUser | null
}

interface BroadcastScene {
  id: string
  scene_name: string
  layout_type: string
  is_active: boolean
  obs_scene_name: string | null
}

const LiveControl: React.FC<LiveControlProps> = ({ obs, connected, currentScene, scenes, onSwitchScene, user }) => {
  // Use global scene context
  const { activeScene: contextScene, applyScene } = useScene()
  
  // State for database scenes
  const [broadcastScenes, setBroadcastScenes] = useState<BroadcastScene[]>([])
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [sceneTemplates, setSceneTemplates] = useState<any[]>([])
  
  // State for audio levels (0-100)
  const [micVolume, setMicVolume] = useState<number>(75);
  const [videoVolume, setVideoVolume] = useState<number>(80);
  const [musicVolume, setMusicVolume] = useState<number>(50);
  
  // State for emergency controls
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false)
  const [isStandbyMode, setIsStandbyMode] = useState<boolean>(false)
  const [currentShow, setCurrentShow] = useState<any>(null)
  const [currentEpisode, setCurrentEpisode] = useState<any>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamDuration, setStreamDuration] = useState('00:00:00')
  const [streamStartTime, setStreamStartTime] = useState<Date | null>(null)
  const [shows, setShows] = useState<any[]>([])
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState<any[]>([])
  const [audioInputs, setAudioInputs] = useState<string[]>([])

  // Load broadcast scenes from Supabase
  useEffect(() => {
    loadBroadcastScenes()
    loadBroadcastMetadata()
    loadShows()
  }, [])

  // Use stable realtime channel for live control changes
  useRealtimeChannel('live_control_changes_stable', {
    table: 'broadcast_scenes',
    onChange: (payload) => {
      console.log('📹 Live control updated via realtime:', payload)
      loadBroadcastScenes()
    },
    onError: (error) => {
      console.error('❌ Live control realtime channel error:', error)
    }
  })

  // Load audio inputs when OBS connects
  useEffect(() => {
    const loadAudioInputs = async () => {
      if (connected && obs) {
        try {
          const { inputs } = await obs.call('GetInputList')
          // Filter for audio inputs only
          const audioSources = inputs
            .filter((input: any) => 
              input.inputKind?.includes('audio') || 
              input.inputKind?.includes('wasapi') ||
              input.inputKind?.includes('pulse') ||
              input.inputKind?.includes('coreaudio')
            )
            .map((input: any) => input.inputName)
          
          setAudioInputs(audioSources)
        } catch (err) {
          console.error('Failed to load audio inputs:', err)
          // Fallback to common defaults
          setAudioInputs(['Mic/Aux', 'Desktop Audio'])
        }
      }
    }
    
    loadAudioInputs()
  }, [connected, obs])

  // Load show templates when show is selected
  useEffect(() => {
    if (selectedShowId) {
      loadShowTemplates(selectedShowId)
    }
  }, [selectedShowId])

  // Load all scene templates for emergency controls
  useEffect(() => {
    loadAllSceneTemplates()
  }, [])

  const loadAllSceneTemplates = async () => {
    const { data } = await supabase
      .from('scene_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setSceneTemplates(data)
    }
  }

  // Update stream duration timer
  useEffect(() => {
    if (isStreaming && streamStartTime) {
      const interval = setInterval(() => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - streamStartTime.getTime()) / 1000)
        const hours = Math.floor(diff / 3600)
        const minutes = Math.floor((diff % 3600) / 60)
        const seconds = diff % 60
        setStreamDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isStreaming, streamStartTime])

  // Check OBS streaming status
  useEffect(() => {
    if (connected) {
      checkStreamingStatus()
    }
  }, [connected])

  const loadBroadcastScenes = async () => {
    const { data, error } = await supabase
      .from('broadcast_scenes')
      .select('*')
      .order('created_at')
      .limit(8)
    
    if (data && !error) {
      setBroadcastScenes(data as BroadcastScene[])
      const active = data.find((s: BroadcastScene) => s.is_active)
      if (active) setActiveSceneId(active.id)
    }
  }

  const loadBroadcastMetadata = async () => {
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

  const checkStreamingStatus = async () => {
    if (!connected) return
    try {
      const status = await obs.call('GetStreamStatus')
      setIsStreaming(status.outputActive)
      
      if (status.outputActive) {
        // Try to get actual stream start time from localStorage
        const storedStartTime = localStorage.getItem('streamStartTime')
        
        if (storedStartTime) {
          setStreamStartTime(new Date(storedStartTime))
        } else if (!streamStartTime) {
          // Calculate approximate start time based on output duration
          const actualStartTime = new Date(Date.now() - (status.outputDuration || 0))
          setStreamStartTime(actualStartTime)
          localStorage.setItem('streamStartTime', actualStartTime.toISOString())
        }
      } else {
        // Stream stopped, clear stored time
        localStorage.removeItem('streamStartTime')
        setStreamStartTime(null)
        setStreamDuration('00:00:00')
      }
    } catch (err) {
      console.error('Failed to get stream status:', err)
    }
  }

  const loadShows = async () => {
    const { data } = await supabase
      .from('shows')
      .select('*')
      .order('name')
    
    if (data) {
      setShows(data)
      // Auto-select first show if available
      if (data.length > 0 && !selectedShowId) {
        setSelectedShowId(data[0].id)
      }
    }
  }

  const loadShowTemplates = async (showId: string) => {
    const { data } = await supabase
      .from('scene_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      // Filter templates by show_id in config
      const filtered = data.filter((t: any) => {
        const config = t.config as any
        return config?.show_id === showId
      })
      setShowTemplates(filtered)
    }
  }

  const applyTemplate = async (template: any) => {
    try {
      const config = template.config

      // Clear existing sources
      await supabase.from('stream_sources').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // Add sources from template
      if (config?.sources) {
        for (const source of config.sources) {
          await supabase.from('stream_sources').insert({
            source_type: source.type,
            source_url: source.source_url || null,
            position_x: source.position_x || 0,
            position_y: source.position_y || 0,
            width: source.width || 400,
            height: source.height || 300,
            z_index: source.z_index || 1,
            is_active: true,
            volume: source.volume || 100,
            config: source.config || {}
          })
        }
      }

      alert(`✅ Template "${template.name}" applied!`)
    } catch (err) {
      console.error('Failed to apply template:', err)
      alert('❌ Failed to apply template')
    }
  }

  const handleSceneSwitch = async (scene: BroadcastScene) => {
    try {
      // Update database
      await supabase
        .from('broadcast_scenes')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      await supabase
        .from('broadcast_scenes')
        .update({ is_active: true })
        .eq('id', scene.id)

      setActiveSceneId(scene.id)

      // Switch OBS scene if connected and obs_scene_name is set
      if (connected && scene.obs_scene_name) {
        await onSwitchScene(scene.obs_scene_name)
      }
    } catch (err) {
      console.error('Scene switch error:', err)
    }
  }

  const handleMarkClip = async () => {
    try {
      const { error } = await supabase
        .from('clip_markers')
        .insert({
          timestamp: new Date().toISOString(),
          title: `Clip ${new Date().toLocaleTimeString()}`,
          show_id: currentShow?.id || null,
          episode_id: currentEpisode?.id || null,
          is_clipped: false
        })
      
      if (error) {
        console.error('Failed to save clip marker:', error)
        alert('❌ Failed to save clip marker')
      } else {
        alert(`✂️ Clip marked at ${new Date().toLocaleTimeString()}`)
      }
    } catch (err) {
      console.error('Clip marker error:', err)
      alert('❌ Error creating clip marker')
    }
  }

  const handleBRB = async () => {
    try {
      // Find the "BRB Screen" template
      const brbTemplate = sceneTemplates.find(t => 
        t.name.toLowerCase().includes('brb') ||
        t.name.toLowerCase().includes('be right back')
      )
      
      if (brbTemplate) {
        const config = brbTemplate.config as any
        await applyScene(
          brbTemplate.id,
          brbTemplate.name,
          config,
          config?.thumbnail_url || brbTemplate.thumbnail_url
        )
      }
    } catch (err) {
      console.error('BRB error:', err)
    }
  }

  const handleStandby = async () => {
    try {
      // Find the "Starting Soon" or standby template
      const standbyTemplate = sceneTemplates.find(t => 
        t.name.toLowerCase().includes('starting soon') ||
        t.name.toLowerCase().includes('standby')
      )
      
      if (standbyTemplate) {
        const config = standbyTemplate.config as any
        await applyScene(
          standbyTemplate.id,
          standbyTemplate.name,
          config,
          config?.thumbnail_url || standbyTemplate.thumbnail_url
        )
        setIsStandbyMode(true)
      }
    } catch (err) {
      console.error('Standby mode error:', err)
    }
  }

  const handleMuteAll = async () => {
    const newMuteState = !isAudioMuted
    setIsAudioMuted(newMuteState)
    
    if (connected && audioInputs.length > 0) {
      try {
        let successCount = 0
        for (const input of audioInputs) {
          try {
            await obs.call('SetInputMute', { 
              inputName: input, 
              inputMuted: newMuteState 
            })
            successCount++
          } catch (err) {
            // Log but continue with other inputs
            console.warn(`Could not mute ${input}:`, err)
          }
        }
        
        if (successCount > 0) {
          toast.success(`Audio ${newMuteState ? 'muted' : 'unmuted'} (${successCount} sources)`)
        } else {
          toast.error('Failed to mute audio sources')
        }
      } catch (err) {
        console.error('Mute all error:', err)
        toast.error('Failed to mute audio')
      }
    } else if (!connected) {
      toast.error('OBS not connected')
    } else {
      toast.error('No audio inputs found')
    }
    
    // Visual feedback for local state
    if (newMuteState) {
      setMicVolume(0)
      setVideoVolume(0)
      setMusicVolume(0)
    } else {
      setMicVolume(75)
      setVideoVolume(80)
      setMusicVolume(50)
    }
  }

  // Keyboard shortcuts (must be after function definitions)
  useKeyboardShortcuts({
    sceneTemplates,
    onBRB: handleBRB,
    onStandby: handleStandby,
    onMuteAll: handleMuteAll
  })

  return (
    <div className="p-6 text-white h-full overflow-y-auto bg-[#1a1a1a]">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🎬 Live Control Dashboard
          </h1>
          <span className="text-sm text-gray-400">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* Show Selector */}
        {shows.length > 0 && (
          <div className="flex items-center gap-3 bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a]">
            <label className="text-sm font-semibold text-gray-300">Active Show:</label>
            <select
              value={selectedShowId || ''}
              onChange={(e) => setSelectedShowId(e.target.value)}
              className="bg-[#1a1a1a] border border-[#3a3a3a] rounded px-4 py-2 text-white font-semibold flex-1 max-w-xs"
              style={{
                color: shows.find(s => s.id === selectedShowId)?.theme_color || '#fff'
              }}
            >
              {shows.map(show => (
                <option key={show.id} value={show.id}>{show.name}</option>
              ))}
            </select>
            
            {/* Quick Template Buttons */}
            {showTemplates.length > 0 && (
              <div className="flex gap-2 ml-auto">
                <span className="text-xs text-gray-400 self-center">Quick Templates:</span>
                {showTemplates.slice(0, 4).map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-xs font-semibold transition-colors"
                    title={template.description || template.name}
                  >
                    {template.name.length > 15 ? template.name.substring(0, 15) + '...' : template.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Scene Indicator */}
      {contextScene && (
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="relative">
              <div className="w-24 h-14 bg-black rounded border-2 border-green-500 overflow-hidden">
                {contextScene.thumbnail_url ? (
                  <img 
                    src={contextScene.thumbnail_url} 
                    alt={contextScene.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    📺
                  </div>
                )}
              </div>
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            </div>

            {/* Scene Info */}
            <div className="flex-1">
              <div className="text-xs text-green-400 font-semibold mb-1">ACTIVE SCENE</div>
              <div className="text-xl font-bold text-white">{contextScene.name}</div>
              {contextScene.config?.show && (
                <div className="text-sm text-gray-300 mt-1">🎬 {contextScene.config.show}</div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleBRB}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold text-sm transition-colors"
                title="Quick BRB"
              >
                🔴 BRB
              </button>
              <button
                onClick={handleStandby}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-semibold text-sm transition-colors"
                title="Standby Screen"
              >
                ⏸️ Standby
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quick Scene Switcher */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg shadow-lg border border-[#3a3a3a]">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📺 Quick Scene Switcher
            <span className="text-sm font-normal text-gray-400 ml-auto">
              Active: {broadcastScenes.find(s => s.id === activeSceneId)?.scene_name || currentScene || 'None'}
            </span>
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {broadcastScenes.length > 0 ? (
              broadcastScenes.map((scene) => {
                const isActive = scene.id === activeSceneId || scene.obs_scene_name === currentScene
                const icon = getSceneIcon(scene.scene_name)
                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSceneSwitch(scene)}
                    disabled={!connected && !scene.obs_scene_name}
                    className={`p-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isActive
                        ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-500/50 border-2 border-red-400'
                        : 'bg-[#1a1a1a] hover:bg-[#252525] border border-[#3a3a3a] hover:border-blue-500/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{icon}</div>
                    <div className="text-xs">{scene.scene_name}</div>
                    {isActive && (
                      <div className="text-xs text-red-300 mt-1">● LIVE</div>
                    )}
                  </button>
                )
              })
            ) : (
              <div className="col-span-4 text-center text-gray-500 py-8">
                No scenes configured. Create scenes in the Scenes tab.
              </div>
            )}
          </div>
        </div>

        {/* Audio Mixer Quick Faders */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg shadow-lg border border-[#3a3a3a]">
          <h2 className="text-xl font-semibold mb-4">🔊 Audio Quick Mix</h2>
          <div className="space-y-6">
            {/* Microphone */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">🎤 Microphone</label>
                <span className="text-sm text-blue-400 font-semibold">{micVolume}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micVolume}
                  onChange={(e) => setMicVolume(Number(e.target.value))}
                  className="w-full h-3 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${micVolume}%, #1a1a1a ${micVolume}%, #1a1a1a 100%)`
                  }}
                  disabled={isAudioMuted}
                />
                {/* Volume level indicator */}
                <div className="flex gap-1 mt-2">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded ${
                        i < Math.floor(micVolume / 10)
                          ? 'bg-blue-500'
                          : 'bg-[#1a1a1a]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Video Audio */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">🎥 Video Audio</label>
                <span className="text-sm text-purple-400 font-semibold">{videoVolume}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={videoVolume}
                  onChange={(e) => setVideoVolume(Number(e.target.value))}
                  className="w-full h-3 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${videoVolume}%, #1a1a1a ${videoVolume}%, #1a1a1a 100%)`
                  }}
                  disabled={isAudioMuted}
                />
                <div className="flex gap-1 mt-2">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded ${
                        i < Math.floor(videoVolume / 10)
                          ? 'bg-purple-500'
                          : 'bg-[#1a1a1a]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Music */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">🎵 Music</label>
                <span className="text-sm text-green-400 font-semibold">{musicVolume}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-full h-3 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${musicVolume}%, #1a1a1a ${musicVolume}%, #1a1a1a 100%)`
                  }}
                  disabled={isAudioMuted}
                />
                <div className="flex gap-1 mt-2">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded ${
                        i < Math.floor(musicVolume / 10)
                          ? 'bg-green-500'
                          : 'bg-[#1a1a1a]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Third Control */}
        <LowerThirdControl />

        {/* Clip Marker & Emergency Controls */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg shadow-lg border border-[#3a3a3a] xl:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            ⚡ Quick Actions
            <span className="text-xs font-normal text-gray-400">Emergency Controls</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Clip Marker */}
            <button
              onClick={handleMarkClip}
              className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 p-6 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30 border border-purple-400/50"
            >
              <div className="text-4xl mb-2">✂️</div>
              <div>Mark Clip</div>
              <div className="text-xs font-normal text-purple-200 mt-1">
                Create highlight
              </div>
            </button>

            {/* BRB Screen */}
            <button
              onClick={handleBRB}
              className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 p-6 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-red-500/30 border border-red-400/50"
            >
              <div className="text-4xl mb-2">🔴</div>
              <div>BRB Screen</div>
              <div className="text-xs font-normal text-red-200 mt-1">
                Be Right Back
              </div>
            </button>

            {/* Mute All Audio */}
            <button
              onClick={handleMuteAll}
              className={`p-6 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg border ${
                isAudioMuted
                  ? 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-gray-500/30 border-gray-400/50'
                  : 'bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 shadow-yellow-500/30 border-yellow-400/50'
              }`}
            >
              <div className="text-4xl mb-2">{isAudioMuted ? '🔇' : '🔊'}</div>
              <div>{isAudioMuted ? 'Unmute All' : 'Mute All'}</div>
              <div className="text-xs font-normal text-yellow-100 mt-1">
                {isAudioMuted ? 'Restore audio' : 'Emergency mute'}
              </div>
            </button>

            {/* Standby Screen */}
            <button
              onClick={handleStandby}
              className="bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 p-6 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30 border border-orange-400/50"
            >
              <div className="text-4xl mb-2">⏸️</div>
              <div>Standby</div>
              <div className="text-xs font-normal text-orange-100 mt-1">
                Starting Soon
              </div>
            </button>
          </div>
        </div>

        {/* Stream Status Widget */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg shadow-lg border border-[#3a3a3a] xl:col-span-2">
          <h2 className="text-xl font-semibold mb-4">📊 Stream Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
              <div className="text-sm text-gray-400 mb-1">OBS Status</div>
              <div className={`text-lg font-bold flex items-center gap-2 ${
                connected ? 'text-green-400' : 'text-gray-500'
              }`}>
                <span className={`w-3 h-3 rounded-full ${
                  connected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                }`}></span>
                {connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
              <div className="text-sm text-gray-400 mb-1">Stream Status</div>
              <div className={`text-lg font-bold flex items-center gap-2 ${
                isStreaming ? 'text-red-400' : 'text-gray-500'
              }`}>
                {isStreaming ? (
                  <>
                    <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></span>
                    LIVE
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                    OFFLINE
                  </>
                )}
              </div>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
              <div className="text-sm text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-bold">{streamDuration}</div>
            </div>
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
              <div className="text-sm text-gray-400 mb-1">Current Scene</div>
              <div className="text-lg font-bold truncate">{currentScene || 'None'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon for scene based on name
function getSceneIcon(sceneName: string): string {
  const name = sceneName.toLowerCase()
  if (name.includes('camera') || name.includes('cam')) return '🎥'
  if (name.includes('screen') || name.includes('desktop')) return '💻'
  if (name.includes('interview') || name.includes('talk')) return '👥'
  if (name.includes('game') || name.includes('gameplay')) return '🎮'
  if (name.includes('brb') || name.includes('standby') || name.includes('break')) return '⏸️'
  if (name.includes('intro') || name.includes('opening')) return '🎬'
  if (name.includes('outro') || name.includes('ending')) return '🎞️'
  if (name.includes('chat') || name.includes('comment')) return '💬'
  if (name.includes('music') || name.includes('audio')) return '🎵'
  if (name.includes('graphic') || name.includes('overlay')) return '🎨'
  return '📺' // Default icon
}

export default LiveControl
