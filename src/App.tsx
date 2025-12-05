import { useEffect, useState, useRef } from 'react'
import { AuthProviderWithBoundary } from './contexts/AuthContext'
import { ShowProviderWithBoundary } from './contexts/ShowContext'
import { QuestionBannerControl } from './components/QuestionBannerControl'
import { GraphicsGallery } from './components/GraphicsGallery'
import { MorningNewsControl } from './components/MorningNewsControl'
import OverlayGrid from './components/OverlayGrid'
import { WhiteboardControl } from './components/WhiteboardControl'
import { LowerThirdControl } from './components/LowerThirdControl'
import { BetaBotDirectorPanel } from './components/BetaBotDirectorPanel'
import { QuickActions } from './components/QuickActions'
import { ShowPrepPanel } from './components/ShowPrepPanel'
import { SoundboardPanel } from './components/SoundboardPanel'
import { SegmentControlPanel } from './components/SegmentControlPanel'
import { BroadcastSettingsPanel } from './components/BroadcastSettingsPanel'
import { PopupQueuePanel } from './components/PopupQueuePanel'
import { EpisodeInfoPanel } from './components/EpisodeInfoPanel'
import { ShowMetadataControl } from './components/ShowMetadataControl'
import { MorningShowDashboard } from './components/MorningShowDashboard'
import { OperatorNotesPanel } from './components/OperatorNotesPanel'
import { BookmarkPanel } from './components/BookmarkPanel'
import { BetaBotControlPanel } from './components/BetaBotControlPanel'
import { AudioControlCenter } from './components/AudioControlCenter'
import { ScarlettAudioPanel } from './components/scarlett/ScarlettAudioPanel'
import { ProducerAIPanel } from './components/ProducerAIPanel'
import { SystemHealthMonitor } from './components/SystemHealthMonitor'
import { ShowManagerPanel } from './components/ShowManagerPanel'
import { ShowSelector } from './components/ShowSelector'
import { TemplateSelector } from './components/TemplateSelector'
import { TemplateCreatorModal } from './components/TemplateCreatorModal'
import { ShowHistoryPanel } from './components/ShowHistoryPanel'
import { AutomationFeedPanel } from './components/AutomationFeedPanel'
import { AutomationConfigPanel } from './components/AutomationConfigPanel'
import { ManualTriggerPanel } from './components/ManualTriggerPanel'
import { TriggerRulesPanel } from './components/TriggerRulesPanel'
import { OBSConnectionPanel } from './components/OBSConnectionPanel'
import { TranscriptionPanel } from './components/TranscriptionPanel'
import { AIAnalysisPanel } from './components/AIAnalysisPanel'
import { SuggestionApprovalPanel } from './components/SuggestionApprovalPanel'
import { ExecutionHistoryPanel } from './components/ExecutionHistoryPanel'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { MusicPlayerControls } from './components/studio/MusicPlayerControls'
import { ControlPanel as StudioControlPanel } from './pages/studio/StudioControlPanel'
import { VideoPlayerControl } from './pages/media/VideoPlayerControl'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useDualDeckAudioPlayer } from './hooks/studio/useDualDeckAudioPlayer'
import { useProductionAlertHotkey } from './hooks/useProductionAlertHotkey'
import { ShowIntroController } from './components/ShowIntroController'
import { supabase } from './lib/supabase'
import { Monitor, ExternalLink, Keyboard, Home, Music2, Image as ImageIcon, Sparkles } from 'lucide-react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AITab } from './components/AITab'

type Tab = 'dashboard' | 'studio' | 'media' | 'ai'

