import { useEffect, useState, useRef } from 'react'
import { AuthProviderWithBoundary } from './contexts/AuthContext'
import { ShowProviderWithBoundary } from './contexts/ShowContext'
import { QuestionBannerControl } from './components/QuestionBannerControl'
import { GraphicsGallery } from './components/GraphicsGallery'
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
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { supabase } from './lib/supabase'
import { Monitor, ExternalLink, Keyboard } from 'lucide-react'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const broadcastUrl = window.location.origin + '/broadcast'
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showManagement, setShowManagement] = useState(false)
  const [showTemplateCreator, setShowTemplateCreator] = useState(false)
  const soundboardRef = useRef<any>(null)
  const segmentRef = useRef<any>(null)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSoundboard: async (index: number) => {
      // Trigger soundboard effect by index (F1-F6)
      const { data: effects } = await supabase
        .from('soundboard_effects')
        .select('*')
        .order('effect_name');
      
      if (effects && effects[index]) {
        // Trigger the effect
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
      // Switch to segment by index (Ctrl+1-5)
      const { data: segments } = await supabase
        .from('show_segments')
        .select('*')
        .order('created_at');
      
      if (segments && segments[index]) {
        // Deactivate all
        await supabase
          .from('show_segments')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Activate selected
        await supabase
          .from('show_segments')
          .update({ is_active: true })
          .eq('id', segments[index].id);
      }
    },
    onEmergencyClear: async () => {
      // Escape: Clear all overlays
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
      <header className="border-b-2 border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Stream Enhancement Dashboard</h1>
                <p className="text-sm text-gray-400">Easy overlay control for engaging streams</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 🎬 SHOW START - Start Show Controls */}
        <ErrorBoundary sectionName="Show Start Controls">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wide flex items-center gap-2">
              ▶️ Show Start
              <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full font-bold">START HERE</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Show Metadata Control - START SHOW */}
              <div>
                <ShowMetadataControl />
              </div>

              {/* Episode Info Panel */}
              <div>
                <EpisodeInfoPanel />
              </div>

              {/* Graphics Gallery */}
              <div>
                <GraphicsGallery />
              </div>

              {/* BetaBot Director - AI Suggestions */}
              <div>
                <BetaBotDirectorPanel />
              </div>

              {/* Segment Control - Spans 2 columns */}
              <div className="lg:col-span-2">
                <SegmentControlPanel />
              </div>

              {/* Popup Queue Manager - Spans 2 columns */}
              <div className="lg:col-span-2">
                <PopupQueuePanel />
              </div>
            </div>
          </div>
        </ErrorBoundary>

        {/* 🔴 LIVE CONTROLS - Most frequently used during stream */}
        <ErrorBoundary sectionName="Live Controls">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wide flex items-center gap-2">
              🔴 Live Controls
              <span className="text-xs px-2 py-1 bg-red-500 text-white rounded-full font-bold animate-pulse">LIVE</span>
            </h3>

            {/* Audio Control Center - Prominent setup wizard */}
            <div className="mb-6">
              <AudioControlCenter />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Quick Actions - Emergency controls */}
              <div>
                <QuickActions />
              </div>

              {/* BetaBot AI Co-Host - Spans 2 columns */}
              <div className="lg:col-span-2">
                <BetaBotControlPanel />
              </div>

              {/* Scarlett Solo Audio Control */}
              <div>
                <ScarlettAudioPanel />
              </div>

              {/* Question Banner - Spans 2 columns on xl */}
              <div className="xl:col-span-2">
                <QuestionBannerControl />
              </div>

              {/* Lower Thirds */}
              <div>
                <LowerThirdControl />
              </div>

              {/* Soundboard - Spans 2 columns */}
              <div className="lg:col-span-2">
                <SoundboardPanel />
              </div>
            </div>
          </div>
        </ErrorBoundary>

        {/* 🎬 SHOW MANAGEMENT - Setup once per segment */}
        <ErrorBoundary sectionName="Show Management">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-purple-400 mb-4 uppercase tracking-wide">🎬 Show Management</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Show Prep - Spans 2 columns */}
              <div className="lg:col-span-2">
                <ShowPrepPanel />
              </div>

              {/* Producer AI - Spans 2 columns */}
              <div className="lg:col-span-2">
                <ProducerAIPanel />
              </div>

              {/* Broadcast Settings - Spans 2 columns */}
              <div className="lg:col-span-2">
                <BroadcastSettingsPanel />
              </div>

              {/* Operator Notes Panel - Spans 2 columns */}
              <div className="lg:col-span-2">
                <OperatorNotesPanel />
              </div>

              {/* Bookmark Panel */}
              <div>
                <BookmarkPanel />
              </div>

              {/* Template Selector - Spans 2 columns */}
              <div className="lg:col-span-2">
                <TemplateSelector
                  onTemplateLoaded={() => {
                    // Optionally refresh or notify user
                    console.log('Template loaded successfully')
                  }}
                  onCreateTemplate={() => setShowTemplateCreator(true)}
                />
              </div>

              {/* Show History Panel - Spans 2 columns */}
              <div className="lg:col-span-2">
                <ShowHistoryPanel />
              </div>
            </div>
          </div>
        </ErrorBoundary>

        {/* Template Creator Modal */}
        <TemplateCreatorModal
          isOpen={showTemplateCreator}
          onClose={() => setShowTemplateCreator(false)}
          onTemplateCreated={() => {
            // Optionally refresh template list
            console.log('Template created successfully')
          }}
        />

        {/* ⚡ AI AUTO-DIRECTOR & AUTOMATION - Background monitoring */}
        <ErrorBoundary sectionName="AI Auto-Director System">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wide flex items-center gap-2">
              ⚡ AI Auto-Director & Automation
              <span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded-full font-bold">BETA</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Automation Config - Control Panel */}
              <div className="lg:col-span-2">
                <AutomationConfigPanel />
              </div>

              {/* OBS Camera Control */}
              <div className="lg:col-span-2">
                <OBSConnectionPanel />
              </div>

              {/* Live Transcription & Keyword Detection */}
              <div className="lg:col-span-2">
                <TranscriptionPanel />
              </div>

              {/* AI Context Analysis */}
              <div className="lg:col-span-2">
                <AIAnalysisPanel />
              </div>

              {/* Pending Suggestions - Approval UI */}
              <div className="lg:col-span-2">
                <SuggestionApprovalPanel />
              </div>

              {/* Execution History */}
              <div className="lg:col-span-2">
                <ExecutionHistoryPanel />
              </div>

              {/* Analytics & Learning Dashboard */}
              <div className="lg:col-span-2">
                <AnalyticsDashboard />
              </div>

              {/* Manual Trigger Testing */}
              <div className="lg:col-span-2">
                <ManualTriggerPanel />
              </div>

              {/* Trigger Rules Manager */}
              <div className="lg:col-span-2">
                <TriggerRulesPanel />
              </div>

              {/* Automation Feed - Event Log */}
              <div className="lg:col-span-2">
                <AutomationFeedPanel />
              </div>
            </div>
          </div>
        </ErrorBoundary>

        {/* Broadcast Preview */}
        <div className="mt-8 bg-black border-2 border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Monitor className="w-6 h-6 text-yellow-400" />
              Broadcast Preview
            </h2>
            <p className="text-sm text-gray-400">Live preview of your overlays (scaled down)</p>
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

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Add the Broadcast View URL as a Browser Source in OBS: <code className="bg-gray-800 px-2 py-1 rounded text-yellow-400">{broadcastUrl}</code></p>
          <p className="mt-2">Recommended Browser Source size: 1920x1080</p>
        </div>
      </main>
        </div>
      </ShowProviderWithBoundary>
    </AuthProviderWithBoundary>
  )
}

export default App
