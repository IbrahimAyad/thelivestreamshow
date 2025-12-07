const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Generate TTS audio using ElevenLabs API
 * Professional broadcast quality with custom trained voice
 * Voice ID: DTKMou8ccj1ZaWGBiotd (BetaBot custom voice)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, voiceId = 'DTKMou8ccj1ZaWGBiotd' } = await req.json();

    console.log('🎤 TTS Request received:', {
      textLength: text?.length,
      voiceIdReceived: voiceId,
      timestamp: new Date().toISOString()
    });

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IMPORTANT: Only accept ElevenLabs voice IDs
    const ELEVENLABS_API_KEY = 'sk_9446a36f0833f85e429ae212ff70f3af4095ce86f113a267';
    const ELEVENLABS_VOICE_ID = voiceId;

    // Reject Microsoft Azure voice IDs
    if (voiceId.includes('en-US-') || voiceId.includes('Neural')) {
      console.error('❌ REJECTED: Microsoft Azure voice ID sent to ElevenLabs endpoint');
      throw new Error(`Invalid voice ID for ElevenLabs: "${voiceId}". Expected ElevenLabs voice ID like "DTKMou8ccj1ZaWGBiotd"`);
    }

    console.log('✅ Using ElevenLabs voice ID:', ELEVENLABS_VOICE_ID);

    // ElevenLabs Text-to-Speech API endpoint
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

    const ttsResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('ElevenLabs API Error:', {
        status: ttsResponse.status,
        error: errorText,
        text: text,
        voiceId: ELEVENLABS_VOICE_ID
      });
      throw new Error(`ElevenLabs API error: ${ttsResponse.status} - ${errorText}`);
    }

    // Get audio as array buffer (MP3 format)
    const audioBuffer = await ttsResponse.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response from ElevenLabs');
    }

    // Convert to base64 efficiently (avoid stack overflow with large files)
    const bytes = new Uint8Array(audioBuffer);
    let binary = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    const base64Audio = btoa(binary);

    return new Response(
      JSON.stringify({
        audioContent: base64Audio,
        voiceUsed: ELEVENLABS_VOICE_ID,
        provider: 'ElevenLabs',
        quality: 'Professional broadcast quality - Custom BetaBot voice'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('ElevenLabs TTS generation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate speech',
        provider: 'ElevenLabs',
        details: 'Please check API key and voice ID',
        errorType: error.name,
        fullError: String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});