function App() {
  const broadcastUrl = window.location.origin + '/broadcast'
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showManagement, setShowManagement] = useState(false)
  const [showTemplateCreator, setShowTemplateCreator] = useState(false)
  const soundboardRef = useRef<any>(null)
  const segmentRef = useRef<any>(null)

  // Initialize dual deck audio player at app level
  // This allows music to play across all tabs
  const dualDeck = useDualDeckAudioPlayer()

  // Track audio playback state for visual indicator
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  // Enable Production Alert hotkey (Press "P" to trigger)
  useProductionAlertHotkey()

  useEffect(() => {
    const checkAudioState = setInterval(() => {
      const deckAPlaying = dualDeck.deckA.getDeckState().isPlaying
      const deckBPlaying = dualDeck.deckB.getDeckState().isPlaying
      setIsAudioPlaying(deckAPlaying || deckBPlaying)
    }, 500)

    return () => clearInterval(checkAudioState)
  }, [dualDeck])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSoundboard: async (index: number) => {
      const { data: effects } = await supabase
        .from('soundboard_effects')
        .select('*')
        .order('effect_name');

      if (effects && effects[index]) {
        await supabase
          .from('soundboard_effects')
          .update({ is_playing: true })
          .eq('id', effects[index].id);

        setTimeout(async () => {
          await supabase
            .from('soundboard_effects')
            .update({ is_playing: false })
            .eq('id', effects[index].id);
        }, 3000);
      }
    },
    onSegment: async (index: number) => {
      const { data: segments } = await supabase
        .from('show_segments')
        .select('*')
        .order('created_at');

      if (segments && segments[index]) {
        await supabase
          .from('show_segments')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        await supabase
          .from('show_segments')
          .update({ is_active: true })
          .eq('id', segments[index].id);
      }
    },
    onEmergencyClear: async () => {
      if (confirm('Clear all active overlays?')) {
        await Promise.all([
          supabase.from('question_banners').update({ is_visible: false }).neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('broadcast_graphics').update({ is_visible: false }).neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('lower_thirds').update({ is_visible: false }).neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('show_segments').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('show_questions').update({ is_played: false }).neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('soundboard_effects').update({ is_playing: false }).neq('id', '00000000-0000-0000-0000-000000000000')
        ]);
      }
    }
  })

  return (
    <AuthProviderWithBoundary>
      <ShowProviderWithBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
          {/* Header */}
          <header className="border-b-2 border-gray-800 bg-gray-950 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Stream Enhancement Dashboard</h1>
                    <p className="text-sm text-gray-400">Unified control for live streaming</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Audio Playing Indicator */}
                  {isAudioPlaying && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/50 border border-purple-500/50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      <Music2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-300">Audio Playing</span>
                    </div>
                  )}

                  <ShowSelector onManageShows={() => setShowManagement(true)} />
                  <SystemHealthMonitor />
                  <button
                    onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    title="Show keyboard shortcuts"
                  >
                    <Keyboard className="w-5 h-5" />
                    Shortcuts
                  </button>
                  <a
                    href={broadcastUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/50"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Broadcast View
                  </a>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 mt-4 border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-red-600 to-yellow-600 text-white border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${activeTab === 'studio'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-b-2 border-pink-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                  <Music2 className="w-5 h-5" />
                  Studio
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${activeTab === 'media'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  Media
                </button>
                {import.meta.env.VITE_ENABLE_AI_TAB !== 'false' && (
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${activeTab === 'ai'
                      ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-b-2 border-amber-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    AI
                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">BETA</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Keyboard Shortcuts Help Modal */}
          {showKeyboardHelp && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setShowKeyboardHelp(false)}>
              <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-8 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Keyboard className="w-7 h-7 text-blue-400" />
                  Keyboard Shortcuts
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Soundboard Effects</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">F1</kbd> <span className="text-gray-300">Applause</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">F2</kbd> <span className="text-gray-300">Laughter</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">F3</kbd> <span className="text-gray-300">Cheers</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">F4</kbd> <span className="text-gray-300">Gasps</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">F5</kbd> <span className="text-gray-300">Agreement</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">F6</kbd> <span className="text-gray-300">Thinking</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-400 mb-2">Show Segments</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">Ctrl+1</kbd> <span className="text-gray-300">Intro</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">Ctrl+2</kbd> <span className="text-gray-300">Part 1</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">Ctrl+3</kbd> <span className="text-gray-300">Part 2</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">Ctrl+4</kbd> <span className="text-gray-300">Part 3</span></div>
                      <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-gray-800 rounded font-mono">Ctrl+5</kbd> <span className="text-gray-300">Outro</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Emergency Controls</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <kbd className="px-2 py-1 bg-gray-800 rounded font-mono">Esc</kbd>
                      <span className="text-gray-300">Clear all active overlays</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="mt-6 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}

          {/* Show Management Modal */}
          {showManagement && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setShowManagement(false)}>
              <div className="bg-gray-900 border-2 border-purple-600/50 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <ShowManagerPanel />
              </div>
            </div>
          )}

          {/* Tab Content */}
          <main className="max-w-7xl mx-auto px-6 py-8">
            {activeTab === 'dashboard' && (
              <>
                {/* 🎵 GLOBAL MUSIC PLAYER */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-600/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Music2 className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-purple-300">DJ Fernando</h3>
                    </div>
                    <MusicPlayerControls />
                  </div>
                </div>

                {/* 🎬 SHOW START - Start Show Controls */}
                <ErrorBoundary sectionName="Show Start Controls">
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                      ▶️ Show Start
                      <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full font-bold">START HERE</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {/* Unified Dashboard */}
                      <div className="w-full">
                        <MorningShowDashboard />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2">
                          <GraphicsGallery />
                        </div>
                        <div>
                          <WhiteboardControl />
                        </div>
                        <div className="lg:col-span-2">
                          <OverlayGrid onOverlaySelect={(overlayId) => {
                            console.log('Overlay selected:', overlayId);
                            // Future: Activate overlay in broadcast view
                          }} />
                        </div>
                        <div><BetaBotDirectorPanel /></div>
                        <div className="lg:col-span-2"><SegmentControlPanel /></div>
                        <div className="lg:col-span-2"><PopupQueuePanel /></div>
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>

                {/* 🔴 LIVE CONTROLS */}
                <ErrorBoundary sectionName="Live Controls">
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                      🔴 Live Controls
                      <span className="text-xs px-2 py-1 bg-red-500 text-white rounded-full font-bold animate-pulse">LIVE</span>
                    </h3>
                    <div className="mb-6"><AudioControlCenter /></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div><QuickActions /></div>
                      <div className="lg:col-span-2"><BetaBotControlPanel /></div>
                      <div><ScarlettAudioPanel /></div>
                      <div className="xl:col-span-2"><QuestionBannerControl /></div>
                      <div><LowerThirdControl /></div>
                      <div className="lg:col-span-2"><SoundboardPanel /></div>
                    </div>
                  </div>
                </ErrorBoundary>

                {/* 🎬 SHOW MANAGEMENT */}
                <ErrorBoundary sectionName="Show Management">
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-purple-400 mb-4 uppercase tracking-wide">🎬 Show Management</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="lg:col-span-2"><ShowPrepPanel /></div>
                      {import.meta.env.VITE_ENABLE_AI_TAB === 'false' && (
                        <div className="lg:col-span-2"><ProducerAIPanel /></div>
                      )}
                      <div className="lg:col-span-2"><BroadcastSettingsPanel /></div>
                      <div className="lg:col-span-2"><OperatorNotesPanel /></div>
                      <div><BookmarkPanel /></div>
                      <div className="lg:col-span-2">
                        <TemplateSelector
                          onTemplateLoaded={() => console.log('Template loaded')}
                          onCreateTemplate={() => setShowTemplateCreator(true)}
                        />
                      </div>
                      <div className="lg:col-span-2"><ShowHistoryPanel /></div>
                    </div>
                  </div>
                </ErrorBoundary>

                <TemplateCreatorModal
                  isOpen={showTemplateCreator}
                  onClose={() => setShowTemplateCreator(false)}
                  onTemplateCreated={() => console.log('Template created')}
                />

                {/* ⚡ AI AUTO-DIRECTOR - Only show if AI tab is disabled */}
                {import.meta.env.VITE_ENABLE_AI_TAB === 'false' && (
                  <ErrorBoundary sectionName="AI Auto-Director System">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                        ⚡ AI Auto-Director & Automation
                        <span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded-full font-bold">BETA</span>
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2"><AutomationConfigPanel /></div>
                        <div className="lg:col-span-2"><OBSConnectionPanel /></div>
                        <div className="lg:col-span-2"><TranscriptionPanel /></div>
                        <div className="lg:col-span-2"><AIAnalysisPanel /></div>
                        <div className="lg:col-span-2"><SuggestionApprovalPanel /></div>
                        <div className="lg:col-span-2"><ExecutionHistoryPanel /></div>
                        <div className="lg:col-span-2"><AnalyticsDashboard /></div>
                        <div className="lg:col-span-2"><ManualTriggerPanel /></div>
                        <div className="lg:col-span-2"><TriggerRulesPanel /></div>
                        <div className="lg:col-span-2"><AutomationFeedPanel /></div>
                      </div>
                    </div>
                  </ErrorBoundary>
                )}

                {/* Broadcast Preview */}
                <div className="mt-8 bg-black border-2 border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Monitor className="w-6 h-6 text-yellow-400" />
                      Broadcast Preview
                    </h2>
                    <p className="text-sm text-gray-400">Live preview of your overlays</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={broadcastUrl}
                        className="absolute inset-0 w-full h-full border-0"
                        title="Broadcast Preview"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                  <p>Add the Broadcast View URL as a Browser Source in OBS: <code className="bg-gray-800 px-2 py-1 rounded text-yellow-400">{broadcastUrl}</code></p>
                  <p className="mt-2">Recommended Browser Source size: 1920x1080</p>
                </div>
              </>
            )}

            {activeTab === 'studio' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-600/30 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">🎵 StreamStudio Live</h2>
                  <p className="text-gray-300">Professional DJ controls, music library, and audio effects for your stream</p>
                </div>
                <ErrorBoundary sectionName="StreamStudio Live">
                  <StudioControlPanel />
                </ErrorBoundary>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* 🎵 GLOBAL MUSIC PLAYER */}
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-600/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Music2 className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-300">Background Music</h3>
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">Plays across all tabs</span>
                  </div>
                  <MusicPlayerControls />
                </div>

                <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-2 border-blue-600/30 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">📺 Media Manager</h2>
                  <p className="text-gray-300">YouTube video queue, image gallery, and stream monitoring</p>
                </div>
                <ErrorBoundary sectionName="Media Manager">
                  <VideoPlayerControl />
                </ErrorBoundary>
              </div>
            )}

            {activeTab === 'ai' && import.meta.env.VITE_ENABLE_AI_TAB !== 'false' && (
              <ErrorBoundary sectionName="AI Tab">
                <AITab />
              </ErrorBoundary>
            )}
          </main>
        </div>
      </ShowProviderWithBoundary>
    </AuthProviderWithBoundary>
  )
}

export default App
