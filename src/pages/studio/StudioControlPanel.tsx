import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Settings, Music2, Mic2, Download, Filter, Plus, Bot, BarChart3, Clock, Radio, Shield, Palette, Save, Music, Activity } from 'lucide-react'
import { useAudioPlayer } from '@/hooks/studio/useAudioPlayer'
import { useMusicLibrary } from '@/hooks/studio/useMusicLibrary'
import { usePlaylists } from '@/hooks/studio/usePlaylists'
import { useAudioSettings } from '@/hooks/studio/useAudioSettings'
import { usePlaybackSync } from '@/hooks/studio/usePlaybackSync'
import { useShowQuestionsMonitor } from '@/hooks/studio/useShowQuestionsMonitor'
import { analyzeFrequencyBands } from '@/utils/studio/frequencyAnalyzer'
import { MusicPlayerControls } from '@/components/studio/MusicPlayerControls'
import { AudioVisualizer } from '@/components/studio/AudioVisualizer'
import { AudioLevelMeter } from '@/components/studio/AudioLevelMeter'
import { UploadDialog } from '@/components/studio/UploadDialog'
import { DownloadAudioModal } from '@/components/studio/DownloadAudioModal'
import { AudioClipperModal } from '@/components/studio/AudioClipperModal'
import { TrackListItem } from '@/components/studio/TrackListItem'
import { SoundDropButton } from '@/components/studio/SoundDropButton'
import { PlaylistManager } from '@/components/studio/PlaylistManager'
import { DuckingIndicator } from '@/components/studio/DuckingIndicator'
import { AIPlaybackIndicator } from '@/components/studio/AIPlaybackIndicator'
import { AudioEffectsPanel } from '@/components/studio/AudioEffectsPanel'
import { TrackMetadataEditor } from '@/components/studio/TrackMetadataEditor'
import { SmartPlaylistBuilder } from '@/components/studio/SmartPlaylistBuilder'
import { SmartPlaylistsPanel } from '@/components/studio/SmartPlaylistsPanel'
import { CrossfadeControls } from '@/components/studio/CrossfadeControls'
import { CrossfadeIndicator } from '@/components/studio/CrossfadeIndicator'
import { TrackAnalyzerPanel } from '@/components/studio/TrackAnalyzerPanel'
import { AutoDJPanel } from '@/components/studio/AutoDJPanel'
import { TrackPickerModal } from '@/components/studio/TrackPickerModal'
import { SoundEffectsPanel } from '@/components/studio/SoundEffectsPanel'
import { QueuePanel } from '@/components/studio/QueuePanel'
import { PresetModeSelector } from '@/components/studio/PresetModeSelector'
import { OnboardingTour } from '@/components/studio/OnboardingTour'
import { Tooltip } from '@/components/studio/Tooltip'
import { BeatMatchingPanel } from '@/components/studio/BeatMatchingPanel'
import { ProfessionalSamplerPanel } from '@/components/studio/ProfessionalSamplerPanel'
import { EQPanel } from '@/components/studio/EQPanel'
import { FXChainPanel } from '@/components/studio/FXChainPanel'
import { RecordingPanel } from '@/components/studio/RecordingPanel'
import { VinylModePanel } from '@/components/studio/VinylModePanel'
import { SavedMixesPanel } from '@/components/studio/SavedMixesPanel'
import { VisualizationPresetsPanel } from '@/components/studio/VisualizationPresetsPanel'
import { AIChatPanel } from '@/components/studio/AIChatPanel'
import { AnalyticsPanel } from '@/components/studio/AnalyticsPanel'
import { SchedulerPanel } from '@/components/studio/SchedulerPanel'
import { EmergencyControlsPanel } from '@/components/studio/EmergencyControlsPanel'
import { MicDuckingPanel } from '@/components/studio/MicDuckingPanel'
import { StreamSafetyPanel } from '@/components/studio/StreamSafetyPanel'
import { CollapsibleSection } from '@/components/studio/CollapsibleSection'
import { useAutoDJ } from '@/hooks/studio/useAutoDJ'
import { usePlayQueue } from '@/hooks/studio/usePlayQueue'
import type { MusicTrack, AudioEffectsConfig, AutoDJSettings } from '@/types/database'
import type { ScoredTrack } from '@/utils/trackScorer'

