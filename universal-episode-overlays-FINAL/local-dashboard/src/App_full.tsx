import { useState, useEffect, lazy, Suspense } from 'react'
import { ConnectionPanel } from './components/ConnectionPanel'
import { ShowSelector } from './components/controls/ShowSelector'
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal'
import { SceneSwitcher } from './components/SceneSwitcher'
import { AudioMixer } from './components/AudioMixer'
import { YouTubeQueue } from './components/YouTubeQueue'
import { YouTubePlayer } from './components/YouTubePlayer'
import { TimerPanel } from './components/TimerPanel'
import { RundownEditor } from './components/RundownEditor'
import { NotesPanel } from './components/NotesPanel'
import { StreamControls } from './components/StreamControls'
import { SourceManager } from './components/SourceManager'
import { AudioPresets } from './components/AudioPresets'
import QuickGraphics from './components/graphics/QuickGraphics'
import { Auth, type UserProfile } from './components/Auth'
import { TeamStatus } from './components/TeamStatus'
import { QuickActions } from './components/QuickActions'
import Dashboard from './components/Dashboard'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { useOBSWebSocket } from './hooks/useOBSWebSocket'
import { Radio, Monitor, Keyboard } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Lazy load heavy components (400+ lines) to reduce initial bundle size
const LiveControl = lazy(() => import('./components/LiveControl'))
const LowerThirds = lazy(() => import('./components/LowerThirds').then(module => ({ default: module.LowerThirds })))
const ShowGraphicsGallery = lazy(() => import('./components/graphics/ShowGraphicsGallery').then(module => ({ default: module.ShowGraphicsGallery })))
const ScenesPanel = lazy(() => import('./components/producer/ScenesPanel').then(module => ({ default: module.ScenesPanel })))
const CamerasPanel = lazy(() => import('./components/producer/CamerasPanel').then(module => ({ default: module.CamerasPanel })))
const GraphicsPanel = lazy(() => import('./components/producer/GraphicsPanel').then(module => ({ default: module.GraphicsPanel })))
const ShowManager = lazy(() => import('./components/shows/ShowManager').then(module => ({ default: module.ShowManager })))
const EpisodeManager = lazy(() => import('./components/shows/EpisodeManager').then(module => ({ default: module.EpisodeManager })))
const GuestManager = lazy(() => import('./components/shows/GuestManager').then(module => ({ default: module.GuestManager })))
const LiveBroadcastControl = lazy(() => import('./components/shows/LiveBroadcastControl').then(module => ({ default: module.LiveBroadcastControl })))
const MediaLibrary = lazy(() => import('./components/media/MediaLibrary').then(module => ({ default: module.MediaLibrary })))
const PlaylistManager = lazy(() => import('./components/media/PlaylistManager').then(module => ({ default: module.PlaylistManager })))
const SceneComposer = lazy(() => import('./components/scenes/SceneComposer').then(module => ({ default: module.SceneComposer })))
const SceneTemplates = lazy(() => import('./components/scenes/SceneTemplates').then(module => ({ default: module.SceneTemplates })))
const EnhancedTemplates = lazy(() => import('./components/scenes/EnhancedTemplates'))
const TransitionControl = lazy(() => import('./components/scenes/TransitionControl').then(module => ({ default: module.TransitionControl })))
const AudioMixerPro = lazy(() => import('./components/audio/AudioMixerPro').then(module => ({ default: module.AudioMixerPro })))
const AudioDucking = lazy(() => import('./components/audio/AudioDucking').then(module => ({ default: module.AudioDucking })))
const SoundEffectsBoard = lazy(() => import('./components/audio/SoundEffectsBoard').then(module => ({ default: module.SoundEffectsBoard })))
const MusicLibrary = lazy(() => import('./components/audio/MusicLibrary').then(module => ({ default: module.MusicLibrary })))
const ResourceMonitor = lazy(() => import('./components/tools/ResourceMonitor').then(module => ({ default: module.ResourceMonitor })))
const QualityPresets = lazy(() => import('./components/tools/QualityPresets').then(module => ({ default: module.QualityPresets })))
const ClipMarkers = lazy(() => import('./components/tools/ClipMarkers').then(module => ({ default: module.ClipMarkers })))
const StreamProfiles = lazy(() => import('./components/tools/StreamProfiles').then(module => ({ default: module.StreamProfiles })))
const DiscordSettings = lazy(() => import('./components/settings/DiscordSettings').then(module => ({ default: module.DiscordSettings })))

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
)

