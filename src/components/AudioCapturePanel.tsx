import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Mic, MicOff, Radio, Loader2 } from 'lucide-react'

interface Session {
  id: string
  session_name: string
  is_active: boolean
}

interface Transcript {
  id: string
  transcript_text: string
  created_at: string
}

export function AudioCapturePanel() {
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [latestTranscript, setLatestTranscript] = useState('')
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [recentTranscripts, setRecentTranscripts] = useState<Transcript[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Subscribe to transcripts for real-time updates
    const channel = supabase
      .channel('betabot_transcripts_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'betabot_transcripts'
      }, (payload) => {
        const newTranscript = payload.new as Transcript
        setLatestTranscript(newTranscript.transcript_text)
        setRecentTranscripts(prev => [newTranscript, ...prev].slice(0, 3))
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const startListening = async () => {
    try {
      setStatus('processing')
      
      // Request audio capture (desktop audio or microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      
      streamRef.current = stream

      // Create a new session
      const { data: session, error: sessionError } = await supabase
        .from('betabot_sessions')
        .insert({
          session_name: `Session ${new Date().toLocaleString()}`,
          is_active: true
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      setCurrentSession(session)

      // Set up MediaRecorder to capture audio in chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Send audio chunks to edge function every 5 seconds
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          await processAudioChunk(session.id)
        }
      }

      // Start recording and set interval to process chunks
      mediaRecorder.start()
      setIsListening(true)
      setStatus('listening')

      // Process audio every 5 seconds
      const processingInterval = setInterval(async () => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          await new Promise(resolve => setTimeout(resolve, 100))
          audioChunksRef.current = []
          if (streamRef.current) {
            mediaRecorder.start()
          }
        }
      }, 5000)

      // Store interval ID for cleanup
      ;(mediaRecorder as any).processingInterval = processingInterval

    } catch (error) {
      console.error('Error starting audio capture:', error)
      alert('Failed to start audio capture. Please ensure microphone permissions are granted.')
      setStatus('idle')
    }
  }

  const stopListening = async () => {
    if (mediaRecorderRef.current) {
      // Clear processing interval
      if ((mediaRecorderRef.current as any).processingInterval) {
        clearInterval((mediaRecorderRef.current as any).processingInterval)
      }
      
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (currentSession) {
      await supabase
        .from('betabot_sessions')
        .update({ 
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', currentSession.id)
    }

    setIsListening(false)
    setStatus('idle')
    setCurrentSession(null)
    mediaRecorderRef.current = null
  }

  const processAudioChunk = async (sessionId: string) => {
    if (audioChunksRef.current.length === 0) return

    try {
      setStatus('processing')
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      // Convert to base64
      const reader = new FileReader()
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(audioBlob)
      })

      // Call audio-processor edge function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-processor`
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          audioData: base64Audio,
          sessionId: sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Audio processing failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        console.error('Audio processing error:', result.error)
      }

      setStatus('listening')

    } catch (error) {
      console.error('Error processing audio chunk:', error)
      setStatus('listening')
    }
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Radio className="w-7 h-7 text-green-400" />
        AI Audio Capture
      </h2>

      {/* Status and Control */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'listening' ? 'bg-green-400 animate-pulse' :
              status === 'processing' ? 'bg-yellow-400 animate-pulse' :
              'bg-gray-600'
            }`} />
            <span className="text-sm font-semibold text-gray-300">
              {status === 'listening' ? 'Listening...' :
               status === 'processing' ? 'Processing...' :
               'Idle'}
            </span>
          </div>
          
          {currentSession && (
            <span className="text-xs text-gray-500">
              Session: {currentSession.session_name}
            </span>
          )}
        </div>

        <button
          onClick={isListening ? stopListening : startListening}
          disabled={status === 'processing'}
          className={`w-full px-6 py-3 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:bg-gray-700 disabled:cursor-not-allowed`}
        >
          {status === 'processing' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Listening
            </>
          )}
        </button>
      </div>

      {/* Latest Transcript Display */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Latest Transcript (Last 30s)</h3>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 min-h-24 max-h-48 overflow-y-auto">
          {latestTranscript ? (
            <p className="text-white text-sm leading-relaxed">{latestTranscript}</p>
          ) : (
            <p className="text-gray-500 text-sm italic">No transcripts yet...</p>
          )}
        </div>
      </div>

      {/* Recent Transcripts */}
      {recentTranscripts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Transcripts</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentTranscripts.map((transcript) => (
              <div key={transcript.id} className="bg-gray-900 border border-gray-700 rounded p-2">
                <p className="text-white text-xs line-clamp-2">{transcript.transcript_text}</p>
                <span className="text-xs text-gray-500">
                  {new Date(transcript.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-300">
        <p className="font-semibold">AI Audio Listening</p>
        <p className="text-xs mt-1">Captures and transcribes audio in real-time using Whisper API</p>
      </div>
    </div>
  )
}
