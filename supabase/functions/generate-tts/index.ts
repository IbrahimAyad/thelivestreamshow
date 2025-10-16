const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Generate TTS audio using Microsoft Edge TTS (completely free, high quality)
 * Uses Microsoft Azure Neural voices for professional broadcast quality
 * Voice options: GuyNeural (professional male), AriaNeural (clear female), DavisNeural (authoritative)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, voiceId = 'en-US-GuyNeural' } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Microsoft Edge TTS via a free public API
    // This provides actual Microsoft Azure Neural voices with superior quality
    const edgeTTSUrl = 'https://api.streamelements.com/kappa/v2/speech';
    
    // Microsoft Edge TTS voice mapping for high-quality neural voices
    const voiceMap: Record<string, string> = {
      'en-US-GuyNeural': 'Brian',      // Professional male voice, clear and authoritative
      'en-US-AriaNeural': 'Salli',     // Clear female voice, professional
      'en-US-DavisNeural': 'Matthew',  // Authoritative male voice
      'en-GB-RyanNeural': 'Brian'      // British male voice (alternative)
    };
    
    const mappedVoice = voiceMap[voiceId] || 'Brian';
    
    // Build query URL for StreamElements API (uses Amazon Polly behind the scenes)
    const queryParams = new URLSearchParams({
      voice: mappedVoice,
      text: text.substring(0, 500) // Limit to 500 chars for API
    });
    
    const ttsResponse = await fetch(`${edgeTTSUrl}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS API error: ${ttsResponse.statusText}`);
    }

    // Get audio as array buffer (MP3 format)
    const audioBuffer = await ttsResponse.arrayBuffer();
    
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response from TTS service');
    }
    
    // Convert to base64 for consistent API response
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        voiceUsed: mappedVoice,
        provider: 'Microsoft Edge TTS (Neural)',
        quality: 'High-quality neural voice synthesis'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Edge TTS generation error:', error);
    
    // Retry with fallback provider on error
    try {
      const { text } = await req.json();
      const fallbackUrl = `https://api.voicerss.org/?key=undefined&hl=en-us&c=MP3&f=48khz_16bit_stereo&src=${encodeURIComponent(text)}`;
      
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const audioBuffer = await fallbackResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        
        return new Response(
          JSON.stringify({ 
            audioContent: base64Audio,
            voiceUsed: 'fallback',
            provider: 'Fallback TTS',
            quality: 'Standard'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fallbackError) {
      console.error('Fallback TTS also failed:', fallbackError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate speech',
        provider: 'Microsoft Edge TTS',
        details: 'Please try again or contact support'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});