type TabType = 'dashboard' | 'live' | 'scenes' | 'sources' | 'media' | 'audio' | 'production' | 'graphics' | 'settings' | 'monitor' | 'advanced'

function App() {
  const obs = useOBSWebSocket()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Debug: Log when activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab)
  }, [activeTab])

  const handleConnect = async (address: string, password: string) => {
    await obs.connect({ address, password })
  }

  const handleAuthChange = (newUser: SupabaseUser | null, newProfile: UserProfile | null) => {
    setUser(newUser)
    setProfile(newProfile)
  }

  // Role-based access control
  const canAccessProduction = true
  const canAccessAdvanced = true
  const canControlOBS = true

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Show shortcuts on '?'
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setShowShortcuts(true)
      }

      // Function key shortcuts for graphics (F1-F7)
      if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
        const graphicMap: Record<string, string> = {
          'F1': 'live-badge',
          'F2': 'brb-screen',
          'F3': 'coming-soon',
          'F4': 'tech-difficulties',
          'F5': 'please-standby',
          'F6': 'starting-soon',
        };

        if (graphicMap[e.key]) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('showQuickGraphic', { 
            detail: { graphicId: graphicMap[e.key] } 
          }));
        }

        // F7: Hide graphic
        if (e.key === 'F7') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('hideQuickGraphic'));
        }
      }

      // Navigation shortcuts with Ctrl
      if (e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
          case 'h': e.preventDefault(); setActiveTab('dashboard'); break
          case 'l': e.preventDefault(); setActiveTab('live'); break
          case 's': e.preventDefault(); setActiveTab('scenes'); break
          case 'm': e.preventDefault(); setActiveTab('media'); break
          case 'a': e.preventDefault(); setActiveTab('audio'); break
          case 'g': e.preventDefault(); setActiveTab('graphics'); break
        }
      }

      // Quick actions with Ctrl+Shift
      if (e.ctrlKey && e.shiftKey) {
        switch(e.key) {
          case 'M': 
            e.preventDefault(); 
            // Trigger mute all
            window.dispatchEvent(new CustomEvent('quickAction', { detail: { action: 'muteAll' } }));
            break
          case 'R': 
            e.preventDefault(); 
            // Trigger mark clip
            window.dispatchEvent(new CustomEvent('quickAction', { detail: { action: 'markClip' } }));
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#3a3a3a] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Live Stream Production Dashboard</h1>
              <p className="text-sm text-gray-400">OBS Control & Show Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2 mr-4 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', color: '#2563eb', icon: '🏠' },
                { id: 'live', label: 'Live Control', color: '#dc2626', icon: '🎬' },
                { id: 'scenes', label: 'Scenes', color: '#2563eb', icon: '📺' },
                { id: 'sources', label: 'Sources', color: '#ea580c', icon: '🎥' },
                { id: 'media', label: 'Media', color: '#9333ea', icon: '📚' },
                { id: 'audio', label: 'Audio', color: '#16a34a', icon: '🔊' },
                { id: 'production', label: 'Production', color: '#ca8a04', icon: '📋' },
                { id: 'graphics', label: 'Graphics', color: '#db2777', icon: '🎨' },
                { id: 'settings', label: 'Settings', color: '#6b7280', icon: '⚙️' },
                { id: 'monitor', label: 'Monitor', color: '#0891b2', icon: '📊' },
                { id: 'advanced', label: 'Advanced', color: '#9333ea', icon: '🔧' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log('Tab clicked:', tab.id)
                    setActiveTab(tab.id as TabType)
                    console.log('State should update to:', tab.id)
                  }}
                  className={`px-3 py-2 rounded font-semibold transition-colors whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? tab.color : undefined
                  }}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <ShowSelector />
            <button
              onClick={() => setShowShortcuts(true)}
              className="bg-[#2a2a2a] hover:bg-[#333] px-3 py-2 rounded flex items-center gap-2"
              title="Keyboard Shortcuts (?)">
              <Keyboard className="w-4 h-4" />
            </button>
            <Auth onAuthChange={handleAuthChange} />
            <a
              href="/broadcast"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 rounded font-semibold flex items-center gap-2 transition-all"
              title="Open Broadcast View for OBS"
            >
              <Monitor className="w-4 h-4" />
              Broadcast View
            </a>
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Main Content */}
      <main className="p-6 pb-20">
        {activeTab === 'dashboard' && (
          <Dashboard />
        )}

        {activeTab === 'live' && (
          <Suspense fallback={<LoadingFallback />}>
            <LiveControl
              obs={obs.obs}
              connected={obs.connected}
              currentScene={obs.currentScene}
              scenes={obs.scenes}
              onSwitchScene={obs.switchScene}
              user={user}
            />
          </Suspense>
        )}

        {activeTab === 'production' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              <LiveBroadcastControl />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ShowManager />
                <EpisodeManager />
              </div>
              <GuestManager />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <RundownEditor />
              <NotesPanel />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              <YouTubeQueue onPlayVideo={setCurrentVideoId} />
              <div className="h-[400px]">
                <YouTubePlayer videoId={currentVideoId} />
              </div>
            </div>
              {user && <TeamStatus currentUserId={user.id} />}
            </div>
          </Suspense>
        )}

        {activeTab === 'media' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              <MediaLibrary />
              <PlaylistManager />
            </div>
          </Suspense>
        )}

        {activeTab === 'scenes' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ScenesPanel />
                <TransitionControl />
              </div>
              <SceneTemplates />
              <EnhancedTemplates />
              <SceneComposer />
            </div>
          </Suspense>
        )}

        {activeTab === 'audio' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              <AudioMixerPro />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AudioDucking />
                <SoundEffectsBoard />
              </div>
              <MusicLibrary />
            </div>
          </Suspense>
        )}

        {activeTab === 'sources' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              {canControlOBS && (
                <ConnectionPanel
                  connected={obs.connected}
                  connecting={obs.connecting}
                  error={obs.error}
                  onConnect={handleConnect}
                  onDisconnect={obs.disconnect}
                />
              )}
              <CamerasPanel />
              <SourceManager obs={obs.obs} connected={obs.connected} currentScene={obs.currentScene} />
            </div>
          </Suspense>
        )}

        {activeTab === 'graphics' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              <QuickGraphics />
              <ShowGraphicsGallery />
              <GraphicsPanel />
              <LowerThirds obs={obs.obs} connected={obs.connected} />
            </div>
          </Suspense>
        )}

        {activeTab === 'settings' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              <DiscordSettings />
              <StreamProfiles />
              <QualityPresets />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AudioPresets obs={obs.obs} connected={obs.connected} inputs={obs.inputs} />
                <TimerPanel />
              </div>
            </div>
          </Suspense>
        )}

        {activeTab === 'monitor' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="space-y-6">
              <ResourceMonitor />
              <ClipMarkers />
            </div>
          </Suspense>
        )}

        {activeTab === 'advanced' && canAccessAdvanced && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-2 border-purple-500/30 rounded-lg p-4">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Monitor className="w-6 h-6 text-purple-400" />
                Advanced Browser-Based Controls
              </h2>
              <p className="text-gray-300 text-sm">
                Advanced technical settings and legacy OBS controls for power users.
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SceneSwitcher
                scenes={obs.scenes}
                currentScene={obs.currentScene}
                onSwitchScene={obs.switchScene}
                disabled={!obs.connected}
              />
              <StreamControls obs={obs.obs} connected={obs.connected} />
            </div>
            <AudioMixer
              inputs={obs.inputs}
              onSetMute={obs.setInputMute}
              onSetVolume={obs.setInputVolume}
              getInputVolume={obs.getInputVolume}
              disabled={!obs.connected}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#3a3a3a] px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              OBS Status: 
              <span className={obs.connected ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                {obs.connected ? 'Connected' : 'Disconnected'}
              </span>
            </span>
            {obs.currentScene && (
              <span className="text-gray-500">
                Current Scene: <span className="text-white ml-1">{obs.currentScene}</span>
              </span>
            )}
          </div>
          <span className="text-gray-600">MiniMax Agent - Live Production Dashboard</span>
        </div>
      </footer>
    </div>
  )
}

export default App
