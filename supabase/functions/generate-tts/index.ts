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

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ElevenLabs API Configuration
    const ELEVENLABS_API_KEY = 'sk_9446a36f0833f85e429ae212ff70f3af4095ce86f113a267';
    const ELEVENLABS_VOICE_ID = voiceId;

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
      throw new Error(`ElevenLabs API error: ${ttsResponse.status} - ${errorText}`);
    }

    // Get audio as array buffer (MP3 format)
    const audioBuffer = await ttsResponse.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response from ElevenLabs');
    }

    // Convert to base64 for consistent API response
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

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

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate speech',
        provider: 'ElevenLabs',
        details: 'Please check API key and voice ID'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});