export function ControlPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'music' | 'jingle'>('all')
  const [jingleTypeFilter, setJingleTypeFilter] = useState<string>('all')
  const [currentPlayingJingle, setCurrentPlayingJingle] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [clipperTrack, setClipperTrack] = useState<MusicTrack | null>(null)
  const [metadataTrack, setMetadataTrack] = useState<MusicTrack | null>(null)
  const [showSmartPlaylistBuilder, setShowSmartPlaylistBuilder] = useState(false)
  const [showDJPanel, setShowDJPanel] = useState(false)
  const [showTrackPicker, setShowTrackPicker] = useState(false)
  const [queuedTrack, setQueuedTrack] = useState<MusicTrack | null>(null)
  const [activeDJTab, setActiveDJTab] = useState<'autodj' | 'effects' | 'performance' | 'tools'>('autodj')
  const [beginnerMode, setBeginnerMode] = useState(() => {
    const saved = localStorage.getItem('beginner-mode');
    return saved ? JSON.parse(saved) : true;
  });

  // Initialize Play Queue
  const playQueue = usePlayQueue()

  // Save beginner mode preference
  useEffect(() => {
    localStorage.setItem('beginner-mode', JSON.stringify(beginnerMode));
  }, [beginnerMode]);

  const audioPlayer = useAudioPlayer()
  const { tracks, loading, uploading, uploadProgress, uploadTrack, deleteTrack, refreshTracks } = useMusicLibrary()
  const { playlists, createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist, reorderPlaylistTracks } = usePlaylists()
  const { settings, updateSettings } = useAudioSettings()
  const { playbackState, updatePlaybackState } = usePlaybackSync()

  // Auto-ducking monitoring for show_questions table
  const handleTTSStart = useCallback(async () => {
    if (settings?.ducking_enabled && audioPlayer.isPlaying) {
      await audioPlayer.duck(settings.ducking_level)
    }
  }, [audioPlayer, settings])

  const handleTTSEnd = useCallback(async () => {
    if (settings?.ducking_enabled && audioPlayer.isPlaying) {
      await audioPlayer.unduck()
    }
  }, [audioPlayer, settings])

  const { isMonitoring, startMonitoring, stopMonitoring } = useShowQuestionsMonitor(
    handleTTSStart,
    handleTTSEnd
  )

  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<MusicTrack[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

  // Initialize Auto-DJ with queue integration
  // Filter tracks for Auto-DJ based on stream mode
  const autoDJTracks = useMemo(() => {
    const streamMode = localStorage.getItem('streamSafeMode') === 'true';
    if (!streamMode) return tracks;
    // Only include stream-safe tracks when stream mode is ON
    return tracks.filter(track => 
      track.is_stream_safe || 
      track.license_type === 'royalty_free' || 
      track.license_type === 'creative_commons'
    );
  }, [tracks]);

  const autoDJ = useAutoDJ({
    currentTrack: audioPlayer.currentTrack,
    isPlaying: audioPlayer.isPlaying,
    playbackPosition: audioPlayer.playbackPosition,
    duration: audioPlayer.duration,
    allTracks: autoDJTracks,
    onTrackQueue: (track, reason, score) => {
      playQueue.addToQueue(track, reason, score)
      setQueuedTrack(track)
    }
  })

  // Real-time audio analysis sync to database (for broadcast overlay)
  useEffect(() => {
    if (!audioPlayer.isPlaying || !audioPlayer.analyser || !audioPlayer.currentTrack) {
      return
    }

    console.log('[ControlPanel] 🎵 Audio analysis sync started')

    let updateCount = 0
    let lastLogTime = Date.now()

    // Update frequency data every 100ms
    const interval = setInterval(() => {
      updateCount++
      
      // Read current values inside the interval (not from closure)
      if (!audioPlayer.analyser) {
        console.error('[ControlPanel] ⚠️ Analyser node is null!')
        return
      }
      
      // Extract frequency bands
      const frequencyBands = analyzeFrequencyBands(audioPlayer.analyser)
      
      // Log once per second (not every 100ms!)
      const now = Date.now()
      if (now - lastLogTime >= 1000) {
        console.log(`[ControlPanel] 📊 Audio: Bass=${frequencyBands.bass.toFixed(2)}, Mid=${frequencyBands.mid.toFixed(2)}, High=${frequencyBands.high.toFixed(2)}`)
        lastLogTime = now
      }
      
      // Update database with playback position and frequency data
      updatePlaybackState({
        playback_position: audioPlayer.playbackPosition,
        audio_bass: frequencyBands.bass,
        audio_mid: frequencyBands.mid,
        audio_high: frequencyBands.high,
      }).catch(err => {
        console.error('[ControlPanel] ❌ Database update failed:', err)
      })
    }, 100)

    return () => {
      console.log('[ControlPanel] 🔇 Audio analysis sync stopped')
      clearInterval(interval)
    }
  }, [audioPlayer.isPlaying, audioPlayer.analyser, audioPlayer.currentTrack])

  // Auto-DJ: When current track ends, play next from queue
  useEffect(() => {
    if (playQueue.autoAdvanceEnabled && !audioPlayer.isPlaying && audioPlayer.playbackPosition === 0 && playQueue.nextTrack) {
      // Current track ended, play next from queue
      const nextTrackData = playQueue.nextTrack;
      handlePlayTrack(nextTrackData.track);
      playQueue.moveToNext(audioPlayer.currentTrack || undefined);
    }
  }, [audioPlayer.isPlaying, audioPlayer.playbackPosition, playQueue.nextTrack, playQueue.autoAdvanceEnabled])

  // Jingle audio player (separate from background music)
  const jingleAudioRef = useState(() => new Audio())[0]

  // Filter tracks
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || track.category === categoryFilter
    const matchesJingleType =
      jingleTypeFilter === 'all' ||
      (track.category === 'jingle' && track.jingle_type === jingleTypeFilter)
    return matchesSearch && matchesCategory && matchesJingleType
  })

  const musicTracks = filteredTracks.filter((t) => t.category === 'music')
  const jingleTracks = tracks.filter((t) => t.category === 'jingle')

  // Group jingles by type
  const jinglesByType = {
    intro: jingleTracks.filter((j) => j.jingle_type === 'intro'),
    outro: jingleTracks.filter((j) => j.jingle_type === 'outro'),
    stinger: jingleTracks.filter((j) => j.jingle_type === 'stinger'),
    custom: jingleTracks.filter((j) => j.jingle_type === 'custom'),
  }

  // Update playlist tracks when playlist changes
  useEffect(() => {
    if (!currentPlaylist) {
      setPlaylistTracks([])
      return
    }

    const playlist = playlists.find((p) => p.id === currentPlaylist)
    if (!playlist || !playlist.track_ids) {
      setPlaylistTracks([])
      return
    }

    const pTracks = playlist.track_ids
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean) as MusicTrack[]
    setPlaylistTracks(pTracks)
  }, [currentPlaylist, playlists, tracks])

  // Handle file upload
  const handleUpload = async (files: File[], metadata: { friendly_name?: string; jingle_type?: string }) => {
    for (const file of files) {
      try {
        await uploadTrack(file, {
          category: categoryFilter === 'jingle' ? 'jingle' : 'music',
          jingle_type: metadata.jingle_type,
          friendly_name: metadata.friendly_name,
        })
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
    setShowUploadDialog(false)
  }

  // Play track
  const handlePlayTrack = async (track: MusicTrack) => {
    await audioPlayer.loadTrack(track)
    await audioPlayer.play()
    
    // Sync to database
    await updatePlaybackState({
      current_track_id: track.id,
      is_playing: true,
    })
  }

  // Pause
  const handlePause = async () => {
    audioPlayer.pause()
    await updatePlaybackState({ is_playing: false })
  }

  // Stop
  const handleStop = async () => {
    audioPlayer.stop()
    await updatePlaybackState({
      is_playing: false,
      playback_position: 0,
    })
  }

  // Previous track
  const handlePrevious = () => {
    if (playlistTracks.length === 0) return
    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlistTracks.length - 1
    setCurrentTrackIndex(newIndex)
    handlePlayTrack(playlistTracks[newIndex])
  }

  // Next track
  const handleNext = () => {
    if (playlistTracks.length === 0) return
    const newIndex = audioPlayer.isShuffling
      ? Math.floor(Math.random() * playlistTracks.length)
      : (currentTrackIndex + 1) % playlistTracks.length
    setCurrentTrackIndex(newIndex)
    handlePlayTrack(playlistTracks[newIndex])
  }

  // Play jingle
  const handleJingleTrigger = async (jingle: MusicTrack) => {
    setCurrentPlayingJingle(jingle.id)
    jingleAudioRef.src = jingle.file_url
    jingleAudioRef.volume = (settings?.jingles_volume || 0.8)
    
    // Trigger ducking if enabled
    if (settings?.ducking_enabled && audioPlayer.isPlaying) {
      await audioPlayer.duck(settings.ducking_level)
    }
    
    await jingleAudioRef.play()
    
    jingleAudioRef.onended = async () => {
      setCurrentPlayingJingle(null)
      // Unduck after jingle ends
      if (settings?.ducking_enabled && audioPlayer.isPlaying) {
        await audioPlayer.unduck()
      }
    }
  }

  // Manual ducking trigger
  const handleManualDuck = async () => {
    if (audioPlayer.isDucking) {
      await audioPlayer.unduck()
    } else {
      await audioPlayer.duck(settings?.ducking_level || 0.3)
    }
  }

  // Handle create clip
  const handleCreateClip = (track: MusicTrack) => {
    setClipperTrack(track)
  }

  // Handle clipper success
  const handleClipperSuccess = () => {
    // Tracks will be refreshed by the modal itself using refreshTracks callback
  }

  // Handle metadata edit
  const handleEditMetadata = (track: MusicTrack) => {
    setMetadataTrack(track)
  }

  // Handle metadata save
  const handleMetadataSave = () => {
    refreshTracks()
  }

  // Handle effects change (real-time preview)
  const handleEffectsChange = (effects: AudioEffectsConfig) => {
    audioPlayer.applyEffects(effects)
  }

  // Auto-DJ handlers
  const handleAcceptSuggestion = () => {
    autoDJ.acceptSuggestion()
  }

  const handleSkipSuggestion = () => {
    autoDJ.skipSuggestion()
  }

  const handleLockCustomTrack = () => {
    setShowTrackPicker(true)
  }

  const handleTrackSelected = (track: MusicTrack) => {
    autoDJ.lockCustomTrack(track)
  }

  const handleEnergyRequest = (energy: number) => {
    autoDJ.requestEnergy(energy)
  }

  const handleAutoDJSettingsChange = (settings: Partial<AutoDJSettings>) => {
    autoDJ.updateSettings(settings)
  }

  // Handle load smart playlist
  const handleLoadSmartPlaylist = (tracks: MusicTrack[]) => {
    setPlaylistTracks(tracks)
    setCurrentTrackIndex(0)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Onboarding Tour */}
      <OnboardingTour />

      <DuckingIndicator 
        isDucking={audioPlayer.isDucking} 
        duckingLevel={settings?.ducking_level || 0.3}
      />
      <AIPlaybackIndicator />

      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music2 className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold">StreamStudio Live</h1>
          </div>
          <div className="flex gap-2">
            <Tooltip content="Toggle beginner mode for helpful tooltips and visual guides">
              <button
                onClick={() => setBeginnerMode(!beginnerMode)}
                className={`px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${
                  beginnerMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {beginnerMode ? 'Beginner' : 'Expert'}
              </button>
            </Tooltip>
            <Tooltip content="Access DJ tools including Auto-DJ, Sound FX, and more">
              <button
                onClick={() => setShowDJPanel(!showDJPanel)}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  showDJPanel
                    ? 'bg-primary-600 text-neutral-100'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
                }`}
              >
                DJ Tools
              </button>
            </Tooltip>
            <Tooltip content="Audio settings and preferences">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded hover:bg-neutral-800 transition-colors duration-150"
              >
                <Settings className="w-6 h-6" />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Phase 7A - Emergency Broadcast Controls (Most Prominent Position) */}
      <div className="px-6 pt-6">
        <EmergencyControlsPanel
          isPlaying={audioPlayer.isPlaying}
          volume={audioPlayer.volume}
          currentTrack={audioPlayer.currentTrack?.title || null}
          position={audioPlayer.playbackPosition}
          onFadeOut={() => {
            // Trigger 2-second fade out
            const fadeOutDuration = 2000;
            const startVolume = audioPlayer.volume;
            const startTime = Date.now();
            
            const fadeInterval = setInterval(() => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / fadeOutDuration, 1);
              const newVolume = startVolume * (1 - progress);
              
              audioPlayer.changeVolume(newVolume);
              
              if (progress >= 1) {
                clearInterval(fadeInterval);
                handlePause();
                audioPlayer.changeVolume(0);
              }
            }, 50);
          }}
        />
      </div>

      <div className="grid grid-cols-12 gap-6 p-6">
        {/* Left Column - Music Library */}
        <div className="col-span-4 space-y-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Music Library</h2>
            
            {/* Search and filter */}
            <div className="mb-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-base focus:outline-none focus:border-primary-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 ${
                    categoryFilter === 'all'
                      ? 'bg-primary-600 text-neutral-100'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCategoryFilter('music')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 ${
                    categoryFilter === 'music'
                      ? 'bg-primary-600 text-neutral-100'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  Music
                </button>
                <button
                  onClick={() => setCategoryFilter('jingle')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 ${
                    categoryFilter === 'jingle'
                      ? 'bg-primary-600 text-neutral-100'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  Sound Drops
                </button>
              </div>
            </div>

            {/* Upload zone */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowUploadDialog(true)}
                className="py-6 border-2 border-dashed border-neutral-700 rounded-lg bg-neutral-900 hover:border-primary-500 hover:bg-neutral-800 transition-all duration-150 flex flex-col items-center justify-center gap-2"
              >
                <Music2 className="w-7 h-7 text-neutral-400" />
                <p className="text-sm font-medium text-neutral-100">Upload Files</p>
              </button>

              <button
                onClick={() => setShowDownloadModal(true)}
                className="py-6 border-2 border-dashed border-neutral-700 rounded-lg bg-neutral-900 hover:border-blue-500 hover:bg-neutral-800 transition-all duration-150 flex flex-col items-center justify-center gap-2"
              >
                <Download className="w-7 h-7 text-neutral-400" />
                <p className="text-sm font-medium text-neutral-100">Download URL</p>
              </button>
            </div>

            {showUploadDialog && (
              <UploadDialog
                onUpload={handleUpload}
                uploading={uploading}
                uploadProgress={uploadProgress}
                category={categoryFilter === 'jingle' ? 'jingle' : 'music'}
                onClose={() => setShowUploadDialog(false)}
              />
            )}

            {showDownloadModal && (
              <DownloadAudioModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                onSuccess={() => {
                  // Refresh tracks after successful download
                  window.location.reload();
                }}
              />
            )}

            {clipperTrack && (
              <AudioClipperModal
                track={clipperTrack}
                isOpen={!!clipperTrack}
                onClose={() => setClipperTrack(null)}
                onSuccess={handleClipperSuccess}
                refreshTracks={refreshTracks}
              />
            )}

            {metadataTrack && (
              <TrackMetadataEditor
                track={metadataTrack}
                isOpen={!!metadataTrack}
                onClose={() => setMetadataTrack(null)}
                onSave={handleMetadataSave}
              />
            )}

            {showSmartPlaylistBuilder && (
              <SmartPlaylistBuilder
                isOpen={showSmartPlaylistBuilder}
                onClose={() => setShowSmartPlaylistBuilder(false)}
                onSave={() => {
                  setShowSmartPlaylistBuilder(false)
                }}
              />
            )}

            {/* Track list */}
            <div className="mt-4 max-h-[500px] overflow-y-auto">
              {loading ? (
                <p className="text-center text-neutral-400 py-8">Loading tracks...</p>
              ) : filteredTracks.length === 0 ? (
                <p className="text-center text-neutral-400 py-8">No tracks found</p>
              ) : (
                <div className="space-y-1">
                  {filteredTracks.map((track) => (
                    <TrackListItem
                      key={track.id}
                      track={track}
                      isPlaying={audioPlayer.isPlaying}
                      isCurrentTrack={audioPlayer.currentTrack?.id === track.id}
                      onPlay={handlePlayTrack}
                      onPause={handlePause}
                      onDelete={deleteTrack}
                      onCreateClip={handleCreateClip}
                      onEditMetadata={handleEditMetadata}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column - Playlists & Player */}
        <div className="col-span-4 space-y-6">
          <PlaylistManager
            playlists={playlists}
            tracks={tracks}
            currentPlaylistId={currentPlaylist}
            onCreatePlaylist={createPlaylist}
            onSelectPlaylist={setCurrentPlaylist}
            onDeletePlaylist={deletePlaylist}
            onAddTrack={addTrackToPlaylist}
            onRemoveTrack={removeTrackFromPlaylist}
            onReorderTracks={reorderPlaylistTracks}
          />

          <MusicPlayerControls
            currentTrack={audioPlayer.currentTrack}
            isPlaying={audioPlayer.isPlaying}
            playbackPosition={audioPlayer.playbackPosition}
            duration={audioPlayer.duration}
            volume={audioPlayer.volume}
            isMuted={audioPlayer.isMuted}
            isLooping={audioPlayer.isLooping}
            isShuffling={audioPlayer.isShuffling}
            onPlay={audioPlayer.play}
            onPause={handlePause}
            onStop={handleStop}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSeek={audioPlayer.seek}
            onVolumeChange={audioPlayer.changeVolume}
            onToggleMute={audioPlayer.toggleMute}
            onToggleLoop={audioPlayer.toggleLoop}
            onToggleShuffle={audioPlayer.toggleShuffle}
          />

          {/* Audio visualization */}
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Audio Visualization</h3>
            <AudioVisualizer analyser={audioPlayer.analyser} height={80} />
            <div className="mt-3">
              <p className="text-xs text-neutral-400 mb-2">Background Music Level</p>
              <AudioLevelMeter analyser={audioPlayer.analyser} width={400} />
            </div>
          </div>
        </div>

        {/* Right Column - Sound Drops & Controls */}
        <div className="col-span-4 space-y-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Mic2 className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-semibold">Quick Sound Drops</h2>
            </div>

            {/* Intro Sound Drops */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-400 mb-2">INTRO</h3>
              <div className="grid grid-cols-3 gap-2">
                {jinglesByType.intro.map((jingle) => (
                  <SoundDropButton
                    key={jingle.id}
                    soundDrop={jingle}
                    isPlaying={currentPlayingJingle === jingle.id}
                    onTrigger={handleJingleTrigger}
                  />
                ))}
              </div>
            </div>

            {/* Outro Sound Drops */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-400 mb-2">OUTRO</h3>
              <div className="grid grid-cols-3 gap-2">
                {jinglesByType.outro.map((jingle) => (
                  <SoundDropButton
                    key={jingle.id}
                    soundDrop={jingle}
                    isPlaying={currentPlayingJingle === jingle.id}
                    onTrigger={handleJingleTrigger}
                  />
                ))}
              </div>
            </div>

            {/* Stinger Sound Drops */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-400 mb-2">STINGERS</h3>
              <div className="grid grid-cols-3 gap-2">
                {jinglesByType.stinger.map((jingle) => (
                  <SoundDropButton
                    key={jingle.id}
                    soundDrop={jingle}
                    isPlaying={currentPlayingJingle === jingle.id}
                    onTrigger={handleJingleTrigger}
                  />
                ))}
              </div>
            </div>

            {/* Custom Sound Drops */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-2">CUSTOM</h3>
              <div className="grid grid-cols-3 gap-2">
                {jinglesByType.custom.map((jingle) => (
                  <SoundDropButton
                    key={jingle.id}
                    soundDrop={jingle}
                    isPlaying={currentPlayingJingle === jingle.id}
                    onTrigger={handleJingleTrigger}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ducking controls */}
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Audio Ducking</h3>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.ducking_enabled || false}
                  onChange={(e) => updateSettings({ ducking_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-base text-neutral-100">Enable Auto-Ducking</span>
              </label>
              <p className="text-xs text-neutral-400 mt-1 ml-6">
                Automatically reduce music when sound drops or TTS play
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMonitoring}
                  onChange={(e) => e.target.checked ? startMonitoring() : stopMonitoring()}
                  className="w-4 h-4 rounded border-neutral-700 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-base text-neutral-100">Monitor TTS Questions</span>
              </label>
              <p className="text-xs text-neutral-400 mt-1 ml-6">
                Auto-duck when new questions trigger TTS
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">
                Ducking Level: {Math.round((settings?.ducking_level || 0.3) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={(settings?.ducking_level || 0.3) * 100}
                onChange={(e) => updateSettings({ ducking_level: Number(e.target.value) / 100 })}
                className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleManualDuck}
              className={`w-full px-4 py-2 rounded font-medium transition-colors duration-150 ${
                audioPlayer.isDucking
                  ? 'bg-warning-500 hover:bg-warning-600 text-neutral-900'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
              }`}
            >
              {audioPlayer.isDucking ? 'Restore Volume' : 'Manual Duck'}
            </button>
          </div>

          {/* DJ Tools Panel */}
          {showDJPanel && (
            <>
              {/* DJ Tools Tabs */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <div className="flex gap-2 mb-4 border-b border-neutral-700">
                  <button
                    onClick={() => setActiveDJTab('autodj')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      activeDJTab === 'autodj'
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Auto-DJ
                  </button>
                  <button
                    onClick={() => setActiveDJTab('effects')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      activeDJTab === 'effects'
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Effects & EQ
                  </button>
                  <button
                    onClick={() => setActiveDJTab('performance')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      activeDJTab === 'performance'
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => setActiveDJTab('tools')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      activeDJTab === 'tools'
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Tools
                  </button>
                </div>

                {/* Auto-DJ Tab */}
                {activeDJTab === 'autodj' && (
                  <div className="space-y-4">
                    {/* Auto-DJ Panel */}
                    <AutoDJPanel
                      suggestedTrack={autoDJ.suggestedTrack}
                      lockedTrack={autoDJ.lockedTrack}
                      onAcceptSuggestion={handleAcceptSuggestion}
                      onSkipSuggestion={handleSkipSuggestion}
                      onLockCustomTrack={handleLockCustomTrack}
                      onEnergyRequest={handleEnergyRequest}
                      onSettingsChange={handleAutoDJSettingsChange}
                    />

                    {/* Play Queue Panel */}
                    <QueuePanel
                      queue={playQueue.queue}
                      history={playQueue.history}
                      nextTrack={playQueue.nextTrack}
                      queueStats={playQueue.queueStats}
                      autoAdvanceEnabled={playQueue.autoAdvanceEnabled}
                      onRemoveFromQueue={playQueue.removeFromQueue}
                      onClearQueue={playQueue.clearQueue}
                      onMoveToFront={playQueue.moveToFront}
                      onToggleAutoAdvance={playQueue.setAutoAdvanceEnabled}
                    />

                    {/* Preset Mode Selector */}
                    <PresetModeSelector
                      currentSettings={autoDJ.settings}
                      onApplyPreset={handleAutoDJSettingsChange}
                    />
                  </div>
                )}

                {/* Effects & EQ Tab */}
                {activeDJTab === 'effects' && (
                  <div className="space-y-4">
                    {/* EQ & Filters Panel */}
                    <EQPanel audioContext={audioPlayer.audioContext} />

                    {/* Professional FX Chain */}
                    <FXChainPanel audioContext={audioPlayer.audioContext} />

                    {/* Audio Effects */}
                    <AudioEffectsPanel
                      track={audioPlayer.currentTrack}
                      onEffectsChange={handleEffectsChange}
                    />

                    {/* Crossfade Controls */}
                    <CrossfadeControls settings={settings} onUpdateSettings={updateSettings} />
                  </div>
                )}

                {/* Performance Tab */}
                {activeDJTab === 'performance' && (
                  <div className="space-y-4">
                    {/* Beat Matching Panel */}
                    <BeatMatchingPanel
                      currentTrack={audioPlayer.currentTrack}
                      isPlaying={audioPlayer.isPlaying}
                      playbackPosition={audioPlayer.playbackPosition}
                      duration={audioPlayer.duration}
                      onSeek={audioPlayer.seek}
                    />

                    {/* Sound Effects Panel */}
                    <SoundEffectsPanel />

                    {/* Professional Sampler Panel */}
                    <ProfessionalSamplerPanel />

                    {/* Recording Panel */}
                    <RecordingPanel
                      audioContext={audioPlayer.audioContext}
                      masterOutput={audioPlayer.analyser}
                    />

                    {/* Vinyl Mode Panel */}
                    <VinylModePanel audioElement={audioPlayer.audioElement} />
                  </div>
                )}

                {/* Tools Tab */}
                {activeDJTab === 'tools' && (
                  <div className="space-y-3">
                    {/* AI Chat Control - Default Open (most used) */}
                    <CollapsibleSection title="AI DJ Chat" defaultOpen={true} icon={<Bot className="w-5 h-5" />}>
                      <AIChatPanel />
                    </CollapsibleSection>

                    {/* Analytics Dashboard */}
                    <CollapsibleSection title="Analytics Dashboard" icon={<BarChart3 className="w-5 h-5" />}>
                      <AnalyticsPanel />
                    </CollapsibleSection>

                    {/* Scheduled Automation */}
                    <CollapsibleSection title="Scheduled Automation" icon={<Clock className="w-5 h-5" />}>
                      <SchedulerPanel />
                    </CollapsibleSection>

                    {/* Phase 7B - Live Mic Ducking + Effects */}
                    <CollapsibleSection title="Mic Ducking & Effects" icon={<Radio className="w-5 h-5" />}>
                      <MicDuckingPanel
                        audioContext={audioPlayer.audioContext}
                        onDuckingChange={(isDucking, duckAmount) => {
                          if (isDucking) {
                            // Lower music volume when mic is active
                            const currentVolume = audioPlayer.volume;
                            const targetVolume = currentVolume * (1 - duckAmount / 100);
                            audioPlayer.changeVolume(targetVolume);
                          }
                        }}
                      />
                    </CollapsibleSection>

                    {/* Phase 7C - Stream-Safe Music System */}
                    <CollapsibleSection title="Stream Safety Monitor" icon={<Shield className="w-5 h-5" />}>
                      <StreamSafetyPanel />
                    </CollapsibleSection>

                    {/* Broadcast Visualization Presets */}
                    <CollapsibleSection title="Visualization Presets" icon={<Palette className="w-5 h-5" />}>
                      <VisualizationPresetsPanel />
                    </CollapsibleSection>

                    {/* AI Director - Saved Mixes */}
                    <CollapsibleSection title="Saved Mixes" icon={<Save className="w-5 h-5" />}>
                      <SavedMixesPanel />
                    </CollapsibleSection>

                    {/* Smart Playlists */}
                    <CollapsibleSection
                      title="Smart Playlists"
                      icon={<Music className="w-5 h-5" />}
                    >
                      <div>
                        <div className="flex justify-end mb-4">
                          <button
                            onClick={() => setShowSmartPlaylistBuilder(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded text-sm font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Create
                          </button>
                        </div>
                        <SmartPlaylistsPanel onLoadPlaylist={handleLoadSmartPlaylist} />
                      </div>
                    </CollapsibleSection>

                    {/* Track Analyzer */}
                    <CollapsibleSection title="Track Analyzer" icon={<Activity className="w-5 h-5" />}>
                      <TrackAnalyzerPanel onAnalysisComplete={refreshTracks} />
                    </CollapsibleSection>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Track Picker Modal */}
      <TrackPickerModal
        isOpen={showTrackPicker}
        tracks={tracks.filter(t => t.analysis_status === 'complete')}
        onClose={() => setShowTrackPicker(false)}
        onSelect={handleTrackSelected}
      />
    </div>
  )
}
