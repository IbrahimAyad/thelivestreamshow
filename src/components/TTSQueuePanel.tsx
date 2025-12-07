import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Mic, Play, Loader2, Volume2 } from 'lucide-react'

interface ShowQuestion {
  id: string
  question_text: string
  tts_audio_url: string | null
  tts_generated: boolean
  is_played: boolean
}

export function TTSQueuePanel() {
  const [questions, setQuestions] = useState<ShowQuestion[]>([])
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()

    const channel = supabase
      .channel('tts_questions_changes')
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

  const loadQuestions = async () => {
    const { data } = await supabase
      .from('show_questions')
      .select('*')
      .order('position', { ascending: true })
    
    if (data) setQuestions(data as ShowQuestion[])
  }

  const generateTTS = async (questionId: string, text: string) => {
    setGeneratingId(questionId)
    try {
      // Call TTS Edge Function (Amazon Polly via free API - unlimited)
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-tts`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          text: text,
          voiceId: 'en-US-GuyNeural' // Maps to Matthew: Professional male voice, clear and authoritative
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.audioContent) {
        throw new Error('No audio content received from TTS service');
      }

      // Convert base64 to blob and upload to Supabase Storage
      const audioBlob = base64ToBlob(result.audioContent, 'audio/mpeg');
      const fileName = `betabot-${questionId}-${Date.now()}.mp3`;
      
      const { error: uploadError } = await supabase.storage
        .from('tts-audio')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tts-audio')
        .getPublicUrl(fileName);

      // Update database with audio URL
      const { error: dbError } = await supabase
        .from('show_questions')
        .update({ 
          tts_generated: true,
          tts_audio_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId);

      if (dbError) {
        throw new Error(`Database update failed: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Error generating TTS:', error);
      alert(`Failed to generate BetaBot voice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Mark as failed (don't set tts_generated to true on error)
      await supabase
        .from('show_questions')
        .update({ 
          tts_generated: false,
          tts_audio_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId);
    } finally {
      setGeneratingId(null)
    }
  }

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

  const playLive = async (questionId: string) => {
    setPlayingId(questionId)
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    if (!question.tts_audio_url) {
      alert('Please generate voice first before playing live.');
      setPlayingId(null);
      return;
    }

    // Mark as playing in database (triggers broadcast overlay via show_on_overlay)
    await supabase
      .from('show_questions')
      .update({
        is_played: true,
        show_on_overlay: true,  // This triggers BetaBotPopupEnhanced on broadcast view
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId);

    // Play audio locally for preview (Amazon Polly quality)
    const audio = new Audio(question.tts_audio_url);
    audio.volume = 0.6; // Lower volume for preview
    audio.play().catch(error => {
      console.error('Audio playback error:', error);
      alert('Failed to play audio. Please check your browser settings.');
    });

    // Reset after 10 seconds (average question read time)
    setTimeout(() => {
      setPlayingId(null)
      supabase
        .from('show_questions')
        .update({ is_played: false })
        .eq('id', questionId)
    }, 10000)
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Mic className="w-7 h-7 text-blue-400" />
        BetaBot TTS Queue
      </h2>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Generate questions first to use TTS</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div
              key={q.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                playingId === q.id
                  ? 'bg-blue-900/30 border-blue-400'
                  : 'bg-gray-900 border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-blue-400 font-bold">{index + 1}.</span>
                <p className="flex-1 text-white text-sm line-clamp-2">{q.question_text}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {!q.tts_generated ? (
                  <button
                    onClick={() => generateTTS(q.id, q.question_text)}
                    disabled={generatingId === q.id}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingId === q.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Generate Voice
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => playLive(q.id)}
                    disabled={playingId !== null}
                    className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      playingId === q.id
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {playingId === q.id ? 'PLAYING LIVE' : 'Play Live'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-300">
        <p className="font-semibold">BetaBot Voice - Microsoft Edge TTS</p>
        <p className="text-xs mt-1">High-quality neural voice synthesis, professional broadcast quality</p>
      </div>
    </div>
  )
}
