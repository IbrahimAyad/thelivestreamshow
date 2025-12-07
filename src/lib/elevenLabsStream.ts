/**
 * ElevenLabs Streaming TTS
 * Low-latency audio streaming for live voice responses
 */

const ELEVENLABS_API_KEY = 'sk_9446a36f0833f85e429ae212ff70f3af4095ce86f113a267'
const VOICE_ID = 'DTKMou8ccj1ZaWGBiotd' // Jamahal - Professional male voice

export interface StreamTTSOptions {
  text: string
  voiceId?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

/**
 * Speak text using ElevenLabs streaming API
 * Ultra-low latency for live broadcasts
 */
export async function speakLiveStream(options: StreamTTSOptions): Promise<HTMLAudioElement | null> {
  const {
    text,
    voiceId = VOICE_ID,
    onStart,
    onEnd,
    onError
  } = options

  try {
    console.log('🎤 [ElevenLabs Stream] Starting TTS...')
    console.log(`📝 Text length: ${text.length} chars`)
    console.log(`🎙️ Voice ID: ${voiceId}`)
    console.log(`📄 Text preview: "${text.substring(0, 100)}..."`)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5', // Fastest model for streaming
          optimize_streaming_latency: 4, // Max optimization (0-4)
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs stream error: ${response.status} - ${response.statusText}`)
    }

    console.log('✅ [ElevenLabs Stream] Response received, creating audio...')

    // Convert stream to playable audio
    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    // Callbacks
    audio.onloadeddata = () => {
      console.log('🔊 [ElevenLabs Stream] Audio loaded, starting playback')
      if (onStart) onStart()
    }

    audio.onended = () => {
      console.log('✅ [ElevenLabs Stream] Playback finished')
      URL.revokeObjectURL(audioUrl) // Clean up memory
      if (onEnd) onEnd()
    }

    audio.onerror = (error) => {
      console.error('❌ [ElevenLabs Stream] Playback error:', error)
      URL.revokeObjectURL(audioUrl)
      if (onError) onError(new Error('Audio playback failed'))
    }

    // Start playing immediately
    await audio.play()
    console.log('▶️ [ElevenLabs Stream] Playback started')

    return audio

  } catch (error) {
    console.error('❌ [ElevenLabs Stream] Error:', error)
    if (onError) onError(error as Error)
    return null
  }
}

/**
 * Stop currently playing audio
 */
export function stopAudio(audio: HTMLAudioElement | null) {
  if (audio) {
    audio.pause()
    audio.currentTime = 0
    console.log('⏹️ [ElevenLabs Stream] Audio stopped')
  }
}

/**
 * Speak Perplexity answer with streaming TTS
 */
export async function speakPerplexityAnswer(answer: string): Promise<HTMLAudioElement | null> {
  return speakLiveStream({
    text: answer,
    onStart: () => {
      console.log('🎙️ Speaking Perplexity answer')
    },
    onEnd: () => {
      console.log('✅ Finished speaking answer')
    },
    onError: (error) => {
      console.error('❌ TTS error:', error)
    }
  })
}

/**
 * Speak video search result
 */
export async function speakVideoResults(query: string, count: number): Promise<HTMLAudioElement | null> {
  const text = `I found ${count} videos about ${query}. Here are the top results.`
  return speakLiveStream({
    text,
    onStart: () => console.log('🎙️ Speaking video results'),
    onEnd: () => console.log('✅ Finished speaking results')
  })
}

/**
 * Speak image search result
 */
export async function speakImageResults(query: string, count: number): Promise<HTMLAudioElement | null> {
  const text = `I found ${count} images about ${query}. Displaying them now.`
  return speakLiveStream({
    text,
    onStart: () => console.log('🎙️ Speaking image results'),
    onEnd: () => console.log('✅ Finished speaking results')
  })
}
