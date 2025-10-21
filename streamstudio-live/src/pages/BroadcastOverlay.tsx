import { useEffect, useState } from 'react'
import { usePlaybackStateListener } from '@/hooks/usePlaybackStateListener'
import { BroadcastVisualizer } from '@/components/BroadcastVisualizer'
import { reconstructFrequencyData } from '@/utils/frequencyAnalyzer'

/**
 * Broadcast Overlay - VISUALIZATION ONLY
 * 
 * This component does NOT load or play any audio.
 * It listens to playback state from the control panel via Supabase real-time
 * and displays visualizations using REAL audio analysis data (bass/mid/high).
 * 
 * Audio playback happens ONLY on the control panel.
 * Frequency data is streamed from the control panel's analyser to the database.
 */
export function BroadcastOverlay() {
  const playbackState = usePlaybackStateListener()
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(1024))

  // Log once on mount (not on every render!)
  useEffect(() => {
    console.log('[Broadcast] 📺 Visualization-only mode - using REAL audio data from control panel')
  }, [])

  // Reconstruct frequency data from bass/mid/high values
  // This updates whenever new audio analysis data arrives from the control panel
  useEffect(() => {
    if (!playbackState.isPlaying) {
      // When paused, show zeros
      setFrequencyData(new Uint8Array(1024))
      return
    }

    // Use real audio analysis data from control panel
    const reconstructedData = reconstructFrequencyData(
      playbackState.audioBass,
      playbackState.audioMid,
      playbackState.audioHigh,
      1024 // Buffer length for visualizer
    )
    
    setFrequencyData(reconstructedData)
    
    // Log once per second
    const sum = reconstructedData.reduce((a, b) => a + b, 0)
    console.log(`[Broadcast] 🎨 Using REAL data - Bass: ${playbackState.audioBass.toFixed(2)}, Mid: ${playbackState.audioMid.toFixed(2)}, High: ${playbackState.audioHigh.toFixed(2)} (sum: ${sum})`)
  }, [
    playbackState.isPlaying,
    playbackState.audioBass,
    playbackState.audioMid,
    playbackState.audioHigh
  ])

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <BroadcastVisualizer
        analyser={null} // No local audio - using real frequency data from control panel
        mockFrequencyData={frequencyData} // Real data reconstructed from bass/mid/high
        currentTrack={playbackState.currentTrack}
        isPlaying={playbackState.isPlaying}
        playbackPosition={playbackState.position}
        duration={playbackState.duration}
        activeDeck="A" // Simplified for visualization
        bpm={playbackState.bpm}
        energy={playbackState.energy}
        autodjActive={playbackState.autodjActive}
      />

      {/* Phase 7C - Copyright Warning Banner */}
      {playbackState.currentTrack && !playbackState.currentTrack.is_stream_safe && 
       playbackState.currentTrack.license_type === 'copyrighted' && playbackState.isPlaying && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-red-600/95 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border-2 border-red-400 animate-pulse">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">COPYRIGHT WARNING</div>
              <div className="text-sm">This track is copyrighted and may result in DMCA strikes during streaming</div>
            </div>
          </div>
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-green-600/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          REAL-TIME AUDIO ANALYSIS (BASS: {playbackState.audioBass.toFixed(2)} | MID: {playbackState.audioMid.toFixed(2)} | HIGH: {playbackState.audioHigh.toFixed(2)})
        </div>
      </div>
    </div>
  )
}
