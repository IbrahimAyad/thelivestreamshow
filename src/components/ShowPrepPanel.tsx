import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Lightbulb, Plus, Trash2, Loader2, Copy, Clipboard, Monitor, Zap } from 'lucide-react'

interface ShowQuestion {
  id: string
  topic: string
  question_text: string
  tts_audio_url: string | null
  tts_generated: boolean
  position: number
  show_on_overlay: boolean
  overlay_triggered_at: string | null
}

export function ShowPrepPanel() {
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState<ShowQuestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [lastProcessedTranscriptId, setLastProcessedTranscriptId] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()

    const channel = supabase
      .channel('show_questions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_questions'
      }, () => {
        loadQuestions()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Auto-generate questions from transcripts
  useEffect(() => {
    if (!autoGenerate) return

    const transcriptChannel = supabase
      .channel('betabot_transcripts_auto_generate')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'betabot_transcripts'
      }, async (payload) => {
        const transcript = payload.new as any
        
        // Avoid processing the same transcript twice
        if (transcript.id === lastProcessedTranscriptId) return
        setLastProcessedTranscriptId(transcript.id)
        
        // Auto-generate questions from transcript
        if (transcript.transcript_text && transcript.transcript_text.length > 50) {
          await generateQuestionsFromTranscript(transcript.transcript_text, transcript.session_id)
        }
      })
      .subscribe()

    return () => {
      transcriptChannel.unsubscribe()
    }
  }, [autoGenerate, lastProcessedTranscriptId])

  const loadQuestions = async () => {
    const { data } = await supabase
      .from('show_questions')
      .select('*')
      .order('position', { ascending: true })
    
    if (data) setQuestions(data as ShowQuestion[])
  }

  const generateQuestions = async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-questions`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedQuestions = data.questions || [];

      if (!generatedQuestions || generatedQuestions.length === 0) {
        alert('No questions generated. Please try a different topic.');
        return;
      }

      // Insert questions into database
      const questionsToInsert = generatedQuestions.map((q: string, index: number) => ({
        topic,
        question_text: q,
        position: questions.length + index,
        tts_generated: false,
        tts_audio_url: null
      }));

      const { error } = await supabase
        .from('show_questions')
        .insert(questionsToInsert);

      if (error) throw error;

      // Clear topic after successful generation
      setTopic('');
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  const generateQuestionsFromTranscript = async (transcriptText: string, sessionId: string) => {
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/question-generator`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          transcript: transcriptText,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        console.error('Question generation from transcript failed:', response.status);
        return;
      }

      const data = await response.json();
      const generatedQuestions = data.questions || [];

      if (generatedQuestions.length === 0) return;

      // Insert questions into database (they'll appear in the TTS queue automatically)
      const questionsToInsert = generatedQuestions.map((q: string, index: number) => ({
        topic: 'Auto-generated from stream',
        question_text: q,
        position: questions.length + index,
        tts_generated: false,
        tts_audio_url: null
      }));

      await supabase
        .from('show_questions')
        .insert(questionsToInsert);

    } catch (error) {
      console.error('Error generating questions from transcript:', error);
    }
  }

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase
      .from('show_questions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question.');
    }
  }

  const deleteAllQuestions = async () => {
    if (!confirm(`Delete all ${questions.length} questions?`)) return;
    
    const { error } = await supabase
      .from('show_questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error('Error deleting questions:', error);
      alert('Failed to delete questions.');
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Brief visual feedback could be added here
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  const updateQuestion = async (id: string, newText: string) => {
    await supabase
      .from('show_questions')
      .update({ 
        question_text: newText,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  }

  const sendToOverlay = async (id: string) => {
    try {
      // First, clear any previously shown questions
      await supabase
        .from('show_questions')
        .update({ show_on_overlay: false })
        .eq('show_on_overlay', true)

      // Then set this question to show on overlay
      const { error } = await supabase
        .from('show_questions')
        .update({ 
          show_on_overlay: true,
          overlay_triggered_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      // Visual feedback
      console.log('Question sent to overlay')
    } catch (error) {
      console.error('Error sending question to overlay:', error)
      alert('Failed to send question to overlay')
    }
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Lightbulb className="w-7 h-7 text-purple-400" />
        Show Prep: AI Question Generator
      </h2>

      {/* Auto-Generate Toggle */}
      <div className="mb-4 p-3 bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${autoGenerate ? 'text-orange-400' : 'text-gray-500'}`} />
            <span className="text-white font-semibold">Auto-Generate from Stream</span>
          </div>
          <button
            onClick={() => setAutoGenerate(!autoGenerate)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoGenerate ? 'bg-orange-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoGenerate ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {autoGenerate 
            ? 'AI will automatically generate questions from live transcripts'
            : 'Enable to auto-generate questions from audio capture'}
        </p>
      </div>

      {/* Topic Input */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-semibold mb-2">
          Show Topic/Theme
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-gray-900 border-2 border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-400 transition-colors"
            placeholder="e.g., The Nature of Authority, Modern Relationships, Social Media..."
          />
          <button
            onClick={generateQuestions}
            disabled={!topic.trim() || isGenerating}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Generate Questions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Question Counter and Bulk Actions */}
      {questions.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-400 font-semibold">
            {questions.length} question{questions.length !== 1 ? 's' : ''} generated
          </span>
          <button
            onClick={deleteAllQuestions}
            className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-semibold rounded transition-colors"
          >
            Delete All
          </button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions yet. Enter a topic and generate some questions!</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div
              key={q.id}
              className="p-3 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-bold text-lg min-w-8">{index + 1}.</span>
                <textarea
                  value={q.question_text}
                  onChange={(e) => updateQuestion(q.id, e.target.value)}
                  className="flex-1 bg-transparent border-none text-white resize-none focus:outline-none"
                  rows={2}
                />
                <button
                  onClick={() => sendToOverlay(q.id)}
                  className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
                  title="Send to overlay"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyToClipboard(q.question_text)}
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded text-sm text-purple-300">
        <p className="font-semibold">AI-Generated Questions</p>
        <p className="text-xs mt-1">Questions match your show's intellectual, philosophical style</p>
      </div>
    </div>
  )
}
