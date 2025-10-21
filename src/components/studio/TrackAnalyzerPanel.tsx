import { useState, useEffect } from 'react'
import { Music, Loader, CheckCircle, XCircle, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { analyzeAudioFile } from '@/utils/trackAnalyzer'
import type { MusicTrack } from '@/types/database'

interface TrackAnalyzerPanelProps {
  onAnalysisComplete?: () => void
}

export function TrackAnalyzerPanel({ onAnalysisComplete }: TrackAnalyzerPanelProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [reAnalyze, setReAnalyze] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState({ success: 0, failed: 0 })
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch pending tracks count
  useEffect(() => {
    fetchPendingCount()
  }, [])

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('music_library')
      .select('*', { count: 'exact', head: true })
      .neq('analysis_status', 'complete')

    setPendingCount(count || 0)
  }

  const handleAnalyzeAll = async () => {
    setAnalyzing(true)
    setResults({ success: 0, failed: 0 })
    setProgress({ current: 0, total: 0 })

    try {
      // Fetch tracks to analyze
      let query = supabase
        .from('music_library')
        .select('*')

      if (!reAnalyze) {
        query = query.neq('analysis_status', 'complete')
      }

      const { data: tracks, error } = await query

      if (error) throw error
      if (!tracks || tracks.length === 0) {
        alert('No tracks to analyze')
        setAnalyzing(false)
        return
      }

      setProgress({ current: 0, total: tracks.length })

      // Process tracks in chunks of 3 (parallel processing)
      const chunkSize = 3
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < tracks.length; i += chunkSize) {
        const chunk = tracks.slice(i, i + chunkSize)

        // Process chunk in parallel
        const promises = chunk.map(async (track) => {
          setCurrentTrack(track.title)

          // Update status to analyzing
          await supabase
            .from('music_library')
            .update({ analysis_status: 'analyzing' })
            .eq('id', track.id)

          // Perform analysis
          const result = await analyzeAudioFile(track.file_url, (trackProgress) => {
            // Individual track progress (not displayed for simplicity)
          })

          // Update database with results
          if (result.analysisStatus === 'complete') {
            await supabase
              .from('music_library')
              .update({
                bpm: result.bpm,
                musical_key: result.musicalKey,
                analysis_status: 'complete',
                analysis_date: new Date().toISOString()
              })
              .eq('id', track.id)
            return true
          } else {
            await supabase
              .from('music_library')
              .update({ analysis_status: 'failed' })
              .eq('id', track.id)
            return false
          }
        })

        const chunkResults = await Promise.all(promises)
        successCount += chunkResults.filter(Boolean).length
        failedCount += chunkResults.filter((r) => !r).length

        setProgress({ current: i + chunk.length, total: tracks.length })
        setResults({ success: successCount, failed: failedCount })
      }

      setCurrentTrack(null)
      await fetchPendingCount()
      if (onAnalysisComplete) onAnalysisComplete()

      alert(
        `Analysis complete!\n\nSuccessful: ${successCount}\nFailed: ${failedCount}`
      )
    } catch (error) {
      console.error('Batch analysis failed:', error)
      alert('Batch analysis failed. Check console for details.')
    } finally {
      setAnalyzing(false)
      setCurrentTrack(null)
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-neutral-100">Track Analysis</h3>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-neutral-300">
          Automatically detect BPM, musical key, and energy level using Essentia.js
        </div>

        {pendingCount > 0 && !analyzing && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2 text-sm text-yellow-400">
            {pendingCount} track{pendingCount !== 1 ? 's' : ''} pending analysis
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="re-analyze"
            checked={reAnalyze}
            onChange={(e) => setReAnalyze(e.target.checked)}
            disabled={analyzing}
            className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          <label htmlFor="re-analyze" className="text-sm text-neutral-400">
            Re-analyze completed tracks
          </label>
        </div>

        {analyzing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-300">
                Analyzing {progress.current} of {progress.total} tracks...
              </span>
              <span className="text-neutral-400">
                {progress.total > 0
                  ? Math.round((progress.current / progress.total) * 100)
                  : 0}%
              </span>
            </div>

            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                }}
              />
            </div>

            {currentTrack && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="truncate">{currentTrack}</span>
              </div>
            )}

            {results.success > 0 || results.failed > 0 ? (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{results.success} success</span>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{results.failed} failed</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <button
          onClick={handleAnalyzeAll}
          disabled={analyzing}
          className="w-full px-4 py-2.5 bg-purple-600 rounded hover:bg-purple-700 text-neutral-100 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              <span>Analyze All Tracks</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
