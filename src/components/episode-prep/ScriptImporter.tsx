import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { parseScript } from '../../lib/api/scriptParser'
import { Upload, FileText, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'

interface ScriptImporterProps {
  episodeId: string
  onScriptParsed: () => void
}

export function ScriptImporter({ episodeId, onScriptParsed }: ScriptImporterProps) {
  const [scriptText, setScriptText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleImportScript = async () => {
    if (!scriptText.trim()) {
      setError('Please paste a script first')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('📝 Importing script for episode:', episodeId)

      // Step 1: Save raw script to database
      const { data: scriptData, error: scriptError } = await supabase
        .from('episode_scripts')
        .insert({
          episode_info_id: episodeId,
          script_raw: scriptText,
          parse_status: 'pending'
        })
        .select()
        .single()

      if (scriptError) throw scriptError

      console.log('✅ Script saved:', scriptData.id)

      // Step 2: Parse script with AI
      console.log('🤖 Parsing script with Perplexity AI...')

      const { error: updateError1 } = await supabase
        .from('episode_scripts')
        .update({ parse_status: 'parsing' })
        .eq('id', scriptData.id)

      const parsedSegments = await parseScript(scriptText)

      console.log('✅ Script parsed:', parsedSegments.length, 'segments detected')

      // Step 3: Save parsed data
      const { error: updateError2 } = await supabase
        .from('episode_scripts')
        .update({
          script_parsed: parsedSegments,
          parse_status: 'completed'
        })
        .eq('id', scriptData.id)

      if (updateError2) throw updateError2

      // Step 4: Create segment records
      const segmentRecords = parsedSegments.map((segment: any, index: number) => ({
        episode_info_id: episodeId,
        script_id: scriptData.id,
        segment_number: index + 1,
        segment_type: segment.type || 'custom',
        title: segment.title,
        original_content: segment.content,
        planned_duration_seconds: segment.estimatedDuration || null
      }))

      const { error: segmentsError } = await supabase
        .from('episode_segments')
        .insert(segmentRecords)

      if (segmentsError) throw segmentsError

      // Step 5: Update prep progress
      const { error: progressError } = await supabase
        .from('episode_prep_progress')
        .update({
          total_segments: parsedSegments.length,
          prep_status: 'script_imported',
          script_imported_at: new Date().toISOString()
        })
        .eq('episode_info_id', episodeId)

      if (progressError) throw progressError

      setSuccess(`Script imported successfully! ${parsedSegments.length} segments detected.`)
      setScriptText('') // Clear textarea

      // Trigger callback to switch to segments tab
      setTimeout(() => {
        onScriptParsed()
      }, 1500)

    } catch (err: any) {
      console.error('❌ Error importing script:', err)
      setError(err.message || 'Failed to import script')

      // Update script status to failed
      await supabase
        .from('episode_scripts')
        .update({
          parse_status: 'failed',
          parse_error: err.message
        })
        .eq('episode_info_id', episodeId)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
          <FileText className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Import Show Script</h3>
          <p className="text-gray-400 text-sm">Paste your full episode script and let AI analyze it</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Paste Full Script
          </label>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            className="w-full h-96 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none font-mono text-sm"
            placeholder={`Paste your full episode script here...

Example:
MONDAY MORNING SHOW — FULL SCRIPT

TITLE:
"DEALS & REALITY: Understanding Opportunity"

⭐ SEGMENT 1 — TRENDING NEWS

🔥 NEWS STORY 1: CNN x Kalshi Partnership
HOST: "Let's start here: CNN just partnered with Kalshi..."

...etc`}
            disabled={isProcessing}
          />
          <p className="text-gray-500 text-xs mt-2">
            {scriptText.length.toLocaleString()} characters · {scriptText.split(/\n\n+/).length} paragraphs
          </p>
        </div>

        <button
          onClick={handleImportScript}
          disabled={isProcessing || !scriptText.trim()}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Parsing Script with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Parse & Generate AI Content
            </>
          )}
        </button>

        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            What AI Will Do:
          </h4>
          <ul className="space-y-1 text-sm text-blue-200/80">
            <li>• Detect segments automatically (Intro, News, Real Estate, etc.)</li>
            <li>• Extract news topics for research</li>
            <li>• Identify clip lines (quotable moments)</li>
            <li>• Estimate segment durations</li>
            <li>• Generate listener questions for each topic</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
