// AI Director API: Trigger a specific sound/jingle by friendly_name
// Returns track information for playback

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { friendly_name, category } = await req.json();

    if (!friendly_name) {
      throw new Error('friendly_name is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Build query with optional category filter
    let query = `${supabaseUrl}/rest/v1/music_library?friendly_name=eq.${encodeURIComponent(friendly_name)}`;
    
    if (category) {
      query += `&category=eq.${encodeURIComponent(category)}`;
    }

    query += '&select=*';

    // Fetch the track by friendly_name
    const trackResponse = await fetch(query, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!trackResponse.ok) {
      throw new Error('Failed to fetch track');
    }

    const tracks = await trackResponse.json();

    if (!tracks || tracks.length === 0) {
      throw new Error(`Track with friendly_name "${friendly_name}" not found`);
    }

    const track = tracks[0];

    return new Response(
      JSON.stringify({
        status: 'success',
        message: `Sound "${track.title}" ready to play`,
        track_info: {
          id: track.id,
          title: track.title,
          artist: track.artist,
          file_path: track.file_path,
          friendly_name: track.friendly_name,
          category: track.category,
          duration: track.duration,
          bpm: track.bpm,
          musical_key: track.musical_key,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('trigger-sound error:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        track_info: null,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
